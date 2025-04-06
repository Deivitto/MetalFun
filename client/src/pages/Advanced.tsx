import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import CategoryTags from "@/components/home/CategoryTags";
import SearchBar from "@/components/home/SearchBar";
import CoinCard from "@/components/home/CoinCard";
import { Filter, ArrowDownWideNarrow, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Coin } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

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
  holders?: number;
  
  // Properties for compatibility with the CoinCard component
  description?: string;
  image?: string;
  marketCap?: number;
  holderCount?: number;
  previousHolderCount?: number;
  priceChange24h?: string;
  volume24h?: string;
  createdAt?: string;
  isTrending?: boolean;
  isMigrated?: boolean;
  tags?: string[];
}

const Advanced = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedTag, setSelectedTag] = useState("all");
  const [sortOrder, setSortOrder] = useState("price-high-low");
  const [showAnimations, setShowAnimations] = useState(true);
  const [includeNsfw, setIncludeNsfw] = useState(false);
  
  // Fetch all coins to match with Metal tokens by address
  const { data: coins = [] } = useQuery<Coin[]>({
    queryKey: ["/api/coins"],
  });
  const [visibleTokens, setVisibleTokens] = useState(10);
  const [filteredTokens, setFilteredTokens] = useState<MetalToken[]>([]);
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0.5]);
  const [supplyRange, setSupplyRange] = useState<[number, number]>([
    0, 10000000000,
  ]);

  // Get Metal tokens
  const {
    data: tokensData = { tokens: [] },
    isLoading,
    error,
    refetch,
  } = useQuery<{ tokens: MetalToken[] }>({
    queryKey: ["/api/metal/tokens"],
    refetchInterval: 60000, // Refetch every minute
  });

  const metalTokens = tokensData.tokens || [];
  console.log(metalTokens, "asdasd");
  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag);
  };

  const handleSortChange = (value: string) => {
    setSortOrder(value);
  };

  const sortTokens = (tokens: MetalToken[] = []) => {
    switch (sortOrder) {
      case "price-high-low":
        return [...tokens].sort((a, b) => {
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          return priceB - priceA;
        });
      case "price-low-high":
        return [...tokens].sort((a, b) => {
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          return priceA - priceB;
        });
      case "supply-high-low":
        return [...tokens].sort((a, b) => {
          return b.totalSupply - a.totalSupply;
        });
      case "supply-low-high":
        return [...tokens].sort((a, b) => {
          return a.totalSupply - b.totalSupply;
        });
      case "remaining-high-low":
        return [...tokens].sort((a, b) => {
          return b.remainingAppSupply - a.remainingAppSupply;
        });
      case "remaining-low-high":
        return [...tokens].sort((a, b) => {
          return a.remainingAppSupply - b.remainingAppSupply;
        });
      default:
        return tokens;
    }
  };

  const toggleFilter = (filter: string) => {
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter((f) => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const applyFilters = (tokens: MetalToken[] = []) => {
    let filtered = [...tokens];

    // Filter by price range - this filter actually works
    filtered = filtered.filter((token) => {
      const tokenPrice = token.price || 0;
      console.log(tokenPrice, priceRange);
      return tokenPrice >= priceRange[0] && tokenPrice <= priceRange[1];
    });
    console.log(filtered, "filtered");
    // Filter by supply range - this filter actually works
    filtered = filtered.filter((token) => {
      const tokenSupply = token.totalSupply || 0;
      return tokenSupply >= supplyRange[0] && tokenSupply <= supplyRange[1];
    });
    console.log(filtered, "filtered");

    // Visual-only filters (not functionally applied)
    if (activeFilters.includes("trending")) {
      // We don't actually filter here
    }
    console.log(filtered, "filtered");

    if (activeFilters.includes("migrated")) {
      // We don't actually filter here
    }
    console.log(filtered, "filtered");

    return filtered;
  };

  // Load more tokens when scrolling to bottom
  const handleScroll = () => {
    const scrollPosition = window.innerHeight + window.scrollY;
    const bodyHeight = document.body.offsetHeight;

    if (
      scrollPosition >= bodyHeight - 800 &&
      filteredTokens.length > visibleTokens
    ) {
      // Load 10 more tokens
      setVisibleTokens((prev) => prev + 10);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [filteredTokens, visibleTokens]);

  // Update filtered tokens when data changes
  useEffect(() => {
    if (metalTokens.length > 0) {
      const sorted = sortTokens(metalTokens);
      const filtered = applyFilters(sorted);
      setFilteredTokens(filtered);
    }
  }, [
    metalTokens,
    sortOrder,
    activeFilters,
    priceRange,
    supplyRange,
    includeNsfw,
  ]);

  // Reset visible tokens when filters change
  useEffect(() => {
    setVisibleTokens(10);
  }, [
    selectedTag,
    sortOrder,
    activeFilters,
    priceRange,
    supplyRange,
    includeNsfw,
  ]);

  const displayedTokens = filteredTokens.slice(0, visibleTokens);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Page Title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-['Orbitron'] font-bold text-[#c0c0c0]">
          Advanced Search
        </h2>
      </div>

      {/* Search Bar */}
      <SearchBar />

      {/* Filter Toggle */}
      <div className="mb-6">
        <button
          onClick={() => setFilterExpanded(!filterExpanded)}
          className="flex items-center justify-between w-full bg-[#242235] border border-gray-700 rounded-lg p-3 text-[#c0c0c0] hover:bg-[#323046]"
        >
          <div className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            <span>
              Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 transition-transform",
              filterExpanded ? "transform rotate-180" : "",
            )}
          />
        </button>

        {filterExpanded && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#181622] border border-gray-700 rounded-lg p-4">
            {/* Advanced Sorting */}
            <div className="space-y-3">
              <h3 className="text-[#c0c0c0] font-medium flex items-center">
                <ArrowDownWideNarrow className="h-4 w-4 mr-2" />
                Sort By
              </h3>
              <Select value={sortOrder} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full bg-[#242235] border-gray-700 text-[#c0c0c0]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent className="bg-[#242235] border-gray-700 text-[#c0c0c0]">
                  <SelectItem value="price-high-low">
                    Price (High to Low)
                  </SelectItem>
                  <SelectItem value="price-low-high">
                    Price (Low to High)
                  </SelectItem>
                  <SelectItem value="supply-high-low">
                    Total Supply (High to Low)
                  </SelectItem>
                  <SelectItem value="supply-low-high">
                    Total Supply (Low to High)
                  </SelectItem>
                  <SelectItem value="remaining-high-low">
                    Remaining Supply (High to Low)
                  </SelectItem>
                  <SelectItem value="remaining-low-high">
                    Remaining Supply (Low to High)
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Settings */}
              <div className="pt-3 border-t border-gray-700">
                <h3 className="text-[#c0c0c0] font-medium mb-2">Settings</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="animations"
                      checked={showAnimations}
                      onChange={(e) => setShowAnimations(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-700 bg-[#242235] text-[#c0c0c0]"
                    />
                    <label
                      htmlFor="animations"
                      className="ml-2 text-[#a3a3a3] text-sm leading-none my-auto"
                    >
                      Show animations
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="nsfw"
                      checked={includeNsfw}
                      onChange={(e) => setIncludeNsfw(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-700 bg-[#242235] text-[#c0c0c0]"
                    />
                    <label
                      htmlFor="nsfw"
                      className="ml-2 text-[#a3a3a3] text-sm leading-none my-auto"
                    >
                      Include NSFW content
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Coin Filters */}
            <div className="space-y-3">
              <h3 className="text-[#c0c0c0] font-medium">Coin Filters</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="trending"
                    checked={activeFilters.includes("trending")}
                    onChange={() => toggleFilter("trending")}
                    className="h-4 w-4 rounded border-gray-700 bg-[#242235] text-[#c0c0c0]"
                  />
                  <label
                    htmlFor="trending"
                    className="ml-2 text-[#a3a3a3] text-sm leading-none my-auto"
                  >
                    Trending Coins
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="migrated"
                    checked={activeFilters.includes("migrated")}
                    onChange={() => toggleFilter("migrated")}
                    className="h-4 w-4 rounded border-gray-700 bg-[#242235] text-[#c0c0c0]"
                  />
                  <label
                    htmlFor="migrated"
                    className="ml-2 text-[#a3a3a3] text-sm leading-none my-auto"
                  >
                    Migrated Coins
                  </label>
                </div>
              </div>

              {/* Price Range */}
              <div className="pt-3 border-t border-gray-700">
                <h3 className="text-[#c0c0c0] font-medium mb-2">
                  Price Range (ETH)
                </h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) =>
                      setPriceRange([Number(e.target.value), priceRange[1]])
                    }
                    className="w-1/3 px-2 py-1 bg-[#242235] border border-gray-700 text-[#e6e6e6] rounded-lg focus:outline-none focus:border-[#c0c0c0]"
                    min="0"
                    step="0.001"
                  />
                  <span className="text-[#a3a3a3]">to</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], Number(e.target.value)])
                    }
                    className="w-1/3 px-2 py-1 bg-[#242235] border border-gray-700 text-[#e6e6e6] rounded-lg focus:outline-none focus:border-[#c0c0c0]"
                    min={priceRange[0]}
                    step="0.001"
                  />
                </div>
              </div>

              {/* Supply Range */}
              <div className="pt-3 border-t border-gray-700">
                <h3 className="text-[#c0c0c0] font-medium mb-2">
                  Total Supply
                </h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={supplyRange[0]}
                    onChange={(e) =>
                      setSupplyRange([Number(e.target.value), supplyRange[1]])
                    }
                    className="w-1/3 px-2 py-1 bg-[#242235] border border-gray-700 text-[#e6e6e6] rounded-lg focus:outline-none focus:border-[#c0c0c0]"
                    min="0"
                    step="1000000"
                  />
                  <span className="text-[#a3a3a3]">to</span>
                  <input
                    type="number"
                    value={supplyRange[1]}
                    onChange={(e) =>
                      setSupplyRange([supplyRange[0], Number(e.target.value)])
                    }
                    className="w-1/3 px-2 py-1 bg-[#242235] border border-gray-700 text-[#e6e6e6] rounded-lg focus:outline-none focus:border-[#c0c0c0]"
                    min={supplyRange[0]}
                    step="1000000"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Categories/Tags */}
      <CategoryTags onSelectTag={handleTagSelect} />

      {/* Results Count */}
      <div className="mb-4 text-[#a3a3a3]">
        {filteredTokens.length} tokens found
      </div>

      {/* Tokens List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-[#181622] border border-gray-800 rounded-lg h-32 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="p-4 border border-gray-700 rounded-lg bg-[#181622]">
          <p className="text-[#a3a3a3]">Error loading tokens. Please try again.</p>
        </div>
      ) : displayedTokens.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedTokens.map((token) => {
            // Find matching coin in coins data by checking address in metadata
            const matchingCoin = coins?.find(
              (coin) => coin.metadata && coin.metadata.address === token.address
            );
            
            const coinId = matchingCoin ? matchingCoin.id : 0;
            
            return (
              <div 
                key={token.id} 
                className="block h-full cursor-pointer"
                onClick={() => {
                  if (coinId) {
                    navigate(`/coin/${coinId}`);
                  } else {
                    toast({
                      title: "Token details not available",
                      description: "This token has not been synchronized to our database yet.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <CoinCard
                  coin={{
                    id: coinId,
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
                    isMigrated: false,
                    isTrending: false,
                    holderCount: token.holders || 0,
                    previousHolderCount: 0,
                    lastUpdated: new Date(),
                    isWithdrawn: false,
                    withdrawnAt: null,
                    price: token.price?.toString() || "0",
                    priceChange24h: "0",
                    volume24h: "0",
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
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 text-center border border-dashed border-gray-700 rounded-lg">
          <p className="text-[#a3a3a3]">
            No tokens found matching your filters. Try adjusting your search
            criteria.
          </p>
        </div>
      )}

      {/* Load More indicator */}
      {visibleTokens < filteredTokens.length && (
        <div className="mt-6 text-center">
          <p className="text-[#a3a3a3] text-sm">
            Scroll down to load more tokens
          </p>
        </div>
      )}
    </div>
  );
};

export default Advanced;
