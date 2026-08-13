'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, FolderKanban, Plus, ArrowRight, Calendar, CheckSquare } from 'lucide-react';
import Image from 'next/image';

interface Member {
  id: string;
  name: string;
  email: string;
  profilePictureURL?: string;
  role: 'owner' | 'member';
}

interface ProjectData {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  progress: number;
  totalTasksCount: number;
  completedTasksCount: number;
  membersList: Member[];
}

interface ProjectsClientProps {
  initialProjects: ProjectData[];
}

const statusFilters = [
  { value: 'all', label: 'All Projects' },
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

export function ProjectsClient({ initialProjects }: ProjectsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredProjects = initialProjects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || 
      project.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20';
      case 'active':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
      case 'planning':
      default:
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'No date set';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Upper Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-muted/60 dark:bg-muted/30 rounded-xl border border-border/60">
          {statusFilters.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedStatus === tab.value
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Create actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border/80 rounded-xl text-sm outline-hidden focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all placeholder:text-muted-foreground"
            />
          </div>
          <Link
            href="/projects/create"
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-xl shadow-md shadow-primary/15 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="group flex flex-col bg-card border border-border/70 hover:border-primary/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg shadow-sm"
            >
              {/* Header: Title & Badge */}
              <div className="flex justify-between items-start gap-4 mb-3">
                <h3 className="font-extrabold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {project.name}
                </h3>
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider uppercase rounded-full border ${getStatusStyle(
                    project.status
                  )}`}
                >
                  {project.status}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-1">
                {project.description || 'No description provided.'}
              </p>

              {/* Stats & Progress Section */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                {/* Date range */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground/80" />
                  <span>
                    {formatDate(project.startDate)} – {formatDate(project.endDate)}
                  </span>
                </div>

                {/* Task completion progress details */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5" />
                      Tasks progress
                    </span>
                    <span className="font-bold text-foreground">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-muted/60 dark:bg-muted/30 rounded-full h-2 overflow-hidden border border-border/10">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        project.status.toLowerCase() === 'completed'
                          ? 'bg-violet-500'
                          : project.status.toLowerCase() === 'active'
                          ? 'bg-emerald-500'
                          : 'bg-primary'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-muted-foreground/80 text-right">
                    {project.completedTasksCount} / {project.totalTasksCount} completed
                  </div>
                </div>

                {/* Team Members List */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex -space-x-2.5 overflow-hidden">
                    {project.membersList.slice(0, 4).map((member) => (
                      <div
                        key={member.id}
                        title={`${member.name} (${member.role})`}
                        className="relative w-8 h-8 rounded-full bg-primary/10 border-2 border-card text-primary text-xs font-extrabold uppercase flex items-center justify-center cursor-help shrink-0 shadow-xs"
                      >
                        {member.profilePictureURL ? (
                          <Image
                            src={member.profilePictureURL}
                            alt={member.name}
                            width={32}
                            height={32}
                            className="rounded-full object-cover w-full h-full"
                          />
                        ) : (
                          member.name.slice(0, 2)
                        )}
                      </div>
                    ))}
                    {project.membersList.length > 4 && (
                      <div className="w-8 h-8 rounded-full bg-muted border-2 border-card text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                        +{project.membersList.length - 4}
                      </div>
                    )}
                  </div>

                  {/* Open Link */}
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-1 text-xs font-bold text-primary group-hover:text-primary-hover hover:underline transition-colors cursor-pointer"
                  >
                    Details
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center text-center p-12 bg-card border border-dashed border-border/80 rounded-2xl space-y-5 shadow-xs max-w-xl mx-auto mt-8 animate-in fade-in duration-700">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
            <FolderKanban className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-lg text-foreground">No projects found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchQuery || selectedStatus !== 'all'
                ? 'Try adjusting your search query or filters to find what you are looking for.'
                : 'Create your first project to invite team members and start planning tasks together.'}
            </p>
          </div>
          <Link
            href="/projects/create"
            className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-xl shadow-md shadow-primary/15 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Create your first project
          </Link>
        </div>
      )}
    </div>
  );
}
