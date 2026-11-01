import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import i18next from 'i18next';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- Running i18n & Bilingual Localization Tests ---');

// 1. Verify translation files exist
const enPath = path.resolve(__dirname, 'locales/en.json');
const taPath = path.resolve(__dirname, 'locales/ta.json');

assert.ok(fs.existsSync(enPath), 'en.json should exist');
assert.ok(fs.existsSync(taPath), 'ta.json should exist');

const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
const ta = JSON.parse(fs.readFileSync(taPath, 'utf-8'));

console.log('✓ Successfully loaded en.json and ta.json');

// 2. Helper to extract all key paths from an object
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(currentPath);
      keys = keys.concat(getAllKeys(value, currentPath));
    } else {
      keys.push(currentPath);
    }
  }
  return keys;
}

const enKeys = new Set(getAllKeys(en));
const taKeys = new Set(getAllKeys(ta));

// 3. Verify key parity between en and ta
const missingInTa = [...enKeys].filter(k => !taKeys.has(k));
const missingInEn = [...taKeys].filter(k => !enKeys.has(k));

assert.strictEqual(
  missingInTa.length,
  0,
  `Keys missing in Tamil translation: ${missingInTa.join(', ')}`
);
assert.strictEqual(
  missingInEn.length,
  0,
  `Keys missing in English translation: ${missingInEn.join(', ')}`
);
console.log(`✓ 100% key parity verified (${enKeys.size} translation paths matching perfectly)`);

// 4. Verify required core navigation keys
const requiredNavKeys = ['appTitle', 'dashboard', 'drives', 'transactions', 'login'];
for (const key of requiredNavKeys) {
  assert.ok(en[key] || (en.nav && en.nav[key]), `Missing required nav key: ${key} in en.json`);
  assert.ok(ta[key] || (ta.nav && ta.nav[key]), `Missing required nav key: ${key} in ta.json`);
}
console.log('✓ Required Nav keys verified');

// 5. Verify required core metric keys
const requiredMetricKeys = [
  'spendableCash',
  'totalIncome',
  'totalExpense',
  'inKindValue',
  'pendingBalance'
];
for (const key of requiredMetricKeys) {
  assert.ok(en[key] || (en.metrics && en.metrics[key]), `Missing required metric key: ${key} in en.json`);
  assert.ok(ta[key] || (ta.metrics && ta.metrics[key]), `Missing required metric key: ${key} in ta.json`);
}
console.log('✓ Required Metric keys verified');

// 6. Verify required categories
const requiredCategories = [
  'renovationMaterials',
  'labourWages',
  'contractPayout',
  'collectionTravel',
  'poojaRitual',
  'villageDrive',
  'generalDevotee',
  'inKindMaterial'
];
for (const key of requiredCategories) {
  assert.ok(en[key] || (en.categories && en.categories[key]), `Missing required category: ${key} in en.json`);
  assert.ok(ta[key] || (ta.categories && ta.categories[key]), `Missing required category: ${key} in ta.json`);
}
console.log('✓ Required Category keys verified');

// 7. Verify buttons and statuses
const requiredButtonsAndStatuses = [
  'filter',
  'search',
  'export',
  'downloadReceipt',
  'shareWhatsApp',
  'paid',
  'partial',
  'pending'
];
for (const key of requiredButtonsAndStatuses) {
  assert.ok(
    en[key] || (en.buttons && en.buttons[key]) || (en.statuses && en.statuses[key]),
    `Missing required button/status: ${key} in en.json`
  );
  assert.ok(
    ta[key] || (ta.buttons && ta.buttons[key]) || (ta.statuses && ta.statuses[key]),
    `Missing required button/status: ${key} in ta.json`
  );
}
console.log('✓ Required Buttons & Statuses verified');

// 8. Verify Tamil script characters exist in Tamil translations
const tamilRegex = /[\u0B80-\u0BFF]/;
assert.ok(
  tamilRegex.test(ta.appTitle || ta.nav.appTitle),
  'Tamil title must contain Tamil script Unicode characters'
);
assert.ok(
  tamilRegex.test(ta.spendableCash || ta.metrics.spendableCash),
  'Tamil spendableCash must contain Tamil script Unicode characters'
);
console.log('✓ Tamil Unicode script presence validated');

// 9. Verify dynamic i18next switching
await i18next.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    ta: { translation: ta }
  }
});

// Test English translations
assert.strictEqual(i18next.t('appTitle'), 'Temple & Community Ledger');
assert.strictEqual(i18next.t('metrics.spendableCash'), 'Spendable Cash & Bank Balance');
assert.strictEqual(i18next.t('categories.renovationMaterials'), 'Renovation Materials');

// Switch to Tamil
await i18next.changeLanguage('ta');
assert.strictEqual(i18next.t('appTitle'), 'கோவில் & கிராம பேரேடு');
assert.strictEqual(i18next.t('metrics.spendableCash'), 'கையிருப்பு ரொக்கம் & வங்கி இருப்பு');
assert.strictEqual(i18next.t('categories.renovationMaterials'), 'கட்டுமான பொருட்கள்');

// Switch back to English
await i18next.changeLanguage('en');
assert.strictEqual(i18next.t('appTitle'), 'Temple & Community Ledger');
assert.strictEqual(i18next.t('metrics.spendableCash'), 'Spendable Cash & Bank Balance');

console.log('✓ Dynamic language switching (EN <-> தமிழ்) verified successfully');
console.log('--- All i18n tests PASSED! ---');
