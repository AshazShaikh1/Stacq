import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReportsList } from "@/components/admin/ReportsList";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check admin role
  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userProfile?.role !== "admin") redirect("/");

  const resolvedSearchParams = await searchParams;
  const currentStatus = resolvedSearchParams.status || "open";

  // Fetch reports with counts for tabs
  const { data: rawReports, error } = await supabase
    .from("reports")
    .select(
      `
      id, reporter_id, target_type, target_id, reason, data, status, created_at,
      reporter:users!reports_reporter_id_fkey ( id, username, display_name, avatar_url )
    `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) console.error("Error fetching reports:", error);

  const reports = (rawReports || []).map((report: any) => ({
    ...report,
    reporter: Array.isArray(report.reporter)
      ? report.reporter[0]
      : report.reporter,
  }));

  // Calculate counts for tabs
  const counts = {
    open: reports.filter((r: any) => r.status === "open").length,
    resolved: reports.filter((r: any) => r.status === "resolved").length,
    dismissed: reports.filter((r: any) => r.status === "dismissed").length,
  };

  const filteredReports = reports.filter(
    (r: any) => r.status === currentStatus
  );

  return (
    <div className="container mx-auto px-page py-section max-w-6xl">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-jet-dark mb-2">
            Moderation Queue
          </h1>
          <p className="text-gray-muted">
            Review and take action on user reports.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-light mb-8">
        {["open", "resolved", "dismissed"].map((tab) => (
          <Link
            key={tab}
            href={`/admin/reports?status=${tab}`}
            className={`
              px-6 py-3 text-sm font-medium border-b-2 transition-colors relative top-[2px]
              ${
                currentStatus === tab
                  ? "border-emerald text-emerald"
                  : "border-transparent text-gray-500 hover:text-jet-dark hover:border-gray-300"
              }
            `}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                currentStatus === tab
                  ? "bg-emerald/10 text-emerald"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {counts[tab as keyof typeof counts]}
            </span>
          </Link>
        ))}
      </div>

      {filteredReports.length > 0 ? (
        <ReportsList
          initialReports={filteredReports}
          initialStatus={currentStatus}
        />
      ) : (
        <Card className="p-12 text-center border-dashed border-2 border-gray-200 shadow-none bg-gray-50/50">
          <div className="text-4xl mb-4">✨</div>
          <h3 className="text-lg font-bold text-jet-dark mb-1">All clear!</h3>
          <p className="text-gray-muted">No {currentStatus} reports found.</p>
        </Card>
      )}
    </div>
  );
}
