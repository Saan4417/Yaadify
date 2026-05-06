import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { ArrowLeft, Play } from 'lucide-react';

export default function Deck() {
  const { deckId } = useParams<{ deckId: string }>();
  const { user } = useAuth();
  const [deck, setDeck] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user || !deckId) return;
      try {
        const deckRef = doc(db, 'decks', deckId);
        const deckSnap = await getDoc(deckRef);
        if (deckSnap.exists()) {
          setDeck({ id: deckSnap.id, ...deckSnap.data() });
        }

        const cardsQuery = query(collection(db, 'cards'), where('deckId', '==', deckId), where('userId', '==', user.uid));
        const cardsSnap = await getDocs(cardsQuery);
        setCards(cardsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, `decks & cards`);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, deckId]);

  if (loading) return <div>Loading...</div>;
  if (!deck) return <div>Deck not found</div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="-ml-4 mb-4">
        <Link to="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>
      </Button>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{deck.subject}</h1>
          <p className="text-zinc-500">{cards.length} cards</p>
        </div>
        <Button asChild size="lg">
          <Link to={`/quiz/${deckId}`}>
            <Play className="mr-2 h-4 w-4" /> Start Review
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <Card key={card.id}>
            <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 rounded-t-lg border-b">
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Card {i + 1} {card.type === 'cloze' && '• Cloze'}
              </span>
              <CardTitle className="text-lg leading-relaxed mt-2">{card.question}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-zinc-700 dark:text-zinc-300">{card.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
