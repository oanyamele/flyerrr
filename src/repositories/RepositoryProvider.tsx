import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createAppRepositories } from "./createAppRepositories";
import type { AppRepositories } from "./contracts";

const RepositoryContext = createContext<AppRepositories | null>(null);

export const RepositoryProvider = ({
  children,
  repositories,
}: {
  children: ReactNode;
  repositories?: AppRepositories;
}) => {
  // One stable bundle per provider. A new object each render would retrigger
  // effects that list events, such as the home feed refresh.
  const value = useMemo(() => repositories ?? createAppRepositories(), [repositories]);

  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>;
};

export const useRepositories = () => {
  const repositories = useContext(RepositoryContext);
  if (!repositories) {
    throw new Error("useRepositories must be used within RepositoryProvider");
  }
  return repositories;
};
