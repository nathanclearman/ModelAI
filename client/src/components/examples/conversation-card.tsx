import { ConversationCard } from "../conversation-card";

export default function ConversationCardExample() {
  return (
    <div className="p-6 max-w-2xl">
      <ConversationCard
        title="Product inquiry discussion"
        modelName="GPT-4o"
        timestamp="2 hours ago"
        preview="Customer asking about product specifications and pricing..."
        messageCount={12}
        onClick={() => console.log("Conversation clicked")}
        onDelete={() => console.log("Delete clicked")}
      />
    </div>
  );
}
