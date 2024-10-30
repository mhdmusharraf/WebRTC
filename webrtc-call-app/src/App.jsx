import React, { useRef, useEffect, useState } from "react";
import { db } from "./firebase"; // Firestore reference
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const App = () => {
  const peerConnectionRef = useRef(null);
  const [callId, setCallId] = useState("");
  const [joinCallId, setJoinCallId] = useState("");
  const [transcript, setTranscript] = useState("");
  const [bothJoined, setBothJoined] = useState(false); // Ensures both users joined before transcribing
  const { transcript: speechTranscript, resetTranscript } =
    useSpeechRecognition();
  let unsubscribe = useRef(null);

  useEffect(() => {
    const setupPeerConnection = async () => {
      peerConnectionRef.current = new RTCPeerConnection();

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          // Handle ICE candidates - store in Firestore as needed
        }
      };

      peerConnectionRef.current.ondatachannel = (event) => {
        const receiveChannel = event.channel;
        receiveChannel.onmessage = (e) => {
          setTranscript((prev) => prev + "\n" + e.data);
        };
      };
    };

    setupPeerConnection();
  }, []);

  // Start a call by creating an offer
  const startCall = async () => {
    try {
      const callDocRef = doc(collection(db, "calls"));
      setCallId(callDocRef.id);

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      await setDoc(callDocRef, { offer });

      unsubscribe.current = onSnapshot(callDocRef, (snapshot) => {
        const data = snapshot.data();
        if (
          data?.answer &&
          !peerConnectionRef.current.currentRemoteDescription
        ) {
          peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          setBothJoined(true);
          startTranscription();
        }
      });

      requestMicrophoneAccess();
    } catch (error) {
      console.error("Error starting call:", error);
    }
  };

  // Join a call by creating an answer
  const joinCall = async () => {
    if (!joinCallId) return;
    const callDocRef = doc(db, "calls", joinCallId);

    try {
      const callData = (await getDoc(callDocRef)).data();
      if (!callData?.offer) throw new Error("Call offer not found.");

      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(callData.offer)
      );

      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      await updateDoc(callDocRef, { answer });

      requestMicrophoneAccess(() => {
        setBothJoined(true);
        startTranscription();
      });
    } catch (error) {
      console.error("Error joining call:", error);
      alert("Failed to join call. Please check the call ID and try again.");
    }
  };

  // Request microphone access
  const requestMicrophoneAccess = (callback) => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        console.log("Microphone access granted.");
        SpeechRecognition.startListening({
          continuous: true,
          language: "en-US",
        });
        if (callback) callback();
      })
      .catch((err) => {
        console.error("Error accessing microphone:", err);
        alert("Microphone access is required. Please check settings.");
      });
  };

  // Start transcribing once both users are connected
  const startTranscription = () => {
    if (bothJoined) {
      SpeechRecognition.startListening({
        continuous: true,
        language: "en-US",
      });
    }
  };

  // End the call for both ends
  const endCall = () => {
    if (unsubscribe.current) unsubscribe.current(); // Unsubscribe Firebase listener
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    peerConnectionRef.current = null;
    setCallId("");
    setJoinCallId("");
    setTranscript("");
    setBothJoined(false);
    SpeechRecognition.stopListening();
    console.log("Call ended.");
  };

  // Update transcript with speech recognition result
  useEffect(() => {
    if (speechTranscript) {
      setTranscript((prev) => prev + (prev ? " " : "") + speechTranscript);
      resetTranscript(); // Reset after updating transcript
    }
  }, [speechTranscript]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white p-6">
      <h1 className="text-4xl font-bold mb-8">WebRTC Call App</h1>

      <div className="w-full max-w-md">
        <button
          onClick={startCall}
          className="w-full py-3 mb-6 bg-green-500 hover:bg-green-600 rounded-lg text-xl font-semibold transition duration-200"
        >
          Start Call
        </button>

        {callId && (
          <p className="bg-white text-black p-4 rounded-md mb-6 text-center">
            Call ID (Share this to join): <strong>{callId}</strong>
          </p>
        )}

        <input
          type="text"
          value={joinCallId}
          onChange={(e) => setJoinCallId(e.target.value)}
          placeholder="Enter Call ID to Join"
          className="w-full p-3 rounded-md text-black mb-4"
        />

        <button
          onClick={joinCall}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-xl font-semibold transition duration-200"
        >
          Join Call
        </button>

        <button
          onClick={endCall}
          className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-lg text-xl font-semibold transition duration-200 mt-4"
        >
          End Call
        </button>

        <textarea
          value={transcript}
          readOnly
          className="w-full p-4 mt-6 bg-white text-black rounded-md h-40"
          placeholder="Conversation transcript will appear here..."
        ></textarea>
      </div>
    </div>
  );
};

export default App;
