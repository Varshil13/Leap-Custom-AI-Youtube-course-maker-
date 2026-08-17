import { Button } from '../../components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

function Header() {
  return (
    <header className='flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50'>
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.png" alt="LEAP" width={36} height={36} />
        <span className="text-xl font-bold text-primary">Leap</span>
      </Link>
      <nav className="flex items-center gap-3">
        <Link href="/sign-in">
          <Button variant="ghost" size="sm">Sign In</Button>
        </Link>
        <Link href="/sign-up">
          <Button size="sm">Get Started</Button>
        </Link>
      </nav>
    </header>
  )
}

export default Header
