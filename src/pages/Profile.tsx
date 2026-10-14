import { Settings, ChevronRight, Trophy, Calendar, Star, TrendingUp, Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";

const stats = [
  { icon: Calendar, label: "Events Attended", value: "23", color: "text-primary" },
  { icon: Trophy, label: "Points Earned", value: "450", color: "text-warning" },
  { icon: Star, label: "Orgs Following", value: "8", color: "text-accent" },
  { icon: TrendingUp, label: "Streak", value: "5 weeks", color: "text-success" },
];

const Profile = () => {
  const { auth, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const menuItems = [
    { label: "My Attendance History", path: "/attendance-history" },
    { label: "Rewards & Perks", path: "/rewards" },
    { label: "Resume Builder", path: "/resume-builder" },
    { label: "Notification Settings", path: "/notification-settings" },
    ...(auth.role === "org_officer"
      ? [
          { label: "Organization Verification Queue", path: "/org-verification-queue" },
          { label: "Attendance Reporting", path: "/attendance-reports" },
        ]
      : []),
    { label: "Privacy & Security", path: "" },
    { label: "Help & Support", path: "" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-foreground">Profile</h1>
        <button type="button" aria-label="Settings" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <Settings aria-hidden="true" className="w-5 h-5 text-foreground" />
        </button>
      </header>

      {/* Profile Card */}
      <div className="mx-5 p-5 rounded-3xl bg-card border border-border shadow-sm mb-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
            {auth.userName ? auth.userName.split(" ").map(n => n[0]).join("").toUpperCase() : "JD"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{auth.userName || "Jordan Davis"}</h2>
            <p className="text-sm text-muted-foreground">
              {auth.role === "org_officer" ? "Organization Officer" : "Computer Science - Class of '27"}
            </p>
            <p className="text-xs text-muted-foreground">Howard University</p>
          </div>
        </div>
        <Button variant="outline" className="w-full rounded-xl text-sm font-semibold">
          Edit Profile
        </Button>
      </div>

      {/* Dark Mode Toggle */}
      <div className="mx-5 mb-5 p-4 rounded-2xl bg-card border border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          {theme === "dark" ? (
            <Moon aria-hidden="true" className="w-5 h-5 text-accent" />
          ) : (
            <Sun aria-hidden="true" className="w-5 h-5 text-warning" />
          )}
          <div>
            <p id="dark-mode-label" className="text-sm font-semibold text-foreground">
              Dark Mode
            </p>
            <p className="text-xs text-muted-foreground">{theme === "dark" ? "On" : "Off"}</p>
          </div>
        </div>
        <Switch
          id="dark-mode"
          checked={theme === "dark"}
          onCheckedChange={toggleTheme}
          aria-labelledby="dark-mode-label"
          aria-label="Toggle dark mode"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 px-5 mb-5">
        {stats.map((s) => (
          <div key={s.label} className="p-4 rounded-2xl bg-card border border-border">
            <s.icon aria-hidden="true" className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="mx-5 rounded-2xl bg-card border border-border overflow-hidden mb-5">
        {menuItems.map((item, i) => (
          <button
            key={item.label}
            type="button"
            onClick={() => item.path && navigate(item.path)}
            className={`w-full flex items-center justify-between px-4 py-3.5 text-left tap-highlight-none ${
              i < menuItems.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <span className="text-sm font-medium text-foreground">{item.label}</span>
            <ChevronRight aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="mx-5">
        <Button
          variant="outline"
          className="w-full rounded-xl text-sm font-semibold text-destructive border-destructive/30"
          onClick={() => { logout(); navigate("/login"); }}
        >
          <LogOut aria-hidden="true" className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
