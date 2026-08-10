import { createProject, getUserProjects } from '@/models/project';

export async function POST(req: Request) {
  const body = await req.json();
  const project = await createProject(body);
  return new Response(JSON.stringify(project), { status: 201 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId')!;
  const projects = await getUserProjects(userId);
  return new Response(JSON.stringify(projects), { status: 200 });
}
