import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin SDK
if (!getApps().length) {
  // Vérifier si on a les credentials Firebase Admin
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    // Utiliser les credentials depuis les variables d'environnement
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    })
  } else {
    // Fallback : utiliser les credentials par défaut (service account)
    try {
      initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })
    } catch (error) {
      console.warn('⚠️ Firebase Admin SDK non configuré. Utilisation du SDK client.')
    }
  }
}

export const adminDb = getFirestore()

export default adminDb
