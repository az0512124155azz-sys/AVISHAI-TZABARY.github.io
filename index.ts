import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Use the current date as a seed for variety
    const today = new Date().toISOString().split("T")[0];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a creative 3D printing expert who suggests trending, fun, and profitable 3D printable models for a store called "Magic 3D". 
The store sells 3D printed items in Israel. Suggest models that are popular, eye-catching, and would sell well.
Always respond in Hebrew. Be enthusiastic and creative.
Today's date is ${today} - use this to vary your suggestions (seasonal items, trending topics, etc).`
          },
          {
            role: "user",
            content: `הצע לי מודל תלת-ממדי מגניב אחד להוסיף לקטלוג היום. תן לי:
1. שם המוצר (בעברית)
2. תיאור קצר ומושך (2-3 משפטים)
3. קטגוריה מוצעת
4. טווח מחיר מומלץ בשקלים
5. למה זה יימכר טוב עכשיו
6. קישור חיפוש ב-Thingiverse או Printables למודלים דומים`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_model",
              description: "Return a 3D model suggestion",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Product name in Hebrew" },
                  description: { type: "string", description: "Short catchy description in Hebrew" },
                  category: { type: "string", description: "Suggested category" },
                  price_min: { type: "number", description: "Min price in ILS" },
                  price_max: { type: "number", description: "Max price in ILS" },
                  reason: { type: "string", description: "Why it will sell well, in Hebrew" },
                  search_url: { type: "string", description: "Search URL on Thingiverse or Printables" }
                },
                required: ["name", "description", "category", "price_min", "price_max", "reason", "search_url"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_model" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const suggestion = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ suggestion, date: today }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: return content as-is
    const content = data.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ raw: content, date: today }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
