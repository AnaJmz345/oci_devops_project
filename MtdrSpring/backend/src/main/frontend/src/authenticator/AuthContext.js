import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vantage_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData) => {
    // Normaliza el id sin importar si el backend devuelve oracleId o oracle_id
    const normalized = {
      ...userData,
      oracle_id: userData.oracle_id ?? userData.oracleId ?? null,
    };
    localStorage.setItem('vantage_user', JSON.stringify(normalized));
    setUser(normalized);
  };

  const logout = () => {
    localStorage.removeItem('vantage_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}