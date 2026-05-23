// File: taskflow-cloud/frontend/src/app/layout.js
// Purpose: Root layout that wraps every page
// Everything in layout.js appears on every page

import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'TaskFlow Cloud',
  description: 'Team Task and File Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        {/* Toast notifications (success/error messages) */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { background: '#333', color: '#fff' },
          }}
        />
        {children}
      </body>
    </html>
  );
}