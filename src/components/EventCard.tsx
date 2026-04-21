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
  const likeCount = event.likes + (liked ? 1 : 0);

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
      className="relative mx-auto mb-3 h-[calc(100dvh-11rem)] min-h-[26rem] w-[calc(100%-1rem)] max-w-2xl snap-start flex-shrink-0 overflow-hidden rounded-3xl shadow-xl sm:mb-4 sm:w-[calc(100%-2rem)]"
      onClick={() => (onOpenDetail ? onOpenDetail(event) : navigate(`/event/${event.id}`))}
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
      <div className="absolute left-4 right-16 top-4 flex items-center gap-3">
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
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFollow(event.org.id);
          }}
          className={`ml-auto px-3 py-1.5 rounded-full text-[11px] font-semibold tap-highlight-none ${
            isFollowing(event.org.id)
              ? "bg-primary-foreground/15 text-primary-foreground"
              : "bg-primary text-primary-foreground"
          }`}
          aria-label={isFollowing(event.org.id) ? "Unfollow organization" : "Follow organization"}
        >
          {isFollowing(event.org.id) ? "Following" : "Follow"}
        </button>
      </div>

      {/* Right Side Actions */}
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col items-center gap-4 sm:right-4 sm:gap-5">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
          className="flex flex-col items-center gap-1 tap-highlight-none"
        >
          <motion.div whileTap={{ scale: 1.3 }}>
            <Heart className={`h-6 w-6 sm:h-7 sm:w-7 ${liked ? "fill-primary text-primary" : "text-primary-foreground"}`} />
          </motion.div>
          <span className="text-[10px] text-primary-foreground font-medium">{likeCount.toLocaleString()}</span>
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setSaved(!saved); }}
          className="flex flex-col items-center gap-1 tap-highlight-none"
        >
          <motion.div whileTap={{ scale: 1.3 }}>
            <Bookmark className={`h-6 w-6 sm:h-7 sm:w-7 ${saved ? "fill-primary text-primary" : "text-primary-foreground"}`} />
          </motion.div>
          <span className="text-[10px] text-primary-foreground font-medium">Save</span>
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
          <span className="text-[10px] text-primary-foreground font-medium">Share</span>
        </button>
      </div>

      {/* Bottom: Event Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-5 sm:p-5 sm:pb-6">
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

        <h2 className="mb-2 text-lg font-bold leading-tight text-primary-foreground sm:text-xl">{event.title}</h2>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {event.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="bg-primary-foreground/15 text-primary-foreground border-0 text-[11px] backdrop-blur-sm">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-primary-foreground/80 sm:gap-4 sm:text-xs">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {event.date} · {event.time}</span>
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {event.location}</span>
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
