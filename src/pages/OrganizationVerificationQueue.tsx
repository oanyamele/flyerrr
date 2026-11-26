import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Building2, Clock3, FileCheck2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError, useHttpBackend } from "@/services/httpApi";
import { decideVerification, fetchVerificationQueue, verificationQueueKey, type VerificationStatus } from "@/services/orgVerificationApi";

interface QueueItem {
  id: string;
  orgName: string;
  submittedBy: string;
  submittedAt: string;
  schoolEmail: string;
  status: VerificationStatus;
  /** Only the offline demo data records what proof was sent. */
  proofType?: "Student Life Letter" | "Faculty Sponsor Letter" | "Org Charter";
  decidedBy?: string | null;
  canDecide: boolean;
}

// Demo data for the offline (browser-only) build. With the server, the queue comes from the API.
const initialQueue: QueueItem[] = [
  {
    id: "v1",
    orgName: "Women in Product",
    submittedBy: "Mina Hayes",
    submittedAt: "2026-04-12T10:15:00.000Z",
    schoolEmail: "wip@howard.edu",
    proofType: "Student Life Letter",
    status: "pending",
    canDecide: true,
  },
  {
    id: "v2",
    orgName: "Green Campus Initiative",
    submittedBy: "Rory Smith",
    submittedAt: "2026-04-11T16:30:00.000Z",
    schoolEmail: "gci@howard.edu",
    proofType: "Org Charter",
    status: "pending",
    canDecide: true,
  },
  {
    id: "v3",
    orgName: "Pre-Law Society",
    submittedBy: "Avery Collins",
    submittedAt: "2026-04-09T13:04:00.000Z",
    schoolEmail: "prelaw@howard.edu",
    proofType: "Faculty Sponsor Letter",
    status: "approved",
    canDecide: true,
  },
];

interface QueueViewProps {
  items: QueueItem[];
  loading?: boolean;
  /** Set when the queue could not be loaded, or a decision could not be saved. */
  error?: string | null;
  onRetry?: () => void;
  pendingId?: string | null;
  onDecide: (id: string, status: "approved" | "rejected") => void;
}

const QueueView = ({ items, loading, error, onRetry, pendingId, onDecide }: QueueViewProps) => {
  const navigate = useNavigate();
  const pendingCount = useMemo(() => items.filter((item) => item.status === "pending").length, [items]);

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-3xl px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Go back" onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <ArrowLeft aria-hidden="true" className="h-5 w-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground sm:text-xl">Organization Verification Queue</h1>
              <p className="text-xs text-muted-foreground sm:text-sm">{loading ? "Loading…" : `${pendingCount} pending review`}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-3 px-4 py-4 sm:px-6">
        {error && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <p>{error}</p>
            {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>}
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">No organizations to review.</p>
        )}
        {items.map((item) => (
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
              {item.proofType && (
                <p className="flex items-center gap-2 sm:col-span-2">
                  <FileCheck2 className="h-3.5 w-3.5 text-primary" />
                  Proof: {item.proofType}
                </p>
              )}
              {item.decidedBy && item.status !== "pending" && (
                <p className="flex items-center gap-2 sm:col-span-2">
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                  Last decided by {item.decidedBy}
                </p>
              )}
            </div>

            {item.canDecide ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  className="w-full border-success/30 text-success hover:bg-success/10"
                  onClick={() => onDecide(item.id, "approved")}
                  disabled={item.status === "approved" || pendingId === item.id}
                >
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => onDecide(item.id, "rejected")}
                  disabled={item.status === "rejected" || pendingId === item.id}
                >
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">You lead this organization, so another officer needs to review it.</p>
            )}
          </article>
        ))}
      </main>
    </div>
  );
};

const LocalQueue = () => {
  const [queue, setQueue] = useState(initialQueue);
  return (
    <QueueView
      items={queue}
      onDecide={(id, status) => setQueue((current) => current.map((item) => (item.id === id ? { ...item, status } : item)))}
    />
  );
};

const messageFor = (error: unknown, fallback: string) =>
  error instanceof ApiError && error.status === 403 ? error.message : fallback;

const ServerQueue = () => {
  const client = useQueryClient();
  const queue = useQuery({ queryKey: verificationQueueKey, queryFn: fetchVerificationQueue });
  const decide = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approved" | "rejected" }) => decideVerification(id, decision),
    // The server keeps the record; refetch so the list shows what it saved, including a
    // decision another officer made in the meantime.
    onSettled: () => client.invalidateQueries({ queryKey: verificationQueueKey }),
  });

  const error = queue.isError
    ? messageFor(queue.error, "Could not load the verification queue.")
    : decide.isError
    ? messageFor(decide.error, "Could not save that decision. Try again.")
    : null;

  return (
    <QueueView
      items={queue.data ?? []}
      loading={queue.isPending}
      error={error}
      onRetry={queue.isError ? () => void queue.refetch() : undefined}
      pendingId={decide.isPending ? decide.variables.id : null}
      onDecide={(id, decision) => decide.mutate({ id, decision })}
    />
  );
};

const OrganizationVerificationQueue = () => (useHttpBackend ? <ServerQueue /> : <LocalQueue />);

export default OrganizationVerificationQueue;
