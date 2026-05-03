import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [serverStatus, setServerStatus] = useState('Checking...');
  const [databaseStatus, setDatabaseStatus] = useState('Checking...');
  const [location, setLocation] = useState('San Diego, CA');
  const [cuisine, setCuisine] = useState('Any food');
  const [price, setPrice] = useState('Any price');

  useEffect(() => {
    async function loadStatus() {
      try {
        const [healthResponse, dbResponse] = await Promise.all([
          fetch(`${API_URL}/api/health`),
          fetch(`${API_URL}/api/db-status`)
        ]);

        const health = await healthResponse.json();
        const database = await dbResponse.json();

        setServerStatus(health.message || 'Node server is running');
        setDatabaseStatus(database.message || database.status);
      } catch (error) {
        setServerStatus('Node server is not connected yet');
        setDatabaseStatus('MongoDB status is unavailable');
      }
    }

    loadStatus();
  }, []);

  const wheelItems = useMemo(
    () => ['Tacos', 'Sushi', 'Burgers', 'Thai', 'Pizza', 'Ramen'],
    []
  );

  return (
    <main className="app-shell">
      <section className="intro">
        <div>
          <p className="course-label">CS110 Course Project</p>
          <h1>Food Roulette</h1>
          <p className="summary">
            A simple MERN app starter for finding restaurants with MongoDB, Node.js,
            and React.
          </p>
        </div>
        <div className="status-panel" aria-label="Project connection status">
          <span>{serverStatus}</span>
          <span>{databaseStatus}</span>
        </div>
      </section>

      <section className="workspace" aria-label="Food roulette starter">
        <form className="search-panel">
          <label>
            Location
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="City or zip code"
            />
          </label>

          <label>
            Cuisine
            <select value={cuisine} onChange={(event) => setCuisine(event.target.value)}>
              <option>Any food</option>
              <option>Mexican</option>
              <option>Japanese</option>
              <option>Italian</option>
              <option>Thai</option>
              <option>Vegetarian</option>
            </select>
          </label>

          <label>
            Price
            <select value={price} onChange={(event) => setPrice(event.target.value)}>
              <option>Any price</option>
              <option>$</option>
              <option>$$</option>
              <option>$$$</option>
            </select>
          </label>

          <button type="button">Find Restaurants</button>
        </form>

        <div className="roulette-panel">
          <div className="wheel" aria-label="Sample roulette wheel">
            {wheelItems.map((item, index) => (
              <span key={item} style={{ '--angle': `${index * 60}deg` }}>
                {item}
              </span>
            ))}
          </div>
          <div>
            <h2>Ready for the next step</h2>
            <p>
              This starter page is connected to the Node API. Yelp search, accounts,
              favorites, and MongoDB collections can be added one feature at a time.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
