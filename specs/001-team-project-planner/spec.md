****# Team Project Planner

**Feature Branch**: `001-team-project-planner`

**Created**: 2026-07-09

## Title
Team Project Planner — collaborative project management for student teams

## Description
A lightweight web application that helps student teams organize and manage collaborative projects in one place. Users can create projects, assign tasks to team members, track task progress, and monitor deadlines through a simple, responsive interface.

## Purpose & Target Audience
Purpose: Reduce coordination overhead for student group assignments by providing clear project structure, task ownership, and deadline visibility.
Target audience: Students working on group assignments, project leads within student teams, and instructors who want visibility into team progress.

## User Scenarios & Testing
### User Story 1 — Sign Up / Sign In (Priority: P1)
As a student, I want to create an account and sign in so I can manage projects and tasks.

Acceptance Criteria:
- Users can register with email and password or sign in with existing credentials.
- Successful registration redirects to a dashboard showing projects (empty state if none).
- Validation errors are shown for invalid email or weak password.
- Signed-in session persists across browser reloads and can be signed out.

Independent Test:
- Create a new account, verify dashboard loads, sign out, sign back in.

### User Story 2 — Create Project (Priority: P1)
As a team member, I want to create a project with a title, description, members, and a deadline so the team has a shared workspace.

Acceptance Criteria:
- A project can be created with title, optional description, optional deadline, and invited members by email or username.
- Creator becomes a project admin and can assign tasks.
- Project appears in the creator and invited members' dashboards.
****
Independent Test:
- Create project, invite a member, confirm project listed in both users' dashboards.

### User Story 3 — Create Task (Priority: P1)
As a team member, I want to add tasks to a project with assignee, description, due date, and status so work can be tracked.

Acceptance Criteria:
- Users can add a task with title, description, assignee (optional), due date (optional), and status (To Do, In Progress, Done).
- Task displays in the project task list and in assignee’s personal task list.
- Tasks can have priority tags (Low/Medium/High).

Independent Test:
- Add a task, assign to user, verify it appears under project and user views.

### User Story 4 — Read Tasks & Project (Priority: P1)
As a team member, I want to view project details and task lists so I understand what needs to be done.

Acceptance Criteria:
- Project page shows project metadata, members, and task board/list grouped by status.
- Users can filter tasks by assignee, status, deadline, and priority.

Independent Test:
- Open project, apply filters, verify results.

### User Story 5 — Update Task (Priority: P2)
As a task assignee or project admin, I want to edit task details and update status so task progress is current.

Acceptance Criteria:
- Users can update title, description, assignee, due date, status, and priority.
- Status changes are recorded (timestamp + user) in a lightweight activity log.

Independent Test:
- Edit a task, change status, verify change reflected and activity entry created.

### User Story 6 — Delete Task / Project (Priority: P2)
As a project admin, I want to delete tasks and projects to remove obsolete items.

Acceptance Criteria:
- Deleting a task requires confirmation; deleted tasks are immediately removed from lists.
- Deleting a project requires confirmation and optionally exports project data before deletion.
- Only project admins can delete projects.

Independent Test:
- Delete a task and a test project (admin user), verify removal and permission enforcement.

### User Story 7 — Monitor Progress & Deadlines (Priority: P2)
As a team member, I want to track project progress and view upcoming deadlines in a dedicated view so that the team maintains deadline awareness and visibility over our project progress.

Acceptance Criteria:
- The project board/list display includes a clear visual progress indicator (e.g., percentage of completed tasks).
- Users can view a dashboard section showing upcoming deadlines across the project, sorted by proximity to the current date.
- Tasks that are overdue or due within 48 hours display distinct visual warnings to support student awareness.

Independent Test:
- Access the project view with tasks in different status columns and different due dates, check that the overall project progress is calculated correctly, and verify visual styling changes for overdue or near-due tasks.

## API Endpoints (Draft)
All endpoints assume authenticated requests where applicable.

- `POST /api/auth/register` — Register a new user. Body: `{ email, password, name }`.
- `POST /api/auth/login` — Authenticate user. Body: `{ email, password }`.
- `POST /api/auth/logout` — End session.
- `GET /api/users/me` — Get current user profile.

Projects
- `POST /api/projects` — Create project. Body: `{ title, description?, deadline?, members? }`.
- `GET /api/projects` — List projects current user is a member of.
- `GET /api/projects/:id` — Get project details and tasks.
- `PATCH /api/projects/:id` — Update project metadata (admins only).
- `DELETE /api/projects/:id` — Delete project (admins only).

Tasks
- `POST /api/projects/:projectId/tasks` — Create task within project. Body: `{ title, description?, assignee?, dueDate?, priority?, status? }`.
- `GET /api/projects/:projectId/tasks` — List tasks for project with filter query params.
- `GET /api/tasks/:id` — Get single task details.
- `PATCH /api/tasks/:id` — Update task fields.
- `DELETE /api/tasks/:id` — Delete task.

Members & Invitations
- `POST /api/projects/:projectId/invite` — Invite member by email.
- `POST /api/invitations/:id/accept` — Accept project invitation.

## Implementation Priority
- P0 (Critical / MVP): Authentication (register/login), Create/Read projects, Create/Read tasks, Dashboard, basic task assignment and status transitions.
- P1: Update task/project, filters, activity log, member invitations and acceptance flows.
- P2: Delete project export workflow, priority tags UX refinements, email notifications, instructor/observer roles.

## Success Criteria
- New users can register and create a project and at least one task within 5 minutes.
- Core CRUD flows (projects & tasks) are covered by unit and integration tests with passing results.
- Basic dashboard and task board render correctly on mobile and desktop (responsive).

## Assumptions
- Authentication implemented via session or JWT; details decided during implementation planning.
- Email delivery for invitations may use a third-party provider (out of scope for MVP — mocked in tests).
- Data retention and export policies to be defined by product stakeholders.

## Edge Cases
- Invitations to emails not registered: create pending invitation record.
- Concurrent task updates: last-writer-wins model with activity log for conflicts; consider optimistic UI updates.
- Deleted users: retain task history but anonymize personal data.

## Next Steps
- Create implementation plan (`/speckit.plan`) and tasks (`/speckit.tasks`) for the P0 scope.
