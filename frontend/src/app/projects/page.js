// File: taskflow-cloud/frontend/src/app/projects/page.js
// Purpose: List all projects and allow creating new ones

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { projectAPI } from '@/lib/api';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  .projects-root * { font-family: 'Plus Jakarta Sans', sans-serif; }

  .panel {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 28px;
  }

  .btn-primary {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white; font-weight: 700; font-size: 13px;
    padding: 10px 20px; border-radius: 10px; border: none; cursor: pointer;
    transition: opacity 0.15s; box-shadow: 0 4px 14px rgba(59,130,246,0.3);
  }
  .btn-primary:hover { opacity: 0.88; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-ghost {
    display: inline-flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09);
    color: #94a3b8; font-size: 13px; font-weight: 500;
    padding: 10px 20px; border-radius: 10px; cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .btn-ghost:hover { background: rgba(255,255,255,0.09); color: #e2e8f0; }

  .form-input {
    width: 100%; background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09); border-radius: 10px;
    padding: 12px 14px; color: #e2e8f0; font-size: 14px;
    outline: none; transition: border-color 0.15s, box-shadow 0.15s;
    font-family: inherit; box-sizing: border-box;
  }
  .form-input:focus {
    border-color: rgba(59,130,246,0.5);
    box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
  }
  .form-input::placeholder { color: #475569; }

  .project-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 18px;
    padding: 22px;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    display: flex; flex-direction: column; justify-content: space-between;
    position: relative; overflow: hidden;
  }
  .project-card::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(135deg, rgba(59,130,246,0.04), transparent);
    opacity: 0;
    transition: opacity 0.18s;
    pointer-events: none;
    border-radius: 18px;
  }
  .project-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.5);
    border-color: rgba(59,130,246,0.25);
  }
  .project-card:hover::after { opacity: 1; }

  .badge-active {
    background: rgba(16,185,129,0.12); color: #34d399;
    border: 1px solid rgba(16,185,129,0.2);
    font-size: 11px; padding: 3px 10px; border-radius: 999px; font-weight: 700;
    letter-spacing: 0.04em;
  }
  .badge-inactive {
    background: rgba(255,255,255,0.05); color: #64748b;
    border: 1px solid rgba(255,255,255,0.07);
    font-size: 11px; padding: 3px 10px; border-radius: 999px; font-weight: 700;
    letter-spacing: 0.04em;
  }

  .delete-btn {
    font-size: 12px; font-weight: 600;
    color: #ef4444; background: transparent; border: none; cursor: pointer;
    padding: 4px 8px; border-radius: 6px;
    transition: background 0.12s;
  }
  .delete-btn:hover { background: rgba(239,68,68,0.1); }

  .empty-state {
    text-align: center; padding: 80px 20px;
    background: rgba(255,255,255,0.02);
    border: 1px dashed rgba(255,255,255,0.07); border-radius: 20px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
`;

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!Cookies.get('taskflow_token')) { router.push('/login'); return; }
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
    <div className="projects-root" style={{ minHeight: '100vh', background: '#0c0e16', color: '#e2e8f0' }}>
      <style>{styles}</style>
      <Navbar />
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }} />
              <p style={{ color: '#64748b', fontSize: '13px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Workspaces</p>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>Projects</h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: 4 }}>Manage your workspaces and start new projects quickly.</p>
          </div>
          <button className="btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? '✕ Close' : '+ New Project'}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="panel">
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>Create New Project</h2>
              <p style={{ color: '#64748b', fontSize: '13px', marginTop: 2 }}>Enter project details to get started quickly.</p>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input className="form-input" type="text" placeholder="Project name *"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} required />
                <textarea className="form-input" placeholder="Description (optional)"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  style={{ height: 100, resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn-primary" disabled={creating}>
                    {creating ? 'Creating…' : 'Create Project'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setShowCreateForm(false)}>Cancel</button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Projects grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px' }}>
            <div style={{
              width: 36, height: 36, border: '2px solid rgba(59,130,246,0.2)',
              borderTop: '2px solid #3b82f6', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
            }} />
            <p style={{ color: '#64748b', fontSize: '14px' }}>Loading projects…</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: '40px', marginBottom: 12 }}>🗂️</p>
            <p style={{ color: '#94a3b8', fontWeight: 700, fontSize: '17px' }}>No projects yet</p>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: 6, marginBottom: 20 }}>Click "New Project" to get started.</p>
            <button className="btn-primary" onClick={() => setShowCreateForm(true)}>+ Create First Project</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {projects.map((project) => (
              <div key={project.id} className="project-card" onClick={() => router.push(`/projects/${project.id}`)}>
                <div>
                  {/* Card top */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.15))',
                        border: '1px solid rgba(59,130,246,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                      }}>📌</div>
                      <h3 style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '15px', lineHeight: 1.3 }}>{project.name}</h3>
                    </div>
                    <span className={project.status === 'active' ? 'badge-active' : 'badge-inactive'} style={{ flexShrink: 0 }}>
                      {project.status}
                    </span>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.6, minHeight: 40, marginBottom: 16 }}>
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                {/* Card bottom */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '16px', fontWeight: 800, color: '#e2e8f0' }}>{project.task_count}</p>
                      <p style={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>Tasks</p>
                    </div>
                    <div style={{ width: 1, background: 'rgba(255,255,255,0.06)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '16px', fontWeight: 800, color: '#34d399' }}>{project.completed_count}</p>
                      <p style={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>Done</p>
                    </div>
                  </div>
                  <button className="delete-btn" onClick={(e) => handleDelete(project.id, e)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}