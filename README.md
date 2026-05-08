# Food Roulette

Food Roulette is a React, Node.js, and MongoDB web app that uses the Yelp API to help users discover nearby restaurants and randomly choose where to eat with a fun roulette style picker.

## Project Progress

The application has a React frontend, a Node and Express backend, environment variable examples, and deployment config started for Vercel and Render.

- Created the React and Vite client.
- Created the Node and Express API server.
- Added MongoDB connection setup with local .env support.
- Added backend health and database status on webpage.
- Added a Yelp restaurant search endpoint.
- Built the first Food Roulette search page with location, cuisine, and price filters.
- Added a starter roulette wheel UI and restaurant result cards.
- Added a basic admin route placeholder at /admin/

[www.foodroulette.cc](https://www.foodroulette.cc/)

## Project Structure

- client/ - React webpage
- server/ - Node.js API server
- .env - environment variables place in the server folder

The project will utilize MongoDB for the database, React will be used for the frontend webpage, Node.js will run the backend server, and Express will help Node.js create backend API routes.

## Dependencies

The client uses React and Vite.

- React builds the webpage.
- React DOM displays the React app in the browser.
- Vite runs the local client server and builds the client for deployment.
- Vite React plugin helps Vite understand React code.

The server uses Express, MongoDB tools, and environment variables.

- Express creates the backend API routes.
- CORS lets the React client talk to the backend.
- Dotenv loads private values from `server/.env`.
- Mongoose connects the server to MongoDB.
- Nodemon can restart the server while developing.

The project also uses hosting tools.

- Vercel hosts the React client online.
- Render hosts the Node API online.
- MongoDB Atlas hosts the database online.

## Getting Started

Install dependencies:

```bash
npm run install:all
```

Create a local environment file for private values as "server/.env":
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
