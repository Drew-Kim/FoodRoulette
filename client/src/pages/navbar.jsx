import React, { useState } from 'react';
import './navbar.css';

export default function Navbar() {
  return (
    <nav className="main-nav">
      <div className="nav-container">
        <a href="/" className="nav-logo">Food Roulette</a>
        <div className="nav-links">
          <a href="/login" className="btn-signin">Sign In</a>
        </div>
      </div>
    </nav>
  );
}