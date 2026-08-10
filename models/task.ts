import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';

// A sample of the task model shape
export interface Tasks {
  id: string; // unique identifier for the task
  name: string; // task name
  description: string; // details about the task
  dueDate: string; // deadline (ISO date string recommended)
  status: string; // e.g. "pending", "in-progress", "completed"
  assignedTo: string; // references UserModel.id
  project: string; // references ProjectModel.id
}

// create a new task
export async function createTask(task: Tasks) {
  const db = await getDb('test'); // connect to "test" database
  const tasks = db.collection('tasks'); // get "tasks" collection
  const result = await tasks.insertOne(task); // insert the new task
  return result.insertedId; // return the new task ID
}

// edit a task
export async function updateTask(id: string, updates: Partial<Tasks>) {
  const db = await getDb('test'); // connect to "test" database
  const tasks = db.collection('tasks'); // get "tasks" collection

  const result = await tasks.updateOne(
    { id }, // match by your custom task id field
    { $set: updates } // apply the updates
  );

  return result.modifiedCount; // number of documents updated
}
// get specific task by id
export async function getTaskById(id: string) {
  const db = await getDb('test'); // connect to "test" database
  const tasks = db.collection('tasks'); // get "tasks" collection

  const task = await tasks.findOne({ id }); // search by your custom task id
  return task; // return the task document
}

// get all tasks under a project

export async function getTasksByProject(projectId: string) {
  const db = await getDb('test'); // connect to "test" database
  const tasks = db.collection('tasks'); // get "tasks" collection

  const projectTasks = await tasks.find({ project: projectId }).toArray();
  return projectTasks; // return all tasks for the project
}
