import {
  AlertCircle,
  CalendarDays,
  MapPin,
  Search as SearchIcon,
  SearchX,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listEventRecords, type EventRecord } from "@/data/appDatabase";
import { mockOrgs } from "@/data/mockEvents";
import { searchEvents } from "@/lib/searchEvents";

const TRENDING_SEARCHES = [
  "career fair",
  "hackathon",
  "game night",
  "open gym",
  "free food",
] as const;

type EventLoadState =
  | { status: "ready"; events: EventRecord[] }
  | { status: "error"; message: string };

const loadEvents = (): EventLoadState => {
  try {
    return { status: "ready", events: listEventRecords() };
  } catch (error: unknown) {
    console.error("Unable to load events for Explore", error);
    return {
      status: "error",
      message: "Events could not be loaded. Your saved data has not been changed.",
    };
  }
};

const Explore = () => {
  const [search, setSearch] = useState("");
  const [eventState, setEventState] = useState<EventLoadState>(loadEvents);
  const navigate = useNavigate();

  const events = eventState.status === "ready" ? eventState.events : [];
  const query = search.trim();
  const filteredEvents = searchEvents(events, search);
  const suggestedEvents = events.slice(0, 3);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border/70 bg-card/70 px-5 pb-5 pt-[max(1.5rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="mx-auto max-w-3xl">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Campus discovery
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Find your next event</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search every published event by title, organization, location, or tag.
          </p>

          <div className="relative mt-5">
            <SearchIcon
              aria-hidden="true"
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Search events, organizations, locations, or tags"
              placeholder="Search events, organizations, or tags"
              className="h-12 rounded-2xl border-border bg-background pl-11 pr-11 shadow-sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search.length > 0 && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Clear search"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide" aria-label="Trending searches">
            {TRENDING_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setSearch(term)}
                className="whitespace-nowrap rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-6">
        {eventState.status === "error" ? (
          <section
            className="rounded-2xl border border-destructive/25 bg-destructive/5 p-6 text-center"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mx-auto mb-3 h-8 w-8 text-destructive" />
            <h2 className="font-semibold text-foreground">Explore is temporarily unavailable</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{eventState.message}</p>
            <Button className="mt-4" variant="outline" onClick={() => setEventState(loadEvents())}>
              Try again
            </Button>
          </section>
        ) : query ? (
          <section aria-labelledby="search-results-heading">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Search results</p>
                <h2 id="search-results-heading" className="text-lg font-bold text-foreground">
                  {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"} for “{query}”
                </h2>
              </div>
            </div>

            {filteredEvents.length > 0 ? (
              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => navigate(`/event/${event.id}`)}
                    className="group flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <img
                      src={event.image}
                      alt=""
                      className="h-20 w-20 flex-none rounded-xl bg-surface-sunken object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="mb-1 flex items-center gap-2">
                        <Badge variant="secondary" className="border-0 text-[10px] capitalize">
                          {event.category}
                        </Badge>
                        <span className="truncate text-xs text-muted-foreground">{event.org.name}</span>
                      </span>
                      <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary">
                        {event.title}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                          {event.date} · {event.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                          {event.location}
                        </span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
                <SearchX aria-hidden="true" className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
                <h3 className="font-semibold text-foreground">No events match “{query}”</h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Try an organization name, location, or one of the suggested searches above.
                </p>
                <Button className="mt-4" variant="outline" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              </div>
            )}
          </section>
        ) : (
          <div className="space-y-8">
            <section aria-labelledby="suggested-heading">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles aria-hidden="true" className="h-4 w-4 text-primary" />
                <h2 id="suggested-heading" className="text-base font-bold text-foreground">
                  Suggested for you
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {suggestedEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => navigate(`/event/${event.id}`)}
                    className="overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <img src={event.image} alt="" className="aspect-[16/10] w-full bg-surface-sunken object-cover" />
                    <span className="block p-3">
                      <span className="block truncate text-sm font-semibold text-foreground">{event.title}</span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">
                        {event.org.name} · {event.date}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section aria-labelledby="trending-heading">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp aria-hidden="true" className="h-4 w-4 text-primary" />
                <h2 id="trending-heading" className="text-base font-bold text-foreground">Trending now</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Pick a suggested search above to jump into what students are looking for.
              </p>
            </section>

            <section aria-labelledby="organizations-heading">
              <div className="mb-3 flex items-center gap-2">
                <Users aria-hidden="true" className="h-4 w-4 text-primary" />
                <h2 id="organizations-heading" className="text-base font-bold text-foreground">
                  Popular organizations
                </h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {mockOrgs.map((org) => (
                  <div
                    key={org.id}
                    className="flex min-w-[96px] flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-base font-bold text-primary">
                      {org.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="w-20 truncate text-xs font-semibold text-foreground">{org.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {org.followerCount.toLocaleString()} followers
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Explore;
