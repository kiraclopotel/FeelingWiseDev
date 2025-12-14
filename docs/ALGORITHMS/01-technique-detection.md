# Algorithm 01: Technique Detection

## Purpose
Identify which manipulation techniques are present in content.

## The 10 Techniques

| # | Technique | What It Does | Detection Signals |
|---|-----------|--------------|-------------------|
| 1 | **Fear Appeal** | Triggers threat response | "danger", "destroy", "risk", catastrophizing |
| 2 | **Anger/Outrage** | Triggers rage | "outrageous", "unacceptable", "how dare they" |
| 3 | **Shame/Guilt** | Attacks identity | "real [X] would...", "disgusting", "ashamed" |
| 4 | **False Urgency** | Artificial pressure | "act now", "last chance", "before it's too late" |
| 5 | **False Certainty** | Opinion as fact | "proven", "definitely", "100%", "guaranteed" |
| 6 | **Scapegoating** | Group blame | "[group] is responsible", "they want to" |
| 7 | **Bandwagon** | False consensus | "everyone knows", "people are waking up" |
| 8 | **FOMO** | Fear of missing out | "while you sleep", "don't get left behind" |
| 9 | **Toxic Positivity** | Dismisses concerns | "just be happy", "good vibes only" |
| 10 | **Misleading Format** | Visual manipulation | ALL CAPS, !!!, 🚨🔥⚠️ |

## Three-Layer Detection

### Layer 1: Surface Signals (Quick Check)

| Signal | Score |
|--------|-------|
| Multiple ALL CAPS words (3+) | +2 |
| Multiple !!! or ??? | +1 |
| Alarm emojis (🚨🔥⚠️) | +1 each, max +3 |
| "BREAKING", "EXPOSED" | +2 |

If surface score < 3 and no other red flags → likely clean.

### Layer 2: Pattern Matching

| Pattern | Technique | Score |
|---------|-----------|-------|
| "always/never/everyone/no one" | Absolutism | +2 |
| "Either X or Y" | False Dichotomy | +2 |
| "Real [identity] would..." | Identity Attack | +3 |
| "Experts say..." (no source) | False Authority | +2 |
| "Wake up!" | Emotional Imperative | +2 |

### Layer 3: Context Questions

Ask the AI:
1. Is emotional intensity proportionate to actual stakes?
2. Is evidence provided for claims?
3. Is there a call to action that benefits the author?
4. Would a calm person express this same view this way?

## AI Prompt for Detection

```
Analyze this content for manipulation techniques.

For each technique detected, provide:
- name: The technique name
- severity: 1-10 how intense
- evidence: Quote from content showing it

The 10 techniques are:
1. Fear Appeal - threat/danger language
2. Anger/Outrage - inflammatory language
3. Shame/Guilt Attack - identity attacks
4. False Urgency - artificial deadlines
5. False Certainty - opinion as fact
6. Scapegoating - group blame
7. Bandwagon Pressure - false consensus
8. FOMO - fear of missing out
9. Toxic Positivity - dismissing concerns
10. Misleading Formatting - CAPS, !!!, alarm emojis

Content:
"""
{content}
"""

Respond with JSON:
{
  "techniques": [
    {"name": "Fear Appeal", "severity": 7, "evidence": "DESTROY your family"},
    ...
  ]
}

If no manipulation detected, return: {"techniques": []}
```

## Detection Criteria Per Technique

### 1. Fear Appeal
- Threat to safety, family, health, livelihood
- Catastrophizing ("collapse", "destroy", "end of")
- Without proportionate evidence

### 2. Anger/Outrage
- Injustice framing
- Enemy identification
- Demands for action against someone

### 3. Shame/Guilt Attack
- "Real [X] would..."
- "You should be ashamed"
- Attacks on character not behavior

### 4. False Urgency
- Artificial deadlines
- "Last chance" without real scarcity
- Pressure to decide NOW

### 5. False Certainty
- "Proven" without evidence
- "100% guaranteed"
- Complex topics presented as simple facts

### 6. Scapegoating
- Single group blamed for complex problem
- "[They] are responsible for..."
- No acknowledgment of nuance

### 7. Bandwagon
- "Everyone knows..."
- "No one believes..."
- Claimed consensus without data

### 8. FOMO
- "Others are already..."
- "Don't get left behind"
- Comparison to others' success

### 9. Toxic Positivity
- "Just choose to be happy"
- Dismissing legitimate concerns
- Framing negative emotions as failure

### 10. Misleading Formatting
- More than 3 ALL CAPS words
- Multiple !!! or ???
- Alarm emojis (🚨🔥⚠️)

## Edge Cases

1. **Legitimate urgency:** Real deadlines aren't false urgency
2. **News headlines:** "BREAKING" in actual news is OK
3. **Quotes:** Someone quoting manipulation isn't manipulating
4. **Sarcasm:** May look like manipulation but isn't

## Verification

Test with:
- Clean content → 0 techniques
- Mild manipulation → 1-2 techniques, low severity
- Severe manipulation → 3+ techniques, high severity
- Edge cases → appropriate handling
