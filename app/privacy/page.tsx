import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Stacq",
  description: "How we handle your data at Stacq.",
  alternates: { canonical: "https://stacq.in/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-24 space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          Privacy <span className="text-primary">Policy</span>
        </h1>
        <p className="text-muted-foreground font-medium">
          Last Updated: April 2026
        </p>
      </div>

      <div className="space-y-8 text-foreground/80 leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">
            1. Information We Collect
          </h2>
          <p>
            We collect information you provide directly to us, such as when you
            create an account, curate content, or communicate with us. This
            includes your username, email address, and any links you bookmark.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">
            2. How We Use Your Information
          </h2>
          <p>
            We use the information we collect to provide, maintain, and improve
            our services, to personalize your experience, and to communicate
            with you about your account and updates to our service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">
            3. Sharing of Information
          </h2>
          <p>
            We do not share your personal information with third parties except
            as necessary to provide our service, comply with the law, or protect
            our rights.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">
            4. Analytics & Session Recording
          </h2>
          <p>
            We use <strong>PostHog</strong> to understand how visitors use
            Stacq. This includes anonymous usage analytics, click tracking, and{" "}
            <strong>session recordings</strong> — anonymous video replays of
            your browsing session on our site.
          </p>
          <p>
            Session recordings help us identify usability issues and improve the
            product. All recordings are:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-foreground/70">
            <li>
              <strong>Input-masked by default</strong> — we never record what
              you type into any form field (passwords, emails, handles).
            </li>
            <li>
              <strong>Anonymous</strong> — recordings are not linked to your
              email or account identity.
            </li>
            <li>
              <strong>
                Stored on PostHog&apos;s EU-compliant infrastructure.
              </strong>
            </li>
          </ul>
          <p>
            We also use <strong>Vercel Analytics</strong> and{" "}
            <strong>Speed Insights</strong> to monitor page performance (load
            times, Core Web Vitals). These do not use third-party cookies.
          </p>
          <p>
            You can opt out of session recording at any time by enabling the{" "}
            <strong>Do Not Track</strong> setting in your browser — we honour
            the DNT header.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">
            5. Data Security
          </h2>
          <p>
            We take reasonable measures to help protect information about you
            from loss, theft, misuse and unauthorized access, disclosure,
            alteration and destruction.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">6. Your Choices</h2>
          <p>
            You can update or delete your account information at any time by
            logging into your account settings. You can also request that we
            delete all your personal data by contacting us at{" "}
            <a
              href="mailto:hello@stacq.in"
              className="text-primary font-semibold hover:underline"
            >
              hello@stacq.in
            </a>
            .
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">7. Cookies</h2>
          <p>
            Stacq uses <strong>localStorage</strong> (not third-party cookies)
            to maintain your session and analytics state. We do not serve
            advertising cookies or sell your data to any third party.
          </p>
        </section>
      </div>
    </div>
  );
}
