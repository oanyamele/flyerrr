import { useState } from "react";
import { Bell, CalendarDays, Moon, Plus, Send, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import CategoryFilter from "@/components/CategoryFilter";
import EventCard from "@/components/EventCard";
import WeeklyDigest from "@/components/WeeklyDigest";
import BottomNav from "@/components/BottomNav";
import { type EventCategory } from "@/data/mockEvents";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/contexts/FollowContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchEvents } from "@/data/repository";
import { useAsyncData } from "@/hooks/useAsyncData";
import { EmptyState, ErrorState, EventCardSkeleton } from "@/components/states/DataStates";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<EventCategory | "all" | "following">("all");
  const { auth } = useAuth();
  const { followedOrgIds } = useFollow();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const query = useAsyncData(fetchEvents, [location.key]);
  const events = query.status === "success" ? query.data : [];

  const filtered =
    activeCategory === "following"
      ? events.filter((e) => followedOrgIds.includes(e.org.id))
      : activeCategory === "all"
      ? events
      : events.filter((e) => e.category === activeCategory);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex-1" />
          <h1 className="flex items-center gap-2 text-3xl font-medium tracking-tight text-primary">
            <Send className="h-6 w-6 rotate-12" />
            <span>flyer</span>
          </h1>
          <div className="flex flex-1 justify-end gap-2">
            {auth.role === "org_officer" && (
              <button
                type="button"
                onClick={() => navigate("/create-event")}
                aria-label="Create event"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary"
              >
                <Plus aria-hidden="true" className="h-5 w-5 text-primary-foreground" />
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary/20"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="h-5 w-5 text-foreground" /> : <Moon className="h-5 w-5 text-foreground" />}
            </button>
            <button
              onClick={() => navigate("/event-reminders")}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
              aria-label="Open event reminders"
              title="Event reminders"
            >
              <Bell aria-hidden="true" className="h-5 w-5 text-foreground" />
              <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-accent" />
            </button>
          </div>
        </div>
        <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
      </header>

      <WeeklyDigest />

      {query.status === "loading" && <EventCardSkeleton count={3} />}

      {query.status === "error" && (
        <div className="px-5 pt-4">
          <ErrorState description="We couldn't load the events feed." onRetry={query.retry} />
        </div>
      )}

      {query.status === "success" && (
        <div className="mx-auto max-w-3xl snap-y snap-mandatory pt-2 sm:pt-3">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {query.status === "success" && filtered.length === 0 && (
        <div className="px-5 pt-4">
          {activeCategory === "following" ? (
            <EmptyState
              icon={CalendarDays}
              title={followedOrgIds.length === 0 ? "You haven't followed any clubs yet." : "No events from your organizations"}
              description={followedOrgIds.length === 0 ? "Follow clubs on Explore to see their events here." : "The clubs you follow haven't posted any events yet."}
              action={
                <Button onClick={() => navigate("/explore")} className="rounded-xl">
                  Explore organizations
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No events available yet."
              description="Check back soon — campus events will show up here."
            />
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Index;
