import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, MessageSquare } from 'lucide-react';
import ProtectedRoute from './components/ProtectedRoute';
import AppSidebar from './components/AppSidebar';
import AppHeader from './components/AppHeader';
import AIChatbot from './components/AIChatbot';
import FarmInfoModal from './components/FarmInfoModal';
import ChatDrawer from './components/ChatDrawer';
import { useSidebar } from './context/SidebarContext';
import { useAuth } from './context/AuthContext';
import { cn } from './lib/utils';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import UserProfile from './pages/UserProfile';
import Messages from './pages/Messages';

// Farmer Pages
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import CropManagement from './pages/farmer/Crops';
import DiseaseReports from './pages/farmer/DiseaseReports';
import Weather from './pages/farmer/Weather';
import Market from './pages/farmer/Market';
import SupplyChainDashboard from './pages/farmer/SupplyChainDashboard';
import Schemes from './pages/farmer/Schemes';
import EquipmentMarketplace from './pages/farmer/EquipmentMarketplace';
import ConnectedRetailers from './pages/farmer/ConnectedRetailers';

// ── Public page minimal top bar ────────────────────────────────────────────
const PublicTopBar = () => {
  const { user } = useAuth();
  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-14 flex items-center justify-between px-6 border-b border-sidebar-border bg-sidebar/80 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🌾</span>
        <span className="font-black text-base tracking-tight text-sidebar-foreground">KrishiBandhu</span>
      </div>
      {!user && (
        <div className="flex items-center gap-3">
          <a href="/login" className="text-sm font-semibold text-sidebar-foreground hover:text-emerald-500 transition-colors">Sign In</a>
          <a href="/register" className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
            Get Started
          </a>
        </div>
      )}
    </header>
  );
};

// ── Authenticated App Shell (sidebar + content) ────────────────────────────
const AuthenticatedShell = ({ children }) => {
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <div className={cn(
        'flex-1 flex flex-col min-h-screen transition-[margin] duration-300 ease-in-out pt-16',
        'lg:ml-64',
        collapsed && 'lg:ml-16'
      )}>
        {/* Desktop Header - Fixed at top */}
        <div className="hidden lg:block">
          <AppHeader onChatToggle={() => setIsChatOpen(true)} />
        </div>

        {/* Mobile top bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-4 border-b border-sidebar-border bg-sidebar/80 backdrop-blur-md lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🌾</span>
            <span className="font-black text-sm text-sidebar-foreground">KrishiBandhu</span>
          </div>
        </div>

        <main className="flex-1">{children}</main>
      </div>

      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

// ── Layout router ──────────────────────────────────────────────────────────
const PUBLIC_PATHS = ['/', '/login', '/register', '/unauthorized'];

const AppLayout = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const isPublic = PUBLIC_PATHS.some(p => location.pathname === p) || location.pathname.startsWith('/unauthorized');

  if (isPublic || !user) {
    return (
      <>
        <PublicTopBar />
        <div className="pt-14">{children}</div>
      </>
    );
  }
  return <AuthenticatedShell>{children}</AuthenticatedShell>;
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppLayout>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />

          {/* Farmer */}
          <Route path="/farmer" element={<ProtectedRoute><FarmerDashboard /></ProtectedRoute>} />
          <Route path="/farmer/crops" element={<ProtectedRoute><CropManagement /></ProtectedRoute>} />
          <Route path="/farmer/disease-reports" element={<ProtectedRoute><DiseaseReports /></ProtectedRoute>} />
          <Route path="/farmer/weather" element={<ProtectedRoute><Weather /></ProtectedRoute>} />
          <Route path="/farmer/market" element={<ProtectedRoute><Market /></ProtectedRoute>} />
          <Route path="/farmer/supply-chain" element={<ProtectedRoute><SupplyChainDashboard /></ProtectedRoute>} />
          <Route path="/farmer/schemes/:id?" element={<ProtectedRoute><Schemes /></ProtectedRoute>} />
          <Route path="/farmer/connected-retailers" element={<ProtectedRoute><ConnectedRetailers /></ProtectedRoute>} />
          <Route path="/farmer/equipment" element={<ProtectedRoute><EquipmentMarketplace /></ProtectedRoute>} />
          <Route path="/farmer/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>

      <AIChatbot />
      <FarmInfoModal />
    </Router>
  );
}

export default App;
