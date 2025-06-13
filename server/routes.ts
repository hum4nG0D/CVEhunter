import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { cveIdSchema, type Cve } from "../shared/schema.js";
import { z } from "zod";
import { getAIThreatAnalysis, getShodanData, getEPSSData } from "./services/api.js";

function transformNVDData(cveRecord: Cve, shodanData: any): any {
  const fullJson = cveRecord.fullJson;
  if (!fullJson) return null;

  const cveData = fullJson.cve;
  if (!cveData) return null;

  // Extract English description - handle all possible cases
  let description = 'No description available';
  if (cveData.descriptions) {
    if (Array.isArray(cveData.descriptions)) {
      const englishDesc = cveData.descriptions.find((desc: any) => desc.lang === 'en');
      if (englishDesc && typeof englishDesc.value === 'string') {
        description = englishDesc.value;
      }
    } else if (typeof cveData.descriptions === 'string') {
      description = cveData.descriptions;
    } else if (typeof cveData.descriptions === 'object' && cveData.descriptions.value) {
      description = cveData.descriptions.value;
    }
  }

  // Extract CVSS data from metrics
  const cvssData = cveData.metrics?.cvssMetricV31?.[0]?.cvssData || {};
  const cvssScore = cvssData.baseScore;
  const severity = cvssData.baseSeverity;
  const cvssVector = cvssData.vectorString;
  const attackVector = cvssData.attackVector;
  const attackComplexity = cvssData.attackComplexity;
  const privileges = cvssData.privilegesRequired;
  const userInteraction = cvssData.userInteraction;

  // Extract affected products from configurations
  const affectedProducts = cveData.configurations || [];

  // Extract references and categorize them
  const references = cveData.references || [];
  
  // Extract known exploits from references
  const knownExploits = references
    .filter((ref: { tags?: string[]; url: string }) => 
      ref.tags?.includes('Exploit') || 
      ref.url.toLowerCase().includes('exploit') || 
      ref.url.toLowerCase().includes('poc') ||
      ref.url.toLowerCase().includes('github.com')
    )
    .map((ref: { tags?: string[]; url: string }) => ({
      type: 'Exploit',
      description: ref.tags?.join(', ') || 'Exploit available',
      source: ref.url
    }));

  // Extract related news from references
  const relatedNews = references
    .filter((ref: { tags?: string[]; url: string }) => 
      ref.tags?.includes('News') || 
      ref.url.toLowerCase().includes('news') ||
      ref.url.toLowerCase().includes('blog') ||
      ref.tags?.includes('Mailing List')
    )
    .map((ref: { tags?: string[]; url: string }) => ({
      title: ref.tags?.join(', ') || 'Related news',
      description: ref.url,
      source: ref.url,
      time: cveData.published || new Date().toISOString()
    }));

  // Extract weaknesses
  const uniqueWeaknesses = new Map();
  cveData.weaknesses?.forEach((weakness: { description: { lang: string; value: string }[] }) => {
    const description = weakness.description.find((desc: { lang: string; value: string }) => desc.lang === 'en')?.value;
    if (description) {
      uniqueWeaknesses.set(description, {
        type: 'Weakness',
        description,
        severity: severity || 'Unknown',
        implication: 'This weakness could lead to security vulnerabilities if not properly addressed'
      });
    }
  });

  // Create threat context
  const threatContext = {
    news: relatedNews,
    activeThreats: knownExploits.map((exp: { description: string; source: string }) => ({
      type: 'Exploit',
      description: exp.description,
      source: exp.source,
      confidence: 'High'
    })),
    industryImpact: {
      severity: severity || 'Unknown',
      description: 'Based on CVSS severity and affected products',
      sectors: affectedProducts.flatMap((config: { nodes?: { cpeMatch?: { criteria?: string }[] }[] }) => 
        config.nodes?.flatMap(node => 
          node.cpeMatch?.map(match => match.criteria) || []
        ) || []
      )
    },
    emergingTrends: Array.from(uniqueWeaknesses.values())
  };

  // Create threat intelligence data
  const threatIntelligence = {
    threatLevel: severity || 'Unknown',
    attackVectors: [{
      type: attackVector || 'Unknown',
      description: 'Attack vector from CVSS metrics',
      risk: severity || 'Unknown'
    }],
    mitigations: references
      .filter((ref: { tags?: string[] }) => ref.tags?.includes('Patch') || ref.tags?.includes('Vendor Advisory'))
      .map((ref: { tags?: string[]; url: string }) => ({
        strategy: ref.tags?.join(', ') || 'Security patch available',
        implementation: ref.url,
        effectiveness: 'High'
      })),
    recommendations: [
      {
        action: 'Update to the latest version',
        priority: severity === 'CRITICAL' ? 'High' : severity === 'HIGH' ? 'Medium' : 'Low',
        rationale: 'Keeping software up to date is crucial for security'
      },
      {
        action: 'Monitor for exploitation attempts',
        priority: 'Medium',
        rationale: 'Early detection can prevent successful attacks'
      },
      {
        action: 'Apply available security patches',
        priority: severity === 'CRITICAL' ? 'High' : severity === 'HIGH' ? 'Medium' : 'Low',
        rationale: 'Patches address known vulnerabilities'
      }
    ]
  };

  // Ensure all fields are properly stringified
  return {
    id: cveData.id,
    cveId: cveData.id,
    description: description, // Now guaranteed to be a string
    cvssScore: cvssScore || null,
    severity: severity || null,
    published: cveData.published || null,
    modified: cveData.lastModified || null,
    epssScore: null,
    epssPercentile: null,
    cvssVector: cvssVector || null,
    attackVector: attackVector || null,
    attackComplexity: attackComplexity || null,
    privileges: privileges || null,
    userInteraction: userInteraction || null,
    affectedProducts: JSON.stringify(affectedProducts),
    knownExploits: JSON.stringify(knownExploits),
    relatedNews: JSON.stringify(relatedNews),
    references: JSON.stringify(references),
    weaknesses: JSON.stringify(Array.from(uniqueWeaknesses.values())),
    shodanData: shodanData ? JSON.stringify(shodanData) : null,
    threatIntelligence: JSON.stringify(threatIntelligence),
    threatContext: JSON.stringify(threatContext),
    createdAt: cveRecord.createdAt
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Search CVE endpoint
  app.get("/api/cve/:cveId", async (req, res) => {
    try {
      const cveId = cveIdSchema.parse(req.params.cveId.toUpperCase());
      
      // Get CVE data from database
      const cveRecord = await storage.getCveRecord(cveId);
      
      if (!cveRecord) {
        return res.status(404).json({ message: "CVE not found" });
      }

      // Fetch additional data in parallel
      const [shodanData, epssData] = await Promise.all([
        getShodanData(cveId).catch(err => {
          console.error('Shodan API error:', err);
          return null;
        }),
        getEPSSData(cveId).catch(err => {
          console.error('EPSS API error:', err);
          return null;
        })
      ]);

      // Transform the data
      const transformedData = transformNVDData(cveRecord, shodanData);
      
      // Add EPSS data
      if (epssData) {
        transformedData.epssScore = epssData.score;
        transformedData.epssPercentile = epssData.percentile;
      }
      
      // Add AI analysis to threat intelligence
      const aiAnalysis = await getAIThreatAnalysis(cveRecord);
      if (aiAnalysis) {
        const threatIntelligence = JSON.parse(transformedData.threatIntelligence || '{}');
        threatIntelligence.aiAnalysis = {
          openai: aiAnalysis.openai
        };
        transformedData.threatIntelligence = JSON.stringify(threatIntelligence);
      }
      
      // Extract English description for search history
      const descriptions = Array.isArray(cveRecord.fullJson?.cve?.descriptions) ? cveRecord.fullJson.cve.descriptions : [];
      const englishDesc = descriptions.find(d => d.lang === 'en')?.value || 'No description available';
      
      // Save to search history
      await storage.addToSearchHistory({
        cveId,
        description: englishDesc
      });
      
      res.json(transformedData);
    } catch (error) {
      console.error('Error processing CVE request:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get search history
  app.get("/api/search-history", async (req, res) => {
    try {
      const history = await storage.getSearchHistory();
      res.json(history);
    } catch (error) {
      console.error("Search history error:", error);
      res.status(500).json({ message: "Failed to fetch search history" });
    }
  });

  // Get CVE count
  app.get("/api/cve-count", async (req, res) => {
    try {
      const count = await storage.getCveCount();
      res.json({ count });
    } catch (error) {
      console.error("CVE count error:", error);
      res.status(500).json({ message: "Failed to fetch CVE count" });
    }
  });
  
  // Clear search history
  app.delete("/api/search-history", async (req, res) => {
    try {
      await storage.clearSearchHistory();
      res.json({ message: "Search history cleared" });
    } catch (error) {
      console.error("Clear history error:", error);
      res.status(500).json({ message: "Failed to clear search history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
