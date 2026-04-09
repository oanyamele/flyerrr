import { Heart, Bookmark, Share2, MapPin, Clock, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import type { CampusEvent } from "@/data/mockEvents";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface EventCardProps {
  event: CampusEvent;
}

const EventCard = ({ event }: EventCardProps) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(event.saved);
  const navigate = useNavigate();
  const attendancePercent = Math.round((event.attendees / event.capacity) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative h-[calc(100vh-10rem)] snap-start flex-shrink-0 rounded-3xl overflow-hidden mx-4 mb-4 shadow-xl"
      onClick={() => navigate(`/event/${event.id}`)}
    >
      {/* Background Image */}
      <img
        src={event.image}
        alt={event.title}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Top: Org Info */}
      <div className="absolute top-4 left-4 right-16 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground text-xs font-bold">
          {event.org.avatar}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-primary-foreground">{event.org.name}</span>
            {event.org.verified && (
              <span className="w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[8px] text-primary-foreground">✓</span>
            )}
          </div>
          <span className="text-xs text-primary-foreground/70">{event.org.handle}</span>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-5">
        <button
          onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
          className="flex flex-col items-center gap-1 tap-highlight-none"
        >
          <motion.div whileTap={{ scale: 1.3 }}>
            <Heart className={`w-7 h-7 ${liked ? "fill-primary text-primary" : "text-primary-foreground"}`} />
          </motion.div>
          <span className="text-[10px] text-primary-foreground font-medium">{event.attendees}</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setSaved(!saved); }}
          className="flex flex-col items-center gap-1 tap-highlight-none"
        >
          <motion.div whileTap={{ scale: 1.3 }}>
            <Bookmark className={`w-7 h-7 ${saved ? "fill-primary text-primary" : "text-primary-foreground"}`} />
          </motion.div>
          <span className="text-[10px] text-primary-foreground font-medium">Save</span>
        </button>
        <button
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center gap-1 tap-highlight-none"
        >
          <Share2 className="w-7 h-7 text-primary-foreground" />
          <span className="text-[10px] text-primary-foreground font-medium">Share</span>
        </button>
      </div>

      {/* Bottom: Event Info */}
      <div className="absolute bottom-0 left-0 right-0 p-5 pb-6">
        {/* Friends going */}
        {event.friendsGoing.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex -space-x-2">
              {event.friendsGoing.slice(0, 3).map((f, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[9px] font-bold text-accent-foreground border-2 border-black/20">
                  {f[0]}
                </div>
              ))}
            </div>
            <span className="text-xs text-primary-foreground/80">
              {event.friendsGoing.length === 1
                ? `${event.friendsGoing[0]} is going`
                : `${event.friendsGoing[0]} + ${event.friendsGoing.length - 1} friends going`}
            </span>
          </div>
        )}

        <h2 className="text-xl font-bold text-primary-foreground mb-2 leading-tight">{event.title}</h2>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {event.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="bg-primary-foreground/15 text-primary-foreground border-0 text-[11px] backdrop-blur-sm">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-primary-foreground/80">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {event.date} · {event.time}</span>
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.location}</span>
        </div>

        {/* Capacity bar */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-primary-foreground/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${attendancePercent}%` }}
            />
          </div>
          <span className="text-[10px] text-primary-foreground/70 flex items-center gap-1">
            <Users className="w-3 h-3" /> {event.attendees}/{event.capacity}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;
