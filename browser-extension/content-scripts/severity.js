/**
 * FeelingWise - Severity Scoring Algorithm
 *
 * Single source of truth for severity calculation.
 * Based on: docs/ALGORITHMS/02-severity-scoring.md
 *
 * Formula: Severity = Intensity + Centrality + Vulnerability
 */

/**
 * Vulnerability scores per technique type (1-3 points)
 * Higher scores for techniques targeting primal fears
 */
const TECHNIQUE_VULNERABILITY = {
  // Primal fears (3 points)
  'Fear Appeal': 3,
  'Shame/Guilt Attack': 3,
  'Shame/Guilt': 3,
  'Scapegoating': 3,

  // Personal values/identity (2 points)
  'Anger/Outrage': 2,
  'False Urgency': 2,
  'Bandwagon Pressure': 2,
  'Bandwagon': 2,
  'FOMO': 2,

  // General concern (1 point)
  'False Certainty': 1,
  'Toxic Positivity': 1,
  'Misleading Formatting': 1,
  'Misleading Format': 1,
  'Format Issue': 1
};

/**
 * Assess intensity of manipulation (1-4 points)
 * How aggressive is the technique usage?
 *
 * @param {string} content - The original content
 * @returns {number} 1-4 intensity score
 */
function assessIntensity(content) {
  if (!content || typeof content !== 'string') return 1;

  let score = 1;

  // Check for ALL CAPS words (3+ letters)
  const capsWords = (content.match(/\b[A-Z]{3,}\b/g) || []).length;
  if (capsWords >= 5) score = Math.max(score, 4);
  else if (capsWords >= 3) score = Math.max(score, 3);
  else if (capsWords >= 1) score = Math.max(score, 2);

  // Check for excessive punctuation (!! or ??)
  const excessivePunctuation = (content.match(/[!?]{2,}/g) || []).length;
  if (excessivePunctuation >= 3) score = Math.max(score, 4);
  else if (excessivePunctuation >= 2) score = Math.max(score, 3);
  else if (excessivePunctuation >= 1) score = Math.max(score, 2);

  // Check for alarm emojis (🚨🔥⚠️❗‼️)
  const alarmEmojis = (content.match(/[\u{1F6A8}\u{1F525}\u{26A0}\u{2757}\u{203C}]/gu) || []).length;
  if (alarmEmojis >= 3) score = Math.max(score, 4);
  else if (alarmEmojis >= 2) score = Math.max(score, 3);
  else if (alarmEmojis >= 1) score = Math.max(score, 2);

  // Check for extreme/catastrophizing words
  const extremeWords = /\b(destroy|danger|emergency|crisis|catastrophe|mortal|death|die|kill|urgent|immediate|disaster|threat|terror|horrif)/gi;
  const extremeCount = (content.match(extremeWords) || []).length;
  if (extremeCount >= 3) score = Math.max(score, 4);
  else if (extremeCount >= 2) score = Math.max(score, 3);
  else if (extremeCount >= 1) score = Math.max(score, 2);

  return score;
}

/**
 * Assess centrality of manipulation to the message (1-3 points)
 * How much of the message relies on manipulation?
 *
 * @param {number} techniqueCount - Number of techniques detected
 * @returns {number} 1-3 centrality score
 */
function assessCentrality(techniqueCount) {
  if (techniqueCount >= 4) return 3; // Entire message built on manipulation
  if (techniqueCount >= 2) return 2; // Significant part of message
  return 1; // Peripheral to the message
}

/**
 * Assess vulnerability target of a technique (1-3 points)
 * What primal need/fear does it target?
 *
 * @param {string} techniqueName - Name of the technique
 * @returns {number} 1-3 vulnerability score
 */
function assessVulnerability(techniqueName) {
  if (!techniqueName) return 1;
  const normalized = String(techniqueName).trim();
  return TECHNIQUE_VULNERABILITY[normalized] || 1;
}

/**
 * Map raw total (3-10) to final severity rating (1-10)
 * Based on the mapping table in the algorithm doc
 *
 * @param {number} total - Raw total from formula (3-10)
 * @returns {number} Final severity rating (1-10)
 */
function mapToSeverity(total) {
  const severityMap = {
    3: 1,   // Low
    4: 2,   // Low
    5: 3,   // Low-Moderate
    6: 4,   // Low-Moderate
    7: 5,   // Moderate
    8: 6,   // Moderate
    9: 8,   // High
    10: 10  // Critical
  };
  return severityMap[total] || Math.min(Math.max(Math.round(total), 1), 10);
}

/**
 * Calculate severity for a single technique
 *
 * @param {string} techniqueName - Name of the technique
 * @param {string} content - Original content
 * @param {number} totalTechniques - Total number of techniques detected
 * @returns {number} Severity score 1-10
 */
function calculateTechniqueSeverity(techniqueName, content, totalTechniques) {
  const intensity = assessIntensity(content);
  const centrality = assessCentrality(totalTechniques);
  const vulnerability = assessVulnerability(techniqueName);

  const total = intensity + centrality + vulnerability; // Range: 3-10
  return mapToSeverity(total);
}

/**
 * Calculate overall severity from detected techniques
 * Uses the maximum technique severity as the overall score
 *
 * @param {Array} techniques - Array of detected techniques (strings or objects with name property)
 * @param {string} content - Original content
 * @returns {number} Overall severity score 0-10
 */
function calculateSeverity(techniques, content) {
  // Edge case: no techniques detected → severity 0
  if (!techniques || !Array.isArray(techniques) || techniques.length === 0) {
    return 0;
  }

  // Calculate severity for each technique
  const severities = techniques.map(technique => {
    const name = typeof technique === 'string'
      ? technique
      : (technique?.name || 'Unknown');
    return calculateTechniqueSeverity(name, content, techniques.length);
  });

  // Return maximum severity (worst technique determines overall score)
  const maxSeverity = Math.max(...severities);

  // Guard against NaN (edge case: empty severities array after spread)
  if (isNaN(maxSeverity) || maxSeverity === -Infinity) {
    return 0;
  }

  return Math.max(0, Math.min(10, Math.round(maxSeverity)));
}

/**
 * Parse and validate severity from external source (e.g., AI response)
 * Handles string/number conversion and bounds checking
 *
 * @param {*} value - Raw severity value from external source
 * @param {number} fallback - Fallback value if parsing fails (default: 0)
 * @returns {number} Valid severity 0-10
 */
function parseSeverity(value, fallback = 0) {
  if (value === null || value === undefined) return fallback;

  const parsed = typeof value === 'number' ? value : parseInt(String(value), 10);

  if (isNaN(parsed)) return fallback;

  return Math.max(0, Math.min(10, Math.round(parsed)));
}

// Export for service worker (importScripts)
if (typeof self !== 'undefined' && typeof self.FW_Severity === 'undefined') {
  self.FW_Severity = {
    calculateSeverity,
    calculateTechniqueSeverity,
    assessIntensity,
    assessCentrality,
    assessVulnerability,
    mapToSeverity,
    parseSeverity,
    TECHNIQUE_VULNERABILITY
  };
}

// Export for content scripts (window context)
if (typeof window !== 'undefined') {
  window.FW_Severity = {
    calculateSeverity,
    calculateTechniqueSeverity,
    assessIntensity,
    assessCentrality,
    assessVulnerability,
    mapToSeverity,
    parseSeverity,
    TECHNIQUE_VULNERABILITY
  };
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateSeverity,
    calculateTechniqueSeverity,
    assessIntensity,
    assessCentrality,
    assessVulnerability,
    mapToSeverity,
    parseSeverity,
    TECHNIQUE_VULNERABILITY
  };
}
