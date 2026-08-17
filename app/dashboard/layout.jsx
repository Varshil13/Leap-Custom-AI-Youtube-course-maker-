'use client';
import React from 'react'
import Sidebar from './_components/Sidebar'
import Header from './_components/Header'
import { usePathname } from 'next/navigation';

function DashboardLayout({ children }) {
    const pathname = usePathname();
    const isLearnCourse = pathname?.includes('/dashboard/learnCourse/');
    
    if (isLearnCourse) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <div className="md:ml-64">
                <Header />
                <main className="p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default DashboardLayout
