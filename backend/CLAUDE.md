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
  `project_members` join table. The `ProjectRole` enum may exist as a
  TypeScript type, but must NOT be persisted on the user.
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
- Defaults: `OVERVIEW`, `TASKS`, `CALENDAR` are inserted as real
  `user_module_access` rows at user creation (not hardcoded/implicit) so that
  granting and *revoking* any module—including a default one—is always
  the same operation: insert/delete a row. Changing the global default set
  later requires a data migration for existing users, not just a code change.
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

## Scope right now
- User layer only. Do NOT build /projects or /members endpoints yet, but keep
  the design ready for the project_members table to be added later without
  rewriting the user model.

## Conventions
- UUID primary keys.
- created_at / updated_at auto-managed by the ORM.
- One migration per logical change; never edit an already-run migration.