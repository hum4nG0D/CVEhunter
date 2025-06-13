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