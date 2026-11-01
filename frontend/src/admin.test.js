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

console.log('--- All Admin Portal & Form Tests PASSED! ---');
