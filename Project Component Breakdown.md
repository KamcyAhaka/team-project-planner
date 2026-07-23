# Project Component Breakdown

## MVP Pages/Routes

- / - Home Page (High Priority)
- /auth/sign-up - Sign up page (High Priority)
- /auth/sign-in - Sign in page (High Priority)
- /profile - Profile page (High Priority)
- /dashboard - Dashboard page
- /projects - Projects page
- /projects/create - Create project page
- /projects/:id - Project details page
- /projects/:id/tasks - Project tasks page
- /projects/:id/tasks/:id - Project task details page
- /projects/:id/members - Project members page
- /projects/:id/members/:id - Project member details page
- /settings - Settings page

## Reusable Components

- Navbar
- ProjectCard
- TaskCard
- CustomInput
- MemberCard

## Data Model

- UserModel
  - uid (string)
  - displayName (string)
  - firstName (string)
  - lastName (string)
  - email (string)
  - profilePictureURL (string)

- ProjectModel
  - id (string)
  - name (string)
  - description (string)
  - startDate (string)
  - endDate (string)
  - status (string)
  - teamMembers UserModel[]
  - tasks TaskModel[]

- TaskModel
  - id (string)
  - name (string)
  - description (string)
  - dueDate (string)
  - status (string)
  - assignedTo UserModel.id (string)
  - project ProjectModel.id (string)

## Tech Stack

- Frontend Framework: React
- Styling: TailwindCSS, ShadCN
- Version control: Git/GitHub
- Hosting: Vercel
- Database: MongoDB
