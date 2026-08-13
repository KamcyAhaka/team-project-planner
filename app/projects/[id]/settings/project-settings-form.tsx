'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/toast';
import { Settings, Users, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GeneralTab } from './components/general-tab';
import { TeamTab } from './components/team-tab';
import { DangerTab } from './components/danger-tab';

interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string; // 'owner' | 'member'
}

interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  ownerId: string;
}

interface ProjectSettingsFormProps {
  project: Project;
  initialMembers: Member[];
}

type TabType = 'general' | 'team' | 'danger';

export function ProjectSettingsForm({ project, initialMembers }: ProjectSettingsFormProps) {
  const router = useRouter();

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // General Settings State
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [startDate, setStartDate] = useState(project.startDate);
  const [endDate, setEndDate] = useState(project.endDate);
  const [status, setStatus] = useState(project.status);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Team List State (passed down and updated via callbacks)
  const [members, setMembers] = useState<Member[]>(initialMembers);

  // 1. Save general settings changes
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!name.trim()) {
      setValidationError('Project title is required.');
      return;
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setValidationError('End date / deadline cannot be before the start date.');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update project settings.');
      }

      toast.add({
        type: 'success',
        title: 'Settings saved',
        description: 'Project details have been updated successfully.',
      });

      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings.';
      setValidationError(errorMessage);
      toast.add({
        type: 'error',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Callbacks from TeamTab to keep parent's members list updated
  const handleInviteSuccess = (newMember: Member) => {
    setMembers((prev) => [...prev, newMember]);
  };

  const handleRemoveSuccess = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Left Sidebar Tab Navigation */}
      <div className="md:col-span-1 flex flex-col gap-1.5 bg-muted/40 md:bg-transparent p-2 md:p-0 rounded-2xl md:rounded-none border-none md:border-r border-border/60 pb-0 md:pb-0 md:pr-4">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={cn(
            'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer w-full justify-start',
            activeTab === 'general'
              ? 'bg-primary text-white shadow-xs shadow-primary/10'
              : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          <Settings className="w-4 h-4 shrink-0" />
          General Info
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('team')}
          className={cn(
            'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer w-full justify-start',
            activeTab === 'team'
              ? 'bg-primary text-white shadow-xs shadow-primary/10'
              : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          <Users className="w-4 h-4 shrink-0" />
          Team Members
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('danger')}
          className={cn(
            'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer w-full justify-start',
            activeTab === 'danger'
              ? 'bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400'
              : 'bg-transparent text-muted-foreground hover:text-rose-600 hover:bg-rose-500/5'
          )}
        >
          <Trash2 className="w-4 h-4 shrink-0" />
          Danger Zone
        </button>
      </div>

      {/* Right Content Panel */}
      <div className="md:col-span-3 min-h-100">
        {/* Tab 1: General Project Info Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {validationError && (
              <div className="p-4 bg-destructive/10 text-destructive text-sm font-semibold rounded-xl border border-destructive/20 flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            <GeneralTab
              name={name}
              setName={setName}
              description={description}
              setDescription={setDescription}
              status={status}
              setStatus={setStatus}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              isSaving={isSaving}
              onSubmit={handleSaveSettings}
            />
          </div>
        )}

        {/* Tab 2: Team Members Management Settings */}
        {activeTab === 'team' && (
          <TeamTab
            projectId={project.id}
            members={members}
            onInviteSuccess={handleInviteSuccess}
            onRemoveSuccess={handleRemoveSuccess}
          />
        )}

        {/* Tab 3: Danger Zone Settings */}
        {activeTab === 'danger' && <DangerTab projectId={project.id} projectName={project.name} />}
      </div>
    </div>
  );
}
