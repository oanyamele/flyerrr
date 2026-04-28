import { useState } from "react";
import { Bell, Moon, Plus, Send, Sun } from "lucide-react";
import CategoryFilter from "@/components/CategoryFilter";
import EventCard from "@/components/EventCard";
import WeeklyDigest from "@/components/WeeklyDigest";
import BottomNav from "@/components/BottomNav";
import { type EventCategory } from "@/data/mockEvents";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/contexts/FollowContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { listEventRecords } from "@/data/appDatabase";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<EventCategory | "all" | "following">("all");
  const { auth } = useAuth();
  const { followedOrgIds } = useFollow();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const events = listEventRecords();

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
                onClick={() => navigate("/create-event")}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary"
              >
                <Plus className="h-5 w-5 text-primary-foreground" />
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20 border border-border"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="h-5 w-5 text-foreground" /> : <Moon className="h-5 w-5 text-foreground" />}
            </button>
            <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <Bell className="h-5 w-5 text-foreground" />
              <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-accent" />
            </button>
          </div>
        </div>
        <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
      </header>

      <WeeklyDigest />

      <div className="mx-auto max-w-3xl snap-y snap-mandatory pt-2 sm:pt-3">
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
