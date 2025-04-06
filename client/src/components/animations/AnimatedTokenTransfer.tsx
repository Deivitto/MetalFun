import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TokenTransferAnimation from './TokenTransferAnimation';
import TransferSuccessAnimation from './TransferSuccessAnimation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export type TransferStatus = 'idle' | 'preparing' | 'transferring' | 'success' | 'error';

interface AnimatedTokenTransferProps {
  isActive: boolean;
  onComplete?: () => void;
  status: TransferStatus;
  amount?: string | number;
  tokenSymbol?: string;
  fromAddress?: string;
  toAddress?: string;
  className?: string;
}

const AnimatedTokenTransfer: React.FC<AnimatedTokenTransferProps> = ({
  isActive,
  onComplete,
  status,
  amount = '1',
  tokenSymbol = 'TOKEN',
  fromAddress = '0x...123',
  toAddress = '0x...456',
  className = '',
}) => {
  const { toast } = useToast();
  const [transferStage, setTransferStage] = useState<TransferStatus>('idle');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Monitor status changes
  useEffect(() => {
    if (status === 'error') {
      toast({
        title: 'Transfer Failed',
        description: 'There was an error during the token transfer.',
        variant: 'destructive'
      });
      if (onComplete) onComplete();
    } else {
      setTransferStage(status);
      
      if (status === 'success') {
        setShowSuccess(true);
      }
    }
  }, [status, onComplete, toast]);
  
  // Handle transfer animation completion
  const handleTransferComplete = () => {
    // If transfer stage is "transferring", move to success
    if (transferStage === 'transferring') {
      setTransferStage('success');
      setShowSuccess(true);
    }
  };
  
  // Handle success animation completion
  const handleSuccessComplete = () => {
    setShowSuccess(false);
    setTransferStage('idle');
    if (onComplete) onComplete();
  };
  
  // Don't render anything when idle or inactive
  if (!isActive && transferStage === 'idle') {
    return null;
  }
  
  return (
    <>
      {/* Main transfer animation container */}
      <AnimatePresence>
        {(transferStage === 'preparing' || transferStage === 'transferring') && (
          <motion.div
            className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center ${className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#181622] border border-gray-700 rounded-lg p-6 max-w-md w-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <h3 className="text-lg font-semibold text-[#e6e6e6] text-center mb-4">
                {transferStage === 'preparing' ? 'Preparing Transfer' : 'Transferring Tokens'}
              </h3>
              
              {/* Transaction Info */}
              <div className="bg-[#242235] rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-[#a3a3a3] text-sm">From:</div>
                  <div className="text-[#e6e6e6] font-mono text-sm truncate max-w-[200px]">
                    {fromAddress}
                  </div>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <div className="text-[#a3a3a3] text-sm">To:</div>
                  <div className="text-[#e6e6e6] font-mono text-sm truncate max-w-[200px]">
                    {toAddress}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-[#a3a3a3] text-sm">Amount:</div>
                  <div className="text-[#e6e6e6] font-medium">
                    {amount} {tokenSymbol}
                  </div>
                </div>
              </div>
              
              {/* Animation */}
              {transferStage === 'preparing' ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-10 w-10 text-[#c0c0c0] animate-spin mb-4" />
                  <p className="text-[#a3a3a3] text-sm text-center">
                    Preparing your tokens for transfer...
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <TokenTransferAnimation 
                    start={transferStage === 'transferring'}
                    onComplete={handleTransferComplete}
                    amount={amount}
                    tokenSymbol={tokenSymbol}
                    direction="horizontal"
                  />
                  
                  {/* Source and Destination labels */}
                  <div className="flex justify-between items-center px-4 mt-2">
                    <div className="text-center">
                      <div className="text-xs text-[#a3a3a3]">From</div>
                      <div className="text-sm text-[#e6e6e6] font-medium">You</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-[#a3a3a3]">To</div>
                      <div className="text-sm text-[#e6e6e6] font-medium">Recipient</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Progress bar */}
              <div className="w-full h-1 bg-[#242235] rounded-full mt-6 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#c0c0c0] to-[#a0a0a0]"
                  initial={{ width: transferStage === 'preparing' ? '30%' : '50%' }}
                  animate={{ 
                    width: transferStage === 'preparing' ? '50%' : '100%',
                  }}
                  transition={{ 
                    duration: transferStage === 'preparing' ? 2 : 1.5, 
                    ease: 'easeInOut' 
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Success Animation */}
      <TransferSuccessAnimation 
        show={showSuccess}
        onComplete={handleSuccessComplete}
        message={`Successfully transferred ${amount} ${tokenSymbol}!`}
      />
    </>
  );
};

export default AnimatedTokenTransfer;