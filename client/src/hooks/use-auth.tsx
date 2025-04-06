import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, insertUserSchema } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Extend User type to include wallet data
interface UserWithWallet extends User {
  walletData?: {
    address: string;
    createdAt?: string;
    merchantAddress?: string;
    [key: string]: any;
  };
}

type AuthContextType = {
  user: UserWithWallet | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<UserWithWallet, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<UserWithWallet, Error, RegisterData>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = z.infer<typeof registerSchema>;

// Extend the user schema for registration, ensuring required fields
const registerSchema = insertUserSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email address"),
  displayName: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  metalAddress: z.string().optional(),
});

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<UserWithWallet | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: UserWithWallet) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      const user = await res.json();
      
      // Create a Metal holder wallet for the user
      try {
        const holderRes = await apiRequest("POST", `/api/metal/holder/${user.id}`, {});
        const holderData = await holderRes.json();
        
        // Update the user with the created wallet data
        user.metalAddress = holderData.address;
        user.walletData = holderData; // Store additional data for display
      } catch (err) {
        console.error("Failed to create Metal holder wallet:", err);
        // We still return the user even if wallet creation fails
      }
      
      return user;
    },
    onSuccess: (user: UserWithWallet) => {
      queryClient.setQueryData(["/api/user"], user);
      
      // Show wallet creation notification
      if (user.metalAddress) {
        toast({
          title: "Metal Wallet Created",
          description: 
            `Your Metal wallet has been created and is ready to use. Address: ${user.metalAddress.substring(0, 6)}...${user.metalAddress.substring(user.metalAddress.length - 4)}`,
          variant: "default",
          duration: 8000, // Show longer for important information
        });
      }
      
      toast({
        title: "Registration successful",
        description: `Welcome to metal.fun, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}