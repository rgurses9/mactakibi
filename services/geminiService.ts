import { GoogleGenAI, Type } from "@google/generative-ai";
import { MatchDetails } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to a Base64 string suitable for Gemini.
 */
const fileToPart = (file: File): Promise<{ inlineData: { mimeType: string; data: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Handle potential prefix if it exists (though split usually works fine)
      const base64String = result.includes(',') ? result.split(',')[1] : result;
      resolve({
        inlineData: {
          mimeType: file.type,
          data: base64String,
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const findMatchesInFile = async (file: File): Promise<MatchDetails[]> => {
  try {
    const filePart = await fileToPart(file);

    const model = "gemini-2.5-flash";

    // Updated prompt with strict column mapping provided by the user
    const prompt = `
      Bu görseldeki basketbol maç programını analiz et.
      
      GÖREV: "RIFAT GÜRSES" isminin geçtiği satırları bul ve o satırdaki bilgileri çıkar.
      İsim genellikle "SAYI GÖREVLİSİ", "SAAT GÖREVLİSİ" veya "ŞUT SAATİ GÖREVLİSİ" sütunlarında yer alır.
      
      SÜTUN HARİTASI (Görseldeki sütunların karşılıkları):
      - A Sütunu: TARİH
      - B Sütunu: SALON
      - C Sütunu: SAAT
      - D Sütunu: A TAKIMI
      - E Sütunu: B TAKIMI
      - F Sütunu: KATEGORİ
      - G Sütunu: GRUP
      - J Sütunu: SAYI GÖREVLİSİ
      - K Sütunu: SAAT GÖREVLİSİ
      - L Sütunu: ŞUT SAATİ GÖREVLİSİ

      TALİMATLAR:
      1. Listeyi yukarıdan aşağıya tara.
      2. J, K veya L sütunlarında "RIFAT GÜRSES" (veya benzer yazımlar) geçen her satırı tespit et.
      3. Tespit edilen her satır için A, B, C, D, E, F, G, J, K, L sütunlarındaki verileri JSON formatında döndür.
      4. Eğer tarih veya saat formatı bozuksa, görselde ne yazıyorsa aynısını al.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          filePart,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "A Sütunu - TARİH" },
              hall: { type: Type.STRING, description: "B Sütunu - SALON" },
              time: { type: Type.STRING, description: "C Sütunu - SAAT" },
              teamA: { type: Type.STRING, description: "D Sütunu - A TAKIMI" },
              teamB: { type: Type.STRING, description: "E Sütunu - B TAKIMI" },
              category: { type: Type.STRING, description: "F Sütunu - KATEGORİ" },
              group: { type: Type.STRING, description: "G Sütunu - GRUP" },
              scorer: { type: Type.STRING, description: "J Sütunu - SAYI GÖREVLİSİ" },
              timer: { type: Type.STRING, description: "K Sütunu - SAAT GÖREVLİSİ" },
              shotClock: { type: Type.STRING, description: "L Sütunu - ŞUT SAATİ GÖREVLİSİ" },
            },
            required: ["date", "hall", "time", "teamA", "teamB"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    try {
      const data = JSON.parse(text) as MatchDetails[];
      return data;
    } catch (e) {
      console.error("Failed to parse JSON response", e);
      return [];
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Return empty array instead of throwing to allow other files in batch to continue
    return [];
  }
};