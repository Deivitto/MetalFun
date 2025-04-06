import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { createToken as metalCreateToken, createLiquidity, TokenResponse } from "@/lib/metalApi";
import { InsertCoin } from "@shared/schema";
import { generateAnonymousId } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Extended token response interface with liquidity fields
interface TokenResponseWithLiquidity extends TokenResponse {
  liquidityCreated?: boolean;
  liquidityResult?: any;
  liquidityError?: string;
}

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  symbol: z
    .string()
    .min(2, "Symbol must be at least 2 characters long")
    .max(5, "Symbol must be 5 characters or less")
    .toUpperCase(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters long"),
  image: z.string().min(1, "Image URL is required"),
  termsAccepted: z
    .boolean()
    .refine((val) => val === true, "You must accept the terms"),
  tags: z.array(z.string()).min(1, "Select at least one tag"),
  useCustomMerchant: z.boolean().default(false),
  merchantAddress: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateTokenModal: React.FC<CreateTokenModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      symbol: "",
      description: "",
      image:
        "https://cdn.pixabay.com/photo/2018/11/30/14/13/iron-3847983_1280.jpg",
      termsAccepted: false,
      tags: ["meme"],
      useCustomMerchant: false,
      merchantAddress: "0x7d65378d2F64d512227aF6641afEF3D470C472dC",
    },
  });

  const { user } = useAuth();
  console.log(user);
  const createTokenMutation = useMutation<
    TokenResponseWithLiquidity,
    Error,
    Omit<FormData, "termsAccepted">
  >({
    mutationFn: async (data: Omit<FormData, "termsAccepted">) => {
      // Use Metal API to create token
      // Create a default merchant address if it doesn't exist
      const merchantAddress =
        user?.walletData?.merchantAddress ||
        user?.metalAddress ||
        "0x0000000000000000000000000000000000000000";

      const tokenData = {
        name: data.name,
        symbol: data.symbol,
        merchantAddress,
        description: data.description,
        image: data.image,
        tags: data.tags,
        canDistribute: true,
        canLP: true,
      };
      
      console.log("Creating token:", tokenData);
      
      // Step 1: Create the token
      const tokenResult = await metalCreateToken(tokenData);
      console.log("Token created:", tokenResult);
      
      // Check if token has an address before proceeding with liquidity
      if (tokenResult && tokenResult.address) {
        try {
          console.log("Adding liquidity for token:", tokenResult.address);
          
          // Step 2: Create liquidity for the token
          const liquidityResult = await createLiquidity(tokenResult.address);
          console.log("Liquidity added:", liquidityResult);
          
          // Return combined result
          return {
            ...tokenResult,
            liquidityCreated: true,
            liquidityResult
          } as TokenResponseWithLiquidity;
        } catch (error) {
          const liquidityError = error as Error;
          console.error("Failed to create liquidity:", liquidityError);
          // Still return token result even if liquidity fails
          return {
            ...tokenResult,
            liquidityCreated: false,
            liquidityError: liquidityError.message || "Failed to create liquidity"
          } as TokenResponseWithLiquidity;
        }
      }
      
      return tokenResult as TokenResponseWithLiquidity;
    },

    onSuccess: (data: TokenResponseWithLiquidity) => {
      // Invalidate tokens query to refresh token list
      queryClient.invalidateQueries({ queryKey: ["/api/metal/tokens"] });

      let description = "Your token has been created! It may take a few moments to appear in your wallet.";
      
      // Add information about liquidity if available
      if (data.liquidityCreated === true) {
        description += " Liquidity pool has been created automatically.";
      } else if (data.liquidityCreated === false && data.liquidityError) {
        description += " Note: There was an issue creating the liquidity pool. You can manually add liquidity later.";
      }

      toast({
        title: "Token created successfully",
        description,
      });

      onClose();
      // Navigate back to home or profile page
      setLocation(`/`);
    },
    onError: (error) => {
      let errorMessage =
        error.message || "Something went wrong. Please try again.";

      // More user-friendly error messages
      if (
        errorMessage.includes("not found") ||
        errorMessage.includes("wallet")
      ) {
        errorMessage = "Please connect a wallet or log in to create tokens.";
      } else if (errorMessage.includes("API key")) {
        errorMessage = "API configuration issue. Please contact support.";
      }

      toast({
        title: "Error creating token",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const { termsAccepted, ...tokenData } = data;
    createTokenMutation.mutate(tokenData);
  };

  const availableTags = [
    { id: "meme", label: "Meme" },
    { id: "defi", label: "DeFi" },
    { id: "l2", label: "L2" },
    { id: "derivative", label: "Derivative" },
    { id: "staking", label: "Staking" },
    { id: "dogs", label: "Dogs" },
    { id: "nsfw", label: "NSFW" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#181622] border border-[#c0c0c0] shadow-xl max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-['Orbitron'] font-bold text-[#c0c0c0] text-center">
            Create a New Metal Token
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#e6e6e6] my-auto">
                    Token Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter token name"
                      className="w-full px-4 py-3 bg-[#242235] border border-gray-700 text-[#e6e6e6] rounded-lg focus:outline-none focus:border-[#c0c0c0]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#e6e6e6] my-auto">
                    Token Symbol
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter token symbol (3-5 characters)"
                      className="w-full px-4 py-3 bg-[#242235] border border-gray-700 text-[#e6e6e6] rounded-lg focus:outline-none focus:border-[#c0c0c0]"
                      maxLength={5}
                    />
                  </FormControl>
                  <FormDescription className="text-[#a3a3a3] text-xs">
                    This will be used as the ticker symbol for your token.
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
                  <FormLabel className="text-[#e6e6e6] my-auto">
                    Token Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="What's special about your token?"
                      className="w-full px-4 py-3 bg-[#242235] border border-gray-700 text-[#e6e6e6] rounded-lg focus:outline-none focus:border-[#c0c0c0] h-24 resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#e6e6e6] my-auto">
                    Token Image URL
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter image URL"
                      className="w-full px-4 py-3 bg-[#242235] border border-gray-700 text-[#e6e6e6] rounded-lg focus:outline-none focus:border-[#c0c0c0]"
                    />
                  </FormControl>
                  <FormDescription className="text-[#a3a3a3] text-xs">
                    Enter a URL for your token image.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={() => (
                <FormItem>
                  <FormLabel className="text-[#e6e6e6] my-auto">Tags</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <FormField
                        key={tag.id}
                        control={form.control}
                        name="tags"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={tag.id}
                              className="flex flex-row items-center space-x-2"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(tag.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    return checked
                                      ? field.onChange([...current, tag.id])
                                      : field.onChange(
                                          current.filter(
                                            (value) => value !== tag.id,
                                          ),
                                        );
                                  }}
                                  className="data-[state=checked]:bg-[#c0c0c0] data-[state=checked]:text-[#242235]"
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal text-[#e6e6e6] leading-none my-auto my-auto-forced">
                                {tag.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-[#c0c0c0] data-[state=checked]:text-[#242235]"
                    />
                  </FormControl>
                  <div className="leading-none my-auto">
                    <FormLabel className="text-sm text-[#a3a3a3] leading-none  my-auto-forced">
                      I agree to the{" "}
                      <a href="#" className="text-[#c0c0c0]">
                        terms and conditions
                      </a>
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-[#c0c0c0] to-gray-500 text-[#242235] font-medium rounded-lg hover:opacity-90 transition-opacity"
              disabled={createTokenMutation.isPending}
            >
              {createTokenMutation.isPending ? "Creating..." : "Create Token"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTokenModal;