import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const cuisineOptions = [
  'Any food',
  'Mexican',
  'Japanese',
  'Italian',
  'Thai',
  'Vegetarian',
  'Korean',
  'Indian',
  'Mediterranean'
];
const fallbackWheelItems = ['Tacos', 'Sushi', 'Burgers', 'Pasta', 'Pizza', 'Ramen'].map((name) => ({
  name
}));
const priceOptions = ['Any price', '$', '$$', '$$$', '$$$$'];
const wheelColors = ['#e91e36', '#2f73e0', '#17a846', '#f2c536'];
const spinDurationMs = 4200;

function FeedbackPage() {
  const [type, setType] = useState('feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus('');

    try {
      const res = await fetch(`${API_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, subject, message, email })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Submission failed.');
      }

      setSubmitted(true);
      setStatus(data.message);
    } catch (error) {
      setStatus(error.message || 'Something went wrong. Please try again shortly.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="intro">
        <div>
          <p className="eyebrow">Share possible ideas or improvements!</p>
          <h1>Feedback</h1>
        </div>
        <div className="status-panel" aria-label="Navigation">
          <span>
            <a href="/" style={{ color: 'inherit', textDecoration: 'none'}}>← Back to Roulette</a>
          </span>
        </div>
      </section>

      <section className="workspace feedback-workspace">
        <div className="search-panel feedback-form-panel">
          {submitted ? (
            <div className="feedback-success">
              <p className="panel-kicker">Submitted!</p>
              <h2>Got it - Thanks!</h2>
              <p className="admin-summary">{status}</p>
              <button onClick={() => { setSubmitted(false); setSubject(''); setMessage(''); setEmail(''); setStatus(''); }}>
                Send another?
              </button>
              </div>
          ) : (
            <>
              <div>
                <p className="panel-kicker">Report a bug</p>
                <h2>Please be as detailed as possible, including steps to reproduce the bug if possible.</h2>
              </div>

              <fieldset className="feedback-type-fieldset">
                <legend>Type</legend>
                <div className="feedback-type-options">
                  <label className={`feedback-type-option${type === 'feedback' ? ' active' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="feedback"
                      checked={type === 'feedback'}
                      onChange={() => setType('feedback')}
                    />
                    General Feedback
                  </label>
                  <label className={`feedback-type-option${type === 'bug' ? ' active' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="bug"
                      checked={type === 'bug'}
                      onChange={() => setType('bug')}
                    />
                    Bug Report
                  </label>
                </div>
              </fieldset>

              <label>
                Subject
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={type === 'bug' ? 'e.g. Wheel freezes after spinning' : 'e.g. Would love a dark mode'}
                  maxLength={120}
                  required
                />
              </label>

              <label>
                {type === 'bug' ? 'Describe the bug and how it happened.' : 'What would you like to see?'}
                <textarea
                  className="feedback-textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    type === 'bug'
                      ? 'What happened? What did you expect to happen?'
                      : 'Tell us what you think...'
                  }
                  rows={5}
                  maxLength={2000}
                  required
                />
              </label>

              <label>
                Email <span className="feedback-optional">(optional)</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                /> 
              </label>

              <button onClick={handleSubmit} disabled={isSubmitting || !subject.trim() || !message.trim()}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>

              {status && <p className="search-status">{status}</p>}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

const STATUS_LABELS = { new: 'New', reviewed: 'Reviewed', resolved: 'Resolved'};
const TYPE_LABELS = { bug: 'Bug', feedback: 'Feedback' };

function Admin() {
  const [entries, setEntries] = useState([]);
  const [loadStatus, setLoadStatus] = useState('Loading...');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function loadFeedback() {
      try {
        const response = await fetch(`${API_URL}/api/admin/feedback`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Load failed.');
        setEntries(data.entries || []);
        setLoadStatus(data.entries?.length ? '' : 'No submissions yet.');
      } catch (error) {
        setLoadStatus(error.message || 'Could not load feedback.');
      }
    }
    loadFeedback();
  }, []);

  async function updateStatus(id, newStatus) {
    try {
      const response = await fetch(`${API_URL}/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setEntries((prev) => prev.map((e) => (e._id === id ? { ...e, status: newStatus } : e)));
    } catch (error) {
      alert(error.message || 'Update failed.');
    }
  }

  const filtered = filter === 'all' ? entries : entries.filter((e) => e.status === filter || e.type === filter);
  const counts = { all: entries.length, new: entries.filter((e) => e.status === 'new').length };

  return (
    <main className="app-shell">
      <section className="intro">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Food Roulette Admin</h1>
        </div>
        <div className="status-panel" aria-label="Navigation">
          <span><a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>← Back to app</a></span>
          <span><a href="/feedback" style={{ color: 'inherit', textDecoration: 'none' }}>Feedback form →</a></span>
        </div>
      </section>

      <section className="admin-feedback-section">
        <div className="admin-feedback-header">
          <div>
            <p className="panel-kicker">Bug Reports & Feedback</p>
            <h2 style={{ marginBottom: 0 }}>
              Submissions
              {counts.new > 0 && <span className="feedback-badge">{counts.new} new</span>}
            </h2>
          </div>
          <div className="admin-filter-bar">
            {['all', 'new', 'reviewed', 'resolved', 'bug', 'feedback'].map((f) => (
              <button
                key={f}
                className={`admin-filter-btn${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
            ))}
          </div>
        </div>

        {loadStatus && <p className="search-status" style={{ marginTop: 12 }}>{loadStatus}</p>}

        {filtered.length > 0 && (
          <div className="admin-entries">
            {filtered.map((entry) => (
              <article key={entry._id} className={`admin-entry admin-entry--${entry.status}`}>
                <div className="admin-entry-meta">
                  <span className="admin-entry-type">{TYPE_LABELS[entry.type] || entry.type}</span>
                  <span className={`admin-entry-status admin-entry-status--${entry.status}`}>
                    {STATUS_LABELS[entry.status] || entry.status}
                  </span>
                  <span className="admin-entry-date">
                    {new Date(entry.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </span>
                  {entry.email && <span className="admin-entry-email">{entry.email}</span>}
                </div>
                <h3 className="admin-entry-subject">{entry.subject}</h3>
                <p className="admin-entry-message">{entry.message}</p>
                <div className="admin-entry-actions">
                  <span style={{ fontSize: '0.85rem', color: 'var(--label)', fontWeight: 700 }}>Mark as:</span>
                  {['new', 'reviewed', 'resolved'].map((s) => (
                    <button
                      key={s}
                      className={`admin-status-btn${entry.status === s ? ' active' : ''}`}
                      onClick={() => updateStatus(entry._id, s)}
                      disabled={entry.status === s}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function getWheelSegments(items) {
  return items.map((item, index) => {
    let color = wheelColors[index % wheelColors.length];
    const isLastSlice = index === items.length - 1;
    const firstColor = wheelColors[0];
    const previousColor = index > 0 ? wheelColors[(index - 1) % wheelColors.length] : '';

    if (isLastSlice && color === firstColor) {
      color = wheelColors.find((option) => option !== firstColor && option !== previousColor) || color;
    }

    return { ...item, color };
  });
}

function getWheelGradient(segments) {
  const sliceSize = 360 / segments.length;

  return segments
    .map((segment, index) => {
      const start = index * sliceSize;
      const end = (index + 1) * sliceSize;

      return `${segment.color} ${start}deg ${end}deg`;
    })
    .join(', ');
}

function getDisplayName(name) {
  if (name.length <= 18) {
    return name;
  }

  return `${name.slice(0, 16)}...`;
}

function getAddressLines(address) {
  if (!address) {
    return ['Address unavailable'];
  }

  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);

  if (parts.length <= 1) {
    return [address];
  }

  return [parts[0], parts.slice(1).join(', ')];
}

function AddressText({ address }) {
  return (
    <p>
      {getAddressLines(address).map((line) => (
        <span className="address-line" key={line}>{line}</span>
      ))}
    </p>
  );
}

function getRotationDegrees(element) {
  const transform = window.getComputedStyle(element).transform;

  if (transform === 'none') {
    return 0;
  }

  const matrixValues = transform.match(/matrix\((.+)\)/)?.[1].split(', ');

  if (!matrixValues) {
    return 0;
  }

  const angle = Math.atan2(Number(matrixValues[1]), Number(matrixValues[0])) * (180 / Math.PI);

  return (angle + 360) % 360;
}

function getPointerColorForRotation(rotation, sliceSize, segments) {
  const pointerAngle = ((90 - (rotation % 360)) + 360) % 360;
  const pointerSegmentIndex = Math.floor(pointerAngle / sliceSize) % segments.length;

  return segments[pointerSegmentIndex]?.color || wheelColors[0];
}

function App() {
  const isAdminPage = window.location.pathname.startsWith('/admin');
  const isFeedbackPage = window.location.pathname.startsWith('/feedback');

  const wheelRef = useRef(null);

  const [serverStatus, setServerStatus] = useState('Checking...');
  const [databaseStatus, setDatabaseStatus] = useState('Checking...');

  const [location, setLocation] = useState('San Diego, CA');
  const [cuisine, setCuisine] = useState('Any food');
  const [price, setPrice] = useState('Any price');
  const [restaurantCount, setRestaurantCount] = useState(8);
  const [restaurants, setRestaurants] = useState([]);
  const [searchStatus, setSearchStatus] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [wheelRotation, setWheelRotation] = useState(0);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [pointerColor, setPointerColor] = useState(wheelColors[0]);
  const [isSpinning, setIsSpinning] = useState(false);

  const wheelItems = restaurants.length ? restaurants : fallbackWheelItems;
  const wheelSegments = useMemo(() => getWheelSegments(wheelItems), [wheelItems]);
  const wheelGradient = useMemo(() => getWheelGradient(wheelSegments), [wheelSegments]);
  const sliceSize = 360 / wheelItems.length;

  useEffect(() => {
    async function loadStatus() {
      try {
        const healthResponse = await fetch(`${API_URL}/api/health`);
        const health = await healthResponse.json();
        setServerStatus(health.message || 'Node server is running');

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

  useEffect(() => {
    if (isSpinning || !wheelRef.current) {
      return;
    }

    setPointerColor(getPointerColorForRotation(wheelRotation, sliceSize, wheelSegments));
  }, [isSpinning, wheelRotation, sliceSize, wheelSegments]);

  useEffect(() => {
    if (!isSpinning || !wheelRef.current) {
      return;
    }

    let animationFrameId = 0;

    function updatePointerColor() {
      const currentRotation = getRotationDegrees(wheelRef.current);
      const currentColor = getPointerColorForRotation(currentRotation, sliceSize, wheelSegments);

      setPointerColor((previousColor) => (
        previousColor === currentColor ? previousColor : currentColor
      ));

      animationFrameId = window.requestAnimationFrame(updatePointerColor);
    }

    updatePointerColor();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [isSpinning, sliceSize, wheelSegments]);

  async function handleSearch(event) {
    event.preventDefault();

    setIsSearching(true);
    setSearchStatus('');
    setRestaurants([]);
    setSelectedRestaurant(null);
    setPointerColor(wheelColors[0]);

    const searchParams = new URLSearchParams({
      location,
      cuisine,
      price,
      count: String(restaurantCount)
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
          ? `Loaded ${data.restaurants.length} restaurants onto the wheel.`
          : 'No restaurants found for that search.'
      );
    } catch (error) {
      setSearchStatus(error.message || 'Restaurant search is unavailable right now.');
    } finally {
      setIsSearching(false);
    }
  }

  function handleSpin() {
    if (!restaurants.length || isSpinning) {
      return;
    }

    const winnerIndex = Math.floor(Math.random() * restaurants.length);
    const winnerSegment = wheelSegments[winnerIndex];
    const sliceCenter = winnerIndex * sliceSize + sliceSize / 2;
    const fullSpins = 360 * 6;
    const pointerOffset = 90;
    const nextRotation = fullSpins + pointerOffset - sliceCenter;

    setIsSpinning(true);
    setSelectedRestaurant(null);
    setWheelRotation((currentRotation) => currentRotation + nextRotation);

    window.setTimeout(() => {
      setSelectedRestaurant(restaurants[winnerIndex]);
      setPointerColor(winnerSegment.color);
      setIsSpinning(false);
    }, spinDurationMs);
  }

  if (isAdminPage) {
    return <Admin />;
  }

  if (isFeedbackPage) {
    return <FeedbackPage />;
  }

  return (
    <main className="app-shell">
      <section className="intro">
        <div>
          <h1>Food Roulette</h1>
        </div>

        <div className="status-panel" aria-label="Project connection status">
          <span>{serverStatus}</span>
          <span>{databaseStatus}</span>
          <span>
            <a href="/feedback" style={{ color: 'var(--accent)', fontWeight: 900, textDecoration: 'none' }}>
              Report a bug or suggest a feature →
            </a>
          </span>
        </div>
      </section>

      <section className="workspace" aria-label="Food roulette controls">
        <form className="search-panel" onSubmit={handleSearch}>
          <div>
            <p className="panel-kicker">Filters</p>
            <h2>Build the Wheel</h2>
          </div>

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
              {cuisineOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label>
            Price
            <select value={price} onChange={(event) => setPrice(event.target.value)}>
              {priceOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label>
            Restaurants on wheel
            <input
              type="number"
              min="2"
              max="20"
              value={restaurantCount}
              onChange={(event) => setRestaurantCount(event.target.value)}
            />
          </label>

          <button type="submit" disabled={isSearching}>
            {isSearching ? 'Loading Wheel...' : 'Search Restaurants'}
          </button>

          {searchStatus && <p className="search-status">{searchStatus}</p>}
        </form>

        <section className="roulette-panel" aria-label="Restaurant roulette wheel">
          <div className="roulette-stage">
            <div className="wheel-frame">
              <div
                className="wheel-pointer"
                style={{ '--pointer-color': pointerColor }}
                aria-hidden="true"
              ></div>
              <div
                className="wheel"
                ref={wheelRef}
                style={{
                  background: `conic-gradient(${wheelGradient})`,
                  transform: `rotate(${wheelRotation}deg)`
                }}
              >
                {wheelSegments.map((item, index) => (
                  <span
                    className="wheel-label"
                    key={`${item.id || item.name}-${index}`}
                    style={{
                      '--label-angle': `${index * sliceSize + sliceSize / 2}deg`
                    }}
                  >
                    <span className="wheel-label-text">{getDisplayName(item.name)}</span>
                  </span>
                ))}
                <div className="wheel-center" aria-hidden="true"></div>
              </div>
            </div>
          </div>

          <div className="spin-controls">
            <button type="button" onClick={handleSpin} disabled={!restaurants.length || isSpinning}>
              {isSpinning ? 'Spinning...' : 'Spin'}
            </button>
            <p>
              {restaurants.length
                ? `${restaurants.length} Yelp results are ready.`
                : 'Search first to replace options.'}
            </p>
          </div>

          {selectedRestaurant && (
            <article className="winner-panel">
              {selectedRestaurant.imageUrl && (
                <img
                  className="winner-image"
                  src={selectedRestaurant.imageUrl}
                  alt={selectedRestaurant.name}
                />
              )}
              <div>
                <p className="panel-kicker">Winner</p>
                <h2>{selectedRestaurant.name}</h2>
                <AddressText address={selectedRestaurant.address} />
                <div className="restaurant-meta">
                  <span>{selectedRestaurant.rating} stars</span>
                  {selectedRestaurant.price && <span>{selectedRestaurant.price}</span>}
                </div>
                <a href={selectedRestaurant.yelpUrl} target="_blank" rel="noreferrer">
                  View on Yelp
                </a>
              </div>
            </article>
          )}
        </section>
      </section>

      {restaurants.length > 0 && (
        <section className="results-panel" aria-label="Restaurant search results">
          {restaurants.map((restaurant) => (
            <article className="restaurant-card" key={restaurant.id}>
              {restaurant.imageUrl && <img src={restaurant.imageUrl} alt={restaurant.name} />}

              <div>
                <h2>{restaurant.name}</h2>
                <AddressText address={restaurant.address} />
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
