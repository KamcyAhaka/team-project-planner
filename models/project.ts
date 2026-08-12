import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { Tasks } from './task';

// Define the shape of a Project document compatible with ProjectModel & specifications
export interface Project {
  _id?: ObjectId;
  name?: string;
  title?: string; // backward compatibility alias
  description?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  deadline?: Date | string; // backward compatibility alias
  members: (string | ObjectId)[]; // member user IDs (ObjectIds or emails)
  ownerId?: string | ObjectId;
  admin?: string; // backward compatibility alias
  status?: string;
  tasks?: Tasks[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Create a new project
export async function createProject(data: Project) {
  if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
    throw new Error('End date / deadline cannot be before the start date.');
  }

  const db = await getDb();

  const projectName = data.name || data.title || "Untitled Project";
  const projectOwner = data.ownerId || data.admin;

  const resolvedMembers: (string | ObjectId)[] = [];
  if (Array.isArray(data.members)) {
    for (const m of data.members) {
      if (typeof m === 'string') {
        const trimmed = m.trim().toLowerCase();
        if (ObjectId.isValid(trimmed)) {
          resolvedMembers.push(new ObjectId(trimmed));
        } else if (trimmed.includes('@')) {
          const user = await db.collection('users').findOne({ email: trimmed });
          if (user) {
            resolvedMembers.push(user._id);
          } else {
            resolvedMembers.push(trimmed);
          }
        } else {
          resolvedMembers.push(m);
        }
      } else {
        resolvedMembers.push(m);
      }
    }
  }

  // Ensure owner is added as a member
  if (projectOwner) {
    const ownerObjectId = typeof projectOwner === 'string' && ObjectId.isValid(projectOwner)
      ? new ObjectId(projectOwner)
      : projectOwner;
    
    const ownerStr = ownerObjectId.toString();
    const isOwnerIncluded = resolvedMembers.some(m => m.toString() === ownerStr);
    if (!isOwnerIncluded) {
      resolvedMembers.push(ownerObjectId);
    }
  }

  const project: Project = {
    name: projectName,
    description: data.description || "",
    members: resolvedMembers,
    startDate: data.startDate || new Date().toISOString(),
    endDate: data.endDate || data.deadline || new Date().toISOString(),
    status: data.status || "planning",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (projectOwner) {
    project.ownerId = typeof projectOwner === 'string' && ObjectId.isValid(projectOwner) 
      ? new ObjectId(projectOwner) 
      : projectOwner;
  }

  // Preserve aliases for backward compatibility if needed
  project.title = projectName;
  project.admin = projectOwner ? projectOwner.toString() : "";
  project.deadline = project.endDate;

  const result = await db.collection('projects').insertOne(project);
  return { ...project, _id: result.insertedId };
}

// Get projects for a user (admin/owner or member)
export async function getUserProjects(userId: string, userEmail?: string): Promise<Project[]> {
  const db = await getDb();

  // Handle both ObjectId and string representations for user queries
  const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;

  const query = {
    $or: [
      { ownerId: userId },
      { admin: userId },
      { members: userId },
      ...(userEmail ? [{ members: userEmail.trim().toLowerCase() }] : []),
      ...(userObjectId ? [
        { ownerId: userObjectId },
        { members: userObjectId }
      ] : [])
    ]
  };

  const projects = await db
    .collection('projects')
    .find(query)
    .toArray();

  return projects as unknown as Project[];
}

// Update a project
export async function updateProject(projectId: string, updates: Partial<Project>) {
  const db = await getDb();

  const mongoUpdates: Partial<Project> = {
    ...updates,
    updatedAt: new Date()
  };

  if (updates.ownerId && typeof updates.ownerId === 'string' && ObjectId.isValid(updates.ownerId)) {
    mongoUpdates.ownerId = new ObjectId(updates.ownerId);
  }
  if (updates.members) {
    mongoUpdates.members = updates.members.map(m => {
      if (typeof m === 'string' && ObjectId.isValid(m)) {
        return new ObjectId(m);
      }
      return m;
    });
  }

  const result = await db
    .collection('projects')
    .updateOne({ _id: new ObjectId(projectId) }, { $set: mongoUpdates });

  return result.modifiedCount > 0;
}

// Get all projects
export async function getAllProject() {
  const db = await getDb();
  const projects = await db.collection('projects').find({}).toArray();
  return projects;
}

// Get specific project by id
export async function getProjectById(projectId: string): Promise<Project | null> {
  if (!ObjectId.isValid(projectId)) return null;
  const db = await getDb();
  const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });
  return project as unknown as Project | null;
}
