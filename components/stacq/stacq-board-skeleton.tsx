"use client"

import React from 'react'

export function StacqBoardSkeleton() {
  return (
    <div className="space-y-12 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="space-y-6">
          {/* Section Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-muted rounded-lg" />
            <div className="h-8 w-8 bg-muted rounded-full" />
          </div>

          {/* Resource Card Skeletons */}
          <div className="space-y-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-32 w-full bg-surface/50 border border-border/50 rounded-2xl flex gap-4 p-4">
                <div className="w-24 h-full bg-muted rounded-xl shrink-0" />
                <div className="flex-1 space-y-3 py-2">
                  <div className="h-5 w-2/3 bg-muted rounded-md" />
                  <div className="h-4 w-full bg-muted/60 rounded-md" />
                  <div className="h-4 w-1/2 bg-muted/60 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
