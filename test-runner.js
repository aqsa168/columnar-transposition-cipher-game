/**
 * test-runner.js - Standalone test runner for Cipher Grid logic
 */

const Cipher = require('./cipher.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${message}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✘ FAIL\x1b[0m: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  assert(actualStr === expectedStr, `${message} (Expected: ${expectedStr}, Got: ${actualStr})`);
}

console.log('\n--- Running Cipher Grid Unit Tests ---\n');

// 1. Key Alphabetical Ranking Tests
console.log('1. Key Alphabetical Ranking:');
assertEqual(
  Cipher.getKeyRanks('ZEBRAS'),
  [6, 3, 2, 4, 1, 5],
  'Key "ZEBRAS" ranks properly'
);

assertEqual(
  Cipher.getKeyRanks('BANANA'),
  [4, 1, 5, 2, 6, 3],
  'Key "BANANA" handles repeated letters with left-to-right tie-breaking'
);

assertEqual(
  Cipher.getKeyRanks('CAT'),
  [2, 1, 3],
  'Key "CAT" ranks properly'
);

assertEqual(
  Cipher.getKeyRanks('TIGER'),
  [5, 3, 2, 1, 4],
  'Key "TIGER" ranks properly'
);

// 2. Grid Dimensions and Capacities
console.log('\n2. Grid Dimensions and Column Capacities:');
const dims15_6 = Cipher.calculateGridDimensions(15, 6);
assertEqual(dims15_6.numRows, 3, '15 letters / 6 cols gives 3 rows');
assertEqual(dims15_6.remainder, 3, '15 letters / 6 cols gives remainder 3');
assertEqual(dims15_6.colLengths, [3, 3, 3, 2, 2, 2], 'Columns 0-2 have 3 letters, 3-5 have 2 letters');
assertEqual(dims15_6.isFull, [true, true, true, false, false, false], 'isFull flags correctly set');

const dims9_3 = Cipher.calculateGridDimensions(9, 3);
assertEqual(dims9_3.remainder, 0, '9 letters / 3 cols has remainder 0 (perfect rectangle)');
assertEqual(dims9_3.colLengths, [3, 3, 3], 'All columns have 3 letters');
assertEqual(dims9_3.isFull, [true, true, true], 'All columns marked full');

// 3. User Prompt Example Verification
console.log('\n3. Exact Prompt Example Verification:');
const exampleResult = Cipher.encryptColumnar('WEAREDISCOVERED', 'ZEBRAS');
assertEqual(
  exampleResult.ciphertext,
  'EVACDESERODEWIR',
  'WEAREDISCOVERED + ZEBRAS produces exact EVACDESERODEWIR'
);

const exampleDecrypt = Cipher.decryptColumnar('EVACDESERODEWIR', 'ZEBRAS');
assertEqual(
  exampleDecrypt.plaintext,
  'WEAREDISCOVERED',
  'Decrypting EVACDESERODEWIR with ZEBRAS restores WEAREDISCOVERED'
);

// 4. Round-Trip Tests Across Various Levels and Edge Cases
console.log('\n4. Round-Trip Tests:');
const testCases = [
  { text: 'SECRETMEN', key: 'CAT', label: 'Level 1: 3-letter key perfect rectangle' },
  { text: 'MEETATDAWN', key: 'BIRD', label: 'Level 2: 4-letter key with 2 full and 2 short cols' },
  { text: 'TREASUREISBURIED', key: 'TIGER', label: 'Level 3: 5-letter key with 1 full col' },
  { text: 'DEFENDTHEEASTWALL', key: 'BANANA', label: 'Level 4: 6-letter key with repeated letters' },
  { text: 'MISSIONACCOMPLISHEDRETREATNOW', key: 'MYSTERY', label: 'Level 5: 7-letter key with repeated Y' },
  { text: 'ATTACKATDAWN', key: 'A', label: 'Single-letter key' },
  { text: 'SHORT', key: 'LONGERKEYWORD', label: 'Message shorter than key' }
];

testCases.forEach(({ text, key, label }) => {
  const enc = Cipher.encryptColumnar(text, key);
  const dec = Cipher.decryptColumnar(enc.ciphertext, key);
  assertEqual(dec.plaintext, Cipher.normalizeText(text), `Round-trip for ${label}`);
});

// 5. Crib Checking Tests
console.log('\n5. Crib Checking:');
assert(Cipher.checkCrib('WEAREDISCOVERED', 'DISCOVER'), 'Finds "DISCOVER" in plaintext');
assert(Cipher.checkCrib('MISSIONACCOMPLISHED', 'ACCOMPLISH'), 'Finds "ACCOMPLISH" in plaintext');
assert(!Cipher.checkCrib('EVACDESERODEWIR', 'DISCOVER'), 'Does not find "DISCOVER" in scrambled ciphertext');

// Summary
console.log(`\n---------------------------------------`);
console.log(`Total: ${totalTests} | Passed: \x1b[32m${passedTests}\x1b[0m | Failed: \x1b[31m${failedTests}\x1b[0m`);
if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32mAll unit tests passed successfully!\x1b[0m\n');
}
