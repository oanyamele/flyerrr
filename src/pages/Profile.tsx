import { Settings, ChevronRight, Trophy, Calendar, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

const stats = [
  { icon: Calendar, label: "Events Attended", value: "23", color: "text-primary" },
  { icon: Trophy, label: "Points Earned", value: "450", color: "text-warning" },
  { icon: Star, label: "Orgs Following", value: "8", color: "text-accent" },
  { icon: TrendingUp, label: "Streak", value: "5 weeks", color: "text-success" },
];

const menuItems = [
  "My Attendance History",
  "Rewards & Perks",
  "Resume Builder",
  "Notification Settings",
  "Privacy & Security",
  "Help & Support",
];

const Profile = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-foreground">Profile</h1>
        <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <Settings className="w-5 h-5 text-foreground" />
        </button>
      </header>

      {/* Profile Card */}
      <div className="mx-5 p-5 rounded-3xl bg-card border border-border shadow-sm mb-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
            JD
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Jordan Davis</h2>
            <p className="text-sm text-muted-foreground">Computer Science · Class of '27</p>
            <p className="text-xs text-muted-foreground">Howard University</p>
          </div>
        </div>
        <Button variant="outline" className="w-full rounded-xl text-sm font-semibold">
          Edit Profile
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 px-5 mb-5">
        {stats.map((s) => (
          <div key={s.label} className="p-4 rounded-2xl bg-card border border-border">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="mx-5 rounded-2xl bg-card border border-border overflow-hidden">
        {menuItems.map((item, i) => (
          <button
            key={item}
            className={`w-full flex items-center justify-between px-4 py-3.5 text-left tap-highlight-none ${
              i < menuItems.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <span className="text-sm font-medium text-foreground">{item}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
