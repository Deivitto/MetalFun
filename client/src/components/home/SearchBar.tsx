import React, { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [_, setLocation] = useLocation();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto mb-8 px-2">
      <form onSubmit={handleSearch} className="flex">
        <Input
          type="text"
          placeholder="Search for token"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 h-10 bg-[#181622] border border-gray-700 text-[#e6e6e6] rounded-l-lg focus:outline-none focus:border-[#c0c0c0] shadow-sm text-sm"
        />
        <Button 
          type="submit"
          className="px-4 h-10 bg-[#c0c0c0] text-[#242235] font-medium rounded-r-lg hover:bg-[#a3a3a3]"
        >
          <Search className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default SearchBar;
