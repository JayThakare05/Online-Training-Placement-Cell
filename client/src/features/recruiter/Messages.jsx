import { useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";

export default function Messages() {
  const [messages, setMessages] = useState([
    { sender: "Keval Thakare", text: "Hello, I applied for the React Developer role." },
    { sender: "Recruiter", text: "Thanks Jay, we’ll get back to you soon." }
  ]);
  const [newMessage, setNewMessage] = useState("");

  const sendMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, { sender: "Recruiter", text: newMessage }]);
      setNewMessage("");
    }
  };

  return (
    <DashboardLayout>
    <div className="p-6 flex flex-col h-[80vh]">
      <h2 className="text-xl font-bold mb-4">Messages</h2>
      <div className="flex-1 overflow-y-auto border p-4 rounded space-y-2">
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`p-2 rounded ${msg.sender === "Recruiter" ? "bg-blue-100 self-end" : "bg-gray-100 self-start"}`}
          >
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <div className="flex mt-3 space-x-2">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="border px-3 py-2 rounded w-full"
        />
        <button 
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
    </DashboardLayout>
  );
}
