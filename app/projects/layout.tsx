import { WorkspaceLayout } from '@/components/workspace-layout';

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkspaceLayout>{children}</WorkspaceLayout>;
}
