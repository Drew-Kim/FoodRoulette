# Food Roulette

Food Roulette is a React, Node.js, and MongoDB web app that uses the Yelp API to help users discover nearby restaurants and randomly choose where to eat with a fun roulette style picker.

## Project Structure

- "client/" - React webpage
- "server/" - Node.js API server
- ".env" - environment variables place in the server folder

The project will utilize MongoDB for the database, React will be used for the frontend webpage, Node.js will run the backend server, and Express will help Node.js create backend API routes.

## Dependencies

Client:

- react - builds the webpage user interface.
- react-dom - connects React to the browser page.
- vite - runs the local React dev server and builds the client for deployment.
- @vitejs/plugin-react - helps Vite work with React.

Server:

- express - creates the backend API routes.
- cors - allows the React client to call the backend API.
- dotenv - loads private values from `server/.env`.
- mongoose - connects the server to MongoDB.
- nodemon - restarts the server during development when files change.

## Getting Started

Install dependencies:

```bash
npm run install:all
```

Create a local environment file for private values:

```bash
cp .env.example server/.env
```

Then update `server/.env` with your real MongoDB connection string and API keys. Do not commit `.env`.

Start the client and server:

```bash
npm run dev
```

Open the React app:

```text
http://localhost:5173
```

Open the admin entry:

```text
http://localhost:5173/admin/
```

The Node API runs at:

```text
http://localhost:5000
```

## Deployment

Use Spaceship for the domain, Vercel for the React client, Render for the Node API, and MongoDB Atlas for the database.

Deploy the backend on Render:

```text
Root directory: server
Build command: npm install
Start command: npm start
```

Set these Render environment variables:

```text
MONGO_URI=your_real_mongodb_connection_string
YELP_API_KEY=your_real_yelp_api_key
CLIENT_URL=https://foodroulette.cc
```

Deploy the frontend on Vercel:

```text
Root directory: client
Build command: npm run build
Output directory: dist
```

Set this Vercel environment variable:

```text
VITE_API_URL=https://your-render-backend-url.onrender.com
```

Then add these domains in Vercel:

```text
foodroulette.cc
www.foodroulette.cc
```

Use the DNS records Vercel gives you inside Spaceship DNS.
