import React, { useEffect, useRef } from 'react';
import './googleButton.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

export default function GoogleLoginButton({ onAuthSuccess, onAuthFailure, mode = 'login' }) {
  const googleBtnRef = useRef(null);
  const callbackRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      return;
    }

    let isMounted = true;

    const handleCredentialResponse = async (googleResponse) => {
      try {
        if (!isMounted) return;
        onAuthFailure(''); 

        const endpoint = mode === 'sync' ? '/api/auth/sync-google' : '/api/auth/google';
        const headers = { 'Content-Type': 'application/json' };

        if (mode === 'sync') {
          const appToken = localStorage.getItem('token');
          if (appToken) {
            headers['Authorization'] = `Bearer ${appToken}`;
          }
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ idToken: googleResponse.credential })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Google authentication failed');
        }

        if (isMounted) onAuthSuccess(data);

      } catch (err) {
        console.error('Google Auth Pipeline Error:', err);
        if (isMounted) onAuthFailure(err.message || 'Failed to authenticate via Google.');
      }
    };

    callbackRef.current = handleCredentialResponse; //make up-to-date

    const initializeGoogleSignIn = () => {
      if (!window.googleHasInitialized) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (...args) => callbackRef.current(...args),
          auto_select: false
        });
        window.googleHasInitialized = true;
      }

      if (!googleBtnRef.current) {
        return;
      }

      googleBtnRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(
        googleBtnRef.current,
        { theme: 'outline', size: 'large', text: mode === 'sync' ? 'signup_with' : 'signin_with', width: 320, shape: 'rectangular' }
      );
    };

    // Script load
    if (!document.getElementById('google-client-script')) {
      const script = document.createElement('script');
      script.id = 'google-client-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.head.appendChild(script);
    } else if (window.google?.accounts?.id) {
      initializeGoogleSignIn();
    }

    return () => {
      isMounted = false;
    };
  }, [mode, onAuthSuccess, onAuthFailure]);

  if (!GOOGLE_CLIENT_ID) {
    return <p className="google-unavailable">Google sign-in is not configured yet.</p>;
  }

  return (
    <div className="google-btn-container">      
      <div ref={googleBtnRef} className="google-btn"/>
    </div>
  );
}
