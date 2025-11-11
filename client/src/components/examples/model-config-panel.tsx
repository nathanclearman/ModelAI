import { ModelConfigPanel } from "../model-config-panel";

export default function ModelConfigPanelExample() {
  return (
    <div className="p-6 max-w-2xl">
      <ModelConfigPanel
        initialConfig={{
          name: "Customer Support Bot",
          model: "gpt-4o",
          temperature: 70,
          maxTokens: 1000,
          systemPrompt: "You are a helpful customer support assistant. Be professional, empathetic, and clear in your responses.",
        }}
        onSave={(config) => console.log("Config saved:", config)}
      />
    </div>
  );
}
