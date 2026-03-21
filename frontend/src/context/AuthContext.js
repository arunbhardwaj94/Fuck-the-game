import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bastarmart_token');
    if (token) {
      axios.get(`${API}/admin/verify`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => { setAdmin({ token, email: res.data.email }); })
        .catch(() => { localStorage.removeItem('bastarmart_token'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/admin/login`, { email, password });
    localStorage.setItem('bastarmart_token', res.data.token);
    setAdmin({ token: res.data.token, email: res.data.email });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('bastarmart_token');
    setAdmin(null);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('bastarmart_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
