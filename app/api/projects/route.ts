import { auth } from '@/auth';
import { createProject, getUserProjects } from '@/models/project';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { startDate, endDate } = body;

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return NextResponse.json(
        { error: 'End date / deadline cannot be before the start date.' },
        { status: 400 }
      );
    }

    const projectData = {
      ...body,
      ownerId: session.user.id,
      admin: session.user.id,
    };
    const project = await createProject(projectData);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || session?.user?.id;
  const userEmail = session?.user?.email;

  if (!userId) {
    return NextResponse.json({ error: 'User identification required' }, { status: 400 });
  }

  try {
    const projects = await getUserProjects(userId, userEmail);
    return NextResponse.json(projects, { status: 200 });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
