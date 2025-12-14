/**
 * FeelingWise - Severity Scoring Algorithm
 *
 * Based on: docs/ALGORITHMS/02-severity-scoring.md
 * Formula: Severity = Intensity + Centrality + Vulnerability
 */

/**
 * Vulnerability scores per technique type
 * Higher scores for techniques targeting primal fears
 */
const TECHNIQUE_VULNERABILITY = {
  'Fear Appeal': 3,        // Targets primal survival instincts
  'Anger/Outrage': 2,      // Targets personal values
  'Shame/Guilt Attack': 3, // Attacks identity - very harmful
  'Shame/Guilt': 3,        // Alias
  'False Urgency': 2,      // Targets decision-making
  'False Certainty': 1,    // General concern
  'Scapegoating': 3,       // Group blame, targets belonging
  'Bandwagon Pressure': 2, // Targets belonging need
  'Bandwagon': 2,          // Alias
  'FOMO': 2,               // Fear of missing out
  'Toxic Positivity': 1,   // Dismisses concerns
  'Misleading Formatting': 1, // Visual manipulation
  'Misleading Format': 1,  // Alias
  'Format Issue': 1        // Fallback
};

/**
 * Assess intensity of manipulation (1-4 points)
 * How aggressive is the technique usage?
 *
 * @param {string} content - The original content
 * @returns {number} 1-4 intensity score
 */
function assessIntensity(content) {
  let score = 1;

  // Check for ALL CAPS words (3+ letters)
  const capsWords = (content.match(/\b[A-Z]{3,}\b/g) || []).length;
  if (capsWords >= 5) score = Math.max(score, 4);
  else if (capsWords >= 3) score = Math.max(score, 3);
  else if (capsWords >= 1) score = Math.max(score, 2);

  // Check for excessive punctuation
  const excessivePunctuation = (content.match(/[!?]{2,}/g) || []).length;
  if (excessivePunctuation >= 3) score = Math.max(score, 4);
  else if (excessivePunctuation >= 2) score = Math.max(score, 3);
  else if (excessivePunctuation >= 1) score = Math.max(score, 2);

  // Check for alarm emojis
  const alarmEmojis = (content.match(/[\u{1F6A8}\u{1F525}\u{26A0}\u{2757}\u{203C}]/gu) || []).length;
  if (alarmEmojis >= 3) score = Math.max(score, 4);
  else if (alarmEmojis >= 2) score = Math.max(score, 3);
  else if (alarmEmojis >= 1) score = Math.max(score, 2);

  // Check for extreme words
  const extremeWords = /\b(destroy|danger|emergency|crisis|catastrophe|mortal|death|die|kill|urgent|immediate)\b/gi;
  const extremeCount = (content.match(extremeWords) || []).length;
  if (extremeCount >= 3) score = Math.max(score, 4);
  else if (extremeCount >= 2) score = Math.max(score, 3);
  else if (extremeCount >= 1) score = Math.max(score, 2);

  return score;
}

/**
 * Assess centrality of technique to the message (1-3 points)
 * How much of the message relies on this technique?
 *
 * @param {string} content - The original content
 * @param {number} techniqueCount - Number of techniques detected
 * @returns {number} 1-3 centrality score
 */
function assessCentrality(content, techniqueCount) {
  // If many techniques detected, manipulation is central to message
  if (techniqueCount >= 4) return 3;
  if (techniqueCount >= 2) return 2;
  return 1;
}

/**
 * Assess vulnerability target of a technique (1-3 points)
 * What does it appeal to?
 *
 * @param {string} techniqueName - Name of the technique
 * @returns {number} 1-3 vulnerability score
 */
function assessVulnerability(techniqueName) {
  // Normalize technique name for lookup
  const normalized = techniqueName.trim();
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
    3: 1,
    4: 2,
    5: 3,
    6: 4,
    7: 5,
    8: 6,
    9: 8,  // High
    10: 10 // Critical
  };

  return severityMap[total] || Math.min(Math.max(total, 1), 10);
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
  const intensity = assessIntensity(content);           // 1-4
  const centrality = assessCentrality(content, totalTechniques); // 1-3
  const vulnerability = assessVulnerability(techniqueName);      // 1-3

  const total = intensity + centrality + vulnerability; // 3-10

  return mapToSeverity(total);
}

/**
 * Calculate overall severity from detected techniques
 * Uses the maximum technique severity as the overall score
 *
 * @param {Array} techniques - Array of detected techniques (strings or objects)
 * @param {string} content - Original content
 * @param {number|null} aiSeverity - AI-provided severity (optional fallback)
 * @returns {number} Overall severity score 0-10
 */
function calculateOverallSeverity(techniques, content, aiSeverity = null) {
  // Edge case: no techniques detected
  if (!techniques || !Array.isArray(techniques) || techniques.length === 0) {
    return 0;
  }

  // Calculate severity for each technique
  const severities = techniques.map(technique => {
    const name = typeof technique === 'string' ? technique : (technique.name || 'Unknown');
    return calculateTechniqueSeverity(name, content, techniques.length);
  });

  // Return maximum severity (worst technique determines score)
  const maxSeverity = Math.max(...severities);

  // Validate result
  if (isNaN(maxSeverity) || maxSeverity === null || maxSeverity === undefined) {
    // Fall back to AI severity or default
    const fallback = typeof aiSeverity === 'number' ? aiSeverity :
                     typeof aiSeverity === 'string' ? parseInt(aiSeverity, 10) : 5;
    return isNaN(fallback) ? 5 : Math.max(0, Math.min(10, fallback));
  }

  return Math.max(0, Math.min(10, Math.round(maxSeverity)));
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateOverallSeverity,
    calculateTechniqueSeverity,
    assessIntensity,
    assessCentrality,
    assessVulnerability,
    TECHNIQUE_VULNERABILITY
  };
}

// Export for browser context
if (typeof window !== 'undefined') {
  window.FW_Severity = {
    calculateOverallSeverity,
    calculateTechniqueSeverity,
    assessIntensity,
    assessCentrality,
    assessVulnerability,
    TECHNIQUE_VULNERABILITY
  };
}
