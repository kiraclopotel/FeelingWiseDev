# Algorithm 02: Severity Scoring

## Purpose
Rate each detected technique 1-10 based on how intense/harmful it is.

## The Formula

**Severity = Intensity + Centrality + Vulnerability**

### Factor A: Intensity (1-4 points)
How aggressive is the technique usage?

| Score | Description | Example (Fear Appeal) |
|-------|-------------|----------------------|
| 1 | Mild, almost conversational | "This could be concerning" |
| 2 | Noticeable but not aggressive | "This is a real risk" |
| 3 | Clearly aggressive | "This is DANGEROUS, act now" |
| 4 | Extreme, overwhelming | "Your FAMILY is in MORTAL DANGER!!!" |

### Factor B: Centrality (1-3 points)
How central is this technique to the message?

| Score | Description |
|-------|-------------|
| 1 | Peripheral to the message |
| 2 | Significant part of message |
| 3 | Entire message built on this technique |

### Factor C: Target Vulnerability (1-3 points)
What does it appeal to?

| Score | Description |
|-------|-------------|
| 1 | General concern |
| 2 | Personal identity or values |
| 3 | Primal fears (children, death, survival, belonging) |

## Mapping to 1-10

| Total (3-10) | Severity Rating |
|--------------|-----------------|
| 3-4 | 1-2 (Low) |
| 5-6 | 3-4 (Low-Moderate) |
| 7-8 | 5-6 (Moderate) |
| 9 | 7-8 (High) |
| 10 | 9-10 (Critical) |

## Implementation

```javascript
function calculateSeverity(technique, content) {
  // Intensity: How aggressive?
  const intensity = assessIntensity(technique, content); // 1-4
  
  // Centrality: How central to message?
  const centrality = assessCentrality(technique, content); // 1-3
  
  // Vulnerability: What does it target?
  const vulnerability = assessVulnerability(technique); // 1-3
  
  const total = intensity + centrality + vulnerability; // 3-10
  
  // Map to 1-10 scale
  const severityMap = {
    3: 1, 4: 2,
    5: 3, 6: 4,
    7: 5, 8: 6,
    9: 7, 10: 10
  };
  
  return severityMap[total] || Math.min(total, 10);
}
```

## Edge Cases

1. **Empty techniques array:**
   - Return severity 0
   - Don't calculate average of empty array (NaN)

2. **Severity undefined from AI:**
   - Use parseInt() in case it's a string
   - Default to 5 if unparseable

3. **Multiple techniques:**
   - Each gets its own severity score
   - Overall score uses Algorithm 03 (Influence Calculation)

## Verification

Test cases:
1. Content with 0 techniques → no severity shown
2. Mild fear appeal → severity 2-3
3. Extreme shame attack → severity 8-10
4. AI returns severity as string "7" → parses to 7
