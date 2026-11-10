import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyStoredTheme, syncThemeFromServer } from './utils/theme';

applyStoredTheme();      // langsung pakai tema tersimpan di browser (tanpa berkedip)
syncThemeFromServer();   // lalu ambil tema sekolah dari MySQL bila server aktif

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
