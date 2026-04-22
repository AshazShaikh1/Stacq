import { Suspense } from "react";
import AuthForm from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-background border border-border shadow-emerald rounded-2xl py-12 px-4 sm:px-8">
        <Suspense>
          <AuthForm type="signup" />
        </Suspense>
      </div>
    </div>
  );
}
