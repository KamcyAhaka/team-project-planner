import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';

// A sample of the task model shape
export interface Tasks {
  _id?: ObjectId;
  id: string; // unique identifier for the task
  name: string; // task name
  description: string; // details about the task
  dueDate: string; // deadline (ISO date string recommended)
  status: string; // e.g. "pending", "in-progress", "completed"
  assignedTo: string; // references UserModel.id
  project: string; // references ProjectModel.id
  priority?: string; // e.g. "Low", "Medium", "High"
}

// create a new task
export async function createTask(task: Tasks) {
  const db = await getDb(); // connect to database
  const tasks = db.collection('tasks'); // get "tasks" collection
  const result = await tasks.insertOne(task); // insert the new task
  return result.insertedId; // return the new task ID
}

// edit a task
export async function updateTask(id: string, updates: Partial<Tasks>) {
  const db = await getDb(); // connect to database
  const tasks = db.collection('tasks'); // get "tasks" collection

  const result = await tasks.updateOne(
    { id }, // match by your custom task id field
    { $set: updates } // apply the updates
  );

  return result.modifiedCount; // number of documents updated
}
// get specific task by id
export async function getTaskById(id: string): Promise<Tasks | null> {
  const db = await getDb(); // connect to database
  const tasks = db.collection('tasks'); // get "tasks" collection

  const task = await tasks.findOne({ id }); // search by your custom task id
  return task as unknown as Tasks | null; // return the task document
}

// get all tasks under a project
export async function getTasksByProject(projectId: string): Promise<Tasks[]> {
  const db = await getDb(); // connect to database
  const tasks = db.collection('tasks'); // get "tasks" collection

  const projectTasks = await tasks.find({ project: projectId }).toArray();
  return projectTasks as unknown as Tasks[]; // return all tasks for the project
}

// get all tasks assigned to a specific user
export async function getTasksByUser(userId: string): Promise<Tasks[]> {
  const db = await getDb();
  const tasks = db.collection('tasks');
  
  // Find tasks where assignedTo matches userId (string or ObjectId)
  const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
  const query = {
    $or: [
      { assignedTo: userId },
      ...(userObjectId ? [{ assignedTo: userObjectId }] : [])
    ]
  };

  const userTasks = await tasks.find(query).toArray();
  return userTasks as unknown as Tasks[];
}

// delete a task by custom id field
export async function deleteTask(id: string): Promise<number> {
  const db = await getDb();
  const tasks = db.collection('tasks');
  const result = await tasks.deleteOne({ id });
  return result.deletedCount;
}
