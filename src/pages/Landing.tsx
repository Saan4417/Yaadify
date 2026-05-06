import { useAuth } from '../lib/AuthContext';
import { Button } from '../components/ui/button';
import { Brain, Zap, Target } from 'lucide-react';

export default function Landing() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-8 rounded-full bg-zinc-100 p-4 dark:bg-zinc-900">
        <Brain className="h-16 w-16 text-zinc-900 dark:text-zinc-50" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl mb-6">
        Never Forget <span className="opacity-70">What You Learn</span>
      </h1>
      <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400 mb-10">
        Yaadify uses AI to turn your notes into smart flashcards and automatically schedules them for review using spaced repetition.
      </p>
      
      <Button size="lg" onClick={() => signInWithGoogle()} className="text-lg px-8 py-6 h-auto">
        Start Remembering Now
      </Button>

      <div className="mt-32 grid gap-12 sm:grid-cols-3 max-w-4xl text-left">
        <div className="flex flex-col gap-3">
          <div className="p-3 bg-zinc-100 rounded-lg w-fit dark:bg-zinc-900">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-xl">Instant Flashcards</h3>
          <p className="text-zinc-600 dark:text-zinc-400">Paste your notes and Gemini AI will magically extract the key concepts into Q&A and fill-in-the-blank cards.</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="p-3 bg-zinc-100 rounded-lg w-fit dark:bg-zinc-900">
            <Brain className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-xl">Spaced Repetition</h3>
          <p className="text-zinc-600 dark:text-zinc-400">Our SM-2 powered algorithm schedules your reviews exactly when you are about to forget them.</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="p-3 bg-zinc-100 rounded-lg w-fit dark:bg-zinc-900">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-xl">Ace Your Exams</h3>
          <p className="text-zinc-600 dark:text-zinc-400">Perfect for NEET, JEE, UPSC, or learning a new language. Minimum effort, maximum recall.</p>
        </div>
      </div>
    </div>
  );
}
