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

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('temple_ledger_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore localStorage errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to format errors consistently and handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('temple_ledger_token');
        localStorage.removeItem('temple_ledger_user');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('temple-ledger-auth-change'));
        }
      } catch {
        // ignore
      }
    }

    const errorMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject(new Error(errorMsg));
  }
);

/* ----------------- Public Endpoints ----------------- */

/**
 * Fetch aggregated KPI metrics for the public dashboard.
 */
export async function getDashboardSummary() {
  const response = await api.get('/public/dashboard/summary');
  return response.data;
}

/**
 * Fetch chart categorization data (incomes, expenses, and net cashflow).
 */
export async function getChartData() {
  const response = await api.get('/public/dashboard/charts');
  return response.data;
}

/**
 * Fetch list of active and completed public drives.
 */
export async function getPublicDrives() {
  const response = await api.get('/public/drives');
  return response.data;
}

/**
 * Fetch detailed family progress for a specific drive.
 */
export async function getDriveFamilyProgress(driveId) {
  const response = await api.get(`/public/drives/${driveId}/families`);
  return response.data;
}

/**
 * Fetch filterable, paginated transactions grid.
 */
export async function getTransactions(params = {}) {
  const response = await api.get('/public/transactions', { params });
  return response.data;
}

/**
 * Fetch a single public receipt by its receipt number.
 */
export async function getPublicReceipt(receiptNo) {
  const response = await api.get(`/public/receipts/${receiptNo}`);
  return response.data;
}

/* ----------------- Data Entry Endpoints ----------------- */

/**
 * Record a new monetary or in-kind donation.
 */
export async function recordDonation(data) {
  const response = await api.post('/donations', data);
  return response.data;
}

/**
 * Search previous donors for autocomplete.
 */
export async function searchDonors(query) {
  const response = await api.get('/donations/donors/search', { params: { query } });
  return response.data;
}

/**
 * Search previous areas for autocomplete.
 */
export async function searchAreas(query) {
  const response = await api.get('/donations/areas/search', { params: { query } });
  return response.data;
}

/**
 * Record a new renovation or operating expense voucher.
 */
export async function recordExpense(data) {
  const response = await api.post('/expenses', data);
  return response.data;
}

/**
 * List registered contractors.
 */
export async function getContractors() {
  const response = await api.get('/contractors');
  return response.data;
}

/**
 * Register a new contractor.
 */
export async function createContractor(data) {
  const response = await api.post('/contractors', data);
  return response.data;
}

/**
 * List registered devotee pledges.
 */
export async function getPledges() {
  const response = await api.get('/pledges');
  return response.data;
}

/**
 * Create a new devotee pledge.
 */
export async function createPledge(data) {
  const response = await api.post('/pledges', data);
  return response.data;
}

/* ----------------- Super Admin Endpoints ----------------- */

/**
 * List all master families.
 */
export async function getAdminFamilies() {
  const response = await api.get('/admin/families');
  return response.data;
}

/**
 * Create a new family in the master directory.
 */
export async function createAdminFamily(data) {
  const response = await api.post('/admin/families', data);
  return response.data;
}

/**
 * Create a new drive.
 */
export async function createAdminDrive(data) {
  const response = await api.post('/admin/drives', data);
  return response.data;
}

/**
 * Initialize family allocations for a drive from the master families.
 */
export async function initializeDriveAllocations(driveId) {
  const response = await api.post(`/admin/drives/${driveId}/initialize`);
  return response.data;
}

/**
 * Update family allocation status or target amount for a drive.
 */
export async function updateDriveAllocation(driveId, familyId, data) {
  const response = await api.patch(
    `/admin/drives/${driveId}/allocations/${familyId}`,
    data
  );
  return response.data;
}

/**
 * List all users (Super Admin only).
 */
export async function getAdminUsers() {
  const response = await api.get('/admin/users');
  return response.data;
}

/**
 * Create a new operator or admin user.
 */
export async function createAdminUser(data) {
  const response = await api.post('/admin/users', data);
  return response.data;
}

/**
 * List audit logs with pagination and search.
 */
export async function getAdminAuditLogs(params = {}) {
  const response = await api.get('/admin/audit-logs', { params });
  return response.data;
}

export default api;
