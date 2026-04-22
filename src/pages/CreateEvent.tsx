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

// Add more comprehensive event fields here as needed
const CATEGORY_OPTIONS = [
  { value: "social", label: "Social" },
  { value: "academic", label: "Academic" },
  { value: "career", label: "Career" },
  { value: "sports", label: "Sports" },
  { value: "arts", label: "Arts" },
];

const initialErrors = {
  title: "",
  description: "",
  location: "",
  date: "",
  time: "",
  imageFile: "",
};

const CreateEvent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { auth } = useAuth();

  // All form state, including full inputs
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [category, setCategory] = useState("social");
  const [tags, setTags] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<typeof initialErrors>(initialErrors);

  // Form validation - checks required fields
  const validate = () => {
    const newErrors: typeof initialErrors = { ...initialErrors };

    if (!title.trim()) newErrors.title = "Event title is required.";
    if (!description.trim()) newErrors.description = "Event description is required.";
    if (!location.trim()) newErrors.location = "Location is required.";
    if (!date) newErrors.date = "Date is required.";
    if (!time) newErrors.time = "Time is required.";
    // Optional: make image required by uncommenting the next line
    // if (!imageFile) newErrors.imageFile = "Event graphic is required.";

    setErrors(newErrors);

    // All error fields must be falsy for the form to be "valid"
    return Object.values(newErrors).every((v) => v === "");
  };

  // On change, store both for submission and preview
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageFile(file ?? null);
    setErrors((errs) => ({ ...errs, imageFile: "" }));
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      // Optionally toast an error summary
      toast({
        title: "Missing Fields",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Build tags array
    const tagsArr = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    // Build/submit event
    const createdEvent = createEventRecord({
      title,
      description,
      image: imagePreview ?? "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=80",
      category: category as EventCategory,
      date,
      time,
      location,
      capacity: Number(capacity) || 100,
      tags: tagsArr,
      creatorName: auth.userName || "Campus Officer",
      creatorRole: auth.role,
      creatorUserId: auth.userId,
      // If you support more fields, add here
    });
    toast({
      title: "Event Created",
      description: `"${createdEvent.title}" has been published to the feed.`,
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Create Event</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-5" noValidate>
        {/* Image Upload */}
        <label className="block cursor-pointer">
          <div
            className={`w-full h-48 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center overflow-hidden ${
              imagePreview ? "" : "bg-surface-sunken"
            }`}
          >
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
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>
        {errors.imageFile && (
          <div className="text-xs text-destructive mt-1">{errors.imageFile}</div>
        )}

        {/* Title */}
        <div>
          <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1.5">
            <FileText className="w-4 h-4" /> Event Title<span className="ml-1 text-destructive">*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErrors((errs) => ({ ...errs, title: "" })); }}
            placeholder="e.g. Fall Career Fair"
            className="rounded-xl h-12"
            required
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <p className="text-xs text-destructive mt-1">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2">
            Event Description<span className="ml-1 text-destructive">*</span>
          </label>
          <Textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setErrors((errs) => ({ ...errs, description: "" })); }}
            placeholder="Tell students what to expect..."
            className="rounded-xl min-h-[100px]"
            required
            aria-invalid={!!errors.description}
          />
          {errors.description && (
            <p className="text-xs text-destructive mt-1">{errors.description}</p>
          )}
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
                aria-pressed={category === opt.value}
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
              <Clock className="w-4 h-4" /> Date<span className="ml-1 text-destructive">*</span>
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setErrors((errs) => ({ ...errs, date: "" })); }}
              className="rounded-xl h-12"
              required
              aria-invalid={!!errors.date}
            />
            {errors.date && (
              <p className="text-xs text-destructive mt-1">{errors.date}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">
              Time<span className="ml-1 text-destructive">*</span>
            </label>
            <Input
              type="time"
              value={time}
              onChange={(e) => { setTime(e.target.value); setErrors((errs) => ({ ...errs, time: "" })); }}
              className="rounded-xl h-12"
              required
              aria-invalid={!!errors.time}
            />
            {errors.time && (
              <p className="text-xs text-destructive mt-1">{errors.time}</p>
            )}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1.5">
            <MapPin className="w-4 h-4" /> Location<span className="ml-1 text-destructive">*</span>
          </label>
          <Input
            value={location}
            onChange={(e) => { setLocation(e.target.value); setErrors((errs) => ({ ...errs, location: "" })); }}
            placeholder="e.g. Student Center Ballroom"
            className="rounded-xl h-12"
            required
            aria-invalid={!!errors.location}
          />
          {errors.location && (
            <p className="text-xs text-destructive mt-1">{errors.location}</p>
          )}
        </div>

        {/* Capacity */}
        <div>
          <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1.5">
            <Users className="w-4 h-4" /> Max Capacity
          </label>
          <Input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="e.g. 200"
            className="rounded-xl h-12"
            min={1}
            max={10000}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-1.5 block">Tags (comma separated)</label>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. free food, networking, prizes"
            className="rounded-xl h-12"
          />
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
