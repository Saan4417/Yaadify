import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { PlusCircle, Play, Library } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export default function Dashboard() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDecks() {
      if (!user) return;
      try {
        const q = query(collection(db, 'decks'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const fetchedDecks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDecks(fetchedDecks);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'decks');
      } finally {
        setLoading(false);
      }
    }
    fetchDecks();
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-zinc-500">Welcome back. Ready to review?</p>
        </div>
        <Button asChild>
          <Link to="/notes/add">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Note
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Decks</CardTitle>
            <Library className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{decks.length}</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Decks</h2>
        {loading ? (
          <p>Loading decks...</p>
        ) : decks.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border-dashed">
            <Library className="mx-auto h-10 w-10 text-zinc-400 mb-3" />
            <h3 className="text-lg font-medium">No decks yet</h3>
            <p className="text-zinc-500 mb-4">Create your first deck by adding a note.</p>
            <Button asChild variant="outline">
              <Link to="/notes/add">Create Deck</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {decks.map(deck => (
              <Card key={deck.id} className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                <CardHeader>
                  <CardTitle>{deck.subject}</CardTitle>
                  <CardDescription>{deck.visibility}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500">Ready for review</span>
                  <div className="space-x-2">
                    <Button variant="ghost" size="icon" asChild>
                       <Link to={`/decks/${deck.id}`}>
                         <Library className="h-4 w-4" />
                       </Link>
                    </Button>
                    <Button size="icon" asChild>
                      <Link to={`/quiz/${deck.id}`}>
                        <Play className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
