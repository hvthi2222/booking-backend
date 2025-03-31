// db.js
const sql = require("mssql");

const config = {
  user: "sa", // hoặc tên user của bạn
  password: "123", // mật khẩu SQL Server
  server: "LAPTOP-4V65MK9B", // hoặc tên máy bạn, ví dụ LAPTOP-4V65MK9B
  database: "booking_db",
  options: {
    trustServerCertificate: true, // bắt buộc khi dùng localhost
  },
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

module.exports = {
  sql,
  pool,
  poolConnect,
};
