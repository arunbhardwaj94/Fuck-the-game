const apiBaseUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

export const API_BASE_URL = apiBaseUrl.replace(/\/$/, '');
export const API = `${API_BASE_URL}/api`;
