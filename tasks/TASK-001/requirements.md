# TASK-001: Training Sessions Workspace

Source request: `frontend-accelerator-onboarding/TASK.md`
Application Root: repository root (`/Users/oadmin/MyProjects/Accelerator`) — single Vite + React + TypeScript app.

## Goal

Give a trainer one workspace screen where they can see training sessions loaded from a
replaceable mock request boundary, narrow the list by a single status filter, and create a
new session with a validated title and future start date/time that appears in the list
immediately after a successful create.

## Users And Outcome

- **User:** a trainer managing their own training sessions.
- **Problem:** there is no place to see scheduled sessions or add a new one; the app is still
  the untouched Vite starter (`src/App.tsx` renders the Vite/React template).
- **Desired outcome:** the trainer can answer "what sessions exist, which are in status X"
  and add a session without leaving the screen or losing entered input on a validation error.

## Acceptance Criteria

### A. Sessions list

- [ ] A1 Opening the workspace triggers exactly one sessions request through the mock
      request boundary; no session data is imported directly into a view component.
- [ ] A2 Each rendered session row shows its title, its status, and its start date/time.
- [ ] A3 Start date/time is rendered in a human-readable form, not a raw ISO string.
- [ ] A4 While the sessions request is pending, a loading state is visible and no
      "no sessions" empty message is shown at the same time.
- [ ] A5 When the sessions request succeeds with zero sessions (including zero matches for
      the active filter), an explicit empty message is shown instead of a blank region.
- [ ] A6 When the sessions request fails, one understandable error message is shown together
      with a retry affordance; the app does not crash or show a blank screen.
- [ ] A7 Activating retry after a failure re-issues the request and, on success, replaces the
      error state with the list.

### B. Status filter

- [ ] B1 The filter exposes an `All` option plus at least one status option, and `All` is the
      state on first load.
- [ ] B2 Selecting the status option shows only sessions with that status.
- [ ] B3 Selecting `All` again restores the full list without a full page reload.
- [ ] B4 The active filter selection is visually and programmatically distinguishable
      (for example a selected radio/option state, not color alone).
- [ ] B5 Filtering does not discard sessions created during the current session; switching
      back to `All` still shows them.

### C. Create session — form and validation

- [ ] C1 A control opens the create form, and the form can be dismissed without creating a
      session.
- [ ] C2 The form has a title field and a date/time field, both labeled and reachable by
      keyboard.
- [ ] C3 Submitting a title whose trimmed length is under 3 characters is rejected with a
      message naming the length rule; no request is sent.
- [ ] C4 Submitting a title whose trimmed length exceeds 80 characters is rejected with a
      message naming the length rule; no request is sent.
- [ ] C5 A title with surrounding whitespace is trimmed before validation and before submit,
      so `"  Ab  "` fails and `"  Intro  "` is submitted as `"Intro"`.
- [ ] C6 Submitting a missing or past date/time is rejected with a message stating the date
      must be in the future; no request is sent.
- [ ] C7 A validation failure keeps the user's already-entered input in the form.
- [ ] C8 The validation message is associated with its field so it is announced, not rendered
      only as a detached line of text.

### D. Create session — submission

- [ ] D1 While the create request is pending, the submit control is disabled or otherwise
      blocked, and a second activation sends no second request.
- [ ] D2 On success the new session appears in the visible list without a manual page reload.
- [ ] D3 On success the form is closed or reset so the same session is not accidentally
      submitted twice.
- [ ] D4 On a failed create request, an error is shown, the form stays open with its input,
      and the submit control becomes usable again.
- [ ] D5 A session created while a status filter is active is not lost — it is visible under
      `All` and under its own status.

### E. Mock boundary

- [ ] E1 All session reads and writes go through a single client/module boundary that can be
      swapped for a real HTTP backend without editing view components.
- [ ] E2 Mock data and mock delay/error behavior live behind that boundary only.
- [ ] E3 No backend service, server process, or persistent storage is added.

### F. Essential test

- [ ] F1 At least one automated behavior-level test covers the main flow end to end at the
      UI level — either filter-by-status or successful create-then-appears-in-list.
- [ ] F2 The test asserts user-visible output (rendered text/roles), not internal state or
      implementation details.
- [ ] F3 The test runs from a documented package script and passes locally.

### G. Manual check

- [ ] G1 The app is started with the repository dev script, and the list, filter, and create
      flow are exercised once in a browser.
- [ ] G2 The actually observed result — including the real URL used and anything that did not
      work — is recorded in the task workflow log. Unperformed checks are reported as
      unperformed.

## Constraints

- Use the existing stack: Vite 8, React 19, TypeScript, `oxlint`, ESM, npm-style scripts in
  the root `package.json`. Node is pinned by `.nvmrc`.
- Do not rewrite unrelated code or configuration. `src/App.css`, `src/index.css`, and the
  starter assets may only be touched where the starter content is being replaced by the
  workspace screen.
- Do not add features beyond the required flow (no details view, search, multi-filter,
  pagination, deep links, auth).
- `tsc -b` and `npm run lint` must stay clean; do not loosen TypeScript settings.
- Keep new dependencies to the minimum needed for the mock boundary and the single test.

## Non-Goals

- Session details view, drawers, deep links, or routing.
- Search, multiple simultaneous filters, sorting, or pagination.
- A complete API contract, scenario matrix, or living API specification.
- Desktop/mobile screenshot sets, exhaustive responsive/a11y validation, full coverage.
- Edit, delete, or status-transition flows.
- CI, deployment, public URL, or backend implementation.
- Strict-TypeScript migration or unrelated refactoring.

## Facts

- `package.json` scripts are only `dev`, `build` (`tsc -b && vite build`), `lint` (`oxlint`),
  and `preview`. There is **no test script and no test runner installed**.
- Dependencies are `react` and `react-dom` only. There is **no router, no state library, no
  data-fetching library, no form library, no MSW, and no existing mock mechanism**.
- `src/` contains only `App.tsx`, `main.tsx`, `App.css`, `index.css`, and starter assets.
  `src/App.tsx` is still the Vite starter counter page.
- TypeScript config is split into `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`.
- `rulesets/framework/` targets React 19 (for example `react19-no-forwardref`), confirming
  React 19 idioms are the project norm.
- A prior workflow log exists at `tasks/training-sessions-workspace/workflow-log.md`
  referencing an earlier requirements pass, but no `requirements.md` is present there.

## Assumptions

Each assumption below is unconfirmed and safe to overrule.

1. A session is `{ id, title, status, startsAt }` with `startsAt` as an ISO 8601 string.
2. The status set is `scheduled | completed | cancelled`, and the one required filter option
   is `scheduled`. Any single well-defined status satisfies the task.
3. New sessions are created with status `scheduled`; status is not user-selectable.
4. "Future" means strictly greater than the current client clock at submit time; timezone is
   the browser's local timezone and no timezone picker is offered.
5. Date and time are captured with a native `datetime-local` input rather than a custom
   picker.
6. Sessions are held in memory for the page lifetime; a reload returns the mock seed set.
7. The create form is rendered inline or in a simple modal on the same screen — the task does
   not require a separate route.
8. The list is unsorted beyond whatever order the mock returns; newly created sessions may be
   appended.
9. The mock boundary will be a small typed async client module under `src/` (optionally
   MSW), since the repository has no existing mock mechanism to reuse.
10. Because no test runner exists, adding Vitest plus React Testing Library and a `test`
    script is in scope as the minimum required to satisfy F1–F3.
11. Styling uses plain CSS consistent with the existing files; no UI library is introduced.
12. English-only copy; no localization layer.

## Open Questions

These need a human decision or an explicit "use the assumption".

- Q1 **Status vocabulary** — confirm the status values and which single status the filter must
  expose (assumption 2). Decision owner: you / product.
- Q2 **Test stack** — the onboarding task says "use the repository's existing test stack" but
  none exists. Confirm adding Vitest + React Testing Library + `npm run test`
  (assumption 10). Decision owner: you. **This blocks section F.**
- Q3 **Mock mechanism** — hand-rolled async client module versus MSW request interception
  (assumption 9). Affects dependency footprint and how the test intercepts requests.
  Decision owner: you, with `api-integration` input.
- Q4 **Starter page** — should the workspace replace the contents of `src/App.tsx` outright,
  or be mounted alongside the starter content? Assumed: replace.
- Q5 **Create failure path** — is an error-injection path for create needed for the demo, or
  is the happy path plus list-load failure enough? D4 is written as required; drop it if you
  want the smallest scope.
- Q6 **Persistence** — confirm in-memory only is acceptable (assumption 6), i.e. created
  sessions disappear on reload.

## Readiness

**Ready to plan with one blocking decision.** Sections A–E and G are specified well enough to
proceed. Section F cannot be planned until Q2 is answered, because the repository has no test
runner and the onboarding constraint "use the existing test stack" cannot be satisfied
literally. Q1, Q3, Q4, Q5, and Q6 have documented default assumptions and do not block
planning if those defaults are accepted.

No architecture, API-contract, or visual-direction specialist is strictly required at this
size: there is no real backend, no design system, and a single screen. `api-integration` is
optional input for Q3 only.
