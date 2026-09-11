/**
 * firestoreHelpers.ts
 * -------------------
 * Write user / patient / caretaker data to Firestore using the
 * CLIENT-SIDE Firebase SDK. This runs in the browser with the logged-in
 * user's auth session — no admin service account required.
 *
 * Data written here appears immediately in the Firebase Console under
 * Firestore → users / patient_profiles / caretaker_links collections.
 */

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.js';

/** Write or merge a user document into the `users` collection */
export async function syncUserToFirestore(userData: {
  id: string;
  name: string;
  email?: string | null;
  phone?: string;
  role: string;
  preferredLanguage?: string;
  patientId?: string;
  doctorStatus?: string;
}): Promise<void> {
  try {
    const docId = userData.id;
    await setDoc(
      doc(db, 'users', docId),
      {
        ...userData,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`🔥 [FIRESTORE CLIENT] Synced user → users/${docId}`);
  } catch (err) {
    console.warn('⚠️ [FIRESTORE CLIENT] Failed to sync user:', err);
  }
}

/** Write or merge a patient profile into the `patient_profiles` collection */
export async function syncPatientProfileToFirestore(profile: {
  id: string;
  userId?: string;
  name: string;
  phone?: string;
  dementiaStage?: string;
  emergencyContact?: string;
  inviteCode?: string;
  preferredLanguage?: string;
  caretakerId?: string;
  caretakerName?: string;
  dateOfBirth?: string;
}): Promise<void> {
  try {
    const docId = profile.id;
    await setDoc(
      doc(db, 'patient_profiles', docId),
      {
        ...profile,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`🔥 [FIRESTORE CLIENT] Synced patient → patient_profiles/${docId}`);
  } catch (err) {
    console.warn('⚠️ [FIRESTORE CLIENT] Failed to sync patient profile:', err);
  }
}

/** Write or merge a caretaker–patient link into `caretaker_links` */
export async function syncCaretakerLinkToFirestore(link: {
  id: string;
  caretakerId: string;
  patientId: string;
  relationship?: string;
  status?: string;
}): Promise<void> {
  try {
    const docId = link.id;
    await setDoc(
      doc(db, 'caretaker_links', docId),
      {
        ...link,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`🔥 [FIRESTORE CLIENT] Synced link → caretaker_links/${docId}`);
  } catch (err) {
    console.warn('⚠️ [FIRESTORE CLIENT] Failed to sync caretaker link:', err);
  }
}
