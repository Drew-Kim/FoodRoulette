import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import authRouter from '../routes/auth.js';

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

const feedbackSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['bug', 'feedback'],
      required: true
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxLength: 120
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxLength: 2000
    },
    email: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['new', 'reviewed', 'resolved'],
      default: 'new'
    }
  },
  { timestamps: true }
);

const feedbackForm = mongoose.model('feedbackForm', feedbackSchema)

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
app.use('/api/auth', authRouter);

function requireAdmin(request, response, next) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return response.status(401).json({ message: 'Admin login is required.' });
  }

  if (!process.env.JWT_SECRET) {
    return response.status(500).json({ message: 'JWT_SECRET is not configured.' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);

    if (user.role !== 'admin') {
      return response.status(403).json({ message: 'Admin access is required.' });
    }

    request.user = user;
    return next();
  } catch (error) {
    return response.status(401).json({ message: 'Admin login is invalid or expired.' });
  }
}

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

app.post('/api/feedback', async (req, res) => {
  const { type, subject, message, email } = req.body;

  if (!type || !['bug', 'feedback'].includes(type)) {
    return res.status(400).json({ message: 'Type must be either "bug" or "feedback".'});
  }
  if (!subject?.trim()) {
    return res.status(400).json({ message: 'Subject is required.'});
  }
  if (!message?.trim()) {
    return res.status(400).json({ message: 'Message is required.'});
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database is not connected. Cannot save feedback.' });
  }

  try {
    const entry = await feedbackForm.create({
      type,
      subject: subject.trim(),
      message: message.trim(),
      email: email?.trim() || ''
    });
    return res.status(201).json({ message: 'Thank you! Your feedback is important to us.!', id: entry._id });
  } catch (error) {
    return res.status(500).json({ message: 'Could not save your feedback at the moment. Please try again shortly.'});
  }
});

app.get('/api/admin/feedback', requireAdmin, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database is not connected. '});
  }

  try {
    const entries = await feedbackForm.find().sort({ createdAt: -1 }).lean();
    return res.json({ entries });
  } catch (error) {
    return res.status(500).json({ message: 'Could not fetch feedback entries.' });
  }
});

app.patch('/api/admin/feedback/:id', requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!status || !['new', 'reviewed', 'resolved'].includes(status)) {
    return res.status(400).json({ message: 'Status must be "new", "reviewed", or "resolved".' });
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database is not connected.' });
  }

  try {
    const entry = await feedbackForm.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!entry) {
      return res.status(404).json({ message: 'Specified feedback form not found.' });
    }
    return res.json({ message: 'Status updated.', entry });
  } catch (error) {
    return res.status(500).json({ message: 'Could not update feedback.' });
  }
});
