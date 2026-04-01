"use client"

import React from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { cn } from "@/lib/utils"

export function AppShell({ children }: { children: React.ReactNode }) {
    const { session } = useAuth()

    return (
        <div 
            className={cn(
                "min-h-screen transition-all duration-300",
                session ? "md:ml-20 lg:ml-64" : ""
            )}
        >
            <div className="pb-32 md:pb-0">
                {children}
            </div>
        </div>
    )
}
