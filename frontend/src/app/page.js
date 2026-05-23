// File: taskflow-cloud/frontend/src/app/page.js
// Purpose: Home/landing page — what visitors see at http://localhost:3000

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
      <div className="text-center text-white px-6">
        <h1 className="text-5xl font-bold mb-4">TaskFlow Cloud</h1>
        <p className="text-xl mb-2 opacity-90">Team Task & File Management</p>
        <p className="text-sm mb-8 opacity-75">
          Built with Next.js · Express · PostgreSQL · AWS · Docker · Kubernetes
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition"
          >
            Register
          </Link>
        </div>

        {/* DevOps Stack badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {['Docker', 'GitHub Actions', 'AWS EC2', 'AWS S3', 'AWS RDS', 'EKS', 'CloudWatch', 'Terraform'].map((tech) => (
            <span
              key={tech}
              className="bg-white bg-opacity-20 text-white text-xs px-3 py-1 rounded-full"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}