const { sql, pool, poolConnect } = require("./db");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sendConfirmationEmail = require("./mailer");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("🎉 API đặt lịch đang hoạt động!");
});

// Lấy danh sách có lọc theo ngày
app.get("/api/bookings", async (req, res) => {
  try {
    await poolConnect;
    const date = req.query.date;

    let query = "SELECT id, name, phone, email, date, shift FROM bookings";
    if (date) {
      query += " WHERE CONVERT(date, date) = @date";
    }
    query += " ORDER BY id DESC";

    const request = pool.request();
    if (date) {
      request.input("date", sql.Date, date);
    }

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách:", err);
    res.status(500).json({ message: "Lỗi khi truy vấn dữ liệu" });
  }
});

// Đặt lịch + gửi email
app.post("/api/bookings", async (req, res) => {
  const { name, phone, email, date, shift } = req.body;

  if (!["sáng", "chiều", "tối"].includes(shift)) {
    return res.status(400).json({ message: "Ca không hợp lệ!" });
  }

  try {
    await poolConnect;

    const request = pool.request();
    request.input("name", sql.NVarChar(100), name);
    request.input("phone", sql.NVarChar(20), phone);
    request.input("email", sql.NVarChar(100), email);
    request.input("date", sql.Date, date);
    request.input("shift", sql.NVarChar(10), shift);

    await request.query(`
      INSERT INTO bookings (name, phone, email, date, shift)
      VALUES (@name, @phone, @email, @date, @shift)
    `);

    console.log("✅ Lưu thành công:", { name, phone, email, date, shift });

    await sendConfirmationEmail(email, {
      name,
      phone,
      date,
      time: shift, // ghi 'ca' thay vì giờ
    });

    res.status(201).json({ message: "Đặt lịch thành công và đã gửi email!" });
  } catch (err) {
    console.error("❌ Lỗi khi lưu vào SQL Server hoặc gửi email:", err);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

// Xoá lịch
app.delete("/api/bookings/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await poolConnect;
    await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM bookings WHERE id = @id");

    res.status(200).json({ message: "Đã xóa lịch hẹn!" });
  } catch (err) {
    console.error("❌ Lỗi khi xóa:", err);
    res.status(500).json({ message: "Lỗi server khi xóa!" });
  }
});

// (Không còn cần cập nhật trạng thái nữa)

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
