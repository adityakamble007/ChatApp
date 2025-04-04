"use client";
import { useState, useEffect } from "react";

import { useUser } from "@clerk/nextjs";
import Message from "./Message";


const MessageBar = () => {
  const { user } = useUser();
  const [recipientId, setRecipientId] = useState("");
  const [recipientId1, setRecipientId1] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [channels, setChannels] = useState([]);
  const [triggerEffect, setTriggerEffect] = useState(false);
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

  useEffect(() => {
    if (!user) return;

    async function fetchChannels() {
      try {
        // Helper function to fetch user name by recipientId
        async function getUserName(recipientId) {
          try {
            const response = await fetch(
              `http://localhost:20670/user/${recipientId}`
            );
            const userData = await response.json();
            return {
              fullName: userData?.fullName || "Unknown User",
              imageUrl:
                userData?.imageUrl ||
                "https://placehold.co/200x/ffa8e4/ffffff.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato",
            };
          } catch (err) {
            console.error("Error fetching user name:", err);
            return {
              fullName: "Unknown User",
              imageUrl:
                "https://placehold.co/200x/ffa8e4/ffffff.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato",
            };
          }
        }

        // Fetch messages first
        const response = await fetch(
          `http://localhost:20670/messages/${user.id}`
        );
        const data = await response.json();
        console.log("Channels fetched:", data);

        // Remove duplicates based on recipientId
        const uniqueData = Array.from(
          new Map(data.map((item) => [item.recipientId, item])).values()
        );

        // Fetch recipient names and update the data
        const updatedData = await Promise.all(
          uniqueData.map(async (msg) => {
            const { fullName, imageUrl } = await getUserName(msg.recipientId); // Use getUserName here
            return {
              ...msg,
              recipientName: fullName,
              recipientImage: imageUrl,
            };
          })
        );

        setChannels(updatedData);
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
  function handleRecipientClick(recipientId) {
    console.log("Recipient ID clicked:", recipientId);
    setRecipientId1(recipientId);
    setTriggerEffect((prev) => !prev);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/4 bg-white border-r border-gray-300">
        {/* Sidebar Header */}
        <header className="p-4 border-b border-gray-300 flex justify-between items-center bg-indigo-600 text-white">
          <h1 className="text-2xl font-semibold">Chat Web</h1>
          <div className="relative">
            <button className="focus:outline-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-100"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path d="M2 10a2 2 0 012-2h12a2 2 0 012 2 2 2 0 01-2 2H4a2 2 0 01-2-2z" />
              </svg>
            </button>
            {/* Menu Dropdown */}
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg hidden">
              <ul className="py-2 px-3">
                <li>
                  <a
                    href="#"
                    className="block px-4 py-2 text-gray-800 hover:text-gray-400"
                  >
                    Option 1
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="block px-4 py-2 text-gray-800 hover:text-gray-400"
                  >
                    Option 2
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </header>

        {/* Contact List */}
        <div className="overflow-y-auto h-screen p-3 mb-9 pb-20">
          {channels.map((msg) => (
            <div
              key={msg._id}
              
              
            >
              <div className="flex items-center mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded-md" onClick={() => handleRecipientClick(msg.recipientId)}>
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-3">
                  <img
                    src={msg.recipientImage}
                    alt="User Avatar"
                    className="w-12 h-12 rounded-full"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{msg.recipientName}</h2>
                  {/* <p className="text-gray-600">{msg.recipientId}</p> */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Chat Area */} 
      {recipientId1 ? (
  <Message recipientId={recipientId1} /> // Pass recipientId1 directly
) : (
  <div className="flex items-center justify-center h-full">
    <p className="text-gray-500">Select a contact to start chatting</p>
  </div>
)}    
    </div>
  );
};

export default MessageBar;
