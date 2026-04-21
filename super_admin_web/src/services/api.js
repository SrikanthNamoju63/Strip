import axios from 'axios';
import { toast } from 'react-hot-toast';
import { parseApiError } from '../utils/errorHandler';

// Use environment variable with fallback for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:6002/api';

let refreshPromise = null;
let isRefreshing = false;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
});

// Interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Interceptor for global error handling and token refresh
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

        const message = error.response?.data?.msg || error.response?.data?.error || error.message || 'Something went wrong';

        // Fix: Better handling of 401 with token refresh retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (!isRefreshing) {
                isRefreshing = true;
                refreshPromise = api.post('/admin/refresh-token')
                    .then(response => {
                        if (response.data.token) {
                            localStorage.setItem('adminToken', response.data.token);
                            originalRequest.headers['x-auth-token'] = response.data.token;
                            isRefreshing = false;
                            return api(originalRequest);
                        } else {
                            throw new Error('No token in response');
                        }
                    })
                    .catch(() => {
                        localStorage.removeItem('adminToken');
                        window.location.href = '/';
                        isRefreshing = false;
                        toast.error('Session expired. Please login again.');
                        return Promise.reject(error);
                    });
            }

            return refreshPromise.then(() => {
                originalRequest.headers['x-auth-token'] = localStorage.getItem('adminToken');
                return api(originalRequest);
            }).catch(() => {
                localStorage.removeItem('adminToken');
                window.location.href = '/';
                toast.error('Session expired. Please login again.');
                return Promise.reject(error);
            });
        }

        // Handle other errors
        if (error.response?.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/';
            toast.error('Session expired. Please login again.');
        } else if (error.response?.status >= 400 && !originalRequest._retry && !error.config.__noToast) {
            // Show toast for other errors (except cancelled requests)
            const parsedMessage = parseApiError(error);
            if (!parsedMessage.includes('cancelled') && !parsedMessage.includes('aborted') && !parsedMessage.includes('ERR_CANCELED')) {
                toast.error(parsedMessage);
            }
        }

        return Promise.reject(error);
    }
);

export const loginAdmin = async (username, password) => {
    const response = await api.post('/admin/login', { username, password });
    if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
    }
    return response.data;
};

export const logoutAdmin = () => {
    localStorage.removeItem('adminToken');
};

export const getStats = async () => {
    const res = await api.get('/admin/stats');
    return res.data;
};

export const getDoctors = async (params = {}) => {
    let url = '/admin/doctors';
    // If params is a string (legacy support)
    if (typeof params === 'string') {
        url += `?status=${params}`;
    } else {
        // Object params
        const query = new URLSearchParams(params).toString();
        if (query) url += `?${query}`;
    }
    const res = await api.get(url);
    return res.data;
};

export const verifyDoctor = async (id) => {
    const res = await api.post(`/admin/doctors/${id}/verify`, { isVerified: true });
    return res.data;
};

export const verifyBankDetails = async (id, status) => {
    const res = await api.post(`/admin/doctors/${id}/verify-bank`, { status });
    return res.data;
};

export const rejectDoctor = async (id, reason) => {
    const res = await api.post(`/admin/doctors/${id}/reject`, { reason });
    return res.data;
};

export const suspendDoctor = async (id, reason) => {
    const res = await api.post(`/admin/doctors/${id}/suspend`, { reason });
    return res.data;
};

export const revokeVerification = async (id) => {
    const res = await api.post(`/admin/doctors/${id}/revoke`);
    return res.data;
};

export const requestReupload = async (id, message) => {
    const res = await api.post(`/admin/doctors/${id}/reupload`, { message });
    return res.data;
};

export const requestProfileDetails = async (id, message) => {
    const res = await api.post(`/admin/doctors/${id}/request-details`, { message });
    return res.data;
};

export const deleteDoctor = async (id) => {
    const res = await api.delete(`/admin/doctors/${id}`);
    return res.data;
};

export const getUsers = async () => {
    const res = await api.get('/admin/users');
    return res.data;
};

export const getAllAppointments = async () => {
    const res = await api.get('/admin/appointments');
    return res.data;
};

export const getBloodDonations = async () => {
    const res = await api.get('/admin/blood-donations');
    return res.data;
};

export const getAllPayments = async () => {
    const res = await api.get('/admin/payments');
    return res.data;
};

export const getPaymentAnalytics = async (startDate, endDate) => {
    let url = '/payments/analytics/dashboard';
    if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const res = await api.get(url);
    return res.data;
};

export const refundPayment = async (paymentId, reason, refundAmount) => {
    const res = await api.post(`/payments/${paymentId}/refund`, { reason, refundAmount });
    return res.data;
};

export const getRefunds = async (page = 1, limit = 20) => {
    const res = await api.get(`/payments/refunds?page=${page}&limit=${limit}`);
    return res.data;
};

export const getAllSettlements = async () => {
    const res = await api.get('/admin/settlements');
    return res.data;
};

export const getDoctorDetails = async (id) => {
    const res = await api.get(`/admin/doctors/${id}`);
    return res.data;
};

export const getUserDetails = async (id) => {
    const res = await api.get(`/admin/users/${id}`);
    return res.data;
};

export const getAllRatings = async (params = {}) => {
    let url = '/ratings/admin/all';
    const query = new URLSearchParams(params).toString();
    if (query) url += `?${query}`;
    const res = await api.get(url);
    return res.data;
};

export const getUserRatings = async (id) => {
    const res = await api.get(`/ratings/user/${id}`);
    return res.data;
};

export const getAppFeedbackByUser = async (id) => {
    const res = await api.get(`/app-feedback?userId=${id}`);
    return res.data;
};

export const hideRating = async (id) => {
    const res = await api.put(`/ratings/${id}/hide`);
    return res.data;
};

export const deleteRating = async (id) => {
    const res = await api.delete(`/ratings/${id}/admin`);
    return res.data;
};

export const cancelAppointment = async (id, reason, refundPercent) => {
    const res = await api.post(`/admin/appointments/${id}/cancel`, { reason, refundPercent });
    return res.data;
};

export const rescheduleAppointment = async (id, date, time) => {
    const res = await api.post(`/admin/appointments/${id}/reschedule`, { date, time });
    return res.data;
};

export const refundAppointment = async (id, amount, refundId) => {
    const res = await api.post(`/admin/appointments/${id}/refund`, { amount, refundId });
    return res.data;
};


// Finance - Refunds
export const approveRefund = async (id) => {
    const res = await api.post(`/admin/refunds/${id}/approve`);
    return res.data;
};

export const rejectRefund = async (id, reason) => {
    const res = await api.post(`/admin/refunds/${id}/reject`, { reason });
    return res.data;
};

export const getAllRefunds = async () => {
    const res = await api.get('/admin/refunds');
    return res.data;
};

// Finance - Settlements
export const generateSettlement = async (data) => {
    const res = await api.post('/admin/settlements/generate', data);
    return res.data;
};

export const updateSettlementStatus = async (id, status, transactionId) => {
    const res = await api.put(`/admin/settlements/${id}/status`, { status, transactionId });
    return res.data;
};

// Support - Tickets
export const getTickets = async (status = 'all') => {
    const res = await api.get(`/admin/support/tickets?status=${status}`);
    return res.data;
};

export const resolveTicket = async (id) => {
    const res = await api.put(`/admin/support/tickets/${id}/resolve`);
    return res.data;
};

export const replyTicket = async (id, message) => {
    const res = await api.post(`/admin/support/tickets/${id}/reply`, { message });
    return res.data;
};

// Admin Management
export const getAdmins = async () => {
    const res = await api.get('/admin/admins');
    return res.data;
};

export const createAdmin = async (data) => {
    const res = await api.post('/admin/admins', data);
    return res.data;
};

export const updateAdmin = async (id, data) => {
    const res = await api.put(`/admin/admins/${id}`, data);
    return res.data;
};

// Audit Logs
export const getAuditLogs = async () => {
    const res = await api.get('/admin/audit-logs');
    return res.data;
};

// Blood
// Blood
export const getBloodRequests = async (status = 'all') => {
    const res = await api.get(`/admin/blood/requests?status=${status}`);
    return res.data;
};

export const matchDonor = async (requestId, donorId) => {
    const res = await api.post(`/admin/blood/requests/${requestId}/match`, { donorId });
    return res.data;
};

export const getAllDonors = async (bloodGroup) => {
    let url = '/blood/donors';
    if (bloodGroup) url += `?bloodGroup=${bloodGroup}`;
    const res = await api.get(url);
    return res.data;
};

// Notifications
export const sendBroadcast = async (title, message, targetRole) => {
    const res = await api.post('/admin/notifications/broadcast', { title, message, targetRole });
    return res.data;
};

// Settings
export const getSettings = async () => {
    const res = await api.get('/admin/settings');
    return res.data;
};

export const updateSettings = async (settings) => {
    // Assuming backend accepts object or array. 
    // Adapting to likely backend requirement (key/value loop or single object).
    // If backend is `updateSetting` (singular), we might need to loop.
    // But usually global settings update is one endpoints.
    // Let's assume we send object.
    const res = await api.put('/admin/settings', settings);
    return res.data;
};

// Fee Configuration
export const getFeeConfig = async () => {
    const res = await api.get('/fees');
    return res.data;
};

// Advanced Analytics
export const getAdvancedStats = async (dateRange = '30days') => {
    const res = await api.get(`/admin/analytics/advanced?range=${dateRange}`);
    return res.data;
};

export const exportReportData = async (dateRange, format = 'csv') => {
    const res = await api.get(`/admin/analytics/export?range=${dateRange}&format=${format}`, {
        responseType: format === 'pdf' ? 'blob' : 'text'
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report-${new Date().toISOString().split('T')[0]}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.parentElement.removeChild(link);

    return res.data;
};

// System Administration
export const getSystemHealth = async () => {
    const res = await api.get('/admin/system/health');
    return res.data;
};

export const getSystemLogs = async () => {
    const res = await api.get('/admin/system/logs');
    return res.data;
};

export const clearCache = async () => {
    const res = await api.post('/admin/system/cache/clear');
    return res.data;
};

export const backupDatabase = async (password) => {
    const res = await api.post('/admin/system/backup', { password });
    return res.data;
};

export const restoreDatabase = async (backupId, password) => {
    const res = await api.post('/admin/system/restore', { backupId, password });
    return res.data;
};

export const getApiHealth = async () => {
    const res = await api.get('/admin/system/api-health');
    return res.data;
};

export const resetSystem = async (password) => {
    const res = await api.post('/admin/system/reset', { password });
    return res.data;
};

// User Activity Tracking
export const getUserActivity = async (dateRange = '7days') => {
    const res = await api.get(`/admin/activity?range=${dateRange}`);
    return res.data;
};

export const exportActivityLog = async (filterType = 'all', dateRange = '7days') => {
    const res = await api.get(`/admin/activity/export?type=${filterType}&range=${dateRange}`, {
        responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `activity-log-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentElement.removeChild(link);

    return res.data;
};

// Email Management
export const getEmailTemplates = async () => {
    const res = await api.get('/admin/email/templates');
    return res.data;
};

export const createEmailTemplate = async (template) => {
    const res = await api.post('/admin/email/templates', template);
    return res.data;
};

export const sendBroadcastEmail = async (campaign) => {
    const res = await api.post('/admin/email/broadcast', campaign);
    return res.data;
};

export const getEmailHistory = async () => {
    const res = await api.get('/admin/email/history');
    return res.data;
};

// API Monitoring
export const getApiMetrics = async () => {
    const res = await api.get('/admin/monitoring/api-metrics');
    return res.data;
};

export const getEndpointStatus = async () => {
    const res = await api.get('/admin/monitoring/endpoints');
    return res.data;
};

export const updateFeeConfig = async (config) => {
    const res = await api.put('/fees', config); // Changed to PUT and /fees
    return res.data;
};

export const getDoctorAvailableSlots = async (doctorId, date) => {
    const res = await api.get(`/doctors/${doctorId}/slots?date=${date}`);
    return res.data;
};

export const onboardDoctorToRazorpay = async (doctorId) => {
    const res = await api.post('/payments/doctor/onboard', { doctorId });
    return res.data;
};

export default api;


