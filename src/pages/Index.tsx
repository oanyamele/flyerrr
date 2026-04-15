import { useState } from "react";
import EventCard from "@/components/EventCard";
import BottomNav from "@/components/BottomNav";
import { mockEvents, type EventCategory } from "@/data/mockEvents";
import { useFollow } from "@/contexts/FollowContext";
import { useNavigate } from "react-router-dom";
import FilterBar from "@/components/FilterBar";
import EventDetailModal from "@/components/EventDetailModal";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<EventCategory | "all" | "following">("all");
  const { followedOrgIds } = useFollow();
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const filtered = activeCategory === "following"
    ? mockEvents.filter((e) => followedOrgIds.includes(e.org.id))
    : activeCategory === "all"
    ? mockEvents
    : mockEvents.filter((e) => e.category === activeCategory);

  const selectedEvent = selectedEventId ? mockEvents.find((e) => e.id === selectedEventId) : undefined;

  return (
    <div className="relative h-[100svh] bg-background">
      <FilterBar selectedCategory={activeCategory} onCategoryChange={setActiveCategory} />

      <div className="snap-container hide-scrollbar h-[100svh]">
        {filtered.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onOpenDetail={() => setSelectedEventId(event.id)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="h-[100svh] flex flex-col items-center justify-center text-muted-foreground snap-item">
            <p className="text-lg font-semibold">No events found</p>
            <p className="text-sm">
              {activeCategory === "following" ? "Follow organizations to see their events here" : "Try a different category"}
            </p>
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEventId(null)}
          onOpenFullDetails={(event) => navigate(`/event/${event.id}`)}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default Index;
