import { GoogleGenAI } from "@google/genai";
import { SalesStat, ProductStat, GeoStat } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const analyzeSalesData = async (
  salesTrend: SalesStat[],
  topProducts: ProductStat[],
  geoStats: GeoStat[],
  prompt?: string
): Promise<string> => {
  const client = getClient();
  if (!client) {
    return "API Key is missing. Please check your environment configuration to enable AI insights.";
  }

  // Prepare context for the AI
  const dataContext = `
    Dataset Summary:
    - Recent Sales Trend (Last 7 days): ${JSON.stringify(salesTrend.slice(-7))}
    - Top Performing Products: ${JSON.stringify(topProducts)}
    - Geographic Distribution: ${JSON.stringify(geoStats)}
  `;

  const systemInstruction = `
    You are an expert E-commerce Data Analyst for a WeChat Shop (Video Accounts).
    Your goal is to provide actionable business insights based on the provided JSON data.
    Focus on trends, anomalies, and growth opportunities. 
    Keep the tone professional yet encouraging.
    Output Markdown formatted text.
  `;

  const userPrompt = prompt || "Analyze my sales performance this month. What are the key takeaways?";

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${dataContext}\n\nUser Query: ${userPrompt}`,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    return response.text || "No insights could be generated.";
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return "Failed to generate insights. Please try again later.";
  }
};