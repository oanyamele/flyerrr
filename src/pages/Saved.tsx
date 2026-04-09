import { Bookmark } from "lucide-react";
import { mockEvents } from "@/data/mockEvents";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const Saved = () => {
  const navigate = useNavigate();
  const savedEvents = mockEvents.filter((e) => e.saved);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4">
        <h1 className="text-2xl font-extrabold text-foreground">Saved</h1>
        <p className="text-sm text-muted-foreground">{savedEvents.length} saved events</p>
      </header>

      {savedEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Bookmark className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No saved events yet</p>
        </div>
      ) : (
        <div className="px-5 space-y-3">
          {savedEvents.map((e) => (
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

      <BottomNav />
    </div>
  );
};

export default Saved;
