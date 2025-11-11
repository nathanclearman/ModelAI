import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ModelUploadCard } from "@/components/model-upload-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Info, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const uploadedModels = [
  {
    name: "Custom Finance GPT",
    size: "2.3 GB",
    format: ".safetensors",
    uploadedAt: "2 days ago",
    status: "Active",
  },
  {
    name: "Legal Document Analyzer",
    size: "1.8 GB",
    format: ".gguf",
    uploadedAt: "1 week ago",
    status: "Active",
  },
];

export default function UploadModel() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Upload Trained Model</h1>
        <p className="text-muted-foreground">
          Import and deploy your custom pre-trained AI models
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Uploaded models will be validated and processed before deployment. This may take several minutes depending on file size.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload" data-testid="tab-upload">
            Upload New Model
          </TabsTrigger>
          <TabsTrigger value="uploaded" data-testid="tab-uploaded">
            Uploaded Models ({uploadedModels.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ModelUploadCard />
            
            <Card>
              <CardHeader>
                <CardTitle>Upload Guidelines</CardTitle>
                <CardDescription>
                  Best practices for uploading your trained models
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Supported Formats</p>
                      <p className="text-sm text-muted-foreground">
                        We support .bin, .safetensors, .gguf, .pt, and .pth formats
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">File Size Limits</p>
                      <p className="text-sm text-muted-foreground">
                        Maximum file size is 5GB per upload
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Model Validation</p>
                      <p className="text-sm text-muted-foreground">
                        All models are automatically validated for compatibility
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Security Scanning</p>
                      <p className="text-sm text-muted-foreground">
                        Models are scanned for security vulnerabilities before deployment
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Processing Time</p>
                      <p className="text-sm text-muted-foreground">
                        Typical processing time is 5-15 minutes depending on size
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="uploaded" className="space-y-4">
          {uploadedModels.map((model, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold" data-testid={`text-model-${index}`}>
                        {model.name}
                      </h3>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {model.status}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Size: {model.size}</span>
                      <span>Format: {model.format}</span>
                      <span>Uploaded: {model.uploadedAt}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
