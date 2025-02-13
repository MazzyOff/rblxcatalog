import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("seller"),
  avatarUrl: text("avatar_url"),
  description: text("description"),
});

export const clothingItems = pgTable("clothing_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  robloxId: text("roblox_id").notNull(),
  price: integer("price").notNull(),
  type: text("type").notNull(),
  tags: text("tags").array().default([]),
  keywords: text("keywords").array().default([]),
  sellerId: integer("seller_id").references(() => users.id),
  likesCount: integer("likes_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const itemLikes = pgTable("item_likes", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => clothingItems.id),
  userId: integer("user_id").references(() => users.id),
  ipAddress: text("ip_address"),
});

// Schemas and types
export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
}).omit({ role: true, avatarUrl: true, description: true });

export const updateProfileSchema = createInsertSchema(users)
  .pick({ avatarUrl: true, description: true })
  .extend({
    description: z.string().max(500, "Description must be less than 500 characters").optional(),
    avatarUrl: z.string().url("Invalid avatar URL").optional(),
  });

export const insertClothingItemSchema = createInsertSchema(clothingItems).pick({
  name: true,
  description: true,
  robloxId: true,
  price: true,
  type: true,
  tags: true,
  keywords: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type InsertClothingItem = z.infer<typeof insertClothingItemSchema>;
export type ClothingItem = typeof clothingItems.$inferSelect;
export type User = typeof users.$inferSelect;
export type ItemLike = typeof itemLikes.$inferSelect;

// Constants
export const clothingTypes = [
  "Blocky", "Roundy", "Rthro", "Slender", "Copy and Paste (CNP)", 
  "Preppy", "Softie", "Emo", "Goth", "Kawaii", "Pastel", "Military",
  "Furry", "Bacon Hair", "Cartoony Rainbow", "Core Blocks", "Noob",
  "Troll", "Vaporwave", "Cyberpunk", "Steampunk", "Y2K", "Grunge",
  "Vintage", "Skater", "Streetwear", "Minimalist", "Animecore",
  "Monstercore", "Techwear", "Clowncore", "Scene", "E-Kid", "Royal",
  "Demoncore", "Angelcore", "Roboware", "Arcadecore", "Indie",
  "Cosplayer", "Ro-Gangster", "Goblin", "Dreamcore", "Cool Kids",
  "Drain", "Old Style", "Barbie", "Pick Me", "Devil Girl", "Gothic",
  "Weirdcore", "Mech", "Retro", "Uwu", "VSCO", "E-Girl", "E-Boy",
  "Punk", "Hipster", "Sporty", "Casual", "Formal", "Fantasy",
  "Sci-Fi", "Historical", "Futuristic", "Pirate", "Ninja",
  "Samurai", "Superhero", "Villain", "Alien", "Robot", "Animal",
  "Mythical", "Horror", "Zombie", "Vampire", "Werewolf", "Angel",
  "Demon"
] as const;