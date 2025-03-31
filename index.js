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

    let query = "SELECT * FROM bookings";
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
  let { name, phone, email, date, time } = req.body;

  try {
    console.log("🕒 Time nhận được từ React:", time);

    const parsed = new Date(`2000-01-01T${time}`);
    if (isNaN(parsed.getTime())) {
      return res.status(400).json({ message: "Thời gian không hợp lệ!" });
    }

    time = new Date(`1970-01-01T${time}`);

    await poolConnect;

    const request = pool.request();
    request.input("name", sql.NVarChar(100), name);
    request.input("phone", sql.NVarChar(20), phone);
    request.input("date", sql.Date, date);
    request.input("time", sql.Time, time);

    await request.query(
      "INSERT INTO bookings (name, phone, date, time) VALUES (@name, @phone, @date, @time)"
    );

    console.log("✅ Lưu thành công:", { name, phone, email, date, time });

    // Gửi email xác nhận
    await sendConfirmationEmail(email, {
      name,
      phone,
      date,
      time: time.toTimeString().slice(0, 5),
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

// Cập nhật trạng thái
app.put("/api/bookings/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await poolConnect;
    await pool.request()
      .input("id", sql.Int, id)
      .input("status", sql.NVarChar(20), status)
      .query("UPDATE bookings SET status = @status WHERE id = @id");

    res.status(200).json({ message: `Cập nhật trạng thái: ${status}` });
  } catch (err) {
    console.error("❌ Lỗi cập nhật trạng thái:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật trạng thái!" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
