import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, User, Bot, Image as ImageIcon, Sparkles, Upload } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message } from "@shared/schema";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ChatInterfaceProps {
  modelName?: string;
  onSendMessage?: (message: string, imageData?: string) => void;
  onGenerateImage?: (prompt: string) => void;
  onAnalyzeImage?: (imageData: string, prompt: string) => void;
  initialMessages?: Message[];
  isLoading?: boolean;
  canUseImages?: boolean; // Whether user has access to premium image features
  disabled?: boolean; // Whether chat input is disabled
  disabledMessage?: string; // Custom message to show when disabled
}

export function ChatInterface({ 
  modelName = "AI Assistant", 
  onSendMessage, 
  onGenerateImage,
  onAnalyzeImage,
  initialMessages = [], 
  isLoading: externalIsLoading = false,
  canUseImages = false,
  disabled = false,
  disabledMessage = "Chat is currently disabled"
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedImageForView, setSelectedImageForView] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedImage(dataUrl);
      setImagePreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || externalIsLoading) return;

    const trimmedInput = input.trim();
    
    if (selectedImage && onAnalyzeImage) {
      // Send image for analysis
      onAnalyzeImage(selectedImage, trimmedInput || "Analyze this image");
      clearSelectedImage();
    } else if (onSendMessage) {
      onSendMessage(trimmedInput);
    }
    
    setInput("");
  };

  const handleGenerateImage = () => {
    if (!input.trim() || !onGenerateImage || externalIsLoading) return;
    
    const trimmedInput = input.trim();
    setInput("");
    onGenerateImage(trimmedInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="border-b p-4">
        <h3 className="font-semibold">{modelName}</h3>
        <p className="text-sm text-muted-foreground">Chat with your AI model</p>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && !disabled && (
            <div className="text-center py-12 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Start a conversation with your AI model</p>
            </div>
          )}
          {messages.length === 0 && disabled && (
            <div className="text-center py-12 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">{disabledMessage}</p>
              <p className="text-sm mt-2">Configure and save your model to start chatting</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              data-testid={`message-${message.role}-${index}`}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                }`}
              >
                {message.imageUrl && (
                  <div className="mb-2">
                    <img
                      src={message.imageUrl}
                      alt={message.imageType === "generated" ? "Generated image" : "Uploaded image"}
                      className="rounded-md max-w-full cursor-pointer hover-elevate"
                      style={{ maxHeight: "300px", objectFit: "contain" }}
                      onClick={() => setSelectedImageForView(message.imageUrl!)}
                      data-testid={`image-${message.imageType}-${index}`}
                    />
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <p className="text-xs opacity-60 mt-1.5">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {message.role === "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-secondary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {externalIsLoading && messages.length > 0 && messages[messages.length - 1].role === "assistant" && messages[messages.length - 1].content === "" && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        {imagePreviewUrl && (
          <div className="mb-3 flex items-center gap-2 p-2 bg-muted rounded-md">
            <img
              src={imagePreviewUrl}
              alt="Selected image"
              className="h-16 w-16 rounded object-cover"
              data-testid="image-preview"
            />
            <span className="text-sm flex-1">Image selected</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelectedImage}
              data-testid="button-clear-image"
            >
              Remove
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          {canUseImages && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                data-testid="input-image-upload"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || externalIsLoading || !!selectedImage}
                className="h-[60px] w-[60px]"
                data-testid="button-upload-image"
              >
                <Upload className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleGenerateImage}
                disabled={disabled || !input.trim() || externalIsLoading}
                className="h-[60px] w-[60px]"
                data-testid="button-generate-image"
              >
                <Sparkles className="h-5 w-5" />
              </Button>
            </>
          )}
          <Textarea
            placeholder={disabled ? "Save model to start chatting..." : "Type your message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="resize-none min-h-[60px]"
            disabled={disabled}
            data-testid="textarea-chat-input"
          />
          <Button
            onClick={handleSend}
            disabled={disabled || (!input.trim() && !selectedImage) || externalIsLoading}
            size="icon"
            className="h-[60px] w-[60px]"
            data-testid="button-send-message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Image fullscreen dialog */}
      <Dialog open={!!selectedImageForView} onOpenChange={(open) => !open && setSelectedImageForView(null)}>
        <DialogContent className="max-w-4xl" data-testid="dialog-image-fullscreen">
          {selectedImageForView && (
            <img
              src={selectedImageForView}
              alt="Full size image"
              className="w-full h-auto rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
