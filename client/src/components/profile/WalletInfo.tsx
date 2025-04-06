import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { createToken, getTokenCreationStatus } from "@/lib/metalApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

// Form schema for token creation
const tokenFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters"),
  symbol: z
    .string()
    .min(2, "Symbol must be at least 2 characters")
    .max(10, "Symbol must not exceed 10 characters"),
  description: z
    .string()
    .max(200, "Description must not exceed 200 characters")
    .optional(),
  tags: z.string().optional(),
});

type TokenFormValues = z.infer<typeof tokenFormSchema>;

export function WalletInfo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [createdTokenAddress, setCreatedTokenAddress] = useState<string | null>(
    null,
  );

  // Form setup
  const form = useForm<TokenFormValues>({
    resolver: zodResolver(tokenFormSchema),
    defaultValues: {
      name: "",
      symbol: "",
      description: "",
      tags: "",
    },
  });

  // Poll for token creation status if we have a jobId
  const { data: tokenStatus, isLoading: isStatusLoading } = useQuery({
    queryKey: ["token-status", currentJobId],
    queryFn: async () => {
      if (!currentJobId) return null;
      return await getTokenCreationStatus(currentJobId);
    },
    enabled: !!currentJobId,
    refetchInterval: currentJobId ? 5000 : false, // Poll every 5 seconds if we have a jobId
  });

  // Update state based on token status
  if (
    tokenStatus &&
    tokenStatus.status === "completed" &&
    tokenStatus.tokenAddress
  ) {
    setCreatedTokenAddress(tokenStatus.tokenAddress);
    setCurrentJobId(null); // Stop polling
  }

  // Mutation for creating a token
  const createTokenMutation = useMutation({
    mutationFn: async (formData: TokenFormValues) => {
      if (!user?.metalAddress) {
        throw new Error("You need a wallet to create tokens");
      }

      // Transform tags string to array
      const tagsArray = formData.tags
        ? formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

      return await createToken({
        name: formData.name,
        symbol: formData.symbol,
        merchantAddress: user.metalAddress,
        description: formData.description,
        tags: tagsArray,
      });
    },
    onSuccess: (data) => {
      if (data.jobId) {
        setCurrentJobId(data.jobId);
        toast({
          title: "Token creation in progress",
          description:
            "Your token is being created. This might take a minute or two.",
        });
      } else if (data.address) {
        setCreatedTokenAddress(data.address);
        toast({
          title: "Token created successfully",
          description: `Your token ${data.symbol} has been created!`,
        });
      }

      // Reset form
      form.reset();

      // Invalidate tokens query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/metal/tokens"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create token",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TokenFormValues) => {
    createTokenMutation.mutate(data);
  };

  // Render wallet address in a nice format
  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet</CardTitle>
          <CardDescription>
            Please log in to view your wallet information
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Metal Wallet</CardTitle>
        <CardDescription>Create and manage your tokens</CardDescription>
      </CardHeader>

      <Tabs defaultValue="info">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info">Wallet Info</TabsTrigger>
        </TabsList>

        {/* Wallet Info Tab */}
        <TabsContent value="info">
          <CardContent className="space-y-4 pt-4">
            {user.metalAddress ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">
                    Wallet Address
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className="px-3 py-1 text-xs font-mono"
                    >
                      {formatAddress(user.metalAddress)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(user.metalAddress || "");
                        toast({
                          title: "Address copied",
                          description: "Wallet address copied to clipboard",
                        });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                {/* Display wallet metadata if available */}
                {user.walletData && (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-muted-foreground">
                        Created At
                      </Label>
                      <p>
                        {new Date(
                          user.walletData.createdAt || "",
                        ).toLocaleString()}
                      </p>
                    </div>

                    {/* Add more wallet data fields here as needed */}
                  </div>
                )}

                <div className="bg-muted/50 rounded-lg p-4 mt-4">
                  <h4 className="font-medium mb-2">
                    What can you do with this wallet?
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                    <li>Create your own tokens</li>
                    <li>Send and receive tokens</li>
                    <li>View your transaction history</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">
                  You don't have a Metal wallet yet
                </p>
                <Button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/metal/holder/${user.id}`, {
                        method: "POST",
                      });
                      const data = await res.json();

                      if (data.address) {
                        // Refresh user data
                        queryClient.invalidateQueries({
                          queryKey: ["/api/user"],
                        });
                        toast({
                          title: "Wallet created",
                          description:
                            "Your Metal wallet has been created successfully!",
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "Failed to create wallet",
                        description:
                          "There was an error creating your wallet. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Create Wallet
                </Button>
              </div>
            )}
          </CardContent>
        </TabsContent>

        {/* Create Token Tab */}
        <TabsContent value="create">
          <CardContent className="pt-4">
            {user.metalAddress ? (
              <>
                {/* Token creation form */}
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Metal Fun Token"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            The full name of your token
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="symbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token Symbol</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. MFT" {...field} />
                          </FormControl>
                          <FormDescription>
                            A short ticker symbol for your token (2-10
                            characters)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us about your token"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. defi,nft,gaming"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Comma-separated tags to categorize your token
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={
                          createTokenMutation.isPending || !!currentJobId
                        }
                      >
                        {(createTokenMutation.isPending || !!currentJobId) && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {currentJobId ? "Creating..." : "Create Token"}
                      </Button>
                    </div>
                  </form>
                </Form>

                {/* Token creation status */}
                {currentJobId && (
                  <div className="mt-6 bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Token Creation in Progress
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Your token is being created on the blockchain. This
                      process typically takes 1-2 minutes.
                    </p>
                    {tokenStatus && (
                      <div className="mt-2">
                        <p className="text-sm">Status: {tokenStatus.status}</p>
                        {tokenStatus.message && (
                          <p className="text-sm text-muted-foreground">
                            {tokenStatus.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Created token success */}
                {createdTokenAddress && !currentJobId && (
                  <div className="mt-6 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 dark:text-green-400 mb-2">
                      Token Created Successfully!
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-500 mb-2">
                      Your token has been created and is now available on the
                      blockchain.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(createdTokenAddress);
                          toast({
                            title: "Address copied",
                            description: "Token address copied to clipboard",
                          });
                        }}
                      >
                        Copy Address
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Reset the created token state
                          setCreatedTokenAddress(null);
                        }}
                      >
                        Create Another
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">
                  You need a Metal wallet to create tokens
                </p>
                <Button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/metal/holder/${user.id}`, {
                        method: "POST",
                      });
                      const data = await res.json();

                      if (data.address) {
                        // Refresh user data
                        queryClient.invalidateQueries({
                          queryKey: ["/api/user"],
                        });
                        toast({
                          title: "Wallet created",
                          description:
                            "Your Metal wallet has been created successfully!",
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "Failed to create wallet",
                        description:
                          "There was an error creating your wallet. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Create Wallet
                </Button>
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>

      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">Powered by Metal</p>
      </CardFooter>
    </Card>
  );
}
