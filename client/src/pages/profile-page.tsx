import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Coin, Reply, Transaction } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  Mail,
  Plus,
  Minus,
  Edit,
  Heart,
  Coins,
  ArrowUpDown,
  Wallet,
  History,
  Badge,
  CreditCard,
  MessageSquare as MessageCircle,
  ArrowLeftRight,
  PlusCircle,
} from "lucide-react";
import CoinCard from "@/components/home/CoinCard";
import { WalletInfo } from "@/components/profile/WalletInfo";
import { PhoneVerification } from "@/components/profile/PhoneVerification";
import {
  formatCompactNumber,
  getRelativeTime,
  formatCurrency,
} from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge as UIBadge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Import the modal components
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { AddFriendModal } from "@/components/profile/AddFriendModal";

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // State for modals
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);

  // Add friend mutation
  const addFriendMutation = useMutation({
    mutationFn: async (friendId: number) => {
      const res = await apiRequest(
        "POST",
        `/api/users/${currentUser?.id}/friends`,
        { friendId },
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({
        queryKey: [id ? `/api/users/${id}` : "/api/user"],
      });
      toast({
        title: "Friend added",
        description: "User has been added to your friends list",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add friend",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove friend mutation
  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: number) => {
      const res = await apiRequest(
        "DELETE",
        `/api/users/${currentUser?.id}/friends/${friendId}`,
      );
      return res.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({
        queryKey: [id ? `/api/users/${id}` : "/api/user"],
      });
      toast({
        title: "Friend removed",
        description: "User has been removed from your friends list",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove friend",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch profile user data (either the current user or another user by ID)
  const { data: profileUser, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: [id ? `/api/users/${id}` : "/api/user"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!currentUser, // Only fetch if logged in
  });

  // Fetch user's coins
  const { data: userCoins, isLoading: isLoadingCoins } = useQuery<Coin[]>({
    queryKey: [`/api/users/${id || profileUser?.id}/coins`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!profileUser,
  });

  // Fetch user's liked coins
  const { data: likedCoins, isLoading: isLoadingLikedCoins } = useQuery<Coin[]>(
    {
      queryKey: [`/api/users/${id || profileUser?.id}/liked-coins`],
      queryFn: getQueryFn({ on401: "throw" }),
      enabled: !!profileUser,
    },
  );

  // Fetch user's replies
  const { data: userReplies, isLoading: isLoadingReplies } = useQuery<Reply[]>({
    queryKey: [`/api/users/${id || profileUser?.id}/replies`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!profileUser,
  });

  // Fetch user's owned tokens from holdings - we're assuming the holdingIds maps to coinIds
  const holdingIds = profileUser?.holdingIds || [];
  const ownedCoins =
    userCoins?.filter((coin) => holdingIds.includes(coin.id.toString())) || [];

  // Fetch user's created tokens
  const createdCoins =
    userCoins?.filter(
      (coin) => coin.createdBy === profileUser?.id.toString(),
    ) || [];

  // Fetch user's transactions (combining all coin transactions)
  const [selectedCoinForTx, setSelectedCoinForTx] = useState<number | null>(
    null,
  );

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<
    Transaction[]
  >({
    queryKey: [
      selectedCoinForTx
        ? `/api/coins/${selectedCoinForTx}/transactions`
        : `/api/users/${id || profileUser?.id}/transactions`,
    ],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!profileUser,
  });

  // Determine if this is the current user's profile
  const isOwnProfile = !id || (currentUser && currentUser.id.toString() === id);

  // Check if the current user is friends with this profile
  const isFriend =
    currentUser &&
    profileUser &&
    currentUser.friendIds.includes(profileUser.id.toString());

  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">User not found</h1>
          <p className="mt-2">
            The user profile you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <Button className="mt-4" onClick={() => navigate("/")}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button variant="outline" onClick={() => navigate("/")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Home
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-2">
                <AvatarImage
                  src={profileUser.avatar || undefined}
                  alt={profileUser.displayName || profileUser.username}
                />
                <AvatarFallback>
                  {(profileUser.displayName || profileUser.username)
                    .substring(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl font-bold">
                {profileUser.displayName || profileUser.username}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                @{profileUser.username}
              </p>
              <p className="mt-1 text-sm break-all">
                Metal ID: {profileUser.metalAddress}
              </p>

              {!isOwnProfile && (
                <div className="flex w-full mt-4 space-x-2">
                  <Button
                    variant={isFriend ? "destructive" : "default"}
                    className="w-full"
                    onClick={() => {
                      if (isFriend) {
                        removeFriendMutation.mutate(profileUser.id);
                      } else {
                        addFriendMutation.mutate(profileUser.id);
                      }
                    }}
                  >
                    {isFriend ? (
                      <>
                        <Minus className="h-4 w-4 mr-2" />
                        Remove Friend
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Friend
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="flex-shrink-0">
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {isOwnProfile && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setIsEditProfileModalOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {profileUser.bio && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium">Bio</h3>
                  <p className="mt-1 text-sm">{profileUser.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 mt-6">
                <div className="text-center">
                  <div className="text-xl font-bold">
                    {formatCompactNumber(profileUser.coinIds.length)}
                  </div>
                  <div className="text-xs text-muted-foreground">Coins</div>
                </div>
                <div className="text-center relative group">
                  <div className="text-xl font-bold flex justify-center items-center">
                    {formatCompactNumber(profileUser.friendIds.length)}
                    {isOwnProfile && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 ml-1 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setIsAddFriendModalOpen(true)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Friends</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">
                    {formatCompactNumber(profileUser.likedCoinIds.length)}
                  </div>
                  <div className="text-xs text-muted-foreground">Liked</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue={isOwnProfile ? "wallet" : "owned"}>
            <TabsList className="grid w-full grid-cols-4">
              {isOwnProfile && (
                <TabsTrigger value="wallet">
                  <CreditCard className="h-4 w-4 mr-2" /> Wallet
                </TabsTrigger>
              )}
              <TabsTrigger value="owned">
                <Wallet className="h-4 w-4 mr-2" /> Tokens
              </TabsTrigger>
              <TabsTrigger value="created">
                <Badge className="h-4 w-4 mr-2" /> Created
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" /> Transactions
              </TabsTrigger>
            </TabsList>

            {/* Wallet Tab */}
            {isOwnProfile && (
              <TabsContent value="wallet">
                <div className="space-y-6">
                  <WalletInfo />
                  <PhoneVerification />
                </div>
              </TabsContent>
            )}

            {/* User's Created Coins */}
            <TabsContent value="created">
              {isLoadingCoins ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : createdCoins && createdCoins.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center mt-4 mb-6">
                    <Badge className="h-5 w-5 mr-2 text-[#c0c0c0]" />
                    <h2 className="text-xl font-semibold">Tokens Created</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                    {createdCoins.map((coin) => (
                      <CoinCard
                        key={coin.id}
                        coin={coin}
                        showDescription={false}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium">No Tokens Created Yet</h3>
                  <p className="text-muted-foreground mt-1">
                    {isOwnProfile
                      ? "You haven't created any tokens yet."
                      : "This user hasn't created any tokens yet."}
                  </p>
                  {isOwnProfile && (
                    <Button
                      className="mt-4 bg-gradient-to-br from-[#333333] to-[#555555] hover:from-[#404040] hover:to-[#666666] text-[#c0c0c0]"
                      onClick={() => {
                        const walletTabElement = document.querySelector(
                          '[data-state="inactive"][data-value="wallet"]',
                        );
                        if (walletTabElement) {
                          (walletTabElement as HTMLElement).click();
                        }
                      }}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Token
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            {/* User's Owned Coins */}
            <TabsContent value="owned">
              {isLoadingCoins ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : ownedCoins && ownedCoins.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center mt-4 mb-6">
                    <Wallet className="h-5 w-5 mr-2 text-[#c0c0c0]" />
                    <h2 className="text-xl font-semibold">Tokens Owned</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                    {ownedCoins.map((coin) => (
                      <CoinCard
                        key={coin.id}
                        coin={coin}
                        showDescription={false}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium">No Tokens Owned</h3>
                  <p className="text-muted-foreground mt-1">
                    {isOwnProfile
                      ? "You don't own any tokens yet."
                      : "This user doesn't own any tokens yet."}
                  </p>
                  {isOwnProfile && (
                    <Button
                      className="mt-4 bg-gradient-to-br from-[#333333] to-[#555555] hover:from-[#404040] hover:to-[#666666] text-[#c0c0c0]"
                      onClick={() => navigate("/send-tokens")}
                    >
                      <ArrowLeftRight className="h-4 w-4 mr-2" />
                      Send Tokens
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Transaction History */}
            <TabsContent value="history">
              {isLoadingTransactions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : transactions && transactions.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mt-4 mb-6">
                    <div className="flex items-center">
                      <History className="h-5 w-5 mr-2 text-[#c0c0c0]" />
                      <h2 className="text-xl font-semibold">
                        Transaction History
                      </h2>
                    </div>

                    {ownedCoins.length > 0 && (
                      <select
                        className="bg-background border border-input rounded-md px-3 py-1 text-sm"
                        value={selectedCoinForTx || "all"}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSelectedCoinForTx(
                            value === "all" ? null : parseInt(value, 10),
                          );
                        }}
                      >
                        <option value="all">All Tokens</option>
                        {ownedCoins.map((coin) => (
                          <option key={coin.id} value={coin.id}>
                            {coin.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <Card>
                    <CardContent className="pt-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Token</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>SOL</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((tx) => {
                            const coin = userCoins?.find(
                              (c) => c.id === tx.coinId,
                            );
                            return (
                              <TableRow key={tx.id}>
                                <TableCell className="font-medium">
                                  {coin ? (
                                    <div className="flex items-center">
                                      <div className="h-6 w-6 rounded-full bg-background border overflow-hidden mr-2">
                                        {coin.image && (
                                          <img
                                            src={coin.image}
                                            alt={coin.name}
                                            className="h-full w-full object-cover"
                                          />
                                        )}
                                      </div>
                                      <span>{coin.symbol}</span>
                                    </div>
                                  ) : (
                                    `Token #${tx.coinId}`
                                  )}
                                </TableCell>
                                <TableCell>
                                  <UIBadge
                                    variant={
                                      tx.type === "buy"
                                        ? "default"
                                        : "destructive"
                                    }
                                    className={
                                      tx.type === "buy"
                                        ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-500"
                                        : "bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-500"
                                    }
                                  >
                                    {tx.type === "buy" ? "Buy" : "Sell"}
                                  </UIBadge>
                                </TableCell>
                                <TableCell>
                                  {tx.amount} {coin?.symbol || ""}
                                </TableCell>
                                <TableCell>{tx.solAmount || "0"} SOL</TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {getRelativeTime(new Date(tx.createdAt))}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {isOwnProfile && (
                    <div className="flex justify-end mt-4">
                      <Button
                        className="bg-gradient-to-br from-[#333333] to-[#555555] hover:from-[#404040] hover:to-[#666666] text-[#c0c0c0]"
                        onClick={() => navigate("/send-tokens")}
                      >
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        Send Tokens
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium">
                    No Transaction History
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {isOwnProfile
                      ? "You haven't made any transactions yet."
                      : "This user hasn't made any transactions yet."}
                  </p>
                  {isOwnProfile && (
                    <Button
                      className="mt-4 bg-gradient-to-br from-[#333333] to-[#555555] hover:from-[#404040] hover:to-[#666666] text-[#c0c0c0]"
                      onClick={() => navigate("/send-tokens")}
                    >
                      <ArrowLeftRight className="h-4 w-4 mr-2" />
                      Send Tokens
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Liked Coins */}
            <TabsContent value="liked">
              {isLoadingLikedCoins ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : likedCoins && likedCoins.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4 mt-4">
                  {likedCoins.map((coin) => (
                    <CoinCard
                      key={coin.id}
                      coin={coin}
                      showDescription={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium">No Liked Tokens</h3>
                  <p className="text-muted-foreground mt-1">
                    {isOwnProfile
                      ? "You haven't liked any tokens yet."
                      : "This user hasn't liked any tokens yet."}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* User's Comments/Replies */}
            <TabsContent value="replies">
              {isLoadingReplies ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : userReplies && userReplies.length > 0 ? (
                <div className="space-y-4 mt-4">
                  {userReplies.map((reply) => (
                    <Card key={reply.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center mb-2">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage
                              src={profileUser.avatar || undefined}
                              alt={profileUser.username}
                            />
                            <AvatarFallback>
                              {profileUser.username
                                .substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {profileUser.displayName || profileUser.username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getRelativeTime(new Date(reply.createdAt))}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm mt-2">{reply.content}</p>
                        <div className="flex items-center mt-2">
                          <Heart className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {reply.likeCount}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium">No Comments Yet</h3>
                  <p className="text-muted-foreground mt-1">
                    {isOwnProfile
                      ? "You haven't made any comments yet."
                      : "This user hasn't made any comments yet."}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      {isOwnProfile && profileUser && (
        <>
          <EditProfileModal
            user={profileUser}
            isOpen={isEditProfileModalOpen}
            onClose={() => setIsEditProfileModalOpen(false)}
          />
          <AddFriendModal
            userId={profileUser.id}
            isOpen={isAddFriendModalOpen}
            onClose={() => setIsAddFriendModalOpen(false)}
          />
        </>
      )}
    </div>
  );
}
