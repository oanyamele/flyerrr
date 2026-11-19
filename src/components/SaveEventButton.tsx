import { Bookmark } from "lucide-react";
import { useBookmarks, useSetBookmark } from "@/hooks/useBookmarks";
import { useToast } from "@/hooks/use-toast";

const SaveEventButton = ({ eventId, className = "", showLabel = false }: { eventId: string; className?: string; showLabel?: boolean }) => {
  const query = useBookmarks();
  const mutation = useSetBookmark();
  const { toast } = useToast();
  const saved = query.data?.some(event => event.id === eventId) ?? false;
  return (
    <button
      type="button" aria-label={saved ? "Unsave event" : "Save event"} aria-pressed={saved}
      disabled={query.isPending || mutation.isPending}
      className={`${className} disabled:opacity-50`}
      onClick={event => {
        event.stopPropagation();
        if (query.isError) {
          void query.refetch();
          toast({ title: "Couldn't load saved events", description: "Retrying. Please try saving again.", variant: "destructive" });
          return;
        }
        mutation.mutate({ eventId, saved: !saved }, {
          onSuccess: () => toast({ title: saved ? "Event removed from Saved" : "Event saved" }),
          onError: error => toast({ title: "Couldn't update saved events", description: error.message, variant: "destructive" }),
        });
      }}
    >
      <Bookmark aria-hidden="true" className={`h-5 w-5 ${saved ? "fill-primary text-primary" : "text-foreground"}`} />
      {showLabel && <span className="text-[10px] font-medium text-foreground">{saved ? "Saved" : "Save"}</span>}
    </button>
  );
};

export default SaveEventButton;
