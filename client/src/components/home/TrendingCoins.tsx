import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CoinCard from "@/components/home/CoinCard";
import { Coin } from "@shared/schema";
import { FireIcon } from "@/assets/icons";

const TrendingCoins = () => {
  const [page, setPage] = useState(0);
  const itemsPerPage = 3; // Show 3 items per page on mobile

  const {
    data: coins,
    isLoading,
    error,
  } = useQuery<Coin[]>({
    queryKey: ["/api/coins/trending"],
    staleTime: 30000, // 30 seconds
  });

  // Get total pages based on available coins
  const totalPages = coins ? Math.ceil(coins.length / itemsPerPage) : 0;

  // Get current page items
  const currentCoins = coins
    ? coins.slice(page * itemsPerPage, page * itemsPerPage + itemsPerPage)
    : [];

  const goToNextPage = () => {
    if (page < totalPages - 1) {
      setPage(page + 1);
    } else {
      setPage(0); // Loop back to first page
    }
  };

  const goToPrevPage = () => {
    if (page > 0) {
      setPage(page - 1);
    } else {
      setPage(totalPages - 1); // Loop to last page
    }
  };

  return (
    <div className="mb-12 bg-[#181622]/50 rounded-lg p-4 border border-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-['Orbitron'] font-semibold text-[#c0c0c0] flex items-center">
          <FireIcon className="h-5 w-5 mr-2 text-orange-500" />
          <span>Fastest Growing</span>
        </h3>
        <div className="flex">
          <button
            className="text-[#a3a3a3] hover:text-[#c0c0c0] mr-3 transition-colors"
            onClick={goToPrevPage}
            disabled={isLoading || !coins || coins.length === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            className="text-[#a3a3a3] hover:text-[#c0c0c0] transition-colors"
            onClick={goToNextPage}
            disabled={isLoading || !coins || coins.length === 0}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-[#242235] border border-gray-800 rounded-lg h-40 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-red-500 p-4 border border-red-500 rounded-lg">
          Error loading trending coins. Please try again later.
        </div>
      ) : !coins || coins.length === 0 ? (
        <div className="text-[#a3a3a3] p-4 border border-dashed border-gray-700 rounded-lg text-center">
          No trending coins available at the moment.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentCoins.map((coin) => (
              <Link key={coin.id} href={`/coin/${coin.id}`}>
                <div className="block h-full cursor-pointer">
                  <CoinCard coin={coin} showDescription={false} />
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination indicators */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === page ? "bg-[#c0c0c0]" : "bg-gray-700"
                  }`}
                  onClick={() => setPage(i)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TrendingCoins;
