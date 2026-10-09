'use client'
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  CheckCircle,
  PlusCircle,
  Rocket,
  Settings,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

function Sidebar() {
  const pathname = usePathname()
  const isCreateFlow = pathname?.startsWith('/createCourse')

  const menuItems = [
    { id: 1, name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { id: 3, name: 'Completed', icon: <CheckCircle size={20} />, path: '/dashboard/completed' },
    { id: 4, name: 'Create Course', icon: <PlusCircle size={20} />, path: '/createCourse' },
    { id: 5, name: 'Upgrade', icon: <Rocket size={20} />, path: '/dashboard/upgrade' },
  ]

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 border-r bg-sidebar hidden md:flex flex-col z-30">
      <div className="p-4 border-b flex justify-center" style={{ borderColor: 'var(--sidebar-border)' }}>
        <Link href="/dashboard" className="flex flex-col items-center justify-center w-full">
          <Image src="/logo2.png" alt="LEAP" width={140} height={168} className="w-32 h-auto object-contain" />
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive =
              item.path === '/dashboard'
                ? pathname === '/dashboard' && !isCreateFlow
                : pathname === item.path || pathname?.startsWith(item.path + '/')
            return (
              <li key={item.id}>
                <Link
                  href={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'text-primary bg-primary/10 border-l-4 border-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

 
    </aside>
  )
}

export default Sidebar
