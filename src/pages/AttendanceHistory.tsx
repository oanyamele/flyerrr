import { ArrowLeft, CheckCircle2, Calendar, CalendarX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { fetchAttendanceForUser } from "@/data/repository";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/states/DataStates";

const AttendanceHistory = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const userId = auth.userId ?? null;
  const query = useAsyncData(() => fetchAttendanceForUser(userId), [userId]);

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
          <button type="button" aria-label="Go back" onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft aria-hidden="true" className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Attendance History</h1>
        </div>
      </header>

      <div className="px-5 py-4">
        {query.status === "loading" && <ListSkeleton rows={5} />}
        {query.status === "error" && (
          <ErrorState description="We couldn't load your attendance history." onRetry={query.retry} />
        )}
        {query.status === "success" && query.data.length === 0 && (
          <EmptyState
            icon={CalendarX}
            title="You haven't attended any events yet."
            description="Tap in at an event and it will show up here with the points you earned."
            action={<Button onClick={() => navigate("/")} className="rounded-xl">Browse events</Button>}
          />
        )}
        {query.status === "success" && query.data.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <p className="text-sm font-semibold text-foreground">{query.data.length} events attended</p>
            </div>
            <div className="space-y-3">
              {query.data.map((r) => {
                const at = new Date(r.checkedInAt);
                return (
                  <div key={r.id} className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
                    <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{r.eventTitle}</p>
                      <p className="text-xs text-muted-foreground">{r.orgName}</p>
                      <p className="text-xs text-muted-foreground">
                        {at.toLocaleDateString()} - Tapped in at {at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-success whitespace-nowrap">+{r.pointsAwarded} pts</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceHistory;
