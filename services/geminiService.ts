import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const getTafseer = async (surahName: string, ayahNumber: number, ayahText: string): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `
      أنت عالم في تفسير القرآن الكريم.
      اشرح الآية التالية بإيجاز ووضوح باللغة العربية:
      
      سورة: ${surahName}
      رقم الآية: ${ayahNumber}
      النص: "${ayahText}"
      
      قدم التفسير الميسر واستخرج أهم الفوائد منها في نقاط مختصرة.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "عذراً، لم أتمكن من جلب التفسير في الوقت الحالي.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي. يرجى التحقق من مفتاح API والمحاولة مرة أخرى.";
  }
};
