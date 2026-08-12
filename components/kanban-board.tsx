'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Tasks } from '@/models/task';
import { toast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, Plus } from 'lucide-react';

interface KanbanBoardProps {
  initialTasks: Tasks[];
  projectId: string;
  members: Record<string, { name: string; email: string; avatar?: string }>;
}

export function KanbanBoard({ initialTasks, projectId, members }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Tasks[]>(initialTasks);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeOverColumn, setActiveOverColumn] = useState<string | null>(null);

  // Group columns
  const getTasksByStatus = (status: string) => {
    return tasks.filter((t) => {
      const s = t.status ? t.status.toLowerCase() : '';
      if (status === 'To Do') {
        return s === 'to do' || s === 'todo' || s === 'pending' || s === 'to-do';
      }
      if (status === 'In Progress') {
        return s === 'in progress' || s === 'in-progress';
      }
      if (status === 'Done') {
        return s === 'done' || s === 'completed';
      }
      return false;
    });
  };

  const columns = ['To Do', 'In Progress', 'Done'];

  // Native HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setActiveOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, column: string) => {
    e.preventDefault();
    if (activeOverColumn !== column) {
      setActiveOverColumn(column);
    }
  };

  const handleDragEnter = (e: React.DragEvent, column: string) => {
    e.preventDefault();
    setActiveOverColumn(column);
  };

  const handleDragLeave = () => {
    setActiveOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;

    setDraggedTaskId(null);
    setActiveOverColumn(null);

    if (!taskId) return;

    // Find the task
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    const currentTask = tasks[taskIndex];
    const originalStatus = currentTask.status;

    // If already in that column group, do nothing
    const normalizedCurrent = originalStatus ? originalStatus.toLowerCase() : '';
    const isAlreadyInTarget =
      (targetStatus === 'To Do' &&
        (normalizedCurrent === 'to do' ||
          normalizedCurrent === 'todo' ||
          normalizedCurrent === 'pending' ||
          normalizedCurrent === 'to-do')) ||
      (targetStatus === 'In Progress' &&
        (normalizedCurrent === 'in progress' || normalizedCurrent === 'in-progress')) ||
      (targetStatus === 'Done' &&
        (normalizedCurrent === 'done' || normalizedCurrent === 'completed'));

    if (isAlreadyInTarget) return;

    // Optimistically update status in local state
    const previousTasks = [...tasks];
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, status: targetStatus };
      }
      return t;
    });
    setTasks(updatedTasks);

    // Call API route to persist change
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      toast.add({
        type: 'success',
        title: 'Task updated',
        description: `Moved "${currentTask.name}" to ${targetStatus}.`,
      });
    } catch (err) {
      console.error('Drag drop error:', err);
      // Revert state on failure
      setTasks(previousTasks);

      toast.add({
        type: 'error',
        title: 'Update failed',
        description: `Failed to move task. Reverted back to ${originalStatus}.`,
      });
    }
  };

  const now = new Date();
  const warningThreshold = 48 * 60 * 60 * 1000;

  const getTaskUrgency = (dueDateStr?: string, status?: string) => {
    if (!dueDateStr) return { isOverdue: false, isUrgent: false };
    const dueDate = new Date(dueDateStr);
    const isCompleted = status === 'Done' || status === 'completed' || status === 'done';
    if (isCompleted) return { isOverdue: false, isUrgent: false };

    const timeDiff = dueDate.getTime() - now.getTime();
    return {
      isOverdue: timeDiff < 0,
      isUrgent: timeDiff >= 0 && timeDiff <= warningThreshold,
    };
  };

  const getColumnDotColor = (col: string) => {
    if (col === 'To Do') return 'bg-to-do-status';
    if (col === 'In Progress') return 'bg-in-progress-status';
    return 'bg-success-status';
  };

  return (
    <div className="bg-muted/40 border border-border/50 rounded-3xl p-5 md:p-6 shadow-3xs">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map((column) => {
          const colTasks = getTasksByStatus(column);
          const isDraggingOver = activeOverColumn === column;

          return (
            <div
              key={column}
              onDragOver={(e) => handleDragOver(e, column)}
              onDragEnter={(e) => handleDragEnter(e, column)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column)}
              className={cn(
                'flex flex-col bg-card/65 border rounded-2xl p-4 space-y-4 transition-all duration-200 min-h-112.5 shadow-3xs',
                isDraggingOver
                  ? 'border-primary/40 bg-primary/2 scale-[1.01] shadow-xs'
                  : 'border-border/40'
              )}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-border/40 pb-2.5 select-none">
                <span className="font-bold text-sm text-foreground flex items-center gap-2">
                  <span className={cn('w-2.5 h-2.5 rounded-full', getColumnDotColor(column))} />
                  {column}
                </span>
                <Badge className="bg-muted text-muted-foreground border-none font-bold text-xs px-2 py-0.5">
                  {colTasks.length}
                </Badge>
              </div>

              {/* Tasks list */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-125 pr-1">
                {colTasks.length === 0 ? (
                  <div className="text-center py-16 text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl bg-muted/20 select-none">
                    No tasks here.
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const taskIdStr = task.id || task._id?.toString() || '';
                    const isBeingDragged = draggedTaskId === taskIdStr;

                    return (
                      <TaskCard
                        key={taskIdStr}
                        task={task}
                        members={members}
                        getTaskUrgency={getTaskUrgency}
                        projectId={projectId}
                        isBeingDragged={isBeingDragged}
                        onDragStart={(e) => handleDragStart(e, taskIdStr)}
                        onDragEnd={handleDragEnd}
                      />
                    );
                  })
                )}
              </div>

              {/* Add Task Button at bottom of column */}
              <Link
                href={`/projects/${projectId}/tasks/create?status=${encodeURIComponent(column)}`}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/[0.04] border border-dashed border-border hover:border-primary/45 rounded-xl transition-all cursor-pointer select-none mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Task
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: Tasks;
  members: Record<string, { name: string; email: string; avatar?: string }>;
  getTaskUrgency: (
    dueDateStr?: string,
    status?: string
  ) => { isOverdue: boolean; isUrgent: boolean };
  projectId: string;
  isBeingDragged: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

function TaskCard({
  task,
  members,
  getTaskUrgency,
  projectId,
  isBeingDragged,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  const { isOverdue, isUrgent } = getTaskUrgency(task.dueDate, task.status);
  const assignee = task.assignedTo ? members[task.assignedTo.toString()] : null;
  const isCompleted =
    task.status === 'Done' || task.status === 'completed' || task.status === 'done';

  let priorityColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  if (task.priority === 'High') {
    priorityColor = 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400';
  } else if (task.priority === 'Medium') {
    priorityColor = 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';
  }

  const taskIdStr = task.id || task._id?.toString() || '';

  return (
    <div
      draggable={true}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        'p-4 bg-card border rounded-xl shadow-2xs hover:shadow-xs transition-all flex flex-col gap-3 group relative cursor-grab active:cursor-grabbing',
        isBeingDragged && 'opacity-40 scale-[0.98] border-primary',
        !isBeingDragged && isOverdue
          ? 'border-error-status/25 hover:border-error-status/40'
          : !isBeingDragged && isUrgent
            ? 'border-warning-status/25 hover:border-warning-status/40'
            : 'border-border hover:border-border/80'
      )}
    >
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/projects/${projectId}/tasks/${taskIdStr}`}
            className={cn(
              'font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-2 pr-4',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {task.name}
          </Link>

          {task.priority && (
            <Badge
              className={cn(
                'border-none text-[9px] font-bold px-1.5 py-0.5 rounded-sm capitalize shrink-0',
                priorityColor
              )}
            >
              {task.priority}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {task.description || 'No description provided.'}
        </p>
      </div>

      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-border/40 select-none">
        {/* Assignee preview */}
        {assignee ? (
          <div className="flex items-center gap-1.5 min-w-0" title={`Assigned to ${assignee.name}`}>
            <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-[9px] flex items-center justify-center uppercase shrink-0">
              {assignee.avatar ? (
                <Image
                  src={assignee.avatar}
                  alt={assignee.name}
                  width={20}
                  height={20}
                  className="rounded-full object-cover"
                />
              ) : (
                assignee.name.slice(0, 2)
              )}
            </div>
            <span className="text-muted-foreground font-semibold truncate">{assignee.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground italic">Unassigned</span>
        )}

        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span
              className={cn(
                'flex items-center gap-1 font-semibold',
                isOverdue
                  ? 'text-error-status'
                  : isUrgent
                    ? 'text-warning-status'
                    : 'text-muted-foreground'
              )}
            >
              {isOverdue ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              {new Date(task.dueDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
