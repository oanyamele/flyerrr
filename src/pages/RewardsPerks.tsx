import { ArrowLeft, Award, Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/contexts/FollowContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { fetchUserStats, type UserStats } from "@/data/repository";
import { EmptyState, ErrorState, StatGridSkeleton } from "@/components/states/DataStates";

const buildBadges = (s: UserStats, follows: number) => [
  { name: "First Timer", desc: "Attend your first event", earned: s.eventsAttended >= 1, icon: "1" },
  { name: "Regular", desc: "Attend 5 events", earned: s.eventsAttended >= 5, icon: "5" },
  { name: "Dedicated", desc: "Attend 10 events", earned: s.eventsAttended >= 10, icon: "10" },
  { name: "Event Veteran", desc: "Attend 25 events", earned: s.eventsAttended >= 25, icon: "25" },
  { name: "Streak Starter", desc: "Attend events in 3 different weeks", earned: s.distinctWeeks >= 3, icon: "3w" },
  { name: "Month Warrior", desc: "Attend events in 4 different weeks", earned: s.distinctWeeks >= 4, icon: "4w" },
  { name: "Explorer", desc: "Attend events in 3 different categories", earned: s.categoriesAttended >= 3, icon: "E" },
  { name: "Social Butterfly", desc: "Follow 10 organizations", earned: follows >= 10, icon: "S" },
];

const RewardsPerks = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { followedOrgIds } = useFollow();
  const userId = auth.userId ?? null;
  const query = useAsyncData(() => fetchUserStats(userId), [userId]);

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
          <button type="button" aria-label="Go back" onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft aria-hidden="true" className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Rewards & Perks</h1>
        </div>
      </header>

      <div className="px-5 py-4">
        {query.status === "loading" && (
          <div className="space-y-5">
            <Skeleton className="h-36 w-full rounded-2xl" />
            <StatGridSkeleton count={6} />
          </div>
        )}
        {query.status === "error" && <ErrorState description="We couldn't load your rewards." onRetry={query.retry} />}
        {query.status === "success" && (() => {
          const badges = buildBadges(query.data, followedOrgIds.length);
          const earned = badges.filter((b) => b.earned).length;
          return (
            <>
              {query.data.points === 0 ? (
                <EmptyState
                  className="mb-5"
                  icon={Sparkles}
                  title="You haven't earned any points yet."
                  description="Check in at campus events to earn points and unlock the badges below."
                  action={<Button onClick={() => navigate("/")} className="rounded-xl">Find an event</Button>}
                />
              ) : (
                <div className="p-4 rounded-2xl bg-card border border-border mb-5 text-center">
                  <Award className="w-8 h-8 text-warning mx-auto mb-2" />
                  <p className="text-2xl font-extrabold text-foreground">{query.data.points}</p>
                  <p className="text-xs text-muted-foreground">Total Points Earned</p>
                  <p className="text-xs text-muted-foreground mt-1">{earned}/{badges.length} badges unlocked</p>
                </div>
              )}

              <h2 className="text-sm font-bold text-foreground mb-3">Badges</h2>
              <div className="grid grid-cols-2 gap-3">
                {badges.map((badge) => (
                  <div
                    key={badge.name}
                    className={`p-4 rounded-2xl border ${badge.earned ? "bg-card border-primary/30" : "bg-surface-sunken border-border opacity-60"}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold mb-2 ${badge.earned ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {badge.earned ? badge.icon : <Lock className="w-4 h-4" />}
                    </div>
                    <p className="text-sm font-bold text-foreground">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">{badge.desc}</p>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default RewardsPerks;
