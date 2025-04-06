import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Form validation schema
const addFriendSchema = z.object({
  username: z.string().min(1, { message: "Please enter a username." }),
});

type AddFriendFormValues = z.infer<typeof addFriendSchema>;

interface AddFriendModalProps {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function AddFriendModal({ userId, isOpen, onClose }: AddFriendModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [foundUser, setFoundUser] = useState<{ id: number, username: string, displayName?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize form
  const form = useForm<AddFriendFormValues>({
    resolver: zodResolver(addFriendSchema),
    defaultValues: {
      username: "",
    },
  });
  
  // Find user mutation
  const findUserMutation = useMutation({
    mutationFn: async (username: string) => {
      // First try to find by username
      const res = await apiRequest("GET", `/api/users/find?username=${encodeURIComponent(username)}`);
      
      if (!res.ok) {
        // If not found by username, throw a user-friendly error
        const errorData = await res.json();
        throw new Error(errorData.message || "User not found");
      }
      
      return res.json();
    },
    onSuccess: (user) => {
      setFoundUser(user);
      setError(null);
    },
    onError: (error: Error) => {
      setFoundUser(null);
      setError(error.message);
    },
  });
  
  // Add friend mutation
  const addFriendMutation = useMutation({
    mutationFn: async (friendId: number) => {
      const res = await apiRequest("POST", `/api/users/${userId}/friends`, { friendId });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate user data to refresh friend list
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Friend added",
        description: `${foundUser?.displayName || foundUser?.username} has been added to your friends.`,
      });
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add friend",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle username search
  function handleSearch(data: AddFriendFormValues) {
    setIsSubmitting(true);
    findUserMutation.mutate(data.username, {
      onSettled: () => {
        setIsSubmitting(false);
      }
    });
  }
  
  // Handle adding friend
  function handleAddFriend() {
    if (foundUser) {
      addFriendMutation.mutate(foundUser.id);
    }
  }
  
  // Reset the form and state
  function resetForm() {
    form.reset();
    setFoundUser(null);
    setError(null);
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Friend</DialogTitle>
          <DialogDescription>
            Enter a username to find and add as a friend.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <Button 
                      type="submit" 
                      size="sm" 
                      disabled={isSubmitting || !field.value}
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {foundUser && (
              <div className="mt-4 p-4 border rounded-md">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <h3 className="font-medium">{foundUser.displayName || foundUser.username}</h3>
                    <p className="text-sm text-muted-foreground">@{foundUser.username}</p>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleAddFriend} 
                disabled={!foundUser || addFriendMutation.isPending}
              >
                {addFriendMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Friend
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}