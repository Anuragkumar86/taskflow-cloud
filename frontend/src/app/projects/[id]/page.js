// File: taskflow-cloud/frontend/src/app/projects/[id]/page.js
// Purpose: Show a single project with its tasks and allow task management

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { projectAPI, taskAPI } from '@/lib/api';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  .proj-root * { font-family: 'Plus Jakarta Sans', sans-serif; }

  .panel {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 28px;
  }

  .btn-primary {
    display: inline-flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white; font-weight: 700; font-size: 13px;
    padding: 10px 20px; border-radius: 10px; border: none; cursor: pointer;
    transition: opacity 0.15s; box-shadow: 0 4px 14px rgba(59,130,246,0.3);
    gap: 6px;
  }
  .btn-primary:hover { opacity: 0.88; }

  .btn-ghost {
    display: inline-flex; align-items: center;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.09);
    color: #94a3b8; font-size: 13px; font-weight: 500;
    padding: 9px 16px; border-radius: 10px; cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .btn-ghost:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.15); color: #e2e8f0; }

  .back-btn {
    display: inline-flex; align-items: center; gap: 6px;
    color: #64748b; font-size: 13px; font-weight: 500;
    background: none; border: none; cursor: pointer;
    margin-bottom: 16px; padding: 0;
    transition: color 0.15s;
  }
  .back-btn:hover { color: #94a3b8; }

  /* Task form */
  .task-form-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 10px;
    padding: 12px 14px;
    color: #e2e8f0;
    font-size: 14px;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    font-family: inherit;
    box-sizing: border-box;
  }
  .task-form-input:focus {
    border-color: rgba(59,130,246,0.5);
    box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
  }
  .task-form-input::placeholder { color: #475569; }
  .task-form-input option { background: #1e2130; }

  /* Kanban columns */
  .kanban-col {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 18px;
    padding: 16px;
    min-height: 300px;
  }

  .col-header-todo    { border-top: 2px solid #64748b; border-radius: 18px 18px 0 0; }
  .col-header-inprogress { border-top: 2px solid #3b82f6; border-radius: 18px 18px 0 0; }
  .col-header-done    { border-top: 2px solid #10b981; border-radius: 18px 18px 0 0; }

  .col-count {
    display: inline-flex; align-items: center; justify-content: center;
    width: 24px; height: 24px; border-radius: 7px;
    font-size: 12px; font-weight: 700;
  }
  .col-count.todo       { background: rgba(100,116,139,0.2); color: #94a3b8; }
  .col-count.inprogress { background: rgba(59,130,246,0.2); color: #60a5fa; }
  .col-count.done       { background: rgba(16,185,129,0.2); color: #34d399; }

  /* Task cards */
  .task-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 14px;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease;
  }
  .task-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    border-color: rgba(59,130,246,0.25);
    background: rgba(59,130,246,0.05);
  }

  .priority-badge {
    font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
    text-transform: uppercase; padding: 3px 8px; border-radius: 6px;
  }
  .priority-high   { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
  .priority-medium { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.2); }
  .priority-low    { background: rgba(100,116,139,0.15); color: #94a3b8; border: 1px solid rgba(100,116,139,0.2); }

  .move-btn {
    font-size: 11px; font-weight: 600;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
    color: #94a3b8; padding: 4px 10px; border-radius: 7px; cursor: pointer;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  .move-btn:hover { background: rgba(59,130,246,0.12); color: #60a5fa; border-color: rgba(59,130,246,0.25); }

  .empty-col {
    border: 1px dashed rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    color: #475569;
    font-size: 13px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
`;

const STATUS_COLUMNS = [
  { key: 'todo',       label: 'To Do',       dot: '#64748b' },
  { key: 'inprogress', label: 'In Progress',  dot: '#3b82f6' },
  { key: 'done',       label: 'Done',         dot: '#10b981' },
];

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
    if (!Cookies.get('taskflow_token')) { router.push('/login'); return; }
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

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0c0e16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 36, height: 36, border: '2px solid rgba(59,130,246,0.2)', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  const tasksByStatus = (status) => tasks.filter((t) => t.status === status);

  return (
    <div className="proj-root" style={{ minHeight: '100vh', background: '#0c0e16', color: '#e2e8f0' }}>
      <style>{styles}</style>
      <Navbar />
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Project Header */}
        <div className="panel">
          <button className="back-btn" onClick={() => router.back()}>← Back</button>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: 8 }}>
                {project?.name}
              </h1>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
                {project?.description || 'Manage tasks and track progress for this project.'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
              <div style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: '6px 14px', fontSize: '13px', color: '#94a3b8', fontWeight: 600
              }}>
                {tasks.length} total tasks
              </div>
              <button className="btn-primary" onClick={() => setShowTaskForm(!showTaskForm)}>
                {showTaskForm ? '✕ Close' : '+ Add Task'}
              </button>
            </div>
          </div>
        </div>

        {/* Create Task Form */}
        {showTaskForm && (
          <div className="panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>New Task</h3>
                <p style={{ color: '#64748b', fontSize: '13px', marginTop: 2 }}>Add a task to the board with priority and deadline.</p>
              </div>
            </div>
            <form onSubmit={handleCreateTask}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <input className="task-form-input" type="text" placeholder="Task title *" required
                  value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
                <select className="task-form-input" value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <input className="task-form-input" type="text" placeholder="Description"
                  value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
                <input className="task-form-input" type="date" value={newTask.deadline}
                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button type="submit" className="btn-primary">Create Task</button>
                <button type="button" className="btn-ghost" onClick={() => setShowTaskForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Kanban Board */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {STATUS_COLUMNS.map((col) => {
            const colTasks = tasksByStatus(col.key);
            return (
              <div key={col.key} className={`kanban-col col-header-${col.key}`}>
                {/* Column header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.dot, boxShadow: `0 0 8px ${col.dot}` }} />
                    <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '14px' }}>{col.label}</span>
                  </div>
                  <span className={`col-count ${col.key}`}>{colTasks.length}</span>
                </div>

                {/* Task cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {colTasks.length === 0 ? (
                    <div className="empty-col">No tasks here yet</div>
                  ) : (
                    colTasks.map((task) => (
                      <div key={task.id} className="task-card" onClick={() => router.push(`/tasks/${task.id}`)}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                          <p style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '14px', lineHeight: 1.4, flex: 1 }}>{task.title}</p>
                          <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
                        </div>
                        <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.5, minHeight: 36, marginBottom: 12 }}>
                          {task.description || 'No description added.'}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          {task.deadline && (
                            <span style={{ fontSize: '11px', color: '#475569', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                              📅 {task.deadline?.split('T')[0]}
                            </span>
                          )}
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 'auto' }}>
                            {STATUS_COLUMNS.filter((s) => s.key !== col.key).map((s) => (
                              <button key={s.key} className="move-btn"
                                onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, s.key); }}>
                                → {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}