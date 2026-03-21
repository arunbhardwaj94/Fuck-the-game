import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const UserContext = createContext();
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('bastarmart_user_token');
    if (token) {
      axios.get(`${API}/user/verify`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => { setUser({ ...res.data.user, token }); })
        .catch(() => { localStorage.removeItem('bastarmart_user_token'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signup = async (name, email, password, phone) => {
    const res = await axios.post(`${API}/user/signup`, { name, email, password, phone });
    localStorage.setItem('bastarmart_user_token', res.data.token);
    setUser({ ...res.data.user, token: res.data.token });
    return res.data;
  };

  const login = async (email, password) => {
    const res = await axios.post(`${API}/user/login`, { email, password });
    localStorage.setItem('bastarmart_user_token', res.data.token);
    setUser({ ...res.data.user, token: res.data.token });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('bastarmart_user_token');
    setUser(null);
    setAddresses([]);
  };

  const resetPassword = async (email, newPassword) => {
    const res = await axios.post(`${API}/user/reset-password`, { email, new_password: newPassword });
    return res.data;
  };

  const updateProfile = async (data) => {
    const token = localStorage.getItem('bastarmart_user_token');
    const res = await axios.put(`${API}/user/profile`, data, { headers: { Authorization: `Bearer ${token}` } });
    setUser(prev => ({ ...prev, ...res.data.user }));
    return res.data;
  };

  const fetchAddresses = useCallback(async () => {
    const token = localStorage.getItem('bastarmart_user_token');
    if (!token) return;
    try {
      const res = await axios.get(`${API}/user/addresses`, { headers: { Authorization: `Bearer ${token}` } });
      setAddresses(res.data.addresses || []);
    } catch (e) { console.error('Failed to fetch addresses'); }
  }, []);

  const addAddress = async (addressData) => {
    const token = localStorage.getItem('bastarmart_user_token');
    const res = await axios.post(`${API}/user/addresses`, addressData, { headers: { Authorization: `Bearer ${token}` } });
    setAddresses(res.data.addresses || []);
    return res.data;
  };

  const deleteAddress = async (addressId) => {
    const token = localStorage.getItem('bastarmart_user_token');
    const res = await axios.delete(`${API}/user/addresses/${addressId}`, { headers: { Authorization: `Bearer ${token}` } });
    setAddresses(res.data.addresses || []);
    return res.data;
  };

  const getUserHeaders = () => {
    const token = localStorage.getItem('bastarmart_user_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <UserContext.Provider value={{ user, loading, signup, login, logout, resetPassword, updateProfile, addresses, fetchAddresses, addAddress, deleteAddress, getUserHeaders }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
