const { OTP, User } = require('../models');
const { sendOtpMail } = require('../services/email.service');

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // delete old OTP if exists
    await OTP.destroy({ where: { email } });

    // ✅ GENERATE OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // ✅ SAVE OTP
    await OTP.create({
      email,
      otp: otpCode,
      expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
    });

    // ✅ SEND MAIL
    await sendOtpMail(email, otpCode);

    return res.json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({
      message: 'Failed to send OTP',
    });
  }
};
exports.verifyOtp = async (req, res) => {
  const { email, code } = req.body;

  const record = await OTP.findOne({ where: { email, otp: code } });

  if (!record) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  if (record.expires_at < new Date()) {
    return res.status(400).json({ message: 'OTP expired' });
  }

  await OTP.destroy({ where: { email } });

  return res.json({ success: true });
};
