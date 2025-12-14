# Algorithm 03: Influence Level Calculation

## Purpose
Combine multiple technique severities into ONE overall score (0-10).

## Why Not Simple Average?

- One severity-9 technique is worse than three severity-3 techniques
- Techniques can amplify each other (fear + urgency = compounding)
- Need to capture both intensity AND quantity

## The Formula

```
Base Score = Highest single technique severity

Amplification:
- 2nd technique adds: severity × 0.3
- 3rd technique adds: severity × 0.2
- 4th+ techniques add: severity × 0.1 each

Combination Multiplier (if these pairs exist):
- Fear + Urgency: ×1.2
- Shame + Identity Attack: ×1.2
- FOMO + False Scarcity: ×1.2

Final = (Base + Amplification) × Multiplier
Cap at 10.
```

## Example

Post has:
- Fear Appeal: severity 7
- False Urgency: severity 5
- Scapegoating: severity 4

```
Base: 7 (highest)
Amplification: (5 × 0.3) + (4 × 0.2) = 1.5 + 0.8 = 2.3
Subtotal: 7 + 2.3 = 9.3
Combination: Fear + Urgency present → ×1.2
Final: 9.3 × 1.2 = 11.16 → Cap at 10

Influence Level: 10 (Critical)
```

## Implementation

```javascript
function calculateInfluenceLevel(techniques) {
  // Edge case: no techniques
  if (!techniques || techniques.length === 0) {
    return 0;
  }
  
  // Sort by severity descending
  const sorted = [...techniques].sort((a, b) => 
    (parseInt(b.severity) || 0) - (parseInt(a.severity) || 0)
  );
  
  // Base = highest
  const base = parseInt(sorted[0].severity) || 0;
  
  // Amplification from additional techniques
  let amplification = 0;
  const weights = [0, 0.3, 0.2, 0.1, 0.1, 0.1]; // index 0 unused
  
  for (let i = 1; i < sorted.length && i < weights.length; i++) {
    amplification += (parseInt(sorted[i].severity) || 0) * weights[i];
  }
  
  // Check for synergistic combinations
  const names = techniques.map(t => t.name.toLowerCase());
  let multiplier = 1.0;
  
  if (names.includes('fear appeal') && names.includes('false urgency')) {
    multiplier = 1.2;
  } else if (names.includes('shame') && names.includes('identity')) {
    multiplier = 1.2;
  } else if (names.includes('fomo') && names.includes('scarcity')) {
    multiplier = 1.2;
  }
  
  // Calculate and cap
  const final = Math.min(10, Math.round((base + amplification) * multiplier));
  
  return final;
}
```

## Labels

| Score | Level | Color |
|-------|-------|-------|
| 0-2 | Low | Green |
| 3-4 | Low-Moderate | Light Yellow |
| 5-6 | Moderate | Yellow |
| 7-8 | High | Orange |
| 9-10 | Critical | Red |

## Edge Cases

1. **Empty array:** Return 0, not NaN
2. **Single technique:** Just use its severity
3. **All low severity:** Amplification won't push past 5
4. **Severity as string:** Use parseInt()

## Verification

Test cases:
- [] → 0
- [{severity: 5}] → 5
- [{severity: 7}, {severity: 5}] → 7 + (5×0.3) = 8.5 → 9
- [{severity: 7}, {severity: 5}] with Fear+Urgency → 9 × 1.2 = 10.8 → 10
