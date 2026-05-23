// File: taskflow-cloud/frontend/src/components/Navbar.js
// Purpose: Top navigation bar shown on protected pages

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

export default function Navbar() {
    const router = useRouter();

    const getUserName = () => {
        try {
            const user = JSON.parse(Cookies.get('taskflow_user') || '{}');
            return user.name || 'User';
        } catch {
            return 'User';
        }
    };

    const handleLogout = () => {
        Cookies.remove('taskflow_token');
        Cookies.remove('taskflow_user');
        toast.success('Logged out successfully');
        router.push('/login');
    };

    return (
        <nav className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                        TaskFlow Cloud
                    </Link>
                    <div className="flex gap-4">
                        <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 text-sm">
                            Dashboard
                        </Link>
                        <Link href="/projects" className="text-gray-600 hover:text-blue-600 text-sm">
                            Projects
                        </Link>
                        <Link href="/files" className="text-gray-600 hover:text-blue-600 text-sm">
                            Files (S3)
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">Hello, {getUserName()}</span>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-red-500 hover:text-red-700"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}