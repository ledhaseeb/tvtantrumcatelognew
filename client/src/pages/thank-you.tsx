import { useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function ThankYou() {
  const [isConfirming, setIsConfirming] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const paymentIntent = searchParams.get('payment_intent');
    
    if (paymentIntent) {
      apiRequest('POST', '/api/stripe/confirm-payment', { paymentIntentId: paymentIntent })
        .then(() => {
          setConfirmed(true);
          queryClient.invalidateQueries({ queryKey: ['/api/stripe/spots-remaining'] });
        })
        .catch((err) => {
          console.error('Error confirming payment:', err);
        })
        .finally(() => {
          setIsConfirming(false);
        });
    } else {
      setIsConfirming(false);
    }
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <Card className="max-w-md w-full bg-slate-800/50 border-slate-700">
        <CardContent className="pt-8 pb-8 text-center">
          {isConfirming ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Confirming Your Order...
              </h1>
              <p className="text-slate-300 text-lg leading-relaxed">
                Please wait while we confirm your payment.
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-4">
                Thank You!
              </h1>
              
              <p className="text-slate-300 text-lg leading-relaxed mb-4">
                Your pre-order is confirmed! You're now a founding member of KidSafeTV.
              </p>
              
              <p className="text-slate-400 text-sm">
                We'll send you an email with next steps when the beta is ready.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
