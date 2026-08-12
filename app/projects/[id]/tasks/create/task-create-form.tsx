'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/toast';
import { Loader2, Plus, Calendar, User, ListTodo, AlertCircle } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
}

interface TaskCreateFormProps {
  projectId: string;
  members: Member[];
  projectStartDate?: string;
  projectEndDate?: string;
}

export function TaskCreateForm({
  projectId,
  members,
  projectStartDate,
  projectEndDate,
}: TaskCreateFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('To Do');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
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
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          assignedTo: assignedTo || undefined,
          dueDate: dueDate || undefined,
          priority,
          status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create task');
      }

      toast.add({
        type: 'success',
        title: 'Success!',
        description: 'Your task has been created successfully.',
      });

      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create task. Please try again.';
      setValidationError(errorMessage);
      toast.add({
        type: 'error',
        title: 'Error',
        description: errorMessage,
      });
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Validation Error Alert */}
      {validationError && (
        <div className="p-4 bg-destructive/10 text-destructive text-sm font-semibold rounded-xl border border-destructive/20 flex items-start gap-2.5 animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Task Name */}
      <div className="space-y-2">
        <label
          htmlFor="taskName"
          className="text-sm font-bold text-foreground flex items-center gap-2 select-none"
        >
          <ListTodo className="w-4 h-4 text-muted-foreground" />
          Task Title
          <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          id="taskName"
          placeholder="e.g. Design database schema"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm outline-hidden focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all placeholder:text-muted-foreground"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="taskDesc" className="text-sm font-bold text-foreground select-none">
          Description
        </label>
        <textarea
          id="taskDesc"
          placeholder="Explain what needs to be done, reference files or links, and list checklists if necessary..."
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm outline-hidden focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all placeholder:text-muted-foreground resize-none"
        />
      </div>

      {/* Assignee & Due Date Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assignee */}
        <div className="space-y-2">
          <label
            htmlFor="assignee"
            className="text-sm font-bold text-foreground flex items-center gap-2 select-none"
          >
            <User className="w-4 h-4 text-muted-foreground" />
            Assignee
          </label>
          <select
            id="assignee"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full px-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm outline-hidden focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all cursor-pointer"
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.email})
              </option>
            ))}
          </select>
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <label
            htmlFor="dueDate"
            className="text-sm font-bold text-foreground flex items-center gap-2 select-none"
          >
            <Calendar className="w-4 h-4 text-muted-foreground" />
            Due Date / Deadline
          </label>
          <input
            type="date"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={projectStartDate ? projectStartDate.split('T')[0] : undefined}
            max={projectEndDate ? projectEndDate.split('T')[0] : undefined}
            className="w-full px-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm outline-hidden focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all cursor-pointer"
          />
        </div>
      </div>

      {/* Status & Priority Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Priority */}
        <div className="space-y-2">
          <label htmlFor="priority" className="text-sm font-bold text-foreground select-none">
            Priority Level
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm outline-hidden focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all cursor-pointer font-semibold"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-bold text-foreground select-none">
            Board Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm outline-hidden focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all cursor-pointer font-semibold"
          >
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/60">
        <button
          type="button"
          onClick={() => router.push(`/projects/${projectId}`)}
          className="px-5 py-2.5 bg-transparent hover:bg-muted/60 text-muted-foreground hover:text-foreground font-bold text-sm rounded-xl transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 min-w-32 px-5 py-2.5 bg-primary hover:bg-primary/95 disabled:bg-primary/50 text-white font-bold text-sm rounded-xl shadow-md shadow-primary/15 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:pointer-events-none cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Create Task
            </>
          )}
        </button>
      </div>
    </form>
  );
}
