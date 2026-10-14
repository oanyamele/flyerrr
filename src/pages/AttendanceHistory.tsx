import { ArrowLeft, CheckCircle2, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const attendedEvents = [
  { id: "1", title: "Welcome Week Block Party", org: "Student Union", date: "Sep 12, 2025", time: "6:15 PM", points: 10 },
  { id: "2", title: "24-Hour Hackathon", org: "CS Society", date: "Sep 20, 2025", time: "10:05 AM", points: 15 },
  { id: "3", title: "Fall Career Fair", org: "Career Center", date: "Sep 24, 2025", time: "1:12 PM", points: 10 },
  { id: "4", title: "Volleyball Open Gym", org: "Intramural Sports", date: "Sep 17, 2025", time: "7:02 PM", points: 5 },
  { id: "5", title: "AI Workshop", org: "CS Society", date: "Oct 1, 2025", time: "3:30 PM", points: 10 },
];

const AttendanceHistory = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
          <button type="button" aria-label="Go back" onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft aria-hidden="true" className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Attendance History</h1>
        </div>
      </header>

      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <p className="text-sm font-semibold text-foreground">{attendedEvents.length} events attended</p>
        </div>

        <div className="space-y-3">
          {attendedEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.org}</p>
                <p className="text-xs text-muted-foreground">{event.date} - Tapped in at {event.time}</p>
              </div>
              <span className="text-xs font-bold text-success whitespace-nowrap">+{event.points} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;
