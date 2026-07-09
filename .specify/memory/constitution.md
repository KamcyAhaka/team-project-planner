<!--
Sync Impact Report
Version change: N/A → 1.0.0
Modified principles:
- [PRINCIPLE_1_NAME] → I. Student-Centered Collaboration
- [PRINCIPLE_2_NAME] → II. Next.js & TypeScript Platform Integrity
- [PRINCIPLE_3_NAME] → III. Tailwind Utility Discipline
- [PRINCIPLE_4_NAME] → IV. Testing & Quality Assurance
- [PRINCIPLE_5_NAME] → V. Naming, Structure, and Team Collaboration
Added sections:
- Required Stack
- Development Workflow
Removed sections:
- None
Templates reviewed:
- .specify/templates/plan-template.md ✅
- .specify/templates/spec-template.md ✅
- .specify/templates/tasks-template.md ✅
Follow-up TODOs:
- None
-->

# Team Project Planner Constitution

## Core Principles

### I. Student-Centered Collaboration
The product is designed for student teams working on group assignments. Every feature and implementation decision MUST support easy project setup, clear task ownership, visible progress, and deadline awareness for non-technical team members.
Rationale: The application exists to reduce coordination friction for student collaborators, so design and engineering choices must keep workflows simple, predictable, and team-focused.

### II. Next.js & TypeScript Platform Integrity
The codebase MUST use Next.js App Router conventions with a clear separation of server and client components. TypeScript strict mode MUST be enabled, and `any` MUST not be used unless a technical exception is explicitly documented and approved.
Rationale: Strict TypeScript and App Router discipline ensure reliable architecture, maintainable routing, and predictable data flow in a modern Next.js web app.

### III. Tailwind Utility Discipline
UI styling MUST favor Tailwind CSS utility classes. Custom CSS is allowed only when a visual requirement cannot be expressed cleanly with Tailwind utilities. Any custom styles MUST be minimal, scoped, and documented.
Rationale: A consistent Tailwind-first approach keeps the interface maintainable, avoids style drift, and supports rapid responsive UI iteration.

### IV. Testing & Quality Assurance
Every student-facing workflow and core domain behavior MUST be covered by tests before merge. Unit tests MUST validate component logic and helpers; integration tests MUST validate project creation, task assignment, progress tracking, and deadline workflows.
Rationale: Strong test coverage protects collaboration workflows from regressions and provides confidence when the team evolves the app.

### V. Naming, Structure, and Team Collaboration
File names, component names, and domain terms MUST be expressive, consistent, and aligned with core concepts: project, task, member, deadline, board, and progress. Branches and pull requests MUST be small, focused, and accompanied by clear descriptions, testing notes, and review requests.
Rationale: Clear naming and disciplined collaboration reduce team friction, make work reviewable, and support a shared understanding of the product.

## Required Stack
- Next.js App Router with `src/app/` routing and layout conventions.
- TypeScript with `strict` mode enabled, including `noImplicitAny`, `strictNullChecks`, and related strictness checks.
- Tailwind CSS utility-first styling as the default approach.
- No legacy `pages/` router patterns unless a deliberate migration plan is documented.
- Responsive, mobile-first interface patterns to support student use on any device.

## Development Workflow
- Branch names MUST be descriptive and feature-oriented: `feature/...`, `fix/...`, `chore/...`.
- Pull requests MUST include a summary, impacted workflows, and testing notes.
- Reviewers MUST verify conformance to stack conventions, accessibility, naming, and test coverage.
- Merge only when tests pass, linting passes, and reviews approve.
- Keep commits small and focused; each PR SHOULD represent one logical change.

## Governance
This constitution defines the mandatory engineering principles for Team Project Planner. Amendments require a documented rationale, a review summary, and at least one additional team member's approval before adoption.

- All PRs and reviews MUST verify compliance with the constitution.
- Exceptions to any principle MUST be documented explicitly in the PR description and reviewed before merge.
- Governance changes MUST follow versioning policy and be recorded in the constitution.

Versioning policy:
- `MAJOR` for governance or principle changes that alter established conventions.
- `MINOR` for additions of new required practices or new principles.
- `PATCH` for wording clarifications, typo fixes, and non-semantic refinements.

Compliance review expectations:
- Reviewers MUST confirm that changes do not violate the core principles.
- Any deviation MUST be raised as a review discussion item.
- Accepted exceptions MUST be timeboxed and justified.

**Version**: 1.0.0 | **Ratified**: 2026-07-09 | **Last Amended**: 2026-07-09
