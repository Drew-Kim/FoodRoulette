import React, { useState } from 'react';
import './login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    // I think we need to check for Admin/Normal user with DB later
    //  and thus assign different tools/UI
    console.log('Logging in with:', { username, password });
    alert('Login attempted.');
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