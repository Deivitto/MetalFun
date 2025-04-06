import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Home,
  BarChart2,
  PlusCircle,
  ArrowLeftRight,
  ChevronUp,
  ChevronDown,
  Send,
  PersonStanding,
} from "lucide-react";
const MobileNav = () => {
  const [location] = useLocation();
  const [showTransactionInfo, setShowTransactionInfo] = useState(true);

  const isActive = (path: string) => {
    return location === path;
  };

  // Remove Advanced and Swap options, add Mixer
  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/advanced", label: "Advanced", icon: BarChart2 },
    { path: "/send-tokens", label: "Send Tokens", icon: Send },
    { path: "/profile", label: "Profile", icon: PersonStanding },
  ];
  //    { path: "/create", label: "Create new coin", icon: PlusCircle },
  //    { path: "/mixer", label: "Mixer", icon: Blend },

  // Pass the state to the parent component via global event
  const toggleTransactionInfo = () => {
    setShowTransactionInfo(!showTransactionInfo);
    // Dispatch custom event that the Header component can listen for
    window.dispatchEvent(
      new CustomEvent("toggleTransactionInfo", {
        detail: { visible: !showTransactionInfo },
      }),
    );
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#181622] border-t border-gray-800 z-40">
      {/* Toggle button for transaction info */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
        <button
          onClick={toggleTransactionInfo}
          className="flex items-center justify-center w-12 h-6 bg-[#181622] border border-gray-800 border-bottom-0 rounded-t-lg hover:bg-[#242235]"
        >
          {showTransactionInfo ? (
            <ChevronDown className="h-4 w-4 text-[#a3a3a3]" />
          ) : (
            <ChevronUp className="h-4 w-4 text-[#a3a3a3]" />
          )}
        </button>
      </div>

      {/* Navigation icons */}
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <div
              className={cn(
                "py-3 px-6 flex flex-col items-center cursor-pointer",
                isActive(item.path)
                  ? "text-[#c0c0c0]"
                  : "text-[#a3a3a3] hover:text-[#c0c0c0]",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
