import { env } from "../env";

// Metal API Helper Functions

/**
 * Metal API function helpers for interacting with the Metal API
 * These functions encapsulate API interactions for token management
 */

// Get API key from environment variables
const getApiKey = () => {
  if (!env.METAL_API_KEY) {
    console.warn('METAL_API_KEY is not defined in environment variables');
  }
  return env.METAL_API_KEY || '';
};

interface CreateTokenOptions {
  name: string;
  symbol: string;
  merchantAddress: string;
  canDistribute?: boolean;
  canLP?: boolean;
  description?: string;
  image?: string;
  tags?: string[];
}

export interface TokenResponse {
  id: string;
  address?: string;
  name: string;
  symbol: string;
  merchantAddress: string;
  canDistribute: boolean;
  canLP: boolean;
  createdAt: string;
  status: "pending" | "completed" | "failed";
  jobId?: string;
  message?: string;
  error?: string;
}

/**
 * Create a new token on the Metal platform
 */
export async function createToken({
  name,
  symbol,
  merchantAddress,
  canDistribute = true,
  canLP = true,
  description,
  image,
  tags,
}: CreateTokenOptions): Promise<TokenResponse> {
  try {
    // First, create the token via Metal API
    const response = await fetch(
      "https://api.metal.build/merchant/create-token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": getApiKey(),
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

    const tokenData = await response.json();

    if (!tokenData.id) {
      throw new Error(tokenData.message || "Failed to create token");
    }

    // If we have additional metadata (description, image, tags), store them in our database
    if (description || image || tags) {
      try {
        // Store the additional metadata in our database
        await fetch("/api/token-metadata", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tokenId: tokenData.id,
            description,
            image,
            tags,
          }),
        });
      } catch (metadataError) {
        console.error("Failed to save token metadata:", metadataError);
        // We still return the token data even if metadata saving failed
      }
    }

    return tokenData;
  } catch (error) {
    console.error("Error creating token:", error);
    throw error;
  }
}

/**
 * Get token information by address
 */
export async function getToken(address: string): Promise<any> {
  try {
    const response = await fetch(`https://api.metal.build/token/${address}`, {
      headers: {
        "x-api-key": getApiKey(),
      },
    });

    const tokenData = await response.json();

    // Try to fetch additional metadata from our database
    try {
      const metadataResponse = await fetch(
        `/api/token-metadata/${tokenData.id}`,
      );
      const metadata = await metadataResponse.json();

      // Merge the metadata with the token data
      return { ...tokenData, ...metadata };
    } catch (metadataError) {
      console.error("Failed to fetch token metadata:", metadataError);
      return tokenData;
    }
  } catch (error) {
    console.error("Error fetching token:", error);
    throw error;
  }
}

/**
 * Get token creation status
 */
export async function getTokenCreationStatus(jobId: string): Promise<any> {
  const response = await fetch(
    `https://api.metal.build/merchant/create-token/status/${jobId}`,
    {
      headers: {
        "x-api-key": getApiKey(),
      },
    },
  );
  return await response.json();
}

/**
 * Get all tokens created by the merchant
 */
export async function getAllTokens(): Promise<any[]> {
  try {
    const response = await fetch("https://api.metal.build/merchant/all-tokens", {
      headers: {
        "x-api-key": getApiKey(),
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error fetching tokens: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching all tokens:", error);
    return []; // Return empty array on error
  }
}

/**
 * Create liquidity for a token
 */
export async function createLiquidity(tokenAddress: string): Promise<any> {
  const response = await fetch(
    `https://api.metal.build/token/${tokenAddress}/liquidity`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getApiKey(),
      },
    },
  );
  return await response.json();
}

/**
 * Distribute tokens to a user
 */
export async function distributeTokens(
  tokenAddress: string,
  sendTo: string,
  amount: number,
): Promise<any> {
  const response = await fetch(
    `https://api.metal.build/token/${tokenAddress}/distribute`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getApiKey(),
      },
      body: JSON.stringify({ sendTo, amount }),
    },
  );
  return await response.json();
}
