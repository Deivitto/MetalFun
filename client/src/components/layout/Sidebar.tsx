import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  BarChart2,
  PlusCircle,
  Diamond,
  HelpCircle,
  MoreHorizontal,
  Blend,
  ArrowLeftRight,
  Send,
  PersonStanding,
} from "lucide-react";
import { MetalIcon } from "@/assets/icons";

const Sidebar = () => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/advanced", label: "Advanced", icon: BarChart2 },
    { path: "/profile", label: "Profile", icon: PersonStanding },
    { path: "/send-tokens", label: "Send Tokens", icon: Send },
  ];
  //{ path: "/send", label: "Send Money", icon: Send },
  //{ path: "/mixer", label: "Mixer", icon: Blend },

  return (
    <aside className="hidden lg:block w-56 fixed h-full bg-[#181622] border-r border-gray-800 z-50">
      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <div className="bg-gradient-to-br from-[#333333] to-[#555555] p-2 rounded-md mr-2 shadow-md">
              <MetalIcon className="h-5 w-5 text-[#c0c0c0]" />
            </div>
            <h1 className="text-2xl font-['Orbitron'] font-bold text-[#c0c0c0]">
              metal<span className="text-[#ffd700]">.fun</span>
            </h1>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="py-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <div
                  className={cn(
                    "flex items-center py-3 px-4 hover:bg-[#242235] hover:bg-opacity-50 hover:text-[#c0c0c0] transition-colors cursor-pointer",
                    isActive(item.path)
                      ? "text-[#c0c0c0] bg-[#242235] bg-opacity-50"
                      : "text-[#e6e6e6]",
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="ml-2">{item.label}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
        <a
          href="https://github.com/Deivitto"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="flex items-center py-2 px-4 text-[#e6e6e6] hover:text-[#c0c0c0] transition-colors cursor-pointer">
            <HelpCircle className="w-5 h-5" />
            <span className="ml-2">Help</span>
          </div>
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
