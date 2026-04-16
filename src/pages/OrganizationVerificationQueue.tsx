import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Building2, Clock3, FileCheck2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type VerificationStatus = "pending" | "approved" | "rejected";

interface VerificationRequest {
  id: string;
  orgName: string;
  submittedBy: string;
  submittedAt: string;
  schoolEmail: string;
  proofType: "Student Life Letter" | "Faculty Sponsor Letter" | "Org Charter";
  status: VerificationStatus;
}

const initialQueue: VerificationRequest[] = [
  {
    id: "v1",
    orgName: "Women in Product",
    submittedBy: "Mina Hayes",
    submittedAt: "2026-04-12T10:15:00.000Z",
    schoolEmail: "wip@howard.edu",
    proofType: "Student Life Letter",
    status: "pending",
  },
  {
    id: "v2",
    orgName: "Green Campus Initiative",
    submittedBy: "Rory Smith",
    submittedAt: "2026-04-11T16:30:00.000Z",
    schoolEmail: "gci@howard.edu",
    proofType: "Org Charter",
    status: "pending",
  },
  {
    id: "v3",
    orgName: "Pre-Law Society",
    submittedBy: "Avery Collins",
    submittedAt: "2026-04-09T13:04:00.000Z",
    schoolEmail: "prelaw@howard.edu",
    proofType: "Faculty Sponsor Letter",
    status: "approved",
  },
];

const OrganizationVerificationQueue = () => {
  const navigate = useNavigate();
  const [queue, setQueue] = useState(initialQueue);

  const pendingCount = useMemo(() => queue.filter((item) => item.status === "pending").length, [queue]);

  const setStatus = (id: string, status: VerificationStatus) => {
    setQueue((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-3xl px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground sm:text-xl">Organization Verification Queue</h1>
              <p className="text-xs text-muted-foreground sm:text-sm">{pendingCount} pending review</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-3 px-4 py-4 sm:px-6">
        {queue.map((item) => (
          <article key={item.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-foreground">{item.orgName}</p>
                <p className="text-xs text-muted-foreground">Submitted by {item.submittedBy}</p>
              </div>
              <div
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  item.status === "approved"
                    ? "bg-success/10 text-success"
                    : item.status === "rejected"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-warning/15 text-warning"
                }`}
              >
                {item.status}
              </div>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <p className="flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5 text-primary" />
                {new Date(item.submittedAt).toLocaleString()}
              </p>
              <p className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                {item.schoolEmail}
              </p>
              <p className="flex items-center gap-2 sm:col-span-2">
                <FileCheck2 className="h-3.5 w-3.5 text-primary" />
                Proof: {item.proofType}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="w-full border-success/30 text-success hover:bg-success/10"
                onClick={() => setStatus(item.id, "approved")}
                disabled={item.status === "approved"}
              >
                <BadgeCheck className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => setStatus(item.id, "rejected")}
                disabled={item.status === "rejected"}
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          </article>
        ))}
      </main>
    </div>
  );
};

export default OrganizationVerificationQueue;
