import { useEffect } from "react";
import { Router as WouterRouter, Route, Switch, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import CatalogNavbar from "@/components/CatalogNavbar";
import Footer from "@/components/Footer";
import { setupGlobalBrowserBackHandler, cleanupGlobalBrowserBackHandler } from "@/lib/browser-navigation-fix";
import CatalogHomeResponsive from "@/pages/catalog-home-responsive";
import Browse from "@/pages/browse";
import Compare from "@/pages/compare";
import About from "@/pages/about";
import Research from "@/pages/research";
import ResearchDetail from "@/pages/research-detail";
import Products from "@/pages/products";
import CatalogShowDetailPage from "@/pages/catalog-show-detail-page-fixed";
import AdminPage from "@/pages/admin-page";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminProducts from "@/pages/admin-products";
import NotFound from "@/pages/not-found";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import ThankYou from "@/pages/thank-you";
import Preorder from "@/pages/preorder";
import BetaTrial from "@/pages/beta-trial";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import PromoBanner from "@/components/PromoBanner";
import CookieConsent from "@/components/CookieConsent";

// Create query client with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function AppContent() {
  const [_, setLocation] = useLocation();
  useAnalytics();
  
  useEffect(() => {
    // Setup global browser back handler
    setupGlobalBrowserBackHandler(setLocation);
    
    return () => {
      cleanupGlobalBrowserBackHandler();
    };
  }, [setLocation]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <PromoBanner placement="site-wide" />
      <CatalogNavbar />
      <PromoBanner placement="announcement" />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={CatalogHomeResponsive} />
          <Route path="/browse" component={Browse} />
          <Route path="/compare" component={Compare} />
          <Route path="/about" component={About} />
          <Route path="/research" component={Research} />
          <Route path="/research/:id" component={ResearchDetail} />
          <Route path="/products" component={Products} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route path="/thank-you" component={ThankYou} />
          <Route path="/preorder" component={Preorder} />
          <Route path="/beta-trial" component={BetaTrial} />
          <Route path="/show/:id" component={CatalogShowDetailPage} />
          {/* Secure admin access with unique URL */}
          <Route path="/tvtantrum-admin-secure-access-2024" component={AdminLogin} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/products" component={AdminProducts} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin" component={AdminPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
}

export default function CatalogApp() {
  useEffect(() => {
    // Initialize Google Analytics
    initGA();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter>
          <AppContent />
        </WouterRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}