import { Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsyncData } from "@/hooks/useAsyncData";
import { fetchSavedEvents } from "@/data/repository";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/states/DataStates";

const Saved = () => {
  const navigate = useNavigate();
  const query = useAsyncData(fetchSavedEvents);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4">
        <h1 className="text-2xl font-extrabold text-foreground">Saved</h1>
        {query.status === "success" ? (
          <p className="text-sm text-muted-foreground">{query.data.length} saved events</p>
        ) : (
          <Skeleton className="mt-1 h-4 w-28" />
        )}
      </header>

      <div className="px-5">
        {query.status === "loading" && <ListSkeleton rows={4} />}
        {query.status === "error" && <ErrorState description="We couldn't load your saved events." onRetry={query.retry} />}
        {query.status === "success" && query.data.length === 0 && (
          <EmptyState
            icon={Bookmark}
            title="No saved events yet"
            description="Bookmark events you're interested in to find them quickly later."
            action={<Button onClick={() => navigate("/")} className="rounded-xl">Browse events</Button>}
          />
        )}
        {query.status === "success" && query.data.length > 0 && (
          <div className="space-y-3">
            {query.data.map((e) => (
              <button
                key={e.id}
                onClick={() => navigate(`/event/${e.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border text-left tap-highlight-none"
              >
                <img src={e.image} alt={e.title} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.org.name}</p>
                  <p className="text-xs text-muted-foreground">{e.date} · {e.time}</p>
                </div>
                <Bookmark className="w-5 h-5 text-primary fill-primary flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Saved;
