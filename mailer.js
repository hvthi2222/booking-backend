const nodemailer = require("nodemailer");

// ⚠️ Bạn cần dùng email thật (Gmail dễ nhất)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "hoangducchinh2002@gmail.com", // ← thay bằng email thật
    pass: "yhas jgys zenl zfju",    // ← mật khẩu ứng dụng (không phải mật khẩu đăng nhập)
  },
});

const sendConfirmationEmail = (to, booking) => {
  const mailOptions = {
    from: '"Lịch hẹn đến WorkShop KEYCHAIN" <your_email@gmail.com>',
    to: to,
    subject: "Xác nhận lịch hẹn",
    html: `
      <h3>Chào ${booking.name},</h3>
      <p>Bạn đã đặt lịch thành công tại quán:</p>
      <ul>
        <li>📅 Ngày: <b>${booking.date}</b></li>
        <li>🕒 Giờ: <b>${booking.time}</b></li>
        <li>📞 Số điện thoại: <b>${booking.phone}</b></li>
      </ul>
      <p>Hẹn gặp bạn tại quán nhé! ☕</p>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendConfirmationEmail;
