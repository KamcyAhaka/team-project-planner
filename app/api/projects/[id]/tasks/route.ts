import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getProjectById } from '@/models/project';
import { createTask } from '@/models/task';
import { z } from 'zod';

const createTaskSchema = z.object({
  name: z.string().trim().min(1, 'Task name is required').max(100),
  description: z.string().trim().max(500).optional().default(''),
  assignedTo: z.string().trim().optional().default(''),
  dueDate: z.string().trim().optional().default(''),
  priority: z.enum(['Low', 'Medium', 'High']).optional().default('Medium'),
  status: z.string().trim().optional().default('To Do'),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user session
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const { id: projectId } = await params;
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // 2. Fetch project details and check if user belongs to project
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const currentUserIdStr = session.user.id.toString();
    const isOwner = project.ownerId?.toString() === currentUserIdStr;
    const isMember = project.members?.some(
      (m) => m.toString() === currentUserIdStr
    );

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { error: 'Forbidden. You do not belong to this project.' },
        { status: 403 }
      );
    }

    // 3. Validate body
    const body = await request.json();
    const validationResult = createTaskSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, description, assignedTo, dueDate, priority, status } = validationResult.data;

    // Validate that task due date falls within project start and end dates boundaries
    if (dueDate) {
      const taskDate = new Date(dueDate);
      if (isNaN(taskDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid task due date format.' },
          { status: 400 }
        );
      }

      if (project.startDate) {
        const projectStart = new Date(project.startDate);
        projectStart.setHours(0, 0, 0, 0);
        
        const taskDateNormalized = new Date(dueDate);
        taskDateNormalized.setHours(0, 0, 0, 0);

        if (taskDateNormalized < projectStart) {
          const startStr = projectStart.toISOString().split('T')[0];
          return NextResponse.json(
            { error: `Task due date cannot be before project start date (${startStr}).` },
            { status: 400 }
          );
        }
      }

      if (project.endDate) {
        const projectEnd = new Date(project.endDate);
        projectEnd.setHours(23, 59, 59, 999);

        const taskDateFull = new Date(dueDate);
        if (taskDateFull > projectEnd) {
          const endStr = projectEnd.toISOString().split('T')[0];
          return NextResponse.json(
            { error: `Task due date cannot be after project end date/deadline (${endStr}).` },
            { status: 400 }
          );
        }
      }
    }

    // Normalize status string representation to match our UI standards
    let normalizedStatus = status;
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'todo' || lowerStatus === 'to-do') {
      normalizedStatus = 'To Do';
    } else if (lowerStatus === 'in-progress') {
      normalizedStatus = 'In Progress';
    } else if (lowerStatus === 'done' || lowerStatus === 'completed') {
      normalizedStatus = 'Done';
    }

    // 4. Construct task model object
    const newTask = {
      id: crypto.randomUUID(), // unique custom id string
      name,
      description,
      dueDate,
      status: normalizedStatus,
      assignedTo,
      project: projectId, // reference project custom id/ObjectId representation
      priority,
    };

    // 5. Save to DB
    await createTask(newTask);

    return NextResponse.json(
      { message: 'Task created successfully', task: newTask },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create task endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Failed to create task.' },
      { status: 500 }
    );
  }
}
