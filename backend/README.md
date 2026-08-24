# Backend — User Layer



## User and Role task  - viktor

The system has two distinct permission levels that must never be merged:

**Global permissions:** A boolean `isDirector` flag on each user. Directors are global system administrators who can create accounts, deactivate users, and promote/demote other directors.

**Project permissions:** Three roles—COORDINATOR, EXECUTOR, PARTNER—that will be assigned per-project via a future `project_members` join table. These are **not stored on the user**; they exist only as a TypeScript enum (`src/common/enums/project-role.enum.ts`) and will be persisted separately once projects are built.

There is no `role` column on the User table. `isDirector` is the only permission field on the user itself.

## Data Model

### User Table

- **id** (UUID): Primary key, auto-generated.
- **firstName, lastName** (string): User's name.
- **email** (string): Unique, normalized to lowercase on write, immutable after creation. Login identifier.
- **phone** (optional string): Contact number.
- **passwordHash** (string): Bcrypt hash (cost 10). Never returned in API responses.
- **avatar** (optional string): Avatar URL or file reference.
- **accountStatus** (enum: ACTIVE | INACTIVE): Global account state. INACTIVE users cannot log in. Cannot be deleted; deactivation is the only way to revoke access without soft-deleting the account.
- **isDirector** (boolean): Global admin flag. Default false.
- **mustChangePassword** (boolean): Forces a password change on next login. Set to true when an account is created; flipped to false after the user sets their own password via the change-password endpoint.
- **lastLogin** (optional timestamp): Most recent login time (not yet populated; reserved for auth module).
- **createdAt, updatedAt** (timestamps): Automatically managed by Prisma.
- **deletedAt** (optional timestamp): Soft-delete marker. When set, the user is excluded from all queries. The single source of truth for deletion.

### AuditLog Table

Records privilege-escalation events: who (actor) changed what (target) and when. Currently only used for director-status changes.

- **id** (UUID): Primary key.
- **actorId** (string): ID of the director making the change.
- **targetId** (string): ID of the user being changed.
- **action** (string): Event type (e.g., `DIRECTOR_STATUS_GRANTED`, `DIRECTOR_STATUS_REVOKED`).
- **metadata** (optional JSON string): Additional context (e.g., `{"previousValue": false, "newValue": true}`).
- **createdAt** (timestamp): Auto-generated.

## Endpoints

All endpoints live under the `/api/v1` prefix and exclude `passwordHash` from responses.

Every route requires a valid access token sent as `Authorization: Bearer <token>`; the director-only routes additionally require `isDirector`. See `docs/auth.md` for how the frontend obtains and refreshes that token.

### User Management

- **POST /api/v1/users** — Create a new user. No password field; a temporary password is server-generated and returned once in the response body. User is created with `mustChangePassword: true` and `accountStatus: ACTIVE`. Body: `{ firstName, lastName, email, phone? }`. Returns: `{ user, tempPassword }`.
  - Permission: Director-only.

- **GET /api/v1/users/:id** — Retrieve a user by ID. Excludes soft-deleted users. Returns all user fields except `passwordHash`.
  - Permission: Any authenticated user. Open question: should this be director-or-self only?

- **GET /api/v1/users/me** — Retrieve the current authenticated user. Excludes soft-deleted users.
  - Permission: Any authenticated user.

- **PATCH /api/v1/users/:id** — Update own profile (firstName, lastName, phone, avatar only). Self-only; actor ID must match target ID. Other fields (email, accountStatus, isDirector) are silently ignored even if sent. Body: `{ firstName?, lastName?, phone?, avatar? }`.
  - Permission: Self-only.

- **PATCH /api/v1/users/:id/status** — Toggle account status between ACTIVE and INACTIVE. Prevents deactivating the last remaining active director. Body: `{ accountStatus: ACTIVE | INACTIVE }`.
  - Permission: Director-only.

- **PATCH /api/v1/users/:id/director-status** — Grant or revoke director status. Audit-logged. Prevents self-revocation and prevents demoting the last active director. Body: `{ isDirector: boolean }`.
  - Permission: Director-only; actor must not be target for revocation.

- **POST /api/v1/users/me/password** — Change own password. Verifies current password; on success, sets the new password hash and clears `mustChangePassword`. Body: `{ currentPassword, newPassword }`. Password must be 8+ characters with at least one uppercase, one lowercase, one digit, and one special character (@$!%*?&).
  - Permission: Any authenticated user.

- **DELETE /api/v1/users/:id** — Soft-delete a user (sets `deletedAt`). Prevents deleting the last remaining active director. Does not hard-delete; email remains reserved. HTTP 204 response.
  - Permission: Director-only.

## Soft Delete

`deletedAt` is the sole deletion marker. When set, the user is excluded from `findById()`, `findByEmail()`, and all other lookups. A deleted user's email is never released for reuse. `accountStatus` remains independent: a user can be ACTIVE or INACTIVE regardless of `deletedAt` state.

## Audit Log

Currently, only director-status changes are audit-logged (grants and revocations, with previous/new values in metadata). The `AuditLogService` writes to the database; there is no public API endpoint to retrieve audit logs yet. Future features (password resets, account deactivations, email changes if they become mutable) should log via the same service.

## Not Built Yet

The following are intentionally out of scope:

- **Logout and `lastLogin`:** the auth module issues and rotates tokens but has no logout endpoint, and successful logins are not recorded. Both belong to F1.1.

- **Rate limiting:** `POST /api/v1/auth/login` accepts unlimited attempts.

- **Project and member endpoints:** No `projects` table, no `project_members` table, no endpoints to assign users to projects or manage project roles.

- **Email sending:** No SMTP, no email templates. Password creation currently returns the temp password in the API response only.

- **Password reset:** No forgot-password flow. The only ways to set a password are (1) on account creation via admin, or (2) via the authenticated `POST /api/v1/users/me/password` endpoint.

## Getting Started

### Install dependencies
```bash
npm install
```

### Set up the database

Run migrations:
```bash
npx prisma migrate dev --name init
```

Seed the database with test data (3 bootstrap directors and 3 regular users):
```bash
npx prisma db seed
```

### Run the development server
```bash
npm run start:dev
```

The server starts on `http://localhost:3000`. Swagger documentation is available at `http://localhost:3000/api/docs`.

### Run tests
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

### Build for production
```bash
npm run build
```

Start the built application:
```bash
npm run start:prod
```

## Code Organization

- `src/users/` — User controller, service, DTOs, and tests.
- `src/users/audit-log.service.ts` — Audit logging for director-status changes.
- `src/auth/` — Login, refresh, `/auth/me`, JWT strategy, and the JwtAuthGuard / DirectorGuard used across the API.
- `src/common/enums/project-role.enum.ts` — TypeScript enum for future project roles (not persisted).
- `prisma/schema.prisma` — Prisma schema (User and AuditLog models).
- `prisma/migrations/` — Database migrations.
- `prisma/seed.ts` — Test data seeding script.

## Testing

Unit tests cover all service methods: account creation, lookups, self-edits, status/director changes, password changes, soft deletes, and guard logic (last-director protection, self-revocation blocking). Run `npm test` to execute.

The test suite verifies:
- Temporary password generation and proper exclusion from responses.
- Email normalization and duplicate-email rejection.
- Explicit field allow-listing in updates (no mass-assignment).
- Director promotion/demotion with audit logging.
- Last-active-director guards on all three removal paths.
- Self-revocation prevention.
- Soft-delete behavior and audit trail accuracy.
