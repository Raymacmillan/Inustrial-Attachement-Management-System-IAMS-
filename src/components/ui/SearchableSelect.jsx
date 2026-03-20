import { useState, useRef, useEffect } from "react";
import { Plus, Check, Search, X } from "lucide-react";

/**
 * IAMS Searchable Select / Combobox
 * * PROPS:
 * options    - Array of strings (the predefined list).
 * selected   - Array of strings (currently selected items).
 * onSelect   - Function to add an item.
 * onRemove   - Function to remove an item.
 * placeholder- String for the input.
 */
export default function SearchableSelect({ 
  options, 
  selected, 
  onSelect, 
  onRemove, 
  placeholder = "Search..." 
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter(opt => 
    opt.toLowerCase().includes(query.toLowerCase()) && !selected.includes(opt)
  );

  const handleAdd = (item) => {
    onSelect(item);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div className="space-y-4 w-full" ref={wrapperRef}>
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-semibold pr-10 focus:ring-2 focus:ring-brand-500 transition-all"
              placeholder={placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
            />
            <Search className="absolute right-3 top-3.5 text-gray-300" size={18} />
          </div>
          
          {/* Allow adding custom text if it's not in the list */}
          {query && (
            <button
              type="button"
              onClick={() => handleAdd(query)}
              className="p-3 bg-brand-600 text-white rounded-xl shadow-md hover:bg-brand-500 active:scale-95 transition-all"
            >
              <Plus size={20} />
            </button>
          )}
        </div>

        {/* Dropdown Menu */}
        {isOpen && (query || filtered.length > 0) && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 shadow-2xl rounded-2xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
            {filtered.length > 0 ? (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-brand-50 text-gray-700 flex justify-between items-center group border-b border-gray-50 last:border-none"
                  onClick={() => handleAdd(opt)}
                >
                  {opt}
                  <Check size={14} className="opacity-0 group-hover:opacity-100 text-brand-500" />
                </button>
              ))
            ) : (
              query && <div className="p-4 text-xs text-gray-400 italic font-medium">Press + to add "{query}" as a custom role</div>
            )}
          </div>
        )}
      </div>

      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-2">
        {selected.map((item) => (
          <span 
            key={item} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-900 text-white rounded-lg font-bold text-[10px] md:text-xs animate-in zoom-in"
          >
            {item}
            <X 
              size={12} 
              className="cursor-pointer hover:text-brand-300" 
              onClick={() => onRemove(item)} 
            />
          </span>
        ))}
      </div>
    </div>
  );
}