// Centralized API configuration for Canga Vardiya Sistemi
// This file manages all API endpoints and base URLs

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  // Check if we're in development or production
  if (process.env.NODE_ENV === 'production') {
    // Production environment - use local backend for now
    return process.env.REACT_APP_API_URL || 'http://localhost:5001';
  } else {
    // Development environment - use local backend
    return process.env.REACT_APP_API_URL || 'http://localhost:5001';
  }
};

// Export the base URL
export const API_BASE_URL = getApiBaseUrl();

// Export commonly used API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${API_BASE_URL}/api/users/login`,
  
  // Employees
  EMPLOYEES: `${API_BASE_URL}/api/employees`,
  EMPLOYEES_FORMER: `${API_BASE_URL}/api/employees/former`,
  EMPLOYEES_STATS: `${API_BASE_URL}/api/employees/stats`,
  EMPLOYEES_DEPARTMENTS: `${API_BASE_URL}/api/employees/departments`,
  EMPLOYEES_LOCATIONS: `${API_BASE_URL}/api/employees/locations`,
  EMPLOYEES_TRAINEES: `${API_BASE_URL}/api/employees/trainees-apprentices`,
  
  // Dashboard
  DASHBOARD_STATS: `${API_BASE_URL}/api/dashboard/stats`,
  
  // Shifts
  SHIFTS: `${API_BASE_URL}/api/shifts`,
  
  // Notifications
  NOTIFICATIONS: `${API_BASE_URL}/api/notifications`,
  NOTIFICATIONS_UNREAD: `${API_BASE_URL}/api/notifications/unread-count`,
  NOTIFICATIONS_RECENT: `${API_BASE_URL}/api/notifications/recent`,
  
  // Services
  SERVICES_ROUTES: `${API_BASE_URL}/api/services/routes`,
  
  // Calendar
  CALENDAR_EVENTS: `${API_BASE_URL}/api/calendar/events`,
  CALENDAR_STATS: `${API_BASE_URL}/api/calendar/stats`,
  
  // Excel Operations
  EXCEL_EXPORT: `${API_BASE_URL}/api/excel`,
  EXCEL_EMPLOYEES: `${API_BASE_URL}/api/excel/employees`,
  EXCEL_PASSENGERS: `${API_BASE_URL}/api/excel/passengers/export`,
  EXCEL_SHIFTS: `${API_BASE_URL}/api/excel/export/shift`,
  EXCEL_IMPORT: `${API_BASE_URL}/api/excel/import-employees`,
  
  // Database Management
  DATABASE: `${API_BASE_URL}/api/database`,
  DATABASE_COLLECTION: `${API_BASE_URL}/api/database/collection`,
  
  // Analytics
  ANALYTICS: `${API_BASE_URL}/api/analytics`,
  
  // Annual Leave
  ANNUAL_LEAVE: `${API_BASE_URL}/api/annual-leave`,
  
  // Job Applications
  JOB_APPLICATIONS: `${API_BASE_URL}/api/job-applications`,
  FORM_STRUCTURE: `${API_BASE_URL}/api/form-structure`
};

// Helper function to create fetch with error handling
export const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
};

// Log the current configuration (development only)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Configuration:', {
    baseUrl: API_BASE_URL,
    environment: process.env.NODE_ENV || 'development',
    envVar: process.env.REACT_APP_API_URL || 'not set'
  });
}

export default API_BASE_URL;
