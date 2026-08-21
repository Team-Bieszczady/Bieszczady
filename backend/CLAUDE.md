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
- Accounts are created by a director, not by public self-registration. The
  create-user body has no `password` field.
- On creation: generate a temp password, hash it, set must_change_password =
  true, account_status = active.
- On first login, must_change_password = true forces setting a new password
  before any other access; setting it flips the flag to false.

## Scope right now
- User layer only. Do NOT build /projects or /members endpoints yet, but keep
  the design ready for the project_members table to be added later without
  rewriting the user model.

## Conventions
- UUID primary keys.
- created_at / updated_at auto-managed by the ORM.
- One migration per logical change; never edit an already-run migration.