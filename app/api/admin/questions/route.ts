import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';

interface Question {
  id?: string;
  title: string;
  description: string;
  difficulty?: string;
  category?: string;
  tags?: string[];
  example?: string;
  constraints?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function POST(request: NextRequest) {
  try {
    const { questions } = await request.json();
    
    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Invalid questions data' }, { status: 400 });
    }

    const batch = adminFirestore.batch();
    const questionsCollection = adminFirestore.collection('questions');
    
    for (const question of questions) {
      const questionData: Question = {
        ...question,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Generate a new document ID if not provided
      const docRef = question.id && question.id.startsWith('q_new_') 
        ? questionsCollection.doc() 
        : questionsCollection.doc(question.id || undefined);
      
      batch.set(docRef, questionData);
    }

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `Successfully saved ${questions.length} questions` 
    });

  } catch (error) {
    console.error('Error saving questions:', error);
    return NextResponse.json({ 
      error: 'Failed to save questions to database' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const questionsSnapshot = await adminFirestore.collection('questions').get();
    const questions = questionsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ questions });

  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch questions' 
    }, { status: 500 });
  }
}
