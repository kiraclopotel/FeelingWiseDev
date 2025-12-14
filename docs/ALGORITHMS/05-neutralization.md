# Algorithm 05: Neutralization

## Purpose
Transform manipulative content into calm, honest communication while preserving the original message.

## The Golden Rule

**Same person, just calmer.**

The output should sound like the original speaker on a good day, not like a robot or a news reporter.

## What to PRESERVE

| Element | Keep It |
|---------|---------|
| First-person voice | "I believe X" stays "I believe X" |
| The viewpoint | If they're against X, output is against X |
| The core claim | What they're actually saying |
| All facts | Names, dates, numbers, places |
| Direct address | "you" can stay "you" |

## What to REMOVE

| Element | Remove/Transform |
|---------|------------------|
| Emotional assault | Shame attacks, fear triggers |
| False certainty | "CURES" → "may help" |
| Manipulative formatting | CAPS → normal, !!! → . |
| Alarm emojis | 🚨🔥⚠️ removed |
| Absolutism | "always" → "often", "never" → "rarely" |

## Transformation Rules

### Rule 1: Voice Preservation

❌ WRONG (third-person):
```
Original: "WAKE UP!!! The LEFT wants to DESTROY everything!!!"
Bad: "The author argues that progressive policies pose risks..."
```

✅ RIGHT (first-person):
```
Original: "WAKE UP!!! The LEFT wants to DESTROY everything!!!"
Good: "I believe progressive policies pose significant risks to values you may hold dear."
```

### Rule 2: Certainty Softening

| Original | Neutralized |
|----------|-------------|
| "PROVEN" | "may be supported by" |
| "DESTROYS" | "may significantly harm" |
| "CURES" | "might help with" |
| "Everyone knows" | "Many people believe" |
| "Always" | "Often" |
| "Never" | "Rarely" |

### Rule 3: Source Attribution

Convert hidden opinions to attributed beliefs:
```
Original: "This is destroying our country"
Neutralized: "I believe this policy is harmful to the country"
```

Same claim. But now it's clearly an opinion.

## The AI Prompt

```
You are a content neutralizer. Transform this into calm, honest communication.

RULES:
1. Keep first-person voice ("I believe", "I think")
2. Keep the core claim (what they're actually saying)
3. Keep the viewpoint direction (are they for or against?)
4. Remove emotional assault (shame, fear, anger language)
5. Remove false certainty (absolute claims → hedged claims)
6. Remove manipulative formatting (CAPS → normal, !!! → .)

TEST: Would the original author recognize this as their view expressed calmly?
If no → you changed too much.
If output is bland/empty → you removed the claim (censorship).

Content to neutralize:
"""
{content}
"""

Output ONLY the neutralized text, nothing else.
```

## Examples

### Example 1: Political
```
Original: "🚨 WAKE UP SHEEPLE!!! They're DESTROYING our country!!!"
Neutralized: "I believe current policies may be causing significant harm to our country."
```

### Example 2: Health
```
Original: "Doctors are LYING!!! This fruit CURES cancer!!!"
Neutralized: "I believe there may be health benefits to certain fruits that aren't widely discussed in conventional medicine."
```

### Example 3: Shame
```
Original: "A REAL mother would NEVER feed her kids processed food!!!"
Neutralized: "I believe whole foods may be better for children's health than processed options."
```

## Quality Check

After neutralization, verify:
- [ ] First-person voice preserved?
- [ ] Core claim survives?
- [ ] Viewpoint direction unchanged?
- [ ] Emotional assault removed?
- [ ] Still sounds like a human (not a robot)?
- [ ] Not sanitized into meaninglessness?

## Edge Cases

1. **Content is already calm:** Return unchanged or with minimal edits
2. **Content has no clear claim:** Note this in analysis, minimal transformation
3. **Sarcasm/irony:** Be conservative, may misinterpret
4. **Non-English:** Needs language-specific prompt adaptation
