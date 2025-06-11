import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { handleContactNavigation, scrollToTop } from "../lib/scroll-utils";

export default function Footer() {
  const { user, isApproved } = useAuth();
  const [location, navigate] = useLocation();
  
  // Use the standard about page URL for all users
  const aboutPageUrl = "/about";

  const handleNavClick = () => {
    scrollToTop('smooth');
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    handleContactNavigation(navigate);
  };
  
  return (
    <footer className="bg-primary text-white py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:justify-between">
          <div className="mb-8 md:mb-0">
            <h2 className="text-xl font-heading font-bold mb-4">TV Tantrum</h2>
            <p className="text-white/80 max-w-md">
              Helping parents make informed decisions about the children's TV shows their kids watch. 
              Compare, review, and discover new content.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-4">Explore</h3>
              <ul className="space-y-2">
                <li><Link href="/" onClick={handleNavClick} className="text-white/80 hover:text-white">Home</Link></li>
                <li><Link href="/browse" onClick={handleNavClick} className="text-white/80 hover:text-white">Browse Shows</Link></li>
                <li><Link href="/compare" onClick={handleNavClick} className="text-white/80 hover:text-white">Compare Shows</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href={aboutPageUrl} onClick={handleNavClick} className="text-white/80 hover:text-white">About Us</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-4">Connect</h3>
              <ul className="space-y-2">
                <li><a href="#" onClick={handleContactClick} className="text-white/80 hover:text-white cursor-pointer">Contact Us</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy-policy" onClick={handleNavClick} className="text-white/80 hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" onClick={handleNavClick} className="text-white/80 hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-white/20 md:flex md:items-center md:justify-between">
          <div className="flex space-x-6 md:order-2">
            <a 
              href="#" 
              className="text-white/70 hover:text-white"
            >
              <i className="fas fa-envelope"></i>
            </a>
          </div>
          <p className="mt-8 md:mt-0 md:order-1 text-white/70">
            &copy; {new Date().getFullYear()} TV Tantrum. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
