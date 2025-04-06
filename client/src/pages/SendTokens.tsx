import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Search,
  AtSign,
  User,
  Phone,
  Users,
  X,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Coin, User as UserType } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AnimatedTokenTransfer, {
  TransferStatus,
} from "@/components/animations/AnimatedTokenTransfer";

// Define Metal token interface
interface MetalToken {
  id: string;
  name: string;
  symbol: string;
  amount: string;
  address?: string;
  status: "pending" | "completed" | "failed";
  merchantAddress: string;
}

interface MetalTokensResponse {
  tokens: MetalToken[];
}
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const SendTokens = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState<string>("0.5");
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [recipientInput, setRecipientInput] = useState<string>("");
  const [recipientType, setRecipientType] = useState<
    "address" | "username" | "phone"
  >("address");
  const [selectedRecipient, setSelectedRecipient] = useState<{
    id: number;
    name: string;
    identifier: string;
    verified: boolean;
  } | null>(null);
  const [isVerifyingRecipient, setIsVerifyingRecipient] = useState(false);
  const [recipientVerified, setRecipientVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detect recipient type from input
  useEffect(() => {
    if (recipientInput.startsWith("0x")) {
      setRecipientType("address");
    } else if (recipientInput.startsWith("+") || /^\d+$/.test(recipientInput)) {
      setRecipientType("phone");
    } else if (recipientInput.length > 0) {
      setRecipientType("username");
    }

    // Reset verification status when input changes
    setRecipientVerified(false);
    setSelectedRecipient(null);
  }, [recipientInput]);

  // Get available coins for sending
  const { data: availableCoins, isLoading: isLoadingCoins } = useQuery<Coin[]>({
    queryKey: ["/api/coins"],
  });

  // Get user's Metal tokens to display for sending
  const { data: metalTokens, isLoading: isLoadingMetalTokens } =
    useQuery<MetalTokensResponse>({
      queryKey: ["/api/metal/tokens"],
      enabled: !!user,
    });

  console.log(metalTokens);

  // Get user's friends for recipient selection
  const { data: friends, isLoading: isLoadingFriends } = useQuery<UserType[]>({
    queryKey: [`/api/users/${user?.id}/friends`],
    enabled: !!user,
  });

  // Verify recipient exists
  const verifyRecipientMutation = useMutation({
    mutationFn: async (input: string) => {
      setIsVerifyingRecipient(true);
      try {
        // Use the appropriate parameter based on recipient type
        let queryParam = '';
        if (recipientType === "username") {
          queryParam = `username=${input}`;
        } else if (recipientType === "phone") {
          queryParam = `phoneNumber=${input}`;
        } else if (recipientType === "address") {
          queryParam = `metalAddress=${input}`;
        }
        
        const res = await apiRequest("GET", `/api/users/find?${queryParam}`);
        return res.json();
      } catch (error) {
        console.error("Error verifying recipient:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data && (Array.isArray(data) ? data.length > 0 : data.id)) {
        // Handle both array and single object response
        const recipient = Array.isArray(data) ? data[0] : data;
        setSelectedRecipient({
          id: recipient.id,
          name: recipient.displayName || recipient.username,
          identifier:
            recipientType === "phone"
              ? recipient.phoneNumber || recipientInput
              : recipient.username,
          verified: recipientType === "phone" ? recipient.phoneVerified : true,
        });
        setRecipientVerified(true);
        toast({
          title: "Recipient verified",
          description: "The recipient has been verified.",
        });
      } else {
        setRecipientVerified(false);
        toast({
          title: "Recipient not found",
          description: `No user found with that ${recipientType}.`,
          variant: "destructive",
        });
      }
      setIsVerifyingRecipient(false);
    },
    onError: (error) => {
      setIsVerifyingRecipient(false);
      setRecipientVerified(false);
      toast({
        title: "Verification failed",
        description: error.message || "Failed to verify recipient.",
        variant: "destructive",
      });
    },
  });

  // Animation states
  const [transferAnimationActive, setTransferAnimationActive] = useState(false);
  const [transferStatus, setTransferStatus] = useState<
    "idle" | "preparing" | "transferring" | "success" | "error"
  >("idle");

  // Send token mutation
  const sendTokenMutation = useMutation({
    mutationFn: async () => {
      setIsSubmitting(true);

      // Validate recipient first
      if (!selectedRecipient || !recipientVerified) {
        await verifyRecipientMutation.mutateAsync(recipientInput);
      }

      // Start animation flow
      setTransferAnimationActive(true);
      setTransferStatus("preparing");

      // Mock API call for sending tokens
      const payload = {
        recipientId: selectedRecipient?.id,
        tokenSymbol: selectedToken,
        amount,
        senderMetalAddress: user?.metalAddress,
      };

      // Simulate preparation delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Start transfer animation
      setTransferStatus("transferring");

      // Simulate API call completion
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Set success state (animation component handles showing success)
      setTransferStatus("success");

      return payload; // Would normally come from API response
    },
    onSuccess: () => {
      // Don't show toast here as animation will provide feedback
      // Animation complete handler will reset the form
    },
    onError: (error) => {
      setTransferStatus("error");
      toast({
        title: "Failed to send tokens",
        description: error.message || "An error occurred while sending tokens.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      setTransferAnimationActive(false);
    },
  });

  // Handle animation completion
  const handleTransferComplete = () => {
    // Reset states
    setAmount("0.5");
    setSelectedToken("");
    setRecipientInput("");
    setSelectedRecipient(null);
    setRecipientVerified(false);
    setIsSubmitting(false);
    setTransferAnimationActive(false);
    setTransferStatus("idle");

    // Show toast after animation completes
    toast({
      title: "Tokens sent successfully",
      description: `You have sent ${amount} ${selectedToken} to ${selectedRecipient?.name}`,
    });
  };

  // Verify recipient handler
  const handleVerifyRecipient = () => {
    if (!recipientInput) {
      toast({
        title: "Recipient required",
        description: "Please enter a recipient.",
        variant: "destructive",
      });
      return;
    }

    verifyRecipientMutation.mutate(recipientInput);
  };

  // Send token handler
  const handleSendToken = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedToken) {
      toast({
        title: "Token required",
        description: "Please select a token to send.",
        variant: "destructive",
      });
      return;
    }

    if (!recipientVerified) {
      toast({
        title: "Recipient verification required",
        description: "Please verify the recipient first.",
        variant: "destructive",
      });
      return;
    }

    sendTokenMutation.mutate();
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Token Transfer Animation */}
      <AnimatedTokenTransfer
        isActive={transferAnimationActive}
        status={transferStatus}
        amount={amount}
        tokenSymbol={selectedToken}
        fromAddress={user?.metalAddress || "Your address"}
        toAddress={selectedRecipient?.identifier || "Recipient"}
        onComplete={handleTransferComplete}
      />

      {/* Page Title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-['Orbitron'] font-bold text-[#c0c0c0]">
          Send Tokens
        </h2>
        <p className="text-[#a3a3a3] mt-2">Send tokens to other users</p>
      </div>

      {/* Send Token Card */}
      <div className="max-w-md mx-auto bg-[#181622] border border-gray-700 rounded-lg p-5">
        {/* Recipient Selection */}
        <div className="mb-6">
          <div className="text-sm mb-2">
            <span className="text-[#a3a3a3]">Recipient</span>
          </div>

          <Tabs defaultValue="input" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-2">
              <TabsTrigger value="input">
                <Search className="h-4 w-4 mr-2" /> Direct
              </TabsTrigger>
              <TabsTrigger value="friends" disabled={!user}>
                <Users className="h-4 w-4 mr-2" /> Friends
              </TabsTrigger>
              <TabsTrigger value="phone" disabled={!user?.phoneVerified}>
                <Phone className="h-4 w-4 mr-2" /> Phone
              </TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="space-y-2">
              <div className="flex gap-2 items-center">
                {recipientType === "address" && (
                  <AtSign className="h-4 w-4 text-[#a3a3a3]" />
                )}
                {recipientType === "username" && (
                  <User className="h-4 w-4 text-[#a3a3a3]" />
                )}
                {recipientType === "phone" && (
                  <Phone className="h-4 w-4 text-[#a3a3a3]" />
                )}

                <Input
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  className="bg-[#242235] border-gray-700 text-[#e6e6e6] rounded-lg"
                  placeholder="Enter address, username, or phone"
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-1">
                  <span className="text-xs text-[#a3a3a3]">Detected type:</span>
                  <span className="text-xs font-medium text-[#c0c0c0] capitalize">
                    {recipientType}
                  </span>
                </div>

                <Button
                  size="sm"
                  onClick={handleVerifyRecipient}
                  disabled={
                    isVerifyingRecipient || !recipientInput || recipientVerified
                  }
                  className="text-xs h-7 bg-[#242235] text-[#c0c0c0] hover:bg-[#333146]"
                >
                  {isVerifyingRecipient ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : recipientVerified ? (
                    <Check className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="friends">
              {isLoadingFriends ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#c0c0c0]"></div>
                </div>
              ) : friends && friends.length > 0 ? (
                <div className="max-h-40 overflow-y-auto space-y-1 bg-[#242235] rounded-lg p-2">
                  {friends.map((friend) => (
                    <Button
                      key={friend.id}
                      variant="ghost"
                      className="w-full justify-start px-2 py-1 h-auto"
                      onClick={() => {
                        setSelectedRecipient({
                          id: friend.id,
                          name: friend.displayName || friend.username,
                          identifier: friend.username,
                          verified: true,
                        });
                        setRecipientInput(friend.username);
                        setRecipientType("username");
                        setRecipientVerified(true);
                      }}
                    >
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={friend.avatar || undefined} />
                        <AvatarFallback>
                          {(friend.displayName || friend.username)
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{friend.displayName || friend.username}</span>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-[#a3a3a3]">
                  <p>No friends found.</p>
                  <p className="text-xs mt-1">
                    Add friends from your profile page.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="phone">
              {user?.phoneVerified ? (
                <div className="space-y-2">
                  <Input
                    value={recipientInput}
                    onChange={(e) => {
                      setRecipientInput(e.target.value);
                      setRecipientType("phone");
                    }}
                    className="bg-[#242235] border-gray-700 text-[#e6e6e6] rounded-lg"
                    placeholder="Enter recipient's phone number"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-[#a3a3a3]">
                      Enter a phone number including country code
                    </p>
                    <Button
                      size="sm"
                      onClick={handleVerifyRecipient}
                      disabled={
                        isVerifyingRecipient ||
                        !recipientInput ||
                        recipientVerified
                      }
                      className="text-xs h-7 bg-[#242235] text-[#c0c0c0] hover:bg-[#333146]"
                    >
                      {isVerifyingRecipient ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : recipientVerified ? (
                        <Check className="h-3 w-3 mr-1 text-green-500" />
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 text-[#a3a3a3]">
                  <p>Phone verification required.</p>
                  <p className="text-xs mt-1">
                    Verify your phone number in your profile page first.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {selectedRecipient && (
            <div className="mt-2 p-2 bg-[#242235] rounded-lg flex justify-between items-center">
              <div className="flex items-center">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarFallback>
                    {selectedRecipient.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-[#e6e6e6]">
                    {selectedRecipient.name}
                  </p>
                  <p className="text-xs text-[#a3a3a3]">
                    {selectedRecipient.identifier}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                {recipientVerified && (
                  <span className="mr-2 text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded flex items-center">
                    <Check className="h-3 w-3 mr-1" /> Verified
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setSelectedRecipient(null);
                    setRecipientInput("");
                    setRecipientVerified(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Amount and Token Selection */}
        <div className="mb-6 space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#a3a3a3]">Amount</span>
              <span className="text-[#a3a3a3]">
                {selectedToken &&
                  `Balance: ${
                    selectedToken === "TESTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARDO"
                      ? "1.5 LOLOL"
                      : metalTokens?.tokens?.find(
                          (t: MetalToken) => t.name === selectedToken,
                        )?.amount || "0"
                  } ${selectedToken}`}
              </span>
            </div>

            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-[#242235] border-gray-700 text-[#e6e6e6] rounded-lg"
              placeholder="0.0"
              min="0.001"
              step="0.001"
            />
          </div>

          <div>
            <div className="text-sm mb-2">
              <span className="text-[#a3a3a3]">Token</span>
            </div>

            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger className="w-full bg-[#242235] border-gray-700 text-[#e6e6e6]">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent className="bg-[#242235] border-gray-700 text-[#e6e6e6]">
                <SelectItem value="ETH">ETH</SelectItem>
                {isLoadingMetalTokens ? (
                  <SelectItem value="loading" disabled>
                    Loading tokens...
                  </SelectItem>
                ) : (
                  metalTokens?.tokens
                    ?.filter(
                      (token: MetalToken) => parseFloat(token.amount) > 0
                    )
                    ?.map((token: MetalToken) => (
                      <SelectItem key={token.id} value={token.name}>
                        {token.name} ({token.amount})
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Verification Alert */}
        {recipientInput && !recipientVerified && (
          <Alert className="mb-4 bg-amber-950/30 border-amber-500/50">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-400 ml-2">
              Verification Required
            </AlertTitle>
            <AlertDescription className="text-amber-300/70 ml-6 text-xs">
              The recipient must be verified before sending tokens.
            </AlertDescription>
          </Alert>
        )}

        {/* Action button */}
        <Button
          className="w-full bg-gradient-to-r from-[#c0c0c0] to-gray-500 text-[#242235] font-medium"
          disabled={
            !selectedToken ||
            parseFloat(amount) <= 0 ||
            !recipientVerified ||
            isSubmitting
          }
          onClick={handleSendToken}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : !recipientInput ? (
            "Enter recipient"
          ) : !recipientVerified ? (
            "Verify recipient"
          ) : !selectedToken ? (
            "Select a token"
          ) : parseFloat(amount) <= 0 ? (
            "Enter an amount"
          ) : (
            "Send"
          )}
        </Button>

        {/* Disclaimer */}
        <p className="text-[#a3a3a3] text-xs mt-4 text-center">
          Make sure to verify the recipient before sending tokens.
        </p>
      </div>
    </div>
  );
};

export default SendTokens;
