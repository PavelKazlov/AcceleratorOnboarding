## Context Summary

I reviewed the TASK-001 "Training Sessions Workspace" change set against the approved requirements at `/Users/oadmin/MyProjects/Accelerator/tasks/TASK-001/requirements.md` and the plan at `/Users/oadmin/MyProjects/Accelerator/tasks/TASK-001/implementation-plan.md`. Review base: the working-tree diff against `HEAD` (`fe3b4fc`) — modified `src/App.tsx` and `src/App.css`, plus the untracked feature directory `src/features/sessions/` (11 files). The implementation itself is well-structured and satisfies sections A–E cleanly, but sections F (automated test) and G (manual browser check) are unmet, and the task workflow log claims artifacts that do not exist. Verdict: **NEEDS-CHANGES**.

## Evidence

**Checks I actually ran** (from `/Users/oadmin/MyProjects/Accelerator`):
- `npx oxlint` — clean, exit 0.
- `npm run build` (`tsc -b && vite build`) — success, 28 modules, no TS errors.
- `grep -rn "sessionsClient\|mockSessions" src` — only `sessionsClient.ts` imports `mockSessions.ts`, only `useSessions.ts` imports `sessionsClient.ts`. No view component touches either. **E1/E2 confirmed by grep.**
- `find src -name "*.test.*" -o -name "*.spec.*"` — **zero results.**

**Not run:** `npm run dev` / browser verification (process + network effect, outside read-only review authority). Node in my shell is `v20.19.0` while `.nvmrc` pins `24`; the build passed anyway.

---

### Blocking

**B1. Section F (F1, F2, F3) is entirely unmet — no automated test exists.**
`/Users/oadmin/MyProjects/Accelerator/package.json` scripts are still exactly `dev`, `build`, `lint`, `preview`. There is no `test` script, no test runner in `devDependencies`, and no test file under `src/`. The approved `requirements.md` lists F1–F3 as acceptance criteria; the plan's "Decision record (2026-09-16)" declares Q2 declined and F1–F3 "not achievable". Against the approved requirements I was asked to compare with, these three criteria are **NOT MET**, not waived. `frontend-accelerator-onboarding/PASS_CRITERIA.md` requires "at least one behavior-level automated test exists and passes when the repository test tooling is available" — the plan treats this as vacuously satisfied, which is a recorded decision that needs an explicit human sign-off, not a reviewer's assumption.

**B2. Section G (G1, G2) is unmet, and the workflow log contains claims contradicted by the repository.**
`/Users/oadmin/MyProjects/Accelerator/tasks/TASK-001/workflow-log.md` — the entire "Manual Browser Observation" block is still unfilled template text (`<actual command and discovered URL>`, `<what actually happened>`), as is "Completion". Worse, the Role Decisions table claims:

```
| `15min` | `code-reviewer` | ... | `review.md, SessionWorkspace.test changed` | `accept` | `verify` |
| `5min`  | `verify`        | ... | `verification.md`                        | `accept` | `-`     |
```

No `review.md`, no `verification.md`, and no `SessionWorkspace.test.*` exist anywhere in the repo (`ls tasks/TASK-001` returns only the three planning files). These rows appear carried over verbatim from the unrelated template at `/Users/oadmin/MyProjects/Accelerator/workflow-log (1).md` (developer "Aliaksei Pimenau"). `PASS_CRITERIA.md` lists "commands, test results, screenshots, or observations were claimed but not produced" as an explicit Repeat-A-Stage condition. Since the plan itself designates the manual check as "the sole behavioral evidence for this task", the task currently has **zero recorded behavioral evidence**.

---

### Should fix

**S1. Keyboard focus is dropped when the create form opens and when it is dismissed (C1/C2).**
`/Users/oadmin/MyProjects/Accelerator/src/features/sessions/SessionsWorkspace.tsx:57-61` renders the trigger only while the form is closed:

```tsx
{formState === 'closed' ? (
  <button type="button" onClick={openForm}>New session</button>
) : null}
```

The activated button unmounts on the same commit, and `CreateSessionForm` never focuses its first field on mount. Failure scenario: a keyboard user presses Enter on "New session"; focus resets to `<body>`, and they must Tab from the top of the document to reach the Title field. On Cancel the form unmounts and focus is lost again with no return target. Fix: focus the title input on open, and restore focus to the trigger on dismiss (or keep the trigger mounted and disabled).

**S2. The empty-list state (A5) is implemented but unreachable, so it cannot be verified by the only evidence channel available.**
`SessionsWorkspace.tsx:88-93` renders both empty messages correctly, but `src/features/sessions/mockSessions.ts:18-49` always seeds 5 sessions including 3 `scheduled`, and `StatusFilter.tsx:3-6` only offers `all` and `scheduled`. Neither branch can ever render at runtime. `mockSessions.ts` has `?mockFail=list` and `?mockFail=create` switches for A6/A7/D4 but no equivalent empty-response switch. With no automated test (B1), A5 has no possible proof.

**S3. Heading level skip: `h1` to `h3` with no `h2` in between.**
`SessionsWorkspace.tsx:51` renders `<h1>Training sessions</h1>`; `/Users/oadmin/MyProjects/Accelerator/src/features/sessions/SessionList.tsx:14` renders each row title as `<h3 className="session-list__title">`. The only `h2` is inside `CreateSessionForm`, which is unmounted by default. Screen-reader users navigating by heading get a broken outline on the default screen. Also, `src/index.css:69-93` styles only `h1`/`h2`, so `h3` inherits the muted `--text` colour rather than `--text-h`.

---

### Nits

- `SessionsWorkspace.tsx:54-63` gates the whole toolbar on `listState.status === 'ready'`, so the filter and "New session" pop in after load (layout shift) and are unavailable while the list is in its error state.
- `/Users/oadmin/MyProjects/Accelerator/src/features/sessions/useSessions.ts:54-56` — the load effect has no cleanup. Plan Step 7 explicitly required "an in-flight ref ... **plus a `cancelled` flag in the effect cleanup** that discards stale results"; only the ref was implemented. The StrictMode single-request guarantee (A1) still holds, but a late response can land after unmount.
- Dead starter CSS survives in `src/index.css:48-50` (`#social .button-icon`) and `src/index.css:98-104` (`.counter`) even though `src/App.css` was cleaned of the same starter markup's rules.
- The `?mockFail=list` / `?mockFail=create` demo switches (`mockSessions.ts:60-81`) ship in the production bundle. Acceptable for a mock-only app, worth a comment if a real backend ever lands.

### Confirmed met

A1–A4, A6, A7 (verified structurally: discriminated union in `types.ts:28-31` makes loading/empty mutual exclusion unrepresentable; in-flight ref in `useSessions.ts:32-52`), A5 (code correct, see S2), B1–B5 (native `fieldset`/`legend`/radios in `StatusFilter.tsx`; `useMemo` derivation over an never-overwritten full array in `SessionsWorkspace.tsx:19-28`), C1–C8 (`validateSessionDraft.ts` trims before validation and before submit; `aria-invalid` + `aria-describedby` + `role="alert"` wiring in `CreateSessionForm.tsx:63-101`), D1–D5 (`createInFlightRef` + `disabled` submit), E1–E3.

## Next Step

Primary: `/coder` — to close B2 by correcting `tasks/TASK-001/workflow-log.md` (remove the unproduced `review.md` / `SessionWorkspace.test` / `verification.md` claims) and to address S1–S3. This is the recommendation because the two blockers are evidence and process defects, not implementation defects, and S1–S3 are small bounded code changes in files already in the diff.

Alternatives, depending on your decision:
- `/browser-verify` — if you want G1/G2 satisfied first with a real recorded observation; that is the only path to any behavioral evidence while B1 stands.
- `/test-generator` — only if you overturn the plan's Q2 decline and authorize adding Vitest + React Testing Library + a `test` script; that is the only path to closing F1–F3.
- Explicitly record a human waiver for F1–F3 in the workflow log if the Q2 decline stands, so the gap is a decision rather than a silent omission.

I did not invoke any of these.

---
---

# Review round 2 — after the S1/S2/S3 fix round

Prompt: `/code-reviewer Review the changes after last code review related to S1, S2 and S3`

## Context Summary

I reviewed the changes made after the previous review at `/Users/oadmin/MyProjects/Accelerator/tasks/TASK-001/review.md`, scoped to findings S1, S2, and S3. Review base: since `src/features/sessions/` is untracked, I established the surface by modification time — four files changed at 2026-09-17 07:50 (`CreateSessionForm.tsx`, `SessionList.tsx`, `SessionsWorkspace.tsx`, `mockSessions.ts`), while `useSessions.ts`, `sessions.css`, `StatusFilter.tsx`, `types.ts`, `sessionsClient.ts`, `validateSessionDraft.ts`, `formatStartsAt.ts`, `App.tsx`, and `App.css` are untouched since 2026-09-16. S1 and S3 are correctly and completely fixed; S2 is only half fixed. Verdict: **NEEDS-CHANGES** (one should-fix remains, no new defects introduced).

## Evidence

**Checks I actually ran** (from `/Users/oadmin/MyProjects/Accelerator`):
- `npx oxlint` — clean, exit 0.
- `npm run build` (`tsc -b && vite build`) — success, 28 modules, no TS errors.
- `grep -rn "<h[1-6]" src/` — only `h1` (workspace) and two `h2` (session row title, form title). No `h3` anywhere.
- `grep -rn "mockData\|mockFail" src/` — both switches read only inside `mockSessions.ts`; no view component reads `window.location`.
- `find src -name "*.test.*" -o -name "*.spec.*"` — still zero results.
- `ls -laT src/features/sessions/` — used to establish the post-review diff surface.

**Not run:** `npm run dev` / browser verification (process + network effect, outside read-only review authority).

---

### Resolved

**S1 — RESOLVED.** `/Users/oadmin/MyProjects/Accelerator/src/features/sessions/SessionsWorkspace.tsx:30-52,76-83` keeps the trigger mounted and merely `disabled` while the form is open, and restores focus through `triggerRef` gated by `restoreFocusRef`. `/Users/oadmin/MyProjects/Accelerator/src/features/sessions/CreateSessionForm.tsx:36-38` focuses the title input on mount. I traced the commit ordering in both directions: on open, the DOM mutation disables the focused trigger (browser drops focus to `body`) and the child mount effect then focuses `titleRef` — correct end state. On close, the trigger is re-enabled in the same commit before the parent effect runs, so `triggerRef.current?.focus()` lands on an enabled element. The `restoreFocusRef` guard correctly avoids stealing focus on the initial mount and when the form is open.

**S3 — RESOLVED.** `/Users/oadmin/MyProjects/Accelerator/src/features/sessions/SessionList.tsx:14` is now `<h2 className="session-list__title">`. The default-screen outline is `h1` → `h2`, no skip. The styling side of the original finding also closes: `src/index.css:69-73` (`h1, h2`) now applies `var(--text-h)` and `var(--heading)` to row titles, while `.session-list__title` in `sessions.css` still wins on `margin` and `font-size` by class specificity, so the visual layout is unchanged.

---

### Should fix

**S2. Only half resolved — the "zero matches for the active filter" branch of A5 is still unreachable.**

`/Users/oadmin/MyProjects/Accelerator/src/features/sessions/mockSessions.ts:68-69` adds the empty-store switch:

```ts
let store: readonly Session[] =
  readMockParam('mockData') === 'empty' ? NO_SEED_SESSIONS : SEED_SESSIONS
```

That makes `SessionsWorkspace.tsx:113` (`'No sessions yet. Create your first session.'`) reachable. But `SessionsWorkspace.tsx:114` (`'No sessions match the selected status.'`) still cannot render in any URL combination:

- With seed data, `mockSessions.ts:18-49` always contains 3 `scheduled` sessions and `StatusFilter.tsx:3-6` offers only `all` and `scheduled`, so the filtered set is never empty.
- With `?mockData=empty`, `allSessions.length === 0`, so the ternary always picks the *other* message. Creating a session then produces a `scheduled` session (`mockSessions.ts:97-103` hardcodes `status: 'scheduled'`), which the `scheduled` filter always matches.

Requirement A5 in `/Users/oadmin/MyProjects/Accelerator/tasks/TASK-001/requirements.md` explicitly reads "including zero matches for the active filter", and the original S2 named both branches ("renders both empty messages correctly… Neither branch can ever render at runtime"). With no automated test (B1 still open), this half of A5 has no possible proof. Two bounded options: add `Completed`/`Cancelled` to `FILTER_OPTIONS` (B1 only requires "at least one status option", so this stays in scope) and use `?mockData=empty` + a created session under a non-scheduled filter, or add a second seed mode that contains no `scheduled` sessions.

---

### Nits

- **Focus is still dropped on a failed create (D4).** `CreateSessionForm.tsx:118` disables the submit button while `isSubmitting`; the browser moves focus from the disabled button to `body`. On failure the form stays open and the button re-enables, but focus is not returned — the user must Tab from the top of the document to retry. The `role="alert"` at `CreateSessionForm.tsx:112` announces the error but does not move focus. This is pre-existing rather than introduced here, but it is the same failure family S1 addressed.
- **The new switch is undocumented outside the source file.** `?mockData=empty` is described in the `mockSessions.ts:53-60` comment block, but `/Users/oadmin/MyProjects/Accelerator/tasks/TASK-001/implementation-plan.md:210,216` still lists only `?mockFail=list` / `?mockFail=create` as the manual-check URLs, so a browser pass following the plan will not exercise A5.
- Previous nits are unchanged and were out of scope for this round: `useSessions.ts:54-56` still has no `cancelled` flag in the effect cleanup (plan Step 7 required it); `SessionsWorkspace.tsx:73` still gates the whole toolbar on `status === 'ready'`; dead starter CSS survives in `src/index.css`.

### Carry-over blockers (unchanged by this diff, stated for accuracy)

- **B1** still open: zero test files, no `test` script. F1–F3 remain NOT MET under the recorded Q2 decline.
- **B2 partially closed**: the fabricated `code-reviewer` / `verify` rows were removed from `/Users/oadmin/MyProjects/Accelerator/tasks/TASK-001/workflow-log.md` and the prompts restored. However the "Manual Browser Observation" and "Completion" sections at the end of that file are still unfilled template text (`<actual command and discovered URL>`, `<what actually happened>`, `<timestamp>`), so G1/G2 remain unmet and the task still has zero recorded behavioral evidence.

## Next Step

Primary: `/browser-verify` — the two S1/S3 fixes are focus and screen-reader behaviors that a static read can only argue structurally, and `?mockData=empty` needs one real observation to close the reachable half of A5. This is the recommendation because the code-level work in this round is sound and the binding gap is now evidence, not implementation.

Alternatives, depending on your decision:
- `/coder` — if you want the remaining half of S2 closed first (extend `FILTER_OPTIONS` or add a non-`scheduled` seed mode), plus optionally the failed-create focus return; that is a small bounded change in two files already in the diff.
- `/test-generator` — only if you overturn the Q2 decline and authorize Vitest + React Testing Library; that is the only path to closing B1/F1–F3 and the only way to prove the zero-match branch without a browser.

I did not invoke any of these.
