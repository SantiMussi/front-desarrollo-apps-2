import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";

export default function SearchBar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();

    navigate(query ? `/portal-ayuda?q=${encodeURIComponent(query)}` : "/portal-ayuda");
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row w-full max-w-2xl shadow-xl shadow-black/[0.03] rounded-xl sm:rounded-2xl">
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-neutral-400" />
        </div>
        <input
          type="text"
          placeholder="Buscá: Patentes, Alumbrado, Licencias..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full h-full min-h-[64px] bg-white border-2 border-neutral-200 text-neutral-900 text-[16px] font-medium rounded-t-xl sm:rounded-l-2xl sm:rounded-tr-none pl-14 pr-4 outline-none transition-all focus:border-[#0F2C59] focus:ring-4 focus:ring-[#0F2C59]/10"
        />
      </div>
      <button type="submit" className="min-h-[64px] bg-[#0F2C59] hover:bg-[#163d75] text-white px-10 rounded-b-xl sm:rounded-r-2xl sm:rounded-bl-none font-bold text-[16px] transition-all flex items-center justify-center gap-2">
        Buscar
        <ArrowRight className="h-5 w-5" />
      </button>
    </form>
  );
}