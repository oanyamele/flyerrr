import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Bookmark, Share2, MapPin, Clock, Users, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { mockEvents } from "@/data/mockEvents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFollow } from "@/contexts/FollowContext";
import BottomNav from "@/components/BottomNav";

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = mockEvents.find((e) => e.id === id);
  const [rsvp, setRsvp] = useState(false);
  const { isFollowing, toggleFollow } = useFollow();

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }

  const attendancePercent = Math.round((event.attendees / event.capacity) * 100);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <div className="relative h-[55vh]">
        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>

        <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 flex gap-2">
          <button className="w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center">
            <Share2 className="w-5 h-5 text-foreground" />
          </button>
          <button className="w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center">
            <Bookmark className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative -mt-12 px-5"
      >
        <div className="bg-card rounded-3xl p-5 shadow-lg border border-border">
          {/* Org */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              {event.org.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground">{event.org.name}</span>
                {event.org.verified && (
                  <span className="w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[8px] text-primary-foreground">✓</span>
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
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-5">{event.description}</p>

          {/* Details */}
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
              <div>
                <p className="font-semibold text-foreground">{event.location}</p>
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
                    <div className="h-full bg-primary rounded-full" style={{ width: `${attendancePercent}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{attendancePercent}% full</span>
                </div>
              </div>
            </div>
          </div>

          {/* Friends Going */}
          {event.friendsGoing.length > 0 && (
            <div className="p-3 rounded-2xl bg-surface-sunken mb-5">
              <p className="text-xs font-semibold text-foreground mb-2">Friends going</p>
              <div className="flex items-center gap-2">
                {event.friendsGoing.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border">
                    <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[9px] font-bold text-accent-foreground">
                      {f[0]}
                    </div>
                    <span className="text-xs font-medium text-foreground">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RSVP Button */}
          <Button
            onClick={() => setRsvp(!rsvp)}
            className={`w-full h-12 rounded-2xl text-base font-bold transition-all ${
              rsvp ? "bg-success text-success-foreground" : ""
            }`}
            size="lg"
          >
            {rsvp ? (
              <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> You're going!</span>
            ) : (
              "RSVP - I'm in!"
            )}
          </Button>
        </div>
      </motion.div>

      <BottomNav />
    </div>
  );
};

export default EventDetail;
