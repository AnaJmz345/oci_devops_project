import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const loadCurrentUser = async () => {
    try {
      const response = await fetch('/users/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const currentUser = await response.json();
        setUser(currentUser);
        return currentUser;
      }

      setUser(null);
      return null;
    } catch (error) {
      console.error('Error loading current user:', error);
      setUser(null);
      return null;
    } finally {
      setLoadingAuth(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const login = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/oci';
  };

  const logout = () => {
    localStorage.removeItem('vantage_user');
    setUser(null);
    window.location.href = '/logout';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loadingAuth,
        loadCurrentUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}