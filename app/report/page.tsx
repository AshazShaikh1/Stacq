import { Metadata } from "next"
import { ReportContent } from "@/components/static/report-content"

export const metadata: Metadata = {
    title: "Report | Stacq",
    description: "Report a link or user on Stacq.",
}

export default function ReportPage() {
    return <ReportContent />
}