import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Privacy Policy | Stacq",
    description: "How we handle your data at Stacq.",
}

export default function PrivacyPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-24 space-y-12">
            <div className="space-y-4">
                <h1 className="text-4xl font-black tracking-tight text-foreground">
                    Privacy <span className="text-primary">Policy</span>
                </h1>
                <p className="text-muted-foreground font-medium">Last Updated: April 2026</p>
            </div>

            <div className="space-y-8 text-foreground/80 leading-relaxed">
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground">1. Information We Collect</h2>
                    <p>We collect information you provide directly to us, such as when you create an account, curate content, or communicate with us. This includes your username, email address, and any links you bookmark.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground">2. How We Use Your Information</h2>
                    <p>We use the information we collect to provide, maintain, and improve our services, to personalize your experience, and to communicate with you about your account and updates to our service.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground">3. Sharing of Information</h2>
                    <p>We do not share your personal information with third parties except as necessary to provide our service, comply with the law, or protect our rights.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground">4. Data Security</h2>
                    <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground">5. Your Choices</h2>
                    <p>You can update or delete your account information at any time by logging into your account settings. You can also request that we delete all your personal data by contacting us.</p>
                </section>
            </div>
        </div>
    )
}
