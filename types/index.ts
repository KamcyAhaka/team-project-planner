export interface UserModel {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  profilePictureURL: string;
  createdAt: Date;
}

export interface ProjectModel {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  ownerId: string;
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskModel {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  status: "To Do" | "In Progress" | "Done";
  priority: "Low" | "Medium" | "High";
  assignedTo?: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}
