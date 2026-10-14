import { Home, Search, Smartphone, User, Bookmark, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const baseTabs = [
  { icon: Home, label: "Feed", path: "/" },
  { icon: Search, label: "Explore", path: "/explore" },
  { icon: Smartphone, label: "Tap In", path: "/tap-in" },
  { icon: Bookmark, label: "Saved", path: "/saved" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth } = useAuth();

  const tabs = auth.role === "org_officer"
    ? [
        { icon: Home, label: "Feed", path: "/" },
        { icon: Search, label: "Explore", path: "/explore" },
        { icon: Plus, label: "Create", path: "/create-event" },
        { icon: Smartphone, label: "Tap In", path: "/tap-in" },
        { icon: User, label: "Profile", path: "/profile" },
      ]
    : baseTabs;

  return (
    <nav aria-label="Primary" className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around max-w-lg mx-auto py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          const isCenter = (tab.label === "Tap In" && auth.role === "student") || (tab.label === "Create" && auth.role === "org_officer");
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => navigate(tab.path)}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 tap-highlight-none transition-colors ${
                isCenter
                  ? "relative"
                  : active
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {isCenter ? (
                <div className="relative -mt-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                    <tab.icon aria-hidden="true" className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
              ) : (
                <tab.icon aria-hidden="true" className="w-5 h-5" />
              )}
              <span className={`text-[10px] font-medium ${isCenter ? "text-primary" : ""}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
