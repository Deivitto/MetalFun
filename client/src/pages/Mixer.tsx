import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Blend, AlertCircle, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Mixer() {
  const [inputAmount, setInputAmount] = useState("");
  const [note, setNote] = useState("");
  const [recipient, setRecipient] = useState("");
  const [selectedToken, setSelectedToken] = useState("ETH");
  const [customTokenAddress, setCustomTokenAddress] = useState("");

  const handleDeposit = () => {
    console.log("Deposit", {
      amount: inputAmount,
      token: selectedToken,
      customTokenAddress:
        selectedToken === "CUSTOM" ? customTokenAddress : null,
    });
  };

  const handleWithdraw = () => {
    console.log("Withdraw", {
      recipient,
      note,
      amount: inputAmount,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center mb-6">
        <div className="bg-gradient-to-br from-[#7928CA] to-[#FF0080] p-2 rounded-md mr-3 shadow-lg">
          <Blend className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Metal Mixer</h1>
      </div>

      <Alert className="mb-6 bg-[#242235] border-[#7928CA]">
        <AlertCircle className="h-4 w-4 text-[#FF0080]" />
        <AlertTitle className="text-white">Privacy Notice</AlertTitle>
        <AlertDescription className="text-gray-300">
          Metal Mixer provides privacy for your transactions. Deposits are mixed
          with others to break the on-chain link between source and destination
          addresses.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="deposit" className="mb-8">
        <TabsList className="grid w-full grid-cols-2 bg-[#242235]">
          <TabsTrigger
            value="deposit"
            className="data-[state=active]:bg-[#7928CA] data-[state=active]:text-white"
          >
            Deposit
          </TabsTrigger>
          <TabsTrigger
            value="withdraw"
            className="data-[state=active]:bg-[#7928CA] data-[state=active]:text-white"
          >
            Withdraw
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deposit" className="mt-4">
          <Card className="bg-[#181622] border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl text-white">
                Deposit Funds
              </CardTitle>
              <CardDescription className="text-gray-400">
                Deposit funds to the Metal Mixer to enhance your privacy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="amount" className="text-gray-300 my-auto">
                    Amount
                  </Label>
                  <Input
                    id="amount"
                    placeholder="0.0"
                    className="bg-[#242235] border-gray-700 text-white mt-2"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="token" className="text-gray-300 my-auto">
                    Token
                  </Label>
                  <Select
                    value={selectedToken}
                    onValueChange={setSelectedToken}
                  >
                    <SelectTrigger className="bg-[#242235] border-gray-700 text-white mt-2">
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#242235] border-gray-700">
                      <SelectItem value="ETH" className="text-white">
                        ETH
                      </SelectItem>
                      <SelectItem value="CUSTOM" className="text-white">
                        Custom ERC20
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedToken === "CUSTOM" && (
                <div>
                  <Label
                    htmlFor="custom-token"
                    className="text-gray-300 my-auto"
                  >
                    Custom Token Address
                  </Label>
                  <Input
                    id="custom-token"
                    placeholder="0x..."
                    className="bg-[#242235] border-gray-700 text-white mt-2"
                    value={customTokenAddress}
                    onChange={(e) => setCustomTokenAddress(e.target.value)}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Enter the ERC20 token contract address
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between mb-2">
                  <Label
                    htmlFor="deposit-amount"
                    className="text-gray-300 my-auto"
                  >
                    Deposit Amount
                  </Label>
                </div>
                <div className="grid grid-cols-4 gap-2 my-4">
                  {[0.1, 1, 10, 100].map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant={
                        inputAmount === amount.toString()
                          ? "default"
                          : "outline"
                      }
                      className={`${
                        inputAmount === amount.toString()
                          ? "bg-[#7928CA] border-[#7928CA]"
                          : "bg-[#242235] border-gray-700 text-gray-300"
                      }`}
                      onClick={() => setInputAmount(amount.toString())}
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleDeposit}
                className="w-full bg-gradient-to-r from-[#7928CA] to-[#FF0080] hover:opacity-90"
              >
                Deposit
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="withdraw" className="mt-4">
          <Card className="bg-[#181622] border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl text-white">
                Withdraw Funds
              </CardTitle>
              <CardDescription className="text-gray-400">
                Withdraw your funds to any recipient address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="recipient" className="text-gray-300 my-auto">
                  Recipient Address
                </Label>
                <Input
                  id="recipient"
                  placeholder="Ethereum address (0x...)"
                  className="bg-[#242235] border-gray-700 text-white mt-2"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="note" className="text-gray-300 my-auto">
                  Private Note
                </Label>
                <Input
                  id="note"
                  placeholder="Enter your private note"
                  className="bg-[#242235] border-gray-700 text-white mt-2"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="text-xs text-gray-400 mt-1">
                  The note proves your deposit and is required for withdrawal
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label
                    htmlFor="withdraw-amount"
                    className="text-gray-300 my-auto"
                  >
                    Withdraw Amount
                  </Label>
                </div>
                <div className="grid grid-cols-4 gap-2 my-4">
                  {[0.1, 1, 10, 100].map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant={
                        inputAmount === amount.toString()
                          ? "default"
                          : "outline"
                      }
                      className={`${
                        inputAmount === amount.toString()
                          ? "bg-[#7928CA] border-[#7928CA]"
                          : "bg-[#242235] border-gray-700 text-gray-300"
                      }`}
                      onClick={() => setInputAmount(amount.toString())}
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleWithdraw}
                className="w-full bg-gradient-to-r from-[#7928CA] to-[#FF0080] hover:opacity-90"
              >
                Withdraw
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#181622] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Pool Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Value Locked:</span>
                <span className="text-white font-medium">1,245,632</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Users:</span>
                <span className="text-white font-medium">23,491</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Transactions:</span>
                <span className="text-white font-medium">105,392</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Average Anonymity:</span>
                <span className="text-white font-medium">2.7</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#181622] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">How it Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-300 list-disc pl-5">
              <li>Deposit crypto into the mixer pool</li>
              <li>Receive a private note for withdrawal</li>
              <li>Wait for mixing to complete</li>
              <li>Withdraw to any address using your private note</li>
            </ul>
            <div className="mt-4">
              <Button
                variant="link"
                className="text-[#7928CA] p-0 flex items-center"
              >
                <span>Learn more</span>
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center text-gray-400 text-sm">
        <p>Zero-knowledge privacy technology. Your funds, your control.</p>
        <p className="mt-1 flex items-center justify-center">
          Powered by{" "}
          <span className="text-[#FF0080] font-medium ml-1">metal.fun</span>
        </p>
      </div>
    </div>
  );
}
