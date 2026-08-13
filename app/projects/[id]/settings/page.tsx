import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getProjectById } from '@/models/project';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProjectSettingsForm } from './project-settings-form';

interface ProjectSettingsPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const session = await auth();

  // 1. Authenticate user
  if (!session || !session.user || !session.user.id) {
    redirect('/auth/sign-in');
  }

  const userId = session.user.id;

  // 2. Fetch project ID parameter
  const { id: projectId } = await params;
  if (!projectId || !ObjectId.isValid(projectId)) {
    redirect('/dashboard?error=Invalid+project+ID');
  }

  // 3. Fetch project details
  const project = await getProjectById(projectId);
  if (!project) {
    redirect('/dashboard?error=Project+not+found');
  }

  // 4. Verify authorization (only project owner can access settings)
  const currentUserIdStr = userId.toString();
  const ownerIdStr = project.ownerId?.toString();
  const isOwner = ownerIdStr === currentUserIdStr;

  if (!isOwner) {
    redirect(`/projects/${projectId}?error=Access+denied.+Only+owners+can+access+settings.`);
  }

  // 5. Gather project members details for management list
  const memberIds: ObjectId[] = [];
  if (project.ownerId && ObjectId.isValid(project.ownerId.toString())) {
    memberIds.push(new ObjectId(project.ownerId.toString()));
  }
  if (Array.isArray(project.members)) {
    project.members.forEach((m) => {
      if (ObjectId.isValid(m.toString())) {
        memberIds.push(new ObjectId(m.toString()));
      }
    });
  }

  // Deduplicate IDs
  const uniqueMemberIds = Array.from(new Set(memberIds.map((id) => id.toString()))).map(
    (idStr) => new ObjectId(idStr)
  );

  const db = await getDb();
  const users = await db
    .collection('users')
    .find({ _id: { $in: uniqueMemberIds } })
    .project({ passwordHash: 0 })
    .toArray();

  const membersList = users.map((u) => {
    const name =
      u.displayName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email.split('@')[0];
    const role = u._id.toString() === ownerIdStr ? 'owner' : 'member';
    return {
      id: u._id.toString(),
      name,
      email: u.email,
      avatar: u.profilePictureURL || '',
      role,
    };
  });

  // Convert project document to a plain serializable JSON object for the Client Component
  const serializableProject = {
    id: project._id ? project._id.toString() : '',
    name: project.name || project.title || 'Untitled Project',
    description: project.description || '',
    startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
    endDate:
      project.endDate || project.deadline
        ? new Date((project.endDate || project.deadline)!).toISOString().split('T')[0]
        : '',
    status: project.status || 'planning',
    ownerId: ownerIdStr || '',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back to Project Board */}
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Project Board
        </Link>
      </div>

      {/* Settings Form Container */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xs">
        <div className="border-b border-border/60 pb-5 mb-8">
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
            Project Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            Manage general configuration, team members, and overall project operations.
          </p>
        </div>

        <ProjectSettingsForm project={serializableProject} initialMembers={membersList} />
      </div>
    </div>
  );
}
