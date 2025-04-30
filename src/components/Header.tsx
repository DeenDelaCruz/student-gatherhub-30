
import { Search } from "lucide-react";

interface HeaderProps {
  onSearch?: (term: string) => void;
}

const Header = ({ onSearch }: HeaderProps) => {
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("search") as HTMLInputElement;
    if (onSearch && input) {
      onSearch(input.value);
    }
  };

  return (
    <header className="w-full bg-gradient-to-r from-[#1A1F2C] to-[#222222] py-4 px-6 flex items-center justify-between shadow-lg backdrop-blur-xl border-b border-white/10 animate-fade-in z-10">
      <div className="flex items-center">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-[#8E6BF5] to-[#FF6B95] rounded-xl p-0.5 shadow-lg hover:shadow-[#8E6BF5]/20 transition-all duration-300 group">
            <div className="bg-[#1A1F2C] rounded-[0.65rem] px-3 py-1.5">
              <div className="text-white font-bold text-xl tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#8E6BF5] group-hover:to-[#FF6B95] transition-all duration-300">
                EventEra
              </div>
            </div>
          </div>
        </div>
      </div>
      <form onSubmit={handleSearch} className="flex-1 max-w-[400px] mx-8">
        <div className="relative">
          <input
            type="text"
            name="search"
            placeholder="Search for campus events..."
            className="w-full bg-white/10 border border-white/10 backdrop-blur-lg text-white rounded-full py-2 px-5 pl-5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E6BF5]/50 focus:border-[#8E6BF5]/50 transition-all placeholder:text-gray-400"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 p-1 hover:text-white transition-colors"
          >
            <Search size={16} className="hover:text-[#8E6BF5] transition-colors" />
          </button>
        </div>
      </form>
    </header>
  );
};

export default Header;
