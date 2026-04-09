import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Terms and Conditions | Stacq",
    description: "Legal terms for using the Stacq platform.",
}

export default function TermsPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-24 space-y-12">
            <div className="space-y-4">
                <h1 className="text-4xl font-black tracking-tight text-foreground">
                    Terms & <span className="text-primary">Conditions</span>
                </h1>
                <p className="text-muted-foreground font-medium">Last Updated: April 2026</p>
            </div>

            <div className="space-y-8 text-foreground/80 leading-relaxed">
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground">1. Acceptance of Terms</h2>
                    <p>By accessing and using Stacq.in, you agree to be bound by these terms. If you do not agree to these terms, please do not use our services.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground">2. User Accounts</h2>
                    <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground">3. Content Curation</h2>
                    <p>Users are solely responsible for the links and descriptions they curate on Stacq. We reserve the right to remove any content that violates our community standards, including spam, abusive content, or copyrighted material without permission.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground">4. Intellectual Property</h2>
                    <p>All content included on the site, such as text, graphics, logos, and software, is the property of Stacq or its content suppliers and protected by international copyright laws.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground">5. Limitation of Liability</h2>
                    <p>Stacq shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>
                </section>
            </div>
        </div>
    )
}
