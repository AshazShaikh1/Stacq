"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signInWithGoogle, signUp, login, verifySignupOTP, sendPasswordResetOTP, resetPasswordWithOTP } from "@/lib/supabase/actions"
import { Chrome, Mail, ArrowRight, ArrowLeft, KeyRound, Eye, EyeOff, ShieldCheck, User, AtSign, Loader2 } from "lucide-react"
import { PasswordValidation, isPasswordValid } from "./password-validation"
import { toast } from "sonner"

type AuthStep = 'initial' | 'signup-otp' | 'recovery-email' | 'recovery-otp'

export default function AuthForm({ type: initialType }: { type: 'login' | 'signup' }) {
    const [type, setType] = useState<'login' | 'signup'>(initialType)
    const [step, setStep] = useState<AuthStep>('initial')

    // Form States
    const [identifier, setIdentifier] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [username, setUsername] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [otp, setOtp] = useState("")

    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setType(initialType)
        setStep('initial')
        setError(null)
    }, [initialType])

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            if (type === 'signup') {
                if (!isPasswordValid(password)) {
                    throw new Error("Password does not meet requirements")
                }
                const { error: signUpError } = await signUp(email, password, username, displayName)
                if (signUpError) throw signUpError

                toast.success("Verification code sent to your email!")
                setStep('signup-otp')
            } else {
                await login({ identifier, password })
                toast.success("Welcome back!")
                window.location.href = '/feed'
            }
        } catch (err: any) {
            toast.error(err.message || 'Authentication error')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifySignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const { error: verifyError } = await verifySignupOTP(email, otp)
            if (verifyError) throw verifyError

            toast.success("Account verified! Welcome to Stacq.")
            window.location.href = '/feed'
        } catch (err: any) {
            toast.error(err.message || 'Invalid or expired code')
        } finally {
            setLoading(false)
        }
    }

    const handleSendRecovery = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const { error: sendError } = await sendPasswordResetOTP(email)
            if (sendError) throw sendError
            toast.success("Recovery code sent!")
            setStep('recovery-otp')
        } catch (err: any) {
            toast.error(err.message || 'Error sending recovery code')
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isPasswordValid(password)) {
            setError("Password does not meet requirements")
            return
        }
        setError(null)
        setLoading(true)

        try {
            const { error: resetError } = await resetPasswordWithOTP(email, otp, password)
            if (resetError) throw new Error(resetError)

            toast.success("Password updated successfully!")
            setStep('initial')
            setType('login')
            setOtp("")
            setPassword("")
        } catch (err: any) {
            toast.error(err.message || 'Reset failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-5 sm:gap-6 w-full max-w-sm mx-auto px-1">

            <div className="text-center space-y-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {type === 'login' ? 'Welcome Back' : 'Create Account'}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                    {type === 'login' ? 'Enter your details to continue' : 'Join the community of curators'}
                </p>
            </div>

            {/* FORM */}
            <form onSubmit={handleAuth} className="flex flex-col gap-3">

                {type === "signup" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                                className="pl-9 h-10 sm:h-11 bg-background rounded-xl border-border focus:ring-primary/20"
                            />
                        </div>

                        <div className="relative">
                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="pl-9 h-10 sm:h-11 bg-background rounded-xl border-border focus:ring-primary/20"
                            />
                        </div>
                    </div>
                )}

                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder={type === 'login' ? "Email or username" : "Email address"}
                        value={type === 'login' ? identifier : email}
                        onChange={(e) => type === 'login' ? setIdentifier(e.target.value) : setEmail(e.target.value)}
                        required
                        type="text"
                        className="pl-9 h-11 sm:h-12 bg-background rounded-xl border-border focus:ring-primary/20"
                    />
                </div>

                <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                    <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-9 pr-10 h-11 sm:h-12 bg-background rounded-xl border-border focus:ring-primary/20"
                    />

                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>

                {type === 'signup' && password.length > 0 && (
                    <div className="py-1">
                        <PasswordValidation password={password} />
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 sm:h-12 bg-primary hover:bg-primary-dark text-primary-foreground text-sm sm:text-base font-black rounded-xl shadow-emerald/10 shadow-lg transition-all active:scale-95 disabled:opacity-70"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        type === 'login' ? 'Log In' : 'Get Started'
                    )}
                </Button>

            </form>

            {/* Toggle Link */}
            <div className="text-center">
                <button
                    type="button"
                    onClick={() => setType(type === 'login' ? 'signup' : 'login')}
                    className="text-xs sm:text-sm font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                    {type === 'login' ? (
                        <>Don't have an account? <span className="text-primary underline underline-offset-4">Join Stacq</span></>
                    ) : (
                        <>Already have an account? <span className="text-primary underline underline-offset-4">Log in</span></>
                    )}
                </button>
            </div>

            {/* Divider */}
            <div className="relative mt-2">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
                    <span className="bg-background px-4 text-muted-foreground font-black tracking-widest">
                        Or continue with
                    </span>
                </div>
            </div>

            <Button
                type="button"
                onClick={() => signInWithGoogle()}
                variant="outline"
                className="w-full h-11 sm:h-12 border-2 border-border hover:bg-surface text-foreground font-bold rounded-xl gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
                <Chrome className="h-5 w-5 text-primary" />
                Google Account
            </Button>

        </div>
    )
}
