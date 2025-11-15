import { useEffect, useRef, useState } from "react";
import { useProductStore, INITIAL_CATEGORY } from "@/store/catalogStore";

export interface SearchBarProps {
  defaultCategoryLabel?: string;
  className?: string;
}

export default function SearchBar({
  defaultCategoryLabel = INITIAL_CATEGORY,
  className,
}: SearchBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const rawCategories = useProductStore((s) => s.allCategories);
  const category = useProductStore((s) => s.category);
  const query = useProductStore((s) => s.query);
  const setQuery = useProductStore((s) => s.setQuery);
  const setCategory = useProductStore((s) => s.setCategory);
  const resetFilters = useProductStore((s) => s.resetFilters);

  const [localQuery, setLocalQuery] = useState(query);
  useEffect(() => setLocalQuery(query), [query]);

  const categories =
    rawCategories && rawCategories.length > 0 ? rawCategories : [defaultCategoryLabel];

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  const applySearch = () => {
    setQuery(localQuery);
  };

  const handleReset = () => {
    resetFilters();
    setLocalQuery("");
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className ?? ""}`}>
      {/* dropdown */}
      <div ref={ref} className="relative inline-block text-left">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex justify-between items-center w-52 rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-expanded={open}
        >
          <span className="truncate">{category}</span>
          <svg
            className={`h-4 w-4 ml-2 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {open && (
          <div className="absolute z-10 right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5">
            <ul className="max-h-64 overflow-auto py-1">
              {categories.map((opt) => (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => {
                      setCategory(opt);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      category === opt ? "font-semibold text-indigo-600" : "text-gray-700"
                    }`}
                  >
                    {opt}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <input
        type="search"
        placeholder="Cari nama produk…"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
      />

      {/* tombol */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={applySearch}
          className="rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Search
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md bg-gray-200 text-gray-700 px-3 py-2 text-sm hover:bg-gray-300"
        >
          Kembali
        </button>
      </div>
    </div>
  );
}
