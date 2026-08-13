import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getProjectById, deleteProject } from '@/models/project';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const currentUserIdStr = session.user.id.toString();

    // 2. Validate params
    const { id: projectId } = await params;
    if (!projectId || !ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID format.' },
        { status: 400 }
      );
    }

    // 3. Retrieve project
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found.' },
        { status: 404 }
      );
    }

    // 4. Verify authorization (only owner can delete the project)
    const ownerIdStr = project.ownerId?.toString();
    if (ownerIdStr !== currentUserIdStr) {
      return NextResponse.json(
        { error: 'Forbidden. Only the project owner can delete this project.' },
        { status: 403 }
      );
    }

    // 5. Delete project document
    const success = await deleteProject(projectId);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete project.' },
        { status: 400 }
      );
    }

    // 6. Delete all tasks associated with this project to prevent orphan data
    const db = await getDb();
    await db.collection('tasks').deleteMany({ project: projectId });

    return NextResponse.json({
      message: 'Project deleted successfully.',
    });
  } catch (error) {
    console.error('Delete project endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Failed to delete project.' },
      { status: 500 }
    );
  }
}
