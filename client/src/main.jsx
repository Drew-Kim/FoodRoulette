import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const wheelItems = ['Tacos', 'Sushi', 'Burgers', 'Thai', 'Pizza', 'Ramen'];

function App() {
  const [serverStatus, setServerStatus] = useState('Checking...');
  const [databaseStatus, setDatabaseStatus] = useState('Checking...');
  const [location, setLocation] = useState('San Diego, CA');
  const [cuisine, setCuisine] = useState('Any food');
  const [price, setPrice] = useState('Any price');

  useEffect(() => {
    async function loadStatus() {
      try {
        // Ask the backend if the Node server is running.
        const healthResponse = await fetch(`${API_URL}/api/health`);
        const health = await healthResponse.json();
        setServerStatus(health.message || 'Node server is running');

        // Ask the backend if MongoDB is connected.
        const databaseResponse = await fetch(`${API_URL}/api/db-status`);
        const database = await databaseResponse.json();
        setDatabaseStatus(database.message || database.status);
      } catch (error) {
        setServerStatus('Node server is not connected yet');
        setDatabaseStatus('MongoDB status is unavailable');
      }
    }

    loadStatus();
  }, []);

  return (
    <main className="app-shell">
      <section className="intro">
        <div>
          <h1>Food Roulette</h1>
          <p className="summary">
            Spin to find a random restaurant.
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
          <div className="wheel" aria-label="Sample roulette wheel"></div>

          <div className="wheel-options">
            {wheelItems.map((item, index) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
