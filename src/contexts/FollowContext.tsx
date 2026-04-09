import { createContext, useContext, useState, ReactNode } from "react";

interface FollowContextType {
  followedOrgIds: string[];
  toggleFollow: (orgId: string) => void;
  isFollowing: (orgId: string) => boolean;
}

const FollowContext = createContext<FollowContextType | null>(null);

export const FollowProvider = ({ children }: { children: ReactNode }) => {
  const [followedOrgIds, setFollowedOrgIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("flyerrr_follows");
    return saved ? JSON.parse(saved) : [];
  });

  const toggleFollow = (orgId: string) => {
    setFollowedOrgIds((prev) => {
      const next = prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId];
      localStorage.setItem("flyerrr_follows", JSON.stringify(next));
      return next;
    });
  };

  const isFollowing = (orgId: string) => followedOrgIds.includes(orgId);

  return (
    <FollowContext.Provider value={{ followedOrgIds, toggleFollow, isFollowing }}>
      {children}
    </FollowContext.Provider>
  );
};

export const useFollow = () => {
  const ctx = useContext(FollowContext);
  if (!ctx) throw new Error("useFollow must be used within FollowProvider");
  return ctx;
};
