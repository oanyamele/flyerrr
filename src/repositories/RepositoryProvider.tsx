import { useEffect, useState, type ReactNode } from "react";
import { repositoryMode } from "@/repositories/config";
import type { AppRepositories } from "@/repositories/contracts";
import { createLocalRepositories, openHttpRepositories } from "@/repositories/openRepositories";
import { repositoryContext } from "@/repositories/repositoryContext";

export const RepositoryProvider = ({
  children,
  repositories,
}: {
  children: ReactNode;
  repositories?: AppRepositories;
}) => {
  const [value, setValue] = useState<AppRepositories | null>(() => {
    if (repositories) return repositories;
    if (repositoryMode() === "http") return null;
    return createLocalRepositories();
  });

  useEffect(() => {
    if (repositories || repositoryMode() !== "http") return;
    let cancelled = false;
    void openHttpRepositories().then((repos) => {
      if (!cancelled) setValue(repos);
    });
    return () => {
      cancelled = true;
    };
  }, [repositories]);

  if (!value) return null;

  return <repositoryContext.Provider value={value}>{children}</repositoryContext.Provider>;
};
