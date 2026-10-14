import { ArrowLeft, Award, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const badges = [
  { name: "First Timer", desc: "Attend your first event", earned: true, icon: "1" },
  { name: "Regular", desc: "Attend 5 events", earned: true, icon: "5" },
  { name: "Dedicated", desc: "Attend 10 events", earned: false, icon: "10" },
  { name: "Event Veteran", desc: "Attend 25 events", earned: false, icon: "25" },
  { name: "Streak Starter", desc: "3-week attendance streak", earned: true, icon: "3w" },
  { name: "Month Warrior", desc: "Attend events 4 weeks in a row", earned: false, icon: "4w" },
  { name: "Explorer", desc: "Attend events in 3 different categories", earned: true, icon: "E" },
  { name: "Social Butterfly", desc: "Follow 10 organizations", earned: false, icon: "S" },
];

const RewardsPerks = () => {
  const navigate = useNavigate();
  const earned = badges.filter((b) => b.earned).length;

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
        <div className="p-4 rounded-2xl bg-card border border-border mb-5 text-center">
          <Award className="w-8 h-8 text-warning mx-auto mb-2" />
          <p className="text-2xl font-extrabold text-foreground">450</p>
          <p className="text-xs text-muted-foreground">Total Points Earned</p>
          <p className="text-xs text-muted-foreground mt-1">{earned}/{badges.length} badges unlocked</p>
        </div>

        <h2 className="text-sm font-bold text-foreground mb-3">Badges</h2>
        <div className="grid grid-cols-2 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.name}
              className={`p-4 rounded-2xl border ${
                badge.earned
                  ? "bg-card border-primary/30"
                  : "bg-surface-sunken border-border opacity-60"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold mb-2 ${
                badge.earned ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {badge.earned ? badge.icon : <Lock className="w-4 h-4" />}
              </div>
              <p className="text-sm font-bold text-foreground">{badge.name}</p>
              <p className="text-xs text-muted-foreground">{badge.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RewardsPerks;
