import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import TrendingCoins from "@/components/home/TrendingCoins";
import CategoryTags from "@/components/home/CategoryTags";
import SearchBar from "@/components/home/SearchBar";
import FilterOptions from "@/components/home/FilterOptions";
import CoinCard from "@/components/home/CoinCard";
import MetalTokens from "@/components/home/MetalTokens";
import { Coin } from "@shared/schema";

const Home = () => {
  const [selectedTag, setSelectedTag] = useState("all");
  const [sortOrder, setSortOrder] = useState("trending");
  const [showAnimations, setShowAnimations] = useState(true);
  const [includeNsfw, setIncludeNsfw] = useState(false);

  // Use different API endpoints based on the selected tag
  const {
    data: taggedCoins,
    isLoading,
    error,
  } = useQuery<Coin[]>({
    queryKey: [
      selectedTag === "all" ? "/api/coins" : `/api/coins/tag/${selectedTag}`,
    ],
  });

  // Get Metal tokens
  const {
    data: tokens = [],
    isLoading: isLoadingTokens,
    error: tokensError,
    refetch,
  } = useQuery<any>({
    queryKey: ["/api/metal/tokens"],
    refetchInterval: 60000, // Refetch every minute
  });

  console.log(taggedCoins);

  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag);
  };

  const handleSortChange = (value: string) => {
    setSortOrder(value);
  };

  const sortCoins = (coins: Coin[] = []) => {
    switch (sortOrder) {
      case "newest":
        return [...coins].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      case "highest-mcap":
        return [...coins].sort((a, b) => b.marketCap - a.marketCap);
      case "lowest-mcap":
        return [...coins].sort((a, b) => a.marketCap - b.marketCap);
      case "trending":
      default:
        return [...coins].sort((a, b) => {
          if (a.isTrending && !b.isTrending) return -1;
          if (!a.isTrending && b.isTrending) return 1;
          return b.marketCap - a.marketCap;
        });
    }
  };

  const sortedCoins = sortCoins(taggedCoins);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Page Title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-['Orbitron'] font-bold text-[#c0c0c0]">
          [start a new coin]
        </h2>
      </div>

      {/* Search Bar */}
      <SearchBar />

      {/* Trending Section */}
      <TrendingCoins />

      {/* Filter Options */}
      <FilterOptions
        onSortChange={handleSortChange}
        onAnimationsChange={setShowAnimations}
        onNsfwChange={setIncludeNsfw}
      />

      <MetalTokens />
      {/* Categories/Tags */}
      <CategoryTags onSelectTag={handleTagSelect} />

      {/* Metal Tokens Section */}
      {/* Coins by Tag */}
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
        <div className="text-red-500 p-4 border border-red-500 rounded-lg">
          Error loading coins. Please try again.
        </div>
      ) : sortedCoins?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedCoins.map((coin) => (
            <Link key={coin.id} href={`/coin/${coin.id}`}>
              <div className="block h-full cursor-pointer">
                <CoinCard coin={coin} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center border border-dashed border-gray-700 rounded-lg">
          <p className="text-[#a3a3a3]">
            No coins found for this tag. Be the first to create one!
          </p>
          <Link href="/create">
            <div className="inline-block mt-4 px-4 py-2 bg-gradient-to-r from-[#c0c0c0] to-gray-500 text-[#242235] font-medium rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
              Create a coin
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;
