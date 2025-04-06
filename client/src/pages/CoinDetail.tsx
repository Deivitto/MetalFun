import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import {
  ArrowLeft,
  MessageSquare,
  Share2,
  Heart,
  RefreshCw,
  BarChart4,
  ExternalLink,
  Droplets,
} from "lucide-react";
import { Coin, Transaction, Reply } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  formatCurrency,
  getRelativeTime,
  formatCompactNumber,
} from "@/lib/utils";
import { CrownIcon, ExchangeIcon, MetalIcon } from "@/assets/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const CoinDetail = () => {
  const params = useParams<{ id: string; replyId?: string }>();
  const id = parseInt(params.id);
  const replyIdFromParams = params.replyId ? parseInt(params.replyId) : null;

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [reply, setReply] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [selectedReplyId, setSelectedReplyId] = useState<number | null>(
    replyIdFromParams,
  );

  // Reference to selected reply for scrolling
  const selectedReplyRef = useRef<HTMLDivElement>(null);

  // Fetch coin data
  const {
    data: coin,
    isLoading: isLoadingCoin,
    error: coinError,
  } = useQuery<Coin>({
    queryKey: [`/api/coins/${id}`],
    enabled: !isNaN(id),
  });

  // Fetch transactions
  const { data: transactions, isLoading: isLoadingTx } = useQuery<
    Transaction[]
  >({
    queryKey: [`/api/coins/${id}/transactions`],
    enabled: !isNaN(id),
  });

  // Fetch replies
  const { data: replies, isLoading: isLoadingReplies } = useQuery<Reply[]>({
    queryKey: [`/api/coins/${id}/replies`],
    enabled: !isNaN(id),
  });

  // Effect to scroll to selected reply after loading
  useEffect(() => {
    if (selectedReplyId && selectedReplyRef.current && !isLoadingReplies) {
      selectedReplyRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedReplyId, isLoadingReplies]);

  // Buy mutation
  const buyMutation = useMutation({
    mutationFn: async (amount: string) => {
      const payload = {
        userId: "Anonymous", // In a real app, this would be the logged-in user
        coinId: id,
        amount,
        type: "buy",
        solAmount: amount,
      };

      const res = await apiRequest("POST", "/api/transactions", payload);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Purchase successful",
        description: `You've purchased ${amount} ETH of ${coin?.symbol}`,
      });

      queryClient.invalidateQueries({ queryKey: [`/api/coins/${id}`] });
      queryClient.invalidateQueries({
        queryKey: [`/api/coins/${id}/transactions`],
      });
      setAmount("");
    },
    onError: (error) => {
      toast({
        title: "Transaction failed",
        description:
          error.message || "Something went wrong with your purchase.",
        variant: "destructive",
      });
    },
  });

  // Sell mutation
  const sellMutation = useMutation({
    mutationFn: async (amount: string) => {
      const payload = {
        userId: "Anonymous", // In a real app, this would be the logged-in user
        coinId: id,
        amount,
        type: "sell",
        solAmount: amount,
      };

      const res = await apiRequest("POST", "/api/transactions", payload);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sale successful",
        description: `You've sold ${amount} ETH of ${coin?.symbol}`,
      });

      queryClient.invalidateQueries({ queryKey: [`/api/coins/${id}`] });
      queryClient.invalidateQueries({
        queryKey: [`/api/coins/${id}/transactions`],
      });
      setAmount("");
    },
    onError: (error) => {
      toast({
        title: "Transaction failed",
        description: error.message || "Something went wrong with your sale.",
        variant: "destructive",
      });
    },
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async (content: string) => {
      const payload = {
        userId: "Anonymous", // In a real app, this would be the logged-in user
        coinId: id,
        content,
        isAnonymous: isAnonymous,
      };

      const res = await apiRequest("POST", "/api/replies", payload);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reply posted",
        description: "Your reply has been posted successfully.",
      });

      queryClient.invalidateQueries({ queryKey: [`/api/coins/${id}/replies`] });
      queryClient.invalidateQueries({ queryKey: [`/api/coins/${id}`] });
      setReply("");
      setIsAnonymous(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to post reply",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const handleBuy = () => {
    if (!amount || isNaN(parseFloat(amount))) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to buy.",
        variant: "destructive",
      });
      return;
    }

    buyMutation.mutate(amount);
  };

  const handleSell = () => {
    if (!amount || isNaN(parseFloat(amount))) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to sell.",
        variant: "destructive",
      });
      return;
    }

    sellMutation.mutate(amount);
  };

  // Like reply mutation
  const likeReplyMutation = useMutation({
    mutationFn: async (replyId: number) => {
      const res = await apiRequest("POST", `/api/replies/${replyId}/like`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/coins/${id}/replies`] });
    },
    onError: (error) => {
      toast({
        title: "Like failed",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  // Create liquidity mutation
  const createLiquidityMutation = useMutation({
    mutationFn: async (tokenAddress: string) => {
      const res = await apiRequest("POST", "/api/metal/create-liquidity", { tokenAddress });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Liquidity created",
        description: `Successfully created liquidity pool for ${coin?.symbol}`,
      });
      
      // Refresh coin data to show updated liquidity info
      queryClient.invalidateQueries({ queryKey: [`/api/coins/${id}`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create liquidity",
        description: error.message || "Something went wrong while creating liquidity.",
        variant: "destructive",
      });
    },
  });

  const handleCreateLiquidity = () => {
    if (!coin?.metadata?.address) {
      toast({
        title: "Cannot create liquidity",
        description: "This token doesn't have a valid address.",
        variant: "destructive",
      });
      return;
    }

    createLiquidityMutation.mutate(coin.metadata.address);
  };

  const handleLikeReply = (replyId: number) => {
    likeReplyMutation.mutate(replyId);
  };

  const handlePostReply = () => {
    if (!reply.trim()) {
      toast({
        title: "Empty reply",
        description: "Please write something before posting.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      coinId: id,
      userId: "Anonymous", // In a real app, this would be the logged-in user
      content: reply,
      parentId: replyingTo,
      isAnonymous: isAnonymous,
    };

    replyMutation.mutate(payload.content);

    // Reset replyingTo after posting
    if (replyingTo) {
      setReplyingTo(null);
    }
  };

  const handleShareReply = (replyId: number) => {
    const url = `${window.location.origin}/coin/${id}/reply/${replyId}`;

    // Attempt to use clipboard API
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          toast({
            title: "Link copied!",
            description: "Reply link has been copied to your clipboard.",
          });
        })
        .catch(() => {
          // Fallback if clipboard API fails
          prompt("Copy this link:", url);
        });
    } else {
      // Fallback for browsers without clipboard API
      prompt("Copy this link:", url);
    }
  };

  if (isLoadingCoin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-8 w-40 bg-gray-700 rounded mb-6"></div>
          <div className="h-40 bg-gray-700 rounded mb-6"></div>
          <div className="h-80 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (coinError || !coin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/">
            <div className="inline-flex items-center text-[#c0c0c0] hover:underline mb-6 cursor-pointer">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to home
            </div>
          </Link>

          <div className="p-6 text-center border border-red-500 rounded-lg">
            <p className="text-red-500">
              Error loading coin details. The coin may not exist.
            </p>
            <Link href="/">
              <div className="inline-block mt-4 px-4 py-2 bg-gradient-to-r from-[#c0c0c0] to-gray-500 text-[#242235] font-medium rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
                Return to home
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <div className="inline-flex items-center text-[#c0c0c0] hover:underline mb-6 cursor-pointer">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to home
          </div>
        </Link>

        {/* Coin Header */}
        <div className="bg-[#181622] border border-[rgba(255,255,255,0.1)] rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center mb-6">
            <div className="w-24 h-24 rounded-lg overflow-hidden mr-6 mb-4 md:mb-0">
              <img
                src={coin.image}
                alt={coin.name}
                className="w-full h-full object-cover p-2"
              />
            </div>

            <div>
              <div className="flex items-center">
                <h1 className="text-2xl font-['Orbitron'] font-bold text-[#c0c0c0] mr-2">
                  {coin.name}
                </h1>
                {coin.isTrending && (
                  <CrownIcon
                    className="h-5 w-5 text-[#ffd700]"
                    title="Top trending"
                  />
                )}
                {coin.isMigrated && (
                  <ExchangeIcon
                    className="h-5 w-5 text-[#c0c0c0] ml-1"
                    title="Migrated"
                  />
                )}
              </div>

              <p className="text-lg text-[#a3a3a3] mb-1">({coin.symbol})</p>

              <div className="flex items-center text-sm space-x-4">
                <div className="flex items-center">
                  <span className="text-[#a3a3a3]">Creator:</span>
                  <span className="ml-1 text-[#e6e6e6]">{coin.createdBy}</span>
                </div>

                <div className="flex items-center">
                  <span className="text-[#a3a3a3]">Market Cap:</span>
                  <span className="ml-1 text-[#c0c0c0] font-medium">
                    {formatCurrency(coin.marketCap)}
                  </span>
                </div>
              </div>

              <div className="flex mt-2 text-sm">
                <div className="flex items-center mr-4">
                  <MessageSquare className="h-4 w-4 text-[#a3a3a3] mr-1" />
                  <span className="text-[#a3a3a3]">
                    {formatCompactNumber(coin.replyCount)} replies
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {coin.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-[#242235] text-[#c0c0c0] rounded-full text-xs flex items-center my-auto"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="text-[#e6e6e6] mb-6">{coin.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center mb-1">
                <label className="block text-sm text-[#a3a3a3]">
                  Amount (ETH)
                </label>
                <span className="ml-2 text-xs text-[#a0a0a0] italic bg-[#242235] px-1.5 py-0.5 rounded-sm">
                  Simulated
                </span>
              </div>
              <div className="flex">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="flex-1 px-4 py-3 bg-[#242235] border border-gray-700 text-[#e6e6e6] rounded-l-lg focus:outline-none focus:border-[#c0c0c0]"
                  min="0.001"
                  step="0.001"
                />
                <Button
                  onClick={handleBuy}
                  disabled={buyMutation.isPending}
                  className="px-4 py-2 bg-gradient-to-r from-[#c0c0c0] to-gray-500 text-[#242235] font-medium rounded-r-lg hover:opacity-90 transition-opacity"
                >
                  Buy
                </Button>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-1">
                <label className="block text-sm text-[#a3a3a3]">
                  Amount (ETH)
                </label>
                <span className="ml-2 text-xs text-[#a0a0a0] italic bg-[#242235] px-1.5 py-0.5 rounded-sm">
                  Simulated
                </span>
              </div>
              <div className="flex">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="flex-1 px-4 py-3 bg-[#242235] border border-gray-700 text-[#e6e6e6] rounded-l-lg focus:outline-none focus:border-[#c0c0c0]"
                  min="0.001"
                  step="0.001"
                />
                <Button
                  onClick={handleSell}
                  disabled={sellMutation.isPending}
                  className="px-4 py-2 bg-[#242235] border border-[#c0c0c0] text-[#c0c0c0] font-medium rounded-r-lg hover:bg-[#181622] transition-colors"
                >
                  Sell
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* TradingView Chart for Metal tokens */}
        {coin.metadata?.address && (
          <div className="bg-[#181622] border border-[rgba(255,255,255,0.1)] rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart4 className="h-5 w-5 text-[#a3a3a3]" />
                <h3 className="text-lg font-semibold text-[#c0c0c0]">
                  Price Chart
                </h3>
                <div className="flex items-center gap-1 bg-[#242235] px-2 py-0.5 rounded text-xs">
                  <MetalIcon className="h-3 w-3" />
                  <span className="text-[#a3a3a3]">metal.fun Token</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {coin.metadata?.address && (
                  <a
                    href={`https://explorer.metalswap.xyz/address/${coin.metadata.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1 text-primary hover:text-primary/80"
                  >
                    View on Explorer <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                
                {coin.metadata?.address && !coin.metadata?.lpInfo?.liquidityPoolAddress && (
                  <Button
                    onClick={handleCreateLiquidity}
                    disabled={createLiquidityMutation.isPending}
                    className="text-xs flex items-center gap-1 px-2 py-1 h-auto bg-gradient-to-r from-[#c0c0c0] to-gray-500 text-[#242235]"
                  >
                    <Droplets className="h-3 w-3" /> Create Liquidity
                  </Button>
                )}
                
                {coin.metadata?.lpInfo?.liquidityPoolAddress && (
                  <span className="text-xs flex items-center gap-1 px-2 py-1 bg-[#242235] text-green-400 rounded">
                    <Droplets className="h-3 w-3" /> Liquidity Available
                  </span>
                )}
              </div>
            </div>

            <div className="w-full h-[400px] rounded-lg overflow-hidden relative">
              {/* TradingView Widget */}
              <iframe
                title={`${coin.name} Chart`}
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=1000SHIBUSD&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=exchange&withdateranges=0&hideideas=1&enablepublishing=0&hide_side_toolbar=1&allow_symbol_change=1&showpopupbutton=1`}
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="accelerometer; autoplay; camera; encrypted-media; fullscreen; gyroscope; picture-in-picture"
                allowFullScreen={true}
              ></iframe>

              {/* Overlay with token information */}
              <div className="absolute bottom-4 left-4 bg-[#181622]/80 p-3 rounded-lg border border-[rgba(255,255,255,0.1)] backdrop-blur-sm">
                <div className="text-[#c0c0c0] font-semibold">
                  {coin.symbol}
                </div>
                {coin.metadata?.price && (
                  <div className="text-green-400 text-lg font-bold">
                    ${parseFloat(coin.metadata.price.toString()).toFixed(4)}
                  </div>
                )}
                {coin.metadata?.totalSupply && (
                  <div className="text-xs text-[#a3a3a3]">
                    Supply: {coin.metadata.totalSupply.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs for Transactions & Replies */}
        <Tabs defaultValue="transactions" className="mb-8">
          <TabsList className="bg-[#181622] border border-gray-800 rounded-lg mb-4 w-full">
            <TabsTrigger
              value="transactions"
              className="flex-1 data-[state=active]:bg-[#242235] data-[state=active]:text-[#c0c0c0]"
            >
              Transactions
            </TabsTrigger>
            <TabsTrigger
              value="replies"
              className="flex-1 data-[state=active]:bg-[#242235] data-[state=active]:text-[#c0c0c0]"
            >
              Replies ({coin.replyCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <div className="bg-[#181622] border border-[rgba(255,255,255,0.1)] rounded-lg p-4">
              {isLoadingTx ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-700 rounded"></div>
                  ))}
                </div>
              ) : transactions?.length ? (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 border-b border-gray-800 last:border-0"
                    >
                      <div className="flex items-center">
                        <div
                          className={`
                          w-2 h-2 rounded-full mr-3
                          ${tx.type === "buy" ? "bg-green-500" : "bg-red-500"}
                        `}
                        ></div>
                        <div>
                          <p className="text-[#e6e6e6]">
                            <span className="text-[#c0c0c0]">{tx.userId}</span>{" "}
                            {tx.type === "buy" ? "bought" : "sold"}{" "}
                            <span className="text-[#c0c0c0]">
                              {tx.amount} ETH
                            </span>{" "}
                            of {coin.symbol}
                          </p>
                          <p className="text-xs text-[#a3a3a3]">
                            {getRelativeTime(new Date(tx.createdAt))}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-medium ${tx.type === "buy" ? "text-green-500" : "text-red-500"}`}
                        >
                          {tx.type === "buy" ? "+" : "-"}
                          {tx.solAmount} ETH
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-[#a3a3a3]">
                    No transactions yet. Be the first to buy this coin!
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="replies">
            <div className="bg-[#181622] border border-[rgba(255,255,255,0.1)] rounded-lg p-4">
              <div className="mb-4">
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Add your reply..."
                  className="w-full px-4 py-3 bg-[#242235] border border-gray-700 text-[#e6e6e6] rounded-lg focus:outline-none focus:border-[#c0c0c0] min-h-24"
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="anonymous-checkbox"
                      checked={isAnonymous}
                      onChange={() => setIsAnonymous(!isAnonymous)}
                      className="w-4 h-4 text-[#c0c0c0] bg-[#242235] border-gray-700 rounded focus:ring-[#c0c0c0]"
                    />
                    <label
                      htmlFor="anonymous-checkbox"
                      className="ml-2 text-sm text-[#a3a3a3]"
                    >
                      Post anonymously
                    </label>
                  </div>
                  <Button
                    onClick={handlePostReply}
                    disabled={replyMutation.isPending}
                    className="px-4 py-2 bg-gradient-to-r from-[#c0c0c0] to-gray-500 text-[#242235] font-medium rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Post Reply
                  </Button>
                </div>
              </div>

              {isLoadingReplies ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-700 rounded"></div>
                  ))}
                </div>
              ) : replies?.length ? (
                <div className="space-y-4">
                  {replies.map((reply) => (
                    <div
                      key={reply.id}
                      id={`reply-${reply.id}`}
                      ref={
                        selectedReplyId === reply.id ? selectedReplyRef : null
                      }
                      className={`p-3 border-b border-gray-800 last:border-0 ${
                        selectedReplyId === reply.id
                          ? "bg-[#242235]/60 rounded-lg border-l-2 border-l-primary"
                          : ""
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <span className="text-[#c0c0c0] font-medium">
                          {reply.isAnonymous ? "Anonymous" : reply.userId}
                        </span>
                        {reply.isAnonymous && (
                          <span className="ml-2 text-xs text-[#a3a3a3] bg-[#242235] px-1.5 py-0.5 rounded-sm">
                            anonymous
                          </span>
                        )}
                        <span className="text-xs text-[#a3a3a3] ml-2">
                          {getRelativeTime(new Date(reply.createdAt))}
                        </span>
                      </div>

                      {reply.parentId && (
                        <div className="mb-2 text-xs text-[#a3a3a3] bg-[#242235] p-2 rounded">
                          <span>Replying to comment #{reply.parentId}</span>
                        </div>
                      )}

                      <p className="text-[#e6e6e6]">{reply.content}</p>

                      <div className="flex items-center mt-2 text-[#a3a3a3] text-sm">
                        <button
                          onClick={() => handleLikeReply(reply.id)}
                          disabled={likeReplyMutation.isPending}
                          className="flex items-center mr-4 hover:text-[#e6e6e6] transition-colors"
                        >
                          <Heart
                            className={`h-4 w-4 mr-1 ${reply.likeCount > 0 ? "fill-red-500 text-red-500" : ""}`}
                          />
                          <span>
                            {reply.likeCount > 0 ? reply.likeCount : ""} Like
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            setReplyingTo(reply.id);
                            setReply(
                              `@${reply.isAnonymous ? "Anonymous" : reply.userId} `,
                            );
                          }}
                          className="flex items-center mr-4 hover:text-[#e6e6e6] transition-colors"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          <span>Reply</span>
                        </button>

                        <button
                          onClick={() => handleShareReply(reply.id)}
                          className="flex items-center hover:text-[#e6e6e6] transition-colors"
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          <span>Share</span>
                        </button>
                      </div>

                      {replyingTo === reply.id && (
                        <div className="mt-3 pl-4 border-l-2 border-gray-700">
                          <div className="text-xs text-[#a3a3a3] mb-2">
                            Replying to this comment
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-[#a3a3a3]">
                    No replies yet. Be the first to leave a reply!
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CoinDetail;
