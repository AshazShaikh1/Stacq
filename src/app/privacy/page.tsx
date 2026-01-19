import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-stone-50 py-12 md:py-20 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-stone-100 p-8 md:p-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-8 text-2xl font-bold text-emerald tracking-tight hover:opacity-80 transition-opacity">
            Stacq
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-xs font-medium text-stone-600 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald"></span>
            Last Updated: January 18, 2026
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-jet-dark mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-muted text-lg max-w-xl mx-auto">
            How we manage and protect your data at Stacq.
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-stone prose-headings:font-bold prose-headings:text-jet-dark prose-p:text-gray-muted prose-li:text-gray-muted prose-emerald max-w-none">
          <h3>1. Introduction</h3>
          <p>
            Welcome to Stacq ("we," "our," or "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and browser extension.
          </p>

          <h3>2. Information We Collect</h3>
          <ul>
            <li>
              <strong>Account Information:</strong> We use Supabase Auth. When you login, we collect your email address, name, and profile picture. We do not see or save your passwords.
            </li>
            <li>
              <strong>User Content:</strong> Any Collections, Cards, Notes, links, and images you create or upload to Stacq.
            </li>
            <li>
              <strong>Usage Data:</strong> We use analytics tools (like Mixpanel) to understand how you use features to improve the app.
            </li>
            <li>
              <strong>Device Information:</strong> We collect information about your browser type and version to fix bugs (via Sentry).
            </li>
          </ul>

          <h3>3. How We Use Your Information</h3>
          <ul>
            <li>To provide and maintain the Service.</li>
            <li>To personalize your Feed and recommendations.</li>
            <li>To detect and prevent fraud or abuse.</li>
            <li>To communicate with you regarding your account or security updates.</li>
          </ul>

          <h3>4. Data Sharing</h3>
          <p>We share data only with trusted third-party service providers who help us run the app:</p>
          <ul>
            <li><strong>Supabase:</strong> Database and Auth.</li>
            <li><strong>Mixpanel:</strong> Usage analytics.</li>
            <li><strong>Sentry:</strong> Error debugging.</li>
          </ul>

          <h3>5. Your Rights</h3>
          <p>
            You have the right to access the personal data we hold about you, request corrections, or request deletion of your account and all associated data via your Settings page.
          </p>

          <h3>6. Contact Us</h3>
          <p>
            If you have any questions, please contact us at: <strong>support@stacq.app</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
