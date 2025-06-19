import OpenAI from "openai";
import axios from "axios";
import dotenv from 'dotenv';
import { type Cve } from "../../shared/schema.js";

dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Shodan API configuration
const SHODAN_API_KEY = process.env.SHODAN_API_KEY;
const SHODAN_API_BASE = 'https://api.shodan.io';

// EPSS API configuration
const EPSS_API_BASE = 'https://api.first.org/data/v1/epss';

interface AIAnalysis {
  openai: string;
}

export async function getAIThreatAnalysis(cveRecord: Cve): Promise<AIAnalysis | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.log('OpenAI API key not configured');
    return null;
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Extract essential information from CVE record
    const cveData = cveRecord.fullJson?.cve;
    if (!cveData) return null;

    const description = cveData.descriptions?.find((d: { lang: string; value: string }) => d.lang === 'en')?.value || 'No description available';
    const cvssData = cveData.metrics?.cvssMetricV31?.[0]?.cvssData;
    const severity = cvssData?.baseSeverity || 'Unknown';

    // Create a more concise prompt to reduce token usage
    const prompt = `Analyze CVE:
Severity: ${severity}
Description: ${description}

Provide a brief analysis focusing on:
1. Key risks
2. Mitigation steps
3. Priority level

Keep it concise.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using the more cost-effective model
      messages: [
        {
          role: "system",
          content: "You are a cybersecurity expert. Provide concise, actionable analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200, // Reduced token limit
      temperature: 0.7
    });

    const analysis = completion.choices[0]?.message?.content;
    if (!analysis) return null;

    return {
      openai: analysis
    };
  } catch (error) {
    if (error instanceof OpenAI.RateLimitError) {
      console.log('OpenAI rate limit reached');
    return null;
  }
    console.error('OpenAI API error:', error);
    return null;
  }
}

export async function getShodanData(cveId: string) {
  if (!SHODAN_API_KEY) {
    console.log('Shodan API key not configured');
    return null;
  }

  try {
    // Query the Shodan CVE database with the correct endpoint format
    const response = await axios.get(`https://cvedb.shodan.io/cve/${cveId}`, {
      params: {
        key: SHODAN_API_KEY
      }
    });

    // If we have CVE data, also get the host search results
    if (response.data) {
      const hostResponse = await axios.get(`${SHODAN_API_BASE}/shodan/host/search`, {
        params: {
          key: SHODAN_API_KEY,
          query: cveId,
          limit: 100
        }
      });

      return {
        cveData: {
          summary: response.data.summary,
          cvss: response.data.cvss,
          cvss_version: response.data.cvss_version,
          cvss_v2: response.data.cvss_v2,
          cvss_v3: response.data.cvss_v3,
          epss: response.data.epss,
          ranking_epss: response.data.ranking_epss,
          kev: response.data.kev,
          propose_action: response.data.propose_action,
          ransomware_campaign: response.data.ransomware_campaign,
          references: response.data.references,
          published_time: response.data.published_time,
          cpes: response.data.cpes
        },
        matches: hostResponse.data.matches || [],
        total: hostResponse.data.total || 0
      };
    }

    return null;
  } catch (error) {
    console.error('Shodan API error:', error);
    return null;
  }
}

export async function getEPSSData(cveId: string) {
  try {
    const response = await axios.get(`${EPSS_API_BASE}`, {
      params: {
        cve: cveId
      }
    });
    
    if (response.data && response.data.data && response.data.data.length > 0) {
      const epssData = response.data.data[0];
      return {
        score: parseFloat(epssData.epss),
        percentile: parseFloat(epssData.percentile)
      };
    }
    return null;
  } catch (error) {
    console.error('EPSS API error:', error);
    return null;
  }
}

export interface ShodanData {
  total: number;
  matches: Array<{
    ip_str: string;
    port: number;
    country_name: string;
    city: string;
    latitude: number;
    longitude: number;
    data: string;
    timestamp: string;
  }>;
  cveData?: {
    summary: string;
    cvss: number;
    cvss_version: string;
    cvss_v2: string;
    cvss_v3: string;
    epss: number;
    ranking_epss: number;
    kev: boolean;
    ransomware_campaign: boolean;
    cpes: string[];
    references: string[];
    published_time: string;
  };
}

export interface EPSSData {
  score: number;
  percentile: number;
}

export interface CWEData {
  id: string;
  name: string;
  description: string;
  extended_description?: string;
  likelihood: string;
  status: string;
  relationships?: Array<{
    target_id: string;
    relationship_type: string;
    target_name: string;
  }>;
  consequences?: Array<{
    scope: string;
    impact: string;
    likelihood: string;
  }>;
  mitigations?: Array<{
    phase: string;
    description: string;
    effectiveness: string;
  }>;
}

// Fetch detailed CWE information
export async function getCWEDetails(cweId: string): Promise<CWEData | null> {
  try {
    // Clean up CWE ID (remove CWE- prefix if present)
    const cleanCweId = cweId.replace('CWE-', '');
    
    // Fetch from CWE database API
    const response = await axios.get(`https://cwe.mitre.org/data/xml/cwec_latest.xml`);
    
    // For now, return a structured CWE object with basic information
    // In a full implementation, you would parse the XML and extract specific CWE details
    return {
      id: cweId,
      name: `CWE-${cleanCweId}`,
      description: `Common Weakness Enumeration ${cleanCweId}`,
      likelihood: 'Medium',
      status: 'Draft',
      consequences: [
        {
          scope: 'Confidentiality',
          impact: 'High',
          likelihood: 'Medium'
        },
        {
          scope: 'Integrity', 
          impact: 'Medium',
          likelihood: 'Medium'
        },
        {
          scope: 'Availability',
          impact: 'Low',
          likelihood: 'Medium'
        }
      ],
      mitigations: [
        {
          phase: 'Requirements',
          description: 'Use input validation and sanitization',
          effectiveness: 'High'
        },
        {
          phase: 'Implementation',
          description: 'Follow secure coding practices',
          effectiveness: 'High'
        },
        {
          phase: 'Testing',
          description: 'Conduct thorough security testing',
          effectiveness: 'Medium'
        }
      ]
    };
  } catch (error) {
    console.error('Error fetching CWE details:', error);
    return null;
  }
}

// Enhanced CWE information with more details
export async function getEnhancedCWEInfo(cweIds: string[]): Promise<Map<string, CWEData>> {
  const cweDetails = new Map<string, CWEData>();
  
  // Fetch details for each CWE ID
  for (const cweId of cweIds) {
    const details = await getCWEDetails(cweId);
    if (details) {
      cweDetails.set(cweId, details);
    }
  }
  
  return cweDetails;
} 