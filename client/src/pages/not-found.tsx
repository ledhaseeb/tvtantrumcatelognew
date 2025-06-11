import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import AdContainer from "@/components/AdContainer";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 px-4">
      {/* Top Ad Container */}
      <div className="mb-8">
        <AdContainer size="leaderboard" className="mx-auto" />
      </div>

      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>

      {/* Bottom Ad Container */}
      <div className="mt-8">
        <AdContainer size="rectangle" className="mx-auto" />
      </div>
    </div>
  );
}
