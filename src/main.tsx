import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/dm-sans/latin.css';
import '@fontsource/fredoka/latin-600.css';
import App from './App';
import './style.css';
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
