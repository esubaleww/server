const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});
const onlineUsers = {}; // userId -> Set of socket IDs
app.set("io", io);

// ROUTES
const studentRoutes = require("./routes/studentRoutes");
const foundItemRoutes = require("./routes/foundItemRoutes");
const lostItemRoutes = require("./routes/lostItemRoutes");
const reportRoutes = require("./routes/reports");
const profileRoutes = require("./routes/profileRoutes");
const passwordRoute = require("./routes/passwordRoute");
const deleteRoutes = require("./routes/deleteRoute");
const authRoutes = require("./routes/authRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const claimRoutes = require("./routes/claimRoutes");
const messageRoutes = require("./routes/messageRoutes");

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use routes
app.use("/api/items", deleteRoutes);
app.use("/api/users", studentRoutes);
app.use("/api/users", authRoutes);
app.use("/api/items", lostItemRoutes);
app.use("/api/items", foundItemRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/getProfile", profileRoutes);
app.use("/api/password", passwordRoute);
app.use("/api/updateProfile", profileRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/messages", messageRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Lost and Found API is working!");
});

// Download route
app.get("/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.filename);
  res.download(filePath, (err) => {
    if (err) {
      console.error("Download error:", err);
      res.status(404).send("File not found");
    }
  });
});

// Socket.IO logic
io.on("connection", (socket) => {
  socket.on("join_room", (claim_id, userId) => {
    socket.join(claim_id);
    console.log(`🟢 User ${userId} joined claim room: ${claim_id}`);

    if (!onlineUsers[userId]) {
      onlineUsers[userId] = new Set();
    }
    onlineUsers[userId].add(socket.id);

    io.emit("user_status_change", { userId, status: "online" });
  });

  socket.on("send_message", (data) => {
    // Include sender socket ID so delivery ack knows where to send
    data.senderSocketId = socket.id;

    io.to(data.claim_id).emit("receive_message", data);

    // Acknowledge to sender: sent
    socket.emit("message_sent", { tempId: data.tempId });
  });

  socket.on("ack_delivered", (data) => {
    // Notify sender their message was delivered
    io.to(data.senderSocketId).emit("message_delivered", {
      tempId: data.tempId,
    });
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);

    for (const [userId, sockets] of Object.entries(onlineUsers)) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          delete onlineUsers[userId];
          io.emit("user_status_change", { userId, status: "offline" });
        }
        break;
      }
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Something went wrong. Please try again later." });
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
