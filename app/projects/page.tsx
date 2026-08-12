import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/mongodb';
import { getUserProjects, Project } from '@/models/project';
import { getTasksByProject, Tasks } from '@/models/task';
import { ObjectId } from 'mongodb';
import { ProjectsClient } from '@/components/ProjectsClient';

export const dynamic = 'force-dynamic';

interface Member {
  id: string;
  name: string;
  email: string;
  profilePictureURL?: string;
  role: 'owner' | 'member';
}

interface ProjectData {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  progress: number;
  totalTasksCount: number;
  completedTasksCount: number;
  membersList: Member[];
}

export default async function ProjectsPage() {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    redirect('/auth/sign-in');
  }

  const userId = session.user.id;
  const userEmail = session.user.email;

  // 1. Fetch user projects
  let rawProjects: Project[] = [];
  try {
    rawProjects = await getUserProjects(userId, userEmail);
  } catch (err) {
    console.error('Error fetching projects:', err);
  }

  // 2. Resolve progress (tasks count) for all projects
  const projectsWithProgress = await Promise.all(
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
        progress,
        totalTasksCount,
        completedTasksCount,
      };
    })
  );

  // 3. Resolve user details for all unique member IDs/emails
  const db = await getDb();
  const allMemberIds = new Set<string>();

  projectsWithProgress.forEach((p) => {
    if (p.ownerId) allMemberIds.add(p.ownerId.toString());
    if (p.admin) allMemberIds.add(p.admin.toString());
    if (p.members) {
      p.members.forEach((m) => {
        if (m) allMemberIds.add(m.toString());
      });
    }
  });

  const memberObjectIds = Array.from(allMemberIds)
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const memberEmails = Array.from(allMemberIds).filter(
    (id) => !ObjectId.isValid(id) && id.includes('@')
  );

  interface UserDocument {
    _id: ObjectId;
    email: string;
    displayName?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    profilePictureURL?: string;
  }

  let users: UserDocument[] = [];
  try {
    users = await db
      .collection('users')
      .find({
        $or: [
          { _id: { $in: memberObjectIds } },
          { email: { $in: memberEmails } },
        ],
      })
      .project({ passwordHash: 0 })
      .toArray() as unknown as UserDocument[];
  } catch (err) {
    console.error('Error querying users details:', err);
  }

  // Create lookup maps
  const userMap: Record<string, { name: string; email: string; profilePictureURL?: string }> = {};
  users.forEach((u) => {
    const id = u._id.toString();
    const info = {
      name: u.displayName || u.name || u.email.split('@')[0],
      email: u.email,
      profilePictureURL: u.profilePictureURL,
    };
    userMap[id] = info;
    userMap[u.email.toLowerCase().trim()] = info;
  });

  // 4. Map everything to clean ProjectData interface objects
  const projectsData: ProjectData[] = projectsWithProgress.map((p) => {
    const ownerIdStr = p.ownerId?.toString() || p.admin?.toString();
    const rawMembers = Array.isArray(p.members) ? p.members : [];
    
    // Add owner/admin to the member set for layout, and resolve
    const allIds = [ownerIdStr, ...rawMembers.map((m) => m.toString())].filter(Boolean) as string[];
    const uniqueIds = Array.from(new Set(allIds));

    const membersList: Member[] = uniqueIds.map((id) => {
      const u = userMap[id] || userMap[id.toLowerCase().trim()];
      if (u) {
        return {
          id,
          name: u.name,
          email: u.email,
          profilePictureURL: u.profilePictureURL,
          role: id === ownerIdStr ? 'owner' : 'member',
        };
      }
      // If it looks like an email but wasn't resolved in user query
      if (id.includes('@')) {
        return {
          id,
          name: id.split('@')[0],
          email: id,
          role: 'member',
        };
      }
      return {
        id,
        name: 'Unknown Member',
        email: '',
        role: id === ownerIdStr ? 'owner' : 'member',
      };
    });

    const getIsoString = (val: Date | string | undefined): string => {
      if (!val) return new Date().toISOString();
      return typeof val === 'string' ? new Date(val).toISOString() : val.toISOString();
    };

    return {
      id: p._id ? p._id.toString() : '',
      name: p.name || p.title || 'Untitled Project',
      description: p.description || '',
      startDate: getIsoString(p.startDate),
      endDate: getIsoString(p.endDate || p.deadline || p.startDate),
      status: p.status || 'planning',
      progress: p.progress,
      totalTasksCount: p.totalTasksCount,
      completedTasksCount: p.completedTasksCount,
      membersList,
    };
  });

  return <ProjectsClient initialProjects={projectsData} />;
}
