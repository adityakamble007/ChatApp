"use client";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useUser } from "@clerk/nextjs";

const socket = io("http://localhost:20670");

const Message = () => {
  const { user } = useUser();
  const [recipientId, setRecipientId] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [channels, setChannels] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  // Load theme preference from local storage
  useEffect(() => {
    const storedTheme = localStorage.getItem("darkMode");
    setDarkMode(storedTheme === "true");
  }, []);

  // Toggle theme and store preference
  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem("darkMode", newTheme);
  };

  // Establish connection and listen for messages
  useEffect(() => {
    if (!user) return;

    socket.emit("join_room", user.id);

    socket.on("receive_message", (data) => {
      console.log("Private message received:", data);
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("receive_message");
      socket.disconnect();
    };
  }, [user]);




  useEffect(() => {
    if (!user || !recipientId) return;

    async function fetchMessages() {
      try {
        const response = await fetch(
          `http://localhost:20670/messages/${user.id}/${recipientId}`
        );
        const data = await response.json();
        setMessages(data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    }

    fetchMessages();
  }, [user, recipientId]);

  useEffect(() => {
    if (!user) return;

    async function fetchChannels() {
      try {
        const response = await fetch(
          `http://localhost:20670/messages/${user.id}`
        );
        const data = await response.json();
        console.log("Channels fetched:", data);
        setChannels(data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    }

    fetchChannels();
  }, [user]);

  const sendMessage = () => {
    if (message.trim() && recipientId.trim() && user) {
      const messageData = {
        senderId: user.id,
        username: user.username || user.firstName || user.email,
        text: message,
        timestamp: new Date().toISOString(),
      };
      socket.emit("send_private_message", { recipientId, messageData });
      setMessages((prev) => [...prev, messageData]);
      setMessage("");
    }
  };

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="flex flex-col items-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
        <div className="flex justify-between items-center w-full max-w-md mb-4">
          <h2 className="text-2xl font-bold dark:text-white">
            Direct Messaging
          </h2>
          <button
            onClick={toggleTheme}
            className="text-sm px-3 py-1 bg-gray-300 dark:bg-gray-700 text-black dark:text-white rounded-lg"
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        <input
          type="text"
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
          placeholder="Enter recipient ID"
          className="border rounded-lg p-2 mb-2 w-full max-w-md dark:bg-gray-800 dark:text-white"
        />

        <div className="w-full max-w-md h-64 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 overflow-y-auto mb-2">
          <ul className="space-y-2">
            {messages.map((msg, index) => (
              <li
                key={index}
                className={`p-2 rounded-lg ${
                  msg.senderId === user.id
                    ? "bg-blue-500 text-white self-end"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 self-start"
                }`}
              >
                <strong>
                  {msg.senderId === user.id ? "You" : msg.username}:
                </strong>{" "}
                {msg.text}
                <br />
                <small className="text-gray-500 dark:text-gray-400">
                  {new Date(msg.timestamp).toLocaleString()}
                </small>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex w-full max-w-md">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message"
            className="border rounded-l-lg p-2 w-full dark:bg-gray-800 dark:text-white"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700"
          >
            Send
          </button>
        </div>
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">All Recipient IDs</h2>
          <div className="w-full max-w-md h-64 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 overflow-y-auto mb-2">
            <ul className="space-y-2">
              {channels.map((msg, index) => (
                <li
                  key={index}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700"
                >
                  <p>{msg.recipientId}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Message;

