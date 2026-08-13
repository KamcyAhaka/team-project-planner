import { WorkspaceLayout } from '@/components/workspace-layout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkspaceLayout>{children}</WorkspaceLayout>;
}
