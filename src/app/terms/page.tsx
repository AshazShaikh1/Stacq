import Link from "next/link";

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-gray-muted text-lg max-w-xl mx-auto">
            Rules and guidelines for using Stacq.
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-stone prose-headings:font-bold prose-headings:text-jet-dark prose-p:text-gray-muted prose-li:text-gray-muted prose-emerald max-w-none">
          <h3>1. Acceptance of Terms</h3>
          <p>
            By accessing or using Stacq, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service.
          </p>

          <h3>2. Accounts</h3>
          <p>
            You are responsible for safeguarding your account login credentials. You guarantee that the information you provide is accurate.
          </p>

          <h3>3. User-Generated Content</h3>
          <ul>
            <li><strong>Ownership:</strong> You retain ownership of all content you post.</li>
            <li><strong>License:</strong> By posting content, you grant us a license to use, display, and distribute such content on the Service (e.g., showing your Public Collections on the Global Feed).</li>
            <li><strong>Responsibility:</strong> You agree not to post content that is illegal, offensive, or copyrighted without permission.</li>
          </ul>

          <h3>4. Termination</h3>
          <p>
            We may terminate or suspend your account immediately without prior notice if you breach these Terms.
          </p>

          <h3>5. Limitation of Liability</h3>
          <p>
            Stacq is provided on an &quot;AS IS&quot; basis. We are not liable for any damages or loss of data resulting from your use of the Service.
          </p>
        </div>
      </div>
    </div>
  );
}
