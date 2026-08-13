# Team Project Planner (WDD430 - Team 11)

A modern, responsive collaboration workspace designed for student and developer teams to organize, plan, and execute project deliverables. Easily manage project lifecycles, delegate tasks, track sprint progress visually, and coordinate team members.

## 🚀 Key Features

* **Visual Kanban Board:** Seamlessly manage task status with an interactive drag-and-drop workflow layout (To Do, In Progress, Done).
* **Project Center:** Spin up projects with custom descriptions, start/end dates, and real-time member assignments.
* **Granular Team Collaboration:** Add new team members via email, manage roles (e.g., Owner, Member), and display active contributors with dynamic avatar icons.
* **Responsive Workspace Dashboard:** A unified home view highlighting overall project health, timeline metrics, active participants, and individual task lists.
* **Secure Authentication:** Integrated credentials sign-in/sign-up and route protection powered by **Auth.js** (NextAuth v5).

---

## 🛠️ Tech Stack

* **Frontend & Backend Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
* **Database:** [MongoDB](https://www.mongodb.com/) (using Native MongoDB driver & Mongoose models)
* **Authentication:** [Auth.js](https://authjs.dev/) (NextAuth.js v5)
* **Styling & Icons:** [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
* **Form & Data Validation:** [Zod](https://zod.dev/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)

---

## ⚙️ Environment Configuration

To run this project locally or in production, create a `.env` file in the root directory and define the following environment variables:

```env
# MongoDB Connection URI
# Example: mongodb+srv://<user>:<password>@cluster.mongodb.net/team_project_planner
MONGODB_URI=mongodb://localhost:27017/team_project_planner

# Auth.js / NextAuth Configuration
# Generate a random 32-byte secret using: openssl rand -base64 32
AUTH_SECRET=your_auth_secret_key_here

# Base URL for NextAuth (for local development)
NEXTAUTH_URL=http://localhost:3000
```

> [!IMPORTANT]
> **Vercel / Production Deployment:** 
> When deploying to Vercel, ensure you update or configure `NEXTAUTH_URL` (or `AUTH_URL`) to point to your live URL (e.g., `https://your-app-domain.vercel.app`) in the Vercel environment variables dashboard, or remove it entirely, as NextAuth v5 automatically infers it on Vercel deployments.

---

## 💻 Getting Started

### 1. Clone & Install Dependencies

```bash
# Install package dependencies
npm install
```

### 2. Run Local Development Server

```bash
# Start Next.js dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 3. Build & Production Start

```bash
# Build the production bundle
npm run build

# Start the built application
npm run start
```

### 4. Running Lint Checks

```bash
# Check code syntax & standards
npm run lint
```

---

## 👥 Team Members

* **Divine Ahaka**
* **Adetoke Faderin**
* **Olanrewaju Ayomide Adebayo**
* **Medina MBEDI**
