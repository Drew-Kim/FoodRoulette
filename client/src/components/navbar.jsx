import React, { useState } from 'react';
import './navbar.css';

export default function Navbar() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const userRole = localStorage.getItem('userRole');

    const handleLogout = () => {
        localStorage.clear(); // Clear session
        window.location.href = '/'; // Kick back --> homepage
    };

    return (
    <nav className="main-nav">
      <div className="nav-container">
        <a href="/" className="nav-logo">Food Roulette</a>
        <div className="nav-links">
          { (!token) ?
            (<a href="/login" className="btn-signin">Sign In</a>)
          : (
            <>
              {userRole === 'admin' && <a href="/admin" style={{color: '#e9543f', marginRight: '10px', textDecoration: 'none', fontWeight: 'bold'}}>Dashboard</a>}
              {userRole === 'customer' && <a href="/customer" style={{color: '#14b8a6', marginRight: '10px', textDecoration: 'none', fontWeight: 'bold'}}>Profile</a>}
              <span style={{ marginRight: '10px', color: '#44505d' }}>Hi, {username}</span>
              <button onClick={handleLogout} className="btn-signin" style={{ background: '#e9543f', border: '0', cursor: 'pointer' }}>
                Logout
              </button>
            </>
            )
          }
        </div>
      </div>
    </nav>
  );
}