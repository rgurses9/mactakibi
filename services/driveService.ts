import { MatchDetails } from "../types";
import { findMatchesInRawData } from "./excelService";

// Ensure API Key is clean (trim whitespace/quotes) to prevent INVALID_ARGUMENT errors
const rawKey = process.env.API_KEY || "";
const API_KEY = rawKey.replace(/["']/g, "").trim();

// The folder ID provided by the user
const TARGET_FOLDER_ID = "0ByPao_qBUjN-YXJZSG5Fancybmc";
// Resource key is sometimes required for older shared folders
const RESOURCE_KEY = "0-MKTgAd4XnpTp7S5flJBKuA";

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
}

type LogType = 'info' | 'network';

/**
 * Recursively scans a folder for Spreadsheets and Excel files.
 */
const scanFolderRecursive = async (folderId: string, onProgress: (msg: string, type?: LogType) => void): Promise<MatchDetails[]> => {
  const allMatches: MatchDetails[] = [];

  // Query: Inside parent folder, not trashed, and is either Sheet, Excel or Folder
  const q = `'${folderId}' in parents and trashed=false and (mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType='application/vnd.google-apps.folder')`;
  
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&key=${API_KEY}&fields=files(id,name,mimeType)&supportsAllDrives=true&includeItemsFromAllDrives=true`;

  onProgress(`Drive API İsteği: LIST files (Folder: ...${folderId.substr(-5)})`, 'network');

  const response = await fetch(listUrl, {
      headers: {
          'X-Goog-Drive-Resource-Keys': `${TARGET_FOLDER_ID}/${RESOURCE_KEY}`,
          'Accept': 'application/json'
      }
  });

  if (!response.ok) {
      const errText = await response.text();
      onProgress(`API Hatası: ${response.status} ${response.statusText}`, 'network');
      
      // Check for specific API Key errors to fail fast and inform user
      try {
        const errJson = JSON.parse(errText);
        if (response.status === 400 && errJson.error?.status === 'INVALID_ARGUMENT') {
           throw new Error("API Key geçersiz veya yapılandırılmamış.");
        }
        if (response.status === 403) {
           throw new Error("Erişim reddedildi (403).");
        }
      } catch (e: any) {
         if (e.message && (e.message.includes("API Key") || e.message.includes("403"))) throw e;
      }
      
      if (folderId === TARGET_FOLDER_ID) {
          throw new Error(`Klasör erişim hatası (${response.status}).`);
      }
      return [];
  }

  onProgress(`API Yanıtı: 200 OK - Dosya Listesi Alındı`, 'network');
  const data = await response.json();
  const items: DriveItem[] = data.files || [];
  
  onProgress(`${items.length} öğe bulundu. İşleniyor...`, 'info');

  for (const item of items) {
      if (item.mimeType === 'application/vnd.google-apps.folder') {
          // Recursive call for subfolders
          onProgress(`Alt Klasöre Giriliyor: ${item.name}`, 'info');
          const subMatches = await scanFolderRecursive(item.id, onProgress);
          allMatches.push(...subMatches);
      } else {
          // Process File
          onProgress(`Analiz ediliyor: ${item.name}`, 'info');
          try {
             const matches = await processFile(item, onProgress);
             allMatches.push(...matches);
             if (matches.length > 0) {
                 onProgress(`${item.name}: ${matches.length} kayıt eşleşti.`, 'info');
             }
          } catch (e) {
             console.error(`Error processing ${item.name}`, e);
          }
      }
  }

  return allMatches;
};

const processFile = async (file: DriveItem, onProgress: (msg: string, type?: LogType) => void): Promise<MatchDetails[]> => {
    let matches: MatchDetails[] = [];
            
    if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
        // Export Google Sheet to CSV
        const exportUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv&key=${API_KEY}`;
        onProgress(`İndiriliyor (CSV): ${file.name}...`, 'network');
        
        const fileResp = await fetch(exportUrl, {
                headers: { 'X-Goog-Drive-Resource-Keys': `${TARGET_FOLDER_ID}/${RESOURCE_KEY}` }
        });
        if(fileResp.ok) {
            const csvText = await fileResp.text();
            matches = findMatchesInRawData(csvText, false); // false = string/csv
        }
    } else if (file.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        // Download Excel File
        const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${API_KEY}`;
        onProgress(`İndiriliyor (XLSX): ${file.name}...`, 'network');

        const fileResp = await fetch(downloadUrl, {
            headers: { 'X-Goog-Drive-Resource-Keys': `${TARGET_FOLDER_ID}/${RESOURCE_KEY}` }
        });
        if(fileResp.ok) {
            const arrayBuffer = await fileResp.arrayBuffer();
            matches = findMatchesInRawData(new Uint8Array(arrayBuffer), true); // true = binary/excel
        }
    }

    // Tag matches with source filename
    return matches.map(m => ({ ...m, sourceFile: file.name }));
};

/**
 * Automatically lists files in the hardcoded folder and processes them for matches.
 */
export const autoScanDriveFolder = async (onProgress: (msg: string, type?: LogType) => void): Promise<MatchDetails[]> => {
  // If API_KEY is missing or looks like a placeholder, warn the user
  if (!API_KEY || API_KEY.length < 10) {
    throw new Error("API Key bulunamadı veya geçersiz.");
  }

  try {
    onProgress("Google Drive bağlantısı kuruluyor...", 'info');
    return await scanFolderRecursive(TARGET_FOLDER_ID, onProgress);
  } catch (error: any) {
    console.error("Auto Scan Error:", error);
    throw new Error(error.message || "Otomatik tarama sırasında hata oluştu.");
  }
};