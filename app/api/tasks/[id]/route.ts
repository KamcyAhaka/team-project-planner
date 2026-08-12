import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getTaskById, updateTask, deleteTask } from '@/models/task';
import { getProjectById } from '@/models/project';
import { z } from 'zod';

const updateTaskSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  dueDate: z.string().trim().optional(),
  status: z.string().trim().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  assignedTo: z.string().trim().optional(),
});

export async function PATCH(
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

    const { id: taskId } = await params;
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // 2. Fetch target task
    const task = await getTaskById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // 3. Retrieve task's associated project to check permissions
    const project = await getProjectById(task.project);
    if (!project) {
      return NextResponse.json(
        { error: 'Associated project not found' },
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
        { error: 'Forbidden. You do not have access to edit this task.' },
        { status: 403 }
      );
    }

    // 4. Validate body
    const body = await request.json();
    const validationResult = updateTaskSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // Validate task due date falls within project start/end dates
    if (updates.dueDate) {
      const taskDate = new Date(updates.dueDate);
      if (isNaN(taskDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid task due date format.' },
          { status: 400 }
        );
      }

      if (project.startDate) {
        const projectStart = new Date(project.startDate);
        projectStart.setHours(0, 0, 0, 0);

        const taskDateNormalized = new Date(updates.dueDate);
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

        const taskDateFull = new Date(updates.dueDate);
        if (taskDateFull > projectEnd) {
          const endStr = projectEnd.toISOString().split('T')[0];
          return NextResponse.json(
            { error: `Task due date cannot be after project end date/deadline (${endStr}).` },
            { status: 400 }
          );
        }
      }
    }

    // 5. Update task
    const updatedCount = await updateTask(taskId, updates);
    if (updatedCount === 0) {
      return NextResponse.json(
        { message: 'No changes made or task not updated' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      message: 'Task updated successfully',
      updatedFields: updates,
    });
  } catch (error) {
    console.error('Update task endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Failed to update task.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { id: taskId } = await params;
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // 2. Fetch target task
    const task = await getTaskById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // 3. Retrieve task's associated project to check permissions
    const project = await getProjectById(task.project);
    if (!project) {
      return NextResponse.json(
        { error: 'Associated project not found' },
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
        { error: 'Forbidden. You do not have access to delete this task.' },
        { status: 403 }
      );
    }

    // 4. Delete task
    const deletedCount = await deleteTask(taskId);
    if (deletedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to delete task' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Failed to delete task.' },
      { status: 500 }
    );
  }
}
