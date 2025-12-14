/**
 * FeelingWise Browser Extension - Background Service Worker
 *
 * Handles communication between content scripts and the local Ollama server.
 * Implements caching to avoid redundant AI calls.
 */

const OLLAMA_BASE_URL = 'http://localhost:11434';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache for neutralizations
const cache = new Map();

// =============================================================================
// SEVERITY SCORING ALGORITHM (from docs/ALGORITHMS/02-severity-scoring.md)
// Formula: Severity = Intensity + Centrality + Vulnerability
// =============================================================================

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
 */
function assessCentrality(techniqueCount) {
  if (techniqueCount >= 4) return 3;
  if (techniqueCount >= 2) return 2;
  return 1;
}

/**
 * Assess vulnerability target of a technique (1-3 points)
 */
function assessVulnerability(techniqueName) {
  const normalized = (techniqueName || '').trim();
  return TECHNIQUE_VULNERABILITY[normalized] || 1;
}

/**
 * Map raw total (3-10) to final severity rating (1-10)
 */
function mapToSeverity(total) {
  const severityMap = { 3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 8: 6, 9: 8, 10: 10 };
  return severityMap[total] || Math.min(Math.max(total, 1), 10);
}

/**
 * Calculate overall severity from detected techniques
 */
function calculateSeverity(techniques, content) {
  // Edge case: no techniques
  if (!techniques || !Array.isArray(techniques) || techniques.length === 0) {
    return 0;
  }

  const intensity = assessIntensity(content);
  const centrality = assessCentrality(techniques.length);

  // Calculate severity for each technique, take maximum
  const severities = techniques.map(technique => {
    const name = typeof technique === 'string' ? technique : (technique.name || 'Unknown');
    const vulnerability = assessVulnerability(name);
    const total = intensity + centrality + vulnerability;
    return mapToSeverity(total);
  });

  const maxSeverity = Math.max(...severities);
  return isNaN(maxSeverity) ? 0 : Math.max(0, Math.min(10, Math.round(maxSeverity)));
}

// =============================================================================

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  persona: 'adult', // 'child' | 'teen' | 'adult'
  autoNeutralize: true,
  showIndicators: true
};

// Load settings from storage
async function getSettings() {
  const result = await chrome.storage.sync.get('settings');
  return { ...DEFAULT_SETTINGS, ...result.settings };
}

// Save settings to storage
async function saveSettings(settings) {
  await chrome.storage.sync.set({ settings: { ...DEFAULT_SETTINGS, ...settings } });
}

// Check if Ollama is running
async function checkOllamaStatus() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });

    if (!response.ok) {
      return { running: false, models: [] };
    }

    const data = await response.json();
    const models = (data.models || []).map(m => m.name);

    return {
      running: true,
      models
    };
  } catch (error) {
    return { running: false, models: [], error: error.message };
  }
}

// Get hash for caching
function hashContent(content) {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

// Check cache for existing neutralization
function getCached(content) {
  const hash = hashContent(content);
  const cached = cache.get(hash);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  return null;
}

// Store in cache
function setCache(content, result) {
  const hash = hashContent(content);
  cache.set(hash, {
    result,
    timestamp: Date.now()
  });

  // Limit cache size
  if (cache.size > 1000) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

// Neutralize content using Ollama
async function neutralizeContent(content, persona = 'adult') {
  // Check cache first
  const cached = getCached(content);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  const systemPrompt = `You are a content neutralizer. Transform emotionally manipulative content into calm, honest communication while preserving the original viewpoint and claims.

CRITICAL RULES:
1. PRESERVE first-person voice - "I believe X" stays "I believe X" (calmer)
2. PRESERVE the viewpoint direction (what side they're on)
3. PRESERVE the core claim (what they're actually saying)
4. PRESERVE all factual information (names, dates, numbers)
5. REMOVE emotional assault (shame attacks, fear triggers, anger bait)
6. REMOVE false certainty ("CURES" becomes "may help", "DESTROYS" becomes "may harm")
7. REMOVE manipulative formatting (ALL CAPS to normal, !!! to .)
8. REMOVE alarm emojis (${String.fromCodePoint(0x1F6A8)}${String.fromCodePoint(0x1F525)}${String.fromCodePoint(0x26A0)}${String.fromCodePoint(0xFE0F)}) but keep semantic emojis
9. NEVER add third-person framing like "The author argues..."
10. Output should sound like THE SAME PERSON, just calmer

DETECT THESE 10 MANIPULATION TECHNIQUES:
- Fear Appeal: Triggers threat response ("DESTROY", "DANGER", "your children at risk")
- Anger/Outrage: Triggers rage ("DISGUSTING", "How DARE they")
- Shame/Guilt Attack: Attacks identity ("REAL mothers don't...", "only an IDIOT")
- False Urgency: Artificial time pressure ("ACT NOW", "last chance")
- False Certainty: Speculation as fact ("CURES", "PROVEN", "100%")
- Scapegoating: Blames a group ("THEY are destroying...")
- Bandwagon Pressure: False consensus ("Everyone knows...")
- FOMO: Fear of missing out ("While you're sleeping...")
- Toxic Positivity: Dismisses concerns ("Just be happy!")
- Misleading Formatting: Visual manipulation (ALL CAPS, !!!, alarm emojis)

Respond with JSON only:
{
  "neutralized": "the neutralized text preserving first-person voice",
  "techniques": ["exact technique names from the list above"],
  "severity": 0-10
}`;

  const userPrompt = `Neutralize this text:\n\n${content}`;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'phi3:mini',
        prompt: userPrompt,
        system: systemPrompt,
        stream: false,
        options: {
          temperature: 0.3
        }
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`Ollama responded with ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.response || '';

    // Try to parse JSON from response
    let result;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);

        // Ensure techniques is a valid array
        if (!Array.isArray(result.techniques)) {
          result.techniques = result.techniques ? [result.techniques] : [];
        }

        // Calculate severity using the proper algorithm
        // Formula: Severity = Intensity + Centrality + Vulnerability
        result.severity = calculateSeverity(result.techniques, content);

        // Ensure neutralized exists
        if (!result.neutralized) {
          result.neutralized = content;
        }
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // Fallback: basic neutralization
      const fallbackTechniques = ['Format Issue'];
      result = {
        neutralized: content
          .replace(/[A-Z]{3,}/g, match => match.charAt(0) + match.slice(1).toLowerCase())
          .replace(/!{2,}/g, '.')
          .replace(/\?{2,}/g, '?'),
        techniques: fallbackTechniques,
        severity: calculateSeverity(fallbackTechniques, content)
      };
    }

    // Store in cache
    setCache(content, result);

    return { ...result, fromCache: false };
  } catch (error) {
    console.error('Neutralization error:', error);
    throw error;
  }
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_STATUS') {
    checkOllamaStatus().then(sendResponse);
    return true; // Async response
  }

  if (message.type === 'NEUTRALIZE') {
    getSettings().then(settings => {
      neutralizeContent(message.content, settings.persona)
        .then(async result => {
          // Increment processed count on successful neutralization with techniques found
          if (result.techniques && result.techniques.length > 0) {
            const stored = await chrome.storage.local.get('processedCount');
            const newCount = (stored.processedCount || 0) + 1;
            await chrome.storage.local.set({ processedCount: newCount });
          }
          sendResponse({ success: true, ...result });
        })
        .catch(error => sendResponse({ success: false, error: error.message }));
    });
    return true; // Async response
  }

  if (message.type === 'GET_SETTINGS') {
    getSettings().then(sendResponse);
    return true;
  }

  if (message.type === 'SAVE_SETTINGS') {
    saveSettings(message.settings).then(() => {
      sendResponse({ success: true });
      // Notify all tabs about settings change
      chrome.tabs.query({}, tabs => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED', settings: message.settings }).catch(() => {});
        });
      });
    });
    return true;
  }
});

// Set badge on extension icon based on status
async function updateBadge() {
  const status = await checkOllamaStatus();
  const settings = await getSettings();

  if (!settings.enabled) {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
  } else if (status.running) {
    chrome.action.setBadgeText({ text: '' });
  } else {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
  }
}

// Update badge periodically
setInterval(updateBadge, 30000);
updateBadge();
