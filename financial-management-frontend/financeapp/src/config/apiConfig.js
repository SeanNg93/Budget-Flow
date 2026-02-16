// Centralized API configuration
// Uses Vite environment variables for production

// API Base URL - uses environment variable or falls back to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// WebSocket URL for notifications
const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

export { API_BASE_URL, WEBSOCKET_URL };

export default {
  API_BASE_URL,
  WEBSOCKET_URL,
  API_URL: `${API_BASE_URL}/api`
};
