
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
    <header className="w-full bg-gradient-to-r from-black to-zinc-900 py-4 px-6 flex items-center justify-between shadow-md animate-fade-in">
      <div className="flex items-center">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-campus-purple to-campus-pink rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="text-white font-bold text-2xl tracking-tight">
              EventEra
            </div>
          </div>
        </div>
      </div>
      <form onSubmit={handleSearch} className="flex-1 max-w-[400px] mx-8">
        <div className="relative">
          <input
            type="text"
            name="search"
            placeholder="Search your organization's events..."
            className="w-full bg-white/10 backdrop-blur-lg text-white rounded-full py-2 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-campus-accent/50 transition-all placeholder:text-gray-400"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 p-1 hover:text-white transition-colors"
          >
            <Search size={18} />
          </button>
        </div>
      </form>
    </header>
  );
};

export default Header;

