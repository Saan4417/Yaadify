import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { addDays } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function Quiz() {
  const { deckId } = useParams<{ deckId: string }>();
  const { user } = useAuth();
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quizFinished, setQuizFinished] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  useEffect(() => {
    async function fetchDueCards() {
      if (!user || !deckId) return;
      try {
        const q = query(
          collection(db, 'cards'), 
          where('deckId', '==', deckId), 
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        
        // Filter out cards that are not due yet client-side for simplicity, 
        // though server-side filtering is better for production.
        const now = Timestamp.now();
        let dueCards = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
        
        dueCards = dueCards.filter(c => c.nextReview.toMillis() <= now.toMillis());
        // Simple shuffle
        dueCards.sort(() => Math.random() - 0.5);
        
        setCards(dueCards);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'cards');
      } finally {
        setLoading(false);
      }
    }
    fetchDueCards();
  }, [user, deckId]);

  const handleRating = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!user) return;
    const currentCard = cards[currentIndex];
    
    let { easeFactor, interval, repetitions } = currentCard;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    // SM-2 Algorithm Implementation
    if (rating === 'again') {
      repetitions = 0;
      interval = 1;
    } else if (rating === 'hard') {
      interval = interval === 0 ? 1 : Math.round(interval * 1.2);
      easeFactor = Math.max(1.3, easeFactor - 0.15);
    } else if (rating === 'good') {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.round(interval * easeFactor);
      repetitions += 1;
    } else if (rating === 'easy') {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.round(interval * easeFactor * 1.3);
      repetitions += 1;
      easeFactor += 0.15;
    }

    const nextReviewDate = addDays(new Date(), interval);

    try {
      // Update Card
      await updateDoc(doc(db, 'cards', currentCard.id), {
        easeFactor,
        interval,
        repetitions,
        nextReview: Timestamp.fromDate(nextReviewDate)
      });

      // Log Review (this requires a separate logic block, omitted to save UI responsiveness if needed, but PRD requires it)
      const logRef = doc(collection(db, 'reviewLogs'));
      await setDoc(logRef, {
        cardId: currentCard.id,
        userId: user.uid,
        deckId: deckId,
        rating,
        timeSpent,
        createdAt: serverTimestamp()
      });

      // Next Card
      if (currentIndex < cards.length - 1) {
        setIsFlipped(false);
        setCurrentIndex(prev => prev + 1);
        setStartTime(Date.now());
      } else {
        setQuizFinished(true);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'cards/reviewLogs');
    }
  };

  if (loading) return <div>Loading...</div>;

  if (cards.length === 0 || quizFinished) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/20">
          <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-500" />
        </div>
        <h2 className="text-3xl font-bold">All caught up!</h2>
        <p className="text-zinc-500 max-w-sm">
          You've reviewed all due cards for this deck. Come back later to keep your memory strong.
        </p>
        <Button asChild variant="outline">
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex) / cards.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" asChild className="-ml-4">
          <Link to={`/decks/${deckId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Stop Review
          </Link>
        </Button>
        <span className="text-sm font-medium text-zinc-500">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="perspective-1000 min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex + (isFlipped ? '-flipped' : '')}
            initial={{ opacity: 0, rotateX: isFlipped ? -90 : 90 }}
            animate={{ opacity: 1, rotateX: 0 }}
            exit={{ opacity: 0, rotateX: isFlipped ? 90 : -90 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
            onClick={() => !isFlipped && setIsFlipped(true)}
          >
            <Card className={`w-full min-h-[400px] flex flex-col justify-center items-center text-center p-8 cursor-pointer shadow-lg border-2 ${isFlipped ? 'border-zinc-200 dark:border-zinc-800' : 'border-black dark:border-zinc-50'}`}>
              <CardContent>
                <div className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-8">
                  {currentCard.type === 'cloze' ? 'Fill in the blank' : 'Question'}
                </div>
                <h3 className="text-2xl md:text-3xl font-medium leading-relaxed mb-8">
                  {currentCard.question}
                </h3>
                
                {isFlipped ? (
                  <div className="pt-8 border-t w-full border-zinc-100 dark:border-zinc-800">
                    <div className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-4">Answer</div>
                    <p className="text-xl text-zinc-700 dark:text-zinc-300">
                      {currentCard.answer}
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-zinc-400 mt-8 animate-pulse">
                    Tap to reveal answer
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {isFlipped && (
        <div className="grid grid-cols-4 gap-2 md:gap-4 mt-8">
          <Button variant="outline" className="border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900/30 dark:hover:bg-red-900/20" onClick={() => handleRating('again')}>
            <div className="flex flex-col items-center">
              <span>Again</span>
              <span className="text-xs opacity-50">&lt; 10m</span>
            </div>
          </Button>
          <Button variant="outline" className="border-orange-200 hover:bg-orange-50 hover:text-orange-600 dark:border-orange-900/30 dark:hover:bg-orange-900/20" onClick={() => handleRating('hard')}>
            <div className="flex flex-col items-center">
              <span>Hard</span>
              <span className="text-xs opacity-50">1d</span>
            </div>
          </Button>
          <Button variant="outline" className="border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-blue-900/30 dark:hover:bg-blue-900/20" onClick={() => handleRating('good')}>
            <div className="flex flex-col items-center">
              <span>Good</span>
              <span className="text-xs opacity-50">3d</span>
            </div>
          </Button>
          <Button variant="outline" className="border-green-200 hover:bg-green-50 hover:text-green-600 dark:border-green-900/30 dark:hover:bg-green-900/20" onClick={() => handleRating('easy')}>
            <div className="flex flex-col items-center">
              <span>Easy</span>
              <span className="text-xs opacity-50">4d</span>
            </div>
          </Button>
        </div>
      )}
    </div>
  );
}
