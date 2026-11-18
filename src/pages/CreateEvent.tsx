import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Upload, MapPin, Clock, FileText, Tag, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { useCreateEvent } from "@/hooks/useEvents";
import { useAuth } from "@/contexts/AuthContext";
import { eventFormSchema, type EventFormValues } from "@/schemas/forms";

const CATEGORY_OPTIONS = [
  { value: "social", label: "Social" },
  { value: "academic", label: "Academic" },
  { value: "career", label: "Career" },
  { value: "sports", label: "Sports" },
  { value: "arts", label: "Arts" },
] as const;

const CreateEvent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { auth } = useAuth();
  const createEvent = useCreateEvent();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "social",
      date: "",
      time: "",
      location: "",
      capacity: "",
      tags: "",
    },
  });
  const selectedCategory = form.watch("category");


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values: EventFormValues) => {
    try {
      const createdEvent = await createEvent.mutateAsync({
        title: values.title,
        description: values.description,
        image: imagePreview ?? "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=80",
        category: values.category,
        date: values.date,
        time: values.time,
        location: values.location,
        capacity: values.capacity === "" ? 100 : Number(values.capacity),
        tags: values.tags
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
      navigate("/");
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="px-5 py-4 space-y-5" noValidate>
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
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Event Title
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Fall Career Fair" className="rounded-xl h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Description</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Tell students what to expect..." className="rounded-xl min-h-[100px]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={() => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Category
                </FormLabel>
                <FormControl>
                  <div className="flex gap-2 flex-wrap">
                    {CATEGORY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={selectedCategory === opt.value}
                        onClick={() =>
                          form.setValue("category", opt.value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                          selectedCategory === opt.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Date
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="date" className="rounded-xl h-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input {...field} type="time" className="rounded-xl h-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Location */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Location
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Student Center Ballroom" className="rounded-xl h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Capacity */}
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Users className="w-4 h-4" /> Max Capacity
                </FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="1" max="10000" placeholder="e.g. 200" className="rounded-xl h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tags */}
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (comma separated)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. free food, networking, prizes" className="rounded-xl h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={form.formState.isSubmitting} className="w-full h-12 rounded-xl text-base font-bold">
            {form.formState.isSubmitting ? "Publishing…" : "Publish Event"}
          </Button>
        </form>
      </Form>

      <BottomNav />
    </div>
  );
};

export default CreateEvent;
