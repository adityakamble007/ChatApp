"use client";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useUser } from "@clerk/nextjs";

const Message = ({ recipientId }) => {
  const { user } = useUser();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) return; // Ensure user is defined before proceeding

    const newSocket = io("http://localhost:20670");

    newSocket.on("connect", () => {
      if (user?.id) {
        newSocket.emit("join_room", user.id);
        console.log("Connected and joined room:", user.id);
      }
    });

    newSocket.on("receive_message", (data) => {
      console.log("Private message received:", data);
      setMessages((prev) => [...prev, data]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.off("receive_message");
      newSocket.disconnect();
      console.log("Disconnected from socket");
    };
  }, [user]);

  useEffect(() => {
    if (!user || !recipientId) return; // Ensure user and recipientId are defined

    async function fetchData() {
      try {
        // Fetch messages between the current user and the recipient
        const messageResponse = await fetch(
          `http://localhost:20670/messages/${user.id}/${recipientId}`
        );
        const messagesData = await messageResponse.json();

        // Fetch recipient details from backend
        const recipientResponse = await fetch(
          `http://localhost:20670/user/${recipientId}`
        );
        const recipientData = await recipientResponse.json();

        // Fetch your own user details from backend
        const userResponse = await fetch(
          `http://localhost:20670/user/${user.id}`
        );
        const userData = await userResponse.json();

        // Enrich messages with user details
        const enrichedMessages = messagesData.map((message) => {
          const isSender = message.senderId === user.id;
          return {
            ...message,
            username: isSender ? userData.fullName : recipientData.fullName,
            image: isSender ? userData.imageUrl : recipientData.imageUrl,
          };
        });
        console.log("Enriched messages:", enrichedMessages);
        setMessages(enrichedMessages);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    }

    fetchData();
  }, [user, recipientId]);

  const sendMessage = () => {
    if (message.trim() && recipientId.trim() && user?.id) {
      const messageData = {
        senderId: user.id,
        username: user.username || user.firstName || user.email,
        text: message,
        timestamp: new Date().toISOString(),
      };
      socket.emit("send_private_message", { recipientId, messageData });
      setMessage(""); // Clear the input after sending
    }
  };

  return (
    <div className="relative flex-1">
      <header className="bg-white p-4 text-gray-700">
        <h1 className="text-2xl font-semibold">Alice</h1>
      </header>

      <div className="h-screen overflow-y-auto p-4 pb-36">
        {messages.map((msg, index) =>
          msg.senderId === user?.id ? (
            <div
              key={index}
              className="flex justify-end mb-4 cursor-pointer"
            >
              <div className="flex max-w-96 bg-indigo-500 text-white rounded-lg p-3 gap-3">
                <p>{msg.text}</p>
              </div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center ml-2">
                <img
                  src={msg.image}
                  alt="My Avatar"
                  className="w-8 h-8 rounded-full"
                />
              </div>
            </div>
          ) : (
            <div key={index} className="flex mb-4 cursor-pointer">
              <div className="w-9 h-9 rounded-full flex items-center justify-center mr-2">
                <img
                  src={msg.image}
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full"
                />
              </div>
              <div className="flex max-w-96 bg-white rounded-lg p-3 gap-3">
                <p className="text-gray-700">{msg.text}</p>
              </div>
            </div>
          )
        )}
      </div>

      <div className="bg-white border-t border-gray-300 p-4 absolute bottom-0 w-3/4 z-10">
        <div className="flex items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            aria-label="Message Input"
            className="w-full p-2 rounded-md border border-gray-400 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className={`bg-indigo-500 text-white px-4 py-2 rounded-md ml-2 ${
              !message.trim() ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Message;