import { useState, useEffect } from "react";
import { Shield, Settings, Database, ShieldAlert, ChartLine, Bot, Globe, Activity } from "lucide-react";
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

  // Typing animation for the title
  const fullTitle = "CVE HUNTER";
  const [typedTitle, setTypedTitle] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let current = 0;
    let typing: NodeJS.Timeout | null = null;
    let resetTimeout: NodeJS.Timeout | null = null;
    setTypedTitle("");
    setShowCursor(true);

    const startTyping = () => {
      typing = setInterval(() => {
        setTypedTitle((prev) => {
          const next = fullTitle.slice(0, prev.length + 1);
          if (next.length === fullTitle.length) {
            if (typing) clearInterval(typing);
            // Wait 5 seconds, then reset and start typing again
            resetTimeout = setTimeout(() => {
              setTypedTitle("");
              setShowCursor(true);
              current = 0;
              startTyping();
            }, 5000);
          }
          return next;
        });
      }, 120);
    };

    startTyping();

    return () => {
      if (typing) clearInterval(typing);
      if (resetTimeout) clearTimeout(resetTimeout);
    };
  }, []);

  // Blinking cursor effect
  useEffect(() => {
    if (typedTitle.length === fullTitle.length) {
      const blink = setInterval(() => {
        setShowCursor((c) => !c);
      }, 500);
      return () => clearInterval(blink);
    } else {
      setShowCursor(true);
    }
  }, [typedTitle, fullTitle]);

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
      <header className="relative z-10 border-b border-[hsl(var(--matrix-green))] bg-background/95 backdrop-blur-sm shadow-[0_0_20px_rgba(0,255,65,0.3)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-[hsl(var(--matrix-green))] to-[hsl(var(--cyber-cyan))] rounded-lg flex items-center justify-center pulse-green shadow-[0_0_15px_rgba(0,255,65,0.5)] hover:shadow-[0_0_25px_rgba(0,255,65,0.8)] transition-all duration-300">
                <Shield className="text-background text-xl" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[hsl(var(--critical))] rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[hsl(var(--matrix-green))] font-mono flex items-center glitch-text">
                  <span style={{ minWidth: `${fullTitle.length}em`, display: 'inline-block' }}>
                    {typedTitle}
                    <span
                      className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
                      style={{
                        display: 'inline-block',
                        width: '0.65em',
                        height: '1em',
                        background: 'currentColor',
                        verticalAlign: 'text-bottom',
                        marginLeft: '0.05em',
                        position: 'relative',
                        top: 0
                      }}
                    />
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground flex items-center">
                  <span className="animate-pulse mr-2">⚡</span>
                  Cybersecurity Vulnerability Intelligence
                  <span className="animate-pulse ml-2">⚡</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="bg-background/50 backdrop-blur-sm border border-[hsl(var(--matrix-green))]/30 rounded-lg px-3 py-2 hover:border-[hsl(var(--matrix-green))] transition-all duration-300">
                <span className="text-muted-foreground">CVEs:</span>
                  <span className="text-[hsl(var(--matrix-green))] font-mono ml-1">{cveCount?.count || 0}</span>
                </div>
                <div className="bg-background/50 backdrop-blur-sm border border-[hsl(var(--cyber-cyan))]/30 rounded-lg px-3 py-2 hover:border-[hsl(var(--cyber-cyan))] transition-all duration-300">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-[hsl(var(--cyber-cyan))] font-mono ml-1">ONLINE</span>
                </div>
                <div className="bg-background/50 backdrop-blur-sm border border-muted/30 rounded-lg px-3 py-2">
                  <span className="text-muted-foreground font-mono">{new Date().toLocaleDateString()}</span>
                </div>
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
      <footer className="relative z-10 border-t border-[hsl(var(--matrix-green))] bg-background/95 backdrop-blur-sm mt-16 shadow-[0_0_20px_rgba(0,255,65,0.2)]">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-[hsl(var(--matrix-green))] mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2 animate-pulse" />
                DATA SOURCES
                <div className="ml-2 w-2 h-2 bg-[hsl(var(--matrix-green))] rounded-full animate-ping"></div>
              </h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center p-2 bg-background/30 rounded-lg border border-[hsl(var(--matrix-green))]/20 hover:border-[hsl(var(--matrix-green))] transition-all duration-300">
                  <Database className="w-4 h-4 mr-3 text-[hsl(var(--matrix-green))]" />
                  <span className="text-muted-foreground">National Vulnerability Database (NVD)</span>
                </li>
                <li className="flex items-center p-2 bg-background/30 rounded-lg border border-[hsl(var(--cyber-cyan))]/20 hover:border-[hsl(var(--cyber-cyan))] transition-all duration-300">
                  <Globe className="w-4 h-4 mr-3 text-[hsl(var(--cyber-cyan))]" />
                  <span className="text-muted-foreground">SHODAN Threat Intelligence</span>
                </li>
                <li className="flex items-center p-2 bg-background/30 rounded-lg border border-[hsl(var(--high))]/20 hover:border-[hsl(var(--high))] transition-all duration-300">
                  <ChartLine className="w-4 h-4 mr-3 text-[hsl(var(--high))]" />
                  <span className="text-muted-foreground">EPSS Scoring System</span>
                </li>
                <li className="flex items-center p-2 bg-background/30 rounded-lg border border-[hsl(var(--critical))]/20 hover:border-[hsl(var(--critical))] transition-all duration-300">
                  <Bot className="w-4 h-4 mr-3 text-[hsl(var(--critical))]" />
                  <span className="text-muted-foreground">AI-Enhanced Threat Analysis</span>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-[hsl(var(--cyber-cyan))] mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 animate-pulse" />
                FEATURES
                <div className="ml-2 w-2 h-2 bg-[hsl(var(--cyber-cyan))] rounded-full animate-ping"></div>
              </h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center p-2 bg-background/30 rounded-lg border border-[hsl(var(--cyber-cyan))]/20 hover:border-[hsl(var(--cyber-cyan))] transition-all duration-300">
                  <Shield className="w-4 h-4 mr-3 text-[hsl(var(--cyber-cyan))]" />
                  <span className="text-muted-foreground">Advanced CVE Search & Analysis</span>
                </li>
                <li className="flex items-center p-2 bg-background/30 rounded-lg border border-[hsl(var(--matrix-green))]/20 hover:border-[hsl(var(--matrix-green))] transition-all duration-300">
                  <Database className="w-4 h-4 mr-3 text-[hsl(var(--matrix-green))]" />
                  <span className="text-muted-foreground">Risk Matrix Assessment</span>
                </li>
                <li className="flex items-center p-2 bg-background/30 rounded-lg border border-[hsl(var(--high))]/20 hover:border-[hsl(var(--high))] transition-all duration-300">
                  <ShieldAlert className="w-4 h-4 mr-3 text-[hsl(var(--high))]" />
                  <span className="text-muted-foreground">Threat Intelligence Integration</span>
                </li>
                <li className="flex items-center p-2 bg-background/30 rounded-lg border border-[hsl(var(--critical))]/20 hover:border-[hsl(var(--critical))] transition-all duration-300">
                  <ChartLine className="w-4 h-4 mr-3 text-[hsl(var(--critical))]" />
                  <span className="text-muted-foreground">Exploit Prediction Scoring</span>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-[hsl(var(--high))] mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 animate-pulse" />
                SYSTEM STATUS
                <div className="ml-2 w-2 h-2 bg-[hsl(var(--high))] rounded-full animate-ping"></div>
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-2 bg-background/30 rounded-lg border border-[hsl(var(--matrix-green))]/20">
                  <span className="text-muted-foreground">Database:</span>
                  <span className="text-[hsl(var(--matrix-green))] font-mono">ONLINE</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-background/30 rounded-lg border border-[hsl(var(--cyber-cyan))]/20">
                  <span className="text-muted-foreground">API Status:</span>
                  <span className="text-[hsl(var(--cyber-cyan))] font-mono">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-background/30 rounded-lg border border-[hsl(var(--high))]/20">
                  <span className="text-muted-foreground">AI Engine:</span>
                  <span className="text-[hsl(var(--high))] font-mono">READY</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-background/30 rounded-lg border border-[hsl(var(--critical))]/20">
                  <span className="text-muted-foreground">Security:</span>
                  <span className="text-[hsl(var(--critical))] font-mono">SECURE</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-[hsl(var(--matrix-green))]/30 mt-8 pt-8 text-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="w-2 h-2 bg-[hsl(var(--matrix-green))] rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-[hsl(var(--cyber-cyan))] rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <div className="w-2 h-2 bg-[hsl(var(--high))] rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              <div className="w-2 h-2 bg-[hsl(var(--critical))] rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              &copy; 2025 CVE Hunter - Advanced Cybersecurity Vulnerability Intelligence Platform
            </p>
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              [SYSTEM_VERSION: 2.0.1] [BUILD: 2025.01.15] [STATUS: OPERATIONAL]
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
