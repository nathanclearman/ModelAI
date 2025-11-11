import { ConversationCard } from "@/components/conversation-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useState } from "react";

const allConversations = [
  {
    title: "Product inquiry discussion",
    modelName: "GPT-4o",
    timestamp: "2 hours ago",
    preview: "Customer asking about product specifications and pricing...",
    messageCount: 12,
  },
  {
    title: "Technical support case",
    modelName: "GPT-4.1",
    timestamp: "5 hours ago",
    preview: "Troubleshooting API integration issues with customer...",
    messageCount: 8,
  },
  {
    title: "Content review session",
    modelName: "GPT-5",
    timestamp: "Yesterday",
    preview: "Reviewing and refining marketing copy for new campaign...",
    messageCount: 15,
  },
  {
    title: "Data analysis request",
    modelName: "GPT-4o",
    timestamp: "2 days ago",
    preview: "Analyzing quarterly sales data and generating insights...",
    messageCount: 20,
  },
  {
    title: "Code debugging session",
    modelName: "GPT-4.1",
    timestamp: "3 days ago",
    preview: "Helping debug React component rendering issues...",
    messageCount: 18,
  },
  {
    title: "HR policy consultation",
    modelName: "GPT-5",
    timestamp: "4 days ago",
    preview: "Reviewing and updating employee handbook policies...",
    messageCount: 10,
  },
];

export default function History() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModel, setFilterModel] = useState("all");

  const filteredConversations = allConversations.filter((conv) => {
    const matchesSearch =
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.preview.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModel = filterModel === "all" || conv.modelName === filterModel;
    return matchesSearch && matchesModel;
  });

  return (
    <div className="space-y-16">
      <div className="py-12">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4">Conversation History</h1>
        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
          View and manage your past AI conversations
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-conversations"
          />
        </div>
        <Select value={filterModel} onValueChange={setFilterModel}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-filter-model">
            <SelectValue placeholder="Filter by model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Models</SelectItem>
            <SelectItem value="GPT-4o">GPT-4o</SelectItem>
            <SelectItem value="GPT-4.1">GPT-4.1</SelectItem>
            <SelectItem value="GPT-5">GPT-5</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredConversations.map((conversation, index) => (
          <ConversationCard
            key={index}
            {...conversation}
            onClick={() => console.log("Open conversation:", conversation.title)}
            onDelete={() => console.log("Delete conversation:", conversation.title)}
          />
        ))}
      </div>

      {filteredConversations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No conversations found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
