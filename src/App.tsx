import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ReactNode } from 'react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import AddNote from './pages/AddNote';
import Deck from './pages/Deck';
import Quiz from './pages/Quiz';
import Navbar from './components/Navbar';
import { Toaster } from './components/ui/sonner';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/" />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-50">
      <Navbar />
      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/notes/add" element={<ProtectedRoute><AddNote /></ProtectedRoute>} />
          <Route path="/decks/:deckId" element={<ProtectedRoute><Deck /></ProtectedRoute>} />
          <Route path="/quiz/:deckId" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
        </Routes>
      </main>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
