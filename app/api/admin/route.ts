import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';

// Admin credentials - you can modify these
const ADMIN_CREDENTIALS = [
  { email: 'admin@codestreak.com', password: 'AdminPass123!' },
  { email: 'mohit@codestreak.com', password: 'MohitAdmin456!' },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'users':
        return await getAllUsers();
      case 'stats':
        return await getSystemStats();
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password } = body;

    switch (action) {
      case 'login':
        return await adminLogin(email, password);
      case 'updateUser':
        return await updateUserData(body);
      case 'deleteUser':
        return await deleteUser(body.userId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function adminLogin(email: string, password: string) {
  const validAdmin = ADMIN_CREDENTIALS.find(
    admin => admin.email === email && admin.password === password
  );

  if (!validAdmin) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  return NextResponse.json({ 
    success: true, 
    admin: { email: validAdmin.email } 
  });
}

async function getAllUsers() {
  try {
    // Get all user profiles from Firestore
    const usersSnapshot = await adminFirestore.collection('user_profiles').get();
    const users: any[] = [];

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        name: data.name || 'Unknown',
        email: data.email || 'No email',
        streak: data.streak || 0,
        problemsSolved: data.problemsSolved || 0,
        lastActive: data.lastActive?.toDate?.() || new Date(),
        status: data.status || 'active',
        joinDate: data.createdAt?.toDate?.() || new Date(),
      });
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

async function getSystemStats() {
  try {
    const usersSnapshot = await adminFirestore.collection('user_profiles').get();
    const users: any[] = [];

    usersSnapshot.forEach((doc) => {
      users.push(doc.data());
    });

    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      totalProblems: 45, // Your 45 days challenge
      totalSubmissions: users.reduce((sum, u) => sum + (u.problemsSolved || 0), 0),
      avgStreak: users.length > 0 ? 
        users.reduce((sum, u) => sum + (u.streak || 0), 0) / users.length : 0,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

async function updateUserData(data: any) {
  try {
    const { userId, updateData } = data;
    
    await adminFirestore.collection('user_profiles').doc(userId).update(updateData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

async function deleteUser(userId: string) {
  try {
    // Delete from Firestore
    await adminFirestore.collection('user_profiles').doc(userId).delete();
    
    // Delete from Firebase Auth
    try {
      await adminAuth.deleteUser(userId);
    } catch (authError) {
      console.log('User not found in Auth or already deleted:', authError);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
