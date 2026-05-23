// File: taskflow-cloud/frontend/src/app/projects/page.js
// Purpose: List all projects and allow creating new ones

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { projectAPI } from '@/lib/api';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!Cookies.get('taskflow_token')) {
      router.push('/login');
      return;
    }
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await projectAPI.getAll();
      setProjects(res.data.data.projects);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await projectAPI.create(newProject);
      toast.success('Project created!');
      setNewProject({ name: '', description: '' });
      setShowCreateForm(false);
      loadProjects();
    } catch {
      toast.error('Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await projectAPI.delete(id);
      toast.success('Project deleted');
      loadProjects();
    } catch {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your workspaces and start new projects quickly.</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + New Project
          </button>
        </div>

        {/* Create Project Form */}
        {showCreateForm && (
          <form onSubmit={handleCreate} className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/30 mb-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Create New Project</h2>
                <p className="text-sm text-slate-500">Enter project details to get started quickly.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Project name *"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <textarea
                placeholder="Description (optional)"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-28 resize-none"
              />
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={creating}
                  className="inline-flex min-w-40 items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
                <button type="button" onClick={() => setShowCreateForm(false)}
                  className="inline-flex min-w-30 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Projects Grid */}
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-slate-500">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-900">No projects yet.</p>
            <p className="mt-2 text-sm text-slate-500">Click "New Project" to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      project.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-slate-500 mb-5 min-h-13">
                    {project.description || 'No description'}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{project.task_count} tasks · {project.completed_count} done</span>
                  <button
                    onClick={(e) => handleDelete(project.id, e)}
                    className="rounded-full px-2 py-1 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}