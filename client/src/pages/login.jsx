import React, { useState } from 'react';
import './login.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');


  const handleSubmit = async (e) => {
    e.preventDefault();
    // I think we need to check for Admin/Normal user with DB later
    //  and thus assign different tools/UI
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save session tokens to local storage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('username', data.user.username);

      // Redirect based on role assignment
      if (data.user.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/customer';
      }
      console.log('Logging in with:', { username, password });

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="app-shell">
      <section className="login-page-container">
      <form className="search-panel login-form-wrapper" onSubmit={handleSubmit}>
        <div className="login-header">
          <h1>Sign In</h1>
          <p className="search-status">
            Access your Food Roulette account.
          </p>
        </div>
          
        <div className="input-group">
          <label>
            Username
            <input 
              type="text"
              placeholder="Enter your username"
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </label>
        </div>
        
        <button type="submit" className="login-button">
          Login
        </button>
          
        <div className="login-footer">
          <p>Don't have an account? <a href="/register" className="auth-link">Sign Up</a></p>
          <a href="/" className="back-link">
            &larr; Back to Roulette
          </a>
        </div>

      </form>
      </section>
    </main>
  );
}