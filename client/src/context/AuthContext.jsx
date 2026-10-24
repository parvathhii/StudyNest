
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('studynest_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem('studynest_token') || null
  );

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('studynest_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('studynest_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('studynest_token', token);
    } else {
      localStorage.removeItem('studynest_token');
    }
  }, [token]);

  const register = async (name, email, password) => {
    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
      });

      const data = response.data;
      const authToken = data.token || data.accessToken;
      const authUser = data.user || data;

      if (!authToken) {
        throw new Error(
          data.message || 'Registration succeeded, but no token was returned.'
        );
      }

      setUser(authUser);
      setToken(authToken);

      return data;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const data = response.data;
      const authToken = data.token || data.accessToken;
      const authUser = data.user || data;

      if (!authToken) {
        throw new Error(data.message || 'No authentication token returned.');
      }

      setUser(authUser);
      setToken(authToken);

      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('studynest_user');
    localStorage.removeItem('studynest_token');
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token),
    register,
    login,
    logout,
    setUser,
    setToken,
    setLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;
