'use client'
import React from 'react'
import Image from 'next/image'
import { HiOutlineHome, HiOutlineSquare3Stack3D } from 'react-icons/hi2'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

function Sidebar() {
  const MenuItems = [
    { id: 1, name: 'Home', icon: <HiOutlineHome size={20} />, path: '/dashboard' },
    { id: 2, name: 'Completed', icon: <HiOutlineSquare3Stack3D size={20} />, path: '/dashboard/completed' },
  ]

  const path = usePathname()

  return (
    <aside
      className='fixed h-full w-64 border-r bg-sidebar hidden md:flex flex-col'
      style={{ borderColor: 'var(--sidebar-border)' }}
    >
      <div className='p-5 border-b' style={{ borderColor: 'var(--sidebar-border)' }}>
        <Link href="/dashboard" className='flex items-center gap-3'>
          <Image src="/logo.png" alt="LEAP" width={48} height={48} />
          <h1 className='text-2xl font-bold text-primary'>Leap</h1>
        </Link>
      </div>

      <nav className='flex-1 p-4'>
        <ul className='space-y-1'>
          {MenuItems.map((item) => {
            const isActive = item.path === path
            return (
              <li key={item.id}>
                <Link
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
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
