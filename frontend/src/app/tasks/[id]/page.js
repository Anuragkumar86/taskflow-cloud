// File: taskflow-cloud/frontend/src/app/tasks/[id]/page.js
// Purpose: View a single task with file uploads and comments

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { taskAPI, fileAPI, commentAPI } from '@/lib/api';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  .task-root * { font-family: 'Plus Jakarta Sans', sans-serif; }

  .panel {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 24px;
  }

  .status-badge {
    font-size: 11px; font-weight: 700; padding: 5px 12px;
    border-radius: 999px; letter-spacing: 0.04em; text-transform: capitalize;
  }
  .status-done       { background: rgba(16,185,129,0.12); color: #34d399; border: 1px solid rgba(16,185,129,0.2); }
  .status-inprogress { background: rgba(59,130,246,0.12); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); }
  .status-todo       { background: rgba(255,255,255,0.06); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); }

  .priority-badge {
    font-size: 11px; font-weight: 700; padding: 5px 12px;
    border-radius: 999px; letter-spacing: 0.04em; text-transform: capitalize;
  }
  .priority-high   { background: rgba(239,68,68,0.12); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
  .priority-medium { background: rgba(245,158,11,0.12); color: #fbbf24; border: 1px solid rgba(245,158,11,0.2); }
  .priority-low    { background: rgba(100,116,139,0.12); color: #94a3b8; border: 1px solid rgba(100,116,139,0.2); }

  /* Upload area */
  .upload-zone {
    border: 1.5px dashed rgba(255,255,255,0.12);
    border-radius: 12px;
    padding: 24px 16px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    background: rgba(255,255,255,0.02);
  }
  .upload-zone:hover {
    border-color: rgba(59,130,246,0.4);
    background: rgba(59,130,246,0.05);
  }

  .file-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 12px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    transition: background 0.12s, border-color 0.12s;
  }
  .file-item:hover {
    background: rgba(255,255,255,0.055);
    border-color: rgba(255,255,255,0.1);
  }

  .download-btn {
    font-size: 12px; font-weight: 600; cursor: pointer;
    color: #60a5fa; background: rgba(59,130,246,0.1);
    border: 1px solid rgba(59,130,246,0.18); padding: 4px 10px;
    border-radius: 7px; transition: background 0.12s;
  }
  .download-btn:hover { background: rgba(59,130,246,0.2); }

  /* Comments */
  .comment-bubble {
    background: rgba(255,255,255,0.035);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 12px 14px;
  }

  .comment-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 10px;
    padding: 12px 14px;
    color: #e2e8f0;
    font-size: 13px;
    outline: none;
    resize: none;
    height: 80px;
    transition: border-color 0.15s, box-shadow 0.15s;
    font-family: inherit;
    box-sizing: border-box;
  }
  .comment-input:focus {
    border-color: rgba(59,130,246,0.5);
    box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
  }
  .comment-input::placeholder { color: #475569; }

  .btn-primary {
    display: inline-flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white; font-weight: 700; font-size: 13px;
    padding: 9px 18px; border-radius: 10px; border: none; cursor: pointer;
    transition: opacity 0.15s; box-shadow: 0 4px 14px rgba(59,130,246,0.25);
  }
  .btn-primary:hover { opacity: 0.88; }
  .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  .back-btn {
    display: inline-flex; align-items: center; gap: 6px;
    color: #64748b; font-size: 13px; font-weight: 500;
    background: none; border: none; cursor: pointer; margin-bottom: 16px; padding: 0;
    transition: color 0.15s;
  }
  .back-btn:hover { color: #94a3b8; }

  .section-title {
    font-size: 14px; font-weight: 700; color: #e2e8f0;
    margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
`;

export default function TaskPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id;
  const fileInputRef = useRef(null);

  const [task, setTask] = useState(null);
  const [files, setFiles] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!Cookies.get('taskflow_token')) { router.push('/login'); return; }
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      const res = await taskAPI.getOne(taskId);
      setTask(res.data.data.task);
      setFiles(res.data.data.files);
      setComments(res.data.data.comments);
    } catch {
      toast.error('Task not found');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('task_id', taskId);
      await fileAPI.upload(formData);
      toast.success('File uploaded to S3!');
      loadTask();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (fileId, filename) => {
    try {
      const res = await fileAPI.getDownloadUrl(fileId);
      window.open(res.data.data.download_url, '_blank');
    } catch {
      toast.error('Download failed');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmittingComment(true);
    try {
      await commentAPI.add({ content: comment, task_id: taskId });
      setComment('');
      loadTask();
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0c0e16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 36, height: 36, border: '2px solid rgba(59,130,246,0.2)', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  const statusClass = task?.status === 'done' ? 'status-done' : task?.status === 'inprogress' ? 'status-inprogress' : 'status-todo';
  const priorityClass = `priority-${task?.priority}`;
  const statusLabel = task?.status === 'inprogress' ? 'In Progress' : task?.status === 'todo' ? 'To Do' : 'Done';

  return (
    <div className="task-root" style={{ minHeight: '100vh', background: '#0c0e16', color: '#e2e8f0' }}>
      <style>{styles}</style>
      <Navbar />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <button className="back-btn" onClick={() => router.back()}>← Back to Project</button>

        {/* Task Details */}
        <div className="panel">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                {task?.project_name}
              </p>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                {task?.title}
              </h1>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
              <span className={`priority-badge ${priorityClass}`}>{task?.priority}</span>
            </div>
          </div>

          {task?.description && (
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.7, marginBottom: 12 }}>
              {task.description}
            </p>
          )}

          {task?.deadline && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8, padding: '5px 12px', fontSize: '12px', color: '#64748b', fontWeight: 500
            }}>
              📅 Due {task.deadline?.split('T')[0]}
            </div>
          )}
        </div>

        {/* Two-column: Files + Comments */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

          {/* Files — AWS S3 */}
          <div className="panel">
            <div className="section-title">
              <span style={{
                width: 28, height: 28, borderRadius: 8, background: 'rgba(249,115,22,0.15)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
              }}>☁️</span>
              Files
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#64748b', fontWeight: 500 }}>AWS S3</span>
            </div>

            <div className="upload-zone" onClick={() => fileInputRef.current.click()}>
              <div style={{ fontSize: '24px', marginBottom: 8 }}>{uploading ? '⏳' : '⬆️'}</div>
              <p style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
                {uploading ? 'Uploading to S3…' : 'Click to upload file'}
              </p>
              <p style={{ color: '#475569', fontSize: '11px', marginTop: 4 }}>PDF, images, docs · Max 10MB</p>
            </div>
            <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden"
              style={{ display: 'none' }}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt" />

            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {files.length === 0 ? (
                <p style={{ color: '#475569', fontSize: '13px', textAlign: 'center', padding: '12px 0' }}>No files uploaded yet</p>
              ) : (
                files.map((file) => (
                  <div key={file.id} className="file-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
                      }}>📎</div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                          {file.original_name}
                        </p>
                        <p style={{ fontSize: '11px', color: '#475569', marginTop: 1 }}>
                          {(file.file_size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button className="download-btn" onClick={() => handleDownload(file.id, file.original_name)}>
                      ↓ Get
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="section-title">
              <span style={{
                width: 28, height: 28, borderRadius: 8, background: 'rgba(59,130,246,0.15)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
              }}>💬</span>
              Comments
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                {comments.length}
              </span>
            </div>

            {/* Comments list */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 260, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 0' }}>
                  <p style={{ fontSize: '24px', marginBottom: 6 }}>💭</p>
                  <p style={{ color: '#475569', fontSize: '13px' }}>No comments yet</p>
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="comment-bubble">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3))',
                        border: '1px solid rgba(59,130,246,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 700, color: '#93c5fd'
                      }}>
                        {c.user_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>{c.user_name}</p>
                      <p style={{ fontSize: '11px', color: '#475569', marginLeft: 'auto' }}>
                        {new Date(c.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>{c.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment form */}
            <form onSubmit={handleComment}>
              <textarea className="comment-input" value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment…" />
              <button type="submit" className="btn-primary" style={{ marginTop: 10 }}
                disabled={submittingComment || !comment.trim()}>
                {submittingComment ? 'Posting…' : 'Add Comment'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}