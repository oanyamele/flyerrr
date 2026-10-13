import { useState } from "react";
import { ArrowLeft, Upload, MapPin, Clock, FileText, Tag, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { createEventRecord } from "@/data/appDatabase";
import { useAuth } from "@/contexts/AuthContext";
import type { EventCategory } from "@/data/mockEvents";

const CATEGORY_OPTIONS = [
  { value: "social", label: "Social" },
  { value: "academic", label: "Academic" },
  { value: "career", label: "Career" },
  { value: "sports", label: "Sports" },
  { value: "arts", label: "Arts" },
];

const CreateEvent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { auth } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [category, setCategory] = useState("social");
  const [tags, setTags] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const createdEvent = createEventRecord({
        title,
        description,
        image: imagePreview ?? "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=80",
        category: category as EventCategory,
        date,
        time,
        location,
        capacity: Number(capacity) || 100,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        creatorName: auth.userName || "Campus Officer",
        creatorRole: auth.role,
        creatorUserId: auth.userId,
      });
      toast({
        title: "Event Created",
        description: `"${createdEvent.title}" has been published to the feed.`,
      });
      navigate("/", { state: { refreshFeed: Date.now() } });
    } catch (error) {
      toast({
        title: "Publish failed",
        description: "Could not save this event. Try a smaller image or retry.",
        variant: "destructive",
      });
      console.error("Failed to publish event", error);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
          <button type="button" aria-label="Go back" onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft aria-hidden="true" className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Create Event</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-5">
        {/* Image Upload */}
        <label className="block cursor-pointer">
          <div className={`w-full h-48 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center overflow-hidden ${imagePreview ? "" : "bg-surface-sunken"}`}>
            {imagePreview ? (
              <img src={imagePreview} alt="Event graphic" className="w-full h-full object-cover" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Upload Event Graphic</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, or video up to 10MB</p>
              </>
            )}
          </div>
          <input type="file" accept="image/*,video/*" className="hidden" onChange={handleImageUpload} />
        </label>

        {/* Title */}
        <div>
          <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1.5">
            <FileText className="w-4 h-4" /> Event Title
          </label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fall Career Fair" className="rounded-xl h-12" required />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-1.5 block">Event Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell students what to expect..." className="rounded-xl min-h-[100px]" required />
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1.5">
            <Tag className="w-4 h-4" /> Category
          </label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  category === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1.5">
              <Clock className="w-4 h-4" /> Date
            </label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl h-12" required />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Time</label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-xl h-12" required />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1.5">
            <MapPin className="w-4 h-4" /> Location
          </label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Student Center Ballroom" className="rounded-xl h-12" required />
        </div>

        {/* Capacity */}
        <div>
          <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1.5">
            <Users className="w-4 h-4" /> Max Capacity
          </label>
          <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="e.g. 200" className="rounded-xl h-12" />
        </div>

        {/* Tags */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-1.5 block">Tags (comma separated)</label>
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. free food, networking, prizes" className="rounded-xl h-12" />
        </div>

        <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold">
          Publish Event
        </Button>
      </form>

      <BottomNav />
    </div>
  );
};

export default CreateEvent;
