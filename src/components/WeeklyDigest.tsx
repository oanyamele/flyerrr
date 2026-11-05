import { Calendar, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { fetchReminderEvents } from "@/data/repository";

const colors = ["bg-accent", "bg-success", "bg-primary"];

const WeeklyDigest = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const userId = auth.userId ?? "guest";
  const query = useAsyncData(() => fetchReminderEvents(userId), [userId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4 p-4 rounded-2xl bg-card border border-border shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Your Week</h3>
        </div>
        <button onClick={() => navigate("/event-reminders")} className="text-xs text-muted-foreground flex items-center gap-0.5">
          See all <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      {query.status === "loading" && (
        <div className="space-y-2" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-1 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}
      {query.status === "error" && (
        <div role="alert" className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Couldn't load your week.</span>
          <button onClick={query.retry} className="font-semibold text-primary">Retry</button>
        </div>
      )}
      {query.status === "success" && query.data.length === 0 && (
        <p className="text-xs text-muted-foreground">Nothing planned yet. RSVP to an event below and it'll show up here.</p>
      )}
      {query.status === "success" && query.data.length > 0 && (
        <div className="space-y-2">
          {query.data.slice(0, 3).map((e, i) => (
            <div key={e.id} className="flex items-center gap-3">
              <div className={`w-1 h-8 rounded-full ${colors[i % colors.length]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{e.title}</p>
                <p className="text-xs text-muted-foreground">{e.date} · {e.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default WeeklyDigest;
