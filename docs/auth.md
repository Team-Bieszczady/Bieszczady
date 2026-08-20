# Authentication — frontend guide

How the frontend talks to the API. Read this before wiring up any request.

## Two tokens, two very different jobs

| | Access token | Refresh token |
|---|---|---|
| Lifetime | 15 minutes | 7 days |
| Stored in | **Memory only** (a variable / React state) | `httpOnly` cookie |
| Frontend touches it? | Yes — you send it | **No** — you never see it |

<<<<<<< HEAD
=======
**Never put the access token in `localStorage` or `sessionStorage`.** Anything stored there can be read by any script running on the page, so a single XSS bug hands an attacker a working token. Keeping it in memory means it disappears on page refresh — that is the point, not a bug. See *Page refresh* below.

>>>>>>> da2d384 (docs: describe auth transport for the frontend)
The refresh token lives in an `httpOnly` cookie, which JavaScript cannot read at all. The browser attaches it automatically. There is nothing for you to store or manage.

## Sending requests

Every authenticated request needs two things:

```js
<<<<<<< HEAD
fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/me`, {
=======
fetch('/api/v1/users/me', {
>>>>>>> da2d384 (docs: describe auth transport for the frontend)
  headers: { Authorization: `Bearer ${accessToken}` },
  credentials: 'include',
});
```

1. `Authorization: Bearer <accessToken>` — proves who you are.
2. `credentials: 'include'` — tells the browser to attach the refresh cookie.

**`credentials: 'include'` is required on every request, including login and refresh.** Without it the browser silently drops the cookie and session refresh stops working. This is the single most common mistake here, and it fails quietly — everything looks fine until the access token expires.

## Handling a 401

A 401 usually just means the access token expired. Don't log the user out yet:

1. Call `POST /api/v1/auth/refresh` (no body, `credentials: 'include'`).
2. Store the new `accessToken` from the response in memory.
3. Retry the original request.
4. If the refresh call **also** returns 401, the session is genuinely over — clear the token and redirect to the login screen.

Worth centralising this in one place (an interceptor or a `fetch` wrapper) rather than repeating it per call.

## Page refresh

The access token is gone after a reload, so on app startup:

1. Call `POST /api/v1/auth/refresh`.
2. If it succeeds, you have a token and a user — the session continues.
3. If it returns 401, show the login screen.

Do this before rendering anything that requires a user, otherwise the app will flash the login screen for users who are still signed in.

<<<<<<< HEAD
## Never call refresh twice at the same time

Refresh tokens rotate: every successful refresh invalidates the token that was
used and issues a new one. Using the same refresh token twice is treated as
theft — the server revokes **every** session for that user.

That means two parallel `/auth/refresh` calls with the same cookie will log the
user out of everything. The first succeeds, the second looks like a stolen token.

React's StrictMode runs effects twice in development, so the startup refresh
from the previous section will fire twice out of the box. Guard against it:
keep a single in-flight promise and have every caller await the same one,
rather than starting a new request each time.

This is also why the 401 retry logic belongs in one shared place — two failing
requests must not trigger two refreshes.

=======
>>>>>>> da2d384 (docs: describe auth transport for the frontend)
## Endpoints

```
POST /api/v1/auth/login     { email, password }   →  { accessToken, user }
POST /api/v1/auth/refresh   (no body)             →  { accessToken, user }
GET  /api/v1/auth/me        (Bearer token)        →  user
```

<<<<<<< HEAD
`user` contains: `id`, `email`, `firstName`, `lastName`, `isDirector`, `accountStatus`, `mustChangePassword`.
=======
`user` contains: `id`, `email`, `firstName`, `lastName`, `role`, `accountStatus`, `mustChangePassword`.
>>>>>>> da2d384 (docs: describe auth transport for the frontend)

## Things that will trip you up

- **The refresh token never appears in a response body.** It only ever travels as a cookie. If you're looking for it in JSON, stop.
- **The refresh cookie is scoped to `/api/v1/auth/refresh`.** The browser will not send it to any other path. That is deliberate.
- **CORS:** the API only accepts requests from the origin set in `CORS_ORIGIN` (`http://localhost:5173` in development). A different port means the request is rejected before it reaches any of this.
- **`mustChangePassword: true`** means the user is still on an admin-issued password and must set their own before doing anything else.
<<<<<<< HEAD
- **`isDirector` is not a role.** It is a global admin flag, and it is the only permission this endpoint returns. Project roles (coordinator, executor, partner) are per-project and will arrive on a separate endpoint once projects exist — do not expect them here.
- **`sameSite: 'strict'` and production domains:** the refresh cookie is only sent when the request comes from the same site. This is fine in development (`localhost:5173` → `localhost:3000`). If the frontend and the API ever end up on genuinely different domains, the browser will silently stop sending the cookie and session refresh will break with no error anywhere. Check this before the first deployment.

=======
>>>>>>> da2d384 (docs: describe auth transport for the frontend)
