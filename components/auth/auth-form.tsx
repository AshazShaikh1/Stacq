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
        <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center justify-center gap-2">
                    {step === 'initial' 
                        ? (type === 'login' ? 'Welcome back' : 'Join Stacq') 
                        : (step === 'signup-otp' || step === 'recovery-otp') ? 'Verify code' : 'Reset Password'}
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                    {step === 'initial' 
                        ? (type === 'login' ? 'Enter your details to sign in' : 'Create an account to start curating')
                        : step === 'recovery-email' ? 'Enter your email to receive a recovery code' : `We sent a 6-digit code to ${email}`}
                </p>
            </div>


            {step === 'initial' ? (
                <form onSubmit={handleAuth} className="flex flex-col gap-3">
                    {type === 'signup' && (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Name"
                                        value={displayName}
                                        onChange={e => setDisplayName(e.target.value)}
                                        required
                                        className="pl-9 h-11 bg-background rounded-xl border-border focus:ring-primary"
                                    />
                                </div>
                                <div className="relative">
                                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Username"
                                        value={username}
                                        onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                        required
                                        className="pl-9 h-11 bg-background rounded-xl border-border focus:ring-primary"
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    className="pl-9 h-11 bg-background rounded-xl border-border focus:ring-primary"
                                />
                            </div>
                        </>
                    )}

                    {type === 'login' && (
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Username or Email"
                                value={identifier}
                                onChange={e => setIdentifier(e.target.value)}
                                required
                                className="pl-9 h-12 bg-background rounded-xl border-border focus:ring-primary font-medium"
                            />
                        </div>
                    )}

                    <div className="space-y-1">
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                className="pl-9 pr-10 h-12 bg-background rounded-xl border-border focus:ring-primary font-medium"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {type === 'signup' && <PasswordValidation password={password} />}
                        {type === 'login' && (
                            <div className="flex justify-end">
                                <button type="button" onClick={() => { setStep('recovery-email'); setEmail(identifier.includes('@') ? identifier : ""); }} className="text-xs font-bold text-primary hover:underline">
                                    Forgot Password?
                                </button>
                            </div>
                        )}
                    </div>

                    <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-primary-foreground h-12 text-base font-black rounded-xl shadow-emerald/10 shadow-sm mt-2 active:scale-95 transition-all flex items-center justify-center" disabled={loading}>
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (type === 'login' ? "Log in" : "Create Account")}
                    </Button>
                </form>
            ) : step === 'recovery-email' ? (
                <form onSubmit={handleSendRecovery} className="flex flex-col gap-4">
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="email"
                            placeholder="curator@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="pl-11 h-12 bg-background border-border rounded-xl focus:ring-primary font-medium"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-primary-foreground h-12 text-base font-black rounded-xl shadow-emerald/10 shadow-sm active:scale-95 transition-all" disabled={loading}>
                            {loading ? "Sending..." : "Send Recovery Code"}
                        </Button>
                        <button type="button" onClick={() => setStep('initial')} className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1">
                            <ArrowLeft className="w-3 h-3" /> Back to Login
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={step === 'signup-otp' ? handleVerifySignup : handleResetPassword} className="flex flex-col gap-4">
                    <div className="space-y-3">
                        <Input
                            type="text"
                            placeholder="000000"
                            value={otp}
                            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            required
                            className="h-12 text-center text-xl font-black tracking-[0.2em] bg-background border-border rounded-xl focus:ring-primary"
                            autoFocus
                        />
                        {step === 'recovery-otp' && (
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="New password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    className="pl-11 pr-10 h-12 bg-background border-border rounded-xl focus:ring-primary font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        )}
                        {step === 'recovery-otp' && <PasswordValidation password={password} />}
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-primary-foreground h-12 text-base font-black rounded-xl shadow-emerald/10 shadow-sm active:scale-95 transition-all" disabled={loading || otp.length < 6 || (step === 'recovery-otp' && !isPasswordValid(password))}>
                            {loading ? "Verifying..." : (step === 'signup-otp' ? "Verify & Join" : "Reset Password")}
                        </Button>
                        <button type="button" onClick={() => setStep('initial')} className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors text-center">
                            Back
                        </button>
                    </div>
                </form>
            )}

            <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-4 text-muted-foreground font-black tracking-widest text-[10px]">Or continue with</span>
                </div>
            </div>

            <Button
                type="button"
                onClick={() => signInWithGoogle()}
                variant="outline"
                className="w-full h-12 border-2 border-border hover:bg-surface hover:border-primary/30 text-foreground font-bold rounded-xl transition-all duration-200 active:scale-95 gap-3"
            >
                <Chrome className="h-5 w-5 text-primary" />
                Google Account
            </Button>

            <p className="text-center text-sm text-muted-foreground font-medium">
                {type === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button
                    onClick={() => setType(type === 'login' ? 'signup' : 'login')}
                    className="text-primary font-bold hover:underline cursor-pointer"
                >
                    {type === 'login' ? 'Sign up' : 'Login'}
                </button>
            </p>
        </div>
    )
}