import axios from 'axios';
import { getAuthToken } from '@/utils/tokenUtils';

// Determine Base URL
// Priority: Vite Env Var -> Default Localhost
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_URL = `${BASE_URL}/api`;

// Create logic to handle tokens
const getToken = () => {
    return getAuthToken();
};

const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token
apiClient.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token && token !== 'cookie_authenticated') {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle Errors (Optional: auto-logout on 401)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Log errors or handle specific status codes globally here
        if (error.response && error.response.status === 401) {
            console.warn('Unauthorized access - potential token expiry');
            // triggers for redirect to login could go here
        }
        return Promise.reject(error);
    }
);

export default apiClient;
