import { createContext } from "react";
import type { AppRepositories } from "@/repositories/contracts";

export const repositoryContext = createContext<AppRepositories | null>(null);
