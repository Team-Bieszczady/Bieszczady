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

Every privileged change to a user is recorded: director-status grants and revocations (with previous and new values in metadata), password changes, account deactivations and reactivations, and soft deletions. The `AuditLogService` writes to the database; there is no public API endpoint to retrieve audit logs yet. Password resets will log through the same service once they exist (F1.4, F1.5).

## Security

### Authentication

Access tokens are JWTs valid for 15 minutes, sent as `Authorization: Bearer <token>`.
The payload carries only `sub` — the user id. No roles, no permissions: the server looks
the user up on every request, so revoking someone's access takes effect on the next call
rather than whenever their token happens to expire.

Refresh tokens are opaque random values valid for 7 days, delivered only as an `httpOnly`
cookie. They are stored SHA-256 hashed, never in plaintext, and are single-use — every
refresh issues a new one. Replaying a consumed token is treated as theft and revokes every
session of that user.

### Cookie settings

`httpOnly`, `sameSite: strict`, `path` scoped to the auth endpoints, and `secure` unless
`NODE_ENV=development`. The `secure` flag defaults to on — only an explicit `development`
turns it off — so a missing or misspelled environment value fails safe.

### Rate limiting

`POST /api/v1/auth/login` allows 5 requests per minute per IP. Further requests get
`429 Too Many Requests` before the password is even checked. Configured in `AuthModule`
with `@nestjs/throttler`.

Behind a reverse proxy this counts the proxy's IP unless Express is told to trust it.
Check before the first deployment.

### Login attempts

Successful and failed logins are written to the application log by `AuthService`. Failures
at `warn` with the submitted email, successes at `log` with the user id. Passwords and
tokens are never logged.

### Error messages

A failed login always returns the same `401` body, whether the account exists or not. When
no user matches, the submitted password is compared against a dummy bcrypt hash so the
response takes the same time either way — otherwise a stopwatch would reveal which
addresses are registered.

### Passwords

Stored as bcrypt hashes and never returned by any endpoint. `UsersService` strips
`passwordHash` from every result; the single exception is `findByEmailForAuth`, which
exists only so login can verify a password.

### Input validation

Every request body is checked by a global `ValidationPipe` against the endpoint's DTO
before a handler runs: required fields, types, email format, and maximum lengths. Route
parameters go through `ParseUUIDPipe`, so a malformed id is rejected with `400` and never
reaches the database. `whitelist` and `forbidNonWhitelisted` mean unknown properties are
rejected rather than silently ignored, which is what keeps a request from setting a field
the DTO does not list.

### SQL injection

Prisma builds every query as a parameterised statement, so values coming from a request
are always sent as data and never spliced into SQL text. Ordinary calls
(`findFirst`, `create`, `update`, `updateMany`, `count`) carry no injection risk.

The single raw query in the codebase is `` $queryRaw`SELECT 1` `` in the health check. It
is a fixed string with no interpolation, and it uses the tagged-template form, which
parameterises any `${}` it is given. The `Unsafe` variants (`$queryRawUnsafe`,
`$executeRawUnsafe`), which concatenate strings directly, are not used anywhere.

### Error responses

All errors share one shape, produced by `AllExceptionsFilter`:

```json
{
  "code": "BAD_REQUEST",
  "message": "Nieprawidłowe dane",
  "fields": { "firstName": ["firstName must be shorter than or equal to 60 characters"] }
}
```

`code` is a stable identifier the frontend can branch on without parsing prose, derived
from the HTTP status: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`,
`TOO_MANY_REQUESTS`, `SERVICE_UNAVAILABLE`, and `INTERNAL_ERROR` for anything else. `message` is always a string. `fields` maps a field
name to its problems, or is `null` when the error is not about a specific field.

Unrecognised exceptions become `500` with a generic message; the real error goes to the
server log only, so stack traces and internal details never reach the client.

### HTTPS

Required in production. The refresh cookie carries `Secure` there, so it is not sent over
plain HTTP at all — a deployment without TLS breaks session refresh rather than leaking
the token.

### Not covered yet

- No account lockout after repeated failures. Rate limiting is per IP, not per account.
- The audit entry is written after the transaction commits, not inside it. If the audit
  write fails, the change itself has already happened but leaves no trace in `audit_logs`.
- `validateEnv` only checks that required variables are present, not that their values are
  sensible. A short or reused `JWT_ACCESS_SECRET` passes.
- Optional variables still fall back to defaults: a missing `CORS_ORIGIN` silently becomes
  `http://localhost:5173`, which is wrong in production but does not stop startup.

## Not Built Yet

The following are intentionally out of scope:

- **Logout and `lastLogin`:** the auth module issues and rotates tokens but has no logout endpoint, and successful logins are not recorded. Both belong to F1.1.

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
- `src/users/audit-log.service.ts` — Writes audit entries for privileged user changes.
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
