import { db } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export interface UserProfileInput {
  user_id: string;
  name: string;
  enrollment_no: string;
  email: string;
  phone: string;
  course: string;
  section: string;
  semester: string;
  github_repo_link: string;
  created_at?: any; // serverTimestamp assigned outside to avoid circular import
}

export const userProfileDocRef = (uid: string) => doc(db, 'user_profiles', uid);

export async function createOrReplaceUserProfile(data: UserProfileInput) {
  await setDoc(userProfileDocRef(data.user_id), data, { merge: true });
}

export async function fetchUserProfile(uid: string) {
  const snap = await getDoc(userProfileDocRef(uid));
  return snap.exists() ? snap.data() : null;
}
