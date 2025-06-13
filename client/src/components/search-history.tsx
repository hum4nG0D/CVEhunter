import { History, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SearchHistoryItem } from "@/lib/types";

interface SearchHistoryProps {
  onHistorySelect: (cveId: string) => void;
}

export default function SearchHistory({ onHistorySelect }: SearchHistoryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['/api/search-history'],
  });

  console.log('Search history data:', JSON.stringify(history, null, 2));

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/search-history");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/search-history'] });
      toast({
        title: "History Cleared",
        description: "Search history has been cleared successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear search history",
        variant: "destructive",
      });
    },
  });

  const handleClearHistory = () => {
    clearHistoryMutation.mutate();
  };

  const handleHistoryClick = (cveId: string) => {
    onHistorySelect(cveId);
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const searchDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - searchDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  if (isLoading) {
    return (
      <section className="mb-8">
        <Card className="cyber-card">
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-muted rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <Card className="cyber-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[hsl(var(--cyber-cyan))]">
              <History className="w-5 h-5 mr-2 inline" />
              SEARCH HISTORY
            </h3>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                disabled={clearHistoryMutation.isPending}
                className="text-muted-foreground hover:text-[hsl(var(--critical))] transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                CLEAR ALL
              </Button>
            )}
          </div>
          
          {history.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">No search history yet</div>
              <div className="text-sm text-muted-foreground mt-2">
                Search for CVEs to build your history
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {history.map((item: SearchHistoryItem) => (
                <div
                  key={item.id}
                  onClick={() => handleHistoryClick(item.cveId)}
                  className="flex items-center justify-between bg-background p-3 rounded border border-muted hover:border-[hsl(var(--matrix-green))] transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-[hsl(var(--matrix-green))] font-mono font-bold">
                      {item.cveId}
                    </div>
                    <div className="text-muted-foreground text-sm truncate max-w-md">
                      {typeof item.description === 'string' 
                        ? item.description 
                        : item.description?.value || "No description available"}
                    </div>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {formatTimeAgo(item.searchTime)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
