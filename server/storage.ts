import { cves, searchHistory, type Cve, type InsertCve, type SearchHistory, type InsertSearchHistory } from "../shared/schema.js";
import { db } from "./db.js";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  getCveRecord(cveId: string): Promise<Cve | undefined>;
  createCveRecord(record: InsertCve): Promise<Cve>;
  getSearchHistory(): Promise<SearchHistory[]>;
  addToSearchHistory(search: InsertSearchHistory): Promise<SearchHistory>;
  clearSearchHistory(): Promise<void>;
  getCveCount(): Promise<number>;
}

export class DBStorage implements IStorage {
  async getCveRecord(cveId: string): Promise<Cve | undefined> {
    const result = await db.select().from(cves).where(eq(cves.cveId, cveId));
    return result[0];
  }

  async createCveRecord(record: InsertCve): Promise<Cve> {
    const result = await db.insert(cves).values(record).returning();
    return result[0];
  }

  async getCveCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(cves);
    return result[0].count;
  }

  async getSearchHistory(): Promise<SearchHistory[]> {
    const result = await db.select().from(searchHistory).orderBy(searchHistory.searchTime);
    return result.reverse(); // Most recent first
  }

  async addToSearchHistory(search: InsertSearchHistory): Promise<SearchHistory> {
    try {
      const result = await db
        .insert(searchHistory)
        .values({
          cveId: search.cveId,
          description: search.description,
          searchTime: new Date()
        })
        .onConflictDoUpdate({
          target: searchHistory.cveId,
          set: {
            description: search.description,
            searchTime: new Date()
          }
        })
        .returning();

      // Keep only the last 20 searches
      await db
        .delete(searchHistory)
        .where(
          sql`id NOT IN (
            SELECT id FROM search_history 
            ORDER BY search_time DESC 
            LIMIT 20
          )`
        );

      return result[0];
    } catch (error) {
      console.error('Error adding to search history:', error);
      throw error;
      }
  }

  async clearSearchHistory(): Promise<void> {
    await db.delete(searchHistory);
  }
}

// Use DBStorage instead of MemStorage
export const storage = new DBStorage();
