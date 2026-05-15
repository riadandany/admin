import React from 'react';
import '../css/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SiteProvider } from './context/SiteContext';
import Home from './pages/Home';
import Contact from './pages/Contact';
import AdminDev from './pages/AdminDev';
import DynamicPage from './pages/DynamicPage';
import AdPopup from './components/AdPopup';
import HeadManager from './components/HeadManager';

function App() {
  return (
    <div className="App">
      <SiteProvider>
        <HeadManager />
        <BrowserRouter>
          <AdPopup />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin-dev" element={<AdminDev />} />
            <Route path="/:slug" element={<DynamicPage />} />
          </Routes>
        </BrowserRouter>
      </SiteProvider>
    </div>
  );
}
export default App;
