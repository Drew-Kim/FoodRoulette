import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import router from '../routes/auth.js';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(currentDirectory, '..', '.env') });

const app = express();
const port = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const yelpApiUrl = 'https://api.yelp.com/v3/businesses/search';
const allowedOrigins = new Set([
  clientUrl,
  'http://localhost:5173',
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

app.use('/api/auth', router);

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
  const cuisine = request.query.cuisine?.trim();
  const price = getYelpPriceValue(request.query.price);
  const limit = getRestaurantLimit(request.query.count);

  if (!location) {
    return response.status(400).json({
      message: 'Add a location before searching for restaurants.'
    });
  }

  if (!yelpApiKey || yelpApiKey.includes('your_yelp_api_key_here')) {
    return response.status(503).json({
      message: 'Add a real YELP_API_KEY in .env before searching restaurants.'
    });
  }

  const searchParams = new URLSearchParams({
    location,
    limit: String(limit),
    sort_by: 'best_match'
  });

  if (cuisine && cuisine !== 'Any food') {
    searchParams.set('term', cuisine);
  }

  if (price) {
    searchParams.set('price', price);
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

    response.json({
      restaurants: (yelpData.businesses || []).map((business) => ({
        id: business.id,
        name: business.name,
        imageUrl: business.image_url,
        rating: business.rating,
        price: business.price,
        address: business.location?.display_address?.join(', '),
        yelpUrl: business.url
      }))
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
