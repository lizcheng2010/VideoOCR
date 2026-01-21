import { GoogleGenAI, Type } from "@google/genai";
import { ProcessedLog } from "../types";

// Helper to convert File to Base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:video/mp4;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeVideo = async (
  videoFile: File
): Promise<ProcessedLog> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const base64Video = await fileToGenerativePart(videoFile);

  const prompt = `
    You are an expert OCR and content analysis engine. Analyze this screen recording video frame by frame.

    **Task 1: Full Content Extraction (Text & Diagrams)**
    - Extract ALL text content visible in the video, including chats, emails, and documents.
    - **CRITICAL - Diagram OCR:** For any diagrams, charts, flowcharts, or whiteboards, perform detailed OCR. Transcribe all text labels, node content, connection labels, and legends found within these visual elements. Do not just summarize the diagram; extract the specific text inside it.
    - Organize the output logically (e.g., chronological flow of conversation or document structure).

    **Task 2: Date Detection**
    - Scan the video for any date indicators (System clocks, Message timestamps, Document dates).
    - **Date Resolution:** 
      - Convert all found dates to YYYYMMDD format.
      - Resolve relative dates (e.g., "Yesterday") using any absolute dates found.
    - Determine the **Earliest Date** and **Latest Date** referenced.

    **Task 3: Region Detection**
    - Analyze the content for geographic clues to determine a 2-letter Region Code (ISO 3166-1 alpha-2 style).
    - Look for:
      - Phone prefixes (e.g., +852 = HK, +61 = AU, +44 = GB, +1 = US/CA).
      - Currencies (e.g., HKD, AUD, USD, GBP).
      - City/Location names (e.g., "Sydney" -> AU, "Mong Kok" -> HK).
      - Language context (e.g., Traditional Chinese with English typically indicates HK).
    - If no specific region is found, use "GL" (Global) or "XX".

    **Task 4: Filename Generation**
    - **Rule:** Create a filename string strictly in "[RegionCode]-YYYYMMDD-to-YYYYMMDD" format.
    - **Examples:** 
      - Hong Kong context: "HK-20220905-to-20230503"
      - Australia context: "AU-20220905-to-20230503"
    - If earliest and latest dates are the same, repeat the date.
    - If no dates are found, use today's date.

    Format the output as a structured JSON object.
  `;

  // Schema for structured output
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      extractedContent: {
        type: Type.STRING,
        description: "The full extracted log formatted in Markdown, including text from diagrams.",
      },
      startDate: {
        type: Type.STRING,
        description: "The earliest date found in YYYYMMDD format.",
      },
      endDate: {
        type: Type.STRING,
        description: "The latest date found in YYYYMMDD format.",
      },
      suggestedFilename: {
        type: Type.STRING,
        description: "The filename in format Region-YYYYMMDD-to-YYYYMMDD.",
      },
    },
    required: ["extractedContent", "startDate", "endDate", "suggestedFilename"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: videoFile.type || "video/mp4",
              data: base64Video,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: {
            thinkingBudget: 10240, // Allocate budget for deep analysis of timestamps and flow
        }
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from Gemini");

    return JSON.parse(jsonText) as ProcessedLog;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};