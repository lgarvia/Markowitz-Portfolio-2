import { GoogleGenAI, Type } from "@google/genai";
import { GeminiFinancialResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchFinancialParameters = async (tickers: string[]): Promise<GeminiFinancialResponse> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Generate realistic estimated financial parameters for the following stock tickers based on their 1-year historical performance up to today: ${tickers.join(", ")}.
    
    Also provide the stats for the Market Benchmark (S&P 500).

    I need:
    1. Annualized Expected Return (decimal).
    2. Annualized Volatility (decimal).
    3. Beta (relative to S&P 500).
    4. The Correlation Matrix between the requested assets.

    Be precise and realistic.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stats: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ticker: { type: Type.STRING },
                  annualizedReturn: { type: Type.NUMBER },
                  annualizedVolatility: { type: Type.NUMBER },
                  beta: { type: Type.NUMBER, description: "Beta relative to SP500" },
                },
                required: ["ticker", "annualizedReturn", "annualizedVolatility", "beta"],
              },
            },
            marketStats: {
              type: Type.OBJECT,
              properties: {
                annualizedReturn: { type: Type.NUMBER },
                annualizedVolatility: { type: Type.NUMBER },
              },
              required: ["annualizedReturn", "annualizedVolatility"],
              description: "Stats for the S&P 500 (Market)",
            },
            correlationMatrix: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
              },
              description: "Symmetric correlation matrix corresponding to the order of stats",
            },
          },
          required: ["stats", "correlationMatrix", "marketStats"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as GeminiFinancialResponse;
    }
    throw new Error("No data returned from Gemini");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};