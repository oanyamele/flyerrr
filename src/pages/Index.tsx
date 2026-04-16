import { useState } from "react";
import { Bell, Plus, Send } from "lucide-react";
import CategoryFilter from "@/components/CategoryFilter";
import EventCard from "@/components/EventCard";
import WeeklyDigest from "@/components/WeeklyDigest";
import BottomNav from "@/components/BottomNav";
import { type EventCategory } from "@/data/mockEvents";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/contexts/FollowContext";
import { useNavigate } from "react-router-dom";
import { listEventRecords } from "@/data/appDatabase";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<EventCategory | "all" | "following">("all");
  const { auth } = useAuth();
  const { followedOrgIds } = useFollow();
  const navigate = useNavigate();
  const events = listEventRecords();

  const filtered = activeCategory === "following"
    ? events.filter((e) => followedOrgIds.includes(e.org.id))
    : activeCategory === "all"
    ? events
    : events.filter((e) => e.category === activeCategory);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
          <div className="flex-1" />
          <h1 className="flex items-center gap-2 text-3xl font-extrabold text-primary tracking-tight">
            <Send className="h-6 w-6 rotate-12" />
            <span>flyer</span>
          </h1>
          <div className="flex-1 flex justify-end gap-2">
            {auth.role === "org_officer" && (
              <button
                onClick={() => navigate("/create-event")}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
              >
                <Plus className="w-5 h-5 text-primary-foreground" />
              </button>
            )}
            <button className="relative w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-background" />
            </button>
          </div>
        </div>
        <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
      </header>

      {/* Weekly Digest */}
      <WeeklyDigest />

      {/* Event Feed */}
      <div className="mx-auto max-w-3xl snap-y snap-mandatory">
        {filtered.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg font-semibold">No events found</p>
          <p className="text-sm">
            {activeCategory === "following" ? "Follow organizations to see their events here" : "Try a different category"}
          </p>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Index;
