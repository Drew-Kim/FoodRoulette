import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { readJson } from './api';
import './styles.css';
import Navbar from './components/navbar';
import Login from './pages/login';
import Register from './pages/register';

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
      const data = await readJson(res);

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

function getDistanceFilterValue(miles) {
  if (miles === 1) {
    return 'blocks';
  }

  if (miles === 2) {
    return 'walking';
  }

  if (miles === 3) {
    return 'biking';
  }

  if (miles === 4) {
    return 'driving';
  }

  return 'birdsEye';
}

function Admin() {
  const [entries, setEntries] = useState([]);
  const [loadStatus, setLoadStatus] = useState('Loading...');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function loadFeedback() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/admin/feedback`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await readJson(response);
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await readJson(response);
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

function CustomerPage() {
  const emptyProfile = {
    username: localStorage.getItem('username') || '',
    email: '',
    role: localStorage.getItem('userRole') || '',
    gender: '',
    age: '',
    location: ''
  };
  const [profile, setProfile] = useState({
    ...emptyProfile
  });
  const [savedProfile, setSavedProfile] = useState({
    ...emptyProfile
  });
  const [friends, setFriends] = useState([]);
  const [friendUsername, setFriendUsername] = useState('');
  const [friendStatus, setFriendStatus] = useState('Loading friends...');
  const [status, setStatus] = useState('Loading profile...');
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function loadFriends() {
    try {
      const response = await fetch(`${API_URL}/api/auth/friends`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(data.message || 'Could not load friends.');
      }

      setFriends(data.friends || []);
      setFriendStatus(data.friends?.length ? '' : 'No friends added yet.');
    } catch (error) {
      setFriendStatus(error.message || 'Could not load friends.');
    }
  }

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await readJson(response);

        if (!response.ok || !data.authenticated) {
          throw new Error(data.message || 'Could not load profile.');
        }

        const nextProfile = {
          username: data.user.username || '',
          email: data.user.email || '',
          role: data.user.role || '',
          gender: data.user.gender || '',
          age: data.user.age || '',
          location: data.user.location || ''
        };

        setProfile(nextProfile);
        setSavedProfile(nextProfile);
        localStorage.setItem('username', data.user.username);
        localStorage.setItem('userRole', data.user.role);
        setStatus('');
      } catch (error) {
        setStatus(error.message || 'Could not load profile.');
      }
    }

    loadProfile();
    loadFriends();
  }, []);

  function updateField(field, value) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value
    }));
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setStatus('');

    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          username: profile.username,
          email: profile.email,
          gender: profile.gender,
          age: profile.age,
          location: profile.location
        })
      });
      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(data.message || 'Could not save profile.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.user.username);
      localStorage.setItem('userRole', data.user.role);
      const nextProfile = {
        username: data.user.username || '',
        email: data.user.email || '',
        role: data.user.role || '',
        gender: data.user.gender || '',
        age: data.user.age || '',
        location: data.user.location || ''
      };

      setProfile(nextProfile);
      setSavedProfile(nextProfile);
      setStatus(data.message || 'Profile updated.');
    } catch (error) {
      setStatus(error.message || 'Could not save profile.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddFriend(event) {
    event.preventDefault();
    setIsAddingFriend(true);
    setFriendStatus('');

    try {
      const response = await fetch(`${API_URL}/api/auth/friends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ username: friendUsername })
      });
      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(data.message || 'Could not add friend.');
      }

      setFriends(data.friends || []);
      setFriendUsername('');
      setFriendStatus(data.message || 'Friend added.');
    } catch (error) {
      setFriendStatus(error.message || 'Could not add friend.');
    } finally {
      setIsAddingFriend(false);
    }
  }

  async function handleRemoveFriend(friendId) {
    setFriendStatus('');

    try {
      const response = await fetch(`${API_URL}/api/auth/friends/${friendId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(data.message || 'Could not remove friend.');
      }

      setFriends(data.friends || []);
      setFriendStatus(data.friends?.length ? data.message : 'No friends added yet.');
    } catch (error) {
      setFriendStatus(error.message || 'Could not remove friend.');
    }
  }

  return (
    <>
      <Navbar />
      <main className="app-shell">
        <section className="intro">
          <div>
            <p className="eyebrow">Account</p>
            <h1>Profile</h1>
          </div>
          <div className="status-panel" aria-label="Navigation">
            {profile.role && <span>Role: {profile.role}</span>}
            <span>
              <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Back to Roulette</a>
            </span>
          </div>
        </section>

        <section className="workspace profile-workspace">
          <form className="search-panel profile-panel" onSubmit={handleProfileSubmit}>
            <div>
              <p className="panel-kicker">Profile</p>
              <h2>Basic information</h2>
            </div>

            <label>
              Username
              <input
                value={profile.username}
                onChange={(event) => updateField('username', event.target.value)}
                minLength={3}
                maxLength={30}
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={profile.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="Optional"
              />
            </label>

            <label>
              Gender
              <select
                value={profile.gender}
                onChange={(event) => updateField('gender', event.target.value)}
              >
                <option value="">Prefer not to say</option>
                <option>Female</option>
                <option>Male</option>
                <option>Non-binary</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              Age
              <input
                type="number"
                min="1"
                max="120"
                value={profile.age}
                onChange={(event) => updateField('age', event.target.value)}
                placeholder="Optional"
              />
            </label>

            <label>
              Location
              <input
                value={profile.location}
                onChange={(event) => updateField('location', event.target.value)}
                placeholder="City, state, or area"
                maxLength={120}
              />
            </label>

            <button type="submit" disabled={isSaving || !profile.username.trim()}>
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>

            {status && <p className="search-status">{status}</p>}

            <div className="profile-summary">
              <p className="panel-kicker">Saved Information</p>
              <dl>
                <div>
                  <dt>Username</dt>
                  <dd>{savedProfile.username || 'Not added'}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{savedProfile.email || 'Not added'}</dd>
                </div>
                <div>
                  <dt>Gender</dt>
                  <dd>{savedProfile.gender || 'Not added'}</dd>
                </div>
                <div>
                  <dt>Age</dt>
                  <dd>{savedProfile.age || 'Not added'}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{savedProfile.location || 'Not added'}</dd>
                </div>
              </dl>
            </div>
          </form>

          <section className="search-panel profile-panel friend-panel">
            <div>
              <p className="panel-kicker">Friends</p>
              <h2>Add by username</h2>
            </div>

            <form className="friend-form" onSubmit={handleAddFriend}>
              <label>
                Username
                <input
                  value={friendUsername}
                  onChange={(event) => setFriendUsername(event.target.value)}
                  placeholder="Friend username"
                  required
                />
              </label>
              <button type="submit" disabled={isAddingFriend || !friendUsername.trim()}>
                {isAddingFriend ? 'Adding...' : 'Add'}
              </button>
            </form>

            {friends.length > 0 && (
              <div className="friend-list">
                {friends.map((friend) => (
                  <div className="friend-row" key={friend.id}>
                    <div>
                      <strong>{friend.username}</strong>
                      {friend.email && <span>{friend.email}</span>}
                    </div>
                    <button
                      className="friend-remove"
                      type="button"
                      onClick={() => handleRemoveFriend(friend.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {friendStatus && <p className="search-status">{friendStatus}</p>}
          </section>
        </section>
      </main>
    </>
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
  const path = window.location.pathname;
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const isLoggedIn = Boolean(token);
  const isAdminPage = path.startsWith('/admin');
  const isCustomerPage = path.startsWith('/customer');
  const isFeedbackPage = path.startsWith('/feedback');
  const isLoginPage = path.startsWith('/login');
  const isRegisterPage = path.startsWith('/register');

  const wheelRef = useRef(null);

  const [serverStatus, setServerStatus] = useState('Checking...');
  const [databaseStatus, setDatabaseStatus] = useState('Checking...');

  const [location, setLocation] = useState('Riverside, CA');
  const [cuisine, setCuisine] = useState('Any food');
  const [price, setPrice] = useState('Any price');
  const [restaurantCount, setRestaurantCount] = useState(8);
  const [radiusMiles, setRadiusMiles] = useState(5);
  const [useDistanceFilter, setUseDistanceFilter] = useState(true);
  const [openNow, setOpenNow] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [isFindingLocation, setIsFindingLocation] = useState(false);
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
        const health = await readJson(healthResponse);
        setServerStatus(health.message || 'Node server is running');

        const databaseResponse = await fetch(`${API_URL}/api/db-status`);
        const database = await readJson(databaseResponse);
        setDatabaseStatus(database.message || database.status);
      } catch (error) {
        setServerStatus('Node server is not connected yet');
        setDatabaseStatus('MongoDB status is unavailable');
      }
    }

    loadStatus();
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    async function verifyToken() {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await readJson(response);

        if (!response.ok || !data.authenticated) {
          localStorage.clear();
          if (isAdminPage || isCustomerPage) {
            window.location.href = '/login';
          }
        }
      } catch (error) {
        localStorage.clear();
      }
    }

    verifyToken();
  }, [token, isAdminPage, isCustomerPage]);

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

  function handleLocationChange(event) {
    setLocation(event.target.value);
    setCoordinates(null);
    setLocationStatus('');
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('Your browser cannot detect location.');
      return;
    }

    setIsFindingLocation(true);
    setLocationStatus('Finding your location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude.toFixed(5));
        const longitude = Number(position.coords.longitude.toFixed(5));

        setCoordinates({
          latitude,
          longitude
        });
        setLocation('Current Location');
        setLocationStatus('Using your current location.');
        setIsFindingLocation(false);
      },
      () => {
        setLocationStatus('Could not detect your location. Try typing a city or zip code.');
        setIsFindingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }

  async function handleSearch(event) {
    event.preventDefault();

    setIsSearching(true);
    setSearchStatus('');
    setRestaurants([]);
    setSelectedRestaurant(null);
    setPointerColor(wheelColors[0]);

    const searchLocation = coordinates
      ? `${coordinates.latitude}, ${coordinates.longitude}`
      : location;

    const searchParams = new URLSearchParams({
      location: searchLocation,
      cuisine,
      price,
      count: String(restaurantCount)
    });

    if (coordinates) {
      searchParams.set('latitude', String(coordinates.latitude));
      searchParams.set('longitude', String(coordinates.longitude));
    }

    if (useDistanceFilter) {
      searchParams.set('distanceFilter', getDistanceFilterValue(radiusMiles));
    }

    if (openNow) {
      searchParams.set('openNow', 'true');
    }

    try {
      const response = await fetch(`${API_URL}/api/restaurants?${searchParams}`);
      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(data.message || 'Restaurant search failed.');
      }

      const foundRestaurants = data.restaurants || [];

      setRestaurants(foundRestaurants);
      setSearchStatus(
        foundRestaurants.length
          ? `Loaded ${foundRestaurants.length} valid restaurants${useDistanceFilter ? ` within ${radiusMiles} mile${radiusMiles === 1 ? '' : 's'}` : ' with no distance filter'}. Max ${restaurantCount}.`
          : `No restaurants found${useDistanceFilter ? ` within ${radiusMiles} mile${radiusMiles === 1 ? '' : 's'}` : ' with no distance filter'}.`
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
    if (!isLoggedIn || userRole !== 'admin') {
      return <Login />;
    }

    return <Admin />;
  }

  if (isLoginPage) {
    return <Login />;
  }

  if (isRegisterPage) {
    return <Register />;
  }

  if (isCustomerPage) {
    if (!isLoggedIn) {
      return <Login />;
    }

    return <CustomerPage />;
  }

  if (isFeedbackPage) {
    return <FeedbackPage />;
  }

  return (
    <>
    <Navbar />
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
              onChange={handleLocationChange}
              placeholder="City or zip code"
            />
          </label>
          <button
            className="secondary-button"
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isFindingLocation}
          >
            {isFindingLocation ? 'Finding Location...' : 'Use My Location'}
          </button>
          {locationStatus && <p className="location-status">{locationStatus}</p>}

          <label className="toggle-label">
            <input
              type="checkbox"
              checked={useDistanceFilter}
              onChange={(event) => setUseDistanceFilter(event.target.checked)}
            />
            <span>Use nearby distance filter</span>
          </label>

          <label className="range-label">
            Nearby radius
            <input
              type="range"
              min="1"
              max="10"
              value={radiusMiles}
              disabled={!useDistanceFilter}
              onChange={(event) => setRadiusMiles(Number(event.target.value))}
            />
            <span>
              {useDistanceFilter
                ? `Within ${radiusMiles} mile${radiusMiles === 1 ? '' : 's'}`
                : 'Distance filter off'}
            </span>
          </label>

          <label className="toggle-label">
            <input
              type="checkbox"
              checked={openNow}
              onChange={(event) => setOpenNow(event.target.checked)}
            />
            <span>Open now</span>
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
            Max restaurants on wheel
            <input
              type="number"
              min="2"
              max="20"
              value={restaurantCount}
              onChange={(event) => setRestaurantCount(event.target.value)}
            />
          </label>

          <button type="submit" disabled={isSearching || isFindingLocation}>
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
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
