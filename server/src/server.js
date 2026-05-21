import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(currentDirectory, '..', '.env') });

const app = express();
const port = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const yelpApiUrl = 'https://api.yelp.com/v3/businesses/search';
const maxYelpLimit = 50;
const distanceFilters = {
  blocks: { label: 'Within 4 blocks', radius: 650 },
  walking: { label: 'Walking', radius: 1609 },
  biking: { label: 'Biking', radius: 3219 },
  driving: { label: 'Driving', radius: 8047 },
  birdsEye: { label: "Bird's-eye View", radius: 16093 }
};
const allowedOrigins = new Set([
  clientUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
]);
let databaseConnectionError = '';

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  }
}));
app.use(express.json());

function getYelpPriceValue(price) {
  const priceMap = {
    '$': '1',
    '$$': '2',
    '$$$': '3',
    '$$$$': '4'
  };

  return priceMap[price];
}

function getRestaurantLimit(count) {
  const requestedCount = Number.parseInt(count, 10);

  if (Number.isNaN(requestedCount)) {
    return 12;
  }

  return Math.min(Math.max(requestedCount, 2), 20);
}

function getDistanceFilter(value, radiusMiles) {
  if (distanceFilters[value]) {
    return distanceFilters[value];
  }

  const miles = Number.parseInt(radiusMiles, 10);

  if (Number.isNaN(miles)) {
    return null;
  }

  if (miles === 1) {
    return distanceFilters.blocks;
  }

  if (miles === 2) {
    return distanceFilters.walking;
  }

  if (miles === 3) {
    return distanceFilters.biking;
  }

  if (miles === 4) {
    return distanceFilters.driving;
  }

  return distanceFilters.birdsEye;
}

function getMiles(meters) {
  return Number((meters / 1609.34).toFixed(1));
}

function getCoordinate(value, min, max) {
  const coordinate = Number.parseFloat(value);

  if (Number.isNaN(coordinate) || coordinate < min || coordinate > max) {
    return null;
  }

  return coordinate;
}

function getCoordinatesFromLocation(location) {
  const [latitudeValue, longitudeValue] = location?.split(',').map((part) => part.trim()) || [];

  return {
    latitude: getCoordinate(latitudeValue, -90, 90),
    longitude: getCoordinate(longitudeValue, -180, 180)
  };
}

async function connectToDatabase() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri || mongoUri.includes('your_mongodb_connection_string_here')) {
    console.log('MongoDB connection skipped. Add MONGO_URI to a local .env file.');
    return;
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    databaseConnectionError = '';
    console.log('MongoDB connected');
  } catch (error) {
    databaseConnectionError = error.message;
    console.error('MongoDB connection error:', error.message);
  }
}

app.get('/api/health', (request, response) => {
  response.json({
    status: 'ok',
    message: 'Node server is running'
  });
});

app.get('/api/db-status', (request, response) => {
  const isConnected = mongoose.connection.readyState === 1;
  const connectionState = mongoose.STATES[mongoose.connection.readyState] || 'unknown';

  response.json({
    status: isConnected ? 'connected' : 'not connected',
    connectionState,
    message: isConnected
      ? 'MongoDB is connected'
      : databaseConnectionError || 'MongoDB is not connected yet. Add a real MONGO_URI in .env.'
  });
});

app.get('/api/restaurants', async (request, response) => {
  const yelpApiKey = process.env.YELP_API_KEY;
  const location = request.query.location?.trim();
  const locationCoordinates = getCoordinatesFromLocation(location);
  const latitude = getCoordinate(request.query.latitude, -90, 90) ?? locationCoordinates.latitude;
  const longitude = getCoordinate(request.query.longitude, -180, 180) ?? locationCoordinates.longitude;
  const hasCoordinates = latitude !== null && longitude !== null;
  const cuisine = request.query.cuisine?.trim();
  const price = getYelpPriceValue(request.query.price);
  const limit = getRestaurantLimit(request.query.count);
  const distanceFilter = getDistanceFilter(request.query.distanceFilter, request.query.radiusMiles);
  const openNow = request.query.openNow === 'true';

  if (!location && !hasCoordinates) {
    return response.status(400).json({
      message: 'Add a location before searching for restaurants.'
    });
  }

  if (location?.toLowerCase() === 'current location' && !hasCoordinates) {
    return response.status(400).json({
      message: 'Click Use My Location again, then search after it finishes.'
    });
  }

  if (!yelpApiKey || yelpApiKey.includes('your_yelp_api_key_here')) {
    return response.status(503).json({
      message: 'Add a real YELP_API_KEY in .env before searching restaurants.'
    });
  }

  const searchParams = new URLSearchParams({
    categories: 'restaurants',
    limit: String(maxYelpLimit),
    sort_by: 'best_match'
  });

  if (distanceFilter) {
    searchParams.set('radius', String(distanceFilter.radius));
  }

  if (hasCoordinates) {
    searchParams.set('latitude', String(latitude));
    searchParams.set('longitude', String(longitude));
  } else {
    searchParams.set('location', location);
  }

  searchParams.set('term', cuisine && cuisine !== 'Any food' ? cuisine : 'restaurants');

  if (price) {
    searchParams.set('price', price);
  }

  if (openNow) {
    searchParams.set('open_now', 'true');
  }

  try {
    const yelpResponse = await fetch(`${yelpApiUrl}?${searchParams}`, {
      headers: {
        Authorization: `Bearer ${yelpApiKey}`,
        Accept: 'application/json'
      }
    });

    const yelpData = await yelpResponse.json();

    if (!yelpResponse.ok) {
      return response.status(yelpResponse.status).json({
        message: yelpData.error?.description || 'Yelp could not complete the restaurant search.'
      });
    }

    const businesses = distanceFilter
      ? (yelpData.businesses || []).filter((business) => (
        typeof business.distance === 'number' && business.distance <= distanceFilter.radius
      ))
      : yelpData.businesses || [];

    const restaurants = businesses
      .slice(0, limit)
      .map((business) => ({
        id: business.id,
        name: business.name,
        imageUrl: business.image_url,
        rating: business.rating,
        price: business.price,
        address: business.location?.display_address?.join(', '),
        distanceMiles: typeof business.distance === 'number' ? getMiles(business.distance) : null,
        yelpUrl: business.url
      }));

    response.json({
      distanceFilter: distanceFilter?.label || 'Off',
      restaurantCount: restaurants.length,
      restaurants
    });
  } catch (error) {
    response.status(500).json({
      message: 'Restaurant search is unavailable right now.'
    });
  }
});

app.listen(port, async () => {
  await connectToDatabase();
  console.log(`Food Roulette API running on http://localhost:${port}`);
});
