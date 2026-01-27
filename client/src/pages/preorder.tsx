import { useState, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  Check, 
  Loader2, 
  Clock, 
  Users, 
  BarChart3, 
  Play, 
  Zap,
  Moon,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  Heart
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import sessionPreviewImg from "@assets/Screenshot_2026-01-27_at_11.57.33_1769515057013.png";
import analyticsImg from "@assets/Screenshot_2026-01-27_at_11.59.27_1769515170535.png";
import sessionStartImg from "@assets/Screenshot_2026-01-27_at_12.05.04_1769515506837.png";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

function CheckoutModal({ 
  isOpen, 
  onClose,
  spotsRemaining 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  spotsRemaining: number;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      setClientSecret(data.clientSecret);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm mb-4">
              <Sparkles className="w-4 h-4" />
              Only {spotsRemaining} spots left
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {clientSecret ? "Complete Your Pre-order" : "Secure Your Spot"}
            </h2>
            <p className="text-slate-400">
              {clientSecret 
                ? "Enter your payment details below"
                : "Join the 1,000 user beta trial"
              }
            </p>
          </div>

          {!clientSecret ? (
            <form onSubmit={handleStartCheckout} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">Name (optional)</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-slate-400 line-through text-lg">$100</span>
                  <span className="text-3xl font-bold text-white">$40</span>
                  <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">60% OFF</span>
                </div>
                <p className="text-slate-400 text-sm">Lifetime access - One-time payment</p>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-800 hover:to-teal-700 text-white py-6 text-lg font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Continue to Payment"
                )}
              </Button>
            </form>
          ) : (
            <Elements 
              stripe={stripePromise} 
              options={{ 
                clientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#3b82f6',
                    colorBackground: '#334155',
                    colorText: '#f1f5f9',
                    colorDanger: '#ef4444',
                    borderRadius: '8px',
                  },
                },
              }}
            >
              <CheckoutForm clientSecret={clientSecret} />
            </Elements>
          )}

          <p className="text-xs text-slate-500 text-center mt-4">
            Secure payment powered by Stripe. Your payment information is encrypted and secure.
          </p>
        </div>
      </div>
    </div>
  );
}

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/thank-you`,
      },
    });

    if (submitError) {
      setError(submitError.message || "An unexpected error occurred.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-6 text-lg font-semibold"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          "Complete Pre-order - $40"
        )}
      </Button>
    </form>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-slate-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left"
      >
        <span className="text-white font-medium pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <p className="pb-4 text-slate-400 leading-relaxed">{answer}</p>
      )}
    </div>
  );
}

export default function Preorder() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const checkoutRef = useRef<HTMLDivElement>(null);

  const { data: spotsData } = useQuery<{ remaining: number; total: number }>({
    queryKey: ['/api/stripe/spots-remaining'],
  });

  const spotsRemaining = spotsData?.remaining ?? 1000;

  const features = [
    {
      icon: Shield,
      title: "TV Tantrum Rated",
      description: "Parent approved, we work together to find healthy shows kids enjoy."
    },
    {
      icon: Zap,
      title: "Overstimulation prevention",
      description: "Each show is ranked by stimulation to create balanced playlists."
    },
    {
      icon: Clock,
      title: "Smart Session Limits",
      description: "Set the viewing time you need and leave getting them off to us."
    },
    {
      icon: Moon,
      title: "Wind-Down Mode",
      description: "Sessions end with calming content so kids walk away on their own."
    },
    {
      icon: Users,
      title: "Multiple Child Profiles",
      description: "Personalised content for individuals plus a safe balance for groups."
    },
    {
      icon: BarChart3,
      title: "Behavioral Analytics",
      description: "Helping you get more out of screen time with less of the problems."
    }
  ];

  const faqs = [
    {
      question: "When will I get access?",
      answer: "We're currently in a 100-user beta. The 1,000 user trial (which includes pre-order customers) begins soon after. You'll receive an email invitation when your access is ready."
    },
    {
      question: "What does 'lifetime access' mean?",
      answer: "Your $40 payment covers one full year from our official launch. After that first year, you'll continue at the discounted founding member rate - not the regular $100/year price."
    },
    {
      question: "Can I get a refund?",
      answer: "Yes! If you're not satisfied before our official launch, we'll refund your payment in full. We're confident you'll love it."
    },
    {
      question: "Does it work on TV?",
      answer: "Yes! KidSafeTV currently supports Chromecast, so you can cast directly to your TV. Airplay is on our roadmap."
    },
    {
      question: "How is this different from YouTube Kids?",
      answer: "YouTube Kids uses an algorithm to choose videos. KidSafeTV puts you in control. We offer show recommendations, you choose what you want your kids to see. We build the playlists and use wind-down protocols that YouTube Kids simply doesn't offer."
    }
  ];

  const scrollToCheckout = () => {
    setIsCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-700/10 to-amber-500/10" />
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-full text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Limited to 1,000 Beta Users
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            The end of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-amber-400">
              overstimulation.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
            TV Tantrum powered streaming. Built over YouTube with better controls and wind down protocols
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Button 
              onClick={scrollToCheckout}
              size="lg"
              className="bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-800 hover:to-teal-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg shadow-teal-700/25"
            >
              <Play className="w-5 h-5 mr-2" />
              Pre-order Now - $40
            </Button>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="line-through">$100/year</span>
              <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm font-medium">60% OFF</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800/50 border border-slate-700 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-slate-400">Spots remaining:</span>
            </div>
            <span className="text-2xl font-bold text-white">{spotsRemaining}</span>
            <span className="text-slate-500">/ 1,000</span>
          </div>
        </div>
      
      </section>

      {/* Solution / App Showcase */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Meet KidSafeTV
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              The only streaming service that puts families before watch time.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {/* Screenshot 1 */}
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
              <div className="relative bg-slate-900 rounded-xl overflow-hidden shadow-2xl">
                <img 
                  src={sessionStartImg} 
                  alt="Start viewing session with child selection" 
                  className="w-full h-auto"
                />
              </div>
              <h3 className="text-white font-semibold mt-4 mb-2 text-center">Child Profiles & Session Control</h3>
              <p className="text-slate-400 text-sm text-center">Select the viewer, follow our guidance or set to your requirement.</p>
            </div>

            {/* Screenshot 2 */}
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
              <div className="relative bg-slate-900 rounded-xl overflow-hidden shadow-2xl">
                <img 
                  src={sessionPreviewImg} 
                  alt="Session preview with stimulation levels" 
                  className="w-full h-auto"
                />
              </div>
              <h3 className="text-white font-semibold mt-4 mb-2 text-center">Stimulation-Aware Playlists</h3>
              <p className="text-slate-400 text-sm text-center">Intelligently built, easy to customise and designed to wind down over time.</p>
            </div>

            {/* Screenshot 3 */}
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
              <div className="relative bg-slate-900 rounded-xl overflow-hidden shadow-2xl">
                <img 
                  src={analyticsImg} 
                  alt="Child analytics dashboard" 
                  className="w-full h-auto"
                />
              </div>
              <h3 className="text-white font-semibold mt-4 mb-2 text-center">Watch Time Analytics</h3>
              <p className="text-slate-400 text-sm text-center">Track stimulation exposure, measure behaviour and understand their limits.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Entertain without the cognitive strain
            </h2>
            <p className="text-xl text-slate-400">
              Content that makes a difference
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700 hover:border-teal-500/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500/20 to-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-teal-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Your Journey
            </h2>
            <p className="text-xl text-slate-400">
              Here's what happens after you pre-order
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-500 via-amber-500 to-green-500 transform md:-translate-x-1/2" />

            {/* Timeline items */}
            <div className="space-y-8 md:space-y-12">
              {/* Item 1 - Current */}
              <div className="relative flex items-start gap-6 md:gap-0">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center z-10 md:absolute md:left-1/2 md:transform md:-translate-x-1/2">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                </div>
                <div className="md:w-1/2 md:pr-12 md:text-right">
                  <div className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm mb-2">Now</div>
                  <h3 className="text-xl font-semibold text-white mb-2">100-User Beta</h3>
                  <p className="text-slate-400">We're refining the experience with our first testers. Your pre-order secures your place in line.</p>
                </div>
              </div>

              {/* Item 2 - Coming Soon */}
              <div className="relative flex items-start gap-6 md:gap-0">
                <div className="flex-shrink-0 w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center z-10 md:absolute md:left-1/2 md:transform md:-translate-x-1/2">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div className="md:w-1/2 md:pl-12 md:ml-auto">
                  <div className="inline-block px-3 py-1 bg-teal-500/20 text-teal-400 rounded-full text-sm mb-2">Coming Soon</div>
                  <h3 className="text-xl font-semibold text-white mb-2">1,000-User Trial</h3>
                  <p className="text-slate-400">You'll receive an email invitation to create your account and start using KidSafeTV with your family.</p>
                </div>
              </div>

              {/* Item 3 - Launch */}
              <div className="relative flex items-start gap-6 md:gap-0">
                <div className="flex-shrink-0 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center z-10 md:absolute md:left-1/2 md:transform md:-translate-x-1/2">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="md:w-1/2 md:pr-12 md:text-right">
                  <div className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm mb-2">Launch</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Official Release</h3>
                  <p className="text-slate-400">KidSafeTV launches publicly. Your 1-year subscription officially begins.</p>
                </div>
              </div>

              {/* Item 4 - One Year Later */}
              <div className="relative flex items-start gap-6 md:gap-0">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center z-10 md:absolute md:left-1/2 md:transform md:-translate-x-1/2">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <div className="md:w-1/2 md:pl-12 md:ml-auto">
                  <div className="inline-block px-3 py-1 bg-slate-600/50 text-slate-300 rounded-full text-sm mb-2">1 Year Later</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Renewal (Optional)</h3>
                  <p className="text-slate-400">Continue at founding member rates. You'll never pay full price as a pre-order customer.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-slate-800/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Screen Time?
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            Join the 1,000 founding families who are taking control
          </p>

          <div className="bg-gradient-to-r from-teal-700/20 to-amber-500/20 border border-teal-600/30 rounded-2xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
              <div className="text-center">
                <p className="text-slate-400 text-sm">Regular Price</p>
                <p className="text-3xl font-bold text-slate-500 line-through">$100/year</p>
              </div>
              <div className="text-4xl text-slate-600 hidden md:block">→</div>
              <div className="text-center">
                <p className="text-green-400 text-sm font-medium">Pre-order Price</p>
                <p className="text-5xl font-bold text-white">$40</p>
                <p className="text-slate-400 text-sm">Lifetime founding member access</p>
              </div>
            </div>

            <Button 
              onClick={scrollToCheckout}
              size="lg"
              className="bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-800 hover:to-teal-700 text-white px-10 py-6 text-lg font-semibold rounded-xl shadow-lg shadow-teal-700/25"
            >
              Pre-order Now - Save 60%
            </Button>

            <div className="flex items-center justify-center gap-3 mt-6 text-slate-400">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span>{spotsRemaining} of 1,000 spots remaining</span>
            </div>
          </div>

          <p className="text-slate-500 text-sm">
            Secure checkout powered by Stripe. 100% satisfaction guarantee.
          </p>
        </div>
      </section>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur border-t border-slate-700 md:hidden z-40">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold">Pre-order - $40</p>
            <p className="text-slate-400 text-sm">{spotsRemaining} spots left</p>
          </div>
          <Button 
            onClick={scrollToCheckout}
            className="bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-800 hover:to-teal-700 text-white font-semibold px-6"
          >
            Get Access
          </Button>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)}
        spotsRemaining={spotsRemaining}
      />

      {/* Bottom padding for sticky CTA on mobile */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
