"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from '../../components/ui/button'
import { ArrowRight } from 'lucide-react'

function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-background via-background to-muted overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-4 left-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-24 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight animate-fade-in-up animation-delay-100">
          Create Custom AI-Powered Courses{' '}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Instantly
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
          LEAP empowers learners and educators to generate personalized, professional courses using advanced AI. Start your journey to smarter learning today.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up animation-delay-300">
          <Link href="/sign-up">
            <Button size="lg" className="px-8 py-4 text-lg font-semibold">
              Get Started Free
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Hero
