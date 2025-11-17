import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// Example HTTP function
export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

// Example Firestore trigger
export const onUserCreate = functions.firestore
  .document("users/{userId}")
  .onCreate((snap, context) => {
    const newValue = snap.data();
    functions.logger.log("New user created", newValue);
    return null;
  });

