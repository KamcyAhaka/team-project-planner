import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { DashboardSidebar, DashboardHeader } from '@/components/dashboard-nav';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export async function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const session = await auth();

  // Enforce session check
  if (!session || !session.user) {
    redirect('/auth/sign-in');
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    displayName: session.user.displayName,
    profilePictureURL: session.user.profilePictureURL,
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <DashboardSidebar user={user} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header */}
        <DashboardHeader user={user} />

        {/* Scrollable Page Wrapper */}
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
