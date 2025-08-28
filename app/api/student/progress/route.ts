import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';

interface UserProgress {
  userId: string;
  completedQuestions: {
    questionId: string;
    completedAt: Date;
    difficulty: string;
  }[];
  currentStreak: number;
  lastActiveDate: Date;
  totalSolved: number;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, questionId, difficulty } = await request.json();
    
    if (!userId || !questionId || !difficulty) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userProgressRef = adminFirestore.collection('user_progress').doc(userId);
    const userProgressDoc = await userProgressRef.get();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let userProgress: UserProgress;
    
    if (userProgressDoc.exists) {
      // Handle both real and mock Firestore data format
      const data = userProgressDoc.data();
      userProgress = {
        userId: data.userId || userId,
        completedQuestions: data.completedQuestions || [],
        currentStreak: data.currentStreak || 0,
        lastActiveDate: data.lastActiveDate || new Date(),
        totalSolved: data.totalSolved || 0
      };
      
      // Check if question already completed today
      const alreadyCompleted = userProgress.completedQuestions.some(
        q => q.questionId === questionId &&
             new Date(q.completedAt).toDateString() === today.toDateString()
      );
      
      if (alreadyCompleted) {
        return NextResponse.json({
          success: true,
          message: 'Question already marked as completed for today'
        });
      }
      
      // Add new completed question
      userProgress.completedQuestions.push({
        questionId,
        completedAt: new Date(),
        difficulty
      });
      
      // Update streak logic
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const lastActive = new Date(userProgress.lastActiveDate);
      lastActive.setHours(0, 0, 0, 0);
      
      if (lastActive.toDateString() === yesterday.toDateString()) {
        // Continued streak
        userProgress.currentStreak += 1;
      } else if (lastActive.toDateString() !== today.toDateString()) {
        // Broken streak or new day
        userProgress.currentStreak = 1;
      }
      // If lastActive is today, we don't change the streak
      
      userProgress.lastActiveDate = new Date();
      userProgress.totalSolved = userProgress.completedQuestions.length;
    } else {
      // Create new progress record
      userProgress = {
        userId,
        completedQuestions: [{
          questionId,
          completedAt: new Date(),
          difficulty
        }],
        currentStreak: 1,
        lastActiveDate: new Date(),
        totalSolved: 1
      };
    }
    
    await userProgressRef.set(userProgress);
    
    return NextResponse.json({
      success: true,
      message: 'Progress updated successfully',
      streak: userProgress.currentStreak
    });
    
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({
      error: 'Failed to update progress'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }
    
    const userProgressRef = adminFirestore.collection('user_progress').doc(userId);
    const userProgressDoc = await userProgressRef.get();
    
    if (!userProgressDoc.exists) {
      // Return default progress if no record exists
      return NextResponse.json({
        completedQuestions: [],
        currentStreak: 0,
        totalSolved: 0,
        stats: {
          hard: 0,
          medium: 0,
          easy: 0,
          choice: 0
        }
      });
    }
    
    // Handle both real and mock Firestore data format
    const data = userProgressDoc.data();
    const userProgress: UserProgress = {
      userId: data.userId || userId,
      completedQuestions: data.completedQuestions || [],
      currentStreak: data.currentStreak || 0,
      lastActiveDate: data.lastActiveDate || new Date(),
      totalSolved: data.totalSolved || 0
    };
    
    // Calculate stats
    const stats = {
      hard: 0,
      medium: 0,
      easy: 0,
      choice: 0
    };
    
    userProgress.completedQuestions.forEach(question => {
      switch (question.difficulty?.toLowerCase()) {
        case 'hard':
          stats.hard += 1;
          break;
        case 'medium':
          stats.medium += 1;
          break;
        case 'easy':
          stats.easy += 1;
          break;
        default:
          stats.choice += 1;
      }
    });
    
    return NextResponse.json({
      completedQuestions: userProgress.completedQuestions,
      currentStreak: userProgress.currentStreak,
      totalSolved: userProgress.totalSolved,
      stats
    });
    
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({
      error: 'Failed to fetch progress'
    }, { status: 500 });
  }
}
