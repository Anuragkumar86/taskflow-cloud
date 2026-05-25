// File: taskflow-cloud/frontend/src/app/dashboard/page.js
// Purpose: Main dashboard showing stats and recent projects

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { dashboardAPI, projectAPI } from '@/lib/api';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .dash-root * { font-family: 'Plus Jakarta Sans', sans-serif; }

  .stat-card {
    position: relative;
    overflow: hidden;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 24px;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .stat-card:hover {
    transform: translateY(-2px);
    border-color: rgba(255,255,255,0.13);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }
  .stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    border-radius: 16px 16px 0 0;
  }
  .stat-card.blue::before  { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
  .stat-card.purple::before { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
  .stat-card.green::before  { background: linear-gradient(90deg, #10b981, #34d399); }
  .stat-card.amber::before  { background: linear-gradient(90deg, #f59e0b, #fbbf24); }

  .stat-glow.blue  { color: #60a5fa; }
  .stat-glow.purple { color: #a78bfa; }
  .stat-glow.green  { color: #34d399; }
  .stat-glow.amber  { color: #fbbf24; }

  .project-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.05);
    background: rgba(255,255,255,0.02);
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  }
  .project-row:hover {
    background: rgba(59,130,246,0.08);
    border-color: rgba(59,130,246,0.25);
    transform: translateX(3px);
  }

  .badge-active {
    background: rgba(16,185,129,0.15);
    color: #34d399;
    border: 1px solid rgba(16,185,129,0.2);
    font-size: 11px;
    padding: 3px 10px;
    border-radius: 999px;
    font-weight: 600;
    letter-spacing: 0.03em;
  }
  .badge-inactive {
    background: rgba(255,255,255,0.06);
    color: #94a3b8;
    border: 1px solid rgba(255,255,255,0.08);
    font-size: 11px;
    padding: 3px 10px;
    border-radius: 999px;
    font-weight: 600;
    letter-spacing: 0.03em;
  }

  .view-all-btn {
    font-size: 13px;
    font-weight: 600;
    color: #60a5fa;
    background: rgba(59,130,246,0.1);
    border: 1px solid rgba(59,130,246,0.2);
    padding: 6px 14px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .view-all-btn:hover {
    background: rgba(59,130,246,0.18);
    border-color: rgba(59,130,246,0.4);
  }

  .panel {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 28px;
  }

  .icon-orb {
    width: 40px; height: 40px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }
  .icon-orb.blue   { background: rgba(59,130,246,0.15); }
  .icon-orb.purple { background: rgba(139,92,246,0.15); }
  .icon-orb.green  { background: rgba(16,185,129,0.15); }
  .icon-orb.amber  { background: rgba(245,158,11,0.15); }
`;

function StatCard({ label, value, color, icon }) {
  return (
    <div className={`stat-card ${color}`}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500, marginBottom: 10 }}>{label}</p>
          <p className={`stat-glow ${color}`} style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1 }}>{value}</p>
        </div>
        <div className={`icon-orb ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('taskflow_token');
    if (!token) { router.push('/login'); return; }

    const loadData = async () => {
      try {
        const [statsRes, projectsRes] = await Promise.all([
          dashboardAPI.getStats(),
          projectAPI.getAll(),
        ]);
        setStats(statsRes.data.data);
        setProjects(projectsRes.data.data.projects.slice(0, 4));
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
      <div style={{ minHeight: '100vh', background: '#0c0e16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{styles}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: '2px solid rgba(59,130,246,0.3)',
            borderTop: '2px solid #3b82f6', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#64748b', fontSize: '14px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-root" style={{ minHeight: '100vh', background: '#0c0e16', color: '#e2e8f0' }}>
      <style>{styles}</style>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Header */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: '#3b82f6',
              boxShadow: '0 0 10px #3b82f6'
            }} />
            <p style={{ color: '#64748b', fontSize: '13px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Overview</p>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: 4 }}>Track your projects and task progress at a glance.</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <StatCard label="Total Projects" value={stats?.total_projects ?? 0} color="blue"   icon="📁" />
          <StatCard label="Total Tasks"    value={stats?.total_tasks ?? 0}    color="purple" icon="📋" />
          <StatCard label="Completed"      value={stats?.completed_tasks ?? 0} color="green" icon="✅" />
          <StatCard label="Pending"        value={stats?.pending_tasks ?? 0}   color="amber" icon="⏳" />
        </div>

        {/* Recent Projects */}
        <div className="panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>Recent Projects</h2>
              <p style={{ color: '#64748b', fontSize: '13px', marginTop: 2 }}>Your 4 most recent workspaces</p>
            </div>
            <button className="view-all-btn" onClick={() => router.push('/projects')}>View all →</button>
          </div>

          {projects.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px 20px',
              border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 12
            }}>
              <p style={{ fontSize: '28px', marginBottom: 8 }}>🗂️</p>
              <p style={{ color: '#64748b', fontSize: '14px' }}>No projects yet. Create your first one!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.map((project) => (
                <div key={project.id} className="project-row" onClick={() => router.push(`/projects/${project.id}`)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
                      border: '1px solid rgba(59,130,246,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '15px'
                    }}>📌</div>
                    <div>
                      <p style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '14px' }}>{project.name}</p>
                      <p style={{ color: '#64748b', fontSize: '12px', marginTop: 1 }}>
                        {project.task_count} tasks · {project.completed_count} completed
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={project.status === 'active' ? 'badge-active' : 'badge-inactive'}>
                      {project.status}
                    </span>
                    <span style={{ color: '#475569', fontSize: '16px' }}>›</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}