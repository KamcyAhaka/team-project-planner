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
  const db = await getDb();

  const projectName = data.name || data.title || "Untitled Project";
  const projectOwner = data.ownerId || data.admin;

  const project: Project = {
    name: projectName,
    description: data.description || "",
    members: Array.isArray(data.members) ? data.members.map(m => {
      if (typeof m === 'string' && ObjectId.isValid(m)) {
        return new ObjectId(m);
      }
      return m;
    }) : [],
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
export async function getUserProjects(userId: string): Promise<Project[]> {
  const db = await getDb();

  // Handle both ObjectId and string representations for user queries
  const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;

  const query = {
    $or: [
      { ownerId: userId },
      { admin: userId },
      { members: userId },
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
