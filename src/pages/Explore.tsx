import { Search as SearchIcon, TrendingUp, Users, Sparkles } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { mockOrgs, mockEvents } from "@/data/mockEvents";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";

const Explore = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filteredEvents = search
    ? mockEvents.filter(
        (e) =>
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.org.name.toLowerCase().includes(search.toLowerCase()) ||
          e.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-2">
        <h1 className="text-2xl font-extrabold text-foreground mb-3">Explore</h1>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events, orgs, or tags..."
            className="pl-9 rounded-xl bg-secondary border-0 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {search && filteredEvents.length > 0 && (
        <div className="px-5 py-4 space-y-2">
          {filteredEvents.map((e) => (
            <button
              key={e.id}
              onClick={() => navigate(`/event/${e.id}`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border text-left tap-highlight-none"
            >
              <img src={e.image} alt={e.title} className="w-14 h-14 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{e.title}</p>
                <p className="text-xs text-muted-foreground">{e.org.name} · {e.date}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {!search && (
        <>
          {/* Trending */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Trending Now</h2>
            </div>
            <div className="flex gap-2 flex-wrap">
              {["career fair", "hackathon", "game night", "open gym", "free food"].map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setSearch(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Suggested for you */}
          <div className="px-5 py-2">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold text-foreground">Suggested for You</h2>
            </div>
            <div className="space-y-2">
              {mockEvents.slice(0, 3).map((e) => (
                <button
                  key={e.id}
                  onClick={() => navigate(`/event/${e.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border text-left tap-highlight-none"
                >
                  <img src={e.image} alt={e.title} className="w-14 h-14 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.org.name} · {e.date}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Popular Orgs */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Popular Organizations</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {mockOrgs.map((org) => (
                <div key={org.id} className="flex flex-col items-center gap-2 min-w-[80px]">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                    {org.avatar}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground truncate w-20">{org.name}</p>
                    <p className="text-[10px] text-muted-foreground">{org.followerCount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
};

export default Explore;
