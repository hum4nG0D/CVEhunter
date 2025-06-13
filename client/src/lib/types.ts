export interface CVEData {
  id: string;
  cveId: string;
  description: string;
  cvssScore: number | null;
  severity: string | null;
  published: string | null;
  modified: string | null;
  epssScore: number | null;
  epssPercentile: number | null;
  cvssVector: string | null;
  attackVector: string | null;
  attackComplexity: string | null;
  privileges: string | null;
  userInteraction: string | null;
  affectedProducts: string | null;
  knownExploits: string | null;
  relatedNews: string | null;
  rhelAdvisory: string | null;
  shodanData: string | null;
  threatIntelligence: string | null;
  threatContext: string | null;
  weaknesses: string | null;
  createdAt: Date;
}

export interface SearchHistoryItem {
  id: number;
  cveId: string;
  description: string | null;
  searchTime: Date;
}

export interface AffectedProduct {
  name: string;
  versions: string;
  status: string;
}

export interface KnownExploit {
  type: string;
  description: string;
  source: string;
}

export interface RelatedNews {
  title: string;
  description: string;
  source: string;
  time: string;
}

export interface AIAnalysis {
  openai: string;
  gemini: string;
}

export interface ThreatIntelligence {
  threatLevel: string;
  attackVectors: Array<{
    type: string;
    description: string;
    risk: string;
  }>;
  mitigations: Array<{
    type: string;
    description: string;
    source: string;
  }>;
  recommendations: Array<{
    type: string;
    description: string;
    priority: string;
    display: string;
  }>;
  aiAnalysis?: AIAnalysis;
}

export interface RHELAdvisory {
  name: string;
  synopsis: string;
  severity: string;
  description: string;
  statement: string;
  mitigation: string;
  public_date: string;
}

export interface ShodanData {
  matches: Array<{
    ip: string;
    port: number;
    hostnames: string[];
    os: string;
    timestamp: string;
    latitude: number;
    longitude: number;
    isp: string;
    org: string;
  }>;
  total: number;
}
