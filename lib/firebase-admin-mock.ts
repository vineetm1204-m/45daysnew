// Mock Firebase Admin for testing without actual Firebase setup
const mockUsers = [
  {
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    streak: 5,
    problemsSolved: 15,
    lastActive: new Date(),
    status: 'active',
    createdAt: new Date(),
  },
  {
    id: 'user2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    streak: 12,
    problemsSolved: 28,
    lastActive: new Date(),
    status: 'active',
    createdAt: new Date(),
  },
];

// Mock user progress data
const mockUserProgress: any[] = [
  {
    userId: 'user1',
    completedQuestions: [
      {
        questionId: 'q1',
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        difficulty: 'Easy'
      },
      {
        questionId: 'q2',
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        difficulty: 'Medium'
      }
    ],
    currentStreak: 2,
    lastActiveDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    totalSolved: 2
  }
];

// Mock daily questions
const mockDailyQuestions: any[] = [];

const mockQuestions: any[] = [
  {
    id: 'q1',
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    difficulty: 'Easy',
    category: 'Array',
    tags: ['Array', 'Hash Table'],
    example: 'Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].',
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.'
  },
  {
    id: 'q2',
    title: 'Add Two Numbers',
    description: 'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.',
    difficulty: 'Medium',
    category: 'Linked List',
    tags: ['Linked List', 'Math'],
    example: 'Input: l1 = [2,4,3], l2 = [5,6,4]\nOutput: [7,0,8]\nExplanation: 342 + 465 = 807.',
    constraints: 'The number of nodes in each linked list is in the range [1, 100].\n0 <= Node.val <= 9\nIt is guaranteed that the list represents a number that does not have leading zeros.'
  },
  {
    id: 'q3',
    title: 'Longest Substring Without Repeating Characters',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    difficulty: 'Medium',
    category: 'String',
    tags: ['Hash Table', 'String', 'Sliding Window'],
    example: 'Input: s = "abcabcbb"\nOutput: 3\nExplanation: The answer is "abc", with the length of 3.',
    constraints: '0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.'
  }
];

// Mock document reference
const createMockDocRef = (id?: string) => ({
  id: id || `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  get: async () => ({
    exists: !!id && mockQuestions.some(q => q.id === id),
    id: id || 'mock_id',
    data: () => mockQuestions.find(q => q.id === id),
  }),
  set: async (data: any) => {
    const docId = id || `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newDoc = { ...data, id: docId };
    const existingIndex = mockQuestions.findIndex(q => q.id === docId);
    if (existingIndex >= 0) {
      mockQuestions[existingIndex] = newDoc;
    } else {
      mockQuestions.push(newDoc);
    }
    console.log('Mock set:', docId, data);
  },
  update: async (data: any) => {
    console.log('Mock update:', id, data);
  },
  delete: async () => {
    console.log('Mock delete:', id);
  },
});

// Mock batch
const createMockBatch = () => {
  const operations: Array<() => Promise<void>> = [];
  
  return {
    set: (docRef: any, data: any) => {
      operations.push(() => docRef.set(data));
    },
    update: (docRef: any, data: any) => {
      operations.push(() => docRef.update(data));
    },
    delete: (docRef: any) => {
      operations.push(() => docRef.delete());
    },
    commit: async () => {
      await Promise.all(operations.map(op => op()));
      operations.length = 0; // Clear operations
    },
  };
};

export const adminAuth = {
  // Mock auth methods if needed
};

export const adminFirestore = {
  collection: (collectionName: string) => ({
    get: async () => ({
      docs: collectionName === 'user_profiles'
        ? mockUsers.map(user => ({
            id: user.id,
            data: () => user,
          }))
        : collectionName === 'user_progress'
        ? mockUserProgress.map(progress => ({
            id: progress.userId,
            data: () => progress,
          }))
        : mockQuestions.map(question => ({
            id: question.id,
            data: () => question,
          })),
      empty: collectionName === 'user_profiles'
        ? mockUsers.length === 0
        : collectionName === 'user_progress'
        ? mockUserProgress.length === 0
        : mockQuestions.length === 0,
      forEach: (callback: (doc: any) => void) => {
        if (collectionName === 'user_profiles') {
          mockUsers.forEach((user) => {
            callback({
              id: user.id,
              data: () => user,
            });
          });
        } else if (collectionName === 'user_progress') {
          mockUserProgress.forEach((progress) => {
            callback({
              id: progress.userId,
              data: () => progress,
            });
          });
        } else if (collectionName === 'questions') {
          mockQuestions.forEach((question) => {
            callback({
              id: question.id,
              data: () => question,
            });
          });
        }
      },
    }),
    doc: (docId?: string) => {
      // Special handling for user_progress collection
      if (collectionName === 'user_progress') {
        return {
          id: docId || `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          get: async () => {
            const progress = mockUserProgress.find(p => p.userId === docId);
            return {
              exists: !!progress,
              id: docId || 'mock_id',
              data: () => progress,
            };
          },
          set: async (data: any) => {
            const newProgress = { ...data, userId: docId };
            const existingIndex = mockUserProgress.findIndex(p => p.userId === docId);
            if (existingIndex >= 0) {
              mockUserProgress[existingIndex] = newProgress;
            } else {
              mockUserProgress.push(newProgress);
            }
            console.log('Mock set user progress:', docId, data);
          },
          update: async (data: any) => {
            console.log('Mock update user progress:', docId, data);
          },
          delete: async () => {
            console.log('Mock delete user progress:', docId);
          },
        };
      }
      // Special handling for daily_questions collection
      if (collectionName === 'daily_questions') {
        return {
          id: docId || `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          get: async () => {
            const question = mockDailyQuestions.find(q => q.id === docId);
            return {
              exists: !!question,
              id: docId || 'mock_id',
              data: () => question,
            };
          },
          set: async (data: any) => {
            const newQuestion = { ...data, id: docId };
            const existingIndex = mockDailyQuestions.findIndex(q => q.id === docId);
            if (existingIndex >= 0) {
              mockDailyQuestions[existingIndex] = newQuestion;
            } else {
              mockDailyQuestions.push(newQuestion);
            }
            console.log('Mock set daily question:', docId, data);
          },
          update: async (data: any) => {
            console.log('Mock update daily question:', docId, data);
          },
          delete: async () => {
            console.log('Mock delete daily question:', docId);
          },
        };
      }
      // Default handling for other collections
      return createMockDocRef(docId);
    },
  }),
  batch: () => createMockBatch(),
};

export default {
  apps: { length: 1 }, // Mock that admin is initialized
};
