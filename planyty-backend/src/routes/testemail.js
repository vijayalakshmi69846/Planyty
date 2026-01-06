const express = require("express");
const router = express.Router();
const sendEmail = require("../utils/email");

router.get("/test-email", async (req, res) => {
  try {
    await sendEmail({
      to: "yourtestmail@gmail.com",
      subject: "Planyty Email Test",
      html: "<h2>Email is working 🎉</h2>",
    });

    res.json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
