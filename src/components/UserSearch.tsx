import React, { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CopilotUsageData } from "@/lib/utils";

interface UserSearchProps {
  data: CopilotUsageData[] | null;
  selectedUser: string | null;
  onUserChange: (user: string | null) => void;
  disabled?: boolean;
}

interface UserStats {
  username: string;
  totalRequests: number;
  premiumRequests: number;
}

/**
 * User search component with autocomplete functionality
 * Allows searching and selecting any user from the dataset
 */
export function UserSearch({ 
  data, 
  selectedUser, 
  onUserChange, 
  disabled = false 
}: UserSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Calculate user statistics including premium request counts
  const userStats = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const statsMap: Record<string, UserStats> = {};
    
    data.forEach(item => {
      if (!statsMap[item.user]) {
        statsMap[item.user] = {
          username: item.user,
          totalRequests: 0,
          premiumRequests: 0
        };
      }
      
      statsMap[item.user].totalRequests += item.requestsUsed;
      if (item.exceedsQuota) {
        statsMap[item.user].premiumRequests += item.requestsUsed;
      }
    });
    
    // Convert to array and sort by total requests (descending), then by premium requests (descending)
    return Object.values(statsMap).sort((a, b) => {
      if (b.totalRequests !== a.totalRequests) {
        return b.totalRequests - a.totalRequests;
      }
      return b.premiumRequests - a.premiumRequests;
    });
  }, [data]);

  // Filter users based on search input
  const filteredUsers = useMemo(() => {
    if (!searchValue) return userStats;
    return userStats.filter(user => 
      user.username.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [userStats, searchValue]);

  const handleUserSelect = (user: string) => {
    onUserChange(user);
    setOpen(false);
    setSearchValue("");
  };

  const handleClearUser = () => {
    onUserChange(null);
    setSearchValue("");
  };

  const displayValue = selectedUser || "Search for a user...";

  return (
    <div className="flex items-center gap-3">
      <Search className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[400px] justify-between"
              disabled={disabled || !data || data.length === 0}
            >
              <span className={selectedUser ? "text-foreground" : "text-muted-foreground"}>
                {displayValue}
              </span>
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0">
            <Command>
              <CommandInput 
                placeholder="Search users..." 
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList className="max-h-[300px]">
                {filteredUsers.length === 0 ? (
                  <CommandEmpty>No users found.</CommandEmpty>
                ) : (
                  <CommandGroup>
                    {filteredUsers.map((userStat) => (
                      <CommandItem
                        key={userStat.username}
                        value={userStat.username}
                        onSelect={() => handleUserSelect(userStat.username)}
                        className="cursor-pointer"
                      >
                        <div className="flex w-full items-center justify-between gap-4">
                          <div className="flex-1 truncate">
                            <span className="font-medium">{userStat.username}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                            <div className="text-right">
                              <div className="font-medium text-foreground">
                                {userStat.totalRequests.toLocaleString()}
                              </div>
                              <div className="text-xs">total</div>
                            </div>
                            {userStat.premiumRequests > 0 && (
                              <div className="text-right">
                                <div className="font-medium text-orange-600">
                                  {userStat.premiumRequests.toLocaleString()}
                                </div>
                                <div className="text-xs">premium</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        {selectedUser && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearUser}
            className="px-2"
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {data && data.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {userStats.length} users available
        </div>
      )}
    </div>
  );
}