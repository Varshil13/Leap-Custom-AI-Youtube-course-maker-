'use client'
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, LayoutDashboard, BookOpen, CheckCircle, PlusCircle, Rocket, Settings, LogOut } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

const navItems = [
  { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
  { name: 'Completed', icon: <CheckCircle size={20} />, path: '/dashboard/completed' },
  { name: 'Create Course', icon: <PlusCircle size={20} />, path: '/createCourse' },
  { name: 'Upgrade', icon: <Rocket size={20} />, path: '/dashboard/upgrade' },
]

import { signOut, useSession } from 'next-auth/react'

function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <header className="flex justify-between items-center px-6 h-16 border-b bg-background sticky top-0 z-20" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-3">
        {/* Mobile Navigation Toggle */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent focus:outline-none"
              aria-label="Open navigation menu"
            >
              <Menu size={24} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b flex justify-center">
                <Link href="/dashboard" className="flex flex-col items-center justify-center w-full">
                  <Image src="/logo2.png" alt="LEAP" width={140} height={168} className="w-32 h-auto object-contain" />
                </Link>
              </div>
              <nav className="flex-1 p-4">
                <ul className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.path || pathname?.startsWith(item.path + '/')
                    return (
                      <li key={item.path}>
                        <Link
                          href={item.path}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                            isActive
                              ? 'text-primary bg-primary/10 border-l-4 border-primary'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent'
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
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile Logo (hidden on desktop because Sidebar has it) */}
        <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
          <Image src="/logo3.png" alt="LEAP" width={100} height={120} className="h-10 w-auto" />
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none ring-0">
              <img src={session.user.image} alt="User" className="w-8 h-8 rounded-full" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  )
}

export default Header
