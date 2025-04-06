import React from "react";
import { Coin } from "@shared/schema";
import { CrownIcon, ExchangeIcon, FireIcon } from "@/assets/icons";
import { cn, formatCurrency, formatCompactNumber } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

interface CoinCardProps {
  coin: Coin;
  showDescription?: boolean;
}

const CoinCard: React.FC<CoinCardProps> = ({
  coin,
  showDescription = false,
}) => {
  // Check if price is up or down based on 24h change
  const priceChange24h = coin.priceChange24h || "0.00";
  const isPriceUp = !priceChange24h.startsWith("-");
  const priceChangeAbs = priceChange24h.startsWith("-")
    ? priceChange24h.substring(1)
    : priceChange24h;

  // Check if holder count has increased
  const hasHolderIncrease =
    (coin.holderCount || 0) > (coin.previousHolderCount || 0);

  return (
    <div className="bg-[#181622] border border-[rgba(255,255,255,0.1)] rounded-lg overflow-hidden transition-all duration-300 h-full hover:transform hover:-translate-y-1 hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.5),0_4px_6px_-2px_rgba(255,255,255,0.1)] hover:border-[rgba(192,192,192,0.5)]">
      <div className="p-3 flex">
        <div
          className={cn(
            "rounded-lg overflow-hidden mr-3 flex-shrink-0 bg-black/20",
            showDescription
              ? "w-14 h-14 sm:w-16 sm:h-16"
              : "w-16 h-16 sm:w-20 sm:h-20",
          )}
        >
          <img
            src={coin.image}
            alt={coin.name}
            className="w-full h-full object-cover p-2"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-['Orbitron'] font-bold text-[#c0c0c0] truncate">
                {coin.name} <span className="text-[#a3a3a3]">({coin.symbol})</span>
              </h4>
              <div className="flex items-center mt-1 text-xs">
                <span className="text-[#a3a3a3] leading-none">
                  market cap: 
                </span>
                <span className="ml-1 text-[#c0c0c0] leading-none">
                  {formatCurrency(coin.marketCap)}
                </span>
                
                {hasHolderIncrease && (
                  <div className="ml-2 flex items-center">
                    <FireIcon className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  </div>
                )}
                
                {coin.isMigrated && (
                  <div className="ml-2 flex items-center">
                    <ExchangeIcon className="h-4 w-4 text-[#c0c0c0] flex-shrink-0" />
                  </div>
                )}
                
                {coin.isTrending && (
                  <div className="ml-1 flex items-center">
                    <CrownIcon className="h-4 w-4 text-[#ffd700] flex-shrink-0" />
                  </div>
                )}
              </div>
            </div>
            {coin.isWithdrawn && (
              <span className="px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                Withdrawn
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-[#a3a3a3] leading-none truncate my-auto">
              replies: {formatCompactNumber(coin.replyCount)}
            </p>

            <div className="flex items-center">
              <span className="text-xs mr-1.5 text-[#a3a3a3] leading-none">
                {coin.price} ETH
              </span>
              <span
                className={cn(
                  "flex items-center text-xs font-medium",
                  isPriceUp ? "text-green-500" : "text-red-500",
                )}
              >
                {isPriceUp ? (
                  <ArrowUp className="h-3 w-3 mr-0.5" />
                ) : (
                  <ArrowDown className="h-3 w-3 mr-0.5" />
                )}
                {priceChangeAbs}%
              </span>
            </div>
          </div>

          <div className="mt-1.5 flex items-center">
            <span className="text-xs text-[#a3a3a3] leading-none">
              Holders: {formatCompactNumber(coin.holderCount)}
            </span>
            {hasHolderIncrease && (
              <span className="ml-1 text-xs text-green-500">
                (+{coin.holderCount - coin.previousHolderCount})
              </span>
            )}
          </div>
          
          {/* Tags section */}
          {coin.tags && coin.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {coin.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs px-1.5 py-0.5 bg-[#232133] text-[#a3a3a3] rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {showDescription && (
        <div className="border-t border-gray-800 p-4">
          <p className="line-clamp-2 text-sm">{coin.description}</p>
        </div>
      )}
    </div>
  );
};

export default CoinCard;
