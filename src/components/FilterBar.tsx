import { CATEGORIES, type EventCategory } from "@/data/mockEvents";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface FilterBarProps {
  selectedCategory: EventCategory | "all" | "following";
  onCategoryChange: (cat: EventCategory | "all" | "following") => void;
}

const FilterBar = ({ selectedCategory, onCategoryChange }: FilterBarProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="absolute top-0 left-0 right-0 z-40 pt-[max(1rem,env(safe-area-inset-top))] px-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">flyerrr</h1>
        <button
          type="button"
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-secondary/80 backdrop-blur flex items-center justify-center tap-highlight-none"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5 text-foreground" />
          ) : (
            <Moon className="w-5 h-5 text-foreground" />
          )}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryChange(cat.id)}
            className={`whitespace-nowrap text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all tap-highlight-none ${
              selectedCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/70 backdrop-blur text-foreground hover:bg-secondary"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterBar;

