# Food Roulette

Food Roulette is a React, Node.js, and MongoDB web app that uses the Yelp API to help users discover nearby restaurants and randomly choose where to eat with a fun roulette style picker.

Project Google Drive folder:

[Food Roulette Google Drive](https://drive.google.com/drive/folders/1xxX7x9AXT2iwbUZ4-f3UW9MkdTteGOlM?usp=drive_link)

## Project Progress

The application has a React frontend, a Node and Express backend, MongoDB setup, Yelp search, and deployment config started for Vercel and Render to host the webpage on to [www.foodroulette.cc](https://www.foodroulette.cc/)

- Created the React and Vite client.
- Created the Node and Express API server.
- Added MongoDB Atlas connection setup with local `.env` support.
- Added backend health and database status checks.
- Added a Yelp restaurant search endpoint.
- Built the Food Roulette search page with location, cuisine, price, open now, and nearby distance filters.
- Added a current location button that can search with browser location.
- Polished the roulette wheel, pointer, spin behavior, winner card, and restaurant result cards.
- Added login, register, customer, admin, and feedback pages.
- Added user accounts with customer and admin roles.
- Added basic username checks for unique accounts and safer profile updates.
- Added feedback and bug report saving, plus an admin view for reviewing reports.
- Added environment examples and deployment config for Vercel and Render.


## Project Structure

- client/ - React webpage
- server/ - Node.js API server
- server/routes/ - backend route files
- server/models/ - MongoDB models
- server/.env - private server environment variables
- client/.env - private client environment variables

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
- Bcrypt hashes account passwords.
- JSON Web Token handles signed in user sessions.
- Google Auth Library supports Google sign in.
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
Then update `server/.env` with the real MongoDB connection string, Yelp API key, JWT secret, and Google client values. Do not commit `.env`.

Create `client/.env` when the client needs local values:

```text
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

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

Open the feedback form:

```text
http://localhost:5173/feedback
```

The Node API runs at:

```text
http://localhost:5000
```
