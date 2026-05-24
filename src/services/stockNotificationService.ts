import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

const SITE_URL = "https://lifestore.ge";

export const stockNotificationService = {
  async subscribe(
    productId: string,
    productName: string,
    email: string
  ): Promise<void> {
    const existing = await getDocs(
      query(
        collection(db, "stockNotifications"),
        where("productId", "==", productId),
        where("email", "==", email),
        where("notified", "==", false)
      )
    );
    if (!existing.empty) return;

    await addDoc(collection(db, "stockNotifications"), {
      productId,
      productName,
      email,
      notified: false,
      createdAt: serverTimestamp(),
    });
  },

  async sendNotifications(
    productId: string,
    productName: string,
    productSlug: string
  ): Promise<void> {
    const snap = await getDocs(
      query(
        collection(db, "stockNotifications"),
        where("productId", "==", productId),
        where("notified", "==", false)
      )
    );

    if (snap.empty) return;

    const productUrl = `${SITE_URL}/product/${productSlug}`;

    for (const docSnap of snap.docs) {
      const { email } = docSnap.data();

      await addDoc(collection(db, "mail"), {
        to: [email],
        message: {
          subject: `✅ ${productName} — ისევ გაყიდვაშია!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #059669; margin-bottom: 8px;">სიახლე Life Store-იდან 🌿</h2>
              <p style="color: #44403c;">გამარჯობა,</p>
              <p style="color: #44403c;">თქვენ მიერ არჩეული პროდუქტი კვლავ ხელმისაწვდომია:</p>
              <h3 style="color: #1c1917; font-size: 18px; margin: 16px 0;">${productName}</h3>
              <a href="${productUrl}"
                 style="display: inline-block; background: #059669; color: white; padding: 14px 28px;
                        border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 15px;">
                პროდუქტის ნახვა →
              </a>
              <p style="margin-top: 32px; color: #a8a29e; font-size: 12px;">
                © Life Store &nbsp;|&nbsp; <a href="${SITE_URL}" style="color: #a8a29e;">lifestore.ge</a>
              </p>
            </div>
          `,
        },
      });

      await updateDoc(doc(db, "stockNotifications", docSnap.id), {
        notified: true,
        notifiedAt: serverTimestamp(),
      });
    }
  },
};
