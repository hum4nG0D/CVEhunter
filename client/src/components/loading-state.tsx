import { Loader2, Database, Shield, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function LoadingState() {
  return (
    <Card className="cyber-card">
      <CardContent className="p-8 text-center">
        <div className="mb-4">
          <Loader2 className="inline-block w-16 h-16 border-4 border-[hsl(var(--matrix-green))] border-t-transparent rounded-full animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-[hsl(var(--matrix-green))] mb-2">SCANNING VULNERABILITY DATABASE</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-[hsl(var(--matrix-green))] rounded-full animate-pulse"></div>
            <Database className="w-4 h-4" />
            <span>Querying NVD API...</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-[hsl(var(--cyber-cyan))] rounded-full animate-pulse"></div>
            <Shield className="w-4 h-4" />
            <span>Fetching RHEL advisories...</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-[hsl(var(--high))] rounded-full animate-pulse"></div>
            <TrendingUp className="w-4 h-4" />
            <span>Analyzing with AI intelligence...</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
