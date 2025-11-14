import axios from 'axios';

/**
 * Centralized API configuration for Canga Vardiya Sistemi
 * Axios instance with interceptors and error handling
 */

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || 'http://localhost:5001';
  } else {
    return process.env.REACT_APP_API_URL || 'http://localhost:5001';
  }
};

// Export the base URL for direct use
export const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth password if exists (Canga uses password-based auth)
    const password = localStorage.getItem('canga_password');
    if (password) {
      config.headers.adminpassword = password;
    }
    
    // Fallback to JWT token if it exists (for future JWT implementation)
    const token = localStorage.getItem('token');
    if (token && !password) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle errors globally
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data);
      
      if (error.response.status === 401) {
        // Unauthorized - redirect to login
        console.warn('Unauthorized access - redirecting to login');
        // window.location.href = '/';
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Export API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/users/login',
  
  // Employees
  EMPLOYEES: '/api/employees',
  EMPLOYEES_FORMER: '/api/employees/former',
  EMPLOYEES_STATS: '/api/employees/stats',
  EMPLOYEES_DEPARTMENTS: '/api/employees/departments',
  EMPLOYEES_LOCATIONS: '/api/employees/locations',
  EMPLOYEES_TRAINEES: '/api/employees/trainees-apprentices',
  
  // Dashboard
  DASHBOARD_STATS: '/api/dashboard/stats',
  
  // Shifts
  SHIFTS: '/api/shifts',
  
  // Notifications
  NOTIFICATIONS: '/api/notifications',
  NOTIFICATIONS_UNREAD: '/api/notifications/unread-count',
  NOTIFICATIONS_RECENT: '/api/notifications/recent',
  
  // Services
  SERVICES_ROUTES: '/api/services/routes',
  
  // Calendar
  CALENDAR_EVENTS: '/api/calendar/events',
  CALENDAR_STATS: '/api/calendar/stats',
  
  // Excel Operations
  EXCEL_EXPORT: '/api/excel',
  EXCEL_EMPLOYEES: '/api/excel/employees',
  EXCEL_PASSENGERS: '/api/excel/passengers/export',
  EXCEL_SHIFTS: '/api/excel/export/shift',
  EXCEL_IMPORT: '/api/excel/import-employees',
  
  // Annual Leave
  ANNUAL_LEAVE: '/api/annual-leave',
  
  // Job Applications
  JOB_APPLICATIONS: '/api/job-applications',
  FORM_STRUCTURE: '/api/form-structure',
  
  // Attendance & QR
  ATTENDANCE_CHECK_IN: '/api/attendance/check-in',
  ATTENDANCE_CHECK_OUT: '/api/attendance/check-out',
  ATTENDANCE_DAILY: '/api/attendance/daily',
  ATTENDANCE_MONTHLY: '/api/attendance/monthly-report',
  ATTENDANCE_MISSING: '/api/attendance/missing-records',
  ATTENDANCE_IMPORT: '/api/attendance/import-excel',
  ATTENDANCE_EXPORT: '/api/attendance/payroll-export',
  ATTENDANCE_LIVE_STATS: '/api/attendance/live-stats',
  
  // QR/Token
  QR_GENERATE: '/api/attendance-qr/generate',
  QR_GENERATE_BULK: '/api/attendance-qr/generate-bulk',
  QR_SIGNATURE: '/api/attendance-qr/signature',
  QR_SUBMIT: '/api/attendance-qr/submit-signature',
  QR_TODAY_STATUS: '/api/attendance-qr/today-status',
};

// Log configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Configuration:', {
    baseUrl: API_BASE_URL,
    environment: process.env.NODE_ENV || 'development',
    envVar: process.env.REACT_APP_API_URL || 'not set'
  });
}

// Export axios instance as default
export default api;
