import { Button } from '../../components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

function Header() {
  return (
    <header className='flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50'>
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo3.png" alt="LEAP" width={100} height={120} className="h-10 w-auto" />
      </Link>

      
    </header>
  )
}

export default Header
