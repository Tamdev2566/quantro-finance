import React, { useState, useLayoutEffect } from 'react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';

const STORAGE_KEY = 'quantro_active_route';

/**
 * Determine the initial route upon page reload/refresh.
 * Prevents memory history from falling back to empty '/' or losing the current screen.
 */
export const getPersistedRoute = () => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (saved && saved !== '/' && saved !== '/login') {
      return saved;
    }
    const user = localStorage.getItem('apex_user');
    return user ? '/dashboard' : '/login';
  } catch (e) {
    return '/dashboard';
  }
};

/**
 * Save active route to storage so it survives browser refresh.
 */
export const setPersistedRoute = (path) => {
  try {
    if (path && path !== '/login' && path !== '/') {
      sessionStorage.setItem(STORAGE_KEY, path);
      localStorage.setItem(STORAGE_KEY, path);
    }
  } catch (e) {}
};

/**
 * Clear persisted route on logout
 */
export const clearPersistedRoute = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
};

// Create memory history instance initialized with the persisted route
const initialRoute = getPersistedRoute();

export const history = createMemoryHistory({
  initialEntries: [initialRoute],
  initialIndex: 0
});

// Continuously sync history changes to storage
history.listen(({ location }) => {
  const fullPath = location.pathname + (location.search || '') + (location.hash || '');
  if (fullPath && fullPath !== '/login') {
    setPersistedRoute(fullPath);
  }
});

/**
 * Custom HistoryRouter component bridging the `history` package memory history with react-router-dom
 */
export function HistoryRouter({ history: historyInstance = history, children }) {
  const [state, setState] = useState({
    action: historyInstance.action,
    location: historyInstance.location
  });

  useLayoutEffect(() => {
    return historyInstance.listen(setState);
  }, [historyInstance]);

  return (
    <Router
      navigator={historyInstance}
      navigationType={state.action}
      location={state.location}
    >
      {children}
    </Router>
  );
}

export default history;
