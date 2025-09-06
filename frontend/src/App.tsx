import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { EcoOnboarding } from "@/components/EcoOnboarding";
import { EcoCharacter, EcoParticles } from "@/components/EcoCharacter";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import Chatbot from "@/components/Chatbot";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import AddProduct from "./pages/AddProduct";
import MyListings from "./pages/MyListings";
import Purchases from "./pages/Purchases";
import Wishlist from "./pages/Wishlist";
import NotFound from "./pages/NotFound";
import { store } from "@/lib/store";
import ForgotPassword from './pages/ForgotPassword';

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = store.getCurrentUser();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (redirect to feed if logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const user = store.getCurrentUser();
  return !user ? <>{children}</> : <Navigate to="/feed" replace />;
};

const App = () => {
  console.log('App component rendering...');
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    console.log('App initializing...');

    // Initialize demo data
    store.seedData();
    console.log('Demo data seeded');

    // Check if user needs onboarding
    const user = store.getCurrentUser();
    console.log('Current user:', user);
    if (user && !user.onboarded) {
      setShowOnboarding(true);
    }

    console.log('App initialization complete');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <EcoParticles />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected routes */}
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/feed" element={<Feed />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/add" element={<AddProduct />} />
              <Route path="/my-listings" element={<MyListings />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/wishlist" element={<Wishlist />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>

          {/* Global Components */}
          <EcoCharacter />
          <FloatingActionButton />
          <Chatbot />

          {/* Onboarding */}
          {showOnboarding && (
            <EcoOnboarding onComplete={() => setShowOnboarding(false)} />
          )}

        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;