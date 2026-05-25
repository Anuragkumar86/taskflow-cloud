// File: taskflow-cloud/frontend/src/components/Navbar.js
// Purpose: Top navigation bar shown on protected pages

'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .navbar-root * { font-family: 'Plus Jakarta Sans', sans-serif; }

  .navbar {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(12, 14, 22, 0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }

  .navbar-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  /* Logo */
  .nav-logo {
    display: flex;
    align-items: center;
    gap: 9px;
    text-decoration: none;
    flex-shrink: 0;
  }
  .nav-logo-icon {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
    flex-shrink: 0;
  }
  .nav-logo-text {
    font-size: 15px;
    font-weight: 800;
    color: #f1f5f9;
    letter-spacing: -0.02em;
    line-height: 1;
  }
  .nav-logo-text span {
    color: #3b82f6;
  }

  /* Nav links */
  .nav-links {
    display: flex;
    align-items: center;
    gap: 2px;
    flex: 1;
    margin-left: 16px;
  }

  .nav-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
    text-decoration: none;
    transition: color 0.15s, background 0.15s;
    white-space: nowrap;
  }
  .nav-link:hover {
    color: #e2e8f0;
    background: rgba(255, 255, 255, 0.06);
  }
  .nav-link.active {
    color: #60a5fa;
    background: rgba(59, 130, 246, 0.1);
  }
  .nav-link-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .nav-link.active .nav-link-dot { opacity: 1; }

  /* Right side */
  .nav-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .user-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 999px;
    padding: 4px 12px 4px 4px;
  }
  .user-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(59,130,246,0.5), rgba(139,92,246,0.5));
    border: 1px solid rgba(59, 130, 246, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 800;
    color: #93c5fd;
    flex-shrink: 0;
  }
  .user-name {
    font-size: 13px;
    font-weight: 600;
    color: #94a3b8;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .logout-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 700;
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 8px;
    padding: 6px 12px;
    cursor: pointer;
    transition: color 0.15s, background 0.15s, border-color 0.15s;
    letter-spacing: 0.01em;
  }
  .logout-btn:hover {
    color: #f87171;
    background: rgba(239, 68, 68, 0.08);
    border-color: rgba(239, 68, 68, 0.2);
  }

  /* Divider */
  .nav-divider {
    width: 1px;
    height: 20px;
    background: rgba(255, 255, 255, 0.07);
    flex-shrink: 0;
  }
`;

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: '⬡' },
  { href: '/projects',  label: 'Projects',  icon: '📁' },
  { href: '/files',     label: 'Files',     icon: '☁️' },
];

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();

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

  const name   = getUserName();
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <style>{styles}</style>
      <nav className="navbar-root navbar">
        <div className="navbar-inner">

          {/* Logo */}
          <Link href="/dashboard" className="nav-logo">
            <div className="nav-logo-icon">⚡</div>
            <span className="nav-logo-text">Task<span>Flow</span></span>
          </Link>

          {/* Links */}
          <div className="nav-links">
            {NAV_LINKS.map(({ href, label, icon }) => {
              const isActive = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
              return (
                <Link key={href} href={href} className={`nav-link${isActive ? ' active' : ''}`}>
                  <span className="nav-link-dot" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="nav-right">
            <div className="user-pill">
              <div className="user-avatar">{initials}</div>
              <span className="user-name">{name}</span>
            </div>

            <div className="nav-divider" />

            <button className="logout-btn" onClick={handleLogout}>
              ↩ Logout
            </button>
          </div>

        </div>
      </nav>
    </>     
  );
}

