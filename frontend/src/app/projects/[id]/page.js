// File: taskflow-cloud/frontend/src/app/projects/[id]/page.js
// Purpose: Show a single project with its tasks and allow task management
// [id] is a dynamic segment — Next.js replaces it with the actual project ID

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { projectAPI, taskAPI } from '@/lib/api';

const STATUS_COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'bg-gray-100' },
  { key: 'inprogress', label: 'In Progress', color: 'bg-blue-100' },
  { key: 'done', label: 'Done', color: 'bg-green-100' },
];

const PRIORITY_COLORS = {
  low: 'text-gray-500',
  medium: 'text-yellow-600',
  high: 'text-red-500',
};

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id;

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', deadline: '' });

  useEffect(() => {
    if (!Cookies.get('taskflow_token')) {
      router.push('/login');
      return;
    }
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const res = await projectAPI.getOne(projectId);
      setProject(res.data.data.project);
      setTasks(res.data.data.tasks);
    } catch {
      toast.error('Project not found');
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await taskAPI.create({ ...newTask, project_id: projectId });
      toast.success('Task created!');
      setNewTask({ title: '', description: '', priority: 'medium', deadline: '' });
      setShowTaskForm(false);
      loadProject();
    } catch {
      toast.error('Failed to create task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskAPI.update(taskId, { status: newStatus });
      toast.success('Status updated!');
      loadProject();
    } catch {
      toast.error('Failed to update task');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;

  const tasksByStatus = (status) => tasks.filter((t) => t.status === status);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700 text-sm mb-2 inline-flex items-center gap-1">← Back</button>
              <h1 className="text-3xl font-bold text-slate-900">{project?.name}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{project?.description || 'Manage tasks and progress for this project.'}</p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{tasks.length} total tasks</span>
              <button
                onClick={() => setShowTaskForm(!showTaskForm)}
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                + Add Task
              </button>
            </div>
          </div>
        </div>

        {/* Create Task Form */}
        {showTaskForm && (
          <form onSubmit={handleCreateTask} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">New Task</h3>
                <p className="text-sm text-slate-500">Add a new task to the board with priority and deadline.</p>
              </div>
              <button type="button" onClick={() => setShowTaskForm(false)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <input type="text" placeholder="Task title *" required value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              <select value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <input type="text" placeholder="Description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              <input type="date" value={newTask.deadline}
                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="submit" className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                Create Task
              </button>
              <button type="button" onClick={() => setShowTaskForm(false)}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-700 transition hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Kanban Board */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {STATUS_COLUMNS.map((col) => (
            <div key={col.key} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{col.label}</h3>
                  <p className="text-sm text-slate-500">{tasksByStatus(col.key).length} tasks</p>
                </div>
                <span className="h-10 w-10 rounded-2xl bg-white/80 text-center text-sm font-semibold text-slate-700 leading-10 shadow-sm">
                  {tasksByStatus(col.key).length}
                </span>
              </div>
              <div className="space-y-3">
                {tasksByStatus(col.key).map((task) => (
                  <div
                    key={task.id}
                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                    onClick={() => router.push(`/tasks/${task.id}`)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500 min-h-12">{task.description || 'No description added yet.'}</p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      {task.deadline && (
                        <span className="text-xs text-slate-400">Due: {task.deadline?.split('T')[0]}</span>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {STATUS_COLUMNS.filter((s) => s.key !== col.key).map((s) => (
                          <button
                            key={s.key}
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, s.key); }}
                            className="rounded-2xl bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                          >
                            Move to {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {tasksByStatus(col.key).length === 0 && (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-500">
                    No tasks in this column yet.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}