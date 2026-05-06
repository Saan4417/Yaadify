import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Button } from './ui/button';
import { BrainCircuit } from 'lucide-react';

export default function Navbar() {
  const { user, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/80 backdrop-blur">
      <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6lg:px-8">
        <Link to="/" className="flex items-center space-x-2">
          <BrainCircuit className="h-6 w-6 text-zinc-900 dark:text-zinc-50" />
          <span className="font-bold tracking-tight">Yaadify</span>
        </Link>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-sm text-zinc-500 hidden sm:block">{user.email}</span>
              <Button variant="outline" size="sm" onClick={() => signOut()}>Logout</Button>
            </>
          ) : (
            <Button size="sm" onClick={() => signInWithGoogle()}>Login</Button>
          )}
        </div>
      </div>
    </header>
  );
}
