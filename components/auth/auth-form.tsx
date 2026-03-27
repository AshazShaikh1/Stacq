"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signInWithGoogle, signUp, login } from "@/lib/supabase/actions"
import { Chrome, Eye, EyeOff } from "lucide-react"

export default function AuthForm({ type: initialType }: { type: 'login' | 'signup' }) {
    const [type, setType] = useState<'login' | 'signup'>(initialType)
    const [identifier, setIdentifier] = useState("")
    const [password, setPassword] = useState("")
    const [username, setUsername] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setType(initialType)
        setError(null)
    }, [initialType])

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))
    }

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            if (type === 'signup') {
                const { error: signUpError } = await signUp(identifier, password, username, displayName)
                if (signUpError) throw signUpError
                // Simple redirect for MVP
                window.location.href = '/'
            } else {
                await login({ identifier, password })
                window.location.href = '/'
            }
        } catch (err: any) {
            setError(err.message || 'Authentication error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">
                    {type === 'login' ? 'Welcome back' : 'Create an account'}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {type === 'login'
                        ? 'Enter your details to sign in to your account'
                        : 'Join the community to start curating Stacqs'}
                </p>
            </div>

            <form onSubmit={handleAuth} className="flex flex-col gap-3">
                {error && (
                    <div className="p-3 bg-destructive/15 text-destructive border border-destructive/30 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {type === 'signup' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                            placeholder="Name"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            required
                            className="focus-visible:ring-primary focus-visible:border-primary"
                        />
                        <Input
                            placeholder="Username"
                            value={username}
                            onChange={handleUsernameChange}
                            required
                            className="focus-visible:ring-primary focus-visible:border-primary"
                        />
                    </div>
                )}

                <Input
                    type={type === 'login' ? "text" : "email"}
                    placeholder={type === 'login' ? "Username or Email" : "Email address"}
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    required
                    className="focus-visible:ring-primary focus-visible:border-primary"
                />

                <div className="space-y-1">
                    <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="pr-10 focus-visible:ring-primary focus-visible:border-primary"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {type === 'login' && (
                        <div className="flex justify-end pt-1">
                            <a href="#" onClick={(e) => e.preventDefault()} className="text-xs text-primary font-medium hover:underline">
                                Forgot Password?
                            </a>
                        </div>
                    )}
                </div>

                <Button type="submit" className="w-full btn-primary h-12 text-base mt-2 cursor-pointer hover:bg-primary-dark" disabled={loading}>
                    {loading ? "Please wait..." : (type === 'login' ? "Log in" : "Sign up")}
                </Button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
            </div>

            <Button
                type="button"
                onClick={() => signInWithGoogle()}
                variant="outline"
                className="w-full h-12 border-2 hover:bg-primary/5 hover:border-primary text-foreground transition-all duration-200 hover:scale-105 cursor-pointer gap-3"
            >
                <Chrome className="h-5 w-5 text-primary" />
                Continue with Google
            </Button>

            <p className="text-center text-sm text-slate-500">
                {type === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button
                    onClick={() => setType(type === 'login' ? 'signup' : 'login')}
                    className="text-primary font-semibold hover:underline cursor-pointer"
                >
                    {type === 'login' ? 'Sign up' : 'Login'}
                </button>
            </p>
        </div>
    )
}