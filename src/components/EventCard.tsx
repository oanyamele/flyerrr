import { Heart, Bookmark, Share2, MapPin, Clock, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import type { CampusEvent } from "@/data/mockEvents";
import { Badge } from "@/components/ui/badge";
import { useFollow } from "@/contexts/FollowContext";
import { useNavigate } from "react-router-dom";

interface EventCardProps {
  event: CampusEvent;
  onOpenDetail?: (event: CampusEvent) => void;
}

const EventCard = ({ event, onOpenDetail }: EventCardProps) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(event.saved);
  const { isFollowing, toggleFollow } = useFollow();
  const navigate = useNavigate();
  const attendancePercent = Math.round((event.attendees / event.capacity) * 100);

  const handleShare = async () => {
    const url = `${window.location.origin}/event/${event.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out ${event.title} by ${event.org.name}!`,
          url,
        });
      } catch {
        // user cancelled share
      }
      return;
    }
    await navigator.clipboard.writeText(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mx-auto mb-3 w-[calc(100%-1rem)] max-w-xl snap-start overflow-hidden rounded-[12px] border border-border bg-card shadow-md sm:mb-4 sm:w-[calc(100%-2rem)]"
      onClick={() => navigate(`/event/${event.id}`)}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-sunken">
        <img
          src={event.image}
          alt={event.title}
          className="h-full w-full object-contain"
        />

        {/* Right Side Actions */}
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col items-center gap-4 sm:right-4">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
            className="flex flex-col items-center gap-1 tap-highlight-none"
          >
            <motion.div whileTap={{ scale: 1.3 }}>
              <Heart className={`h-6 w-6 sm:h-7 sm:w-7 ${liked ? "fill-primary text-primary" : "text-primary-foreground"}`} />
            </motion.div>
            <span className="text-[10px] font-medium text-primary-foreground">Like</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setSaved(!saved); }}
            className="flex flex-col items-center gap-1 tap-highlight-none"
          >
            <motion.div whileTap={{ scale: 1.3 }}>
              <Bookmark className={`h-6 w-6 sm:h-7 sm:w-7 ${saved ? "fill-primary text-primary" : "text-primary-foreground"}`} />
            </motion.div>
            <span className="text-[10px] font-medium text-primary-foreground">Save</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void handleShare();
            }}
            className="flex flex-col items-center gap-1 tap-highlight-none"
          >
            <Share2 className="h-6 w-6 text-primary-foreground sm:h-7 sm:w-7" />
            <span className="text-[10px] font-medium text-primary-foreground">Share</span>
          </button>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {event.org.avatar}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium text-foreground">{event.org.name}</span>
              {event.org.verified && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground">✓</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{event.org.handle}</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFollow(event.org.id);
            }}
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold tap-highlight-none ${
              isFollowing(event.org.id)
                ? "bg-secondary/30 text-foreground"
                : "bg-primary text-primary-foreground"
            }`}
            aria-label={isFollowing(event.org.id) ? "Unfollow organization" : "Follow organization"}
          >
            {isFollowing(event.org.id) ? "Following" : "Follow"}
          </button>
        </div>

        <h2 className="text-[15px] font-medium leading-tight text-foreground">{event.title}</h2>

        <div className="flex flex-wrap gap-1.5">
          {event.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="border-0 text-[11px]">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {event.date} · {event.time}</span>
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {event.location}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary/30">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${attendancePercent}%` }}
            />
          </div>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Users className="h-3 w-3" /> {event.attendees}/{event.capacity}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;
