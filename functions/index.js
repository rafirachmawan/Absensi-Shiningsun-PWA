const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.updatePassword = functions.https.onRequest(async (req, res) => {
  // 🔥 biar bisa dipanggil dari frontend
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    const { uid, newPassword } = req.body;

    if (!uid || !newPassword) {
      return res.status(400).json({ error: "Data tidak lengkap" });
    }

    await admin.auth().updateUser(uid, {
      password: newPassword,
    });

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
