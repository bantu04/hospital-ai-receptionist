// server/config/firebase.js
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let db = null;

function initFirebase() {
  if (db) return db;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    console.warn(
      '⚠️ Firebase env vars missing. Firestore is DISABLED for this run.\n' +
      '   Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL to enable it.'
    );
    return null;
  }

  const serviceAccount = {
    type: 'service_account',
    project_id: projectId,
    private_key: privateKey.replace(/\\n/g, '\n'),
    client_email: clientEmail,
  };

  try {
    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('✅ Firebase initialized successfully');
    }

    db = getFirestore();
    return db;
  } catch (error) {
    console.error('❌ Firebase init error:', error);
    db = null;
    return null;
  }
}

db = initFirebase();

export { db, initFirebase };
