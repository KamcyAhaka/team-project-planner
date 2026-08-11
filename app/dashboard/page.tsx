import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUserProjects } from '@/models/project';
import { getTasksByUser, getTasksByProject, Tasks } from '@/models/task';
import {
  FolderKanban,
  CheckSquare,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Project } from '@/models/project';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    redirect('/auth/sign-in');
  }

  const userId = session.user.id;
  const userDisplayName =
    session.user.displayName || session.user.name || session.user.email?.split('@')[0] || 'User';

  // 1. Fetch user projects
  let rawProjects: Project[] = [];
  try {
    rawProjects = await getUserProjects(userId);
  } catch (err) {
    console.error('Error fetching projects:', err);
  }

  // 2. Fetch user tasks
  let userTasks: Tasks[] = [];
  try {
    userTasks = await getTasksByUser(userId);
  } catch (err) {
    console.error('Error fetching tasks:', err);
  }

  // 3. For each project, fetch its tasks to calculate overall completion progress
  const projects = await Promise.all(
    rawProjects.map(async (project) => {
      let progress = 0;
      let totalTasksCount = 0;
      let completedTasksCount = 0;

      try {
        const projectIdStr = project._id ? project._id.toString() : '';
        if (projectIdStr) {
          const projectTasks = await getTasksByProject(projectIdStr);
          totalTasksCount = projectTasks.length;
          completedTasksCount = projectTasks.filter(
            (t: Tasks) => t.status === 'Done' || t.status === 'completed' || t.status === 'done'
          ).length;

          progress =
            totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
        }
      } catch (err) {
        console.error(`Error calculating progress for project ${project._id}:`, err);
      }

      return {
        ...project,
        id: project._id ? project._id.toString() : '',
        progress,
        totalTasksCount,
        completedTasksCount,
      };
    })
  );

  // 4. Create a map of project ID to project name for display in tasks list
  const projectMap: Record<string, string> = {};
  projects.forEach((p) => {
    if (p.id) projectMap[p.id] = p.name || p.title || 'Unknown Project';
  });

  // Calculate task summary counts
  const totalTasks = userTasks.length;
  const completedTasks = userTasks.filter(
    (t) => t.status === 'Done' || t.status === 'completed' || t.status === 'done'
  ).length;
  // const inProgressTasks = userTasks.filter(
  //   (t) => t.status === 'In Progress' || t.status === 'in-progress'
  // ).length;

  // Deadline Warning & Overdue Logic
  const now = new Date();
  const warningThreshold = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

  const upcomingDeadlinesCount = userTasks.filter((task) => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const isCompleted =
      task.status === 'Done' || task.status === 'completed' || task.status === 'done';

    if (isCompleted) return false;

    const timeDiff = dueDate.getTime() - now.getTime();
    // Return true if task is overdue or due within 48 hours
    return timeDiff <= warningThreshold;
  }).length;

  // Format dates nicely
  const getGreeting = () => {
    const hours = now.getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const currentDateFormatted = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-primary to-primary-hover p-6 md:p-8 text-white shadow-lg">
        <div className="relative z-10 space-y-2">
          <span className="text-xs md:text-sm font-bold tracking-wider uppercase text-white/80">
            {currentDateFormatted}
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            {getGreeting()}, {userDisplayName}!
          </h2>
          <p className="text-sm md:text-base text-white/90 max-w-xl">
            Here is what is happening with your projects today. You have{' '}
            <span className="font-bold underline">{totalTasks - completedTasks}</span> active tasks
            and <span className="font-bold underline">{upcomingDeadlinesCount}</span> urgent
            deadlines.
          </p>
        </div>
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 mr-12 -mb-20 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Projects */}
        <div className="flex items-center gap-4 p-5 md:p-6 bg-card border border-border rounded-xl shadow-xs hover:border-border/80 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs md:text-sm font-semibold text-muted-foreground block truncate">
              Projects
            </span>
            <span className="text-xl md:text-2xl font-bold text-foreground">{projects.length}</span>
          </div>
        </div>

        {/* Assigned Tasks */}
        <div className="flex items-center gap-4 p-5 md:p-6 bg-card border border-border rounded-xl shadow-xs hover:border-border/80 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs md:text-sm font-semibold text-muted-foreground block truncate">
              Assigned Tasks
            </span>
            <span className="text-xl md:text-2xl font-bold text-foreground">{totalTasks}</span>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="flex items-center gap-4 p-5 md:p-6 bg-card border border-border rounded-xl shadow-xs hover:border-border/80 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-success-status/10 flex items-center justify-center text-success-status shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs md:text-sm font-semibold text-muted-foreground block truncate">
              Completed Tasks
            </span>
            <span className="text-xl md:text-2xl font-bold text-foreground">{completedTasks}</span>
          </div>
        </div>

        {/* Urgent Deadlines */}
        <div className="flex items-center gap-4 p-5 md:p-6 bg-card border border-border rounded-xl shadow-xs hover:border-border/80 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-error-status/10 flex items-center justify-center text-error-status shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <span className="text-xs md:text-sm font-semibold text-muted-foreground block truncate">
              Urgent / Overdue
            </span>
            <span className="text-xl md:text-2xl font-bold text-foreground">
              {upcomingDeadlinesCount}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Projects List (2/3 width) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              Recent Projects
            </h3>
            <Link
              href="/projects"
              className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
            >
              View All Projects <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {projects.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 bg-card border border-dashed border-border rounded-xl shadow-2xs space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <FolderKanban className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-foreground">No projects found</h4>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {
                    "You aren't associated with any projects yet. Create a new workspace project to collaborate with your team."
                  }
                </p>
              </div>
              <Link
                href="/projects/create"
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  'mt-2 bg-primary hover:bg-primary-hover text-white cursor-pointer font-semibold shadow-xs'
                )}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create Your First Project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.slice(0, 4).map((project) => {
                const memberCount = Array.isArray(project.members) ? project.members.length : 0;
                // Base-ui / shadcn styling for project card
                return (
                  <div
                    key={project.id}
                    className="flex flex-col justify-between p-6 bg-card border border-border rounded-xl shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-primary/15 text-primary border-none hover:bg-primary/20 text-xs font-bold px-2 py-0.5 rounded-full capitalize">
                          {project.status || 'Active'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {project.endDate
                            ? new Date(project.endDate).toLocaleDateString()
                            : 'No date'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {project.name || project.title || 'Untitled Project'}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 h-8 leading-relaxed">
                          {project.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-5 mt-4 border-t border-border/60">
                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-muted-foreground">Task Completion</span>
                          <span className="text-foreground">{project.progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer info & CTA */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-muted-foreground font-medium">
                          <span className="font-bold text-foreground">{memberCount + 1}</span>{' '}
                          {memberCount + 1 === 1 ? 'member' : 'members'}
                        </span>
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-bold text-primary hover:text-primary-hover flex items-center gap-0.5"
                        >
                          View Workspace <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My Tasks Section (1/3 width) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">My Tasks</h3>
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              {totalTasks - completedTasks} Pending
            </span>
          </div>

          <div className="space-y-4">
            {userTasks.length === 0 ? (
              <div className="p-6 text-center bg-card border border-border rounded-xl shadow-2xs text-muted-foreground text-sm py-12">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                No tasks assigned to you.
              </div>
            ) : (
              userTasks
                .sort((a, b) => {
                  if (!a.dueDate) return 1;
                  if (!b.dueDate) return -1;
                  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                })
                .slice(0, 5)
                .map((task) => {
                  const isCompleted =
                    task.status === 'Done' || task.status === 'completed' || task.status === 'done';
                  const taskProjectName = projectMap[task.project] || 'General Task';

                  let isUrgent = false;
                  let isOverdue = false;
                  let dateDisplay = 'No due date';

                  if (task.dueDate) {
                    const dueDate = new Date(task.dueDate);
                    dateDisplay = dueDate.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    });

                    if (!isCompleted) {
                      const timeDiff = dueDate.getTime() - now.getTime();
                      isOverdue = timeDiff < 0;
                      isUrgent = timeDiff <= warningThreshold;
                    }
                  }

                  let priorityColor =
                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                  if (task.priority === 'High') {
                    priorityColor =
                      'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400';
                  } else if (task.priority === 'Medium') {
                    priorityColor =
                      'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';
                  }

                  return (
                    <div
                      key={task.id || task._id?.toString()}
                      className={`p-4 bg-card border rounded-xl shadow-2xs flex flex-col gap-2.5 transition-colors ${
                        isOverdue
                          ? 'border-error-status/20 hover:border-error-status/40'
                          : isUrgent
                            ? 'border-warning-status/20 hover:border-warning-status/40'
                            : 'border-border hover:border-border/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <h4
                            className={`font-semibold text-sm text-foreground truncate max-w-50 ${
                              isCompleted ? 'line-through text-muted-foreground' : ''
                            }`}
                          >
                            {task.name}
                          </h4>
                          <span className="text-[10px] font-bold text-muted-foreground block truncate">
                            {taskProjectName}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1 items-end shrink-0">
                          {task.priority && (
                            <Badge
                              className={`border-none text-[9px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded-full ${priorityColor}`}
                            >
                              {task.priority}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-border/40">
                        <span className="text-muted-foreground flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          {dateDisplay}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {isOverdue && (
                            <span className="text-[10px] font-extrabold text-error-status flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> OVERDUE
                            </span>
                          )}
                          {!isOverdue && isUrgent && (
                            <span className="text-[10px] font-extrabold text-warning-status flex items-center gap-0.5">
                              <Clock className="w-3 h-3" /> URGENT
                            </span>
                          )}
                          <Badge
                            className={`text-[9px] font-bold border-none capitalize px-1.5 py-0.5 rounded-sm ${
                              isCompleted
                                ? 'bg-success-status/10 text-success-status'
                                : task.status === 'In Progress' || task.status === 'in-progress'
                                  ? 'bg-in-progress-status/10 text-in-progress-status'
                                  : 'bg-to-do-status/10 text-to-do-status'
                            }`}
                          >
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
