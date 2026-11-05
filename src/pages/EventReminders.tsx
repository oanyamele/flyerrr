import { ArrowLeft, BellOff, BellRing, CalendarClock, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getReminderMapForUser, setReminderEnabled } from "@/data/checkInStore";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAsyncData } from "@/hooks/useAsyncData";
import { fetchReminderEvents } from "@/data/repository";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/states/DataStates";

const EventReminders = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const userId = auth.userId ?? "guest";
  // Fetched once per user; toggling keeps the row visible so it can be re-enabled.
  const query = useAsyncData(() => fetchReminderEvents(userId), [userId]);
  const [reminderMap, setReminderMap] = useState(() => getReminderMapForUser(userId));

  const toggleReminder = (eventId: string) => {
    const next = reminderMap[eventId] === false;
    setReminderEnabled(eventId, userId, next);
    setReminderMap((prev) => ({ ...prev, [eventId]: next }));
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
          <button type="button" aria-label="Go back" onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20">
            <ArrowLeft aria-hidden="true" className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-medium text-foreground">Event Reminders</h1>
            <p className="text-xs text-muted-foreground">Upcoming events and check-in reminders</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-3 px-4 py-4 sm:px-6">
        {query.status === "loading" && <ListSkeleton rows={3} thumb={false} />}
        {query.status === "error" && <ErrorState description="We couldn't load your reminders." onRetry={query.retry} />}
        {query.status === "success" && query.data.length === 0 && (
          <EmptyState
            icon={BellOff}
            title="No reminders yet"
            description="RSVP to an event and we'll remind you 1 hour before it starts."
            action={<Button onClick={() => navigate("/")} className="rounded-xl">Browse events</Button>}
          />
        )}
        {query.status === "success" &&
          query.data.slice(0, 8).map((event) => (
            <article key={event.id} className="rounded-[12px] border border-border bg-card p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <p className="text-[15px] font-medium text-foreground">{event.title}</p>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold text-accent-foreground">Reminder</span>
                  <Switch
                    aria-label={`Reminder for ${event.title}`}
                    checked={reminderMap[event.id] !== false}
                    onCheckedChange={() => toggleReminder(event.id)}
                  />
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-primary" />{event.date} at {event.time}</p>
                <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" />{event.location}</p>
                <p className="flex items-center gap-1.5"><BellRing className="h-3.5 w-3.5 text-primary" />Reminder set for 1 hour before start</p>
              </div>
            </article>
          ))}
      </main>
    </div>
  );
};

export default EventReminders;
