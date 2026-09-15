# Projects — frontend guide

How the projects API works and what it expects of you. Read this before wiring up
the Przegląd projektu page.

Everything here lives under `/api/v1` and needs a bearer token (see
[auth.md](./auth.md)).

## Who can do what

Two gates, both server-side:

| | Read | Write |
|---|---|---|
| Director | yes | yes |
| Anyone with the `PROJECTS` module | yes | **403** |
| Anyone else | 403 | 403 |

Every write is director-only, which matches what the UI already assumes —
`canEdit={!!user?.isDirector}` on every section. Module access is read from the
database on each request, not from the token, so revoking `PROJECTS` takes effect
immediately without a re-login.

**Tasks and subtasks are the exception to all of this**, and the only one. They are
gated on the `TASKS` module rather than `PROJECTS`, a project's COORDINATOR may
write them, and a subtask is the one thing a director cannot write unless the task
is theirs. See §Tasks and §Subtasks. Everywhere else the table above holds: a
director can edit every project, a non-director none, including projects they are a
member of.

## Dates

Every date the API returns is an ISO string. The date-only ones — `startDate`,
`deadline`, `originalDeadline`, `plannedEndDate`, `dueDate` — carry a midnight
time component because SQL Server hands them back that way. Slice to 10
characters and compare as strings:

```js
const day = (d) => d?.slice(0, 10);         // '2026-10-31T00:00:00.000Z' -> '2026-10-31'
if (day(stage.deadline) < todayIso) { /* overdue */ }
```

Never `new Date('2026-10-31')` for these. That parses as UTC midnight and renders
as the 30th in Poland.

`completedAt` and `archivedAt` are real timestamps and are safe to parse.

## Money

`budgetAmount` is a **string**, both in and out (`"125000.50"`). It is a
`DECIMAL(12,2)` in the database, and a JSON number would silently lose the
cents. Do not `parseFloat` it before sending it back.

## The list

`GET /projects` returns what the project cards need, already computed — you do
not have to fetch stages or members to render a card:

```
peopleCount   number of members
progress      0–100, done tasks / all tasks across live stages
taskCounts    { total, done }
stageCount    live stages
stageLabel    "Etap 3/6", or "Brak etapów"
daysLeft      until plannedEndDate; negative when past, null when no date
```

Archived projects are excluded. `?archived=true` includes them.

`status`, `types` and `recipients` come back flattened to `{ id, name }`
(`status` also has `color`) — no join rows to unwrap.

## Stages: the timeline

`GET /projects/:projectId/stages` returns stages **in plan order** (`sortOrder`),
each with its activities and:

```
counts        { total, done, pending }   tasks under the whole stage
completedAt   null while unfinished
```

**A stage is finished exactly when it has at least one task and all of them are
`DONE`.** That is the only rule; there is no "mark as completed" button and no
endpoint that sets `completedAt` by hand. Consequences worth knowing:

- A `BLOCKED` task holds its stage open — `BLOCKED` is not `DONE`.
- An **empty stage never closes**. A newly created stage is open, and a stage
  whose last task is deleted reopens.
- The stage closes and reopens on its own as tasks change, including
  indirectly: moving an activity to another stage takes its tasks with it, so
  the stage it left may close and the one it joined may reopen. `counts` is
  always the evidence — `completedAt` is set exactly when
  `counts.total > 0 && counts.done === counts.total`.

Plan order is `sortOrder`, not `deadline`. A moved deadline changes when a stage
is due, not where it sits in the sequence — and the stage-shift suggestions below
depend on that being true.

### Moving a deadline

`PATCH /stages/:id` edits **name and description only**. Dates change through one
endpoint and one only:

```
PATCH /stages/:id/deadline   { deadline, note? }
```

That is what guarantees every date change leaves a trace:

- `originalDeadline` is written on the **first move only**, so the trace points
  at what was first agreed rather than at the previous value.
- `deadlineNote` is **rewritten on every move**, because the comment worth
  reading is the one explaining the date now in force. Sending no note clears it.

The response is `{ stage, suggestions }`. `suggestions` lists the later stages
whose deadline now falls before the moved one:

```json
{ "stageId": "…", "name": "Odbiór końcowy",
  "currentDeadline": "2026-10-20T00:00:00.000Z",
  "suggestedDeadline": "2027-02-14T00:00:00.000Z" }
```

**Nothing downstream has been changed.** Show them, let the coordinator accept
some or none, and send back only the accepted ones:

```
POST /stages/cascade   { shifts: [{ stageId, deadline }], note? }
```

Each shifted stage records its own trace, exactly as a manual move would. Pulling
a deadline *earlier* never produces suggestions — it squeezes nobody.

### Deleting a stage

A stage holding activities needs a strategy, because an activity without a stage
is not representable:

```
DELETE /stages/:id?strategy=none              only succeeds on an empty stage
DELETE /stages/:id?strategy=move&targetStageId=…   activities and tasks move
DELETE /stages/:id?strategy=delete            activities and tasks are destroyed
```

Omitting `strategy` on a stage that has activities is a 409 — ask the user first.

## Tasks

Tasks come back two ways. Nested inside the stages response — every activity carries
its `tasks`, each one `{ id, title, status, priority, dueDate, owner }` — which is
what Harmonogram renders, and where a stage's `counts` are folded from, so what you
draw and what the badge says can never disagree. And as their own list, for Zadania:

```
GET /projects/:projectId/tasks       every task in the project
GET /projects/:projectId/my-tasks    only the signed-in user's
GET /tasks/:id                       one task
```

**These are gated on `TASKS`, not `PROJECTS`.** Both lists take `?archived=true`;
by default tasks under an archived stage are left out, matching the stages read and
the project cards' `progress`.

A row is a superset of the nested shape:

```
id, title, status, priority, dueDate, owner       as nested
description, activityId, projectId
activity        { id, name }
stage           { id, name, deadline, archivedAt }
subtaskProgress { done, total, percent }
subtasks        [{ id, title, done, sortOrder }]
createdAt, updatedAt
```

`stage` and `activity` are there so a row can render its "KATEGORIA" chip and
"Etap · Działanie" without fetching the stages tree. `stage.deadline` is what a task
with no `dueDate` of its own inherits — the API does not do that fallback for you.

**"Mine" is literal.** `my-tasks` filters to the caller, so a director calling it
gets the tasks assigned to *them*, usually none. Pick the endpoint by role rather
than expecting the server to widen it.

**The sidebar badge follows the same split.** Every project card carries
`viewerManages` (a director, or that project's COORDINATOR) beside
`taskCounts: { total, done, mine }`. The Zadania badge shows `total` when
`viewerManages` and `mine` otherwise — counted over the same non-archived stages the
lists use, so the number beside the link and the rows behind it cannot disagree. They
did while the badge was hardcoded to `total`: a member owning one of seven tasks saw
a badge of 7 over a one-row table.

### Who can write a task

This is **the only per-project permission in the API.** Everywhere else a director
writes and nobody else does; here a coordinator does too.

| | Read | Create / edit / delete | Change status | Subtasks |
|---|---|---|---|---|
| Director | yes | yes | yes | **no** — unless it's their task |
| COORDINATOR of that project | yes | yes | yes | only their own tasks |
| Any other member | yes | 403 | only their own tasks | only their own tasks |

```
POST   /activities/:activityId/tasks   create
PATCH  /tasks/:id                      title, description, priority, dueDate, ownerId, activityId
PATCH  /tasks/:id/status               { status }
DELETE /tasks/:id                      204, takes its subtasks with it
```

- **Create hangs off the activity**, not the project — that is the task's real
  parent, and tasks carry no `project_id`.
- **`status` is not on `PATCH /tasks/:id`.** It has its own endpoint precisely so the
  person the work belongs to can tick it without also being able to retitle or
  reassign it. Sending `status` to the general patch is a 400, not a no-op — the same
  trap as dates on `PATCH /stages/:id`.
- **Sending `activityId` re-files the task.** If the target activity sits under a
  different stage, both stages are re-evaluated. A target in a *different project* is
  a 409.
- **The owner must be a member of that project** — a 409, exactly like a risk's
  responsible person. `ownerId: null` leaves it unassigned and always passes.

**Ticking a task is how a stage closes.** `completedAt` is still settled from tasks
and nothing else, and there is still no endpoint that sets it by hand — but now that
statuses can change, a stage closes and reopens on its own as you work. Do not add a
"mark stage as done" control; tick the tasks.

## Subtasks

A checklist the owner keeps on their own task, driving the progress bar in the task
modal. Three fields: `title`, `done`, `sortOrder`.

```
GET    /tasks/:taskId/subtasks    also inline on every task row
POST   /tasks/:taskId/subtasks    { title }
PATCH  /subtasks/:id              { title?, done? }   — rename and tick are one call
DELETE /subtasks/:id              204
```

- **Only the person the task is assigned to may write them — a director included.**
  A checklist is the assignee's own breakdown of their work, not a management
  surface, so a director who does not own the task gets a 403. This is the one write
  in the app where being a director does not help.
- **A task with no owner has a frozen checklist.** Nobody can edit it. Removing
  someone from a project nulls their tasks' owner, so this is reachable — reassign
  the task and it thaws.
- **Subtasks change nothing else.** Ticking one does not touch the task's `status`,
  does not count toward a stage's `counts`, and cannot complete a stage. A fully
  ticked checklist on a `BLOCKED` task is a normal state, and the seed contains one
  so you can see it.
- `sortOrder` is assigned by the server on create and is **not** renumbered on
  delete, so holes are normal — unlike `goalNumber`, it is never displayed. There is
  no reorder endpoint yet.
- `subtaskProgress.percent` is computed server-side as
  `total === 0 ? 0 : Math.round((done / total) * 100)` — identical to the client's
  `subtaskProgress.ts`, so either may render the bar.

## Goals

`goalNumber` is assigned by the server (max + 1) and **renumbered on delete**, so
the "CEL n" labels stay contiguous. Never send it, and re-read the list after a
delete rather than adjusting numbers locally.

## Risks

The responsible person must be a **member of that project** — a 409 otherwise.
Send `responsibleUserId: null` to leave a risk unassigned. `responsible` comes
back flattened, or `null`.

## Members

```
GET  /projects/:projectId/members
GET  /projects/:projectId/available-members
POST /projects/:projectId/members   { userId, projectRole }
```

`available-members` is what the picker should read: ACTIVE users who are not
soft-deleted and not already on the project. Adding anyone else is a 409, so the
two endpoints agree by construction.

`projectRole` is `COORDINATOR`, `EXECUTOR` or `PARTNER`. **DIRECTOR is not a
project role** — it is a global flag on the user. The same person can coordinate
one project and execute another, which is why the role lives on the membership
and never on the user.

Removing a member unassigns their risks and tasks on that project first, so the
rows survive with no owner rather than disappearing.

## Archive is the trash

`DELETE /projects/:id` is refused with a 409 unless the project is already
archived. Archive first, delete from the archive — the same two-step the app
already uses for stages.

## How the paths are shaped

One rule, applied to every resource here, and worth reading once because it is not the only
possible choice: **a collection is nested under its immediate parent; a single row is addressed
flat by its own id.**

Creating and listing name the parent, one hop at a time — that chain *is* the hierarchy:

```
POST /projects/:projectId/stages     -> pick a project, add a stage
POST /stages/:stageId/activities     -> pick a stage,    add an activity
POST /activities/:activityId/tasks   -> pick an activity, add a task
POST /tasks/:taskId/subtasks         -> pick a task,     add a subtask
```

Each route names exactly the parent you just chose in the UI, which is the "choose a project
first, then add" flow. A list needs the parent for the same reason: "which project's members?"
has no answer without it.

Editing and deleting address the row by its own id, because **the row already stores its
parent** — `stages.project_id`, `activities.stage_id`, `tasks.activity_id`, `subtasks.task_id`:

```
PATCH /stages/:id      DELETE /stages/:id
PATCH /activities/:id  DELETE /activities/:id
PATCH /tasks/:id       DELETE /tasks/:id
```

`PATCH /stages/:id` is the URL equivalent of `WHERE id = ?`. The id is the primary key, so naming
the parent again would add nothing — and it would add a failure mode: `PATCH /projects/A/stages/S`
where `S` belongs to project B is a contradiction every handler would have to detect and reject.
The flat form cannot express it. Note this is why the chain is never spelled out in full: it is
`POST /stages/:stageId/activities`, not
`POST /projects/:projectId/stages/:stageId/activities`.

Two things that follow, for the client:

- The **selected project scopes the list**, not the item calls. Fetch
  `GET /projects/:projectId/tasks` once, and each row then carries its own `id` — plus a
  `projectId`, so you always know which query key to invalidate.
- `/members/:id` is the **membership** id, not the user id. It is the one flat id that is easy to
  misread; `BackendMember` carries both.

## Endpoints

```
GET    /projects                        ?archived=true
POST   /projects                        D
GET    /projects/:id
PATCH  /projects/:id                    D  name / description / color / dates
PATCH  /projects/:id/status             D  { statusId }
PATCH  /projects/:id/types              D  { typeIds }        full replace
PATCH  /projects/:id/recipients         D  { recipientIds }   full replace
PATCH  /projects/:id/archive            D
PATCH  /projects/:id/restore            D
DELETE /projects/:id                    D  409 unless archived

GET    /project-statuses                    POST/PATCH/DELETE  D
GET    /project-types                       POST/PATCH/DELETE  D
GET    /project-recipients                  POST/PATCH/DELETE  D

GET    /projects/:projectId/stages       ?archived=true  incl. activities + their tasks
POST   /projects/:projectId/stages       D
PATCH  /stages/:id                       D  name + description only
PATCH  /stages/:id/deadline              D  -> { stage, suggestions }
POST   /stages/cascade                   D  { shifts, note? }
PATCH  /stages/:id/archive               D
PATCH  /stages/:id/restore               D
DELETE /stages/:id                       D  ?strategy=none|move|delete

POST   /stages/:stageId/activities       D
PATCH  /activities/:id                   D  rename
PATCH  /activities/:id/stage             D  { stageId }
DELETE /activities/:id                   D  destroys its tasks

GET    /projects/:projectId/goals           POST  D
PATCH  /goals/:id                        D
DELETE /goals/:id                        D  renumbers the rest

GET    /projects/:projectId/risks           POST  D
PATCH  /risks/:id                        D
DELETE /risks/:id                        D

GET    /projects/:projectId/members
GET    /projects/:projectId/available-members
POST   /projects/:projectId/members      D
PATCH  /members/:id                      D  { projectRole }
DELETE /members/:id                      D
```

Tasks and subtasks are gated on `TASKS`, not `PROJECTS`:

```
GET    /projects/:projectId/tasks        ?archived=true
GET    /projects/:projectId/my-tasks     ?archived=true
GET    /tasks/:id
POST   /activities/:activityId/tasks     DC
PATCH  /tasks/:id                        DC  no status field here
PATCH  /tasks/:id/status                 DCO { status }
DELETE /tasks/:id                        DC  takes its subtasks with it

GET    /tasks/:taskId/subtasks
POST   /tasks/:taskId/subtasks           O   { title }
PATCH  /subtasks/:id                     O   { title?, done? }
DELETE /subtasks/:id                     O
```

`D` = director only. `C` = also that project's coordinator. `O` = the task's owner,
**and only them** — a director without ownership is refused. Every `DELETE` answers
204 with no body.

The full request and response shapes are in Swagger at
`http://localhost:3000/api/docs`, under the `projects` tag.

## Things that will trip you up

- **Dictionaries are full-replace.** `PATCH /projects/:id/types` takes the
  complete set, like `PATCH /users/:id/modules`. Sending one id removes the rest.
- **A dictionary entry in use will not delete.** The 409 message says how many
  projects use it — show that number rather than a generic error.
- **`PATCH /stages/:id` silently has no date fields.** Sending `deadline` there is
  a 400 (`forbidNonWhitelisted`), not a quiet no-op. Use the deadline endpoint.
- **Project dates are order-checked, and the check spans the request.** Moving one
  end is compared against the end already stored, so `PATCH { startDate }` alone can
  409. Sending either as `null` clears it and always passes. An edit that touches
  neither date is never checked, so a row stored out of order can still be renamed.
- **`budgetAmount` is still create-only.** It is on `POST /projects` but not on
  `PATCH /projects/:id`, so sending it to the patch is a 400.
- **Suggestions are not applied.** If you never call `POST /stages/cascade`,
  nothing downstream moves. This is deliberate: a stage must never shift without
  someone seeing it. (The code calls this "shift following stages"; the route path
  is unchanged.)
- **`completedAt` is not settable.** Do not build a "mark as done" control for
  stages — tick the tasks. That now works: `PATCH /tasks/:id/status` is the only
  thing that closes or reopens a stage.
- **`status` is not on `PATCH /tasks/:id`.** It lives on `/tasks/:id/status`, whose
  caller set is wider. Sending it to the general patch is a 400.
- **A director cannot write someone else's subtasks.** This is the one place
  `user.isDirector` is not a skeleton key, so `canEdit={!!user?.isDirector}` is the
  wrong gate for the checklist — use ownership.
- **An unowned task's checklist cannot be edited by anyone.** Removing a project
  member nulls their tasks' owner, which is how a task ends up in that state.
- **Errors are the shared envelope** `{ code, message, fields }`. `fields` is
  populated for 400s from validation and is `null` otherwise. `message` is
  Polish for validation failures (`'Nieprawidłowe dane'`) and English for
  business rules — check `code`, not `message`.
- **Path ids are validated as UUIDs.** A malformed id is a 400 before any lookup,
  so a 404 really does mean "not there".
