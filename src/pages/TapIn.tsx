import { Smartphone, Wifi } from "lucide-react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";

const TapIn = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      <header className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4">
        <h1 className="text-2xl font-extrabold text-foreground">Tap In</h1>
        <p className="text-sm text-muted-foreground">Check in to events instantly</p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <motion.div
          className="relative w-48 h-48 mb-8"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Pulse rings */}
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse-ring" />
          <div className="absolute inset-4 rounded-full bg-primary/15 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />

          {/* Center icon */}
          <div className="absolute inset-8 rounded-full bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center">
            <Smartphone className="w-12 h-12 text-primary-foreground" />
          </div>
        </motion.div>

        <h2 className="text-xl font-bold text-foreground mb-2 text-center">Hold your iPhone near the reader</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs mb-8">
          Use NFC tap to instantly check in when you arrive at an event. No lines, no sign-in sheets.
        </p>

        <div className="w-full max-w-xs space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">NFC Ready</p>
              <p className="text-xs text-muted-foreground">Your device supports Tap In</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-sunken">
            <p className="text-xs text-muted-foreground text-center">
              No nearby events detected. Get closer to an event check-in point to tap in.
            </p>
          </div>
        </div>

        {/* Recent check-ins */}
        <div className="w-full max-w-xs mt-8">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Check-ins</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">SU</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Welcome Week Block Party</p>
                <p className="text-[10px] text-muted-foreground">Sep 12 · Tapped in at 6:15 PM</p>
              </div>
              <span className="text-xs font-bold text-success">+10 pts</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default TapIn;
