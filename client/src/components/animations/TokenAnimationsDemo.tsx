import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import AnimatedTokenTransfer, { TransferStatus } from './AnimatedTokenTransfer';
import TokenTransferAnimation from './TokenTransferAnimation';
import TransferSuccessAnimation from './TransferSuccessAnimation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

// Demo component to showcase all the token animations
const TokenAnimationsDemo: React.FC = () => {
  // States for full animation sequence demo
  const [isFullAnimationActive, setIsFullAnimationActive] = useState(false);
  const [fullAnimationStatus, setFullAnimationStatus] = useState<TransferStatus>('idle');
  const [fullAmount, setFullAmount] = useState('2.5');
  const [fullToken, setFullToken] = useState('METAL');
  
  // States for individual animation demos
  const [isTransferAnimationActive, setIsTransferAnimationActive] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [transferDirection, setTransferDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [transferAmount, setTransferAmount] = useState('3');
  const [transferToken, setTransferToken] = useState('GOLD');
  
  // Handle full animation sequence
  const startFullAnimation = () => {
    setIsFullAnimationActive(true);
    setFullAnimationStatus('preparing');
    
    // Simulate preparing for 2 seconds then start transfer
    setTimeout(() => {
      setFullAnimationStatus('transferring');
    }, 2000);
  };
  
  const resetFullAnimation = () => {
    setIsFullAnimationActive(false);
    setFullAnimationStatus('idle');
  };
  
  // Handle simple transfer animation
  const startTransferAnimation = () => {
    setIsTransferAnimationActive(true);
    
    // Reset after animation completes
    setTimeout(() => {
      setIsTransferAnimationActive(false);
    }, 3000);
  };
  
  // Handle success animation
  const startSuccessAnimation = () => {
    setShowSuccessAnimation(true);
  };
  
  return (
    <div className="container mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold text-[#e6e6e6] mb-8 text-center">
        Token Animation Demonstrations
      </h2>
      
      <Tabs defaultValue="full" className="max-w-4xl mx-auto">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="full">Full Transfer Process</TabsTrigger>
          <TabsTrigger value="transfer">Token Transfer</TabsTrigger>
          <TabsTrigger value="success">Success Animation</TabsTrigger>
        </TabsList>
        
        {/* Full animation sequence */}
        <TabsContent value="full">
          <Card>
            <CardHeader>
              <CardTitle>Complete Transfer Animation</CardTitle>
              <CardDescription>
                This demonstrates the entire token transfer flow including preparation, animation, and success
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full-amount">Amount</Label>
                  <Input
                    id="full-amount"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={fullAmount}
                    onChange={(e) => setFullAmount(e.target.value)}
                    className="bg-[#242235]"
                  />
                </div>
                <div>
                  <Label htmlFor="full-token">Token</Label>
                  <Select value={fullToken} onValueChange={setFullToken}>
                    <SelectTrigger id="full-token" className="bg-[#242235]">
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#242235]">
                      <SelectItem value="METAL">METAL</SelectItem>
                      <SelectItem value="SILVER">SILVER</SelectItem>
                      <SelectItem value="GOLD">GOLD</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-[#a3a3a3]">From: 0x742...8a1c</span>
                <span className="text-sm text-[#a3a3a3]">To: 0x934...2b7d</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              {!isFullAnimationActive ? (
                <Button 
                  onClick={startFullAnimation}
                  className="bg-gradient-to-r from-[#c0c0c0] to-gray-500 text-[#242235] font-medium"
                >
                  Start Full Animation
                </Button>
              ) : (
                <Button 
                  onClick={resetFullAnimation}
                  variant="outline"
                >
                  Reset
                </Button>
              )}
            </CardFooter>
          </Card>
          
          {/* The actual animation component */}
          <AnimatedTokenTransfer
            isActive={isFullAnimationActive}
            status={fullAnimationStatus}
            amount={fullAmount}
            tokenSymbol={fullToken}
            fromAddress="0x742...8a1c"
            toAddress="0x934...2b7d"
            onComplete={resetFullAnimation}
          />
        </TabsContent>
        
        {/* Token transfer animation only */}
        <TabsContent value="transfer">
          <Card>
            <CardHeader>
              <CardTitle>Token Transfer Animation</CardTitle>
              <CardDescription>
                This shows just the token movement animation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transfer-amount">Amount</Label>
                  <Input
                    id="transfer-amount"
                    type="number"
                    min="1"
                    max="10"
                    step="1"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="bg-[#242235]"
                  />
                </div>
                <div>
                  <Label htmlFor="transfer-token">Token</Label>
                  <Select value={transferToken} onValueChange={setTransferToken}>
                    <SelectTrigger id="transfer-token" className="bg-[#242235]">
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#242235]">
                      <SelectItem value="METAL">METAL</SelectItem>
                      <SelectItem value="SILVER">SILVER</SelectItem>
                      <SelectItem value="GOLD">GOLD</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Direction</Label>
                <Select value={transferDirection} onValueChange={(val: 'horizontal' | 'vertical') => setTransferDirection(val)}>
                  <SelectTrigger className="bg-[#242235]">
                    <SelectValue placeholder="Choose direction" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#242235]">
                    <SelectItem value="horizontal">Horizontal</SelectItem>
                    <SelectItem value="vertical">Vertical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="border border-gray-700 rounded-lg bg-[#242235] h-40 p-2 overflow-hidden">
                <TokenTransferAnimation 
                  start={isTransferAnimationActive}
                  amount={transferAmount}
                  tokenSymbol={transferToken}
                  direction={transferDirection}
                  className="h-full"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={startTransferAnimation}
                className="bg-gradient-to-r from-[#c0c0c0] to-gray-500 text-[#242235] font-medium"
                disabled={isTransferAnimationActive}
              >
                Start Transfer Animation
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Success animation only */}
        <TabsContent value="success">
          <Card>
            <CardHeader>
              <CardTitle>Success Animation</CardTitle>
              <CardDescription>
                The animation shown when a transfer completes successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="success-amount">Amount</Label>
                  <Input
                    id="success-amount"
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="bg-[#242235]"
                  />
                </div>
                <div>
                  <Label htmlFor="success-token">Token</Label>
                  <Select value={transferToken} onValueChange={setTransferToken}>
                    <SelectTrigger id="success-token" className="bg-[#242235]">
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#242235]">
                      <SelectItem value="METAL">METAL</SelectItem>
                      <SelectItem value="SILVER">SILVER</SelectItem>
                      <SelectItem value="GOLD">GOLD</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center justify-center p-4 bg-[#242235] rounded-lg">
                <p className="text-sm text-[#a3a3a3]">
                  Click the button below to trigger the success animation
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={startSuccessAnimation}
                className="bg-gradient-to-r from-[#c0c0c0] to-gray-500 text-[#242235] font-medium"
              >
                Show Success Animation
              </Button>
            </CardFooter>
          </Card>
          
          <TransferSuccessAnimation 
            show={showSuccessAnimation}
            onComplete={() => setShowSuccessAnimation(false)}
            message={`Successfully transferred ${transferAmount} ${transferToken}!`}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TokenAnimationsDemo;