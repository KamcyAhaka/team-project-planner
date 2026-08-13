'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/toast';
import { Loader2, Trash2 } from 'lucide-react';

interface DangerTabProps {
  projectId: string;
  projectName: string;
}

export function DangerTab({ projectId, projectName }: DangerTabProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState('');

  const handleDeleteProject = async () => {
    if (deleteConfirmTitle.trim().toLowerCase() !== projectName.trim().toLowerCase()) {
      toast.add({
        type: 'error',
        title: 'Confirmation Failed',
        description: 'Please type the project title exactly to confirm deletion.',
      });
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete project.');
      }

      toast.add({
        type: 'success',
        title: 'Project deleted',
        description: `"${projectName}" and all of its tasks have been removed.`,
      });

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project.';
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
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400">Danger Zone</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Irreversible actions regarding this project. Be extremely careful.
        </p>
      </div>

      <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-5 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="font-extrabold text-sm text-rose-900 dark:text-rose-300">
              Delete Project
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-400/80 mt-1 leading-relaxed max-w-xl">
              Permanently delete this project, its tasks, comments, and all associated workspace
              records. This action is final and cannot be undone.
            </p>
          </div>

          {!showDeleteConfirm && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md shadow-rose-900/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0 self-start md:self-center"
            >
              Delete Project...
            </button>
          )}
        </div>

        {showDeleteConfirm && (
          <div className="border-t border-rose-500/20 pt-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <p className="text-xs text-rose-800 dark:text-rose-300 font-semibold">
                To confirm, type{' '}
                <span className="font-bold underline select-all">{projectName}</span> in the box
                below:
              </p>
              <input
                type="text"
                placeholder="Type project title to confirm..."
                value={deleteConfirmTitle}
                onChange={(e) => setDeleteConfirmTitle(e.target.value)}
                className="w-full max-w-md px-4 py-2 bg-background border border-rose-500/20 rounded-xl text-sm outline-hidden focus:border-rose-500 focus:ring-3 focus:ring-rose-500/10 transition-all font-bold text-rose-900 dark:text-rose-100"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmTitle('');
                }}
                className="px-4 py-2 bg-transparent hover:bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={
                  isDeleting ||
                  deleteConfirmTitle.trim().toLowerCase() !== projectName.trim().toLowerCase()
                }
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Confirm Delete Project
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
