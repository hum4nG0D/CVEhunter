import OpenAI from "openai";
import axios from "axios";
import dotenv from 'dotenv';
import { type Cve } from "../../shared/schema.js";

dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
    const cvssScore = cvssData?.baseScore || 'Unknown';
    const attackVector = cvssData?.attackVector || 'Unknown';
    const attackComplexity = cvssData?.attackComplexity || 'Unknown';
    const privileges = cvssData?.privilegesRequired || 'Unknown';
    const userInteraction = cvssData?.userInteraction || 'Unknown';
    
    // Extract CWE information
    const cweIds = cveData.weaknesses?.map((w: any) => w.type?.replace('Primary:', '').replace('Secondary:', '') || 'Unknown').filter((id: string) => id !== 'Unknown') || [];
    const cweInfo = cweIds.length > 0 ? `CWE IDs: ${cweIds.join(', ')}` : 'No CWE information available';
    
    // Extract references for exploitation status
    const references = cveData.references || [];
    const exploitRefs = references.filter((ref: any) => 
      ref.tags?.includes('Exploit') || 
      ref.url.toLowerCase().includes('exploit') || 
      ref.url.toLowerCase().includes('poc') ||
      ref.url.toLowerCase().includes('github.com')
    );
    const vendorRefs = references.filter((ref: any) => 
      ref.tags?.includes('Vendor Advisory') || 
      ref.tags?.includes('Patch')
    );

    // Create a comprehensive prompt
    const prompt = `Analyze CVE with the following information:

**Basic Information:**
- Severity: ${severity} (CVSS: ${cvssScore})
- Description: ${description}
- ${cweInfo}

**CVSS Metrics:**
- Attack Vector: ${attackVector}
- Attack Complexity: ${attackComplexity}
- Privileges Required: ${privileges}
- User Interaction: ${userInteraction}

**References Found:**
- Exploit References: ${exploitRefs.length} found
- Vendor Advisories: ${vendorRefs.length} found

Provide a comprehensive analysis covering:

**1. Key Risks**
- What are the main security threats?
- What can an attacker achieve?
- Potential attack scenarios

**2. Exploitation Status**
- Is it known to be exploited in the wild?
- Any public PoC/exploit available (e.g., Exploit-DB, GitHub)
- Exploitation likelihood based on available references

**3. Impact Analysis**
- Confidentiality / Integrity / Availability impact
- Scope and severity of potential damage

**4. Mitigation & Remediation**
- Patched version(s) if available
- Workarounds (if patch not available)
- Vendor advisory links
- Recommended immediate actions

**5. CWE Context**
- What type of weakness this represents
- Common attack patterns for this CWE

Keep the analysis concise but comprehensive. Focus on actionable insights for security teams.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using the more cost-effective model
      messages: [
        {
          role: "system",
          content: "You are a senior cybersecurity expert with deep knowledge of vulnerability analysis, exploitation techniques, and incident response. Provide comprehensive, actionable analysis that helps security teams understand and respond to vulnerabilities effectively. Use clear, professional language and structure your response with headers for easy reading."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 400, // Increased token limit for more comprehensive analysis
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
  try {
    // Query the Shodan CVE database - this is publicly accessible without API key
    const cveResponse = await axios.get(`https://cvedb.shodan.io/cve/${cveId}`);

    return {
      cveData: cveResponse.data ? {
        summary: cveResponse.data.summary,
        cvss: cveResponse.data.cvss,
        cvss_version: cveResponse.data.cvss_version,
        cvss_v2: cveResponse.data.cvss_v2,
        cvss_v3: cveResponse.data.cvss_v3,
        epss: cveResponse.data.epss,
        ranking_epss: cveResponse.data.ranking_epss,
        kev: cveResponse.data.kev,
        propose_action: cveResponse.data.propose_action,
        ransomware_campaign: cveResponse.data.ransomware_campaign,
        references: cveResponse.data.references,
        published_time: cveResponse.data.published_time,
        cpes: cveResponse.data.cpes
      } : null
    };

  } catch (error) {
    console.error('Shodan CVE database error:', error);
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