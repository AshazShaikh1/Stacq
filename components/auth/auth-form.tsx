"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  signInWithGoogle,
  signUp,
  login,
  verifySignupOTP,
  sendPasswordResetOTP,
  resetPasswordWithOTP,
} from "@/lib/supabase/actions";
import {
  Chrome,
  Mail,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  AtSign,
  Loader2,
} from "lucide-react";
import { PasswordValidation, isPasswordValid } from "./password-validation";
import { toast } from "sonner";

type AuthStep = "initial" | "signup-otp" | "recovery-email" | "recovery-otp";

export default function AuthForm({
  type: initialType,
}: {
  type: "login" | "signup";
}) {
  const [type, setType] = useState<"login" | "signup">(initialType);
  const [step, setStep] = useState<AuthStep>("initial");

  // Form States
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otp, setOtp] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setType(initialType);
    setStep("initial");
    setError(null);
  }, [initialType]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (type === "signup") {
        if (!agreedToTerms) {
          throw new Error("You must agree to the Terms and Privacy Policy");
        }
        if (!isPasswordValid(password)) {
          throw new Error("Password does not meet requirements");
        }
        const { error: signUpError } = await signUp(
          email,
          password,
          username,
          displayName,
        );
        if (signUpError) throw signUpError;

        toast.success("Verification code sent to your email!");
        setStep("signup-otp");
      } else {
        await login({ identifier, password });
        toast.success("Welcome back!");
        window.location.href = "/feed";
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: verifyError } = await verifySignupOTP(email, otp);
      if (verifyError) throw verifyError;

      toast.success("Account verified! Welcome to Stacq.");
      window.location.href = "/feed";
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: sendError } = await sendPasswordResetOTP(email);
      if (sendError) throw sendError;
      toast.success("Recovery code sent!");
      setStep("recovery-otp");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Error sending recovery code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid(password)) {
      setError("Password does not meet requirements");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await resetPasswordWithOTP(
        email,
        otp,
        password,
      );
      if (resetError) throw new Error(resetError);

      toast.success("Password updated successfully!");
      setStep("initial");
      setType("login");
      setOtp("");
      setPassword("");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6 w-full max-w-sm mx-auto px-1">
      <div className="text-center space-y-2">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
          {step === "signup-otp"
            ? "Verify your mail"
            : step === "recovery-email"
              ? "Reset Password"
              : step === "recovery-otp"
                ? "New Password"
                : type === "login"
                  ? "Welcome Back"
                  : "Create Account"}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
          {step === "signup-otp"
            ? `We sent a code to ${email}`
            : step === "recovery-email"
              ? "Enter your email to receive a recovery code"
              : step === "recovery-otp"
                ? "Enter the code and your new password"
                : type === "login"
                  ? "Enter your details to continue"
                  : "Join the community of stacqers"}
        </p>
      </div>

      {/* INITIAL STEP: LOGIN / SIGNUP */}
      {step === "initial" && (
        <>
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
                    className="pl-9 h-11 bg-background rounded-xl border-border focus:ring-primary/20"
                  />
                </div>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Username"
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        e.target.value.toLowerCase().replace(/\s+/g, ""),
                      )
                    }
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="pl-9 h-11 bg-background rounded-xl border-border focus:ring-primary/20"
                  />
                </div>
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={
                  type === "login" ? "Email or username" : "Email address"
                }
                value={type === "login" ? identifier : email}
                onChange={(e) =>
                  type === "login"
                    ? setIdentifier(e.target.value)
                    : setEmail(e.target.value)
                }
                required
                type="text"
                className="pl-9 h-11 bg-background rounded-xl border-border focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1">
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-9 pr-10 h-11 bg-background rounded-xl border-border focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {type === "login" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep("recovery-email")}
                    className="text-[11px] sm:text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {type === "signup" && (
              <div className="flex items-start gap-2 py-1 animate-in fade-in slide-in-from-top-1 duration-300">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary/20 accent-primary"
                  required
                />
                <label
                  htmlFor="terms"
                  className="text-[11px] sm:text-xs text-muted-foreground leading-tight select-none"
                >
                  I agree to the{" "}
                  <a
                    href="/terms"
                    className="text-primary hover:underline font-bold"
                    target="_blank"
                  >
                    Terms & Conditions
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy"
                    className="text-primary hover:underline font-bold"
                    target="_blank"
                  >
                    Privacy Policy
                  </a>
                  .
                </label>
              </div>
            )}

            {type === "signup" && password.length > 0 && (
              <div className="py-1">
                <PasswordValidation password={password} />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary hover:bg-primary-dark text-primary-foreground text-sm sm:text-base font-black rounded-xl shadow-emerald/10 shadow-lg transition-all active:scale-95 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : type === "login" ? (
                "Log In"
              ) : (
                "Get Started"
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setType(type === "login" ? "signup" : "login")}
              className="text-xs sm:text-sm font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              {type === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <span className="text-primary underline underline-offset-4">
                    Join Stacq
                  </span>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <span className="text-primary underline underline-offset-4">
                    Log in
                  </span>
                </>
              )}
            </button>
          </div>

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
            className="w-full h-11 border-2 border-border hover:bg-surface text-foreground font-bold rounded-xl gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Chrome className="h-5 w-5 text-primary" />
            Google Account
          </Button>
        </>
      )}

      {/* SIGNUP OTP STEP */}
      {step === "signup-otp" && (
        <form
          onSubmit={handleVerifySignup}
          className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="pl-9 h-12 bg-background rounded-xl border-border text-center tracking-[0.5em] font-black text-lg focus:ring-primary/20"
            />
          </div>
          <Button
            type="submit"
            disabled={loading || otp.length < 6}
            className="btn-primary w-full h-12 rounded-xl shadow-lg shadow-emerald/10 font-black"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Verify Account"
            )}
          </Button>
          <button
            type="button"
            onClick={() => setStep("initial")}
            className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Signup
          </button>
        </form>
      )}

      {/* RECOVERY EMAIL STEP */}
      {step === "recovery-email" && (
        <form
          onSubmit={handleSendRecovery}
          className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              className="pl-9 h-12 bg-background rounded-xl border-border focus:ring-primary/20"
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !email}
            className="btn-primary w-full h-12 rounded-xl shadow-lg shadow-emerald/10 font-black"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Send Recovery Code"
            )}
          </Button>
          <button
            type="button"
            onClick={() => {
              setStep("initial");
              setType("login");
            }}
            className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Login
          </button>
        </form>
      )}

      {/* RECOVERY OTP & RESET STEP */}
      {step === "recovery-otp" && (
        <form
          onSubmit={handleResetPassword}
          className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Enter code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="pl-9 h-11 bg-background rounded-xl border-border text-center tracking-widest font-bold focus:ring-primary/20"
            />
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pl-9 pr-10 h-11 bg-background rounded-xl border-border focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {password.length > 0 && <PasswordValidation password={password} />}

          <Button
            type="submit"
            disabled={loading || otp.length < 6 || !isPasswordValid(password)}
            className="btn-primary w-full h-11 rounded-xl shadow-lg shadow-emerald/10 font-black mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Update Password"
            )}
          </Button>
          <button
            type="button"
            onClick={() => setStep("recovery-email")}
            className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-colors mt-1"
          >
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
        </form>
      )}
    </div>
  );
}
