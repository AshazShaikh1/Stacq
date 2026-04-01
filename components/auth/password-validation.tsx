"use client"

import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ValidationRule {
  id: string
  label: string
  test: (pw: string) => boolean
}

const RULES: ValidationRule[] = [
  { id: "length", label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { id: "lower", label: "Include a lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { id: "upper", label: "Include an uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { id: "digit", label: "Include a number", test: (pw) => /\d/.test(pw) },
]

export function PasswordValidation({ password }: { password: string }) {
  return (
    <div className="space-y-2 py-2">
      {RULES.map((rule) => {
        const isMet = rule.test(password)
        return (
          <div
            key={rule.id}
            className={cn(
              "flex items-center gap-2 text-xs font-bold transition-colors duration-200",
              isMet ? "text-primary/70" : "text-muted-foreground/50",
              password.length > 0 && !isMet && "text-destructive/70"
            )}
          >
            <div className={cn(
              "w-4 h-4 rounded-full flex items-center justify-center border transition-all",
              isMet ? "bg-primary border-primary text-primary-foreground scale-110" : "border-border"
            )}>
              {isMet && <Check className="w-2.5 h-2.5 stroke-4" />}
            </div>
            {rule.label}
          </div>
        )
      })}
    </div>
  )
}

export function isPasswordValid(pw: string) {
  return RULES.every(rule => rule.test(pw))
}
