import { pgTable, text, serial, integer, boolean, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the type for NVD descriptions
interface NVDDescription {
  lang: string;
  value: string;
}

// Define the type for NVD data
interface NVDData {
  cve: {
    id: string;
  descriptions: {
      lang: string;
      value: string;
    }[];
    metrics?: {
      cvssMetricV31?: {
        cvssData?: {
          baseScore?: number;
          baseSeverity?: string;
          vectorString?: string;
          attackVector?: string;
          attackComplexity?: string;
          privilegesRequired?: string;
          userInteraction?: string;
        };
      }[];
  };
    configurations?: {
      nodes?: {
        negate?: boolean;
        cpeMatch?: {
          criteria?: string;
          vulnerable?: boolean;
          versionStartIncluding?: string;
          versionEndIncluding?: string;
        }[];
        operator?: string;
      }[];
    }[];
    references?: {
      url: string;
      tags?: string[];
      source?: string;
    }[];
    weaknesses?: {
      type?: string;
      source?: string;
      description: {
        lang: string;
        value: string;
      }[];
    }[];
    published?: string;
    lastModified?: string;
  };
}

export const cves = pgTable("cves", {
  cveId: text("cve_id").primaryKey(),
  fullJson: jsonb("full_json").$type<NVDData>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const searchHistory = pgTable("search_history", {
  id: serial("id").primaryKey(),
  cveId: text("cve_id").notNull().unique(),
  description: text("description"),
  searchTime: timestamp("search_time").defaultNow(),
});

// Zod schemas for validation
export const cveIdSchema = z.string().regex(/^CVE-\d{4}-\d{4,}$/);

// TypeScript types
export type Cve = typeof cves.$inferSelect;
export type InsertCve = typeof cves.$inferInsert;
export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = typeof searchHistory.$inferInsert;
