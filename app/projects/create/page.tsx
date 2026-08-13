'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, Calendar, Users, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/components/ui/toast';

export default function CreateProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('planning');
  const [memberInput, setMemberInput] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const addMember = () => {
    const email = memberInput.trim().toLowerCase();
    if (!email) return;

    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (members.includes(email)) {
      setValidationError('This member email has already been added.');
      return;
    }

    setMembers([...members, email]);
    setMemberInput('');
    setValidationError('');
  };

  const removeMember = (indexToRemove: number) => {
    setMembers(members.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMember();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!name.trim()) {
      setValidationError('Project title is required.');
      return;
    }

    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
      setValidationError('End date / deadline cannot be before the start date.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          startDate,
          endDate: endDate || startDate,
          status,
          members,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create project');
      }

      toast.add({
        type: 'success',
        title: 'Success!',
        description: 'Your project has been created successfully.',
      });

      router.push('/projects');
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project. Please try again.';
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
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back button */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
      </div>

      {/* Main card */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xs">
        <div className="border-b border-border/60 pb-5 mb-6">
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Create New Project</h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            Set up your shared workspace, invite team members, and start planning.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Validation Error Alert */}
          {validationError && (
            <div className="p-4 bg-destructive/10 text-destructive text-sm font-semibold rounded-xl border border-destructive/20 animate-shake">
              {validationError}
            </div>
          )}

          {/* Project Title */}
          <div className="space-y-2">
            <label htmlFor="projectName" className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Project Title
              <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="projectName"
              placeholder="e.g. CS 301 Capstone Assignment"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm outline-hidden focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all placeholder:text-muted-foreground"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="projectDesc" className="text-sm font-bold text-foreground flex items-center gap-2">
              Description
            </label>
            <textarea
              id="projectDesc"
              placeholder="Brief summary of the goals, milestones, and scope of this group assignment..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm outline-hidden focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all placeholder:text-muted-foreground resize-none"
            />
          </div>

          {/* Dates & Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Start Date */}
            <div className="space-y-2">
              <label htmlFor="startDate" className="text-sm font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm outline-hidden focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all cursor-pointer"
              />
            </div>

            {/* End Date / Deadline */}
            <div className="space-y-2">
              <label htmlFor="endDate" className="text-sm font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                End Date / Deadline
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm outline-hidden focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all cursor-pointer"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm outline-hidden focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all cursor-pointer"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Members Invitation */}
          <div className="space-y-3 pt-2">
            <label htmlFor="memberEmail" className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Invite Team Members (by Email)
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                id="memberEmail"
                placeholder="e.g. partner@school.edu"
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 px-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm outline-hidden focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={addMember}
                className="px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground border border-border font-bold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Members badges list */}
            {members.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-muted/40 dark:bg-muted/20 rounded-xl border border-border/40 min-h-12">
                {members.map((email, index) => (
                  <div
                    key={email}
                    className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-card text-foreground text-xs font-semibold rounded-lg border border-border shadow-xs"
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="p-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/60">
            <Link
              href="/projects"
              className="px-5 py-2.5 bg-transparent hover:bg-muted/60 text-muted-foreground hover:text-foreground font-bold text-sm rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 min-w-32 px-5 py-2.5 bg-primary hover:bg-primary/95 disabled:bg-primary/50 text-white font-bold text-sm rounded-xl shadow-md shadow-primary/15 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:pointer-events-none cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
