# Backend — NestJS User & Role System

## Stack
- NestJS + TypeScript, Prisma, Microsoft SQL Server
- Validation: class-validator in DTOs
- Password hashing: bcrypt


## Architecture — read before touching users or roles

### Two levels of permissions (do not merge them)
- GLOBAL — on the `users` table:
  - `is_director` (bool): global system admin. Creates accounts, deactivates
    users, promotes other directors, manages the app. NOT a project role.
  - `account_status` (enum active/inactive): global. Inactive = cannot log in
    anywhere. Checked at login before anything else.
- PROJECT — roles COORDINATOR / EXECUTOR / PARTNER are PER-PROJECT. The same
  user can be COORDINATOR in one project and EXECUTOR in another.

### Hard rules
- There is NO `role` column on the users table. Project roles live on a future
  `project_members` join table. `PROJECT_ROLES` may exist as a TypeScript
  const/type, but must NOT be persisted on the user.
- DIRECTOR is never a project role. Project role enum has exactly three values:
  COORDINATOR, EXECUTOR, PARTNER.
- `email` is unique, stored lowercase, and IMMUTABLE after creation. It is the
  login identifier. No endpoint may change it.
- Passwords: never stored, logged, or returned as plaintext. `password_hash` is
  never returned in any response and never serialized.
- No single "god" PATCH. A user editing themselves may change ONLY first_name,
  last_name, phone, avatar. email / is_director / account_status / password are
  rejected there even if sent in the body. Always use an explicit allow-list
  DTO — never bind the raw request body to the entity (mass-assignment /
  privilege-escalation guard).
- `is_director` can ONLY be changed via PATCH /users/:id/director-status, never
  via the self-edit endpoint. It is the highest privilege in the app.


### Account & password flow
- Accounts are created by a director, not by public self-registration.
- On creation: the director supplies an initial password in the create-user
  body. The backend hashes it via bcrypt and sets must_change_password =
  true, account_status = active.
- On first login, must_change_password = true forces setting a new password
  before any other access; setting it flips the flag to false. This safeguard
  applies regardless of who chose the initial password.

## Module access (flat, binary—NOT the future ERD permission model)

- Modules are a closed TS-only list (`backend/src/common/enums/module.enum.ts`,
  export `MODULES`), mirrored byte-for-byte in the frontend at
  `frontend/src/lib/modules.ts`. Current values:
  `PROJECTS, PEOPLE, CALENDAR, DECISIONS, SETTINGS, OVERVIEW, TASKS, BUDGET,
  DOCUMENTS`. Like `ProjectRole`, this is a TS enum only—SQL Server does not
  get a native Prisma `enum`; the `user_module_access.module` column is a
  validated `String`.
- Access is flat/binary: a row in `user_module_access` = access granted, no
  row = no access. There is no per-action or per-project/activity scoping yet
  (see "Future extension" below).
- `is_director` bypasses module access entirely—a director is never checked
  against `user_module_access` and always has every module.
- Defaults: `PROJECTS`, `OVERVIEW`, `TASKS`, `CALENDAR` are inserted as real
  `user_module_access` rows at user creation (not hardcoded/implicit) so that
  granting and *revoking* any module—including a default one—is always
  the same operation: insert/delete a row. Changing the global default set
  later requires a data migration for existing users, not just a code change
  (`PROJECTS` joining the set is one:
  `migrations/20260910170000_grant_projects_module`).
- `OVERVIEW`, `TASKS`, `BUDGET` and `DOCUMENTS` are tabs *inside* a project and
  are worth nothing without `PROJECTS`: the frontend hides the whole tab strip
  without it, and every project endpoint requires it. That is why `PROJECTS` is
  a default, and why the frontend's module checkboxes tick it along with any
  tab (`applyModuleDependencies` in `frontend/src/lib/modules.ts`).
- The defaults apply **only when the create request supplies no `modules` list**.
  A supplied list is taken literally—empty array included—so a director can
  withhold a default (`ModuleAccessService.grantInitialModules`). Unioning the
  two would mean unticking a box in the create modal did nothing.
- Guard pattern: `@UseGuards(ModuleAccessGuard) @RequireModule('X')`
  (`backend/src/auth/guards/module-access.guard.ts`,
  `backend/src/auth/decorators/require-module.decorator.ts`), generalized
  from `DirectorGuard` via `Reflector`. Apply this to every controller
  endpoint that backs one of the modules above once it exists—e.g. when a
  real Projects/Tasks/Calendar/Budget/Documents/Decisions controller is
  built, gate its routes with the matching `@RequireModule(...)`. Today the
  only real application is `GET /users` and `GET /users/:id`, gated behind
  `@RequireModule('PEOPLE')`, because the Users module IS the backend for the
  "People directory" frontend module.
- `AuthenticatedUser.modules: Module[]` carries the user's *effective* module
  list (all 9, if director; otherwise their granted rows) and is populated in
  `auth.service.ts#toAuthenticatedUser`, present on every
  login/refresh/`/auth/me` response. The frontend never has to make a
  separate call to know what it can show.

### Future extension (do NOT build yet)
The separately-provided ERD models a richer `PERMISSION(module, action,
project_id?, activity_id?)` system once `projects`/`activities` tables exist.
This flat `user_module_access` table is intentionally the stepping stone: when
that lands, keep `user_module_access` as the "has any access to this module
at all" gate, and add the finer-grained table alongside it rather than
replacing it outright, mirroring how `project_members`/`ProjectRole` are kept
ready-but-unbuilt today.

## Projects domain

Tables, seed and endpoints are all built. The frontend is wired to them except for
the Zadania page, which still reads its in-memory mock, and the indicators/budget
placeholders. `docs/projects.md` is the frontend-facing guide; read this section
before changing the backend.

### Shape
`project` is the root. Beneath it: `stage` -> `activity` -> `task` -> `subtask`, plus `goal`,
`risk` and `project_member`. Three director-managed dictionaries hang off it:
`project_status` (carries a colour — the UI renders it as a pill),
`project_type` and `project_recipient`, the last two through the join tables
`project_types_on_projects` and `project_recipients_on_projects`.

### Rules
- **A stage is finished exactly when it has at least one task and all of them are
  `DONE`.** `stages.completed_at` is the single completion flag — there is no
  boolean beside it that could disagree — and nothing sets it by hand. A
  `BLOCKED` task therefore holds its stage open.
- `stages.deadline` is the CURRENT promise. `original_deadline` is written once,
  on the first move, so the trace points at what was first agreed rather than at
  the previous value; `deadline_note` says why it moved and is rewritten on every
  move.
- **Project roles live on `project_members.project_role`**, never on `users` —
  the same person coordinates one project and executes another. Values are
  exactly COORDINATOR / EXECUTOR / PARTNER — `PROJECT_ROLES` in
  `common/enums/project.enums.ts`, which is also where every other project-side
  value list lives (risk levels, colours, task status/priority).
- **Only ACTIVE users may be added to a project.** The seed holds to this; the
  members endpoint must enforce it. `GET .../available-members` — what every
  picker reads — additionally hides directors, since a director already reaches
  every project. `POST .../members` still accepts a director's id on purpose:
  hiding them is a UX rule, not a data rule, and nothing says a director may not
  also coordinate a project. Tightening the POST is a separate decision.
- `tasks` has **no `project_id`** — the project is reachable through
  activity -> stage -> project, and a second copy could disagree with the first.
- No native Prisma `enum` (SQL Server): `status`, `priority`, `project_role` and
  the rest are validated `String`s, matching `account_status` and `module`.
- Every relation is `onDelete: NoAction, onUpdate: NoAction`. SQL Server refuses
  multiple cascade paths and several of these tables reach `users` twice.

### Endpoints
- `src/projects/` is one module with eleven controllers: projects, the three
  dictionaries, stages, activities, goals, risks, members, tasks, subtasks.
  Reads require the `PROJECTS` module; **every write additionally requires
  `DirectorGuard`** — with one exception, tasks, described below.
- **Tasks and subtasks are the one place with per-project scoping.** They are
  gated on `TASKS`, not `PROJECTS`, and their writes deliberately carry no
  `DirectorGuard`. See "Tasks and subtasks".
- **Responses are mapped, not raw rows.** `include` produces join rows like
  `types: [{ projectType: { name } }]`; each service flattens to
  `{ id, name }`. A deliberate departure from `users.service.ts`, where the row
  shape is already right.
- **`StageCompletionService.settle(tx, stageIds)` is the only writer of
  `completed_at`**, and it runs inside the same transaction as the write that
  changed the task set. Two endpoints change it indirectly — deleting an activity
  destroys its tasks, moving one takes its tasks to another stage — so both
  settle *both* ends.
- **Timeline order is `sort_order`, never `deadline`.**
  `suggestFollowingStageShifts` (`shift-following-stages.ts`) asks which stages
  come after the moved one; ordering by deadline would sort the stage just
  pushed forward to the end of the list and suggest nothing.
- Stage-shift suggestions are returned, never applied. `POST /stages/cascade` is
  the separate, explicit call — the route keeps its original path even though the
  code now says "shift following stages" throughout.
- **Every project read is scoped to membership for non-directors** — a director sees
  every project, anyone else only the ones they are a member of. `GET /projects`
  filters in the `where`; every read that takes an id goes through
  **`ProjectAccessService.assertCanRead`** first: `GET /projects/:id`, stages, goals,
  risks, members, available-members, tasks, my-tasks, `GET /tasks/:id` and a task's
  subtasks (the last two locate their project with `locateTask`, since `tasks` has no
  `project_id`). A non-member gets **404, not 403** — the list already *hides* rather
  than refuses, and a 403 would confirm the id exists.
  This replaced the private `assertProjectExists` those services each carried;
  `assertCanRead`'s sibling `assertExists` is the existence-only check the
  director-gated writes still need.
  Until 2026-09, only the list was scoped. A stale `selectedProjectId` in the
  frontend's `localStorage` therefore showed a non-member another team's project on
  Przegląd, with a 200 — fix both halves together if you ever revisit this.
- **No audit logging.** Only account privilege and lifecycle changes are audited;
  `audit_logs` has no entity-type column to distinguish a project target from a
  user one. Adding project auditing is a separate decision.

## Tasks and subtasks

Built. `docs/projects.md` §Tasks is the frontend-facing guide. This section is the
part a backend change has to respect.

### Permissions — the first per-project check in the app
| Action | Who |
|---|---|
| Read any task list | anyone with the `TASKS` module |
| Create / edit / delete a task, reassign its owner | a director **or the COORDINATOR of that project** |
| Change a task's status | a director, that project's coordinator, **or the task's owner** |
| Any subtask write | **only the task's owner** — a director who does not own it is refused |

Two things here run against the grain of the rest of the codebase, on purpose:

- **Task writes carry no `DirectorGuard`.** They cannot: a coordinator may write,
  and which project a task belongs to is only knowable after
  activity -> stage -> project, because `tasks` has no `project_id`. The rule
  therefore lives in `ProjectAccessService` — one file, so it has a single home —
  following the in-service membership precedent of
  `RisksService.assertResponsibleIsMember`. It runs inside the same transaction as
  the write, so a membership revoked mid-request cannot authorise anything.
- **Subtasks are the one write a director cannot perform.** A checklist is the
  assignee's own breakdown of their work, not a management surface. This mirrors
  the frontend's `canManageSubtasks`. Consequence worth knowing: removing a project
  member nulls their tasks' `owner_id`, so those checklists have **nobody** who can
  edit them until the task is reassigned.

### Rules
- **A subtask is a separate table, never a `parent_task_id` on `tasks`.**
  `StageCompletionService` decides a stage by counting rows in `tasks`; child rows
  in that table would silently enter the count, and one missed `parentTaskId: null`
  filter would corrupt stage completion. A subtask also has no status, priority,
  owner or due date of its own — only `done`.
- **Subtasks never affect anything.** They do not touch the parent task's status,
  they are not counted by `StageCompletionService`, and no subtask path may ever
  call `settle`. They drive a progress bar and nothing else.
- **Every task write settles its stage**, and a task re-filed to an activity under
  a different stage settles **both** ends — the same contract as moving an activity.
  `PATCH /tasks/:id/status` is what finally lets a stage close through the API.
- **Status has its own endpoint.** That is what lets the owner tick a task without
  also being able to retitle or reassign it, and it is why `status` is absent from
  `UpdateTaskDto` (sending it there is a 400, not a quiet no-op).
- **A task's owner must be a member of its project** — a 409, mirroring risks.
  Ownership grants subtask access, so setting it is a privilege grant and is
  validated as one. Re-filing a task into another project is refused for the same
  reason.
- **Nothing cascades.** `subtasks` has to be deleted before its task, which means
  four paths, not one: task delete, activity delete, stage delete with
  `strategy=delete`, and project delete. `strategy=move` must **not** delete them —
  it re-points activities, so the work travels with them.

### Scope right now
- Subtask **reordering** is not exposed; `sort_order` is server-assigned on create
  and holes are left on delete (it is neither displayed nor unique, unlike
  `goal_number`).
- There is no cross-project task list. `my-tasks` is project-scoped, because the
  Zadania page is.
- Task reads are scoped to the project, not within it: `assertCanRead` keeps a
  non-member out, but anyone with `TASKS` who *is* a member sees every task in that
  project, not only their own. Narrowing further would buy nothing today, since the
  same rows are already readable through the nested stages response.
- Indicators and budget stay out; budget is hardcoded in the UI for now.
- Meetings, documents, partners and participants from the ERD are not modelled.
- The Zadania page still reads its in-memory store. Wiring it to the task
  endpoints — a `tasksApi` plus TanStack Query hooks — is the next round.

### Seed
`prisma/seed.ts` calls `prisma/seed-projects.ts`, which creates the dictionaries,
seven ACTIVE project people, and one fully-populated project ported from the
frontend mock — Solina–Polańczyk carries a stage in every state (finished on
time, finished late, running with a moved deadline, running and overdue, empty,
not started, archived). Rows use deterministic ids derived from a hash of a
stable key, so re-running updates rather than duplicates.

Two Solina tasks carry a subtask checklist: `zad-sp-7` is 2-of-4 ticked (a
half-filled bar) and `zad-sp-12` is fully ticked while still `BLOCKED` — proof that
a finished checklist neither completes its task nor closes its stage. Every task
owner is a member of their project, which the task endpoints now enforce.

## Conventions
- UUID primary keys.
- created_at / updated_at auto-managed by the ORM.
- One migration per logical change; never edit an already-run migration.