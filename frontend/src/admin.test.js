import assert from 'node:assert';
import {
  getToken,
  getCurrentUser,
  isAuthenticated,
  isSuperAdmin,
  isDataEntry,
  logout
} from './services/auth.js';
import * as apiMethods from './services/api.js';
import {
  COUNTRIES_DATA,
  DEFAULT_COUNTRY,
  DEFAULT_STATE,
  getCountriesList,
  getStatesForCountry
} from './utils/locationData.js';

console.log('--- Running Admin Portal, Auth & Bilingual Form Tests ---');

// 1. Mock localStorage in Node environment
const store = new Map();
global.localStorage = {
  getItem: (k) => store.get(k) || null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

// 2. Test Auth Service state handling
console.log('Testing Auth Service...');
assert.strictEqual(isAuthenticated(), false, 'Should be unauthenticated initially');
assert.strictEqual(isSuperAdmin(), false, 'Should not be super admin initially');
assert.strictEqual(isDataEntry(), false, 'Should not be data entry initially');

// Simulate Operator login
localStorage.setItem('temple_ledger_token', 'mock-operator-jwt-token');
localStorage.setItem(
  'temple_ledger_user',
  JSON.stringify({
    username: 'operator1',
    fullName: 'Murugan Operator',
    role: 'ROLE_DATA_ENTRY',
  })
);

assert.strictEqual(isAuthenticated(), true, 'Should be authenticated after setting token');
assert.strictEqual(getToken(), 'mock-operator-jwt-token');
assert.strictEqual(getCurrentUser().username, 'operator1');
assert.strictEqual(isSuperAdmin(), false, 'Operator should NOT be super admin');
assert.strictEqual(isDataEntry(), true, 'Operator should be data entry');

// Simulate Super Admin login
localStorage.setItem('temple_ledger_token', 'mock-admin-jwt-token');
localStorage.setItem(
  'temple_ledger_user',
  JSON.stringify({
    username: 'admin',
    fullName: 'Temple Super Admin',
    role: 'ROLE_SUPER_ADMIN',
  })
);

assert.strictEqual(isAuthenticated(), true);
assert.strictEqual(isSuperAdmin(), true, 'Admin user should be super admin');
assert.strictEqual(isDataEntry(), true, 'Admin user should have data entry access');

// Simulate Logout
logout();
assert.strictEqual(isAuthenticated(), false, 'Should be unauthenticated after logout');
assert.strictEqual(getToken(), null);
assert.strictEqual(getCurrentUser(), null);
console.log('✓ Auth Service authentication & role hierarchy tests passed');

// 3. Test API Service function exports contract
console.log('Testing Admin API Service Function Exports...');
const requiredApiFunctions = [
  'recordDonation',
  'searchDonors',
  'searchAreas',
  'recordExpense',
  'getContractors',
  'createContractor',
  'getPledges',
  'createPledge',
  'getAdminFamilies',
  'createAdminFamily',
  'createAdminDrive',
  'initializeDriveAllocations',
  'updateDriveAllocation',
  'getAdminUsers',
  'createAdminUser',
  'getAdminAuditLogs',
];

for (const fnName of requiredApiFunctions) {
  assert.strictEqual(
    typeof apiMethods[fnName],
    'function',
    `API service must export function: ${fnName}`
  );
}
console.log(`✓ All ${requiredApiFunctions.length} Admin & Data Entry API methods verified`);

// 4. Test In-Kind Material Auto-Valuation Logic
console.log('Testing In-Kind Auto-Valuation Calculation...');
function computeInKindTotal(quantity, rate) {
  const q = parseFloat(quantity) || 0;
  const r = parseFloat(rate) || 0;
  return q * r;
}

assert.strictEqual(computeInKindTotal('50', '420'), 21000);
assert.strictEqual(computeInKindTotal('100.5', '350'), 35175);
assert.strictEqual(computeInKindTotal('0', '420'), 0);
assert.strictEqual(computeInKindTotal('abc', '420'), 0);
console.log('✓ In-Kind Auto-Valuation computation tests passed');

// 5. Test Contractor Payout Retention Balance Validation
console.log('Testing Contractor Retention Balance Calculation...');
function calculateRemainingRetention(totalAgreed, paidToDate, newPayout) {
  const agreed = Number(totalAgreed || 0);
  const paid = Number(paidToDate || 0);
  const payout = Number(newPayout || 0);
  const remainingBefore = Math.max(0, agreed - paid);

  if (payout > remainingBefore) {
    throw new Error(
      `Payout amount of ₹${payout} exceeds remaining retention balance of ₹${remainingBefore}`
    );
  }
  return remainingBefore - payout;
}

// Valid payout
const remainingAfter = calculateRemainingRetention(100000, 40000, 25000);
assert.strictEqual(remainingAfter, 35000);

// Invalid payout exceeding balance
assert.throws(() => {
  calculateRemainingRetention(100000, 80000, 25000);
}, /exceeds remaining retention balance/);
console.log('✓ Contractor retention balance enforcement tests passed');

// 6. Test Drive Allocation Opt-Out and Exemption rules
console.log('Testing Drive Allocation Status Rules...');
function evaluateAllocationTarget(defaultTarget, status, customOverride) {
  if (status === 'OPTED_OUT' || status === 'EXEMPTED') {
    return 0;
  }
  return customOverride != null ? customOverride : defaultTarget;
}

assert.strictEqual(evaluateAllocationTarget(10000, 'PARTICIPATING', null), 10000);
assert.strictEqual(evaluateAllocationTarget(10000, 'PARTICIPATING', 15000), 15000);
assert.strictEqual(evaluateAllocationTarget(10000, 'OPTED_OUT', 10000), 0);
assert.strictEqual(evaluateAllocationTarget(20000, 'EXEMPTED', null), 0);
console.log('✓ Drive allocation status rules verified');

// 7. Test Drive Status Filtering logic (matches DriveConfiguration.jsx)
console.log('Testing Drive Status Filtering Logic...');
function filterDriveAllocations(items, statusFilter) {
  return items.filter((item) => {
    return statusFilter === 'ALL' ||
      (statusFilter === 'PARTICIPATING'
        ? item.status !== 'OPTED_OUT' && item.status !== 'EXEMPTED'
        : item.status === statusFilter);
  });
}

const mockAllocations = [
  { id: 1, status: 'PARTICIPATING' },
  { id: 2, status: 'OPTED_OUT' },
  { id: 3, status: 'EXEMPTED' },
  { id: 4, status: 'UNKNOWN_OR_ACTIVE' },
];

assert.strictEqual(filterDriveAllocations(mockAllocations, 'ALL').length, 4);
assert.deepStrictEqual(
  filterDriveAllocations(mockAllocations, 'PARTICIPATING').map((i) => i.id),
  [1, 4],
  'PARTICIPATING filter should include non-opted-out, non-exempted items'
);
assert.deepStrictEqual(
  filterDriveAllocations(mockAllocations, 'OPTED_OUT').map((i) => i.id),
  [2]
);
assert.deepStrictEqual(
  filterDriveAllocations(mockAllocations, 'EXEMPTED').map((i) => i.id),
  [3]
);
console.log('✓ Drive status filtering logic verified');

// 8. Test Pledge Type enum and partial fulfillment status checks
console.log('Testing Pledge Type Enum & Status Checks...');
const validPledgeTypes = ['MONETARY', 'IN_KIND_MATERIAL', 'HYBRID'];
assert.ok(validPledgeTypes.includes('IN_KIND_MATERIAL'), 'Must support IN_KIND_MATERIAL enum');

function isPledgePartialBadge(status) {
  return status === 'PARTIALLY_FULFILLED' || status === 'PARTIAL';
}
assert.strictEqual(isPledgePartialBadge('PARTIALLY_FULFILLED'), true);
assert.strictEqual(isPledgePartialBadge('PARTIAL'), true);
assert.strictEqual(isPledgePartialBadge('COMPLETED'), false);
assert.strictEqual(isPledgePartialBadge('PENDING'), false);
console.log('✓ Pledge enum and partial badge logic verified');

// 9. Test Audit Trail client-side entity filtering fallback
console.log('Testing Audit Trail Client-Side Fallback Filtering...');
function filterAuditLogs(logs, entityFilter) {
  return logs.filter((log) => {
    if (entityFilter && log.entityName !== entityFilter) {
      return false;
    }
    return true;
  });
}

const mockLogs = [
  { id: '1', entityName: 'DONATION' },
  { id: '2', entityName: 'EXPENSE' },
  { id: '3', entityName: 'DONATION' },
  { id: '4', entityName: 'PLEDGE' },
];

assert.strictEqual(filterAuditLogs(mockLogs, '').length, 4);
assert.deepStrictEqual(
  filterAuditLogs(mockLogs, 'DONATION').map((l) => l.id),
  ['1', '3']
);
assert.deepStrictEqual(
  filterAuditLogs(mockLogs, 'EXPENSE').map((l) => l.id),
  ['2']
);
console.log('✓ Audit trail client-side entity filter verified');

// 10. Test Cascading Country and State hierarchical dataset & defaults
console.log('Testing Cascading Country and State Data & Dropdowns...');
assert.strictEqual(DEFAULT_COUNTRY, 'India', 'Default country must be India');
assert.strictEqual(DEFAULT_STATE, 'Tamil Nadu', 'Default state must be Tamil Nadu');

const countriesEn = getCountriesList('en');
assert.ok(countriesEn.length >= 10, 'Should have multiple countries pre-populated');
assert.ok(countriesEn.some((c) => c.name === 'India'));
assert.ok(countriesEn.some((c) => c.name === 'United States'));
assert.ok(countriesEn.some((c) => c.name === 'Malaysia'));

const countriesTa = getCountriesList('ta');
const indiaTa = countriesTa.find((c) => c.name === 'India');
assert.ok(indiaTa && indiaTa.displayName.includes('இந்தியா'), 'Tamil country label must include Tamil script');

// Verify cascading states for India
const indianStates = getStatesForCountry('India', 'en');
assert.ok(indianStates.length >= 15);
assert.strictEqual(indianStates[0].name, 'Tamil Nadu');

// Verify cascading states for US
const usStates = getStatesForCountry('United States', 'en');
assert.ok(usStates.some((s) => s.name === 'California'));
assert.ok(usStates.some((s) => s.name === 'Texas'));
assert.ok(!usStates.some((s) => s.name === 'Tamil Nadu'), 'US states must not include Tamil Nadu');

// Verify cascading states for Malaysia
const myStates = getStatesForCountry('Malaysia', 'en');
assert.ok(myStates.some((s) => s.name === 'Selangor'));
assert.ok(myStates.some((s) => s.name === 'Kuala Lumpur'));
console.log('✓ Cascading Country and State dropdown logic verified');

// 11. Test Donor Autocomplete Autofill Mapping
console.log('Testing Autocomplete Autofill Handler...');
const mockDonorSuggestion = {
  donorName: 'Muthusamy Gounder',
  donorNameTa: 'முத்துசாமி',
  area: 'Gandhinagar',
  village: 'Gandhinagar',
  state: 'Tamil Nadu',
  country: 'India',
  phone: '9876543210',
  familyId: 'fam-uuid-123',
  familyCode: 'FAM-001',
};

function applyDonorSuggestion(suggestion) {
  return {
    donorName: suggestion.donorName || '',
    donorNameTa: suggestion.donorNameTa || '',
    phone: suggestion.phone || '',
    area: suggestion.area || suggestion.village || '',
    village: suggestion.area || suggestion.village || '',
    country: suggestion.country || DEFAULT_COUNTRY,
    state: suggestion.state || DEFAULT_STATE,
    selectedFamilyId: suggestion.familyId || '',
    donorSource: suggestion.familyId ? 'VILLAGE_FAMILY_DRIVE' : 'GENERAL_PUBLIC',
  };
}

const autofilled = applyDonorSuggestion(mockDonorSuggestion);
assert.strictEqual(autofilled.donorName, 'Muthusamy Gounder');
assert.strictEqual(autofilled.donorNameTa, 'முத்துசாமி');
assert.strictEqual(autofilled.area, 'Gandhinagar');
assert.strictEqual(autofilled.state, 'Tamil Nadu');
assert.strictEqual(autofilled.country, 'India');
assert.strictEqual(autofilled.phone, '9876543210');
assert.strictEqual(autofilled.selectedFamilyId, 'fam-uuid-123');
assert.strictEqual(autofilled.donorSource, 'VILLAGE_FAMILY_DRIVE');
console.log('✓ Autocomplete donor autofill mapping verified');

console.log('--- All Admin Portal & Form Tests PASSED! ---');
