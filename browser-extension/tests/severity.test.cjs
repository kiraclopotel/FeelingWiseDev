/**
 * FeelingWise - Severity Scoring Unit Tests
 *
 * Run with: node browser-extension/tests/severity.test.js
 *
 * Tests based on: docs/ALGORITHMS/02-severity-scoring.md
 */

const {
  calculateSeverity,
  calculateTechniqueSeverity,
  assessIntensity,
  assessCentrality,
  assessVulnerability,
  mapToSeverity,
  parseSeverity,
  TECHNIQUE_VULNERABILITY
} = require('../content-scripts/severity.js');

// Simple test runner
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${error.message}`);
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
  }
}

function assertInRange(actual, min, max, message = '') {
  if (actual < min || actual > max) {
    throw new Error(`Expected ${actual} to be in range [${min}, ${max}]. ${message}`);
  }
}

// =============================================================================
// TEST SUITE
// =============================================================================

console.log('\n=== Severity Scoring Tests ===\n');

// -----------------------------------------------------------------------------
console.log('assessIntensity():');
// -----------------------------------------------------------------------------

test('returns 1 for mild content', () => {
  assertEqual(assessIntensity('This could be concerning'), 1);
});

test('returns 2 for single ALL CAPS word', () => {
  assertEqual(assessIntensity('This is DANGEROUS'), 2);
});

test('returns 3 for multiple ALL CAPS words', () => {
  assertEqual(assessIntensity('This is VERY DANGEROUS ALERT'), 3);
});

test('returns 4 for extreme content with many signals', () => {
  // Need 5+ CAPS words (3+ letters each), or 3+ excessive punctuation, or 3+ extreme words
  const extreme = 'WAKE UP!!! Your ENTIRE FAMILY is in MORTAL DANGER!!! ACT NOW!!!';
  assertEqual(assessIntensity(extreme), 4);
});

test('returns 2 for single excessive punctuation', () => {
  assertEqual(assessIntensity('Act now!!'), 2);
});

test('returns 3 for multiple excessive punctuation', () => {
  assertEqual(assessIntensity('Act now!! Do it???'), 3);
});

test('returns 2 for single alarm emoji', () => {
  assertEqual(assessIntensity('Warning \u{1F6A8}'), 2);
});

test('returns 3 for multiple alarm emojis', () => {
  assertEqual(assessIntensity('Warning \u{1F6A8}\u{1F525}'), 3);
});

test('returns 2 for single extreme word', () => {
  assertEqual(assessIntensity('This will destroy everything'), 2);
});

test('handles null/undefined content', () => {
  assertEqual(assessIntensity(null), 1);
  assertEqual(assessIntensity(undefined), 1);
  assertEqual(assessIntensity(''), 1);
});

// -----------------------------------------------------------------------------
console.log('\nassessCentrality():');
// -----------------------------------------------------------------------------

test('returns 1 for single technique', () => {
  assertEqual(assessCentrality(1), 1);
});

test('returns 2 for 2-3 techniques', () => {
  assertEqual(assessCentrality(2), 2);
  assertEqual(assessCentrality(3), 2);
});

test('returns 3 for 4+ techniques', () => {
  assertEqual(assessCentrality(4), 3);
  assertEqual(assessCentrality(10), 3);
});

// -----------------------------------------------------------------------------
console.log('\nassessVulnerability():');
// -----------------------------------------------------------------------------

test('returns 3 for primal fear techniques', () => {
  assertEqual(assessVulnerability('Fear Appeal'), 3);
  assertEqual(assessVulnerability('Shame/Guilt Attack'), 3);
  assertEqual(assessVulnerability('Scapegoating'), 3);
});

test('returns 2 for identity/values techniques', () => {
  assertEqual(assessVulnerability('Anger/Outrage'), 2);
  assertEqual(assessVulnerability('FOMO'), 2);
  assertEqual(assessVulnerability('Bandwagon'), 2);
});

test('returns 1 for general concern techniques', () => {
  assertEqual(assessVulnerability('False Certainty'), 1);
  assertEqual(assessVulnerability('Toxic Positivity'), 1);
  assertEqual(assessVulnerability('Format Issue'), 1);
});

test('returns 1 for unknown technique', () => {
  assertEqual(assessVulnerability('Unknown Technique'), 1);
  assertEqual(assessVulnerability(''), 1);
  assertEqual(assessVulnerability(null), 1);
});

// -----------------------------------------------------------------------------
console.log('\nmapToSeverity():');
// -----------------------------------------------------------------------------

test('maps 3-4 to 1-2 (Low)', () => {
  assertEqual(mapToSeverity(3), 1);
  assertEqual(mapToSeverity(4), 2);
});

test('maps 5-6 to 3-4 (Low-Moderate)', () => {
  assertEqual(mapToSeverity(5), 3);
  assertEqual(mapToSeverity(6), 4);
});

test('maps 7-8 to 5-6 (Moderate)', () => {
  assertEqual(mapToSeverity(7), 5);
  assertEqual(mapToSeverity(8), 6);
});

test('maps 9 to 8 (High)', () => {
  assertEqual(mapToSeverity(9), 8);
});

test('maps 10 to 10 (Critical)', () => {
  assertEqual(mapToSeverity(10), 10);
});

// -----------------------------------------------------------------------------
console.log('\ncalculateSeverity() - Edge Cases:');
// -----------------------------------------------------------------------------

test('returns 0 for empty techniques array', () => {
  assertEqual(calculateSeverity([], 'some content'), 0);
});

test('returns 0 for null techniques', () => {
  assertEqual(calculateSeverity(null, 'some content'), 0);
});

test('returns 0 for undefined techniques', () => {
  assertEqual(calculateSeverity(undefined, 'some content'), 0);
});

test('returns 0 for non-array techniques', () => {
  assertEqual(calculateSeverity('not an array', 'some content'), 0);
  assertEqual(calculateSeverity({}, 'some content'), 0);
});

test('handles techniques as strings', () => {
  const result = calculateSeverity(['Fear Appeal'], 'mild content');
  assertInRange(result, 1, 10);
});

test('handles techniques as objects with name property', () => {
  const result = calculateSeverity([{ name: 'Fear Appeal' }], 'mild content');
  assertInRange(result, 1, 10);
});

test('handles mixed technique formats', () => {
  const techniques = ['Fear Appeal', { name: 'Anger/Outrage' }];
  const result = calculateSeverity(techniques, 'mild content');
  assertInRange(result, 1, 10);
});

// -----------------------------------------------------------------------------
console.log('\ncalculateSeverity() - Real Scenarios:');
// -----------------------------------------------------------------------------

test('mild fear appeal returns low severity (2-3)', () => {
  const result = calculateSeverity(['Fear Appeal'], 'This could be concerning');
  // Intensity: 1 (mild) + Centrality: 1 (single) + Vulnerability: 3 (fear) = 5 → severity 3
  assertInRange(result, 1, 4, `Got ${result}`);
});

test('extreme shame attack returns high severity (8-10)', () => {
  const content = 'REAL mothers would NEVER do this!!! You should be ASHAMED!!!';
  const techniques = ['Shame/Guilt Attack', 'Fear Appeal', 'False Urgency', 'Misleading Formatting'];
  const result = calculateSeverity(techniques, content);
  // Intensity: 4 (extreme) + Centrality: 3 (4+ techniques) + Vulnerability: 3 (shame) = 10 → severity 10
  assertInRange(result, 8, 10, `Got ${result}`);
});

test('moderate manipulation returns mid severity (4-6)', () => {
  const content = 'Everyone knows this is TRUE!! Wake up people!';
  const techniques = ['Bandwagon', 'False Certainty'];
  const result = calculateSeverity(techniques, content);
  // Intensity: 2-3 + Centrality: 2 + Vulnerability: 1-2 = 5-7 → severity 3-5
  assertInRange(result, 3, 6, `Got ${result}`);
});

// -----------------------------------------------------------------------------
console.log('\nparseSeverity():');
// -----------------------------------------------------------------------------

test('parses number correctly', () => {
  assertEqual(parseSeverity(7), 7);
});

test('parses string number correctly', () => {
  assertEqual(parseSeverity('7'), 7);
});

test('clamps to 0-10 range', () => {
  assertEqual(parseSeverity(-5), 0);
  assertEqual(parseSeverity(15), 10);
});

test('returns fallback for null/undefined', () => {
  assertEqual(parseSeverity(null, 5), 5);
  assertEqual(parseSeverity(undefined, 5), 5);
});

test('returns fallback for NaN', () => {
  assertEqual(parseSeverity('not a number', 3), 3);
  assertEqual(parseSeverity(NaN, 3), 3);
});

test('rounds to nearest integer', () => {
  assertEqual(parseSeverity(7.6), 8);
  assertEqual(parseSeverity(7.4), 7);
});

// -----------------------------------------------------------------------------
console.log('\nTECHNIQUE_VULNERABILITY mapping:');
// -----------------------------------------------------------------------------

test('all 10 techniques are mapped', () => {
  const techniques = [
    'Fear Appeal', 'Anger/Outrage', 'Shame/Guilt Attack', 'False Urgency',
    'False Certainty', 'Scapegoating', 'Bandwagon Pressure', 'FOMO',
    'Toxic Positivity', 'Misleading Formatting'
  ];
  techniques.forEach(t => {
    const score = TECHNIQUE_VULNERABILITY[t];
    if (!score) throw new Error(`Missing: ${t}`);
    assertInRange(score, 1, 3, t);
  });
});

// =============================================================================
// RESULTS
// =============================================================================

console.log('\n=== Results ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
