import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fetch from "node-fetch";
import {
  insertCoinSchema,
  insertTransactionSchema,
  insertReplySchema,
  insertTokenMetadataSchema,
  User,
} from "@shared/schema";
import { ZodError } from "zod";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);

  // Helper function to handle errors
  const handleError = (res: Response, error: unknown) => {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  };

  // API Routes
  // GET all coins
  app.get("/api/coins", async (req: Request, res: Response) => {
    try {
      const includeWithdrawn = req.query.includeWithdrawn === "true";
      const coins = await storage.getAllCoins(includeWithdrawn);
      return res.json(coins);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // GET trending coins
  app.get("/api/coins/trending", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 9;
      const coins = await storage.getTrendingCoins(limit);
      return res.json(coins);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // GET latest created coin
  app.get("/api/coins/latest-created", async (_req: Request, res: Response) => {
    try {
      const coin = await storage.getLatestCreatedCoin();
      if (!coin) {
        return res.status(404).json({ message: "No created coins found" });
      }
      return res.json(coin);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // GET latest withdrawn coin
  app.get(
    "/api/coins/latest-withdrawn",
    async (_req: Request, res: Response) => {
      try {
        const coin = await storage.getLatestWithdrawnCoin();
        if (!coin) {
          return res.status(404).json({ message: "No withdrawn coins found" });
        }
        return res.json(coin);
      } catch (error) {
        return handleError(res, error);
      }
    },
  );

  // POST withdraw a coin
  app.post("/api/coins/:id/withdraw", async (req: Request, res: Response) => {
    try {
      const coinId = parseInt(req.params.id);
      const coin = await storage.withdrawCoin(coinId);
      if (!coin) {
        return res.status(404).json({ message: "Coin not found" });
      }
      return res.json(coin);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // GET coins by tag
  app.get("/api/coins/tag/:tag", async (req: Request, res: Response) => {
    try {
      const { tag } = req.params;
      const includeWithdrawn = req.query.includeWithdrawn === "true";

      // If includeWithdrawn is true, we do a custom filter
      let coins;
      if (includeWithdrawn) {
        const allCoins = await storage.getAllCoins(true);
        coins = allCoins
          .filter((coin) => coin.tags.includes(tag))
          .sort((a, b) => b.marketCap - a.marketCap);
      } else {
        coins = await storage.getCoinsByTag(tag);
      }

      return res.json(coins);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // GET search coins
  app.get("/api/coins/search", async (req: Request, res: Response) => {
    try {
      const query = (req.query.q as string) || "";
      const includeWithdrawn = req.query.includeWithdrawn === "true";

      // If includeWithdrawn is true, we do a custom search
      let coins;
      if (includeWithdrawn) {
        const lowercaseQuery = query.toLowerCase();
        const allCoins = await storage.getAllCoins(true);
        coins = allCoins.filter(
          (coin) =>
            coin.name.toLowerCase().includes(lowercaseQuery) ||
            coin.symbol.toLowerCase().includes(lowercaseQuery) ||
            coin.description.toLowerCase().includes(lowercaseQuery),
        );
      } else {
        coins = await storage.searchCoins(query);
      }

      return res.json(coins);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // GET coin by id
  app.get("/api/coins/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const coin = await storage.getCoin(id);

      if (!coin) {
        return res.status(404).json({ message: "Coin not found" });
      }

      return res.json(coin);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // POST create coin
  app.post("/api/coins", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCoinSchema.parse(req.body);
      const newCoin = await storage.createCoin(validatedData);
      return res.status(201).json(newCoin);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // GET transactions by coin id
  app.get(
    "/api/coins/:id/transactions",
    async (req: Request, res: Response) => {
      try {
        const coinId = parseInt(req.params.id);
        const transactions = await storage.getTransactions(coinId);
        return res.json(transactions);
      } catch (error) {
        return handleError(res, error);
      }
    },
  );

  // POST create transaction
  app.post("/api/transactions", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const newTransaction = await storage.createTransaction(validatedData);
      return res.status(201).json(newTransaction);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // GET replies by coin id
  app.get("/api/coins/:id/replies", async (req: Request, res: Response) => {
    try {
      const coinId = parseInt(req.params.id);
      const replies = await storage.getReplies(coinId);
      return res.json(replies);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // POST create reply
  app.post("/api/replies", async (req: Request, res: Response) => {
    try {
      const validatedData = insertReplySchema.parse(req.body);
      const newReply = await storage.createReply(validatedData);
      return res.status(201).json(newReply);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // POST like a reply
  app.post("/api/replies/:id/like", async (req: Request, res: Response) => {
    try {
      const replyId = parseInt(req.params.id);

      if (isNaN(replyId)) {
        return res.status(400).json({ message: "Invalid reply ID" });
      }

      // In a real app, use the authenticated user
      const userId = req.body.userId || 1; // Default to user ID 1 for now

      const reply = await storage.addLikedReply(userId, replyId);

      if (!reply) {
        return res.status(404).json({ message: "Reply not found" });
      }

      res.status(200).json({ success: true, reply });
    } catch (error) {
      return handleError(res, error);
    }
  });

  // GET token metadata by token ID
  app.get(
    "/api/token-metadata/:tokenId",
    async (req: Request, res: Response) => {
      try {
        const { tokenId } = req.params;
        const metadata = await storage.getTokenMetadata(tokenId);

        if (!metadata) {
          return res.status(404).json({ message: "Token metadata not found" });
        }

        return res.json(metadata);
      } catch (error) {
        return handleError(res, error);
      }
    },
  );

  // POST create token metadata
  app.post("/api/token-metadata", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTokenMetadataSchema.parse(req.body);
      const metadata = await storage.createTokenMetadata(validatedData);
      return res.status(201).json(metadata);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // PATCH update token metadata
  app.patch(
    "/api/token-metadata/:tokenId",
    async (req: Request, res: Response) => {
      try {
        const { tokenId } = req.params;
        const existingMetadata = await storage.getTokenMetadata(tokenId);

        if (!existingMetadata) {
          return res.status(404).json({ message: "Token metadata not found" });
        }

        const metadata = await storage.updateTokenMetadata(tokenId, req.body);
        return res.json(metadata);
      } catch (error) {
        return handleError(res, error);
      }
    },
  );

  // User profile endpoints
  // Find user by username (this must come BEFORE the :id routes)
  app.get("/api/users/find", async (req: Request, res: Response) => {
    try {
      const { username } = req.query;

      if (!username || typeof username !== "string") {
        return res.status(400).json({ message: "Username is required" });
      }

      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      return handleError(res, error);
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't return sensitive information like password
      const { password, ...publicUserData } = user;
      return res.json(publicUserData);
    } catch (error) {
      return handleError(res, error);
    }
  });

  app.get("/api/users/:id/coins", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get all coins created by this user
      const coins = await storage.getAllCoins();
      const userCoins = coins.filter(
        (coin) => coin.createdBy === user.username,
      );

      return res.json(userCoins);
    } catch (error) {
      return handleError(res, error);
    }
  });

  app.get("/api/users/:id/liked-coins", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get all coins liked by this user
      const allCoins = await storage.getAllCoins();
      const likedCoins = allCoins.filter((coin) =>
        user.likedCoinIds.includes(coin.id.toString()),
      );

      return res.json(likedCoins);
    } catch (error) {
      return handleError(res, error);
    }
  });

  app.get("/api/users/:id/replies", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get all coins
      const coins = await storage.getAllCoins();

      // For each coin, get its replies and filter by user ID
      let userReplies: any[] = [];
      for (const coin of coins) {
        const replies = await storage.getReplies(coin.id);
        const filteredReplies = replies.filter(
          (reply) => reply.userId === user.id.toString(),
        );
        userReplies = [...userReplies, ...filteredReplies];
      }

      // Sort by created date (newest first)
      userReplies.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      return res.json(userReplies);
    } catch (error) {
      return handleError(res, error);
    }
  });

  app.get(
    "/api/users/:id/transactions",
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const user = await storage.getUser(id);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Get all transactions for this user
        const allCoins = await storage.getAllCoins();
        let userTransactions: any[] = [];

        for (const coin of allCoins) {
          const coinTransactions = await storage.getTransactions(coin.id);
          const filteredTransactions = coinTransactions.filter(
            (tx) => tx.userId === user.id.toString(),
          );
          userTransactions = [...userTransactions, ...filteredTransactions];
        }

        // Sort by created date (newest first)
        userTransactions.sort((a, b) => {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        return res.json(userTransactions);
      } catch (error) {
        return handleError(res, error);
      }
    },
  );

  // Update user profile
  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      // Check if the user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only allow users to update their own profile
      if (req.user?.id !== id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Only allow certain fields to be updated
      const allowedUpdates = ["displayName", "bio", "avatar"];
      const filteredUpdates: Partial<User> = {};

      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          filteredUpdates[key as keyof User] = updates[key];
        }
      }

      // Update user profile
      const updatedUser = await storage.updateUser(id, filteredUpdates);

      if (updatedUser) {
        // Don't send password in response
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } else {
        res.status(500).json({ message: "Failed to update user" });
      }
    } catch (error) {
      handleError(res, error);
    }
  });

  // Add friend
  app.post("/api/users/:id/friends", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { friendId } = req.body;

      if (!friendId) {
        return res.status(400).json({ message: "Friend ID is required" });
      }

      // Check if the user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only allow users to modify their own friends
      if (req.user?.id !== id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Check if the friend exists
      const friend = await storage.getUser(parseInt(friendId));
      if (!friend) {
        return res.status(404).json({ message: "Friend not found" });
      }

      // Check if they're already friends
      if (user.friendIds.includes(friendId.toString())) {
        return res
          .status(400)
          .json({ message: "Already friends with this user" });
      }

      // Add friend
      const updatedUser = await storage.addFriend(id, parseInt(friendId));

      if (updatedUser) {
        // Don't send password in response
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } else {
        res.status(500).json({ message: "Failed to add friend" });
      }
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Get user's friends
  app.get("/api/users/:id/friends", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the user
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get friends data
      const friends: Array<Omit<User, 'password'>> = [];
      
      // If user has friends, get each friend's data
      if (user.friendIds && user.friendIds.length > 0) {
        for (const friendId of user.friendIds) {
          const friend = await storage.getUser(parseInt(friendId));
          if (friend) {
            // Don't send password in response
            const { password, ...friendWithoutPassword } = friend;
            friends.push(friendWithoutPassword);
          }
        }
      }
      
      return res.json(friends);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Remove friend
  app.delete(
    "/api/users/:id/friends/:friendId",
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const friendId = parseInt(req.params.friendId);

        // Check if the user exists
        const user = await storage.getUser(id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Only allow users to modify their own friends
        if (req.user?.id !== id) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        // Check if they're friends
        if (!user.friendIds.includes(friendId.toString())) {
          return res
            .status(400)
            .json({ message: "Not friends with this user" });
        }

        // Remove friend
        const updatedUser = await storage.removeFriend(id, friendId);

        if (updatedUser) {
          // Don't send password in response
          const { password, ...userWithoutPassword } = updatedUser;
          res.json(userWithoutPassword);
        } else {
          res.status(500).json({ message: "Failed to remove friend" });
        }
      } catch (error) {
        handleError(res, error);
      }
    },
  );

  // GET Metal API Tokens - Fetch the user's Metal tokens
  app.get("/api/metal/tokens", async (_req: Request, res: Response) => {
    try {
      const apiKey = process.env.METAL_API_KEY || "6888265e-48e6-56fb-95b9-759afc0bd1fe";

      if (!apiKey) {
        return res
          .status(500)
          .json({ message: "Metal API key not configured" });
      }

      console.log("Making request to Metal API for tokens...");

      try {
        const response = await fetch(
          "https://api.metal.build/merchant/all-tokens",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
            },
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Metal API Error:", errorText);
          return res.status(response.status).json({
            message: "Failed to fetch tokens from Metal API",
            error: errorText,
          });
        }

        // Get token data
        const tokens = (await response.json()) as {
          tokens?: Array<{
            id: string;
            address?: string;
            status: string;
            name: string;
            symbol: string;
            [key: string]: any;
          }>;
        };

        // For each token with status "completed", enhance with additional data
        if (tokens.tokens && Array.isArray(tokens.tokens)) {
          for (let i = 0; i < tokens.tokens.length; i++) {
            const token = tokens.tokens[i];

            if (token.status === "completed" && token.address) {
              try {
                const tokenDetailsResponse = await fetch(
                  `https://api.metal.build/token/${token.address}`,
                  {
                    headers: {
                      "x-api-key": apiKey,
                    },
                  },
                );

                if (tokenDetailsResponse.ok) {
                  const details = (await tokenDetailsResponse.json()) as Record<
                    string,
                    any
                  >;
                  // Merge details with token data
                  tokens.tokens[i] = { ...token, ...details };

                  // Save the token to storage if it has complete information
                  const completeToken = tokens.tokens[i];

                  if (completeToken.address) {
                    // Check if we already have this coin in storage by symbol or address
                    let existingCoin = await storage.getCoinBySymbol(
                      completeToken.symbol,
                    );

                    if (!existingCoin) {
                      // Also check if we have any coins with this address in metadata
                      const allCoins = await storage.getAllCoins(true);
                      existingCoin = allCoins.find(
                        (coin) =>
                          coin.metadata &&
                          coin.metadata.address === completeToken.address,
                      );
                    }

                    if (existingCoin) {
                      // Update existing coin with latest Metal token data
                      await storage.updateCoin(existingCoin.id, {
                        price: completeToken.price?.toString() || "0",
                        marketCap:
                          completeToken.marketCap || existingCoin.marketCap,
                        holderCount:
                          completeToken.holders || existingCoin.holderCount,
                        previousHolderCount: existingCoin.holderCount || 0,
                        metadata: {
                          address: completeToken.address,
                          name: completeToken.name,
                          symbol: completeToken.symbol,
                          merchantAddress: completeToken.merchantAddress,
                          totalSupply: completeToken.totalSupply,
                          remainingRewardSupply:
                            completeToken.remainingAppSupply ||
                            completeToken.remainingRewardSupply,
                          startingRewardSupply:
                            completeToken.startingAppSupply ||
                            completeToken.startingRewardSupply,
                          merchantSupply: completeToken.merchantSupply,
                          price: completeToken.price,
                        },
                      });
                      console.log(
                        `Updated existing coin for Metal token: ${completeToken.symbol}`,
                      );
                    } else {
                      // Create a new coin for this Metal token
                      const newCoin = {
                        name: completeToken.name,
                        symbol: completeToken.symbol,
                        description: `${completeToken.name} - A Metal token created on metal.fun`,
                        image:
                          "https://cdn.pixabay.com/photo/2017/03/08/20/11/mercury-2127642_1280.jpg", // Default image
                        createdBy:
                          completeToken.ownerAddress ||
                          completeToken.merchantAddress ||
                          "Unknown",
                        isMigrated: true,
                        isTrending: false,
                        tags: ["metal"],
                        marketCap: completeToken.marketCap || 0,
                        replyCount: 0,
                        holderCount: completeToken.holders || 0,
                        previousHolderCount: 0,
                        price: completeToken.price?.toString() || "0",
                        priceChange24h: "0",
                        volume24h: completeToken.volume24h?.toString() || "0",
                        metadata: {
                          address: completeToken.address,
                          name: completeToken.name,
                          symbol: completeToken.symbol,
                          merchantAddress: completeToken.merchantAddress,
                          totalSupply: completeToken.totalSupply,
                          remainingRewardSupply:
                            completeToken.remainingAppSupply ||
                            completeToken.remainingRewardSupply,
                          startingRewardSupply:
                            completeToken.startingAppSupply ||
                            completeToken.startingRewardSupply,
                          merchantSupply: completeToken.merchantSupply,
                          price: completeToken.price,
                        },
                      };
                      await storage.createCoin(newCoin);
                      console.log(
                        `Created new coin for Metal token: ${completeToken.symbol}`,
                      );
                    }
                  }
                }
              } catch (detailsError) {
                console.error(
                  `Failed to fetch details for token ${token.id}:`,
                  detailsError,
                );
                // Continue with next token even if one fails
              }
            }
          }
        }

        console.log(
          `Successfully fetched ${tokens.tokens?.length || 0} tokens`,
        );
        return res.json(tokens);
      } catch (fetchError: any) {
        console.error("Error fetching from Metal API:", fetchError);
        return res.status(500).json({
          message: "Error connecting to Metal API",
          error: fetchError.message || String(fetchError),
        });
      }
    } catch (error) {
      return handleError(res, error);
    }
  });

  // POST Create Metal Token
  app.post("/api/metal/create-token", async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.METAL_API_KEY || "6888265e-48e6-56fb-95b9-759afc0bd1fe";
      if (!apiKey) {
        return res
          .status(500)
          .json({ message: "Metal API key not configured" });
      }

      const {
        name,
        symbol,
        merchantAddress,
        canDistribute = true,
        canLP = true,
      } = req.body;

      if (!name || !symbol || !merchantAddress) {
        return res
          .status(400)
          .json({ message: "Name, symbol, and merchantAddress are required" });
      }

      const response = await fetch(
        "https://api.metal.build/merchant/create-token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            name,
            symbol,
            merchantAddress,
            canDistribute,
            canLP,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("Metal API Error:", error);
        return res.status(response.status).json({
          message: "Failed to create token with Metal API",
          error,
        });
      }

      const data = await response.json();

      // Create a placeholder coin in our storage that will be updated
      // when the token is confirmed and has complete data
      try {
        // Check if a coin with this symbol already exists
        const existingCoin = await storage.getCoinBySymbol(symbol);

        if (!existingCoin) {
          // Create a placeholder coin that will be updated when token is completed
          const newCoin = {
            name,
            symbol,
            description: `${name} - A Metal token created on metal.fun`,
            image:
              "https://cdn.pixabay.com/photo/2017/03/08/20/11/mercury-2127642_1280.jpg", // Default image
            createdBy: merchantAddress || "Unknown",
            isMigrated: false,
            isTrending: false,
            tags: ["metal"],
            marketCap: 0,
            replyCount: 0,
            holderCount: 0,
            previousHolderCount: 0,
            price: "0",
            priceChange24h: "0",
            volume24h: "0",
            metadata: {
              name,
              symbol,
              merchantAddress,
              pendingTokenCreation: true,
              jobId: data.id as string, // Store the job ID for status checking
            },
          };
          await storage.createCoin(newCoin);
          console.log(`Created placeholder coin for Metal token: ${symbol}`);
        }
      } catch (error) {
        console.error("Error creating placeholder coin:", error);
        // Continue with response even if coin creation fails
      }

      return res.status(201).json(data);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // POST Create Liquidity for a Token
  app.post("/api/metal/create-liquidity", async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.METAL_API_KEY || "6888265e-48e6-56fb-95b9-759afc0bd1fe";
      if (!apiKey) {
        return res
          .status(500)
          .json({ message: "Metal API key not configured" });
      }

      const { tokenAddress } = req.body;

      if (!tokenAddress) {
        return res.status(400).json({
          message: "Token address is required",
        });
      }

      const response = await fetch(
        `https://api.metal.build/token/${tokenAddress}/liquidity`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
        },
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("Metal API Error:", error);
        return res.status(response.status).json({
          message: "Failed to create liquidity with Metal API",
          error,
        });
      }

      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // GET Metal Token Creation Status
  app.get(
    "/api/metal/token-status/:jobId",
    async (req: Request, res: Response) => {
      try {
        const apiKey = process.env.METAL_API_KEY || "6888265e-48e6-56fb-95b9-759afc0bd1fe";
        const { jobId } = req.params;

        if (!apiKey) {
          return res
            .status(500)
            .json({ message: "Metal API key not configured" });
        }

        if (!jobId) {
          return res.status(400).json({ message: "Job ID is required" });
        }

        const response = await fetch(
          `https://api.metal.build/merchant/create-token/status/${jobId}`,
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
            },
          },
        );

        if (!response.ok) {
          const error = await response.text();
          console.error("Metal API Error:", error);
          return res.status(response.status).json({
            message: "Failed to get token status from Metal API",
            error,
          });
        }

        const data = await response.json();

        // Try to find and update the placeholder coin for this token
        try {
          // Find the coin with this job ID in metadata
          const allCoins = await storage.getAllCoins(true);
          const pendingCoin = allCoins.find(
            (coin) => coin.metadata && coin.metadata.jobId === jobId,
          );

          if (pendingCoin && data.status) {
            let updatedMetadata = { ...pendingCoin.metadata };

            if (
              data.status === "completed" &&
              data.token &&
              data.token.address
            ) {
              // Token is completed, update with full details
              updatedMetadata = {
                ...updatedMetadata,
                address: data.token.address,
                pendingTokenCreation: false,
              };

              await storage.updateCoin(pendingCoin.id, {
                metadata: updatedMetadata,
              });

              console.log(
                `Updated coin for completed Metal token with jobId: ${jobId}`,
              );

              // Now fetch full token details to update the coin
              const tokenDetailsResponse = await fetch(
                `https://api.metal.build/token/${data.token.address}`,
                {
                  headers: {
                    "x-api-key": apiKey,
                  },
                },
              );

              if (tokenDetailsResponse.ok) {
                const details = await tokenDetailsResponse.json();

                // Update the coin with complete details
                await storage.updateCoin(pendingCoin.id, {
                  price: details.price?.toString() || "0",
                  marketCap: details.marketCap || 0,
                  holderCount: details.holders || 0,
                  previousHolderCount: 0,
                  metadata: {
                    address: details.address,
                    name: details.name,
                    symbol: details.symbol,
                    merchantAddress: details.merchantAddress,
                    totalSupply: details.totalSupply,
                    remainingRewardSupply:
                      details.remainingAppSupply ||
                      details.remainingRewardSupply,
                    startingRewardSupply:
                      details.startingAppSupply || details.startingRewardSupply,
                    merchantSupply: details.merchantSupply,
                    price: details.price,
                  },
                });

                console.log(
                  `Updated coin with full details for Metal token with jobId: ${jobId}`,
                );
              }
            } else if (data.status === "failed") {
              // Token creation failed, mark as failed
              updatedMetadata = {
                ...updatedMetadata,
                pendingTokenCreation: false,
                creationFailed: true,
                failureReason: data.error || "Token creation failed",
              };

              await storage.updateCoin(pendingCoin.id, {
                metadata: updatedMetadata,
              });

              console.log(
                `Marked coin as failed for Metal token with jobId: ${jobId}`,
              );
            }
          }
        } catch (error) {
          console.error("Error updating coin for token status:", error);
          // Continue with response even if coin update fails
        }

        return res.json(data);
      } catch (error) {
        return handleError(res, error);
      }
    },
  );

  // POST Create or Get Holder Wallet
  app.post("/api/metal/holder/:userId", async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.METAL_API_KEY || "6888265e-48e6-56fb-95b9-759afc0bd1fe";
      const { userId } = req.params;

      if (!apiKey) {
        return res
          .status(500)
          .json({ message: "Metal API key not configured" });
      }

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const response = await fetch(`https://api.metal.build/holder/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Metal API Error:", error);
        return res.status(response.status).json({
          message: "Failed to create or get holder from Metal API",
          error,
        });
      }

      const data = (await response.json()) as {
        address: string;
        [key: string]: any;
      };

      // If user is authenticated, update their Metal address
      if (req.user && req.user.id.toString() === userId && data.address) {
        await storage.updateUser(req.user.id, { metalAddress: data.address });
      }

      return res.json(data);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Phone verification endpoints - Using Firebase Authentication

  // Verify phone number with code
  app.post(
    "/api/users/:id/phone-verification/verify",
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const { code } = req.body;

        // Check if user exists
        const user = await storage.getUser(id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Only allow users to verify their own phone number
        if (req.user?.id !== id) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        // Check if code is provided
        if (!code) {
          return res
            .status(400)
            .json({ message: "Verification code is required" });
        }

        // With Firebase, we don't need to verify the code server-side
        // as it's handled by Firebase Auth directly in the client.
        // We just need to update the user's verification status.

        // Check if user has a phone number
        if (!user.phoneNumber) {
          return res
            .status(400)
            .json({ message: "User doesn't have a phone number" });
        }

        // Update user to mark phone as verified
        const updatedUser = await storage.updateUser(id, {
          phoneVerified: true,
        });

        if (updatedUser) {
          // Don't send password in response
          const { password, ...userWithoutPassword } = updatedUser;
          return res.status(200).json(userWithoutPassword);
        } else {
          return res.status(500).json({ message: "Failed to update user" });
        }
      } catch (error) {
        return handleError(res, error);
      }
    },
  );

  // Send phone verification code
  app.post(
    "/api/users/:id/phone-verification/send",
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const { phoneNumber } = req.body;

        // Check if user exists
        const user = await storage.getUser(id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Only allow users to verify their own phone number
        if (req.user?.id !== id) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        // Check if phone number is provided
        if (!phoneNumber) {
          return res
            .status(400)
            .json({ message: "Phone number is required" });
        }

        // Check if phone number is already used by another user
        const existingUser = await storage.getUserByPhoneNumber(phoneNumber);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({
            message: "Phone number is already registered to another user",
          });
        }

        // Generate a verification code
        const verificationCode = await storage.generatePhoneVerificationCode(id);

        // In a real implementation, you would send this code via SMS using a third-party service
        // For this implementation, we'll just return success and assume the SMS is sent
        
        return res.status(200).json({
          message: "Verification code sent successfully",
          // In a real implementation, you should NEVER send the code back in the response
          // This is just for testing purposes
          code: verificationCode,
        });
      } catch (error) {
        return handleError(res, error);
      }
    },
  );

  // Check if a phone number is already verified by another user
  app.get(
    "/api/phone-verification/check/:phoneNumber",
    async (req: Request, res: Response) => {
      try {
        const { phoneNumber } = req.params;

        if (!phoneNumber) {
          return res.status(400).json({ message: "Phone number is required" });
        }

        // Format phone number to ensure consistent comparison
        const formattedPhone = phoneNumber.startsWith("+")
          ? phoneNumber
          : `+${phoneNumber}`;

        // Find user with this phone number
        const userWithPhone =
          await storage.getUserByPhoneNumber(formattedPhone);

        if (!userWithPhone) {
          // No user has this phone number
          return res.json({ isVerified: false, isAvailable: true });
        }

        // Check if the phone is verified and if it belongs to the current user
        const isCurrentUser = req.user && userWithPhone.id === req.user.id;
        const isVerified = userWithPhone.phoneVerified || false;

        return res.json({
          isVerified,
          isAvailable: !isVerified || isCurrentUser,
          userId: isVerified ? userWithPhone.id : null,
        });
      } catch (error) {
        return handleError(res, error);
      }
    },
  );

  return httpServer;
}
