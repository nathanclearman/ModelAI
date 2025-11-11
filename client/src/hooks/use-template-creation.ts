import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { createModel } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { templates, templatePrompts } from "@/lib/templates";

export function useTemplateCreation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const createTemplateMutation = useMutation({
    mutationFn: async (templateTitle: string) => {
      return createModel({
        name: templateTitle,
        description: templates.find((t) => t.title === templateTitle)?.description || "",
        systemPrompt: templatePrompts[templateTitle] || "",
        model: "gpt-4o",
        temperature: 70,
        maxTokens: 1000,
        template: templateTitle,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      toast({
        title: "Success",
        description: "Template model created",
      });
      setLocation(`/chat/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create template model",
        variant: "destructive",
      });
    },
  });

  return createTemplateMutation;
}
