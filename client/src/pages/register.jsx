import React, { useState } from 'react';
import './login.css'; //Same login UI
import GoogleLoginButton from '../components/googleButton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAuthSuccess = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userRole', data.user.role);
    localStorage.setItem('username', data.user.username);

    if (data.user.role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/customer';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Re-enter to confirm password
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password,
          role: 'customer'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccess('Account created successfully! Redirecting to sign in...');
      
      // Redirect to login screen after 2 seconds
      setTimeout(() => {
        window.location.pathname = '/login';
      }, 2000);

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="app-shell">
      <section className="login-page-container">
        <form className="search-panel login-form-wrapper" onSubmit={handleSubmit}>
          <div className="login-header">
            <h1>Sign Up</h1>
            <p className="search-status">Create a Food Roulette account</p>
            
            {error && <p style={{ color: '#e9543f', fontWeight: 'bold', margin: '10px 0 0' }}>{error}</p>}
            {success && <p style={{ color: '#17a846', fontWeight: 'bold', margin: '10px 0 0' }}>{success}</p>}
          </div>
          
          <div className="input-group">
            <label>
              Username
              <input 
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
              />
            </label>
          </div>
          
          <div className="input-group">
            <label>
              Password
              <input 
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </label>
          </div>

          <div className="input-group">
            <label>
              Confirm Password
              <input 
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
              />
            </label>
          </div>
          
          <button type="submit" className="login-button">
            Register
          </button>

          <div className="auth-divider">
            <hr className="divider-line" />
            <span className="divider-text">OR</span>
            <hr className="divider-line" />
          </div>

          <GoogleLoginButton 
            onAuthSuccess={handleAuthSuccess}
            onAuthFailure={setError} 
            mode="login" 
          />            
            
          <div className="login-footer">
            <p>Already have an account? <a href="/login" className="auth-link">Sign In</a></p>
            <a href="/" className="back-link">
              &larr; Back to Roulette
            </a>
          </div>
        </form>
      </section>
    </main>
  );
}
