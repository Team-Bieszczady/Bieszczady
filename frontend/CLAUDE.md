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
  login/refresh/me response) is the sole source of truth for what a user can
  see/reach. Never derive access client-side from anything else.
- Two enforcement points, both required for every gated route — neither
  alone is sufficient:
  1. **Nav filtering** — `ORG_NAV_ITEMS` / `PROJECT_NAV_ITEMS` items each
     carry a `module` key; `DesktopSidebar`/`MobileNav` filter through
     `hasModule(user, item.module)` before rendering.
  2. **Route guarding** — every gated route in `Router.tsx` is wrapped in
     `<RequireModule module="X" />` (mirrors `RequireAuth.tsx`), so direct
     URL entry is blocked, not just hidden nav links.
- `/` (Dashboard) and `/profile` are baseline routes, never gated by module —
  only by `RequireAuth`.
- Adding a new gated module/route end-to-end: see
  `.claude/skills/add-gated-module/SKILL.md`.
