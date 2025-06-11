// Utility function to scroll to top of page
export const scrollToTop = (behavior: 'smooth' | 'instant' = 'smooth') => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: behavior
  });
};

// Utility function to scroll to a specific element
export const scrollToElement = (elementId: string, behavior: 'smooth' | 'instant' = 'smooth') => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({
      behavior: behavior,
      block: 'start'
    });
  }
};

// Special function for contact button navigation
export const handleContactNavigation = (navigate: (path: string) => void) => {
  navigate('/about');
  // Use setTimeout to ensure navigation completes before scrolling
  setTimeout(() => {
    scrollToElement('contact', 'smooth');
  }, 100);
};

// Custom hook for scroll to top on route change
export const useScrollToTop = () => {
  return scrollToTop;
};