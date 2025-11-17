import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { executeCode } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language, className = "" }: CodeBlockProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<{ output: string; error?: string; executionTime: number } | null>(null);
  const { toast } = useToast();

  const detectedLanguage = language?.toLowerCase() || detectLanguage(code);
  const canExecute = detectedLanguage === "python" || detectedLanguage === "javascript";

  function detectLanguage(code: string): string {
    // Simple heuristics
    if (code.includes("import ") || code.includes("def ") || code.includes("print(")) {
      return "python";
    }
    if (code.includes("const ") || code.includes("let ") || code.includes("function ") || code.includes("console.log")) {
      return "javascript";
    }
    return "text";
  }

  const handleExecute = async () => {
    if (!canExecute) return;

    setIsExecuting(true);
    setResult(null);

    try {
      const execResult = await executeCode(code, detectedLanguage as "python" | "javascript");
      setResult(execResult);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to execute code";
      const isDisabled = errorMessage.includes("disabled") || errorMessage.includes("403");
      
      if (isDisabled) {
        toast({
          title: "Code Execution Disabled",
          description: "Code execution is disabled in production for security reasons.",
          variant: "default",
        });
      } else {
        toast({
          title: "Execution Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      setResult({
        output: "",
        error: errorMessage,
        executionTime: 0,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className={`relative my-4 rounded-lg border border-border/50 overflow-hidden bg-muted/30 ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            {detectedLanguage}
          </span>
          {result && (
            <span className="text-xs text-muted-foreground">
              ({result.executionTime}ms)
            </span>
          )}
        </div>
        {canExecute && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExecute}
            disabled={isExecuting}
            className="h-7 px-3 text-xs"
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1.5" />
                Run
              </>
            )}
          </Button>
        )}
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
      {result && (
        <div className={`border-t border-border/30 p-4 ${
          result.error ? "bg-destructive/10" : "bg-muted/30"
        }`}>
          <div className="flex items-start gap-2">
            {result.error ? (
              <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-mono text-muted-foreground mb-1">Output:</div>
              <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                {result.error || result.output || "(no output)"}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

