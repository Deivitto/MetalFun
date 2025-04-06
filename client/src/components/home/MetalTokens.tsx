import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  ExternalLink,
  TrendingUp,
  DollarSign,
  BarChart3,
  ChevronRight,
  Users,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetalIcon, FireIcon } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetalToken {
  id: string;
  address?: string;
  name: string;
  symbol: string;
  merchantAddress: string;
  totalSupply?: number;
  merchantSupply?: number;
  price?: number;
  remainingRewardSupply?: number;
  startingRewardSupply?: number;
  lpInfo?: any;
  holders?: number;
  volume24h?: number;
  canDistribute: boolean;
  canLP: boolean;
  createdAt: string;
  status: "pending" | "completed" | "failed";
  message?: string;
  error?: string;
}

const formatNumber = (num: number | undefined): string => {
  if (!num) return "0";

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  } else {
    return num.toString();
  }
};

const formatPrice = (price: number | undefined): string => {
  if (!price) return "$0.00";

  if (price < 0.01) {
    return `$${price.toFixed(6)}`;
  } else if (price < 1) {
    return `$${price.toFixed(4)}`;
  } else {
    return `$${price.toFixed(2)}`;
  }
};

const MetalTokens = () => {
  const [, navigate] = useLocation();

  // Get Metal tokens
  const {
    data: tokens = [],
    isLoading,
    error,
    refetch,
  } = useQuery<any>({
    queryKey: ["/api/metal/tokens"],
    refetchInterval: 60000, // Refetch every minute
  });

  // Get all coins from database
  const { data: dbCoins = [] } = useQuery<any>({
    queryKey: ["/api/coins"],
  });

  const tokens_array = tokens.tokens || [];

  if (isLoading) {
    return (
      <div className="my-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <MetalIcon className="w-5 h-5" /> metal.fun Tokens{" "}
          <span className="text-xs text-gray-400 font-normal">
            (Loading...)
          </span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-[#181622] border border-gray-800 rounded-lg h-40 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <MetalIcon className="w-5 h-5" /> metal.fun Tokens
        </h3>
        <div className="p-4 border border-gray-700 rounded-lg bg-[#181622]">
          <p className="text-[#a3a3a3]">Error loading Metal tokens. Please try again.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!tokens_array || tokens_array.length === 0) {
    return (
      <div className="my-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <MetalIcon className="w-5 h-5" /> metal.fun Tokens
        </h3>
        <div className="p-6 text-center border border-dashed border-gray-700 rounded-lg">
          <p className="text-[#a3a3a3]">
            No tokens found. Create your own custom token on the Metal platform!
          </p>
        </div>
      </div>
    );
  }

  // Sort tokens by status (completed first) then by creation date (newest first)
  const sortedTokens = [...tokens_array].sort((a, b) => {
    // First sort by status
    if (a.status === "completed" && b.status !== "completed") return -1;
    if (a.status !== "completed" && b.status === "completed") return 1;

    // Then sort by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="my-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <MetalIcon className="w-5 h-5" /> metal.fun Tokens{" "}
          <span className="text-xs text-gray-400 font-normal">
            ({sortedTokens.length})
          </span>
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="text-xs"
        >
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedTokens.map((token: MetalToken) => {
          // Find coin ID for this token (match by symbol or address), or use default
          let coinId = 2; // Default to Ana's Gold

          try {
            const matchingCoin = dbCoins.find(
              (coin: any) =>
                coin.symbol === token.symbol ||
                (token.address && coin.metadata?.address === token.address),
            );
            if (matchingCoin?.id) {
              coinId = matchingCoin.id;
            }
          } catch (err) {
            console.error("Error matching token to coin:", err);
          }

          // Handler for card click
          const handleCardClick = () => {
            if (token.status === "completed") {
              navigate(`/coin/${coinId}`);
            }
          };

          return (
            <div
              key={token.id}
              onClick={handleCardClick}
              className={`bg-[#181622] border border-gray-800 hover:border-gray-500 transition-colors overflow-hidden rounded-lg p-4 h-full ${
                token.status === "completed"
                  ? "cursor-pointer hover:shadow-md"
                  : ""
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-black/20">
                    <img
                      src={`https://avatars.dicebear.com/api/identicon/${token.symbol}.svg`}
                      alt={token.symbol}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="text-lg font-semibold text-white">
                      {token.name} <span className="text-gray-400">({token.symbol})</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      market cap: ${formatPrice(token.price ? token.price * (token.totalSupply || 0) : 0).replace('$', '')}
                    </div>
                  </div>
                </div>
                <Badge
                  variant={
                    token.status === "completed"
                      ? "default"
                      : token.status === "pending"
                        ? "outline"
                        : "destructive"
                  }
                >
                  {token.status === "completed" ? "LIVE" : token.status}
                </Badge>
              </div>

              {token.status === "pending" && (
                <div className="flex items-center gap-2 text-yellow-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Processing token creation</span>
                </div>
              )}
              
              {token.status === "failed" && (
                <div className="text-red-500 text-sm">
                  {token.error || "Failed to create token"}
                </div>
              )}
              
              {token.status === "completed" && (
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between">
                    <div className="text-sm text-gray-400">Holders: {formatNumber(token.holders || 0)}</div>
                    <div className="text-sm text-gray-400">
                      <span className="text-[#e1c15c]">{token.price ? token.price.toFixed(2) : '0.00'} ETH</span> <span className="text-green-500">+0%</span>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <div className="text-gray-400">replies: 0</div>
                  </div>
                  
                  <div className="flex mt-2">
                    <span className="text-xs px-1.5 py-0.5 bg-[#232133] text-[#a3a3a3] rounded">#metal</span>
                  </div>
                </div>
              )}
              
              <div className="text-xs text-[#787878] mt-2">
                {new Date(token.createdAt).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MetalTokens;
