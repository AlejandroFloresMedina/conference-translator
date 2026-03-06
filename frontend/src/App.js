import React, { useState, useRef } from "react";
import { Room, createLocalAudioTrack, RoomEvent } from "livekit-client";
import axios from "axios";

function App() {
  const [connected, setConnected] = useState(false);
  const [role, setRole] = useState(null);
  const [roomInstance, setRoomInstance] = useState(null);
  const [muted, setMuted] = useState(false);

  const SERVER_HOST = window.location.hostname;
  const PROTOCOL = window.location.protocol === "https:" ? "https" : "http";
  const WS_PROTOCOL = window.location.protocol === "https:" ? "wss" : "ws";


  // Dedicated container for audio elements
  const audioContainerRef = useRef(null);

  const connectToRoom = async (selectedRole) => {
    try {
      const response = await axios.post(`${PROTOCOL}://${SERVER_HOST}:5000/get-token`, {
        room: "conference-room",
        username: `${selectedRole}-${Math.floor(Math.random() * 1000)}`,
      });

      const token = response.data.token;

      const room = new Room();

      // When we receive audio
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === "audio") {
          const audioElement = track.attach();
          audioElement.autoplay = true;
          audioContainerRef.current?.appendChild(audioElement);
        }
      });

      // When a track is removed (detaches audio elements)
      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((el) => el.remove());
      });

      // ParticipantDisconnected: no manual cleanup needed
      room.on(RoomEvent.ParticipantDisconnected, () => { /* no-op */ });

      await room.connect(`${WS_PROTOCOL}://${SERVER_HOST}:7880`, token);

      // If speaker, publish mic
      if (selectedRole === "speaker") {
        const track = await createLocalAudioTrack({
          echoCancellation: true,
          noiseSuppression: true,
        });
        await room.localParticipant.publishTrack(track);
      }

      setRoomInstance(room);
      setRole(selectedRole);
      setConnected(true);

    } catch (err) {
      console.error("Error connecting to room:", err);
      alert("Could not connect. Check console.");
    }
  };

  const stopSession = async () => {
    if (!roomInstance) return;

    try {
      // Stop all local tracks
      const publications = Array.from(
        roomInstance.localParticipant.trackPublications.values()
      );
      publications.forEach((pub) => pub.track?.stop());

      // Disconnect safely
      try {
        await roomInstance.disconnect();
      } catch (err) {
        console.warn("LiveKit disconnect warning:", err);
      }

    } catch (err) {
      console.error("Error stopping session:", err);
    }

    // Clean up audio elements
    if (audioContainerRef.current) {
      audioContainerRef.current.innerHTML = "";
    }

    setConnected(false);
    setRole(null);
    setRoomInstance(null);
    setMuted(false);
  };

  const toggleMute = async () => {
  if (!roomInstance || role !== "speaker") return;

  try {
    const newMutedState = !muted;

    // LiveKit way to mute/unmute the local mic
    await roomInstance.localParticipant.setMicrophoneEnabled(!newMutedState);

    setMuted(newMutedState);
  } catch (err) {
    console.error("Error toggling mute:", err);
  }
};

  return (
    <div style={{ padding: 40 }}>
      <h1>Church Conference Translator</h1>

      {/* Audio container for all incoming tracks */}
      <div ref={audioContainerRef} />

      {!connected ? (
        <>
          <button
            onClick={() => connectToRoom("speaker")}
            style={{ padding: "10px 20px", fontSize: "16px", marginRight: 20 }}
          >
            Join as Speaker 🎤
          </button>

          <button
            onClick={() => connectToRoom("listener")}
            style={{ padding: "10px 20px", fontSize: "16px" }}
          >
            Join as Listener 🎧
          </button>
        </>
      ) : (
        <>
          <div style={{ color: "green", marginBottom: 20 }}>
            <h2>
              Connected as {role === "speaker" ? "Speaker 🎤" : "Listener 🎧"}
            </h2>
          </div>

          {role === "speaker" && (
            <button
              onClick={toggleMute}
              style={{
                padding: "10px 20px",
                fontSize: "16px",
                marginRight: 20,
                backgroundColor: muted ? "#ffa500" : "#4CAF50",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              {muted ? "Unmute Mic 🎤" : "Mute Mic 🎤"}
            </button>
          )}

          <button
            onClick={stopSession}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              marginRight: 20,
              backgroundColor: "#ff4d4d",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Stop
          </button>

          <button
            onClick={stopSession}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#555",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Back to Home
          </button>
        </>
      )}
    </div>
  );
}

export default App;