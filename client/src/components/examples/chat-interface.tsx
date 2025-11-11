import { ChatInterface } from "../chat-interface";

export default function ChatInterfaceExample() {
  const demoMessages = [
    {
      role: "user" as const,
      content: "Hello! Can you help me with my order?",
      timestamp: new Date(Date.now() - 5000).toISOString(),
    },
    {
      role: "assistant" as const,
      content: "Of course! I'd be happy to help you with your order. Could you please provide me with your order number?",
      timestamp: new Date(Date.now() - 3000).toISOString(),
    },
  ];

  return (
    <div className="h-[600px] p-6">
      <ChatInterface
        modelName="Customer Support Assistant"
        initialMessages={demoMessages}
        onSendMessage={(msg) => console.log("Message sent:", msg)}
      />
    </div>
  );
}
