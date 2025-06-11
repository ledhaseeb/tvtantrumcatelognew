import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Filter, BarChart2, Info, X, BookOpen } from "lucide-react";
import { scrollToTop } from "../lib/scroll-utils";

export default function CatalogNavbar() {
  const [location] = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);

  const handleNavClick = () => {
    scrollToTop('smooth');
    setIsNavOpen(false);
  };

  return (
    <div className="bg-primary shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center flex-1">
            <Link href="/" onClick={handleNavClick} className="flex items-center space-x-2 text-white">
              <div className="bg-white/20 p-2 rounded-lg">
                <Home className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold hidden sm:block">TV Tantrum</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8 ml-10">
              <Link 
                href="/browse"
                onClick={handleNavClick}
                className={`${location === '/browse' ? 'text-white border-b-2 border-white' : 'text-white/80 hover:text-white'} font-medium px-1 py-4 flex items-center`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Browse
              </Link>
              <Link 
                href="/compare"
                onClick={handleNavClick}
                className={`${location === '/compare' ? 'text-white border-b-2 border-white' : 'text-white/80 hover:text-white'} font-medium px-1 py-4 flex items-center`}
              >
                <BarChart2 className="w-4 h-4 mr-2" />
                Compare
              </Link>
              <Link 
                href="/about"
                onClick={handleNavClick}
                className={`${location === '/about' ? 'text-white border-b-2 border-white' : 'text-white/80 hover:text-white'} font-medium px-1 py-4 flex items-center`}
              >
                <Info className="w-4 h-4 mr-2" />
                About
              </Link>
              <Link 
                href="/research"
                onClick={handleNavClick}
                className={`${location === '/research' || location?.startsWith('/research/') ? 'text-white border-b-2 border-white' : 'text-white/80 hover:text-white'} font-medium px-1 py-4 flex items-center`}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Research
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="md:hidden text-white hover:text-white/80 p-2"
            >
              {isNavOpen ? <X className="h-6 w-6" /> : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        {isNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setIsNavOpen(false)}
            />
            
            {/* Slide-out menu */}
            <div className="fixed top-0 left-0 h-full w-80 bg-primary shadow-xl transform transition-transform duration-300 ease-in-out">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-2 text-white">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Home className="h-6 w-6" />
                    </div>
                    <span className="text-xl font-bold">TV Tantrum</span>
                  </div>
                  <button
                    onClick={() => setIsNavOpen(false)}
                    className="text-white hover:text-white/80 p-2"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="space-y-2">
                  <Link 
                    href="/"
                    onClick={handleNavClick}
                    className={`flex items-center px-4 py-3 text-white rounded-lg hover:bg-white/10 transition-colors ${location === '/' ? 'font-bold bg-white/20' : 'font-normal'}`}
                  >
                    <Home className="h-5 w-5 mr-3" />
                    Home
                  </Link>
                  <Link 
                    href="/browse"
                    onClick={handleNavClick}
                    className={`flex items-center px-4 py-3 text-white rounded-lg hover:bg-white/10 transition-colors ${location === '/browse' ? 'font-bold bg-white/20' : 'font-normal'}`}
                  >
                    <Filter className="h-5 w-5 mr-3" />
                    Browse
                  </Link>
                  <Link 
                    href="/compare"
                    onClick={handleNavClick}
                    className={`flex items-center px-4 py-3 text-white rounded-lg hover:bg-white/10 transition-colors ${location === '/compare' ? 'font-bold bg-white/20' : 'font-normal'}`}
                  >
                    <BarChart2 className="h-5 w-5 mr-3" />
                    Compare
                  </Link>
                  <Link 
                    href="/about"
                    onClick={handleNavClick}
                    className={`flex items-center px-4 py-3 text-white rounded-lg hover:bg-white/10 transition-colors ${location === '/about' ? 'font-bold bg-white/20' : 'font-normal'}`}
                  >
                    <Info className="h-5 w-5 mr-3" />
                    About
                  </Link>
                  <Link 
                    href="/research"
                    onClick={handleNavClick}
                    className={`flex items-center px-4 py-3 text-white rounded-lg hover:bg-white/10 transition-colors ${location === '/research' || location?.startsWith('/research/') ? 'font-bold bg-white/20' : 'font-normal'}`}
                  >
                    <BookOpen className="h-5 w-5 mr-3" />
                    Research
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}