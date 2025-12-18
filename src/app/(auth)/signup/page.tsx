'use client';

import { Suspense } from 'react';
import { SignupFormContent } from '@/components/auth/SignupFormContent';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cloud px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-card p-8">
          {/* Suspense boundary is required here because SignupFormContent 
            (or its dependencies) accesses client-side search params, 
            which would otherwise break static pre-rendering.
          */}
          <Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
            <SignupFormContent
              isFullPage={true}
              showLogo={true}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}