import { Router as WouterRouter, Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import CatalogNavbar from "@/components/CatalogNavbar";
import Footer from "@/components/Footer";
import CatalogHomeResponsive from "@/pages/catalog-home-responsive";
import Browse from "@/pages/browse";
import Compare from "@/pages/compare";
import About from "@/pages/about";
import Research from "@/pages/research";
import ResearchDetail from "@/pages/research-detail";
import CatalogShowDetailPage from "@/pages/catalog-show-detail-page-fixed";
import AdminPage from "@/pages/admin-page";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import { useEffect } from "react";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import { initAdSense } from "./lib/adsense";
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

export default function CatalogApp() {
  useEffect(() => {
    // Initialize Google Analytics
    initGA();
    
    // Initialize Google AdSense
    initAdSense();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter>
          <div className="min-h-screen flex flex-col">
            <CatalogNavbar />
            <main className="flex-1">
              <Switch>
                <Route path="/" component={CatalogHomeResponsive} />
                <Route path="/browse" component={Browse} />
                <Route path="/compare" component={Compare} />
                <Route path="/about" component={About} />
                <Route path="/research" component={Research} />
                <Route path="/research/:id" component={ResearchDetail} />
                <Route path="/privacy-policy" component={PrivacyPolicy} />
                <Route path="/terms-of-service" component={TermsOfService} />
                <Route path="/show/:id" component={CatalogShowDetailPage} />
                {/* Secure admin access with unique URL */}
                <Route path="/tvtantrum-admin-secure-access-2024" component={AdminLogin} />
                <Route path="/admin/dashboard" component={AdminDashboard} />
                <Route path="/admin/login" component={AdminLogin} />
                <Route path="/admin" component={AdminPage} />
                <Route component={NotFound} />
              </Switch>
            </main>
            <Footer />
            <CookieConsent />
          </div>
        </WouterRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}