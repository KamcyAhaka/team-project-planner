import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/auth';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FolderKanban, CheckSquare, Users, Clock, ArrowRight } from 'lucide-react';

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header bar */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-primary/10">
            <Image
              src="/favicon.svg"
              alt="Logo"
              width={24}
              height={24}
              priority
              className="object-contain"
            />
          </div>
          <span className="font-extrabold text-base tracking-tight text-foreground">
            Team Planner
          </span>
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'font-semibold')}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/sign-in"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'font-semibold')}
              >
                Sign In
              </Link>
              <Link
                href="/auth/sign-up"
                className={cn(
                  buttonVariants({ variant: 'default', size: 'sm' }),
                  'font-semibold bg-primary hover:bg-primary-hover text-white shadow-xs'
                )}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-20 md:py-28 text-center max-w-5xl mx-auto space-y-12">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            <FolderKanban className="w-3.5 h-3.5" />
            Collaboration Hub
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] max-w-4xl">
            Organize, Assign, and Track Your{' '}
            <span className="text-primary bg-linear-to-r from-primary to-primary-hover bg-clip-text">
              Group Projects
            </span>{' '}
            in One Place
          </h1>

          <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A lightweight, collaborative project management planner designed for student teams. Keep
            track of tasks, assign ownership, monitor upcoming deadlines, and visualize progress in
            real-time.
          </p>
        </div>

        {/* Call to action buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: 'default', size: 'lg' }),
                'w-full sm:w-auto font-bold bg-primary hover:bg-primary-hover text-white px-8 py-6 rounded-xl text-base shadow-lg shadow-primary/20 flex items-center gap-2 group cursor-pointer'
              )}
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <>
              <Link
                href="/auth/sign-up"
                className={cn(
                  buttonVariants({ variant: 'default', size: 'lg' }),
                  'w-full sm:w-auto font-bold bg-primary hover:bg-primary-hover text-white px-8 py-6 rounded-xl text-base shadow-lg shadow-primary/20 flex items-center gap-2 group cursor-pointer'
                )}
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/auth/sign-in"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'w-full sm:w-auto font-bold px-8 py-6 rounded-xl text-base cursor-pointer'
                )}
              >
                Sign In to Workspace
              </Link>
            </>
          )}
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 w-full text-left">
          {/* Feature 1 */}
          <div className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4 hover:border-border/80 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-foreground">Task Accountability</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Create tasks with due dates, assign team owners, and transition states through To
                Do, In Progress, and Done.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4 hover:border-border/80 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
              <Users className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-foreground">Team Collaboration</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Invite members to your project workspace. See who is working on what task and track
                active contributions.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4 hover:border-border/80 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-foreground">Urgent Alert Warning</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Get visual indicators on your dashboard for tasks approaching deadlines in 48 hours
                or overdue tasks.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/40 py-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Team Project Planner. Built for collaborative student
        teams.
      </footer>
    </div>
  );
}
