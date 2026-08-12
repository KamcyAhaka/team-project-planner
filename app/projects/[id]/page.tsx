import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getProjectById } from '@/models/project';
import { getTasksByProject } from '@/models/task';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import {
  Calendar,
  Clock,
  AlertTriangle,
  Plus,
  ArrowLeft,
  Users,
  Settings,
  ListTodo,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { KanbanBoard } from '@/components/kanban-board';

interface ProjectDetailsPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const session = await auth();

  // 1. Authenticate user
  if (!session || !session.user || !session.user.id) {
    redirect('/auth/sign-in');
  }

  const userId = session.user.id;

  // 2. Fetch project parameters
  const { id: projectId } = await params;

  if (!projectId || !ObjectId.isValid(projectId)) {
    redirect('/dashboard?error=Invalid+project+ID');
  }

  // 3. Fetch project details
  const project = await getProjectById(projectId);

  if (!project) {
    redirect('/dashboard?error=Project+not+found');
  }

  // 4. Verify user permissions (Owner or Member)
  const currentUserIdStr = userId.toString();
  const ownerIdStr = project.ownerId?.toString();
  const isOwner = ownerIdStr === currentUserIdStr;
  const isMember = project.members?.some(
    (memberId: any) => memberId.toString() === currentUserIdStr
  );

  if (!isOwner && !isMember) {
    redirect('/dashboard?error=Access+denied');
  }

  // 5. Gather project members details
  const memberIds: ObjectId[] = [];
  if (project.ownerId && ObjectId.isValid(project.ownerId.toString())) {
    memberIds.push(new ObjectId(project.ownerId.toString()));
  }
  if (Array.isArray(project.members)) {
    project.members.forEach((m: any) => {
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

  const userMap: Record<string, { name: string; email: string; avatar?: string }> = {};
  users.forEach((user) => {
    const name = user.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email.split('@')[0];
    userMap[user._id.toString()] = {
      name,
      email: user.email,
      avatar: user.profilePictureURL || '',
    };
  });

  // 6. Fetch project tasks
  const tasks = await getTasksByProject(projectId);

  // Calculate metrics
  const doneTasks = tasks.filter(
    (t) => t.status === 'Done' || t.status === 'completed' || t.status === 'done'
  );
  const totalTasksCount = tasks.length;
  const completedTasksCount = doneTasks.length;
  const progress = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Breadcrumb and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {isOwner && (
          <Link
            href={`/projects/${projectId}/settings`}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'gap-1.5 font-semibold text-xs cursor-pointer'
            )}
          >
            <Settings className="w-3.5 h-3.5" />
            Project Settings
          </Link>
        )}
      </div>

      {/* Project Banner Card */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xs space-y-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-none font-bold text-xs px-2.5 py-0.5 capitalize">
                {project.status || 'planning'}
              </Badge>
              {project.endDate && (
                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Due {new Date(project.endDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                {project.name || project.title || 'Untitled Project'}
              </h2>
              <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
                {project.description || 'No description provided for this project.'}
              </p>
            </div>
          </div>

          {/* Members list preview in header */}
          <div className="flex flex-col gap-2 shrink-0 bg-muted/30 border border-border/40 rounded-xl p-4 min-w-[200px]">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              Team Members ({users.length})
            </span>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {users.map((u) => {
                const isUserOwner = u._id.toString() === ownerIdStr;
                return (
                  <div
                    key={u._id.toString()}
                    className="group relative w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center uppercase shadow-2xs hover:scale-105 transition-transform"
                    title={`${u.displayName || u.email} (${isUserOwner ? 'Owner' : 'Member'})`}
                  >
                    {u.profilePictureURL ? (
                      <Image
                        src={u.profilePictureURL}
                        alt={u.displayName || 'Member'}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      (u.displayName || u.email).slice(0, 2)
                    )}
                    {isUserOwner && (
                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-amber shadow-2xs border border-card" title="Project Owner" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Progress Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Project Progress</span>
              <span className="text-lg font-extrabold text-foreground">{progress}% Complete</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Total Tasks</span>
              <span className="text-lg font-extrabold text-foreground">{totalTasksCount} Active</span>
            </div>
          </div>

          {/* Progress bar span */}
          <div className="flex flex-col justify-center">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Task Board Columns */}
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-in slide-in-from-top-3 duration-300">
          <h3 className="text-lg font-bold text-foreground">
            Task Board
          </h3>

          <Link
            href={`/projects/${projectId}/tasks/create`}
            className={cn(
              buttonVariants({ variant: 'default', size: 'sm' }),
              'gap-1.5 font-bold bg-primary hover:bg-primary-hover text-white shadow-xs cursor-pointer'
            )}
          >
            <Plus className="w-4 h-4" />
            Add Task
          </Link>
        </div>

        <KanbanBoard
          initialTasks={tasks}
          projectId={projectId}
          members={userMap}
        />
      </div>
    </div>
  );
}
