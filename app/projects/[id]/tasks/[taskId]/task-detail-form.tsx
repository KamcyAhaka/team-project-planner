'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/toast';
import { Loader2, Save, Trash2, AlertCircle } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
}

interface Task {
  id: string;
  name: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  status: string;
  priority: string;
}

interface TaskDetailFormProps {
  projectId: string;
  task: Task;
  members: Member[];
  projectStartDate?: string;
  projectEndDate?: string;
}

export function TaskDetailForm({
  projectId,
  task,
  members,
  projectStartDate,
  projectEndDate,
}: TaskDetailFormProps) {
  const router = useRouter();
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description);
  const [assignedTo, setAssignedTo] = useState(task.assignedTo);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  );
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!name.trim()) {
      setValidationError('Task title is required.');
      return;
    }

    if (dueDate) {
      if (projectStartDate) {
        const projectStart = new Date(projectStartDate);
        projectStart.setHours(0, 0, 0, 0);

        const taskDateNormalized = new Date(dueDate);
        taskDateNormalized.setHours(0, 0, 0, 0);

        if (taskDateNormalized < projectStart) {
          const startStr = projectStart.toISOString().split('T')[0];
          setValidationError(`Task due date cannot be before project start date (${startStr}).`);
          return;
        }
      }

      if (projectEndDate) {
        const projectEnd = new Date(projectEndDate);
        projectEnd.setHours(23, 59, 59, 999);

        const taskDateFull = new Date(dueDate);
        if (taskDateFull > projectEnd) {
          const endStr = projectEnd.toISOString().split('T')[0];
          setValidationError(
            `Task due date cannot be after project end date/deadline (${endStr}).`
          );
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          assignedTo: assignedTo || '',
          dueDate: dueDate || '',
          priority,
          status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update task');
      }

      toast.add({
        type: 'success',
        title: 'Task updated',
        description: 'Your changes have been saved successfully.',
      });

      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update task. Please try again.';
      setValidationError(errorMessage);
      toast.add({
        type: 'error',
        title: 'Error',
        description: errorMessage,
      });
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete task');
      }

      toast.add({
        type: 'success',
        title: 'Task deleted',
        description: `"${task.name}" has been removed from the board.`,
      });

      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete task. Please try again.';
      toast.add({
        type: 'error',
        title: 'Error',
        description: errorMessage,
      });
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Validation Error Alert */}
      {validationError && (
        <div className="p-4 bg-destructive/10 text-destructive text-sm font-semibold rounded-xl border border-destructive/20 flex items-start gap-2.5 animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Delete Confirmation Warning Overlay */}
      {showDeleteConfirm && (
        <div className="p-5 bg-rose-500/10 text-rose-700 dark:text-rose-400 text-sm rounded-2xl border border-rose-500/20 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3">
            <Trash2 className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <h4 className="font-bold text-rose-900 dark:text-rose-300">
                Are you absolutely sure?
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-400/80 mt-1 leading-relaxed">
                This action is irreversible. It will permanently remove this task and all related
                logs from the workspace.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-end">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 bg-transparent hover:bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Confirm Delete
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Area (Core details: Title & Description) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Name */}
            <div className="space-y-2">
              <label
                htmlFor="taskName"
                className="text-xs font-bold text-foreground uppercase tracking-wider select-none"
              >
                Task Title
              </label>
              <input
                type="text"
                id="taskName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm outline-hidden focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all font-semibold"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label
                htmlFor="taskDesc"
                className="text-xs font-bold text-foreground uppercase tracking-wider select-none"
              >
                Description
              </label>
              <textarea
                id="taskDesc"
                rows={8}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the goals of this task..."
                className="w-full px-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm outline-hidden focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all placeholder:text-muted-foreground resize-none"
              />
            </div>
          </div>

          {/* Right Side Panel (Metadata configs) */}
          <div className="space-y-6 bg-muted/20 border border-border/40 rounded-2xl p-5 md:p-6 shrink-0 h-fit">
            <h3 className="text-xs font-extrabold text-foreground uppercase tracking-widest border-b border-border/40 pb-2 mb-4">
              Metadata Settings
            </h3>

            {/* Status */}
            <div className="space-y-2">
              <label
                htmlFor="status"
                className="text-xs font-bold text-muted-foreground select-none"
              >
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border/85 rounded-xl text-xs outline-hidden focus:border-primary/60 cursor-pointer font-bold"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label
                htmlFor="priority"
                className="text-xs font-bold text-muted-foreground select-none"
              >
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border/85 rounded-xl text-xs outline-hidden focus:border-primary/60 cursor-pointer font-bold"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Assignee */}
            <div className="space-y-2">
              <label
                htmlFor="assignee"
                className="text-xs font-bold text-muted-foreground select-none"
              >
                Assignee
              </label>
              <select
                id="assignee"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border/85 rounded-xl text-xs outline-hidden focus:border-primary/60 cursor-pointer font-bold"
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label
                htmlFor="dueDate"
                className="text-xs font-bold text-muted-foreground select-none"
              >
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={projectStartDate ? projectStartDate.split('T')[0] : undefined}
                max={projectEndDate ? projectEndDate.split('T')[0] : undefined}
                className="w-full px-3 py-2 bg-background border border-border/85 rounded-xl text-xs outline-hidden focus:border-primary/60 cursor-pointer font-bold"
              />
            </div>
          </div>
        </div>

        {/* Action button bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-border/60 gap-4">
          {/* Delete action */}
          <div>
            {!showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-transparent hover:bg-rose-500/10 text-rose-600 hover:text-rose-700 border border-transparent rounded-xl text-sm font-bold transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Delete Task
              </button>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => router.push(`/projects/${projectId}`)}
              className="px-5 py-2.5 bg-transparent hover:bg-muted/60 text-muted-foreground hover:text-foreground font-bold text-sm rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || showDeleteConfirm}
              className="flex items-center justify-center gap-2 min-w-36 px-5 py-2.5 bg-primary hover:bg-primary/95 disabled:bg-primary/50 text-white font-bold text-sm rounded-xl shadow-md shadow-primary/15 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:pointer-events-none cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
