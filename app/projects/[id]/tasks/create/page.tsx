import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getProjectById } from '@/models/project';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TaskCreateForm } from './task-create-form';

interface CreateTaskPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function CreateTaskPage({ params }: CreateTaskPageProps) {
  const session = await auth();

  // 1. Authenticate user
  if (!session || !session.user || !session.user.id) {
    redirect('/auth/sign-in');
  }

  const userId = session.user.id;

  // 2. Fetch project ID
  const { id: projectId } = await params;
  if (!projectId || !ObjectId.isValid(projectId)) {
    redirect('/dashboard?error=Invalid+project+ID');
  }

  // 3. Fetch project details
  const project = await getProjectById(projectId);
  if (!project) {
    redirect('/dashboard?error=Project+not+found');
  }

  // 4. Verify user permissions
  const currentUserIdStr = userId.toString();
  const isOwner = project.ownerId?.toString() === currentUserIdStr;
  const isMember = project.members?.some(
    (m) => m.toString() === currentUserIdStr
  );

  if (!isOwner && !isMember) {
    redirect('/dashboard?error=Access+denied');
  }

  // 5. Gather project members details for assignee list
  const memberIds: ObjectId[] = [];
  if (project.ownerId && ObjectId.isValid(project.ownerId.toString())) {
    memberIds.push(new ObjectId(project.ownerId.toString()));
  }
  if (Array.isArray(project.members)) {
    project.members.forEach((m) => {
      if (ObjectId.isValid(m.toString())) {
        memberIds.push(new ObjectId(m.toString()));
      }
    });
  }

  const db = await getDb();
  const users = await db
    .collection('users')
    .find({ _id: { $in: memberIds } })
    .project({ passwordHash: 0 })
    .toArray();

  const membersList = users.map((u) => {
    const name = u.displayName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email.split('@')[0];
    return {
      id: u._id.toString(),
      name,
      email: u.email,
    };
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back to Project Board */}
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Project Board
        </Link>
      </div>

      {/* Form Container */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xs">
        <div className="border-b border-border/60 pb-5 mb-6">
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Create Task</h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            Add a new task to your board, assign ownership, and set milestones.
          </p>
        </div>

        <TaskCreateForm
          projectId={projectId}
          members={membersList}
          projectStartDate={project.startDate ? new Date(project.startDate).toISOString() : undefined}
          projectEndDate={project.endDate ? new Date(project.endDate).toISOString() : undefined}
        />
      </div>
    </div>
  );
}
