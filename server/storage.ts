import { clothingItems, type ClothingItem, type InsertClothingItem, users, type User, type InsertUser, type UpdateProfile, itemLikes } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, and, sql, desc, asc } from "drizzle-orm";

export interface IStorage {
  getAllClothingItems(sort?: {
    by: 'price' | 'likesCount' | 'createdAt' | 'popularity',
    order: 'asc' | 'desc'
  }): Promise<(ClothingItem & { seller: { username: string } })[]>;
  getClothingItem(id: number): Promise<(ClothingItem & { seller: { username: string } }) | undefined>;
  searchClothingItems(query: string): Promise<(ClothingItem & { seller: { username: string } })[]>;
  filterClothingItems(type?: string, tags?: string[]): Promise<(ClothingItem & { seller: { username: string } })[]>;
  addClothingItem(item: InsertClothingItem): Promise<ClothingItem>;
  getUserItems(userId: number): Promise<(ClothingItem & { seller: { username: string } })[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(userId: number, profile: UpdateProfile): Promise<User>;
  likeItem(itemId: number, userId?: number, ipAddress?: string): Promise<void>;
  unlikeItem(itemId: number, userId?: number, ipAddress?: string): Promise<void>;
  getUserLikedItems(identifier: { userId?: number; ipAddress?: string }): Promise<number[]>;
  getAllSellers(): Promise<(Omit<User, 'password'> & { totalLikes: number; itemsCount: number })[]>;
  getSellerTotalLikes(sellerId: number): Promise<number>;
  getSellerItemsCount(sellerId: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getAllClothingItems(sort?: {
    by: 'price' | 'likesCount' | 'createdAt' | 'popularity',
    order: 'asc' | 'desc'
  }) {
    let query = db
      .select({
        id: clothingItems.id,
        name: clothingItems.name,
        description: clothingItems.description,
        robloxId: clothingItems.robloxId,
        price: clothingItems.price,
        type: clothingItems.type,
        tags: clothingItems.tags,
        keywords: clothingItems.keywords,
        sellerId: clothingItems.sellerId,
        likesCount: clothingItems.likesCount,
        createdAt: clothingItems.createdAt,
        seller: {
          username: users.username
        }
      })
      .from(clothingItems)
      .leftJoin(users, eq(clothingItems.sellerId, users.id));

    if (sort) {
      switch (sort.by) {
        case 'price':
          query = sort.order === 'desc'
            ? query.orderBy(desc(clothingItems.price))
            : query.orderBy(asc(clothingItems.price));
          break;
        case 'likesCount':
          query = sort.order === 'desc'
            ? query.orderBy(desc(clothingItems.likesCount))
            : query.orderBy(asc(clothingItems.likesCount));
          break;
        case 'createdAt':
          query = sort.order === 'desc'
            ? query.orderBy(desc(clothingItems.createdAt))
            : query.orderBy(asc(clothingItems.createdAt));
          break;
        case 'popularity':
          query = query.orderBy(desc(clothingItems.likesCount));
          break;
      }
    } else {
      query = query.orderBy(desc(clothingItems.createdAt));
    }

    return query;
  }

  async getClothingItem(id: number) {
    const [item] = await db
      .select({
        id: clothingItems.id,
        name: clothingItems.name,
        description: clothingItems.description,
        robloxId: clothingItems.robloxId,
        price: clothingItems.price,
        type: clothingItems.type,
        tags: clothingItems.tags,
        keywords: clothingItems.keywords,
        sellerId: clothingItems.sellerId,
        likesCount: clothingItems.likesCount,
        createdAt: clothingItems.createdAt,
        seller: {
          username: users.username
        }
      })
      .from(clothingItems)
      .leftJoin(users, eq(clothingItems.sellerId, users.id))
      .where(eq(clothingItems.id, id));
    return item;
  }

  async searchClothingItems(query: string) {
    return db
      .select({
        id: clothingItems.id,
        name: clothingItems.name,
        description: clothingItems.description,
        robloxId: clothingItems.robloxId,
        price: clothingItems.price,
        type: clothingItems.type,
        tags: clothingItems.tags,
        keywords: clothingItems.keywords,
        sellerId: clothingItems.sellerId,
        likesCount: clothingItems.likesCount,
        createdAt: clothingItems.createdAt,
        seller: {
          username: users.username
        }
      })
      .from(clothingItems)
      .leftJoin(users, eq(clothingItems.sellerId, users.id))
      .where(
        or(
          ilike(clothingItems.name, `%${query}%`),
          ilike(clothingItems.description, `%${query}%`),
          sql`EXISTS (
            SELECT 1 FROM unnest(${clothingItems.tags}) tag 
            WHERE tag ILIKE ${`%${query}%`}
          )`,
          sql`EXISTS (
            SELECT 1 FROM unnest(${clothingItems.keywords}) keyword 
            WHERE keyword ILIKE ${`%${query}%`}
          )`
        )
      );
  }

  async filterClothingItems(type?: string, tags?: string[]) {
    let conditions = [];

    if (type && type !== "all") {
      conditions.push(eq(clothingItems.type, type));
    }

    if (tags && tags.length > 0) {
      conditions.push(sql`${clothingItems.tags} && array[${tags}]::text[]`);
    }

    let query = db
      .select({
        id: clothingItems.id,
        name: clothingItems.name,
        description: clothingItems.description,
        robloxId: clothingItems.robloxId,
        price: clothingItems.price,
        type: clothingItems.type,
        tags: clothingItems.tags,
        keywords: clothingItems.keywords,
        sellerId: clothingItems.sellerId,
        likesCount: clothingItems.likesCount,
        createdAt: clothingItems.createdAt,
        seller: {
          username: users.username
        }
      })
      .from(clothingItems)
      .leftJoin(users, eq(clothingItems.sellerId, users.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return query;
  }

  async addClothingItem(item: InsertClothingItem): Promise<ClothingItem> {
    const [newItem] = await db
      .insert(clothingItems)
      .values(item)
      .returning();
    return newItem;
  }

  async getUserItems(userId: number) {
    return db
      .select({
        id: clothingItems.id,
        name: clothingItems.name,
        description: clothingItems.description,
        robloxId: clothingItems.robloxId,
        price: clothingItems.price,
        type: clothingItems.type,
        tags: clothingItems.tags,
        keywords: clothingItems.keywords,
        sellerId: clothingItems.sellerId,
        likesCount: clothingItems.likesCount,
        createdAt: clothingItems.createdAt,
        seller: {
          username: users.username
        }
      })
      .from(clothingItems)
      .leftJoin(users, eq(clothingItems.sellerId, users.id))
      .where(eq(clothingItems.sellerId, userId));
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(user)
      .returning();
    return newUser;
  }

  async updateUserProfile(userId: number, profile: UpdateProfile): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(profile)
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async likeItem(itemId: number, userId?: number, ipAddress?: string): Promise<void> {
    await db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(itemLikes)
        .where(and(
          eq(itemLikes.itemId, itemId),
          userId ? eq(itemLikes.userId, userId) : eq(itemLikes.ipAddress, ipAddress!)
        ));

      if (existing.length === 0) {
        await tx.insert(itemLikes).values({
          itemId,
          userId: userId || null,
          ipAddress: userId ? null : ipAddress
        });
        await tx.update(clothingItems)
          .set({ likesCount: sql`${clothingItems.likesCount} + 1` })
          .where(eq(clothingItems.id, itemId));
      }
    });
  }

  async unlikeItem(itemId: number, userId?: number, ipAddress?: string): Promise<void> {
    await db.transaction(async (tx) => {
      const deleted = await tx.delete(itemLikes)
        .where(and(
          eq(itemLikes.itemId, itemId),
          userId ? eq(itemLikes.userId, userId) : eq(itemLikes.ipAddress, ipAddress!)
        ))
        .returning();

      if (deleted.length > 0) {
        await tx.update(clothingItems)
          .set({ likesCount: sql`${clothingItems.likesCount} - 1` })
          .where(eq(clothingItems.id, itemId));
      }
    });
  }

  async getUserLikedItems(identifier: { userId?: number; ipAddress?: string }): Promise<number[]> {
    const { userId, ipAddress } = identifier;
    const likes = await db
      .select({ itemId: itemLikes.itemId })
      .from(itemLikes)
      .where(userId ? eq(itemLikes.userId, userId) : eq(itemLikes.ipAddress, ipAddress!));
    return likes.map(like => like.itemId || 0).filter(id => id !== 0);
  }

  async getSellerTotalLikes(sellerId: number): Promise<number> {
    const result = await db
      .select({
        totalLikes: sql<number>`COALESCE(SUM(${clothingItems.likesCount}), 0)`
      })
      .from(clothingItems)
      .where(eq(clothingItems.sellerId, sellerId));

    return result[0]?.totalLikes || 0;
  }

  async getSellerItemsCount(sellerId: number): Promise<number> {
    const result = await db
      .select({
        count: sql<number>`count(*)`
      })
      .from(clothingItems)
      .where(eq(clothingItems.sellerId, sellerId));

    return result[0]?.count || 0;
  }

  async getAllSellers() {
    const sellers = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        avatarUrl: users.avatarUrl,
        description: users.description,
      })
      .from(users)
      .where(eq(users.role, 'seller'));

    const sellersWithStats = await Promise.all(
      sellers.map(async (seller) => {
        const [totalLikes, itemsCount] = await Promise.all([
          this.getSellerTotalLikes(seller.id),
          this.getSellerItemsCount(seller.id)
        ]);
        return { ...seller, totalLikes, itemsCount };
      })
    );

    return sellersWithStats;
  }
}

export const storage = new DatabaseStorage();