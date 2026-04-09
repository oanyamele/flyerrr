import { useState } from "react";
import { Bell } from "lucide-react";
import CategoryFilter from "@/components/CategoryFilter";
import EventCard from "@/components/EventCard";
import WeeklyDigest from "@/components/WeeklyDigest";
import BottomNav from "@/components/BottomNav";
import { mockEvents, type EventCategory } from "@/data/mockEvents";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<EventCategory | "all">("all");

  const filtered = activeCategory === "all"
    ? mockEvents
    : mockEvents.filter((e) => e.category === activeCategory);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">flyerrr</h1>
            <p className="text-xs text-muted-foreground">Discover what's happening on campus</p>
          </div>
          <button className="relative w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
          </button>
        </div>
        <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
      </header>

      {/* Weekly Digest */}
      <WeeklyDigest />

      {/* Event Feed */}
      <div className="snap-y snap-mandatory">
        {filtered.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg font-semibold">No events found</p>
          <p className="text-sm">Try a different category</p>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Index;
