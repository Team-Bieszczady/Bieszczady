# Frontend — React + Vite + react-router v7

## Stack
- `react-router` (v7 package, NOT `react-router-dom`)
- TanStack Query for ALL server data — never raw `useState`/`fetch` in a
  component or hook. Pattern: `lib/api.ts` (plain fetch wrapper, throws
  typed `ApiError`) → a `useQuery`/`useMutation` hook in the relevant
  `features/<name>/hooks/` folder → consumed by components.
- react-hook-form for ALL forms — never raw `useState` per field. See
  `features/people/components/AddUserModal.tsx` as the reference pattern
  (react-hook-form + `Modal` + `toast` + a TanStack mutation hook, submit
  invalidates the relevant query key(s)).

## Account status
- The backend stores exactly two values in `account_status`: `ACTIVE` /
  `INACTIVE`. `PersonStatus` (`features/people/data.ts`) has two extra,
  **display-only** values derived in `mapUserToPerson.ts`: `DELETED` (from
  `deletedAt`) and `PENDING` (active account that has never been logged into,
  i.e. `lastLogin === null`). Neither is ever sent to or expected from the
  backend.
- Anything that *writes* status reads `Person.accountStatus`, never
  `Person.status` — the display value would make a PENDING account look
  inactive. Filtering and sorting use `Person.status`, since those are
  client-side only.
- Accounts are director-created and active immediately; the first-login gate
  is `mustChangePassword`, not the account status.

## Dates
- Backend timestamps cross the wire as UTC ISO strings and are stored raw on
  `Person` (`lastLoginAt`, `createdAt`). Format at render with
  `features/people/utils/formatDateTime.ts` — never inside a `queryFn`, or the
  wording freezes into the TanStack cache and goes stale in an open tab.

## Module access (mirrors backend/CLAUDE.md — read that section too)
- Canonical module list lives in `src/lib/modules.ts` (`MODULES` const) and
  MUST match `backend/src/common/enums/module.enum.ts` byte-for-byte:
  `PROJECTS, PEOPLE, CALENDAR, DECISIONS, SETTINGS, OVERVIEW, TASKS, BUDGET,
  DOCUMENTS`.
- `AuthContext`'s `user.modules` (populated straight from the backend's
  login/refresh/me response) is the org-wide source of truth for every module
  except `TASKS`, `BUDGET` and `DOCUMENTS` (`PROJECT_SCOPED_MODULES`). Those
  three are granted per project only: the project card's `viewerModules` from
  `GET /projects` says which the viewer has in that project. Check them with
  `hasProjectModule(user, project, module)`, or
  `useCanUseProjectModule(projectId, module)` inside a page — never
  `hasModule` for those three.
- Per-project modules are set per member in Przegląd → Zespół
  (`TeamMemberFormModal`: osoba, rola, dostęp), director only. Ludzie has no
  "Dostęp" menu, and `AddUserModal` doesn't offer the three scoped modules.
- Two enforcement points, both required for every gated route — neither
  alone is sufficient:
  1. **Nav filtering** — `ORG_NAV_ITEMS` / `PROJECT_NAV_ITEMS` items each
     carry a `module` key; `useNavData`'s `canSee` filters through
     `hasProjectModule(user, selectedProject, item.module)`.
  2. **Route guarding** — every gated route in `Router.tsx` is wrapped in
     `<RequireModule module="X" />` (mirrors `RequireAuth.tsx`), so direct
     URL entry is blocked, not just hidden nav links. For a project-scoped
     module it also checks the selected project's `viewerModules`.
- A nav item may instead carry `directorOnly: true` and no `module` — a page
  no grant can unlock, gated on `is_director` at both points (`canSee` in
  `useNavData`, `<RequireDirector />` in `Router.tsx`). Partnerzy is the one
  today. Prefer a module when the access should be grantable; `directorOnly`
  keeps a page out of `MODULES` and therefore out of the backend enum mirror.
- `/` (Dashboard) and `/profile` are baseline routes, never gated by module —
  only by `RequireAuth`.
- Adding a new gated module/route end-to-end: see
  `.claude/skills/add-gated-module/SKILL.md`.
