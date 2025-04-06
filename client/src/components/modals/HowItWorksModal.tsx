import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MetalIcon } from "@/assets/icons";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReady: () => void;
}

const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
  onReady,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-[#181622] border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center flex items-center justify-center gap-2 text-white">
            <MetalIcon className="w-6 h-6" /> How metal.fun Works
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Learn how to create and interact with tokens on metal.fun
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 text-gray-300">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">1. Create a Token</h3>
            <p>
              Design your own token with a custom name, symbol, and supply.
              Configure advanced settings like distribution terms.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">2. Launch on Metal</h3>
            <p>
              Your token will be created on the Metal blockchain with its own
              liquidity pool, making it instantly tradable.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">3. Share & Grow</h3>
            <p>
              Share your token with friends, build a community, and watch your token
              grow in value as more people buy and trade it.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">4. Trade & Earn</h3>
            <p>
              Buy and sell tokens created by others. Earn rewards through
              trading, holding, and participating in the metal.fun ecosystem.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={onReady} 
            className="w-full bg-gradient-to-r from-[#c0c0c0] to-gray-500 hover:opacity-90 text-[#242235]"
          >
            I'm Ready to Create a Token
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorksModal;