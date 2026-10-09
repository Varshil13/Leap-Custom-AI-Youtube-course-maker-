import React from 'react'
import { Rocket } from 'lucide-react'

function UpgradePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-1 ring-primary/20">
        <Rocket size={32} className="text-primary animate-pulse" />
      </div>
      <h1 className="text-4xl font-black text-foreground mb-4 tracking-tight uppercase">Under Construction</h1>
      <p className="text-muted-foreground max-w-md text-lg">
        We're actively building out the premium LEAp experience. Advanced AI models, unlimited generations, and deeper customizations are on the way.
      </p>
    </div>
  )
}

export default UpgradePage
