const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const AI_SERVICE_URL = "http://localhost:8000/translate"; // local AI service

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("audio-chunk", async (data) => {
    try {
      // Forward chunk to AI service
      const response = await axios.post(AI_SERVICE_URL, data);
      io.emit("translated-audio", response.data.translated_audio);
    } catch (err) {
      console.error("AI service error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(5000, () => console.log("Backend running on port 5000"));