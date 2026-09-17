# TASK-001: Implementation Plan — Training Sessions Workspace

Requirements: `tasks/TASK-001/requirements.md`
Source request: `frontend-accelerator-onboarding/TASK.md`
Application Root: repository root `/Users/oadmin/MyProjects/Accelerator` (single Vite + React + TS app; `package.json`, `vite.config.ts`, `src/` all at root — no monorepo candidates).

> **Decision record (2026-09-16):** Q2 **declined** — no test runner is added. Q3 **confirmed at the default** — hand-rolled typed async client module, no MSW. Both decisions come from the coordinator and are binding for this plan. See "Test Coverage Under The Q2 Decision" below for the consequence.

---

## Current Behavior

- `src/App.tsx` is the untouched Vite starter: a `useState` counter, hero/logo images from `src/assets/`, and two link sections (`#docs`, `#social`) referencing `/icons.svg`.
- `src/main.tsx` mounts `<App />` inside `<StrictMode>` via `createRoot`.
- There is no sessions domain, no request boundary, no mock mechanism, no form, and no test file anywhere under `src/`.
- `package.json` scripts are exactly `dev`, `build` (`tsc -b && vite build`), `lint` (`oxlint`), `preview`. Runtime deps are `react` and `react-dom` only. **No test runner is installed, and none will be added.**
- `tsconfig.app.json` covers `src` with `verbatimModuleSyntax: true`, `erasableSyntaxOnly: true`, `noUnusedLocals`, `noUnusedParameters`, `types: ["vite/client"]`, and **no `strict` flag**. `tsconfig.node.json` covers only `vite.config.ts` with `module: nodenext`, `types: ["node"]`.
- `.oxlintrc.json` enables the `react`, `typescript`, `oxc` plugins with `react/rules-of-hooks: error` and `react/only-export-components: warn`.
- `.nvmrc` pins Node `24`.

## Intended Behavior

One workspace screen replaces the starter page. On mount it issues exactly one sessions read through a replaceable client module and renders, mutually exclusively, a loading state, an error state with retry, an empty message, or a list of rows showing title, status, and a human-readable start date/time. A status filter (`All` + `Scheduled`) narrows the rendered rows without refetching and without discarding data. A create control opens a labeled title + `datetime-local` form that validates a trimmed 3–80 character title and a strictly future start time before any request is sent, keeps user input on failure, associates each message with its field, blocks double submission while pending, and on success appends the created session to the in-memory list so it is visible under `All` and under `Scheduled`.

---

## Preconditions And Confirmed Decisions

### Resolved dependency decisions

| ID | Decision | Outcome | Effect on this plan |
| --- | --- | --- | --- |
| **Q2** | Add a test runner? | **Declined.** No `vitest`, no `jsdom`, no `@testing-library/*`, no `test` script, no new devDependencies of any kind. `package.json`, `vite.config.ts`, and all three tsconfigs are **not** modified for test wiring. | The former Step 0 (test tooling) and Step 9 (essential test) are removed. Acceptance criteria **F1–F3 are not achievable** — see below. |
| **Q3** | Mock mechanism: hand-rolled module vs MSW? | **Confirmed at the default: hand-rolled typed async client module.** No MSW, no request interception, no added dependency. | Steps 2 and 3 are final as written. `sessionsClient.ts` is the swap point for a future real backend. |

**Net dependency footprint of this task: zero new packages.** `package.json` is not edited at all. This satisfies the requirements constraint "keep new dependencies to the minimum needed" in its strongest form.

### Test Coverage Under The Q2 Decision

- Acceptance criteria **F1, F2, and F3 cannot be met**. There is no test runner, no `npm run test`, and no automated behavior-level test will exist when this task completes.
- The `verify` role **must report F1–F3 as NOT MET**, naming the declined Q2 decision as the cause. It must not claim, infer, simulate, or describe a test run that did not happen, and must not substitute a manual walkthrough as evidence for an automated test.
- Against `frontend-accelerator-onboarding/PASS_CRITERIA.md`, the criterion "at least one behavior-level automated test exists and passes **when the repository test tooling is available**" is satisfied vacuously — the tooling is deliberately unavailable. That is a recorded decision, not an omission, and it should be stated as such rather than left silent.
- The only remaining proof of behavior is the manual browser check (G1/G2). Its weight therefore increases: it is now the sole behavioral evidence for this task and must be performed for real and recorded honestly.

### Non-blocking defaults carried from requirements (overrule freely)

- Q1 status vocabulary: `scheduled | completed | cancelled`; the single required filter option is `Scheduled`.
- Q4: the workspace **replaces** the contents of `src/App.tsx`.
- Q5: create-failure path (D4) is implemented; it is reachable in the browser only through the mock's failure switch (see Step 2).
- Q6: in-memory only; a reload returns the mock seed set.
- Assumptions 1, 3, 4, 5, 7, 8, 11, 12 from `requirements.md` are carried unchanged.

### Project-fit constraints the implementer must respect

- `erasableSyntaxOnly: true` → **no TS `enum`, no parameter properties**. Model statuses as a `const` tuple + `typeof ... [number]` union.
- `verbatimModuleSyntax: true` → every type-only import must use `import type`.
- `noUnusedLocals` / `noUnusedParameters` are on; `tsc -b` will fail on leftovers.
- Do **not** add `"strict": true` and do **not** loosen any existing compiler option (explicit non-goal). Write code that would pass strict anyway: no implicit `any`, no unchecked assertions.
- React 19 idioms per `rulesets/framework/shared/composition-patterns/rules/react19-no-forwardref.md`: no `forwardRef`, `ref` is a normal prop.
- Per `rulesets/framework/shared/composition-patterns/rules/architecture-avoid-boolean-props.md` and `.../patterns-explicit-variants.md`: prefer an explicit `status` union prop over stacked booleans for the list's view state.

---

## Ordered File Changes

Eight steps in dependency order. Steps 1–3 must precede 4–8. **Steps 4, 5, and 6 are independent of each other** once Step 3 lands and can be split across people. Steps 7 and 8 are strictly sequential and last.

### Step 1 — Domain types

| File | Action | Why |
| --- | --- | --- |
| `src/features/sessions/types.ts` | create | Single source of truth for `SessionStatus`, `Session`, `CreateSessionInput`, and `StatusFilterValue`. Placed with its owning feature per `rulesets/common/architect/rules/frontend-boundaries.md` — no premature `src/shared/`. |

Shape (contract, not a full implementation):

```ts
export const SESSION_STATUSES = ['scheduled', 'completed', 'cancelled'] as const
export type SessionStatus = (typeof SESSION_STATUSES)[number]

export type Session = { id: string; title: string; status: SessionStatus; startsAt: string } // startsAt = ISO 8601
export type CreateSessionInput = { title: string; startsAt: string }
export type StatusFilterValue = 'all' | SessionStatus
```

Covers: foundation for A2, B1–B2, E1.

### Step 2 — Mock data and failure switches (behind the boundary only)

| File | Action | Why |
| --- | --- | --- |
| `src/features/sessions/mockSessions.ts` | create | Seed array (4–6 sessions spanning at least `scheduled` and one other status, some future / some past), the in-memory mutable store, the artificial delay constant (~400 ms), and the failure switches. Satisfies E2: nothing here is imported by a view. |

Failure switches for A6/A7/D4 and for the manual browser check (G1): read `window.location.search` **inside this module only** — e.g. `?mockFail=list` makes the first list request reject and subsequent ones succeed (so retry visibly recovers, A7), `?mockFail=create` makes create requests reject (D4). No view component reads the URL. This is the one deliberate design decision that keeps D4 and A6/A7 demonstrable without a backend; if Q5 is later answered "drop D4", remove only the `create` branch.

With Q2 declined, these switches are now the **only** way to reach the error paths at all. Treat them as required, not optional.

Covers: E2, E3, and the reachability of A6, A7, D4.

### Step 3 — The request boundary (Q3: hand-rolled)

| File | Action | Why |
| --- | --- | --- |
| `src/features/sessions/sessionsClient.ts` | create | The single module every read and write goes through (E1). Exports `listSessions()` and `createSession(input)`. Internally delays, consults `mockSessions.ts`, and rejects with an `Error` carrying a neutral message. Swapping to real HTTP means rewriting this file's body only — no view or hook changes. |

Per the confirmed Q3 decision this is a plain typed async module — no MSW, no `fetch` interception, no service worker registration.

Covers: E1, E3.

### Step 4 — Date formatting (independent)

| File | Action | Why |
| --- | --- | --- |
| `src/features/sessions/formatStartsAt.ts` | create | `Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })` hoisted to a module constant (per `rulesets/framework/shared/react-best-practices/rules/rendering-hoist-static-work.md`), applied to `new Date(startsAt)`. Keep it pure. |

Covers: A3.

### Step 5 — Validation (independent, pure)

| File | Action | Why |
| --- | --- | --- |
| `src/features/sessions/validateSessionDraft.ts` | create | Pure function `validateSessionDraft(draft, now)` → `{ values, errors }` where `errors` is `{ title?: string; startsAt?: string }` and `values.title` is the **trimmed** title. Owns C3–C6 rules in one place so the form never re-derives them. `now` is injected rather than read from `Date.now()` internally, so the rule stays clock-independent and inspectable. |

Messages must name the rule (C3/C4/C6), e.g. `Title must be between 3 and 80 characters.` and `Start date and time must be in the future.`

Covers: C3, C4, C5, C6.

### Step 6 — Presentational pieces (independent of each other)

| File | Action | Why |
| --- | --- | --- |
| `src/features/sessions/StatusFilter.tsx` | create | A `<fieldset>` + `<legend>` with native radio inputs for `All` and `Scheduled`. Native `checked` gives B4's programmatic distinguishability for free — do not hand-roll a div-based toggle. |
| `src/features/sessions/SessionList.tsx` | create | Renders rows from a `sessions` prop using `formatStartsAt`. Pure: no client import, no fetching (A1's "no session data imported into a view"). |
| `src/features/sessions/CreateSessionForm.tsx` | create | Labeled `<input type="text">` and `<input type="datetime-local">` inside a `<form>`. Keeps its own controlled input state so C7 (input preserved on validation failure) is structural, not incidental. Calls `validateSessionDraft` on submit; only calls the injected `onSubmit` when there are no errors (C3–C6: "no request is sent"). Each field gets `aria-invalid` plus `aria-describedby` pointing at its message element with `role="alert"` (C8). Exposes a dismiss control (C1). Receives `isSubmitting` and `submitError` as props from the owner; disables submit while `isSubmitting` (D1). |
| `src/features/sessions/sessions.css` | create | Plain CSS for the workspace, consistent with the existing nested-CSS style in `src/App.css`. No UI library. |

Covers: A2, B1, B4, C1, C2, C7, C8, D1 (rendering half).

### Step 7 — State owner

| File | Action | Why |
| --- | --- | --- |
| `src/features/sessions/useSessions.ts` | create | Owns `listState` (discriminated union `{ status: 'loading' } \| { status: 'ready', sessions } \| { status: 'error', message }`), the load effect, `retry()`, `createSession()`, `isSubmitting`, and `createError`. The union makes A4/A5 exclusivity impossible to violate — there is no state in which "loading" and "no sessions" can both render. |

Two mandatory details:

1. **A1 "exactly one request."** `src/main.tsx` uses `<StrictMode>`, so React 19 mounts, unmounts, and remounts effects in dev. A naive `useEffect(() => { void load() }, [])` fires the client twice. Guard with an in-flight ref inside the hook (`if (inFlightRef.current) return`) plus a `cancelled` flag in the effect cleanup that discards stale results. The same in-flight guard is the mechanism for D1's "a second activation sends no second request" on create. Do **not** solve this by removing `StrictMode`. **With no automated test to catch a regression here, this must be checked by eye during the manual browser check** — the failure mode is dev-only and passes in `npm run preview`.
2. **B5/D5.** Keep the full session array in state and derive the filtered array with `useMemo` in the workspace component. Never overwrite the full array with a filtered one, and append created sessions to the full array — filtering is a render-time concern only, and no refetch happens on filter change (B3).

Covers: A1, A4, A6, A7, B3, B5, D1, D4, D5.

### Step 8 — Screen assembly and starter replacement

| File | Action | Why |
| --- | --- | --- |
| `src/features/sessions/SessionsWorkspace.tsx` | create | Composes `useSessions`, `StatusFilter`, `SessionList`, `CreateSessionForm`. Owns `filter` state, the derived filtered list, and the create-form open/close state (D3: close or reset on success). Renders the four exclusive list states, including the error message + retry button (A6/A7) and the empty message — which must also appear when the filter matches nothing (A5). |
| `src/App.tsx` | modify | Replace the starter body with `<SessionsWorkspace />`. Drop the counter, the hero/logo imports, and the `#docs`/`#social` sections. Keep the default export. |
| `src/App.css` | modify | Remove only the rules that belonged to the deleted starter markup (`.counter`, `.hero`, `.ticks`, `#docs`, `#social`, `#spacer`, ...). Leave `src/index.css` and its CSS custom properties (`--accent`, ...) untouched — `sessions.css` should reuse them. |
| `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg` | leave in place | Deleting them is out of scope ("do not rewrite unrelated code"); they simply become unreferenced. `public/icons.svg` likewise. |

`src/main.tsx` is **not** modified. `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, and `tsconfig.node.json` are **not** modified by any step in this plan.

Covers: A5, B2, D2, D3.

---

## Contracts And Dependencies

**Client boundary (Step 3) — the contract every later step codes against:**

```ts
export function listSessions(): Promise<Session[]>
export function createSession(input: CreateSessionInput): Promise<Session>
```

- Both reject with an `Error`; the hook maps rejection to a user-facing string and never surfaces the raw message (`rulesets/common/api-integration/rules/client-behavior.md`: map transport failures to user-visible recovery without leaking details).
- `createSession` assigns `id` and `status: 'scheduled'` server-side (i.e. inside the mock) and returns the created `Session`. The caller does not invent an id.
- `createSession` receives an **already-trimmed** title. Trimming is the validator's job (C5), not the client's.
- `startsAt` crossing the boundary is always an ISO 8601 string. The `datetime-local` input yields a local-time string like `2026-10-01T14:30` — the form converts with `new Date(value).toISOString()` before calling the client, and `formatStartsAt` converts back for display. This is the single conversion point; nothing else handles raw `datetime-local` values.

**Direction of dependencies (must hold):** `mockSessions` ← `sessionsClient` ← `useSessions` ← `SessionsWorkspace` → {`StatusFilter`, `SessionList`, `CreateSessionForm`} → {`formatStartsAt`, `validateSessionDraft`}. No presentational component imports `sessionsClient` or `mockSessions`. That single rule is what makes E1 checkable by grep — which, with no automated test, is the practical way `code-reviewer` should verify E1.

**Validator contract (Step 5):** `validateSessionDraft(draft: { title: string; startsAt: string }, now: Date)` returns `{ values: CreateSessionInput; errors: { title?: string; startsAt?: string } }`. `errors` empty ⇒ submit is allowed. The form never calls the client when `errors` is non-empty.

**Hook contract (Step 7):** `useSessions()` returns `{ listState, retry, createSession, isSubmitting, createError }`. `createSession(input)` resolves to `true`/`false` (or resolves/rejects) so the workspace knows whether to close the form (D3) or keep it open with its input (D4).

---

## Test Opportunities (Deferred — No Runner)

No tests are written in this task. Q2 is declined, so there is nothing to run them with. This list exists **only** so the coverage gap is documented and does not have to be rediscovered if the Q2 decision is ever revisited. Nothing here is an instruction for this task.

Highest-value first, were a runner ever introduced:

1. `create-then-appears-in-list` — the F1 main flow: valid title with surrounding whitespace is submitted trimmed (C5) and the new title becomes visible (D2) with the form closed (D3).
2. `list-failure-then-retry` (A6/A7) — the most damaging regression class, a blank screen on a failed load.
3. `validation-blocks-request` (C3/C7) — asserts no client call and preserved input.
4. `filter-by-status` (B2/B3/B5) — including that created sessions survive a filter round-trip.
5. Exactly-one-request-under-StrictMode (A1) — protects the Step 7 in-flight guard, whose failure mode is invisible in production builds.
6. Double-submit guard (D1) against a never-resolving `createSession`.
7. Unit boundaries for `validateSessionDraft` (trimmed lengths 2/3/80/81, missing date, past date, exactly-now) and `formatStartsAt` under a fixed `TZ`.

## Verification Commands

Discovered from the Application Root's `package.json` and `toolchain/`. Nothing here is invented; none of these were run by this planning step. There is **no test command** — `npm run test` does not exist and will not be created.

| Command | Purpose | Availability |
| --- | --- | --- |
| `npm run lint` | `oxlint` must stay clean | exists today |
| `npm run build` | runs `tsc -b && vite build`; this is the typecheck gate and the strongest automated signal available on this task | exists today |
| `npm run dev` | manual browser check (G1). **Read the actual URL from the Vite output — do not assume a port.** Also exercise `?mockFail=list` and `?mockFail=create` once. | exists today |
| `npm run preview` | optional production-build sanity check | exists today |
| `node ./toolchain/bin/doctor.mjs --json` | runtime readiness; last recorded result `DEGRADED` (Codex hook only) per `tasks/training-sessions-workspace/workflow-log.md` | exists today |

Node 24 is required by `.nvmrc`; an earlier Doctor run was `BLOCKED` on Node 20.19.0. Use `nvm use` before the above.

Because `npm run lint` and `npm run build` are now the only automated gates, the manual browser check carries the behavioral evidence. Exercise, in one session: initial load (A1/A4), a populated list (A2/A3), `Scheduled` then back to `All` (B2/B3), create with a whitespace-padded title (C5/D2/D3), a too-short title (C3/C7), a past date (C6), `?mockFail=list` plus retry (A6/A7), and `?mockFail=create` (D4).

Manual-check reporting (G2) goes in the task workflow log with the real observed URL and anything that did not work. Unperformed checks must be reported as unperformed, and **F1–F3 must be reported as not met** with the Q2 decision as the stated reason.

## Risks And Rollback

- **No automated regression net.** This is now the top risk on the task and a direct consequence of the Q2 decision, not a defect in the implementation. Every acceptance criterion outside `tsc -b` and `oxlint` is verified by human observation once. Anything not exercised in the manual pass is unverified and must be reported that way.
- **A1 vs `StrictMode`.** Documented in Step 7. Without the in-flight guard, A1 fails in dev only and passes in the production build — an easy false pass, and with no test to catch it. Verify in `npm run dev`, not just in `npm run preview`.
- **`erasableSyntaxOnly`.** A TS `enum` for `SessionStatus` compiles nowhere here and breaks `npm run build` late. Step 1's const-tuple shape avoids it.
- **`datetime-local` timezone drift.** `new Date('2026-10-01T14:30')` is parsed as local time while `toISOString()` emits UTC. If the display formatter and the validator disagree about the conversion point, C6 can reject a valid future time near midnight. Keep the single conversion point named in Contracts.
- **Rollback:** no feature flag is warranted. Every change is additive under `src/features/sessions/` except `src/App.tsx` and `src/App.css`. No dependency, script, or config change means `git revert` of the commit is a complete and clean rollback; the mock is in-memory, so there is no data or migration to undo.
- **Scope creep guard:** the requirements' Non-Goals list (routing, search, sorting, pagination, edit/delete, strict-TS migration) applies to this plan verbatim.
