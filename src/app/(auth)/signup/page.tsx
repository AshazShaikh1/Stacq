'use client';

import { SignupFormContent } from '@/components/auth/SignupFormContent';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cloud px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-card p-8">
          <SignupFormContent
            isFullPage={true}
            showLogo={true}
          />
        </div>
      </div>
    </div>
  );
}
