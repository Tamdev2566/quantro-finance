import React, { useState, useLayoutEffect } from 'react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';

const STORAGE_KEY = 'quantro_active_route';

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

export const setPersistedRoute = (path) => {
  try {
    if (path && path !== '/login' && path !== '/') {
      sessionStorage.setItem(STORAGE_KEY, path);
      localStorage.setItem(STORAGE_KEY, path);
    }
  } catch (e) {}
};

export const clearPersistedRoute = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
};

const initialRoute = getPersistedRoute();

export const history = createMemoryHistory({
  initialEntries: [initialRoute],
  initialIndex: 0
});

history.listen(({ location }) => {
  const fullPath = location.pathname + (location.search || '') + (location.hash || '');
  if (fullPath && fullPath !== '/login') {
    setPersistedRoute(fullPath);
  }
});

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
