import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin: clientUrl }));
app.use(express.json());

async function connectToDatabase() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri || mongoUri.includes('your_mongodb_connection_string_here')) {
    console.log('MongoDB connection skipped. Add MONGO_URI to a local .env file.');
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
  } catch (error) {
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

  response.json({
    status: isConnected ? 'connected' : 'not connected',
    message: isConnected
      ? 'MongoDB is connected'
      : 'MongoDB is not connected yet. Add a real MONGO_URI in .env.'
  });
});

app.listen(port, async () => {
  await connectToDatabase();
  console.log(`Food Roulette API running on http://localhost:${port}`);
});
