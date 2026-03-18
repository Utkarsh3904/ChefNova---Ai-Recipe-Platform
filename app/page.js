import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <section className="pt-32 pb-20 px-4">
        <div>
          <Button variant="primary" size="lg">
            Destructive
          </Button>
        </div>
      </section>
    </div>
  );
}
