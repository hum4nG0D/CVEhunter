import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
  message?: string;
}

export default function ErrorState({ message = "CVE not found in database or invalid format" }: ErrorStateProps) {
  return (
    <Card className="cyber-card border-[hsl(var(--critical))]">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-[hsl(var(--critical))] rounded-full flex items-center justify-center">
            <AlertTriangle className="text-white text-xl" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[hsl(var(--critical))]">SCAN FAILED</h3>
            <p className="text-muted-foreground">{message}</p>
          </div>
        </div>
        <div className="bg-background p-4 rounded border border-[hsl(var(--critical))]/30">
          <div className="text-sm text-muted-foreground mb-2">Troubleshooting:</div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Verify CVE ID format: CVE-YYYY-NNNN</li>
            <li>• Check if CVE exists in NVD database</li>
            <li>• Ensure network connectivity</li>
            <li>• Try again in a few moments</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
