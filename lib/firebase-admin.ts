import * as mock from './firebase-admin-mock';

// For development, use mock data
// To use real Firebase, uncomment the Firebase Admin initialization code below
// and set the required environment variables

console.log('Using mock Firebase Admin implementations for development');

export const adminAuth = mock.adminAuth;
export const adminFirestore = mock.adminFirestore;
export default mock.default;
