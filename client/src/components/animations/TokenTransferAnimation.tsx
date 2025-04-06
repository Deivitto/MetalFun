import React, { useRef, useEffect } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import gsap from 'gsap';

interface TokenTransferAnimationProps {
  start: boolean;
  onComplete?: () => void;
  amount?: string | number;
  tokenSymbol?: string;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

const TokenTransferAnimation: React.FC<TokenTransferAnimationProps> = ({
  start,
  onComplete,
  amount = '1',
  tokenSymbol = 'TOKEN',
  direction = 'horizontal',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tokenCircles = Array(Math.min(parseInt(amount.toString()) || 1, 10)).fill(0);
  const controls = useAnimationControls();
  
  // Setup and run the animation when start changes to true
  useEffect(() => {
    if (!start || !containerRef.current) return;
    
    const container = containerRef.current;
    const tokens = container.querySelectorAll('.token-circle');
    
    // Reset animation states
    gsap.set(tokens, { 
      x: 0, 
      y: 0, 
      scale: 1, 
      opacity: 1,
      rotate: 0
    });
    
    // Create timeline for staggered animation
    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });
    
    // Target position based on direction
    const targetX = direction === 'horizontal' ? '100%' : '0%';
    const targetY = direction === 'vertical' ? '100%' : '0%';
    
    // Create a staggered effect
    tl.to(tokens, {
      x: targetX,
      y: targetY,
      duration: 1.5,
      opacity: 0.5,
      rotate: direction === 'horizontal' ? 180 : 0,
      scale: 0.9,
      stagger: 0.1,
    });
    
    // Cleanup function
    return () => {
      tl.kill();
    };
  }, [start, onComplete, direction, amount]);
  
  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      style={{ 
        height: direction === 'vertical' ? '240px' : '120px',
        width: '100%' 
      }}
    >
      {/* Source Position */}
      <div 
        className="absolute flex items-center justify-center"
        style={{
          left: direction === 'horizontal' ? '5%' : '50%',
          top: direction === 'vertical' ? '5%' : '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="w-10 h-10 rounded-full bg-[#242235] border-2 border-gray-700 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-[#c0c0c0] flex items-center justify-center">
            <span className="text-[#242235] text-xs font-bold">S</span>
          </div>
        </div>
      </div>
      
      {/* Destination Position */}
      <div 
        className="absolute flex items-center justify-center"
        style={{
          left: direction === 'horizontal' ? '95%' : '50%',
          top: direction === 'vertical' ? '95%' : '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="w-10 h-10 rounded-full bg-[#242235] border-2 border-gray-700 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-[#c0c0c0] flex items-center justify-center">
            <span className="text-[#242235] text-xs font-bold">D</span>
          </div>
        </div>
      </div>
      
      {/* Connection Path */}
      <div
        className="absolute bg-gray-700"
        style={{
          left: direction === 'horizontal' ? '5%' : '50%',
          top: direction === 'vertical' ? '5%' : '50%',
          width: direction === 'horizontal' ? '90%' : '2px',
          height: direction === 'vertical' ? '90%' : '2px',
          transform: 'translate(-50%, -50%)'
        }}
      />
      
      {/* Token Circles */}
      {tokenCircles.map((_, i) => (
        <div 
          key={i}
          className="token-circle absolute"
          style={{
            left: direction === 'horizontal' ? '5%' : '50%',
            top: direction === 'vertical' ? '5%' : '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <motion.div
            animate={controls}
            className="relative"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c0c0c0] to-gray-500 shadow-lg flex items-center justify-center">
              <span className="text-[#242235] text-xs font-medium">
                {tokenSymbol.substring(0, 1)}
              </span>
            </div>
            
            {/* Optional: Sparkle effect */}
            {i % 3 === 0 && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-pulse" />
            )}
          </motion.div>
        </div>
      ))}
      
      {/* Show amount text */}
      <div 
        className="absolute"
        style={{
          left: '50%',
          top: direction === 'vertical' ? '50%' : '75%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="bg-[#242235]/80 px-2 py-1 rounded text-center">
          <span className="text-[#c0c0c0] text-xs font-medium">
            {amount} {tokenSymbol}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TokenTransferAnimation;