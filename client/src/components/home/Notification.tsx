import React from "react";
import { Transaction } from "@shared/schema";
import { cn } from "@/lib/utils";
import { ExchangeIcon } from "@/assets/icons";
import { useQuery } from "@tanstack/react-query";
import { Coin } from "@shared/schema";

interface NotificationProps {
  transaction: Transaction;
}

const Notification: React.FC<NotificationProps> = ({ transaction }) => {
  const { data: coin } = useQuery<Coin>({
    queryKey: [`/api/coins/${transaction.coinId}`],
  });
  
  if (!coin) return null;
  
  return (
    <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-right max-w-xs bg-[#181622] border border-[#c0c0c0] rounded-lg shadow-md p-4 flex items-center space-x-3">
      <div className="flex-shrink-0">
        <ExchangeIcon className={cn(
          "h-5 w-5",
          transaction.type === 'buy' ? "text-[#ffd700]" : "text-[#c0c0c0]"
        )} />
      </div>
      <div>
        <p className="text-sm font-medium text-[#e6e6e6]">
          {transaction.userId} {transaction.type === 'buy' ? 'bought' : 'sold'} {transaction.amount} SOL of {coin.symbol}
        </p>
        <p className="text-xs text-[#a3a3a3]">
          mcap: ${(coin.marketCap / 1000).toFixed(1)}K
        </p>
      </div>
    </div>
  );
};

export default Notification;
