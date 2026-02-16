// Centralized API Configuration
// Use environment variable in production, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

export { API_BASE_URL, WEBSOCKET_URL };
