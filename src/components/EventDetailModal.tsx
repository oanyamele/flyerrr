import { useMemo, useState } from "react";
import { X, Heart, Bookmark, Share2, MapPin, Clock, Users, CheckCircle2 } from "lucide-react";
import type { CampusEvent } from "@/data/mockEvents";
import { useFollow } from "@/contexts/FollowContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EventDetailModalProps {
  event: CampusEvent;
  onClose: () => void;
  onOpenFullDetails?: (event: CampusEvent) => void;
}

const EventDetailModal = ({ event, onClose, onOpenFullDetails }: EventDetailModalProps) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(event.saved);
  const [rsvp, setRsvp] = useState(false);
  const { isFollowing, toggleFollow } = useFollow();

  const fillPercent = useMemo(
    () => Math.round((event.attendees / event.capacity) * 100),
    [event.attendees, event.capacity],
  );

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
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto">
      <div className="relative h-[55vh] w-full">
        <img src={event.image} alt={event.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/30" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 w-10 h-10 rounded-full bg-background/70 backdrop-blur flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

        <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 flex gap-2">
          <button
            type="button"
            onClick={() => setLiked((v) => !v)}
            className={`w-10 h-10 rounded-full backdrop-blur flex items-center justify-center ${
              liked ? "bg-primary" : "bg-background/70"
            }`}
            aria-label="Like"
          >
            <Heart className={`w-5 h-5 ${liked ? "fill-primary-foreground text-primary-foreground" : "text-foreground"}`} />
          </button>
          <button
            type="button"
            onClick={() => setSaved((v) => !v)}
            className={`w-10 h-10 rounded-full backdrop-blur flex items-center justify-center ${
              saved ? "bg-primary" : "bg-background/70"
            }`}
            aria-label="Bookmark"
          >
            <Bookmark className={`w-5 h-5 ${saved ? "fill-primary-foreground text-primary-foreground" : "text-foreground"}`} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-background/70 backdrop-blur flex items-center justify-center"
            aria-label="Share"
          >
            <Share2 className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      <div className="px-5 pb-28 -mt-12 relative">
        <div className="bg-card rounded-3xl p-5 shadow-lg border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              {event.org.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground truncate">{event.org.name}</span>
                {event.org.verified && (
                  <span className="w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[8px] text-primary-foreground">
                    ✓
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{event.org.followerCount.toLocaleString()} followers</span>
            </div>
            <Button
              variant={isFollowing(event.org.id) ? "secondary" : "outline"}
              size="sm"
              className="rounded-full text-xs font-semibold"
              onClick={() => toggleFollow(event.org.id)}
            >
              {isFollowing(event.org.id) ? "Following" : "Follow"}
            </Button>
          </div>

          <h1 className="text-2xl font-extrabold text-foreground mb-2">{event.title}</h1>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {event.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-5">{event.description}</p>

          <div className="space-y-3 mb-5">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{event.date}</p>
                <p className="text-xs text-muted-foreground">{event.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{event.location}</p>
                <p className="text-xs text-muted-foreground">Tap for directions</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{event.attendees} attending</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${fillPercent}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{fillPercent}% full</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="p-3 rounded-2xl bg-surface-sunken text-center border border-border">
              <p className="text-xs text-muted-foreground">Likes</p>
              <p className="text-sm font-bold text-foreground">{likeCount.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-2xl bg-surface-sunken text-center border border-border">
              <p className="text-xs text-muted-foreground">Saved</p>
              <p className="text-sm font-bold text-foreground">{saved ? "Yes" : "No"}</p>
            </div>
            <div className="p-3 rounded-2xl bg-surface-sunken text-center border border-border">
              <p className="text-xs text-muted-foreground">Org</p>
              <p className="text-sm font-bold text-foreground">{isFollowing(event.org.id) ? "Following" : "Not yet"}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setRsvp((v) => !v)}
              className={`flex-1 h-12 rounded-2xl text-base font-bold transition-all ${
                rsvp ? "bg-success text-success-foreground" : ""
              }`}
              size="lg"
            >
              {rsvp ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> You're going!
                </span>
              ) : (
                "RSVP - I'm in!"
              )}
            </Button>
            {onOpenFullDetails && (
              <Button variant="secondary" size="lg" className="h-12 rounded-2xl" onClick={() => onOpenFullDetails(event)}>
                Details
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;

