'use client';

import { Calendar, Loader2, Save } from 'lucide-react';

interface GeneralTabProps {
  name: string;
  setName: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  status: string;
  setStatus: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function GeneralTab({
  name,
  setName,
  description,
  setDescription,
  status,
  setStatus,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isSaving,
  onSubmit,
}: GeneralTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h3 className="text-lg font-bold text-foreground">General Configuration</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Edit your project title, details, status, and milestone dates.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Project Name */}
        <div className="space-y-2">
          <label
            htmlFor="projName"
            className="text-xs font-extrabold text-foreground uppercase tracking-wider"
          >
            Project Title
          </label>
          <input
            type="text"
            id="projName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm outline-hidden focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all font-semibold"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label
            htmlFor="projDesc"
            className="text-xs font-extrabold text-foreground uppercase tracking-wider"
          >
            Description
          </label>
          <textarea
            id="projDesc"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain the project outline and scopes..."
            className="w-full px-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm outline-hidden focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all placeholder:text-muted-foreground resize-none"
          />
        </div>

        {/* Status & Dates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Status */}
          <div className="space-y-2">
            <label
              htmlFor="projStatus"
              className="text-xs font-extrabold text-foreground uppercase tracking-wider"
            >
              Status
            </label>
            <select
              id="projStatus"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm outline-hidden focus:border-primary/60 cursor-pointer font-bold"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on hold">On Hold</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <label
              htmlFor="projStart"
              className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              Start Date
            </label>
            <input
              type="date"
              id="projStart"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm outline-hidden focus:border-primary/60 cursor-pointer font-semibold"
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <label
              htmlFor="projEnd"
              className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              End Date / Deadline
            </label>
            <input
              type="date"
              id="projEnd"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm outline-hidden focus:border-primary/60 cursor-pointer font-semibold"
            />
          </div>
        </div>

        {/* Action bar */}
        <div className="pt-6 border-t border-border/50 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center gap-2 min-w-36 px-5 py-2.5 bg-primary hover:bg-primary/95 disabled:bg-primary/50 text-white font-bold text-sm rounded-xl shadow-md shadow-primary/15 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:pointer-events-none cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
