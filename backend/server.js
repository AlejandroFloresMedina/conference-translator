const express = require("express");
const cors = require("cors");
const { AccessToken } = require("livekit-server-sdk");

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = "devkey";
const apiSecret = "9f2c3a7b4d8e9f1a2b3c4d5e6f7a8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6";

app.post("/get-token", async (req, res) => { // Must be async
  const { room, username } = req.body;
  const at = new AccessToken(apiKey, apiSecret, { identity: username });
  at.addGrant({ roomJoin: true, room: room });

  const token = await at.toJwt(); // Must use await
  res.json({ token });
});

app.listen(5000, "0.0.0.0", () => {
  console.log("Backend running on port 5000");
});