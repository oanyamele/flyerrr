import { useContext } from "react";
import { repositoryContext } from "@/repositories/repositoryContext";

export const useRepositories = () => {
  const repositories = useContext(repositoryContext);
  if (!repositories) throw new Error("useRepositories must be used within RepositoryProvider");
  return repositories;
};
