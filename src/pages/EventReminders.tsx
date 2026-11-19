import { ArrowLeft, BellRing, CalendarClock, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRepositories } from "@/repositories/useRepositories";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

const EventReminders = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { events: eventRepository, attendance } = useRepositories();
  const events = eventRepository.listEvents();
  const userId = auth.userId ?? "guest";
  const [reminderMap, setReminderMap] = useState(() => attendance.reminderMapForUser(userId));
  const reminders = attendance.reminderEvents(events, userId).slice(0, 8);

  const toggleReminder = (eventId: string) => {
    const current = reminderMap[eventId] !== false;
    const next = !current;
    void attendance.setReminderEnabled(eventId, userId, next);
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
        {reminders.length === 0 && (
          <article className="rounded-[12px] border border-border bg-card p-4 text-sm text-muted-foreground">
            RSVP to events first, then reminders will appear here.
          </article>
        )}
        {reminders.map((event) => (
          <article key={event.id} className="rounded-[12px] border border-border bg-card p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <p className="text-[15px] font-medium text-foreground">{event.title}</p>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold text-accent-foreground">
                  Reminder
                </span>
                <Switch
                  checked={reminderMap[event.id] !== false}
                  onCheckedChange={() => toggleReminder(event.id)}
                />
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5 text-primary" />
                {event.date} at {event.time}
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {event.location}
              </p>
              <p className="flex items-center gap-1.5">
                <BellRing className="h-3.5 w-3.5 text-primary" />
                Reminder set for 1 hour before start
              </p>
            </div>
          </article>
        ))}
      </main>
    </div>
  );
};

export default EventReminders;
