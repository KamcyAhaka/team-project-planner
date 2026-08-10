import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { Tasks } from './task';

// Define the shape of a Project document
export interface Project {
  _id?: ObjectId;
  title: string;
  description?: string;
  deadline?: Date;
  members: string[]; // emails or usernames
  admin: string; // creator’s ID or email
  tasks?: Tasks[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Create a new project
export async function createProject(data: Project) {
  const db = await getDb('test');

  const project = {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection('projects').insertOne(project);
  return { ...project, _id: result.insertedId };
}

// Get projects for a user (admin or member)
export async function getUserProjects(userId: string) {
  const db = await getDb('projects');

  const projects = await db
    .collection('projects')
    .find({
      $or: [{ admin: userId }, { members: userId }],
    })
    .toArray();

  return projects;
}

// Update a project
export async function updateProject(projectId: string, updates: Partial<Project>) {
  const db = await getDb('test');

  const result = await db
    .collection('projects')
    .updateOne({ _id: new ObjectId(projectId) }, { $set: { ...updates, updatedAt: new Date() } });

  return result.modifiedCount > 0;
}

// Get all project

export async function getAllProject() {
  const db = await getDb('test');
  const projects = await db.collection('projects').find({}).toArray();
  return projects;
}
