import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, X } from "lucide-react";

function SearchableSelect({ label, name, required, options, value, onChange, disabled, error, placeholder, baseClasses, borderClass }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const normalizedSearch = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return options.filter((opt) => {
      const normalizedLabel = opt.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return normalizedLabel.includes(normalizedSearch);
    });
  }, [search, options]);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    onChange({ target: { name, value: val } });
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="flex flex-col gap-1.5" ref={dropdownRef}>
      <label htmlFor={name} className="text-[13px] font-medium text-neutral-700">
        {label}
        {required && <span className="text-[#D63031] ml-0.5">*</span>}
      </label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`${baseClasses} ${borderClass} flex items-center justify-between text-left h-[42px]`}
        >
          <span className={`block truncate ${selectedOption ? "text-neutral-900" : "text-neutral-400"}`}>
            {selectedOption ? selectedOption.label : placeholder || "Seleccionar..."}
          </span>
          <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
        
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2">
              <Search className="h-4 w-4 text-neutral-400 shrink-0" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-[13px] outline-none placeholder:text-neutral-400 bg-transparent border-none p-0 focus:ring-0"
                autoFocus
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="shrink-0">
                  <X className="h-3 w-3 text-neutral-400 hover:text-neutral-600 transition-colors" />
                </button>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-2 text-[13px] hover:bg-neutral-50 transition-colors ${
                      value === opt.value ? "bg-neutral-50 font-medium text-[#D63031]" : "text-neutral-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-[12px] text-neutral-400">
                  No se encontraron resultados
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-[12px] text-red-500">{error}</p>}
    </div>
  );
}

export default function FormField({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  required = false,
  options = [],
  disabled = false,
}) {
  const baseClasses =
    "w-full rounded-lg border bg-neutral-50 px-3.5 py-2.5 text-[14px] text-neutral-900 placeholder-neutral-400 outline-none transition-colors " +
    "focus:border-[#D63031]/40 focus:bg-white focus:ring-2 focus:ring-[#D63031]/10 " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  const borderClass = error ? "border-red-300" : "border-neutral-200";

  if (type === "smalltext"){
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={name} className="text-[13px] font-medium text-neutral-700">
          {label}
          {required && <span className="text-[#D63031] ml-0.5">*</span>}
        </label>
        <textarea
          id={name}
          name={name}
          rows={1}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`${baseClasses} ${borderClass} resize-none`}
        />
        {error && <p className="text-[12px] text-red-500">{error}</p>}
      </div>
    );
  }

  if (type === "textarea") {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={name} className="text-[13px] font-medium text-neutral-700">
          {label}
          {required && <span className="text-[#D63031] ml-0.5">*</span>}
        </label>
        <textarea
          id={name}
          name={name}
          rows={4}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`${baseClasses} ${borderClass} resize-none`}
        />
        {error && <p className="text-[12px] text-red-500">{error}</p>}
      </div>
    );
  }

  if (type === "select") {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={name} className="text-[13px] font-medium text-neutral-700">
          {label}
          {required && <span className="text-[#D63031] ml-0.5">*</span>}
        </label>
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`${baseClasses} ${borderClass} appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.75rem_center]`}
        >
          <option value="">Seleccionar...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-[12px] text-red-500">{error}</p>}
      </div>
    );
  }



  if (type === "searchable-select") {
    return (
      <SearchableSelect 
        label={label}
        name={name}
        required={required}
        options={options}
        value={value}
        onChange={onChange}
        disabled={disabled}
        error={error}
        placeholder={placeholder}
        baseClasses={baseClasses}
        borderClass={borderClass}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-[13px] font-medium text-neutral-700">
        {label}
        {required && <span className="text-[#D63031] ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`${baseClasses} ${borderClass}`}
      />
      {error && <p className="text-[12px] text-red-500">{error}</p>}
    </div>
  );
}
