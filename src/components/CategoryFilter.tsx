import { CATEGORIES } from "@/data/mockEvents";

type CategoryFilterValue = (typeof CATEGORIES)[number]["id"];

interface CategoryFilterProps {
  active: CategoryFilterValue;
  onChange: (category: CategoryFilterValue) => void;
}

const CategoryFilter = ({ active, onChange }: CategoryFilterProps) => {
  return (
    <div
      role="group"
      aria-label="Filter events by category"
      className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3"
    >
      {CATEGORIES.map((cat) => {
        const isActive = active === cat.id;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            aria-pressed={isActive}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all tap-highlight-none ${
              isActive
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
