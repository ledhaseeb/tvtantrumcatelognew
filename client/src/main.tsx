import { createRoot } from "react-dom/client";
import CatalogApp from "./App-catalog";
import "./index.css";

// Load Google Fonts for matching design reference
const googleFontsLink = document.createElement('link');
googleFontsLink.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Open+Sans:wght@400;600&display=swap';
googleFontsLink.rel = 'stylesheet';
document.head.appendChild(googleFontsLink);

// Load Font Awesome for icons
const fontAwesomeLink = document.createElement('link');
fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
fontAwesomeLink.rel = 'stylesheet';
document.head.appendChild(fontAwesomeLink);

// Add title
const titleElement = document.createElement('title');
titleElement.textContent = 'TV Tantrum - Children\'s TV Show Comparison';
document.head.appendChild(titleElement);

createRoot(document.getElementById("root")!).render(<CatalogApp />);
