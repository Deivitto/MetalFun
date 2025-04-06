import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { Search, Filter, ArrowLeft } from "lucide-react";
import CoinCard from "@/components/home/CoinCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FilterOptions from "@/components/home/FilterOptions";
import { Coin } from "@shared/schema";

// Define the Metal token type 
interface MetalToken {
  id: string;
  address: string;
  name: string;
  symbol: string;
  totalSupply: number;
  startingAppSupply: number;
  remainingAppSupply: number;
  merchantSupply: number;
  merchantAddress: string;
  price: number;
  image?: string;
  description?: string;
  marketCap?: number;
  holderCount?: number;
  previousHolderCount?: number;
  priceChange24h?: string;
  volume24h?: string;
  createdAt?: string;
  isTrending?: boolean;
  isMigrated?: boolean;
  tags?: string[];
};

const SearchResults = () => {
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [includeWithdrawn, setIncludeWithdrawn] = useState(false);
  const [sortBy, setSortBy] = useState("trending");
  
  // Extract the search query from URL
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const query = params.get("q") || "";
    setSearchQuery(query);
  }, [location]);
  
  // Fetch Metal tokens
  const { data: metalTokensData = { tokens: [] }, isLoading: isLoadingTokens, error: tokenError } = useQuery<{ tokens: MetalToken[] }>({
    queryKey: ["/api/metal/tokens"],
  });

  // Fetch coin search results
  const { data: coins = [], isLoading: isLoadingCoins, error: coinsError } = useQuery<Coin[]>({
    queryKey: ['/api/coins/search', searchQuery, includeWithdrawn],
    enabled: searchQuery.length > 0,
    queryFn: async () => {
      const response = await fetch(`/api/coins/search?q=${encodeURIComponent(searchQuery)}&includeWithdrawn=${includeWithdrawn}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      return response.json();
    }
  });

  const metalTokens = metalTokensData.tokens || [];
  
  // Filter Metal tokens based on search query
  const filteredMetalTokens = React.useMemo(() => {
    if (!searchQuery || !metalTokens.length) return [];
    
    const query = searchQuery.toLowerCase();
    return metalTokens.filter(token => 
      token.name.toLowerCase().includes(query) || 
      token.symbol.toLowerCase().includes(query) ||
      token.address.toLowerCase().includes(query)
    );
  }, [searchQuery, metalTokens]);
  
  // Handle submit of search form
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  // Sort the coins based on the selected sort option
  const sortedCoins = React.useMemo(() => {
    if (!coins) return [];
    
    const result = [...coins];
    
    switch (sortBy) {
      case "trending":
        return result.sort((a, b) => {
          const aGrowth = a.holderCount - a.previousHolderCount;
          const bGrowth = b.holderCount - b.previousHolderCount;
          return bGrowth - aGrowth;
        });
      case "newest":
        return result.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "highest-mcap":
        return result.sort((a, b) => b.marketCap - a.marketCap);
      case "lowest-mcap":
        return result.sort((a, b) => a.marketCap - b.marketCap);
      case "most-holders":
        return result.sort((a, b) => b.holderCount - a.holderCount);
      case "fastest-growing":
        return result.sort((a, b) => {
          const aGrowthRate = a.previousHolderCount ? (a.holderCount / a.previousHolderCount) : 0;
          const bGrowthRate = b.previousHolderCount ? (b.holderCount / b.previousHolderCount) : 0;
          return bGrowthRate - aGrowthRate;
        });
      default:
        return result;
    }
  }, [coins, sortBy]);
  
  // Calculate loading and error states
  const isLoading = isLoadingCoins || isLoadingTokens;
  const hasError = coinsError || tokenError;

  // Check if we have any results
  const hasResults = (sortedCoins && sortedCoins.length > 0) || (filteredMetalTokens && filteredMetalTokens.length > 0);

  return (
    <div className="container px-4 py-6">
      {/* Back and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center mb-8 gap-4">
        <Link href="/">
          <a className="inline-flex items-center text-[#c0c0c0] hover:underline">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </a>
        </Link>
        
        <form onSubmit={handleSearch} className="flex flex-1 md:mx-4">
          <Input
            type="text"
            placeholder="Search for token"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 h-10 bg-[#181622] border border-gray-700 text-[#e6e6e6] rounded-l-lg focus:outline-none focus:border-[#c0c0c0] shadow-sm text-sm"
          />
          <Button 
            type="submit"
            className="px-4 h-10 bg-[#c0c0c0] text-[#242235] font-medium rounded-r-lg hover:opacity-90 transition-opacity"
          >
            <Search className="h-4 w-4" />
          </Button>
        </form>
        
        <Button
          variant="outline"
          className="md:ml-auto border border-[#c0c0c0] text-[#c0c0c0]"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="mb-6">
          <FilterOptions
            onSortChange={setSortBy}
            onAnimationsChange={() => {}} // Not implementing animations for now
            onNsfwChange={() => setIncludeWithdrawn(!includeWithdrawn)}
          />
        </div>
      )}
      
      {/* Results */}
      <div className="mt-8">
        <h2 className="text-xl font-medium mb-4">
          Search Results {searchQuery && `for "${searchQuery}"`}
        </h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i} 
                className="bg-[#181622] border border-gray-800 rounded-lg h-36 animate-pulse"
              />
            ))}
          </div>
        ) : hasError ? (
          <div className="text-red-500 p-4 border border-red-500 rounded-lg">
            Error loading search results. Please try again later.
          </div>
        ) : !hasResults ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No results found for "{searchQuery}"</p>
            <p className="text-sm text-gray-500">Try a different search term or check the filters</p>
          </div>
        ) : (
          <div>
            {/* Metal Tokens Results */}
            {filteredMetalTokens.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4 text-[#c0c0c0]">Metal Tokens</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredMetalTokens.map((token) => (
                    <Link key={token.id} href={`/coin/${parseInt(token.id) || 0}`}>
                      <a className="block h-full">
                        <CoinCard
                          coin={{
                            id: parseInt(token.id) || 0,
                            name: token.name,
                            symbol: token.symbol,
                            description: token.description || `${token.name} Token`,
                            image:
                              token.image ||
                              `https://avatars.dicebear.com/api/identicon/${token.symbol}.svg`,
                            createdAt: new Date(token.createdAt || Date.now()),
                            createdBy: "1",
                            marketCap: Number(token.totalSupply) * (token.price || 0),
                            replyCount: 0,
                            isMigrated: token.isMigrated || false,
                            isTrending: token.isTrending || false,
                            holderCount: token.holderCount || 0,
                            previousHolderCount: token.previousHolderCount || 0,
                            lastUpdated: new Date(),
                            isWithdrawn: false,
                            withdrawnAt: null,
                            price: token.price?.toString() || "0",
                            priceChange24h: token.priceChange24h || "0",
                            volume24h: token.volume24h || "0",
                            tags: token.tags || ["metal"],
                            metadata: {
                              address: token.address,
                              name: token.name,
                              symbol: token.symbol,
                              merchantAddress: token.merchantAddress,
                              totalSupply: token.totalSupply,
                              remainingRewardSupply: token.remainingAppSupply,
                              startingRewardSupply: token.startingAppSupply,
                              merchantSupply: token.merchantSupply,
                              price: token.price,
                            },
                          }}
                          showDescription={!isMobile} 
                        />
                      </a>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Original Coins Results */}
            {sortedCoins.length > 0 && (
              <div className="mb-8">
                {filteredMetalTokens.length > 0 && (
                  <h3 className="text-lg font-medium mb-4 text-[#c0c0c0]">Other Tokens</h3>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sortedCoins.map((coin) => (
                    <Link key={coin.id} href={`/coin/${coin.id}`}>
                      <a className="block h-full">
                        <CoinCard coin={coin} showDescription={!isMobile} />
                      </a>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;