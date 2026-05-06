import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const wheelItems = ['Tacos', 'Sushi', 'Burgers', 'Thai', 'Pizza', 'Ramen'];

function Admin() {
  return (
    <main className="app-shell">
      <section className="intro">
        <div>
          <h1>Food Roulette Admin</h1>
          <p className="summary">
            Admin tools will live here as the project grows.
          </p>
        </div>
      </section>
    </main>
  );
}

function App() {
  const isAdminPage = window.location.pathname.startsWith('/admin');
  const [serverStatus, setServerStatus] = useState('Checking...');
  const [databaseStatus, setDatabaseStatus] = useState('Checking...');
  const [location, setLocation] = useState('San Diego, CA');
  const [cuisine, setCuisine] = useState('Any food');
  const [price, setPrice] = useState('Any price');
  const [restaurants, setRestaurants] = useState([]);
  const [searchStatus, setSearchStatus] = useState('');
  const [isSearching, setIsSearching] = useState(false);

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

  async function handleSearch(event) {
    event.preventDefault();

    setIsSearching(true);
    setSearchStatus('');
    setRestaurants([]);

    const searchParams = new URLSearchParams({
      location,
      cuisine,
      price
    });

    try {
      const response = await fetch(`${API_URL}/api/restaurants?${searchParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Restaurant search failed.');
      }

      setRestaurants(data.restaurants || []);
      setSearchStatus(
        data.restaurants?.length
          ? `Found ${data.restaurants.length} restaurants.`
          : 'No restaurants found for that search.'
      );
    } catch (error) {
      setSearchStatus(error.message || 'Restaurant search is unavailable right now.');
    } finally {
      setIsSearching(false);
    }
  }

  if (isAdminPage) {
    return <Admin />;
  }

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
        <form className="search-panel" onSubmit={handleSearch}>
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

          <button type="submit" disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Find Restaurants'}
          </button>

          {searchStatus && <p className="search-status">{searchStatus}</p>}
        </form>

        <div className="roulette-panel">
          <div className="wheel" aria-label="Sample roulette wheel"></div>

          <div className="wheel-options">
            {wheelItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      {restaurants.length > 0 && (
        <section className="results-panel" aria-label="Restaurant search results">
          {restaurants.map((restaurant) => (
            <article className="restaurant-card" key={restaurant.id}>
              {restaurant.imageUrl && (
                <img src={restaurant.imageUrl} alt={restaurant.name} />
              )}

              <div>
                <h2>{restaurant.name}</h2>
                <p>{restaurant.address}</p>
                <div className="restaurant-meta">
                  <span>{restaurant.rating} stars</span>
                  {restaurant.price && <span>{restaurant.price}</span>}
                </div>
                <a href={restaurant.yelpUrl} target="_blank" rel="noreferrer">
                  View on Yelp
                </a>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
