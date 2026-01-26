import { CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ThankYou() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <Card className="max-w-md w-full bg-slate-800/50 border-slate-700">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">
            Thank You!
          </h1>
          
          <p className="text-slate-300 text-lg leading-relaxed">
            Your response has been noted. Please await further instructions via email.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
