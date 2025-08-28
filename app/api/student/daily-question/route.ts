import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get today's date
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Try to get the question for today
    const dailyQuestionRef = adminFirestore.collection('daily_questions').doc(dateString);
    const dailyQuestionDoc = await dailyQuestionRef.get();
    
    if (dailyQuestionDoc.exists) {
      const questionData = dailyQuestionDoc.data();
      return NextResponse.json({
        question: {
          id: dailyQuestionDoc.id,
          ...questionData
        }
      });
    }
    
    // If no question for today, get a random question from the questions collection
    const questionsSnapshot = await adminFirestore.collection('questions').get();
    
    // Check if questions collection is empty (handle both real and mock implementations)
    const questionsDocs = 'docs' in questionsSnapshot ? questionsSnapshot.docs : [];
    if (questionsDocs.length === 0) {
      return NextResponse.json({
        question: null
      });
    }
    
    // Convert to array and pick a random question
    const questions: any[] = [];
    if (typeof questionsSnapshot.forEach === 'function') {
      questionsSnapshot.forEach((doc: any) => {
        questions.push({
          id: doc.id,
          ...doc.data()
        });
      });
    } else {
      // Handle mock implementation
      questionsDocs.forEach((doc: any) => {
        questions.push({
          id: doc.id,
          ...doc.data()
        });
      });
    }
    
    if (questions.length === 0) {
      return NextResponse.json({
        question: null
      });
    }
    
    const randomIndex = Math.floor(Math.random() * questions.length);
    const selectedQuestion = questions[randomIndex];
    
    // Save this as today's question for consistency
    await dailyQuestionRef.set({
      questionId: selectedQuestion.id,
      assignedAt: new Date(),
      ...selectedQuestion
    });
    
    return NextResponse.json({
      question: {
        id: selectedQuestion.id,
        ...selectedQuestion
      }
    });
    
  } catch (error) {
    console.error('Error fetching daily question:', error);
    return NextResponse.json({
      error: 'Failed to fetch daily question'
    }, { status: 500 });
  }
}
