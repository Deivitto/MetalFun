import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { MetalIcon } from "@/assets/icons";
import {
  Box,
  UserCircle2,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Menu,
  LogOut,
  User,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Coin, Transaction } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  onCreateTokenClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCreateTokenClick }) => {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const [showTransactionInfo, setShowTransactionInfo] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [latestTransaction, setLatestTransaction] = useState<{
    type: "bought" | "withdrew";
    data: Coin;
  } | null>(null);
  const [displayedTransaction, setDisplayedTransaction] = useState<{
    type: "bought" | "withdrew";
    data: Coin;
  } | null>(null);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationsEnabled = useRef(true);
  const transactionIndex = useRef(0);
  const transactions = useRef<{ type: "bought" | "withdrew"; data: Coin }[]>(
    [],
  );

  // Get latest created coin
  const { data: latestCreatedCoin, dataUpdatedAt: createdUpdatedAt } =
    useQuery<Coin>({
      queryKey: ["/api/coins/latest-created"],
      staleTime: 60000, // 1 minute
      refetchInterval: animationsEnabled.current ? 3000 : false,
    });

  // Get latest withdrawn coin
  const { data: latestWithdrawnCoin, dataUpdatedAt: withdrawnUpdatedAt } =
    useQuery<Coin>({
      queryKey: ["/api/coins/latest-withdrawn"],
      staleTime: 60000, // 1 minute
      refetchInterval: animationsEnabled.current ? 3000 : false,
      // Don't show error if no withdrawn coins yet
      retry: false,
      refetchOnMount: false,
    });

  // Update transactions list when data changes
  useEffect(() => {
    if (!animationsEnabled.current) return;

    // Maintain a list of both transaction types
    transactions.current = [];

    if (latestCreatedCoin) {
      transactions.current.push({ type: "bought", data: latestCreatedCoin });
    }

    if (latestWithdrawnCoin) {
      transactions.current.push({
        type: "withdrew",
        data: latestWithdrawnCoin,
      });
    }

    // Set the initial transaction to display
    if (transactions.current.length > 0) {
      setDisplayedTransaction(transactions.current[0]);
    }

    // Start rotation timer
    if (updateTimerRef.current) {
      clearInterval(updateTimerRef.current);
    }

    if (transactions.current.length > 1) {
      updateTimerRef.current = setInterval(() => {
        transactionIndex.current =
          (transactionIndex.current + 1) % transactions.current.length;
        setDisplayedTransaction(transactions.current[transactionIndex.current]);
      }, 3000);
    }

    return () => {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
    };
  }, [
    latestCreatedCoin,
    latestWithdrawnCoin,
    createdUpdatedAt,
    withdrawnUpdatedAt,
  ]);

  // Toggle animations based on event
  useEffect(() => {
    const handleToggleAnimations = (event: Event) => {
      const customEvent = event as CustomEvent;
      animationsEnabled.current = customEvent.detail.enabled;
    };

    window.addEventListener(
      "toggleAnimations",
      handleToggleAnimations as EventListener,
    );

    return () => {
      window.removeEventListener(
        "toggleAnimations",
        handleToggleAnimations as EventListener,
      );
    };
  }, []);

  // Listen for toggle events from MobileNav
  useEffect(() => {
    const handleToggleTransactionInfo = (event: Event) => {
      const customEvent = event as CustomEvent;
      setShowTransactionInfo(customEvent.detail.visible);
    };

    window.addEventListener(
      "toggleTransactionInfo",
      handleToggleTransactionInfo as EventListener,
    );

    return () => {
      window.removeEventListener(
        "toggleTransactionInfo",
        handleToggleTransactionInfo as EventListener,
      );
    };
  }, []);

  return (
    <header className="bg-[#181622] border-b border-gray-800 sticky top-0 z-30">
      <div className="container mx-auto px-4 py-3">
        {/* Main row with all elements */}
        <div className="flex flex-wrap items-center">
          {/* Logo on left */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="mr-2 text-[#c0c0c0] md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <div className="bg-gradient-to-br from-[#333333] to-[#555555] p-1 rounded-md mr-2 shadow-md">
                  <MetalIcon className="h-4 w-4 text-[#c0c0c0]" />
                </div>
                <h1 className="text-xl font-['Orbitron'] font-bold text-[#c0c0c0]">
                  metal<span className="text-[#ffd700]">.fun</span>
                </h1>
              </div>
            </Link>
          </div>

          {/* Transaction Indicators - on same line for desktop, wrapped below for mobile */}
          {showTransactionInfo && (
            <div className="order-3 md:order-2 w-full md:w-auto flex flex-wrap justify-start gap-2 text-sm mt-3 md:mt-0 md:mx-2 md:flex-1">
              {/* Display the current transaction in rotation */}
              {displayedTransaction && (
                <div
                  className={`px-3 py-1 bg-opacity-20 rounded-lg flex flex-wrap items-center gap-1.5 ${
                    displayedTransaction.type === "withdrew"
                      ? "bg-[#ff4444]"
                      : "bg-[#c0c0c0]"
                  }`}
                >
                  <div className="flex items-center">
                    <UserCircle2
                      className={`h-4 w-4 mr-1.5 flex-shrink-0 ${
                        displayedTransaction.type === "withdrew"
                          ? "text-[#ff4444]"
                          : "text-[#c0c0c0]"
                      }`}
                    />
                    <span className="text-xs md:text-sm leading-none">
                      {displayedTransaction.data.createdBy.substring(0, 6)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs md:text-sm leading-none mx-1">
                      {displayedTransaction.type === "withdrew"
                        ? `withdrew ${displayedTransaction.data.symbol}`
                        : `bought ${displayedTransaction.data.symbol}`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile menu */}
          {showMobileMenu && (
            <div className="w-full order-4 mt-3 md:hidden">
              <div className="flex flex-col space-y-2 bg-[#242235] p-3 rounded-lg">
                <Link href="/mixer">
                  <div className="flex items-center px-3 py-2 hover:bg-[#323046] rounded-md">
                    <span className="text-[#c0c0c0]"></span>
                  </div>
                </Link>
                <div
                  className="flex items-center px-3 py-2 hover:bg-[#323046] rounded-md cursor-pointer"
                  onClick={onCreateTokenClick}
                >
                  <span className="text-[#c0c0c0]">Create token</span>
                </div>

                {user ? (
                  <>
                    <Link href="/profile">
                      <div className="flex items-center px-3 py-2 hover:bg-[#323046] rounded-md">
                        <User className="h-4 w-4 mr-2 text-[#c0c0c0]" />
                        <span className="text-[#c0c0c0]">Profile</span>
                      </div>
                    </Link>
                    <div
                      className="flex items-center px-3 py-2 hover:bg-[#323046] rounded-md cursor-pointer"
                      onClick={() => logoutMutation.mutate()}
                    >
                      <LogOut className="h-4 w-4 mr-2 text-[#c0c0c0]" />
                      <span className="text-[#c0c0c0]">
                        {logoutMutation.isPending
                          ? "Logging out..."
                          : "Log out"}
                      </span>
                    </div>
                  </>
                ) : (
                  <Link href="/auth">
                    <div className="flex items-center px-3 py-2 hover:bg-[#323046] rounded-md">
                      <span className="text-[#c0c0c0]">Log in</span>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Actions on right */}
          <div className="order-2 md:order-3 flex items-center gap-2 ml-auto">
            <Button
              onClick={onCreateTokenClick}
              className="bg-gradient-to-r from-[#c0c0c0] to-gray-500 text-[#242235] font-medium rounded-lg hover:opacity-90 transition-opacity text-sm hidden md:block"
            >
              Create token
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.avatar || undefined}
                        alt={user.username}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.displayName || user.username}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        @{user.username}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>
                      {logoutMutation.isPending ? "Logging out..." : "Log out"}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                className="border border-[#c0c0c0] text-[#c0c0c0] font-medium rounded-lg hover:bg-[#c0c0c0] hover:bg-opacity-10 transition-colors text-sm"
                onClick={() => navigate("/auth")}
              >
                Log in
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
