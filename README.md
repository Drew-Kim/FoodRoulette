# Food Roulette

Food Roulette is a React, Node.js, and MongoDB web app that uses the Yelp API to help users discover nearby restaurants and randomly choose where to eat with a fun roulette style picker.

## Project Structure

- "client/" - React webpage
- "server/" - Node.js API server
- ".env.example" - environment variables

The backend uses Express for the Node.js API routes.

## Getting Started

Install dependencies:

```bash
npm run install:all
```

Create a local environment file for private values:

```bash
cp .env.example .env
```

Then update `.env` with your real MongoDB connection string and API keys. Do not commit .env.

Start the client and server:

```bash
npm run dev
```

Open the React app:

```text
http://localhost:5173
```

The Node API runs at:

```text
http://localhost:5000
```
