import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../lib/AuthContext';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { GoogleGenAI, Type } from '@google/genai';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function AddNote() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAndSave = async () => {
    if (!user) return;
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setIsGenerating(true);
    try {
      // 1. Generate Cards using AI
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Generate flashcards from the following text. 
                   Create a mix of direct Q/A cards and cloze (fill in the blank) cards. 
                   Keep answers concise (< 25 words).
                   
                   TEXT:
                   ${content}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: 'Either "qa" or "cloze"' },
                question: { type: Type.STRING, description: 'The question or the sentence with a blank (e.g. "___ is the capital").' },
                answer: { type: Type.STRING, description: 'The answer to the question, or the word filling the blank.' }
              },
              required: ['type', 'question', 'answer']
            }
          }
        }
      });

      const cardsData = JSON.parse(response.text?.trim() || '[]');

      if (!cardsData || cardsData.length === 0) {
         toast.error('Could not generate any cards from the text.');
         setIsGenerating(false);
         return;
      }

      // 2. Save to Firestore
      const noteRef = doc(collection(db, 'notes'));
      const deckRef = doc(collection(db, 'decks'));
      const batchPromises = [];

      try {
        await setDoc(deckRef, {
          userId: user.uid,
          subject: title,
          visibility: 'private',
          createdAt: serverTimestamp(),
        });

        await setDoc(noteRef, {
          userId: user.uid,
          content: content,
          title: title,
          source: 'text',
          createdAt: serverTimestamp(),
        });
        
        for (const card of cardsData) {
          const cardRef = doc(collection(db, 'cards'));
          // Add to batch later using writeBatch, but setDoc allows catching individual errors, simplify with parallel setDocs.
          batchPromises.push(setDoc(cardRef, {
            deckId: deckRef.id,
            userId: user.uid,
            noteId: noteRef.id,
            type: card.type,
            question: card.question,
            answer: card.answer,
            easeFactor: 2.5,
            interval: 0,
            repetitions: 0,
            nextReview: serverTimestamp(),
            createdAt: serverTimestamp(),
          }));
        }
        await Promise.all(batchPromises);
        toast.success(`Successfully generated and saved ${cardsData.length} cards!`);
        navigate('/dashboard');
      } catch (error) {
         handleFirestoreError(error, OperationType.CREATE, 'multiple collections');
      }

    } catch (error) {
      console.error(error);
      toast.error('Error generating cards.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add Note</CardTitle>
          <CardDescription>Paste your notes here and let AI generate flashcards.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Deck Title</Label>
            <Input 
              id="title" 
              placeholder="e.g. Cell Biology Ch 3" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Your Notes</Label>
            <Textarea 
              id="content" 
              placeholder="Paste your text here..." 
              className="min-h-[250px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleGenerateAndSave} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Cards'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
