import { CATEGORIES, type EventCategory } from "@/data/mockEvents";

interface CategoryFilterProps {
  active: EventCategory | "all" | "following";
  onChange: (cat: EventCategory | "all" | "following") => void;
}

const CategoryFilter = ({ active, onChange }: CategoryFilterProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onChange(cat.id)}
          aria-pressed={active === cat.id}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all tap-highlight-none ${
            active === cat.id
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
