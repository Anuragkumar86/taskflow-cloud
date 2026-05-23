// File: taskflow-cloud/frontend/src/app/dashboard/page.js
// Purpose: Main dashboard showing stats and recent projects

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { dashboardAPI, projectAPI } from '@/lib/api';

// Stats card component
function StatCard({ label, value, color }) {
  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${color}`}>
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = Cookies.get('taskflow_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Load dashboard data
    const loadData = async () => {
      try {
        const [statsRes, projectsRes] = await Promise.all([
          dashboardAPI.getStats(),
          projectAPI.getAll(),
        ]);
        setStats(statsRes.data.data);
        setProjects(projectsRes.data.data.projects.slice(0, 4)); // Show latest 4
      } catch (err) {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-sm text-slate-500">Overview of your projects and task progress.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Projects" value={stats?.total_projects || 0} color="border-blue-500" />
          <StatCard label="Total Tasks" value={stats?.total_tasks || 0} color="border-purple-500" />
          <StatCard label="Completed Tasks" value={stats?.completed_tasks || 0} color="border-green-500" />
          <StatCard label="Pending Tasks" value={stats?.pending_tasks || 0} color="border-yellow-500" />
        </div>

        {/* Recent Projects */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Projects</h2>
            <button
              onClick={() => router.push('/projects')}
              className="text-blue-600 text-sm font-semibold transition hover:text-blue-700"
            >
              View all
            </button>
          </div>

          {projects.length === 0 ? (
            <p className="text-gray-500 text-sm">No projects yet. Create your first project!</p>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div>
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="text-xs text-gray-500">{project.task_count} tasks · {project.completed_count} done</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    project.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {project.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}