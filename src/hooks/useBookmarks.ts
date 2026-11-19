import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchBookmarks, setBookmark } from "@/data/bookmarks";

export const useBookmarks = () => {
  const { auth } = useAuth();
  return useQuery({
    queryKey: ["bookmarks", auth.userId], queryFn: () => fetchBookmarks(auth.userId),
    enabled: Boolean(auth.isLoggedIn && auth.userId),
  });
};

export const useSetBookmark = () => {
  const { auth } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, saved }: { eventId: string; saved: boolean }) => setBookmark(auth.userId, eventId, saved),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["bookmarks", auth.userId] }),
        client.invalidateQueries({ queryKey: ["events"] }),
      ]);
    },
  });
};
