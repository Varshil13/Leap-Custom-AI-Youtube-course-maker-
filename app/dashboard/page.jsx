import React from 'react'
import Showcourses from './_components/Showcourses'

function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage your learning courses
        </p>
      </div>
      <Showcourses />
    </div>
  )
}

export default DashboardPage
