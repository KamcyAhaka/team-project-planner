'use client';

import { useState } from 'react';
import { toast } from '@/components/ui/toast';
import { Loader2, UserPlus, Mail, X, Shield, Briefcase, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface TeamTabProps {
  projectId: string;
  members: Member[];
  onInviteSuccess: (newMember: Member) => void;
  onRemoveSuccess: (memberId: string) => void;
}

export function TeamTab({ projectId, members, onInviteSuccess, onRemoveSuccess }: TeamTabProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  // Invite member by email
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');

    if (!inviteEmail.trim()) {
      setInviteError('Email address is required.');
      return;
    }

    setIsInviting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite team member.');
      }

      toast.add({
        type: 'success',
        title: 'Member added',
        description: `"${data.user.displayName || data.user.email}" has been added to the project.`,
      });

      onInviteSuccess(data.user);
      setInviteEmail('');
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to invite user.';
      setInviteError(errorMessage);
      toast.add({
        type: 'error',
        title: 'Invite failed',
        description: errorMessage,
      });
    } finally {
      setIsInviting(false);
    }
  };

  // Remove member by user ID
  const handleRemoveMember = async (memberId: string) => {
    setRemovingMemberId(memberId);

    try {
      const response = await fetch(`/api/projects/${projectId}/members?userId=${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to remove member.');
      }

      toast.add({
        type: 'success',
        title: 'Member removed',
        description: 'The member has been removed from the project.',
      });

      onRemoveSuccess(memberId);
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove member.';
      toast.add({
        type: 'error',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setRemovingMemberId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header info */}
      <div>
        <h3 className="text-lg font-bold text-foreground">Project Team Members</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Invite colleagues via email to collaborate or manage the permissions of existing members.
        </p>
      </div>

      {/* Invite Form */}
      <div className="bg-muted/15 border border-border/50 rounded-2xl p-5 md:p-6 space-y-4">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <UserPlus className="w-4 h-4 text-primary" />
          Invite Member
        </h4>

        {inviteError && (
          <div className="p-3 bg-destructive/10 text-destructive text-xs font-semibold rounded-xl border border-destructive/20 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{inviteError}</span>
          </div>
        )}

        <form
          onSubmit={handleInviteMember}
          className="flex flex-col sm:flex-row items-stretch gap-3"
        >
          <div className="relative flex-1">
            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="Enter team member's email address..."
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm outline-hidden focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all font-semibold"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isInviting}
            className="flex items-center justify-center gap-1.5 min-w-28 px-5 py-2.5 bg-primary hover:bg-primary/95 disabled:bg-primary/50 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Member'}
          </button>
        </form>
      </div>

      {/* Members List */}
      <div className="space-y-3">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground border-b border-border/45 pb-1">
          Currently in project ({members.length})
        </h4>

        <div className="divide-y divide-border/45 border border-border/50 rounded-2xl overflow-hidden bg-card shadow-3xs">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 gap-4 hover:bg-muted/5 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar */}
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0 border border-border"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0 border border-primary/10 uppercase">
                    {member.name.slice(0, 2)}
                  </div>
                )}

                {/* Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-foreground truncate">
                      {member.name}
                    </span>
                    {member.role === 'owner' ? (
                      <Badge className="bg-primary/10 text-primary border-none font-extrabold text-[8px] py-0 px-1.5 rounded-sm flex items-center gap-0.5 select-none shrink-0 capitalize">
                        <Shield className="w-2.5 h-2.5" />
                        Owner
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-none font-bold text-[8px] py-0 px-1.5 rounded-sm flex items-center gap-0.5 select-none shrink-0 capitalize">
                        <Briefcase className="w-2.5 h-2.5" />
                        Member
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground block truncate">
                    {member.email}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {member.role !== 'owner' && (
                <button
                  type="button"
                  onClick={() => handleRemoveMember(member.id)}
                  disabled={removingMemberId !== null}
                  className="text-muted-foreground hover:text-rose-600 hover:bg-rose-500/5 p-2 rounded-lg transition-colors cursor-pointer"
                  title="Remove member from project"
                >
                  {removingMemberId === member.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Badge({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
