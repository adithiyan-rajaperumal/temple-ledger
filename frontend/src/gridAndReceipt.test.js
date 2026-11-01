import assert from 'node:assert';
import { formatCurrency, formatDate, formatPercentage } from './utils/formatters.js';

console.log('--- Running Master Data Grid, Drive Board & Digital Receipt Tests ---');

// 1. Test CSV Export generator with UTF-8 BOM
console.log('Testing CSV Export generation with UTF-8 BOM...');
function generateCsv(items) {
  const headers = [
    'Date',
    'Flow Type',
    'Reference No',
    'Category (EN)',
    'Category (TA)',
    'Party / Payee / Donor',
    'Village',
    'Payment Mode',
    'Amount (INR)',
    'Notes',
  ];

  const rows = items.map((item) => [
    item.date || '',
    item.flowType || '',
    `"${(item.referenceNo || '').replace(/"/g, '""')}"`,
    `"${(item.category || '').replace(/"/g, '""')}"`,
    `"${(item.categoryTa || '').replace(/"/g, '""')}"`,
    `"${(item.partyName || '').replace(/"/g, '""')}"`,
    `"${(item.village || '').replace(/"/g, '""')}"`,
    item.paymentMode || '',
    item.amount != null ? item.amount : 0,
    `"${(item.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  return '\uFEFF' + csvContent;
}

const mockTransactions = [
  {
    date: '2026-11-01',
    flowType: 'INCOME',
    referenceNo: 'RCT-2026-0001',
    category: 'Village Family Drive',
    categoryTa: 'கிராம குடும்ப பங்களிப்பு',
    partyName: 'K. முருகேசன் (Murugesan)',
    village: 'North Street',
    paymentMode: 'CASH',
    amount: 10000,
    notes: 'Full payment for Drive 1',
  },
  {
    date: '2026-11-02',
    flowType: 'EXPENSE',
    referenceNo: 'VCH-2026-0001',
    category: 'RENOVATION_MATERIALS',
    categoryTa: 'கட்டுமான பொருட்கள்',
    partyName: 'Sri Amman Traders',
    village: null,
    paymentMode: 'GPAY_ONLINE',
    amount: 25000,
    notes: '50 bags cement',
  },
];

const csvOutput = generateCsv(mockTransactions);
assert.ok(csvOutput.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM (\\uFEFF)');
assert.ok(csvOutput.includes('K. முருகேசன்'), 'CSV must preserve Tamil donor name');
assert.ok(csvOutput.includes('கிராம குடும்ப பங்களிப்பு'), 'CSV must preserve Tamil category');
assert.ok(csvOutput.includes('RCT-2026-0001'), 'CSV must include receipt reference');
assert.ok(csvOutput.includes('25000'), 'CSV must include correct amounts');
console.log('✓ CSV Export with UTF-8 BOM verified successfully');

// 2. Test WhatsApp Sharing Link and Text Format
console.log('Testing WhatsApp Share URL generation...');
function generateWhatsAppShareUrl({ donorName, amount, receiptNo, date, origin = 'https://temple.example.com' }) {
  const formattedAmount = formatCurrency(amount);
  const formattedDate = formatDate(date);
  const publicVerifyUrl = `${origin}/receipts/${receiptNo}`;

  const message =
    `வணக்கம் ${donorName}, எங்கள் கோவில் திருப்பணிக்கு உங்கள் அன்பான நன்கொடை ${formattedAmount} வெற்றிகரமாக பெறப்பட்டது.\n` +
    `ரசீது எண்: ${receiptNo}\n` +
    `தேதி: ${formattedDate}\n\n` +
    `Greetings ${donorName}, thank you for your generous contribution of ${formattedAmount} towards our temple renovation.\n` +
    `Receipt No: ${receiptNo}\n` +
    `Date: ${formattedDate}\n\n` +
    `அதிகாரப்பூர்வ ரசீதை காண / Verify Receipt Online:\n${publicVerifyUrl}`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

const waUrl = generateWhatsAppShareUrl({
  donorName: 'Shanmugam',
  amount: 5000,
  receiptNo: 'RCT-2026-0042',
  date: '2026-11-01',
});

assert.ok(waUrl.startsWith('https://wa.me/?text='), 'WhatsApp URL must start with https://wa.me/?text=');
const decodedWaText = decodeURIComponent(waUrl.replace('https://wa.me/?text=', ''));
assert.ok(decodedWaText.includes('வணக்கம் Shanmugam'), 'WhatsApp text must contain Tamil greeting');
assert.ok(decodedWaText.includes('Greetings Shanmugam'), 'WhatsApp text must contain English greeting');
assert.ok(decodedWaText.includes('₹5,000'), 'WhatsApp text must contain formatted amount');
assert.ok(decodedWaText.includes('RCT-2026-0042'), 'WhatsApp text must contain receipt number');
assert.ok(decodedWaText.includes('https://temple.example.com/receipts/RCT-2026-0042'), 'WhatsApp text must contain public verify URL');
console.log('✓ WhatsApp Share URL and bilingual message generation verified successfully');

// 3. Test Drive Progress and Family Filter Logic
console.log('Testing Drive Progress calculations...');
const mockFamilies = [
  { familyCode: 'FAM-001', headName: 'Murugan', headNameTa: 'முருகன்', targetAmount: 10000, paidAmount: 10000, balanceAmount: 0, status: 'PAID', village: 'North Street' },
  { familyCode: 'FAM-002', headName: 'Velu', headNameTa: 'வேலு', targetAmount: 10000, paidAmount: 5000, balanceAmount: 5000, status: 'PARTIAL', village: 'South Street' },
  { familyCode: 'FAM-003', headName: 'Ganesan', headNameTa: 'கணேசன்', targetAmount: 10000, paidAmount: 0, balanceAmount: 10000, status: 'PENDING', village: 'East Street' },
  { familyCode: 'FAM-004', headName: 'Palanisamy', headNameTa: 'பழனிசாமி', targetAmount: 0, paidAmount: 0, balanceAmount: 0, status: 'OPTED_OUT', village: 'West Street' },
];

// Test status filtering
const paidFamilies = mockFamilies.filter(f => f.status === 'PAID');
assert.strictEqual(paidFamilies.length, 1);
assert.strictEqual(paidFamilies[0].familyCode, 'FAM-001');

const partialFamilies = mockFamilies.filter(f => f.status === 'PARTIAL');
assert.strictEqual(partialFamilies.length, 1);
assert.strictEqual(partialFamilies[0].familyCode, 'FAM-002');

// Test search query filtering by Tamil script
const searchQueryTa = 'முருகன்';
const searchResultsTa = mockFamilies.filter(f =>
  (f.headNameTa && f.headNameTa.includes(searchQueryTa)) ||
  (f.headName && f.headName.toLowerCase().includes(searchQueryTa.toLowerCase()))
);
assert.strictEqual(searchResultsTa.length, 1);
assert.strictEqual(searchResultsTa[0].familyCode, 'FAM-001');

// Test search query filtering by street
const searchQueryStreet = 'south';
const searchResultsStreet = mockFamilies.filter(f =>
  f.village && f.village.toLowerCase().includes(searchQueryStreet)
);
assert.strictEqual(searchResultsStreet.length, 1);
assert.strictEqual(searchResultsStreet[0].familyCode, 'FAM-002');

console.log('✓ Drive Progress filtering and search verified successfully');

// 4. Test MasterDataGrid Filter Logic
console.log('Testing Grid Filtering logic...');
function filterGrid(items, { search, flowType, category, paymentMode }) {
  return items.filter(item => {
    if (flowType && flowType !== 'ALL' && item.flowType !== flowType) return false;
    if (category && item.category !== category && item.categoryTa !== category) return false;
    if (paymentMode && item.paymentMode !== paymentMode) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchParty = item.partyName && item.partyName.toLowerCase().includes(q);
      const matchRef = item.referenceNo && item.referenceNo.toLowerCase().includes(q);
      const matchNotes = item.notes && item.notes.toLowerCase().includes(q);
      if (!matchParty && !matchRef && !matchNotes) return false;
    }
    return true;
  });
}

const filteredByIncome = filterGrid(mockTransactions, { flowType: 'INCOME' });
assert.strictEqual(filteredByIncome.length, 1);
assert.strictEqual(filteredByIncome[0].referenceNo, 'RCT-2026-0001');

const filteredBySearch = filterGrid(mockTransactions, { search: 'Amman' });
assert.strictEqual(filteredBySearch.length, 1);
assert.strictEqual(filteredBySearch[0].referenceNo, 'VCH-2026-0001');

console.log('✓ Grid multi-criteria filtering verified successfully');
console.log('--- All Master Data Grid & Digital Receipt tests PASSED! ---');
