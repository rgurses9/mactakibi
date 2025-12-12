import { MatchDetails } from "../types";
import { findMatchesInRawData } from "./excelService";

// Fallback key to ensure functionality even if env var replacement has issues
const BACKUP_KEY = "AIzaSyCILoR2i6TtjpMl6pW0OOBhc3naQHAd12Q";

// Robust API Key retrieval
const getApiKey = (): string => {
  let key = BACKUP_KEY;
  try {
    // Attempt to access the env var replaced by Vite
    const envKey = process.env.API_KEY;
    if (envKey && typeof envKey === 'string' && envKey.length > 5) {
      key = envKey;
    }
  } catch (e) {
    // Ignore errors accessing process
  }
  
  // CRITICAL: Remove any surrounding quotes
  return key.replace(/["']/g, "").trim();
};

const API_KEY = getApiKey();

interface FolderConfig {
  id: string;
  resourceKey?: string;
  name: string;
}

// Configuration for folders to scan
const TARGET_FOLDERS: FolderConfig[] = [
  {
    id: "0ByPao_qBUjN-YXJZSG5Fancybmc",
    resourceKey: "0-MKTgAd4XnpTp7S5flJBKuA",
    name: "Ana Maç Klasörü"
  },
  {
    id: "1Tqtn2oN96UAyeARYtmYFGSfzkrSJOG9s",
    resourceKey: undefined, // No resource key provided in the link for the second folder
    name: "Ek Maç Klasörü"
  }
];

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
}

type LogType = 'info' | 'network' | 'success' | 'error' | 'warning';

/**
 * Recursively scans a folder for Spreadsheets and Excel files.
 */
const scanFolderRecursive = async (
    folderId: string, 
    rootConfig: FolderConfig,
    onProgress: (msg: string, type?: LogType) => void
): Promise<MatchDetails[]> => {
  const allMatches: MatchDetails[] = [];

  // Query: Inside parent folder, not trashed, and is either Sheet, Excel or Folder
  const q = `'${folderId}' in parents and trashed=false and (mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType='application/vnd.google-apps.folder')`;
  
  // Corrected URL: Removed deprecated 'includeItemsFromAllDrives'
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&key=${API_KEY}&fields=files(id,name,mimeType)&supportsAllDrives=true`;

  onProgress(`Drive İsteği (${rootConfig.name}): Liste alınıyor...`, 'network');

  // Prepare headers based on the root folder's resource key requirement
  const headers: HeadersInit = {
      'Accept': 'application/json'
  };
  
  // If the root folder requires a resource key, we include it. 
  // It's formatted as "RootFolderID/ResourceKey". This grants access to the tree.
  if (rootConfig.resourceKey) {
      headers['X-Goog-Drive-Resource-Keys'] = `${rootConfig.id}/${rootConfig.resourceKey}`;
  }

  const response = await fetch(listUrl, { headers });

  if (!response.ok) {
      const errText = await response.text();
      onProgress(`API Hatası: ${response.status} ${response.statusText}`, 'network');
      
      try {
        const errJson = JSON.parse(errText);
        console.error("Drive API Error Details:", JSON.stringify(errJson, null, 2));

        if (response.status === 400 && errJson.error?.status === 'INVALID_ARGUMENT') {
           throw new Error("API Key yapılandırma hatası (Geçersiz Argüman).");
        }
        if (response.status === 403) {
           throw new Error("Erişim reddedildi (403). API Key yetkisi eksik veya klasör erişilebilir değil.");
        }
        if (errJson.error?.message) {
            throw new Error(`Drive API: ${errJson.error.message}`);
        }
      } catch (e: any) {
         if (e.message && (e.message.includes("API Key") || e.message.includes("Drive API") || e.message.includes("403"))) throw e;
      }
      
      // If the root folder fails, throw. Subfolders failing might be partial errors.
      if (folderId === rootConfig.id) {
          throw new Error(`Klasör erişim hatası (${response.status}).`);
      }
      return [];
  }

  const data = await response.json();
  const items: DriveItem[] = data.files || [];
  
  if (items.length > 0) {
      onProgress(`${rootConfig.name}: ${items.length} öğe inceleniyor...`, 'info');
  }

  for (const item of items) {
      if (item.mimeType === 'application/vnd.google-apps.folder') {
          // Recursive call for subfolders. Pass the same rootConfig for headers.
          const subMatches = await scanFolderRecursive(item.id, rootConfig, onProgress);
          allMatches.push(...subMatches);
      } else {
          // Process File
          onProgress(`Analiz: ${item.name}`, 'info');
          try {
             const matches = await processFile(item, rootConfig, onProgress);
             allMatches.push(...matches);
             if (matches.length > 0) {
                 onProgress(`✅ ${item.name}: ${matches.length} maç bulundu.`, 'success');
             }
          } catch (e) {
             console.error(`Error processing ${item.name}`, e);
          }
      }
  }

  return allMatches;
};

const processFile = async (
    file: DriveItem, 
    rootConfig: FolderConfig,
    onProgress: (msg: string, type?: LogType) => void
): Promise<MatchDetails[]> => {
    let matches: MatchDetails[] = [];
    
    // Headers for file download/export
    const headers: HeadersInit = {};
    if (rootConfig.resourceKey) {
        headers['X-Goog-Drive-Resource-Keys'] = `${rootConfig.id}/${rootConfig.resourceKey}`;
    }
            
    if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
        const exportUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv&key=${API_KEY}`;
        onProgress(`İndiriliyor (CSV): ${file.name}...`, 'network');
        
        const fileResp = await fetch(exportUrl, { headers });
        if(fileResp.ok) {
            const csvText = await fileResp.text();
            matches = findMatchesInRawData(csvText, false); 
        }
    } else if (file.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${API_KEY}`;
        onProgress(`İndiriliyor (XLSX): ${file.name}...`, 'network');

        const fileResp = await fetch(downloadUrl, { headers });
        if(fileResp.ok) {
            const arrayBuffer = await fileResp.arrayBuffer();
            matches = findMatchesInRawData(new Uint8Array(arrayBuffer), true); 
        }
    }

    return matches.map(m => ({ ...m, sourceFile: file.name }));
};

export const autoScanDriveFolder = async (onProgress: (msg: string, type?: LogType) => void): Promise<MatchDetails[]> => {
  if (!API_KEY || API_KEY.length < 10) {
    throw new Error("API Key bulunamadı veya geçersiz.");
  }

  const allResults: MatchDetails[] = [];

  try {
    onProgress("Google Drive taraması başlıyor...", 'info');
    
    // Iterate through all configured folders
    for (const folder of TARGET_FOLDERS) {
        onProgress(`${folder.name} taranıyor...`, 'info');
        try {
            const matches = await scanFolderRecursive(folder.id, folder, onProgress);
            allResults.push(...matches);
        } catch (e: any) {
             // Log error but continue to next folder (partial success)
             console.error(e);
             onProgress(`${folder.name} Hatası: ${e.message}`, 'error');
        }
    }

    return allResults;
  } catch (error: any) {
    console.error("Auto Scan Error:", error);
    throw new Error(error.message || "Otomatik tarama sırasında hata oluştu.");
  }
};