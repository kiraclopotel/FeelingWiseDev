# FeelingWise Task Queue

## Current Phase: Phase 1 - UI Polish & Core Fixes ✅ COMPLETE

**Currently Working On:** Phase 2 ready

---

## Phase 1: UI Polish & Core Fixes ✅

- [x] **Task 1: Fix NaN/10 Severity Bug** ✓
  - File: `browser-extension/content-scripts/severity.js`
  - Implemented complete severity scoring algorithm
  - 39 unit tests passing
  - Commit: 2380121

- [x] **Task 2: Tighten Analysis Panel Spacing** ✓
  - File: `styles.css`
  - Reduced padding, margins, font sizes throughout
  - Compact, professional appearance

- [x] **Task 3: Fix Button Styling** ✓
  - File: `styles.css`
  - Native-style buttons using `currentColor` and `inherit`
  - Platform-agnostic (works on any site)

- [x] **Task 4: Verify Font Matching** ✓
  - File: `common.js`
  - Universal font matching via `captureElementStyles()`
  - Removed hardcoded platform styles
  - Works on Twitter, Facebook, TikTok, Reddit, etc.

---

## Phase 2: Settings & Language

- [ ] **Task 5: Add Settings Tab to Popup**
  - Files: `popup.html`, `popup.js`, new `settings.js`
  - Spec: Settings should be IN-POPUP (not external)
  - Sections: Language, Protection Mode, Data, Export, Advanced

- [x] **Task 6: Create Language System Foundation** ✓
  - Created: `locales/en.json`, `locales/ro.json`
  - Created: `localization.js`
  - Updated `manifest.json` with web_accessible_resources
  - Commit: 402ee96

- [ ] **Task 7: Wire Up Language Selector**
  - All UI text should change when language selected
  - Must persist across sessions (chrome.storage.sync)

---

## Phase 3: Evidence Storage

- [ ] **Task 8: Set Up IndexedDB**
  - Create: `storage.js`
  - Spec: docs/ALGORITHMS/13-record-verification.md
  - Schema for neutralization records

- [ ] **Task 9: Implement SHA-256 Hashing**
  - Create: `hash.js`
  - Hash original, neutralized, and full record
  - Verify: Same content = same hash

- [ ] **Task 10: Store Records on Each Neutralization**
  - Integrate storage into content scripts
  - Every neutralization creates a record

---

## Phase 4: Parent Dashboard

- [ ] **Task 11: Create Dashboard View**
  - New popup tab or separate page
  - Spec: docs/ALGORITHMS/09-platform-health.md

- [ ] **Task 12: Platform Comparison Chart**
  - Spec: docs/ALGORITHMS/09-platform-health.md
  - Show influence level per platform

- [ ] **Task 13: Emotional Direction Breakdown**
  - Spec: docs/ALGORITHMS/04-emotional-direction.md
  - Pie/bar chart of emotions targeted

- [ ] **Task 14: Time Pattern Heatmap**
  - Spec: docs/ALGORITHMS/11-time-patterns.md
  - 24x7 grid showing exposure times

---

## Phase 5: Export & Polish

- [ ] **Task 15: JSON Export**
  - Spec: docs/ALGORITHMS/14-export-formatting.md

- [ ] **Task 16: CSV Export**
  - Spec: docs/ALGORITHMS/14-export-formatting.md

- [ ] **Task 17: HTML Evidence Report**
  - Spec: docs/ALGORITHMS/14-export-formatting.md
  - Professional format for lawyers/schools

---

## Completed Tasks

(Move tasks here when done with commit hash)

---

## Notes

- One task per session
- Read relevant algorithm doc before implementing
- Verify each task works before marking complete
- /clear between tasks to reset context
