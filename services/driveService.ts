/// <reference types="vite/client" />
import { MatchDetails } from "../types";
import { findMatchesInRawData } from "./excelService";

const DEFAULT_API_KEY = "AIzaSyCILoR2i6TtjpMl6pW0OOBhc3naQHAd12Q";

const getApiKey = (): string => {
  let key = DEFAULT_API_KEY;

  // 1. Try Vite standard env var
  if (import.meta.env && import.meta.env.VITE_API_KEY) {
    key = import.meta.env.VITE_API_KEY;
  }
  // 2. Try process.env if available (from define in vite.config.ts)
  else if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    key = process.env.API_KEY;
  }

  // Clean key
  if (key) {
    key = String(key).replace(/["']/g, "").trim();
  }

  // Log masked key for debugging
  if (key && key.length > 5) {
    console.log(`[DriveService] Using API Key: ${key.substring(0, 5)}...`);
  } else {
    console.warn("[DriveService] Using suspicious API Key:", key);
  }

  return key || DEFAULT_API_KEY;
};

const API_KEY = getApiKey();

// The folder ID provided by the user
// The folder ID provided by the user
const TARGET_FOLDER_ID = "1Tqtn2oN96UAyeARYtmYFGSfzkrSJOG9s";
// Resource key is sometimes required for older shared folders (cleared for new folder)
const RESOURCE_KEY = "";

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
}

type LogType = 'info' | 'network';

/**
 * Recursively scans a folder for Spreadsheets and Excel files.
 * @param recursive If false, skips subfolders.
 */
const scanFolderRecursive = async (folderId: string, onProgress: (msg: string, type?: LogType) => void, recursive: boolean = true): Promise<MatchDetails[]> => {
  const allMatches: MatchDetails[] = [];

  // Query: Inside parent folder, not trashed, and is either Sheet, Excel or Folder
  const q = `'${folderId}' in parents and trashed=false and (mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType='application/vnd.google-apps.folder')`;

  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&key=${API_KEY}&fields=files(id,name,mimeType)&supportsAllDrives=true&includeItemsFromAllDrives=true`;

  onProgress(`Drive API İsteği: LIST files (Folder: ...${folderId.substr(-5)})`, 'network');

  const headers: HeadersInit = {
    'Accept': 'application/json'
  };

  if (RESOURCE_KEY) {
    headers['X-Goog-Drive-Resource-Keys'] = `${TARGET_FOLDER_ID}/${RESOURCE_KEY}`;
  }

  const response = await fetch(listUrl, { headers });

  if (!response.ok) {
    const errText = await response.text();
    onProgress(`API Hatası: ${response.status} ${response.statusText}`, 'network');

    // Check for specific API Key errors to fail fast and inform user
    try {
      const errJson = JSON.parse(errText);
      if (response.status === 400 && errJson.error?.status === 'INVALID_ARGUMENT') {
        console.error("API Key Invalid Argument:", errJson);
        throw new Error("API Key geçersiz veya yapılandırılmamış.");
      }

      // Check for API Key Restrictions
      const errorDetails = errJson.error?.details || [];
      const isKeyBlocked = errorDetails.some((d: any) => d.reason === 'API_KEY_SERVICE_BLOCKED');

      if (isKeyBlocked) {
        console.error("🚨 API KEY BLOCKED: This API key is restricted and does not allow calling Google Drive API.");
        throw new Error("API Anahtarı kısıtlanmış! Google Cloud Console'da API Key ayarlarına gidip 'Google Drive API' erişimine izin veriniz.");
      }

      if (response.status === 403) {
        throw new Error("Erişim reddedildi (403). API etkinleştirilmemiş olabilir.");
      }
    } catch (e: any) {
      if (e.message && (e.message.includes("API Key") || e.message.includes("403") || e.message.includes("kısıtlanmış"))) throw e;
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

  // Separate folders and files
  const folders = items.filter(i => i.mimeType === 'application/vnd.google-apps.folder');
  const files = items.filter(i => i.mimeType !== 'application/vnd.google-apps.folder');

  // 1. Process Folders (Sequential/Recursive)
  for (const folder of folders) {
    if (!recursive) {
      onProgress(`Alt Klasör Atlanıyor (Derinlik Taraması Kapalı): ${folder.name}`, 'info');
      continue;
    }
    onProgress(`Alt Klasöre Giriliyor: ${folder.name}`, 'info');
    const subMatches = await scanFolderRecursive(folder.id, onProgress, true);
    allMatches.push(...subMatches);
  }

  // 2. Process Files (Parallel with Limit)
  const CONCURRENCY_LIMIT = 5;
  for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
    const chunk = files.slice(i, i + CONCURRENCY_LIMIT);

    const promises = chunk.map(async (file) => {
      onProgress(`Analiz ediliyor: ${file.name}`, 'info');
      try {
        const matches = await processFile(file, onProgress);
        if (matches.length > 0) {
          onProgress(`${file.name}: ${matches.length} kayıt eşleşti.`, 'info');
        }
        return matches;
      } catch (e) {
        console.error(`Error processing ${file.name}`, e);
        return [];
      }
    });

    const results = await Promise.all(promises);
    results.forEach(r => allMatches.push(...r));
  }

  return allMatches;
};

const processFile = async (file: DriveItem, onProgress: (msg: string, type?: LogType) => void): Promise<MatchDetails[]> => {
  let matches: MatchDetails[] = [];

  if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
    // Export Google Sheet to CSV
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv&key=${API_KEY}`;
    onProgress(`İndiriliyor (CSV): ${file.name}...`, 'network');

    const headers: HeadersInit = {};
    if (RESOURCE_KEY) headers['X-Goog-Drive-Resource-Keys'] = `${TARGET_FOLDER_ID}/${RESOURCE_KEY}`;

    const fileResp = await fetch(exportUrl, { headers });
    if (fileResp.ok) {
      const csvText = await fileResp.text();
      matches = findMatchesInRawData(csvText, false); // false = string/csv
    }
  } else if (file.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    // Download Excel File
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${API_KEY}`;
    onProgress(`İndiriliyor (XLSX): ${file.name}...`, 'network');

    const headers: HeadersInit = {};
    if (RESOURCE_KEY) headers['X-Goog-Drive-Resource-Keys'] = `${TARGET_FOLDER_ID}/${RESOURCE_KEY}`;

    const fileResp = await fetch(downloadUrl, { headers });
    if (fileResp.ok) {
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
    // Recursive is explicitly set to FALSE as per user request
    return await scanFolderRecursive(TARGET_FOLDER_ID, onProgress, false);
  } catch (error: any) {
    console.error("Auto Scan Error:", error);
    throw new Error(error.message || "Otomatik tarama sırasında hata oluştu.");
  }
};