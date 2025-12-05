'use client';

import { LoginFormContent } from '@/components/auth/LoginFormContent';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cloud px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-card p-8">
          <LoginFormContent
            isFullPage={true}
            showLogo={true}
          />
        </div>
      </div>
    </div>
  );
}

