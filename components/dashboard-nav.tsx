'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, FolderKanban, User, Settings, LogOut, Menu, X, Plus } from 'lucide-react';
import Image from 'next/image';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface DashboardNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    displayName?: string | null;
    profilePictureURL?: string | null;
  };
}

export function DashboardSidebar({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const userDisplayName = user.displayName || user.name || user.email?.split('@')[0] || 'User';

  return (
    <>
      {/* Mobile Top Navbar */}
      <header className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-border bg-card sticky top-0 z-40">
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
          <span className="font-semibold text-lg tracking-tight text-foreground">Planner</span>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-muted text-muted-foreground focus:outline-hidden cursor-pointer"
          aria-label="Toggle sidebar"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:sticky lg:h-screen`}
      >
        {/* Brand / Logo */}
        <div className="hidden lg:flex items-center gap-3 px-6 py-6 border-b border-border select-none">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-primary/10 hover:scale-105 transition-transform">
            <Image
              src="/favicon.svg"
              alt="Logo"
              width={32}
              height={32}
              priority
              className="object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-foreground leading-tight">
              Team Planner
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">COLLABORATIVE HUB</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/15'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Quick Actions (Create Project) */}
        <div className="px-4 py-4 border-t border-border/60">
          <Link
            href="/projects/create"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs font-bold text-primary border border-dashed border-primary hover:bg-primary/5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </Link>
        </div>

        {/* User Profile Card & Sign-Out */}
        <div className="p-4 border-t border-border flex flex-col gap-3 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm uppercase shadow-xs">
              {user.profilePictureURL ? (
                <Image
                  src={user.profilePictureURL}
                  alt={userDisplayName}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                userDisplayName.slice(0, 2)
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-foreground truncate max-w-32.5">
                {userDisplayName}
              </span>
              <span className="text-[11px] text-muted-foreground truncate max-w-32.5">
                {user.email}
              </span>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/auth/sign-in' })}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors w-full cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

export function DashboardHeader({ user }: DashboardNavProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname.startsWith('/projects')) {
      if (pathname.includes('/create')) return 'Create Project';
      return 'Projects';
    }
    if (pathname.startsWith('/profile')) return 'My Profile';
    if (pathname.startsWith('/settings')) return 'Settings';
    return 'Team Planner';
  };

  const userDisplayName = user.displayName || user.name || user.email?.split('@')[0] || 'User';

  return (
    <header className="hidden lg:flex items-center justify-between px-8 py-5 border-b border-border bg-card sticky top-0 z-30">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold tracking-tight text-foreground">{getPageTitle()}</h1>
        <span className="text-xs text-muted-foreground font-medium mt-0.5">
          Welcome back to your workspace!
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3.5 px-3 py-1.5 rounded-lg border border-border bg-muted/30">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
            {user.profilePictureURL ? (
              <Image
                src={user.profilePictureURL}
                alt={userDisplayName}
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
            ) : (
              userDisplayName.slice(0, 2)
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground leading-tight">
              {userDisplayName}
            </span>
            <span className="text-[10px] text-muted-foreground">{user.email}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
