import React from 'react'

function UpgradePage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <span className="text-2xl">🚀</span>
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Coming Soon</h1>
      <p className="text-muted-foreground max-w-md">
        We are working on premium features including advanced AI models, unlimited courses, 
        and priority support. Stay tuned!
      </p>
    </div>
  )
}

export default UpgradePage
