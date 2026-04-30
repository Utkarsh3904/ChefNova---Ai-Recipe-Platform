export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-stone-900 mb-2">404</h1>
        <p className="text-stone-600">Page not found</p>
      </div>
    </div>
  );
}