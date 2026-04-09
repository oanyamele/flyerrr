import { Calendar, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const digest = [
  { day: "Tue", event: "Resume Workshop", time: "2:00 PM", color: "bg-accent" },
  { day: "Wed", event: "Volleyball Open Gym", time: "7:00 PM", color: "bg-success" },
  { day: "Fri", event: "Game Night in Blackburn", time: "8:00 PM", color: "bg-primary" },
];

const WeeklyDigest = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4 p-4 rounded-2xl bg-card border border-border shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Your Week</h3>
        </div>
        <button className="text-xs text-muted-foreground flex items-center gap-0.5">
          See all <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-2">
        {digest.map((d) => (
          <div key={d.day} className="flex items-center gap-3">
            <div className={`w-1 h-8 rounded-full ${d.color}`} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{d.event}</p>
              <p className="text-xs text-muted-foreground">{d.day} · {d.time}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default WeeklyDigest;
