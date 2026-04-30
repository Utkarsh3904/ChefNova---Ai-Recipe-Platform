/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Clock, Users, ChefHat, Flame, Lightbulb,
  Bookmark, BookmarkCheck, Loader2, AlertCircle, CheckCircle2, Download,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useFetch from "@/hooks/use-fetch";
import {
  getOrGenerateRecipe,
  saveRecipeToCollection,
  removeRecipeFromCollection,
} from "@/actions/recipe.actions";
import { toast } from "sonner";
import Image from "next/image";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { RecipePDF } from "@/components/RecipePDF";
import { ClockLoader } from "react-spinners";
import ProLockedSection from "@/components/ProLockedSection";

function RecipeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const recipeName = searchParams.get("cook");

  const [recipe, setRecipe] = useState(null);
  const [recipeId, setRecipeId] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const { loading: loadingRecipe, data: recipeData, fn: fetchRecipe } = useFetch(getOrGenerateRecipe);
  const { loading: saving, data: saveData, fn: saveToCollection } = useFetch(saveRecipeToCollection);
  const { loading: removing, data: removeData, fn: removeFromCollection } = useFetch(removeRecipeFromCollection);

  useEffect(() => {
    if (recipeName && !recipe) {
      const formData = new FormData();
      formData.append("recipeName", recipeName);
      fetchRecipe(formData);
    }
  }, [recipeName]);

  useEffect(() => {
    if (recipeData?.success) {
      setRecipe(recipeData.recipe);
      setRecipeId(recipeData.recipeId);
      setIsSaved(recipeData.isSaved);
      if (recipeData.fromDatabase) {
        toast.success("Recipe loaded!");
      } else {
        toast.success("New recipe generated!");
      }
    }
  }, [recipeData]);

  useEffect(() => {
    if (saveData?.success) {
      if (saveData.alreadySaved) {
        toast.info("Recipe already in your collection");
      } else {
        setIsSaved(true);
        toast.success("Recipe saved to your collection!");
      }
    }
  }, [saveData]);

  useEffect(() => {
    if (removeData?.success) {
      setIsSaved(false);
      toast.success("Recipe removed from collection");
    }
  }, [removeData]);

  const handleToggleSave = async () => {
    if (!recipeId) return;
    const formData = new FormData();
    formData.append("recipeId", recipeId);
    if (isSaved) {
      await removeFromCollection(formData);
    } else {
      await saveToCollection(formData);
    }
  };

  if (!recipeName) {
    return (
      <div className="min-h-screen bg-stone-50 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center py-20">
          <AlertCircle className="w-16 h-16 text-orange-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-stone-900 mb-2">No recipe specified</h2>
          <p className="text-stone-600 mb-6">Please select a recipe from the dashboard</p>
          <Link href="/dashboard">
            <Button className="bg-orange-600 hover:bg-orange-700">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loadingRecipe === null || loadingRecipe) {
    return (
      <div className="min-h-screen bg-stone-50 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center py-20">
          <ClockLoader className="mx-auto mb-6" color="#dc6300" />
          <h2 className="text-3xl font-bold text-stone-900 mb-2 tracking-tight">
            Preparing Your Recipe
          </h2>
          <p className="text-stone-600 font-light">
            Our AI chef is crafting instructions for{" "}
            <span className="font-bold text-orange-600">{recipeName}</span>...
          </p>
        </div>
      </div>
    );
  }

  if (loadingRecipe === false && !recipe) {
    return (
      <div className="min-h-screen bg-stone-50 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center py-20">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Failed to load recipe</h2>
          <p className="text-stone-600 mb-6">Something went wrong. Please try again.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
            </Button>
            <Button onClick={() => window.location.reload()} className="bg-orange-600 hover:bg-orange-700">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-stone-600 hover:text-orange-600 transition-colors mb-6 font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <div className="bg-white p-8 md:p-10 border-2 border-stone-200 mb-6">
            {recipe.imageUrl && (
              <div className="relative w-full h-72 overflow-hidden mb-7">
                <Image
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                  priority
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="text-orange-600 border-2 border-orange-200 capitalize">
                {recipe.cuisine}
              </Badge>
              <Badge variant="outline" className="text-stone-600 border-2 border-stone-200 capitalize">
                {recipe.category}
              </Badge>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4 tracking-tight">
              {recipe.title}
            </h1>

            <p className="text-lg text-stone-600 mb-6 font-light">{recipe.description}</p>

            <div className="flex flex-wrap gap-6 text-stone-600 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="font-medium">
                  {parseInt(recipe.prepTime || 0) + parseInt(recipe.cookTime || 0)} mins total
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" />
                <span className="font-medium">{recipe.servings} servings</span>
              </div>
              {recipe.nutrition?.calories && (
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-600" />
                  <span className="font-medium">{recipe.nutrition.calories}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleToggleSave}
                disabled={saving || removing}
                className={`${
                  isSaved
                    ? "bg-green-600 hover:bg-green-700 border-2 border-green-700"
                    : "bg-orange-600 hover:bg-orange-700 border-2 border-orange-700"
                } text-white gap-2`}
              >
                {saving || removing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{saving ? "Saving..." : "Removing..."}</>
                ) : isSaved ? (
                  <><BookmarkCheck className="w-4 h-4" />Saved to Collection</>
                ) : (
                  <><Bookmark className="w-4 h-4" />Save to Collection</>
                )}
              </Button>
              <PDFDownloadLink
                document={<RecipePDF recipe={recipe} />}
                fileName={`${recipe.title.replace(/\s+/g, "-").toLowerCase()}.pdf`}
              >
                {({ loading }) => (
                  <Button
                    variant="outline"
                    className="border-2 border-orange-600 text-orange-700 hover:bg-orange-50 gap-2"
                    disabled={loading}
                  >
                    <Download className="w-4 h-4" />
                    {loading ? "Preparing PDF..." : "Download PDF"}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Ingredients */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 border-2 border-stone-200 lg:sticky lg:top-24">
              <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-2">
                <ChefHat className="w-6 h-6 text-orange-600" /> Ingredients
              </h2>

              {Object.entries(
                (recipe.ingredients || []).reduce((acc, ing) => {
                  const cat = ing.category || "Other";
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(ing);
                  return acc;
                }, {})
              ).map(([category, items]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wide mb-3">
                    {category}
                  </h3>
                  <ul className="space-y-2">
                    {items.map((ingredient, i) => (
                      <li key={i} className="flex justify-between items-start gap-3 text-stone-700 py-2 border-b border-stone-100 last:border-0">
                        <span className="flex-1 break-words">{ingredient.item}</span>
                        <span className="font-bold text-orange-600 text-sm break-words text-right max-w-[120px]">
                          {ingredient.amount}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {recipe.nutrition && (
                <div className="mt-6 pt-6 border-t-2 border-stone-200">
                  <h3 className="font-bold text-stone-900 mb-3 uppercase tracking-wide text-sm flex items-center gap-2">
                    Nutrition (per serving)
                    {!recipeData?.isPro && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">PRO</span>
                    )}
                  </h3>
                  <ProLockedSection isPro={recipeData?.isPro} lockText="Nutrition info is Pro-only">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Calories", val: recipe.nutrition.calories },
                        { label: "Protein", val: recipe.nutrition.protein },
                        { label: "Carbs", val: recipe.nutrition.carbs },
                        { label: "Fat", val: recipe.nutrition.fat },
                      ].map(({ label, val }) => (
                        <div key={label} className="bg-stone-50 p-3 text-center border-2 border-stone-100">
                          <div className="text-xl font-bold text-stone-900">{val}</div>
                          <div className="text-xs text-stone-500 font-bold uppercase tracking-wide">{label}</div>
                        </div>
                      ))}
                    </div>
                  </ProLockedSection>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 border-2 border-stone-200">
              <h2 className="text-2xl font-bold text-stone-900 mb-6">Step-by-Step Instructions</h2>
              <div>
                {(recipe.instructions || []).map((step, index) => (
                  <div
                    key={step.step}
                    className={`relative pl-12 pb-8 ${
                      index !== recipe.instructions.length - 1
                        ? "border-l-2 border-orange-300 ml-5"
                        : "ml-5"
                    }`}
                  >
                    <div className="absolute -left-5 top-0 w-10 h-10 bg-orange-600 text-white flex items-center justify-center font-bold border-2 border-orange-700">
                      {step.step}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-stone-900 mb-2">{step.title}</h3>
                      <p className="text-stone-700 font-light mb-3">{step.instruction}</p>
                      {step.tip && (
                        <div className="bg-orange-50 border-l-4 border-orange-600 p-4">
                          <p className="text-sm text-orange-900 flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0 fill-orange-600" />
                            <span><strong className="font-bold">Pro Tip:</strong> {step.tip}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-green-900 mb-1">You&apos;re all done!</h3>
                    <p className="text-sm text-green-800 font-light">
                      Plate your masterpiece and enjoy your delicious {recipe.title}!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {recipe.tips && recipe.tips.length > 0 && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-8 border-2 border-orange-200">
                <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-orange-600 fill-orange-600" />
                  Chef&apos;s Tips & Tricks
                  {!recipeData?.isPro && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">PRO</span>
                  )}
                </h2>
                <ProLockedSection isPro={recipeData?.isPro} lockText="Chef tips are Pro-only" ctaText="Unlock Pro Tips →">
                  <ul className="space-y-3">
                    {recipe.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-3 text-stone-700">
                        <CheckCircle2 className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <span className="font-light">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </ProLockedSection>
              </div>
            )}

            {recipe.substitutions && recipe.substitutions.length > 0 && (
              <div className="bg-white p-8 border-2 border-stone-200">
                <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-2">
                  Ingredient Substitutions
                  {!recipeData?.isPro && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">PRO</span>
                  )}
                </h2>
                <p className="text-stone-600 mb-6 text-sm font-light">
                  Don&apos;t have everything? Here are some alternatives:
                </p>
                <ProLockedSection isPro={recipeData?.isPro} lockText="Substitutions are Pro-only">
                  <div className="space-y-4">
                    {recipe.substitutions.map((sub, i) => (
                      <div key={i} className="border-b-2 border-stone-100 pb-4 last:border-0 last:pb-0">
                        <h3 className="font-bold text-stone-900 mb-2">
                          Instead of <span className="text-orange-600">{sub.original}</span>:
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {sub.alternatives.map((alt, j) => (
                            <Badge key={j} variant="outline" className="text-stone-600 border-2 border-stone-200">
                              {alt}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ProLockedSection>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecipePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-4xl text-center py-20">
            <Loader2 className="w-16 h-16 text-orange-600 animate-spin mx-auto mb-6" />
            <p className="text-stone-600">Loading recipe...</p>
          </div>
        </div>
      }
    >
      <RecipeContent />
    </Suspense>
  );
}