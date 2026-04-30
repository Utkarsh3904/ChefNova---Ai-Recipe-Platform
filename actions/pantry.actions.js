"use server";

import { checkUser } from "@/lib/checkUser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import sql from "@/lib/db";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Scan image with Gemini Vision
export async function scanPantryImage(formData) {
  try {
    const user = await checkUser();
    if (!user) throw new Error("User not authenticated");

    const imageFile = formData.get("image");
    if (!imageFile) throw new Error("No image provided");

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are a professional chef and ingredient recognition expert. Analyze this image of a pantry/fridge and identify all visible food ingredients.

Return ONLY a valid JSON array with this exact structure (no markdown, no explanations):
[
  {
    "name": "ingredient name",
    "quantity": "estimated quantity with unit",
    "confidence": 0.95
  }
]

Rules:
- Only identify food ingredients (not containers, utensils, or packaging)
- Be specific (e.g., "Cheddar Cheese" not just "Cheese")
- Estimate realistic quantities (e.g., "3 eggs", "1 cup milk", "2 tomatoes")
- Confidence should be 0.7-1.0 (omit items below 0.7)
- Maximum 20 items
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: imageFile.type,
          data: base64Image,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    let ingredients;
    try {
      const cleanText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      ingredients = JSON.parse(cleanText);
    } catch {
      throw new Error("Failed to parse ingredients. Please try again.");
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      throw new Error("No ingredients detected. Please try a clearer photo.");
    }

    return {
      success: true,
      ingredients: ingredients.slice(0, 20),
      message: `Found ${ingredients.length} ingredients!`,
    };
  } catch (error) {
    console.error("Error scanning pantry:", error);
    throw new Error(error.message || "Failed to scan image");
  }
}

// Save scanned ingredients to pantry
export async function saveToPantry(formData) {
  try {
    const user = await checkUser();
    if (!user) throw new Error("User not authenticated");

    const ingredientsJson = formData.get("ingredients");
    const ingredients = JSON.parse(ingredientsJson);

    if (!ingredients || ingredients.length === 0) {
      throw new Error("No ingredients to save");
    }

    for (const ingredient of ingredients) {
      await sql`
        INSERT INTO pantry_items (name, quantity, owner_id)
        VALUES (${ingredient.name}, ${ingredient.quantity}, ${user.id})
      `;
    }

    return {
      success: true,
      message: `Saved ${ingredients.length} items to your pantry!`,
    };
  } catch (error) {
    console.error("Error saving to pantry:", error);
    throw new Error(error.message || "Failed to save items");
  }
}

// Add pantry item manually
export async function addPantryItemManually(formData) {
  try {
    const user = await checkUser();
    if (!user) throw new Error("User not authenticated");

    const name = formData.get("name");
    const quantity = formData.get("quantity");

    if (!name || !quantity) throw new Error("Name and quantity are required");

    const result = await sql`
      INSERT INTO pantry_items (name, quantity, owner_id)
      VALUES (${name.trim()}, ${quantity.trim()}, ${user.id})
      RETURNING *
    `;

    return {
      success: true,
      item: result[0],
      message: "Item added successfully!",
    };
  } catch (error) {
    console.error("Error adding item manually:", error);
    throw new Error(error.message || "Failed to add item");
  }
}

// Get user's pantry items
export async function getPantryItems() {
  try {
    const user = await checkUser();
    if (!user) throw new Error("User not authenticated");

    const items = await sql`
      SELECT * FROM pantry_items
      WHERE owner_id = ${user.id}
      ORDER BY created_at DESC
    `;

    return {
      success: true,
      items,
      scansLimit: user.subscriptionTier === "pro" ? "unlimited" : 10,
    };
  } catch (error) {
    console.error("Error fetching pantry:", error);
    throw new Error(error.message || "Failed to load pantry");
  }
}

// Delete pantry item
export async function deletePantryItem(formData) {
  try {
    const user = await checkUser();
    if (!user) throw new Error("User not authenticated");

    const itemId = formData.get("itemId");

    await sql`
      DELETE FROM pantry_items
      WHERE id = ${itemId} AND owner_id = ${user.id}
    `;

    return { success: true, message: "Item removed from pantry" };
  } catch (error) {
    console.error("Error deleting item:", error);
    throw new Error(error.message || "Failed to delete item");
  }
}

// Update pantry item
export async function updatePantryItem(formData) {
  try {
    const user = await checkUser();
    if (!user) throw new Error("User not authenticated");

    const itemId = formData.get("itemId");
    const name = formData.get("name");
    const quantity = formData.get("quantity");

    const result = await sql`
      UPDATE pantry_items
      SET name = ${name}, quantity = ${quantity}, updated_at = NOW()
      WHERE id = ${itemId} AND owner_id = ${user.id}
      RETURNING *
    `;

    return {
      success: true,
      item: result[0],
      message: "Item updated successfully",
    };
  } catch (error) {
    console.error("Error updating item:", error);
    throw new Error(error.message || "Failed to update item");
  }
}