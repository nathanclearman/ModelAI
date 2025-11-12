import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tantml:parameter>
<invoke name="user_query">
<parameter name="queries">[{
  "question": "This is a massive undertaking! I've started building Phase 1 (Analytics & Token Tracking) with backend infrastructure complete. Would you like me to:\n\nA) Continue systematically through all phases (will take significant time)\nB) Focus on completing just Analytics first, then we can decide next steps\nC) Build a more focused set of 2-3 key features that would give you the biggest differentiation\n\nWhat would you prefer?",
  "options": [
    "A - Continue with all features systematically",
    "B - Complete Analytics first, then reassess",
    "C - Focus on 2-3 highest-impact features"
  ]
}]