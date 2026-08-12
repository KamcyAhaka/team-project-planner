import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getTaskById } from '@/models/task';
import { getProjectById } from '@/models/project';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TaskDetailForm } from './task-detail-form';

interface TaskDetailsPageProps {
  params: Promise<{ id: string; taskId: string }>;
}

export const dynamic = 'force-dynamic';

export default async function TaskDetailsPage({ params }: TaskDetailsPageProps) {
  const session = await auth();

  // 1. Authenticate user
  if (!session || !session.user || !session.user.id) {
    redirect('/auth/sign-in');
  }

  const userId = session.user.id;

  // 2. Fetch parameters
  const { id: projectId, taskId } = await params;

  if (!projectId || !taskId) {
    redirect('/dashboard?error=Invalid+parameters');
  }

  // 3. Fetch task details
  const task = await getTaskById(taskId);
  if (!task) {
    redirect(`/projects/${projectId}?error=Task+not+found`);
  }

  // 4. Fetch project details
  const project = await getProjectById(projectId);
  if (!project) {
    redirect('/dashboard?error=Project+not+found');
  }

  // 5. Verify user permissions
  const currentUserIdStr = userId.toString();
  const isOwner = project.ownerId?.toString() === currentUserIdStr;
  const isMember = project.members?.some(
    (m) => m.toString() === currentUserIdStr
  );

  if (!isOwner && !isMember) {
    redirect('/dashboard?error=Access+denied');
  }

  // 6. Gather project members details for assignee list
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

  // Convert task object to a plain serializable JSON object for the Client Component
  const serializableTask = {
    id: task.id,
    name: task.name,
    description: task.description || '',
    assignedTo: task.assignedTo || '',
    dueDate: task.dueDate || '',
    status: task.status || 'To Do',
    priority: task.priority || 'Medium',
    project: task.project,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
        <div className="border-b border-border/60 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Task Details</h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              Review task details, modify configurations, or delete the task.
            </p>
          </div>
        </div>

        <TaskDetailForm
          projectId={projectId}
          task={serializableTask}
          members={membersList}
          projectStartDate={project.startDate ? new Date(project.startDate).toISOString() : undefined}
          projectEndDate={project.endDate ? new Date(project.endDate).toISOString() : undefined}
        />
      </div>
    </div>
  );
}
