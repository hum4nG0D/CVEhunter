import axios from 'axios';
import { db } from '../db.js';
import { cves } from '../../shared/schema.js';

const NVD_API_BASE = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const API_KEY = process.env.NVD_API_KEY; // Optional: Get from https://nvd.nist.gov/developers/request-an-api-key

async function fetchCVEs(startIndex = 0, resultsPerPage = 2000) {
  try {
    const response = await axios.get(NVD_API_BASE, {
      params: {
        startIndex,
        resultsPerPage,
        ...(API_KEY && { apiKey: API_KEY })
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching CVEs:', error);
    return null;
  }
}

async function populateDatabase() {
  let startIndex = 0;
  const resultsPerPage = 2000;
  let totalResults = Infinity;
  let processedCount = 0;

  console.log('Starting NVD data population...');

  while (processedCount < totalResults) {
    console.log(`Fetching CVEs from index ${startIndex}...`);
    const data = await fetchCVEs(startIndex, resultsPerPage);

    if (!data) {
      console.error('Failed to fetch data, retrying in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      continue;
    }

    totalResults = data.totalResults;
    const vulnerabilities = data.vulnerabilities || [];

    console.log(`Processing ${vulnerabilities.length} CVEs...`);

    for (const vuln of vulnerabilities) {
      const cve = vuln.cve;
      try {
        await db.insert(cves).values({
          cveId: cve.id,
          fullJson: cve
        }).onConflictDoNothing();
      } catch (error) {
        console.error(`Error inserting CVE ${cve.id}:`, error);
      }
    }

    processedCount += vulnerabilities.length;
    console.log(`Processed ${processedCount} of ${totalResults} CVEs`);

    // Respect NVD API rate limits (5 requests per 30 seconds without API key)
    await new Promise(resolve => setTimeout(resolve, API_KEY ? 1000 : 6000));
    startIndex += resultsPerPage;
  }

  console.log('NVD data population completed!');
}

// Run the population script
populateDatabase().catch(console.error); 