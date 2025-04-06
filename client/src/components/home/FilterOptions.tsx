import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SortOption } from "@/lib/types";

interface FilterOptionsProps {
  onSortChange: (value: string) => void;
  onAnimationsChange: (value: boolean) => void;
  onNsfwChange: (value: boolean) => void;
}

const FilterOptions: React.FC<FilterOptionsProps> = ({
  onSortChange,
  onAnimationsChange,
  onNsfwChange
}) => {
  const [animations, setAnimations] = useState(true);
  const [nsfw, setNsfw] = useState(false);
  
  const sortOptions: SortOption[] = [
    { label: "trending", value: "trending" },
    { label: "newest", value: "newest" },
    { label: "highest mcap", value: "highest-mcap" },
    { label: "lowest mcap", value: "lowest-mcap" },
    { label: "most holders", value: "most-holders" },
    { label: "fastest growing", value: "fastest-growing" }
  ];
  
  const handleAnimationsChange = (checked: boolean) => {
    setAnimations(checked);
    onAnimationsChange(checked);
    
    // Dispatch event to toggle animations in the Header component
    window.dispatchEvent(new CustomEvent('toggleAnimations', { 
      detail: { enabled: checked } 
    }));
  };
  
  const handleNsfwChange = (checked: boolean) => {
    setNsfw(checked);
    onNsfwChange(checked);
    
    // Dispatch event to toggle NSFW in the CategoryTags component
    window.dispatchEvent(new CustomEvent('toggleNsfw', { 
      detail: { enabled: checked } 
    }));
  };
  
  return (
    <div className="mb-6 bg-[#181622] p-4 rounded-lg border border-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-y-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <div className="flex items-center gap-2">
            <Label 
              className="text-sm text-[#a3a3a3] whitespace-nowrap leading-none my-auto" 
              htmlFor="sort"
            >
              Sort:
            </Label>
            <Select onValueChange={onSortChange} defaultValue="trending">
              <SelectTrigger className="bg-[#242235] border border-gray-700 text-[#e6e6e6] rounded-md w-40 h-8 text-xs focus:outline-none focus:border-[#c0c0c0] flex items-center">
                <SelectValue placeholder="Select sort order" className="leading-none" />
              </SelectTrigger>
              <SelectContent className="bg-[#242235] border border-gray-700">
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs md:text-sm">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              id="animations"
              checked={animations}
              onCheckedChange={handleAnimationsChange}
              className="data-[state=checked]:bg-[#c0c0c0]"
            />
            <Label 
              className="text-sm text-[#a3a3a3] whitespace-nowrap leading-none my-auto"
              htmlFor="animations"
            >
              Show animations
            </Label>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            id="nsfw"
            checked={nsfw}
            onCheckedChange={handleNsfwChange}
            className="data-[state=checked]:bg-red-500"
          />
          <Label 
            className="text-sm text-[#a3a3a3] whitespace-nowrap leading-none my-auto"
            htmlFor="nsfw"
          >
            Include NSFW
          </Label>
        </div>
      </div>
    </div>
  );
};

export default FilterOptions;
