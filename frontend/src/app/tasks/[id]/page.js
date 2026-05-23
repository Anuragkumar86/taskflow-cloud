// File: taskflow-cloud/frontend/src/app/tasks/[id]/page.js
// Purpose: View a single task with file uploads and comments
// This page demonstrates AWS S3 integration

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { taskAPI, fileAPI, commentAPI } from '@/lib/api';

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
    if (!Cookies.get('taskflow_token')) {
      router.push('/login');
      return;
    }
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

  // Upload file to AWS S3 via the backend
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

  // Get a temporary signed URL from S3 for secure download
  const handleDownload = async (fileId, filename) => {
    try {
      const res = await fileAPI.getDownloadUrl(fileId);
      // Open the signed URL in a new tab
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm mb-4">
          ← Back to Project
        </button>

        {/* Task Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">{task?.title}</h1>
              <p className="text-gray-500 text-sm">{task?.project_name}</p>
            </div>
            <div className="flex gap-2">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                task?.status === 'done' ? 'bg-green-100 text-green-700' :
                task?.status === 'inprogress' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {task?.status === 'inprogress' ? 'In Progress' : task?.status === 'todo' ? 'To Do' : 'Done'}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                {task?.priority}
              </span>
            </div>
          </div>
          {task?.description && (
            <p className="text-gray-700 mt-3">{task.description}</p>
          )}
          {task?.deadline && (
            <p className="text-sm text-gray-400 mt-2">Deadline: {task.deadline?.split('T')[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File Upload Section — AWS S3 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">📎 Files (AWS S3)</h2>

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400"
              onClick={() => fileInputRef.current.click()}
            >
              <p className="text-gray-500 text-sm">
                {uploading ? 'Uploading to S3...' : 'Click to upload file'}
              </p>
              <p className="text-gray-400 text-xs mt-1">PDF, images, documents · Max 10MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt"
            />

            <div className="mt-4 space-y-2">
              {files.length === 0 ? (
                <p className="text-gray-400 text-sm">No files uploaded yet</p>
              ) : (
                files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                        {file.original_name}
                      </p>
                      <p className="text-xs text-gray-400">{(file.file_size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={() => handleDownload(file.id, file.original_name)}
                      className="text-blue-500 text-xs hover:text-blue-700 ml-2"
                    >
                      Download ↓
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">💬 Comments</h2>

            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-gray-400 text-sm">No comments yet</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-600 mb-1">{c.user_name}</p>
                    <p className="text-sm text-gray-700">{c.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(c.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleComment}>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
              />
              <button
                type="submit"
                disabled={submittingComment || !comment.trim()}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {submittingComment ? 'Posting...' : 'Add Comment'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}