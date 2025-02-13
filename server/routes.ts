import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fetch from 'node-fetch';
import { setupAuth } from "./auth";

interface RobloxItemDetails {
  TargetId: number;
  ProductType: string;
  AssetId: number;
  ProductId: number;
  Name: string;
  Description: string;
  AssetTypeId: number;
  Creator: {
    Id: number;
    Name: string;
  };
  PriceInRobux: number;
}

async function retryFetch(url: string, maxRetries = 3): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.roblox.com/',
          'Origin': 'https://www.roblox.com'
        }
      });
      if (response.ok) {
        return response;
      }
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i + 1) * 1000));
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i + 1) * 1000));
    }
  }
  throw new Error(`Failed after ${maxRetries} attempts`);
}

async function getRobloxItemDetails(itemId: string, tags: string[] = [], keywords: string[] = []) {
  try {
    console.log('Fetching item details for ID:', itemId);
    const detailsResponse = await retryFetch(`https://economy.roblox.com/v2/assets/${itemId}/details`);

    if (!detailsResponse.ok) {
      throw new Error(`Failed to fetch item details: ${detailsResponse.statusText}`);
    }

    const details = await detailsResponse.json();
    console.log('Fetched item details:', details);

    return {
      name: details.Name || `Item ${itemId}`,
      description: details.Description || `Roblox item ${itemId}`,
      robloxId: itemId,
      price: details.PriceInRobux || 0,
      type: details.AssetTypeId === 12 ? "Pants" : "Shirt",
      tags: tags,
      keywords: keywords
    };
  } catch (error) {
    console.error('Error getting Roblox item details:', error);
    throw new Error('Failed to get item details: ' + (error as Error).message);
  }
}

async function fetchRobloxImageNew(assetId: string): Promise<Buffer | null> {
  try {
    console.log(`Fetching thumbnail for asset ${assetId}`);
    const thumbnailResponse = await fetch(
      `https://thumbnails.roblox.com/v1/assets?assetIds=${assetId}&size=420x420&format=Png`, 
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.roblox.com/',
          'Origin': 'https://www.roblox.com'
        }
      }
    );

    if (!thumbnailResponse.ok) {
      console.error(`Thumbnail API responded with status: ${thumbnailResponse.status}`);
      return null;
    }

    const thumbnailData = await thumbnailResponse.json();
    const imageUrl = thumbnailData?.data?.[0]?.imageUrl;

    if (!imageUrl) {
      console.error('No image URL found in thumbnail response');
      return null;
    }

    console.log('Found image URL:', imageUrl);
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'Accept': 'image/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.roblox.com/',
        'Origin': 'https://www.roblox.com'
      }
    });

    if (!imageResponse.ok) {
      console.error(`Failed to fetch image from URL: ${imageUrl}`);
      return null;
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error fetching Roblox image:', error);
    return null;
  }
}

export function registerRoutes(app: Express): Server {
  const { requireAuth } = setupAuth(app);

  app.post("/api/items", requireAuth, async (req, res) => {
    try {
      const { id, tags = [], keywords = [] } = req.body;
      if (!id) {
        return res.status(400).json({ message: "Item ID is required" });
      }

      console.log('Processing item ID:', id);
      const itemData = await getRobloxItemDetails(id, tags, keywords);
      const itemWithSeller = {
        ...itemData,
        sellerId: req.user!.id
      };

      const item = await storage.addClothingItem(itemWithSeller);
      res.status(201).json(item);
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/items", async (req, res) => {
    const { search, tags, type, sortBy, sortOrder } = req.query;

    try {
      console.log('Query params:', { search, tags, type, sortBy, sortOrder });

      if (search) {
        const items = await storage.searchClothingItems(search as string);
        return res.json(items);
      }

      if (tags || type) {
        let parsedTags;
        try {
          parsedTags = tags ? JSON.parse(tags as string) : undefined;
        } catch (e) {
          console.error('Error parsing tags:', e);
          parsedTags = undefined;
        }

        const items = await storage.filterClothingItems(
          type as string | undefined,
          parsedTags
        );
        return res.json(items);
      }

      const sort = sortBy ? {
        by: sortBy as 'price' | 'likesCount' | 'createdAt' | 'popularity',
        order: (sortOrder as 'asc' | 'desc') || 'desc'
      } : undefined;

      const items = await storage.getAllClothingItems(sort);
      res.json(items);
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get("/api/items/:id", async (req, res) => {
    try {
      const item = await storage.getClothingItem(parseInt(req.params.id));
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error('Error fetching item:', error);
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  app.get("/api/roblox-image/:assetId", async (req, res) => {
    const { assetId } = req.params;

    try {
      console.log(`Fetching Roblox image for asset ${assetId}`);
      const imageBuffer = await fetchRobloxImageNew(assetId);

      if (!imageBuffer) {
        console.error(`Failed to fetch image for asset ${assetId}`);
        return res.status(404).send('Image not found');
      }

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400'); 
      res.send(imageBuffer);
    } catch (error) {
      console.error('Error proxying Roblox image:', error);
      res.status(500).send('Error fetching image');
    }
  });

  app.patch("/api/profile", requireAuth, async (req, res) => {
    try {
      const updatedUser = await storage.updateUserProfile(req.user!.id, req.body);
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;

      // Get total likes and items count
      const [totalLikes, itemsCount] = await Promise.all([
        storage.getSellerTotalLikes(user.id),
        storage.getSellerItemsCount(user.id)
      ]);

      res.json({ ...userWithoutPassword, totalLikes, itemsCount });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/items/:id/like", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      if (req.user) {
        await storage.likeItem(itemId, req.user.id);
      } else {
        const ipAddress = req.ip;
        await storage.likeItem(itemId, undefined, ipAddress);
      }
      res.sendStatus(200);
    } catch (error) {
      console.error('Error liking item:', error);
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/items/:id/like", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      if (req.user) {
        await storage.unlikeItem(itemId, req.user.id);
      } else {
        const ipAddress = req.ip;
        await storage.unlikeItem(itemId, undefined, ipAddress);
      }
      res.sendStatus(200);
    } catch (error) {
      console.error('Error unliking item:', error);
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/users/me/likes", async (req, res) => {
    try {
      let likedItems;
      if (req.user) {
        likedItems = await storage.getUserLikedItems({ userId: req.user.id });
      } else {
        likedItems = await storage.getUserLikedItems({ ipAddress: req.ip });
      }
      res.json(likedItems);
    } catch (error) {
      console.error('Error fetching liked items:', error);
      res.status(500).json({ message: "Failed to fetch liked items" });
    }
  });

  app.get("/api/sellers", async (req, res) => {
    try {
      const sellers = await storage.getAllSellers();
      res.json(sellers);
    } catch (error) {
      console.error('Error fetching sellers:', error);
      res.status(500).json({ message: "Failed to fetch sellers" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}