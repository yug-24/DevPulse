import {
  createContext, useContext, useEffect,
  useReducer, useCallback, useRef,
} from 'react';
import { authApi, getErrorMessage } from '../utils/api';

// ── State shape ───────────────────────────────────────────────
const initialState = {
  user:       null,
  isLoading:  true,   // true during initial session restore
  isLoggedIn: false,
  error:      null,
};

// ── Reducer ───────────────────────────────────────────────────
const reducer = (state, action) => {
  switch (action.type) {
    case 'RESTORE_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return { ...state, isLoading: false, isLoggedIn: true, user: action.payload, error: null };
    case 'AUTH_FAILURE':
      return { ...state, isLoading: false, isLoggedIn: false, user: null, error: action.payload };
    case 'LOGOUT':
      return { ...state, isLoading: false, isLoggedIn: false, user: null, error: null };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
};

// ── Context ───────────────────────────────────────────────────
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const restoredRef = useRef(false);

  // ── Restore session on mount ──────────────────────────────
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const restore = async () => {
      dispatch({ type: 'RESTORE_START' });
      try {
        const { data } = await authApi.me();
        dispatch({ type: 'AUTH_SUCCESS', payload: data.data.user });
      } catch {
        // No valid session — user needs to connect GitHub
        dispatch({ type: 'AUTH_FAILURE', payload: null });
      }
    };
    restore();
  }, []);

  // ── Listen for 401 from axios interceptor ────────────────
  useEffect(() => {
    const handle = () => dispatch({ type: 'LOGOUT' });
    window.addEventListener('auth:unauthorized', handle);
    return () => window.removeEventListener('auth:unauthorized', handle);
  }, []);

  // ── Actions ───────────────────────────────────────────────

  // Redirect to GitHub OAuth — full page navigation
  const loginWithGitHub = useCallback(() => {
    const loginUrl = authApi.loginUrl();
    window.location.href = loginUrl;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* best effort */ }
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateUser = useCallback((updates) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
  }, []);

  // Called after OAuth redirect succeeds — re-fetch user
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      dispatch({ type: 'AUTH_SUCCESS', payload: data.data.user });
      return data.data.user;
    } catch (err) {
      dispatch({ type: 'AUTH_FAILURE', payload: getErrorMessage(err) });
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        loginWithGitHub,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export default AuthContext;
