import React from 'react'
import Image from 'next/image'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

function Header() {
  return (
    <header
      className='flex justify-between items-center px-6 h-16 border-b bg-background'
      style={{ borderColor: 'var(--border)' }}
    >
      <Link href="/dashboard" className="flex items-center gap-2">
        <Image src="/logo.png" alt="LEAP" width={40} height={40} />
        <span className="text-xl font-bold text-primary hidden sm:inline">Leap</span>
      </Link>
      <div className="flex items-center gap-4">
        <UserButton />
      </div>
    </header>
  )
}

export default Header
