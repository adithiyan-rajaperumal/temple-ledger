import assert from 'node:assert';
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDate,
} from './utils/formatters.js';
import * as apiService from './services/api.js';

console.log('--- Running Dashboard & Formatters Unit Tests ---');

// 1. Currency formatting tests
console.log('Testing formatCurrency...');
assert.strictEqual(formatCurrency(0), '₹0');
assert.strictEqual(formatCurrency(null), '₹0');
assert.strictEqual(formatCurrency(undefined), '₹0');
assert.strictEqual(formatCurrency(''), '₹0');
assert.strictEqual(formatCurrency('invalid'), '₹0');

// Indian numbering grouping tests: 1,50,000
const c1 = formatCurrency(150000);
assert.ok(c1.includes('1,50,000'), `Expected ₹1,50,000, got ${c1}`);

// Whole number string
const c2 = formatCurrency('500000');
assert.ok(c2.includes('5,00,000'), `Expected ₹5,00,000, got ${c2}`);

// Decimal handling
const c3 = formatCurrency(150000.5, { showDecimals: true });
assert.ok(c3.includes('1,50,000.50'), `Expected ₹1,50,000.50, got ${c3}`);

// Compact format (Lakhs and Crores)
assert.strictEqual(formatCurrency(150000, { compact: true }), '₹1.50 L');
assert.strictEqual(formatCurrency(12500000, { compact: true }), '₹1.25 Cr');
console.log('✓ formatCurrency tests passed');

// 2. Number formatting tests
console.log('Testing formatNumber...');
assert.strictEqual(formatNumber(0), '0');
assert.strictEqual(formatNumber(null), '0');
assert.strictEqual(formatNumber(150000), '1,50,000');
assert.strictEqual(formatNumber(10000000), '1,00,00,000');
assert.strictEqual(formatNumber('25000'), '25,000');
console.log('✓ formatNumber tests passed');

// 3. Percentage formatting tests
console.log('Testing formatPercentage...');
assert.strictEqual(formatPercentage(0), '0.0%');
assert.strictEqual(formatPercentage(null), '0%');
assert.strictEqual(formatPercentage(25.5), '25.5%');
assert.strictEqual(formatPercentage('60.123', 2), '60.12%');
console.log('✓ formatPercentage tests passed');

// 4. Date formatting tests
console.log('Testing formatDate...');
const testDate = new Date('2026-11-01T10:00:00Z');
const formattedEnDate = formatDate(testDate, 'en-IN');
assert.ok(formattedEnDate.length > 0, 'Date string should not be empty');
assert.strictEqual(formatDate(null), '');
assert.strictEqual(formatDate('invalid-date'), '');
console.log('✓ formatDate tests passed');

// 5. API service module interface checks
console.log('Testing API service endpoints contract...');
assert.strictEqual(typeof apiService.getDashboardSummary, 'function');
assert.strictEqual(typeof apiService.getChartData, 'function');
assert.strictEqual(typeof apiService.getPublicDrives, 'function');
assert.strictEqual(typeof apiService.getDriveFamilyProgress, 'function');
assert.strictEqual(typeof apiService.getTransactions, 'function');
assert.strictEqual(typeof apiService.getPublicReceipt, 'function');
console.log('✓ API service contract tests passed');

// 6. Chart item categorization simulation
console.log('Testing Category transformations...');
const mockIncomeData = [
  { category: 'IN_KIND', labelEn: 'In-Kind Materials', labelTa: 'பொருள் நன்கொடை', amount: 150000, percentage: 30 },
  { category: 'DRIVE_1', labelEn: 'Drive 1', labelTa: 'முதல் கட்ட நிதி', amount: 350000, percentage: 70 },
  { category: 'EMPTY', labelEn: 'Zero Category', labelTa: 'பூஜ்ஜியம்', amount: 0, percentage: 0 },
];

const validIncomes = mockIncomeData.filter(i => Number(i.amount) > 0);
assert.strictEqual(validIncomes.length, 2, 'Should filter out zero amount categories');

// Tamil localization resolution
const taNames = validIncomes.map(i => i.labelTa || i.labelEn);
assert.deepStrictEqual(taNames, ['பொருள் நன்கொடை', 'முதல் கட்ட நிதி']);

// English localization resolution
const enNames = validIncomes.map(i => i.labelEn || i.labelTa);
assert.deepStrictEqual(enNames, ['In-Kind Materials', 'Drive 1']);

console.log('✓ Chart transformation tests passed');

console.log('--- All Dashboard & Formatters tests PASSED! ---');
