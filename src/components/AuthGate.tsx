import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { AuthService } from '../services/AuthService';
import { RemoteSync } from '../services/RemoteSync';
import { GOOGLE_CLIENT_ID, IS_DEV } from '../services/env';

declare global {
  interface Window {
    google?: any;
  }
}

type GateState = 'checking' | 'login' | 'syncing' | 'ready' | 'denied' | 'error' | 'misconfigured';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('Could not load Google Sign-In')));
    if (!existing) {
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });
}

const centered: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '16px',
  padding: '24px',
  textAlign: 'center',
};

interface AuthGateProps {
  children: ReactNode;
}

/**
 * Development: no authentication, a local dev user is used and data stays in localStorage.
 * Production: Google sign-in required; the server only allows emails in ADMIN_EMAILS
 * and the shared data is loaded from the server before the app is shown.
 */
export default function AuthGate({ children }: AuthGateProps) {
  const [state, setState] = useState<GateState>('checking');
  const buttonRef = useRef<HTMLDivElement>(null);

  const startSync = useCallback(async () => {
    setState('syncing');
    try {
      await RemoteSync.initialSync();
      RemoteSync.startBackgroundSync();
      setState('ready');
    } catch (error) {
      console.error('Initial sync failed:', error);
      setState(error instanceof Error && error.message === 'NOT_AUTHORIZED' ? 'denied' : 'error');
    }
  }, []);

  const handleCredential = useCallback(
    (response: { credential?: string }) => {
      if (!response.credential || !AuthService.setGoogleSession(response.credential)) {
        setState('error');
        return;
      }
      void startSync();
    },
    [startSync]
  );

  // Initial check
  useEffect(() => {
    if (IS_DEV) {
      if (!AuthService.getCurrentUser()) {
        AuthService.setLocalUser('Dev User', 'dev@localhost');
      }
      setState('ready');
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      setState('misconfigured');
      return;
    }

    if (AuthService.getIdToken() && AuthService.getCurrentUser()) {
      void startSync();
    } else {
      AuthService.logout();
      setState('login');
    }
  }, [startSync]);

  // Render the Google button on the login screen
  useEffect(() => {
    if (state !== 'login' || !GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredential,
          auto_select: true,
          cancel_on_tap_outside: false,
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
        });
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [state, handleCredential]);

  const signOut = () => {
    AuthService.logout();
    window.google?.accounts?.id?.disableAutoSelect();
    window.location.reload();
  };

  if (state === 'ready') return <>{children}</>;

  if (state === 'checking' || state === 'syncing') {
    return (
      <div style={centered}>
        <div className="spinner"></div>
        <p>{state === 'syncing' ? 'Loading shared data...' : 'Loading...'}</p>
      </div>
    );
  }

  if (state === 'misconfigured') {
    return (
      <div style={centered}>
        <h2>Configuration missing</h2>
        <p>VITE_GOOGLE_CLIENT_ID is not set for this deployment.</p>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div style={centered}>
        <h2>Access denied</h2>
        <p>This Google account is not allowed to use this app.</p>
        <button className="button button-primary" onClick={signOut}>
          Sign in with another account
        </button>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div style={centered}>
        <h2>Could not connect</h2>
        <p>Sign-in or loading the shared data failed. Check your connection and try again.</p>
        <button className="button button-primary" onClick={signOut}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div style={centered}>
      <h1>💰 Monthly Expenses</h1>
      <p>Sign in with your Google account to continue.</p>
      <div ref={buttonRef}></div>
    </div>
  );
}
