// File: taskflow-cloud/frontend/src/app/page.js
// Purpose: Home/landing page — what visitors see at http://localhost:3000
import Link from 'next/link';

const TECH_BADGES = ['Docker', 'GitHub Actions', 'AWS EC2', 'AWS S3', 'AWS RDS', 'EKS', 'CloudWatch', 'Terraform'];

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 11h8M8 15h5" />
      </svg>
    ),
    label: 'Project Management',
    desc: 'Organize work into projects with kanban boards',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    label: 'AWS S3 File Storage',
    desc: 'Securely upload and share files with your team',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    label: 'Task Comments',
    desc: 'Collaborate with threaded comments on every task',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-indigo-700/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-blue-700/10 blur-3xl" />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      {/* Decorative top bar */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <div className="relative z-10 max-w-3xl w-full mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-4 py-2 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
          Task & File Management for Modern Teams
        </div>

        {/* Headline */}
        <h1 className="text-6xl sm:text-7xl font-bold text-white tracking-tight leading-[1.08] mb-5">
          Task
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Flow</span>
          {' '}Cloud
        </h1>

        <p className="text-lg text-slate-400 mb-3 leading-relaxed max-w-xl mx-auto">
          Manage projects, track tasks, and share files — all in one place, built on production-grade cloud infrastructure.
        </p>

        <p className="text-sm text-slate-600 mb-10">
          Next.js · Express · PostgreSQL · AWS · Docker · Kubernetes
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
          <Link
            href="/register"
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 hover:-translate-y-0.5"
          >
            Get started free
            <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 px-8 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
          >
            Log in
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12 text-left">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition"
            >
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600/15 text-blue-400 mb-3">
                {f.icon}
              </div>
              <p className="text-sm font-semibold text-white mb-1">{f.label}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* DevOps stack */}
        <div>
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-4 font-medium">Powered by</p>
          <div className="flex flex-wrap justify-center gap-2">
            {TECH_BADGES.map((tech) => (
              <span
                key={tech}
                className="bg-slate-900 border border-slate-800 text-slate-400 text-xs px-3 py-1.5 rounded-full hover:border-slate-700 hover:text-slate-300 transition"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative bottom bar */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
    </div>
  );
}