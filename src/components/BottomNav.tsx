import { Home, Search, Smartphone, User, Bookmark } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const tabs = [
  { icon: Home, label: "Feed", path: "/" },
  { icon: Search, label: "Explore", path: "/explore" },
  { icon: Smartphone, label: "Tap In", path: "/tap-in" },
  { icon: Bookmark, label: "Saved", path: "/saved" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around max-w-lg mx-auto py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          const isTapIn = tab.label === "Tap In";
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 tap-highlight-none transition-colors ${
                isTapIn
                  ? "relative"
                  : active
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {isTapIn ? (
                <div className="relative -mt-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                    <tab.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
              ) : (
                <tab.icon className="w-5 h-5" />
              )}
              <span className={`text-[10px] font-medium ${isTapIn ? "text-primary" : ""}`}>
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
