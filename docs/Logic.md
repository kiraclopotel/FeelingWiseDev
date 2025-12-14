# FeelingWise

## Philosophy (Non-Negotiable)
- **Neutralize HOW, not WHAT** - Preserve claims, remove manipulation
- **First-person voice** - "I believe X" stays "I believe X" (just calmer)
- **Child mode = INVISIBLE** - No badges, no indicators. Child doesn't know.
- **"Influence level" not "manipulative"** - Legal defensibility
- **Immunity, not dependence** - Goal is to become unnecessary

## Quick Reference
- Detection: docs/ALGORITHMS/01-technique-detection.md
- Scoring: docs/ALGORITHMS/02-severity-scoring.md
- Neutralization: docs/ALGORITHMS/05-neutralization.md

## Current Work
See docs/TASK_QUEUE.md

## Key Files
- `browser-extension/content-scripts/twitter.js` - Tweet processing
- `browser-extension/content-scripts/common.js` - Shared utilities, Ollama calls
- `browser-extension/popup.js` - Extension popup UI
- `browser-extension/popup.html` - Popup markup

## When Implementing
1. Read the relevant algorithm doc FIRST
2. Do ONE task completely
3. Show verification steps
4. Handle edge cases explicitly
5. Stop and wait for approval before next task

## Coding Standards
- Preserve existing patterns in codebase
- Add error handling for: empty arrays, undefined values, API failures
- Test on: Twitter, Facebook, YouTube
- Console.log for debugging, remove before commit
