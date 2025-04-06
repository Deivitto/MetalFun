import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { CatIcon, MetalIcon, DogIcon, ExchangeIcon } from "@/assets/icons";
import {
  Cpu,
  ChevronsUp,
  Layers,
  GitBranch,
  Database,
  Flame,
} from "lucide-react";
import { CategoryTag } from "@/lib/types";

interface CategoryTagsProps {
  onSelectTag: (tag: string) => void;
}

const CategoryTags: React.FC<CategoryTagsProps> = ({ onSelectTag }) => {
  const [selectedTag, setSelectedTag] = useState("all");
  const [showNsfw, setShowNsfw] = useState(true);

  // Only keep the specified tags: Meme, DeFi, L2, derivative, staking, dogs, Solana, nsfw
  const tags: CategoryTag[] = [
    { id: "all", name: "All", icon: "all" },
    { id: "meme", name: "Meme", icon: "meme" },
    { id: "defi", name: "DeFi", icon: "defi" },
    { id: "l2", name: "L2", icon: "l2" },
    { id: "derivative", name: "Derivative", icon: "derivative" },
    { id: "staking", name: "Staking", icon: "staking" },
    { id: "dogs", name: "Dogs", icon: "dogs" },
  ];

  // Add NSFW tag conditionally based on the showNsfw setting
  const allTags = showNsfw
    ? [...tags, { id: "nsfw", name: "NSFW", icon: "nsfw" }]
    : tags;

  // Listen for toggle NSFW events
  React.useEffect(() => {
    const handleToggleNsfw = (event: Event) => {
      const customEvent = event as CustomEvent;
      setShowNsfw(customEvent.detail.enabled);
    };

    window.addEventListener("toggleNsfw", handleToggleNsfw as EventListener);

    return () => {
      window.removeEventListener(
        "toggleNsfw",
        handleToggleNsfw as EventListener,
      );
    };
  }, []);

  const handleTagClick = (tagId: string) => {
    setSelectedTag(tagId);
    onSelectTag(tagId);
  };

  const getIcon = (icon: string) => {
    switch (icon) {
      case "all":
        return <ChevronsUp className="h-4 w-4 mr-2 flex-shrink-0" />;
      case "meme":
        return <CatIcon className="h-4 w-4 mr-2 flex-shrink-0" />;
      case "defi":
        return <ExchangeIcon className="h-4 w-4 mr-2 flex-shrink-0" />;
      case "l2":
        return <Layers className="h-4 w-4 mr-2 flex-shrink-0" />;
      case "derivative":
        return <GitBranch className="h-4 w-4 mr-2 flex-shrink-0" />;
      case "staking":
        return <Database className="h-4 w-4 mr-2 flex-shrink-0" />;
      case "dogs":
        return <DogIcon className="h-4 w-4 mr-2 flex-shrink-0" />;
      case "solana":
        return (
          <MetalIcon className="h-4 w-4 mr-2 flex-shrink-0 text-[#9945FF]" />
        );
      case "nsfw":
        return <Flame className="h-4 w-4 mr-2 flex-shrink-0 text-[#ff4444]" />;
      default:
        return <div className="h-4 w-4 mr-2 flex-shrink-0" />;
    }
  };

  return (
    <div className="mb-6 py-2">
      <h2 className="text-lg font-medium mb-3 pl-2">Tags</h2>
      <div className="flex flex-wrap gap-3 px-1">
        {allTags.map((tag) => (
          <label
            key={tag.id}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium cursor-pointer transition-colors flex items-center",
              selectedTag === tag.id
                ? "bg-[#242235] border border-[#c0c0c0] text-white"
                : "bg-[#242235] border border-[#181622] hover:border-[#c0c0c0] text-gray-300",
            )}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={selectedTag === tag.id}
              onChange={() => handleTagClick(tag.id)}
            />
            <div className="flex items-center">
              {getIcon(tag.icon)}
              <span className="whitespace-nowrap leading-none !mt-auto !mb-auto">
                {tag.name}
              </span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default CategoryTags;
