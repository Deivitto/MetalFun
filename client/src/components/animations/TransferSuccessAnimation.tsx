import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface TransferSuccessAnimationProps {
  show: boolean;
  onComplete?: () => void;
  message?: string;
}

// Simple confetti effect function
function triggerConfetti() {
  const colors = ['#c0c0c0', '#a0a0a0', '#e0e0e0', '#808080'];
  
  // Create 50 pieces of confetti
  for (let i = 0; i < 50; i++) {
    const confettiPiece = document.createElement('div');
    confettiPiece.className = 'confetti-piece';
    confettiPiece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confettiPiece.style.width = `${Math.random() * 10 + 5}px`;
    confettiPiece.style.height = `${Math.random() * 10 + 5}px`;
    confettiPiece.style.position = 'fixed';
    confettiPiece.style.zIndex = '9999';
    confettiPiece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    
    // Random starting position from center of screen
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2;
    
    confettiPiece.style.left = `${startX}px`;
    confettiPiece.style.top = `${startY}px`;
    
    document.body.appendChild(confettiPiece);
    
    // Animate the confetti
    const angle = Math.random() * Math.PI * 2;
    const velocity = 10 + Math.random() * 20;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;
    const rotation = Math.random() * 360;
    
    // Use CSS animation
    {
      confettiPiece.style.transition = 'all 1s ease-out';
      setTimeout(() => {
        confettiPiece.style.transform = `translate(${vx * 15}px, ${vy * 15}px) rotate(${rotation}deg)`;
        confettiPiece.style.opacity = '0';
      }, 10);
      
      // Remove after animation
      setTimeout(() => {
        if (document.body.contains(confettiPiece)) {
          document.body.removeChild(confettiPiece);
        }
      }, 1000);
    }
  }
}

const TransferSuccessAnimation: React.FC<TransferSuccessAnimationProps> = ({
  show,
  onComplete,
  message = 'Transaction Successful!'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      // Trigger confetti effect
      triggerConfetti();
      
      // Automatically hide after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        
        // Wait for exit animation to complete
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 500);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-[#181622] border border-gray-700 rounded-lg p-6 max-w-md w-full text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <motion.div 
              className="mx-auto h-16 w-16 rounded-full bg-green-900/30 flex items-center justify-center mb-4"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 10 }}
            >
              <Check className="h-8 w-8 text-green-400" />
            </motion.div>
            
            <motion.h3 
              className="text-xl font-bold text-[#e6e6e6] mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Success!
            </motion.h3>
            
            <motion.p 
              className="text-[#a3a3a3]"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {message}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransferSuccessAnimation;