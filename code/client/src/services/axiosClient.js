import axios from 'axios';
import { updateAccessToken, logout } from '../store/slices/authSlice.js';

let storeRef = null;

export const injectStore = (store) => {
  storeRef = store;
};

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.request.use(
  (config) => {
    const token = storeRef?.getState()?.auth?.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh-token')
      ) {
        return Promise.reject(error.response?.data || error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data?.data?.accessToken;
        if (newAccessToken && storeRef) {
          storeRef.dispatch(updateAccessToken(newAccessToken));
        }

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (storeRef) {
          storeRef.dispatch(logout());
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default axiosClient;
