import { createContext, useContext, useState, ReactNode } from "react";
import { STORAGE_KEYS, readJson, writeJson } from "@/lib/storage";

interface FollowContextType {
  followedOrgIds: string[];
  toggleFollow: (orgId: string) => void;
  isFollowing: (orgId: string) => boolean;
}

const FollowContext = createContext<FollowContextType | null>(null);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((id) => typeof id === "string");

export const FollowProvider = ({ children }: { children: ReactNode }) => {
  const [followedOrgIds, setFollowedOrgIds] = useState<string[]>(() =>
    readJson(STORAGE_KEYS.follows, [], isStringArray),
  );

  const toggleFollow = (orgId: string) => {
    setFollowedOrgIds((prev) => {
      const next = prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId];
      writeJson(STORAGE_KEYS.follows, next);
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
