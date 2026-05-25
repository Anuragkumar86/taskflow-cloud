// File: taskflow-cloud/frontend/src/app/files/page.js
// Purpose: Dedicated page showing all files uploaded to AWS S3

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { fileAPI } from '@/lib/api';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .files-root * { font-family: 'Plus Jakarta Sans', sans-serif; }

  .panel {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 28px;
  }

  .s3-badge {
    background: linear-gradient(135deg, rgba(249,115,22,0.12), rgba(234,88,12,0.08));
    border: 1px solid rgba(249,115,22,0.25);
    border-radius: 14px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .file-table-wrap {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    overflow: hidden;
  }

  .file-table-head {
    background: rgba(255,255,255,0.04);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .file-table-head th {
    text-align: left;
    padding: 12px 18px;
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  .file-row td {
    padding: 14px 18px;
    font-size: 13px;
    color: #cbd5e1;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    vertical-align: middle;
  }

  .file-row:last-child td { border-bottom: none; }

  .file-row:hover td { background: rgba(255,255,255,0.025); }

  .btn-download {
    font-size: 12px;
    font-weight: 600;
    background: rgba(59,130,246,0.12);
    color: #60a5fa;
    border: 1px solid rgba(59,130,246,0.2);
    padding: 5px 12px;
    border-radius: 7px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .btn-download:hover {
    background: rgba(59,130,246,0.22);
    border-color: rgba(59,130,246,0.4);
  }

  .btn-delete {
    font-size: 12px;
    font-weight: 600;
    background: rgba(239,68,68,0.1);
    color: #f87171;
    border: 1px solid rgba(239,68,68,0.18);
    padding: 5px 12px;
    border-radius: 7px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .btn-delete:hover {
    background: rgba(239,68,68,0.2);
    border-color: rgba(239,68,68,0.35);
  }

  .empty-state {
    text-align: center;
    padding: 64px 20px;
    background: rgba(255,255,255,0.02);
    border: 1px dashed rgba(255,255,255,0.07);
    border-radius: 16px;
  }

  .count-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    padding: 10px 16px;
    font-size: 13px;
    color: #94a3b8;
  }

  .btn-primary {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    font-weight: 600;
    font-size: 13px;
    padding: 10px 20px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    transition: opacity 0.15s;
    box-shadow: 0 4px 14px rgba(59,130,246,0.3);
  }
  .btn-primary:hover { opacity: 0.88; }

  @keyframes spin { to { transform: rotate(360deg); } }
`;

function FileIcon({ mimeType }) {
  if (mimeType?.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType?.includes('word')) return '📝';
  return '📎';
}

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesPage() {
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Cookies.get('taskflow_token')) { router.push('/login'); return; }
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const res = await fileAPI.getMyFiles();
      setFiles(res.data.data.files);
    } catch {
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId, originalName) => {
    try {
      const res = await fileAPI.getDownloadUrl(fileId);
      window.open(res.data.data.download_url, '_blank');
      toast.success('Download started!');
    } catch {
      toast.error('Failed to get download link');
    }
  };

  const handleDelete = async (fileId) => {
    if (!confirm('Delete this file from S3? This cannot be undone.')) return;
    try {
      await fileAPI.deleteFile(fileId);
      toast.success('File deleted from S3');
      loadFiles();
    } catch {
      toast.error('Failed to delete file');
    }
  };

  return (
    <div className="files-root" style={{ minHeight: '100vh', background: '#0c0e16', color: '#e2e8f0' }}>
      <style>{styles}</style>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316', boxShadow: '0 0 10px #f97316' }} />
            <p style={{ color: '#64748b', fontSize: '13px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Storage</p>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>Files</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: 4 }}>All your uploaded assets, stored securely in AWS S3.</p>
        </div>

        {/* S3 Info Badge */}
        <div className="s3-badge">
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
          }}>☁️</div>
          <div>
            <p style={{ fontWeight: 700, color: '#fb923c', fontSize: '14px' }}>Connected to AWS S3</p>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: 2 }}>
              Files are encrypted at rest (AES-256). Download links are temporary signed URLs — valid for 1 hour.
            </p>
          </div>
        </div>

        {/* File count */}
        <div className="count-chip" style={{ alignSelf: 'flex-start' }}>
          <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{files.length}</span>
          <span>file{files.length !== 1 ? 's' : ''} stored</span>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px' }}>
            <div style={{
              width: 36, height: 36, border: '2px solid rgba(249,115,22,0.2)',
              borderTop: '2px solid #f97316', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
            }} />
            <p style={{ color: '#64748b', fontSize: '14px' }}>Loading files from S3…</p>
          </div>
        ) : files.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: '40px', marginBottom: 12 }}>📁</p>
            <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: '16px' }}>No files uploaded yet</p>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: 6, marginBottom: 20 }}>
              Go to any task and upload a file to see it here.
            </p>
            <button className="btn-primary" onClick={() => router.push('/projects')}>Go to Projects</button>
          </div>
        ) : (
          <div className="file-table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead className="file-table-head">
                <tr>
                  <th>File</th>
                  <th>Task</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id} className="file-row">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 9,
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '16px', flexShrink: 0
                        }}>
                          <FileIcon mimeType={file.mime_type} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '13px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.original_name}
                          </p>
                          <p style={{ color: '#475569', fontSize: '11px', marginTop: 1 }}>{file.mime_type}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p style={{ color: '#94a3b8', fontSize: '13px' }}>{file.task_title || '—'}</p>
                      <p style={{ color: '#475569', fontSize: '11px', marginTop: 1 }}>{file.project_name || '—'}</p>
                    </td>
                    <td>
                      <span style={{
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
                        padding: '3px 8px', borderRadius: 6, fontSize: '12px', fontWeight: 600, color: '#94a3b8'
                      }}>
                        {formatSize(file.file_size)}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '12px' }}>
                      {new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-download" onClick={() => handleDownload(file.id, file.original_name)}>
                          ↓ Download
                        </button>
                        <button className="btn-delete" onClick={() => handleDelete(file.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}