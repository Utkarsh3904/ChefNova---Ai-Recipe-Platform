import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, Flame } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const { has } = await auth();
  const subscriptionTier = has({ plan: "pro" }) ? "pro" : "free";
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* herosection */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
            <div className="flex-1 text-center md:text-left ">
              <Badge
                varient="outline"
                className=" border-2 border-orange-600 text-orange-700 bg-orange-50 text-sm font-bold mb-6 uppercase tracking-wide"
              >
                <Flame className="mr-1" />
                #1 AI Cooking Assistant
              </Badge>

              <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-[0,9] tracking-tight">
                Turn your{" "}
                <span className="italic underline decoration-4 decoration-orange-600 ">
                  leftovers
                </span>{" "}
                into <br />
                masterpieces
              </h1>

              <p className="text-xl md:text-2xl text-stone-600 mb-10 max-w-lg mx-auto md:mx-0 font-light">
                Snap a photo of your fridge. We&apos;ll tell you what to cook.
                Save money, reduce waste, and eat better tonight.
              </p>

              <Link href={"/dashboard"}>
                <Button
                  size="xl"
                  variant="primary"
                  className="px-8 py-6 text-lg"
                >
                  Start Cooking Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>

              <p className="mt-6 text-sm text-stone-500">
                <span className="font-bold text-stone-900">10k+ cooks</span>{" "}
                joined last month
              </p>
            </div>  

              <Card
                className={
                  "relative aspect-square md:aspect-4/5 border-4 border-stone-900 bg-stone-200 overflow-hidden py-0"
                }>
                  <Image
                  src="/dishimage.png"
                  alt="delicious pasta dish"
                  width ={500}
                  height = {500}
                  className="w-full h-full object-cover"
                  />
              </Card>
            </div>
          </div>
      </section>
    </div>
  );
}
