import axios from 'axios';
import { toast } from 'react-hot-toast';
import { parseApiError } from '../utils/errorHandler';

// Use environment variable with fallback for development
const API_URL = 'http://localhost:6002/api';
// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let refreshPromise = null;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
});

// Flag to prevent infinite refresh loops
let isRefreshing = false;

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const originalRequest = error.config;

        // Handle network errors
        if (!error.response) {
            if (error.code === 'ECONNABORTED') {
                toast.error('Request timed out. Please try again.');
            } else if (error.code === 'ERR_NETWORK') {
                toast.error('Network error. Please check your connection.');
            } else {
                toast.error('Unable to connect to server.');
            }
            return Promise.reject(error);
        }

        // Fix: Better error handling for 401 with retry logic
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Prevent infinite loop if refresh itself fails
            if (originalRequest.url === '/session/refresh' || originalRequest.url.includes('/session/refresh')) {
                return Promise.reject(error);
            }

            // Only retry once to prevent infinite loops
            originalRequest._retry = true;

            // If not already refreshing, try to refresh token
            if (!isRefreshing) {
                isRefreshing = true;
                refreshPromise = api.post('/session/refresh')
                    .then(response => {
                        if (response.data.token) {
                            localStorage.setItem('token', response.data.token);
                            // Retry the original request with new token
                            originalRequest.headers['Authorization'] = `Bearer ${response.data.token}`;
                            isRefreshing = false;
                            return api(originalRequest);
                        } else {
                            throw new Error('No token in refresh response');
                        }
                    })
                    .catch(() => {
                        // Token refresh failed, clear auth
                        localStorage.removeItem('token');
                        if (!window.location.pathname.includes('/login')) {
                            window.location.href = '/login';
                        }
                        isRefreshing = false;
                        toast.error('Session expired. Please login again.');
                        return Promise.reject(error);
                    });
            }

            // If already refreshing, wait for it to complete
            return refreshPromise.then(() => {
                originalRequest.headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
                return api(originalRequest);
            }).catch(() => {
                localStorage.removeItem('token');
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
                toast.error('Session expired. Please login again.');
                return Promise.reject(error);
            });
        }

        // For 401 on /me endpoint or logout, redirect to login
        if (error.response?.status === 401 || (error.response?.status === 404 && error.config.url.includes('/me'))) {
            localStorage.removeItem('token');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }

        // Show toast for other errors (except cancelled requests)
        if (error.response?.status >= 400 && !originalRequest._retry && !error.config.__noToast) {
            const message = parseApiError(error);
            if (!message.includes('cancelled') && !message.includes('aborted')) {
                toast.error(message);
            }
        }

        return Promise.reject(error);
    }
);

export const loginPlugin = async (email, password) => {
    const res = await api.post('/auth/login-doctor', { email, password });
    if (res.data.token) {
        localStorage.setItem('token', res.data.token);
    }
    return res.data;
};

export const logoutPlugin = () => {
    localStorage.removeItem('token');
};

export const getDoctorProfile = async () => {
    // Assuming the user is a doctor and we want their profile
    // For now, let's just use the /users/me endpoint or specific doctor endpoint if created
    const res = await api.get('/doctors/me');
    return res.data;
};

export const getDoctorAppointments = async (doctorId, date) => {
    let url = `/appointments/doctor/${doctorId}`;
    if (date) {
        url += `?date=${date}`;
    }
    const res = await api.get(url);
    return res.data;
};

export const updateDoctorProfile = async (data) => {
    const res = await api.put('/doctors/me', data);
    return res.data;
};

export const uploadGalleryImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post('/doctors/upload-gallery-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
};

export const onboardDoctorToRazorpay = async () => {
    // This endpoint triggers Razorpay account creation/linking
    const res = await api.post('/doctors/onboard-razorpay');
    return res.data;
};

export const scanAppointment = async (data) => {
    const res = await api.post('/appointments/scan', data);
    return res.data;
};

export const getDoctorRatings = async (doctorId, page = 1, limit = 10) => {
    const res = await api.get(`/ratings/doctor/${doctorId}?page=${page}&limit=${limit}`);
    return res.data;
};

export const respondToRating = async (ratingId, text) => {
    const res = await api.post(`/ratings/${ratingId}/respond`, { text });
    return res.data;
};

export const getDoctorSettlements = async (page = 1, limit = 10) => {
    const res = await api.get(`/doctors/settlements?page=${page}&limit=${limit}`);
    return res.data;
};

// ===== APPOINTMENT MANAGEMENT =====
export const getAppointmentById = async (appointmentId) => {
    const res = await api.get(`/appointments/${appointmentId}`);
    return res.data;
};
export const addConsultationNotes = async (appointmentId, consultationNotes) => {
    const res = await api.post(`/appointments/${appointmentId}/consultation-notes`, {
        consultationNotes
    });
    return res.data;
};

export const addPrescriptions = async (appointmentId, prescriptions) => {
    const res = await api.post(`/appointments/${appointmentId}/prescriptions`, {
        prescriptions
    });
    return res.data;
};

export const completeAppointment = async (appointmentId, data) => {
    const res = await api.post(`/appointments/${appointmentId}/complete`, data);
    return res.data;
};

export const getDoctorStats = async (doctorId, period = '30days') => {
    const res = await api.get(`/appointments/doctor/${doctorId}/stats?period=${period}`);
    return res.data;
};

// ===== HEALTH ANALYSIS =====
export const getDoctorHealthAnalysis = async (status = 'pending', page = 1, limit = 10) => {
    const res = await api.get(`/doctors/health-analysis/list?status=${status}&page=${page}&limit=${limit}`);
    return res.data;
};

export const updateHealthAnalysis = async (analysisId, data) => {
    const res = await api.put(`/doctors/health-analysis/${analysisId}`, data);
    return res.data;
};

// ===== PATIENT RECORDS =====
export const getPatientRecords = async (userId) => {
    const res = await api.get(`/doctors/patients/${userId}/records`);
    return res.data;
};

// ===== NOTIFICATIONS =====
export const getDoctorNotifications = async (page = 1, limit = 20, unreadOnly = false) => {
    const res = await api.get(`/doctors/notifications/list?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`);
    return res.data;
};

export const markNotificationAsRead = async (notificationId) => {
    const res = await api.put(`/doctors/notifications/${notificationId}/read`);
    return res.data;
};

// ===== STAFF MANAGEMENT =====
export const getDoctorStaff = async () => {
    const res = await api.get('/doctors/me/staff');
    return res.data;
};

export const addDoctorStaff = async (staffData) => {
    const res = await api.post('/doctors/me/staff', staffData);
    return res.data;
};

export const deleteDoctorStaff = async (staffId) => {
    const res = await api.delete(`/doctors/me/staff/${staffId}`);
    return res.data;
};

export const updateDoctorStaff = async (staffId, staffData) => {
    const res = await api.put(`/doctors/me/staff/${staffId}`, staffData);
    return res.data;
};

export default api;

