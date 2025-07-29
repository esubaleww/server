const mysql = require("mysql2/promise");
const url = require("url");

const dbUrl = process.env.DATABASE_URL;
const parsedUrl = new URL(dbUrl);

const db = mysql.createPool({
  host: parsedUrl.hostname, // mysql.internal
  port: parsedUrl.port || 3306,
  user: parsedUrl.username, // root
  password: parsedUrl.password, // yourpassword
  database: parsedUrl.pathname.substring(1), // removes the leading slash
});
