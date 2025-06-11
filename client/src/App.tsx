import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Footer from "@/components/Footer";
import Browse from "@/pages/browse";
import Compare from "@/pages/compare";
import About from "@/pages/about";
import AdminPage from "@/pages/admin-page";
import Research from "@/pages/research";
import ResearchDetail from "@/pages/research-detail";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";

import CatalogHomeResponsive from "@/pages/catalog-home-responsive";
import CatalogNavbar from "@/components/CatalogNavbar";
import CatalogShowDetailPage from "@/pages/catalog-show-detail-page-fixed";
import { useEffect } from "react";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import { initAdSense } from "./lib/adsense";

function Router() {
  // Track page views when routes change
  useAnalytics();
  
  // Access URL to check for development mode
  const isDevMode = true; // Temporarily force dev mode for testing
  
  // Check if user has early access token stored in localStorage
  const hasEarlyAccess = localStorage.getItem("earlyAccessShown") === "true";

  // Debug current location
  console.log('Current window location:', window.location.pathname);
  console.log('Current window href:', window.location.href);
  console.log('isDevMode:', isDevMode);

  return (
    <div className="min-h-screen flex flex-col">
      <Switch>
        {/* Legal Pages - Must come before other routes */}
        <Route path="/privacy-policy">
          <div className="flex-grow flex flex-col">
            <CatalogNavbar />
            <div className="flex-grow">
              <PrivacyPolicy />
            </div>
            <Footer />
          </div>
        </Route>
        <Route path="/terms-of-service">
          <div className="flex-grow flex flex-col">
            <CatalogNavbar />
            <div className="flex-grow">
              <TermsOfService />
            </div>
            <Footer />
          </div>
        </Route>

        {/* All show detail routes use catalog page */}
        <Route path="/show/:id" component={CatalogShowDetailPage} />
        <Route path="/shows/:id" component={CatalogShowDetailPage} />
        <Route path="/detail/:id" component={CatalogShowDetailPage} />

        {/* Catalog Home - Main landing page */}
        <Route path="/">
          <div className="flex-grow flex flex-col">
            <CatalogNavbar />
            <div className="flex-grow">
              <CatalogHomeResponsive />
            </div>
            <Footer />
          </div>
        </Route>
        
        {/* Browse Page - Open to everyone */}
        <Route path="/browse">
          <div className="flex-grow flex flex-col">
            <CatalogNavbar />
            <div className="flex-grow">
              <Browse />
            </div>
            <Footer />
          </div>
        </Route>
        
        {/* About Page - Open to everyone */}
        <Route path="/about">
          <div className="flex-grow flex flex-col">
            <CatalogNavbar />
            <div className="flex-grow">
              <About />
            </div>
            <Footer />
          </div>
        </Route>
        
        {/* Compare Page - Open to everyone */}
        <Route path="/compare">
          <div className="flex-grow flex flex-col">
            <CatalogNavbar />
            <div className="flex-grow">
              <Compare />
            </div>
            <Footer />
          </div>
        </Route>
        
        {/* Research Pages */}
        <Route path="/research">
          <div className="flex-grow flex flex-col">
            <CatalogNavbar />
            <div className="flex-grow">
              <Research />
            </div>
            <Footer />
          </div>
        </Route>
        
        <Route path="/research/:id">
          <div className="flex-grow flex flex-col">
            <CatalogNavbar />
            <div className="flex-grow">
              <ResearchDetail />
            </div>
            <Footer />
          </div>
        </Route>

        {/* Admin Pages */}
        <Route path="/tvtantrum-admin-secure-access-2024">
          <div className="flex-grow flex flex-col">
            <CatalogNavbar />
            <div className="flex-grow">
              <AdminPage />
            </div>
            <Footer />
          </div>
        </Route>

        {/* 404 Fallback */}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  useEffect(() => {
    // Initialize Google Analytics
    initGA();
    
    // Initialize Google AdSense
    initAdSense();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background font-sans antialiased">
          <Router />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;