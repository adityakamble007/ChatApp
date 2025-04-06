const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const Message = require('./models/Messages'); // Adjust path as needed
const clerk = require('./clerk'); // Adjust path as needed
require('dotenv').config();
const app = express();
app.use(cors());

mongoose.connect('mongodb://localhost:27017/chatapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("join_room", (userId) => {
    socket.join(userId); // Join the room using the user ID
    console.log(`User ${socket.id} joined room: ${userId}`);
  });
  // Save and emit private messages
  socket.on("send_private_message", async ({ recipientId, messageData }) => {
    try {
      // Ensure messageData contains the necessary fields
      if (!messageData.senderId || !messageData.text) {
        throw new Error("Invalid message data");
      }

      const newMessage = new Message({
        senderId: messageData.senderId,
        recipientId: recipientId,
        text: messageData.text,
        timestamp: new Date(),
      });

      await newMessage.save();
      console.log(`Message saved and sent to ${recipientId}: ${messageData.text}`);

      // Emit the message to both the recipient and the sender
      io.to(recipientId).emit("receive_message", messageData);
      io.to(messageData.senderId).emit("receive_message", messageData); // For sender
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


app.get('/messages/:user1/:user2', async (req, res) => {
    const { user1, user2 } = req.params;
    try {
      const messages = await Message.find({
        $or: [
          { senderId: user1, recipientId: user2 },
          { senderId: user2, recipientId: user1 },
        ],
      }).sort({ timestamp: 1 }); // Sort by time (oldest to newest)
      res.json(messages);
    } catch (err) {
      res.status(500).send('Error fetching messages');
    }
  });

  app.get('/messages/:user1', async (req, res) => {
    const { user1 } = req.params;
    try {
      const messages = await Message.find({
        $or: [
          { senderId: user1}, 
        ],
      }).sort({ timestamp: 1 }); // Sort by time (oldest to newest)
      res.json(messages);
    } catch (err) {
      res.status(500).send('Error fetching messages');
    }
  });

  app.get("/user/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const user = await clerk.users.getUser(id);
      const imageUrl = user.imageUrl || "https://example.com/default-image.png"; // Default image URL
      const fullName = `${user.firstName} ${user.lastName}`.trim() || "Unknown User";
      res.json({ imageUrl, fullName });
    } catch (err) {
      console.error("Error fetching user data:", err);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });  

  app.get("/search-users", async (req, res) => {
    const query = req.query.query;
    if (!query) return res.status(400).json({ error: "Query is required" });
  
    try {
      const axios = require("axios"); // Import axios here or at the top
  
      const response = await axios.get("https://api.clerk.com/v1/users", {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`, // Use .env variable
        },
        params: {
          query,
          limit: 10,
        },
      });
  
      const users = response.data.map((user) => ({
        recipientId: user.id,
        email: user.email_addresses?.[0]?.email_address,
        fullName: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        imageUrl: user.image_url,
      }));
  
      res.json(users);
    } catch (err) {
      console.error("Error searching users:", err);
      res.status(500).json({ error: "Failed to search users" });
    }
  });
  
server.listen(20670, () => {
  console.log('Server running on http://localhost:20670');
});
