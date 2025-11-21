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

// Firestore trigger to automatically populate displayNameLower on user updates
export const onUserUpdate = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const oldValue = change.before.data();

    // Check if displayName changed or displayNameLower is missing
    if (
      newValue.displayName &&
      (newValue.displayName !== oldValue.displayName ||
        !newValue.displayNameLower)
    ) {
      const displayNameLower = newValue.displayName.toLowerCase();

      // Only update if the value is different
      if (newValue.displayNameLower !== displayNameLower) {
        functions.logger.log(
          `Updating displayNameLower for user ${context.params.userId}`
        );
        return change.after.ref.update({displayNameLower});
      }
    }

    return null;
  });

// One-time migration function to add displayNameLower to existing users
export const migrateDisplayNameLower = functions.https.onRequest(
  async (request, response) => {
    try {
      const db = admin.firestore();
      const usersSnapshot = await db.collection("users").get();

      let updated = 0;
      let skipped = 0;

      const batch = db.batch();
      let batchCount = 0;

      for (const doc of usersSnapshot.docs) {
        const data = doc.data();

        // Skip if displayNameLower already exists
        if (data.displayNameLower) {
          skipped++;
          continue;
        }

        // Add displayNameLower if displayName exists
        if (data.displayName) {
          batch.update(doc.ref, {
            displayNameLower: data.displayName.toLowerCase(),
          });
          updated++;
          batchCount++;

          // Firestore batch writes are limited to 500 operations
          if (batchCount >= 500) {
            await batch.commit();
            batchCount = 0;
          }
        }
      }

      // Commit any remaining updates
      if (batchCount > 0) {
        await batch.commit();
      }

      functions.logger.info(
        `Migration completed: ${updated} users updated, ${skipped} skipped`
      );
      response.json({
        success: true,
        updated,
        skipped,
        total: usersSnapshot.size,
      });
    } catch (error) {
      functions.logger.error("Migration failed", error);
      response.status(500).json({success: false, error: String(error)});
    }
  }
);

