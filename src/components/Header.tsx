
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
    <header className="w-full bg-campus-header py-4 px-3 flex items-center justify-between animate-fade-in">
      <div className="flex items-center">
        <div className="text-white font-bold text-xl mr-2">N
          <span className="text-campus-accent">:</span>U
        </div>
        <p className="text-white text-[10px] opacity-70">CAMPUS EVENTS HUB</p>
      </div>
      <form onSubmit={handleSearch} className="flex-1 max-w-[300px] mx-4">
        <div className="relative">
          <input
            type="text"
            name="search"
            placeholder="Search your organization's events..."
            className="w-full bg-white rounded-full py-1.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-campus-accent transition-all"
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 p-1 hover:text-campus-accent transition-colors"
          >
            <Search size={18} />
          </button>
        </div>
      </form>
    </header>
  );
};

export default Header;
