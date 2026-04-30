"use server";

import { checkUser } from "@/lib/checkUser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import sql from "@/lib/db";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

function normalizeTitle(title) {
  return title
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

async function fetchRecipeImage(recipeName) {
  try {
    if (!UNSPLASH_ACCESS_KEY) return "";

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        recipeName
      )}&per_page=1&orientation=landscape`,
      {
        headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
      }
    );

    if (!response.ok) return "";
    const data = await response.json();
    return data.results?.[0]?.urls?.regular || "";
  } catch {
    return "";
  }
}

// Get or generate recipe
export async function getOrGenerateRecipe(formData) {
  try {
    const user = await checkUser();
    if (!user) throw new Error("User not authenticated");

    const recipeName = formData.get("recipeName");
    if (!recipeName) throw new Error("Recipe name is required");

    const normalizedTitle = normalizeTitle(recipeName);
    const isPro = user.subscriptionTier === "pro";

    // Check if recipe exists in DB
    const existing = await sql`
      SELECT * FROM recipes WHERE LOWER(title) = LOWER(${normalizedTitle})
    `;

    if (existing.length > 0) {
      const recipe = existing[0];

      // Check if saved
      const saved = await sql`
        SELECT id FROM saved_recipes WHERE user_id = ${user.id} AND recipe_id = ${recipe.id}
      `;

      return {
        success: true,
        recipe: {
          ...recipe,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          nutrition: recipe.nutrition,
          tips: recipe.tips,
          substitutions: recipe.substitutions,
          prepTime: recipe.prep_time,
          cookTime: recipe.cook_time,
          imageUrl: recipe.image_url,
          isPublic: recipe.is_public,
        },
        recipeId: recipe.id,
        isSaved: saved.length > 0,
        fromDatabase: true,
        isPro,
        message: "Recipe loaded from database",
      };
    }

    // Generate with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are a professional chef and recipe expert. Generate a detailed recipe for: "${normalizedTitle}"

CRITICAL: The "title" field MUST be EXACTLY: "${normalizedTitle}"

Return ONLY a valid JSON object with this exact structure (no markdown, no explanations):
{
  "title": "${normalizedTitle}",
  "description": "Brief 2-3 sentence description",
  "category": "breakfast|lunch|dinner|snack|dessert",
  "cuisine": "italian|chinese|mexican|indian|american|thai|japanese|mediterranean|french|korean|vietnamese|spanish|greek|turkish|moroccan|brazilian|caribbean|middle-eastern|british|german|portuguese|other",
  "prepTime": 20,
  "cookTime": 30,
  "servings": 4,
  "ingredients": [
    { "item": "ingredient name", "amount": "quantity with unit", "category": "Protein|Vegetable|Spice|Dairy|Grain|Other" }
  ],
  "instructions": [
    { "step": 1, "title": "Step title", "instruction": "Detailed instruction", "tip": "Optional tip or null" }
  ],
  "nutrition": {
    "calories": "420 cal",
    "protein": "32g",
    "carbs": "18g",
    "fat": "26g"
  },
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "substitutions": [
    { "original": "ingredient", "alternatives": ["sub1", "sub2"] }
  ]
}

Guidelines:
- prepTime and cookTime should be numbers only (not strings)
- servings should be a number
- Include 6-10 detailed steps
- Make instructions beginner-friendly
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let recipeData;
    try {
      const cleanText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      recipeData = JSON.parse(cleanText);
    } catch {
      throw new Error("Failed to generate recipe. Please try again.");
    }

    recipeData.title = normalizedTitle;

    const validCategories = ["breakfast", "lunch", "dinner", "snack", "dessert"];
    const category = validCategories.includes(recipeData.category?.toLowerCase())
      ? recipeData.category.toLowerCase()
      : "dinner";

    const validCuisines = [
      "italian", "chinese", "mexican", "indian", "american", "thai", "japanese",
      "mediterranean", "french", "korean", "vietnamese", "spanish", "greek",
      "turkish", "moroccan", "brazilian", "caribbean", "middle-eastern",
      "british", "german", "portuguese", "other",
    ];
    const cuisine = validCuisines.includes(recipeData.cuisine?.toLowerCase())
      ? recipeData.cuisine.toLowerCase()
      : "other";

    const imageUrl = await fetchRecipeImage(normalizedTitle);

    // Save to DB
    const created = await sql`
      INSERT INTO recipes (
        title, description, cuisine, category,
        ingredients, instructions, prep_time, cook_time, servings,
        nutrition, tips, substitutions, image_url, is_public, author_id
      ) VALUES (
        ${normalizedTitle}, ${recipeData.description}, ${cuisine}, ${category},
        ${JSON.stringify(recipeData.ingredients)}, ${JSON.stringify(recipeData.instructions)},
        ${Number(recipeData.prepTime)}, ${Number(recipeData.cookTime)}, ${Number(recipeData.servings)},
        ${JSON.stringify(recipeData.nutrition)}, ${JSON.stringify(recipeData.tips)},
        ${JSON.stringify(recipeData.substitutions)}, ${imageUrl || ""}, true, ${user.id}
      )
      RETURNING *
    `;

    return {
      success: true,
      recipe: {
        ...recipeData,
        title: normalizedTitle,
        category,
        cuisine,
        imageUrl: imageUrl || "",
      },
      recipeId: created[0].id,
      isSaved: false,
      fromDatabase: false,
      isPro,
      message: "Recipe generated successfully!",
    };
  } catch (error) {
    console.error("Error in getOrGenerateRecipe:", error);
    throw new Error(error.message || "Failed to load recipe");
  }
}

// Save recipe to user collection
export async function saveRecipeToCollection(formData) {
  try {
    const user = await checkUser();
    if (!user) throw new Error("User not authenticated");

    const recipeId = formData.get("recipeId");
    if (!recipeId) throw new Error("Recipe ID is required");

    // Check if already saved
    const existing = await sql`
      SELECT id FROM saved_recipes WHERE user_id = ${user.id} AND recipe_id = ${recipeId}
    `;

    if (existing.length > 0) {
      return { success: true, alreadySaved: true, message: "Recipe already in collection" };
    }

    await sql`
      INSERT INTO saved_recipes (user_id, recipe_id) VALUES (${user.id}, ${recipeId})
    `;

    return { success: true, alreadySaved: false, message: "Recipe saved to your collection!" };
  } catch (error) {
    console.error("Error saving recipe:", error);
    throw new Error(error.message || "Failed to save recipe");
  }
}

// Remove recipe from collection
export async function removeRecipeFromCollection(formData) {
  try {
    const user = await checkUser();
    if (!user) throw new Error("User not authenticated");

    const recipeId = formData.get("recipeId");
    if (!recipeId) throw new Error("Recipe ID is required");

    await sql`
      DELETE FROM saved_recipes WHERE user_id = ${user.id} AND recipe_id = ${recipeId}
    `;

    return { success: true, message: "Recipe removed from collection" };
  } catch (error) {
    console.error("Error removing recipe:", error);
    throw new Error(error.message || "Failed to remove recipe");
  }
}

// Get recipes based on pantry ingredients
export async function getRecipesByPantryIngredients() {
  try {
    const user = await checkUser();
    if (!user) throw new Error("User not authenticated");

    const pantryItems = await sql`
      SELECT name FROM pantry_items WHERE owner_id = ${user.id}
    `;

    if (pantryItems.length === 0) {
      return { success: false, message: "Your pantry is empty. Add ingredients first!" };
    }

    const ingredients = pantryItems.map((item) => item.name).join(", ");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are a professional chef. Given these available ingredients: ${ingredients}

Suggest 5 recipes that can be made primarily with these ingredients. It's okay if recipes need 1-2 common pantry staples.

Return ONLY a valid JSON array (no markdown, no explanations):
[
  {
    "title": "Recipe name",
    "description": "Brief 1-2 sentence description",
    "matchPercentage": 85,
    "missingIngredients": ["ingredient1"],
    "category": "breakfast|lunch|dinner|snack|dessert",
    "cuisine": "italian|indian|etc",
    "prepTime": 20,
    "cookTime": 30,
    "servings": 4
  }
]

Rules:
- matchPercentage: 70-100%
- missingIngredients: common items only
- Sort by matchPercentage descending
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let recipeSuggestions;
    try {
      const cleanText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      recipeSuggestions = JSON.parse(cleanText);
    } catch {
      throw new Error("Failed to generate recipe suggestions. Please try again.");
    }

    return {
      success: true,
      recipes: recipeSuggestions,
      ingredientsUsed: ingredients,
      recommendationsLimit: user.subscriptionTier === "pro" ? "unlimited" : 5,
      message: `Found ${recipeSuggestions.length} recipes you can make!`,
    };
  } catch (error) {
    console.error("Error in getRecipesByPantryIngredients:", error);
    throw new Error(error.message || "Failed to get recipe suggestions");
  }
}

// Get saved recipes
export async function getSavedRecipes() {
  try {
    const user = await checkUser();
    if (!user) throw new Error("User not authenticated");

    const recipes = await sql`
      SELECT r.* FROM recipes r
      INNER JOIN saved_recipes sr ON r.id = sr.recipe_id
      WHERE sr.user_id = ${user.id}
      ORDER BY sr.saved_at DESC
    `;

    const formatted = recipes.map((r) => ({
      ...r,
      prepTime: r.prep_time,
      cookTime: r.cook_time,
      imageUrl: r.image_url,
    }));

    return { success: true, recipes: formatted, count: formatted.length };
  } catch (error) {
    console.error("Error fetching saved recipes:", error);
    throw new Error(error.message || "Failed to load saved recipes");
  }
}