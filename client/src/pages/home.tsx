import { useState } from "react";
import { Shield, Settings, Database, ShieldAlert, ChartLine, Bot } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import CVESearch from "@/components/cve-search";
import CVEResults from "@/components/cve-results";
import SearchHistory from "@/components/search-history";
import { CVEData } from "@/lib/types";

export default function Home() {
  const [currentCVE, setCurrentCVE] = useState<CVEData | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const { data: cveCount } = useQuery({
    queryKey: ['/api/cve-count'],
  });

  const handleCVEFound = (cve: CVEData) => {
    setCurrentCVE(cve);
  };

  const handleSearchStart = () => {
    setIsSearching(true);
    setCurrentCVE(null);
  };

  const handleSearchEnd = () => {
    setIsSearching(false);
  };

  const handleHistorySelect = (cveId: string) => {
    // Trigger search for the selected CVE
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = cveId;
      // Create and dispatch a custom event to trigger the search
      const event = new CustomEvent('search-cve', { detail: cveId });
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Matrix Rain Effect */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute text-[hsl(var(--matrix-green))] text-xs matrix-rain" style={{left: '5%', animationDelay: '0s'}}>01100101</div>
        <div className="absolute text-[hsl(var(--matrix-green))] text-xs matrix-rain" style={{left: '15%', animationDelay: '2s'}}>11010011</div>
        <div className="absolute text-[hsl(var(--matrix-green))] text-xs matrix-rain" style={{left: '25%', animationDelay: '4s'}}>10110110</div>
        <div className="absolute text-[hsl(var(--cyber-cyan))] text-xs matrix-rain" style={{left: '35%', animationDelay: '6s'}}>CVE-2024</div>
        <div className="absolute text-[hsl(var(--matrix-green))] text-xs matrix-rain" style={{left: '45%', animationDelay: '8s'}}>11100100</div>
        <div className="absolute text-[hsl(var(--cyber-cyan))] text-xs matrix-rain" style={{left: '55%', animationDelay: '10s'}}>EXPLOIT</div>
        <div className="absolute text-[hsl(var(--matrix-green))] text-xs matrix-rain" style={{left: '65%', animationDelay: '12s'}}>10101011</div>
        <div className="absolute text-[hsl(var(--matrix-green))] text-xs matrix-rain" style={{left: '75%', animationDelay: '14s'}}>01110001</div>
        <div className="absolute text-[hsl(var(--cyber-cyan))] text-xs matrix-rain" style={{left: '85%', animationDelay: '16s'}}>MALWARE</div>
        <div className="absolute text-[hsl(var(--matrix-green))] text-xs matrix-rain" style={{left: '95%', animationDelay: '18s'}}>11001100</div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-[hsl(var(--matrix-green))] bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[hsl(var(--matrix-green))] rounded-lg flex items-center justify-center pulse-green">
                <Shield className="text-background text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[hsl(var(--matrix-green))] glitch">CVE HUNTER</h1>
                <p className="text-sm text-muted-foreground">Cybersecurity Vulnerability Intelligence</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <span className="text-muted-foreground">CVEs:</span>
                <span className="text-[hsl(var(--matrix-green))]">{cveCount?.count || 0}</span>
                <span className="text-muted-foreground mx-2">|</span>
                <span className="text-muted-foreground">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Search Section */}
        <CVESearch 
          onCVEFound={handleCVEFound} 
          onSearchStart={handleSearchStart}
          onSearchEnd={handleSearchEnd}
        />

        {/* Results Section */}
        <CVEResults cve={currentCVE} isSearching={isSearching} />

        {/* Search History */}
        <SearchHistory onHistorySelect={handleHistorySelect} />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[hsl(var(--matrix-green))] bg-background/95 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-bold text-[hsl(var(--matrix-green))] mb-4">DATA SOURCES</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Database className="w-4 h-4 mr-2 inline" />National Vulnerability Database (NVD)</li>
                <li><ShieldAlert className="w-4 h-4 mr-2 inline" />Red Hat Security Advisories</li>
                <li><ChartLine className="w-4 h-4 mr-2 inline" />EPSS Scoring System</li>
                <li><Bot className="w-4 h-4 mr-2 inline" />AI-Enhanced Threat Analysis</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold text-[hsl(var(--cyber-cyan))] mb-4">FEATURES</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Shield className="w-4 h-4 mr-2 inline" />Advanced CVE Search & Analysis</li>
                <li><Database className="w-4 h-4 mr-2 inline" />Risk Matrix Assessment</li>
                <li><ShieldAlert className="w-4 h-4 mr-2 inline" />Threat Intelligence Integration</li>
                <li><ChartLine className="w-4 h-4 mr-2 inline" />Exploit Prediction Scoring</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-muted mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 CVE Hunter - Advanced Cybersecurity Vulnerability Intelligence Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
