import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GitBranch, X, Check } from "lucide-react";
import { createConversationBranch, getConversationBranches, switchConversationBranch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConversationBranchingProps {
  conversationId: string;
  messageId: string;
  onBranchCreated?: () => void;
  onBranchSwitched?: () => void;
}

export function ConversationBranching({
  conversationId,
  messageId,
  onBranchCreated,
  onBranchSwitched,
}: ConversationBranchingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchName, setBranchName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadBranches = async () => {
    try {
      const data = await getConversationBranches(conversationId);
      setBranches(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load branches",
        variant: "destructive",
      });
    }
  };

  const handleCreateBranch = async () => {
    if (!branchName.trim()) {
      toast({
        title: "Error",
        description: "Branch name is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await createConversationBranch(conversationId, messageId, branchName);
      toast({
        title: "Success",
        description: "Branch created successfully",
      });
      setBranchName("");
      await loadBranches();
      onBranchCreated?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create branch",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchBranch = async (branchId: string | null) => {
    setIsLoading(true);
    try {
      await switchConversationBranch(conversationId, branchId);
      toast({
        title: "Success",
        description: "Switched branch successfully",
      });
      setIsOpen(false);
      onBranchSwitched?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to switch branch",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open) {
        loadBranches();
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          <GitBranch className="h-3 w-3 mr-1" />
          Branch
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Conversation Branches</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="branch-name">Create New Branch</Label>
            <div className="flex gap-2">
              <Input
                id="branch-name"
                placeholder="Branch name..."
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateBranch();
                  }
                }}
              />
              <Button onClick={handleCreateBranch} disabled={isLoading || !branchName.trim()}>
                Create
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Existing Branches</Label>
            <ScrollArea className="h-48 border rounded-md p-2">
              <div className="space-y-2">
                <button
                  onClick={() => handleSwitchBranch(null)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors flex items-center justify-between"
                  disabled={isLoading}
                >
                  <span className="text-sm">Main Branch</span>
                  <Check className="h-4 w-4 text-primary" />
                </button>
                {branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <button
                      onClick={() => handleSwitchBranch(branch.id)}
                      className="flex-1 text-left text-sm"
                      disabled={isLoading}
                    >
                      {branch.branchName || `Branch ${branch.id.slice(0, 8)}`}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {branch.messages?.length || 0} messages
                    </span>
                  </div>
                ))}
                {branches.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No branches yet. Create one to explore different conversation paths.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

