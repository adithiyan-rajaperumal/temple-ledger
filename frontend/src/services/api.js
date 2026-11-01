import axios from 'axios';

/**
 * Base API client configuration.
 * Uses VITE_API_URL if configured, otherwise falls back to local Vite proxy `/api/v1`.
 */
const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_API_URL) ||
  '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Response interceptor to format errors consistently
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject(new Error(errorMsg));
  }
);

/**
 * Fetch aggregated KPI metrics for the public dashboard.
 * @returns {Promise<DashboardSummaryResponse>}
 */
export async function getDashboardSummary() {
  const response = await api.get('/public/dashboard/summary');
  return response.data;
}

/**
 * Fetch chart categorization data (incomes, expenses, and net cashflow).
 * @returns {Promise<ChartDataResponse>}
 */
export async function getChartData() {
  const response = await api.get('/public/dashboard/charts');
  return response.data;
}

/**
 * Fetch list of active and completed public drives.
 * @returns {Promise<Array>}
 */
export async function getPublicDrives() {
  const response = await api.get('/public/drives');
  return response.data;
}

/**
 * Fetch detailed family progress for a specific drive.
 * @param {string} driveId
 * @returns {Promise<Object>}
 */
export async function getDriveFamilyProgress(driveId) {
  const response = await api.get(`/public/drives/${driveId}/families`);
  return response.data;
}

/**
 * Fetch filterable, paginated transactions grid.
 * @param {Object} [params]
 * @returns {Promise<Object>}
 */
export async function getTransactions(params = {}) {
  const response = await api.get('/public/transactions', { params });
  return response.data;
}

/**
 * Fetch a single public receipt by its receipt number.
 * @param {string} receiptNo
 * @returns {Promise<Object>}
 */
export async function getPublicReceipt(receiptNo) {
  const response = await api.get(`/public/receipts/${receiptNo}`);
  return response.data;
}

export default api;
