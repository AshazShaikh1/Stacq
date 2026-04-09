import { Metadata } from "next"
import { ContactContent } from "@/components/static/contact-content"

export const metadata: Metadata = {
    title: "Contact | Stacq",
    description: "Get in touch with the Stacq team.",
}

export default function ContactPage() {
    return <ContactContent />
}