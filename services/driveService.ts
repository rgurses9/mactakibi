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
 * Process a list of items in batches to control concurrency and avoid API rate limits
 * while still being much faster than sequential processing.
 */
async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  task: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    // Execute batch in parallel
    const batchResults = await Promise.all(batch.map(task));
    results.push(...batchResults);
  }
  return results;
}

/**
 * Recursively scans a folder for Spreadsheets and Excel files with Parallel Processing.
 * @param targetNameParts - Optional name parts to filter by (e.g., ["RIFAT", "GURSES"])
 */
const scanFolderRecursive = async (
  folderId: string,
  rootConfig: FolderConfig,
  onProgress: (msg: string, type?: LogType) => void,
  targetNameParts?: string[]
): Promise<MatchDetails[]> => {
  const allMatches: MatchDetails[] = [];

  // Query: Inside parent folder, not trashed, and is either Sheet, Excel or Folder
  const q = `'${folderId}' in parents and trashed=false and (mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType='application/vnd.google-apps.folder')`;

  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&key=${API_KEY}&fields=files(id,name,mimeType)&supportsAllDrives=true`;

  // Only show network log for root folders to reduce noise
  if (folderId === rootConfig.id) {
    onProgress(`Veri İsteği: ${rootConfig.name}`, 'network');
  }

  // Prepare headers based on the root folder's resource key requirement
  const headers: HeadersInit = { 'Accept': 'application/json' };
  if (rootConfig.resourceKey) {
    headers['X-Goog-Drive-Resource-Keys'] = `${rootConfig.id}/${rootConfig.resourceKey}`;
  }

  try {
    const response = await fetch(listUrl, { headers });

    if (!response.ok) {
      // Error handling logic
      const errText = await response.text();
      console.error(`Drive API Error (${response.status}):`, errText);
      // If strict error handling is needed, throw here. 
      // Returning empty allows other folders to continue.
      return [];
    }

    const data = await response.json();
    const items: DriveItem[] = data.files || [];

    // Separate folders and files
    const subFolders = items.filter(i => i.mimeType === 'application/vnd.google-apps.folder');
    const files = items.filter(i => i.mimeType !== 'application/vnd.google-apps.folder');

    if (files.length > 0) {
      onProgress(`${files.length} dosya taranıyor...`, 'info');
    }

    // 1. Process Files in Parallel Batches (Concurrency Limit: 6)
    // This prevents browser network blocking while significantly speeding up downloads
    const fileResults = await processInBatches(files, 6, async (file) => {
      try {
        const matches = await processFile(file, rootConfig, onProgress, targetNameParts);
        if (matches.length > 0) {
          onProgress(`✅ ${file.name}: ${matches.length} maç bulundu.`, 'success');
        }
        return matches;
      } catch (e) {
        console.error(`Error processing ${file.name}`, e);
        return [];
      }
    });

    // Flatten file results
    fileResults.forEach(r => allMatches.push(...r));

    // 2. Process Subfolders in Parallel
    // We start all subfolder scans simultaneously using Promise.all
    const folderPromises = subFolders.map(folder =>
      scanFolderRecursive(folder.id, rootConfig, onProgress, targetNameParts)
    );

    const folderResults = await Promise.all(folderPromises);

    // Flatten folder results
    folderResults.forEach(r => allMatches.push(...r));

  } catch (error) {
    console.error(`Error scanning folder ${folderId}:`, error);
  }

  return allMatches;
};

const processFile = async (
  file: DriveItem,
  rootConfig: FolderConfig,
  onProgress: (msg: string, type?: LogType) => void,
  targetNameParts?: string[]
): Promise<MatchDetails[]> => {
  let matches: MatchDetails[] = [];

  const headers: HeadersInit = {};
  if (rootConfig.resourceKey) {
    headers['X-Goog-Drive-Resource-Keys'] = `${rootConfig.id}/${rootConfig.resourceKey}`;
  }

  try {
    if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
      const exportUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv&key=${API_KEY}`;
      // Reduced logging for speed - uncomment if detailed logging needed
      // onProgress(`İndiriliyor: ${file.name}`, 'network');

      const fileResp = await fetch(exportUrl, { headers });
      if (fileResp.ok) {
        const csvText = await fileResp.text();
        matches = findMatchesInRawData(csvText, false, targetNameParts);
      }
    } else if (file.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${API_KEY}`;

      const fileResp = await fetch(downloadUrl, { headers });
      if (fileResp.ok) {
        const arrayBuffer = await fileResp.arrayBuffer();
        matches = findMatchesInRawData(new Uint8Array(arrayBuffer), true, targetNameParts);
      }
    }
  } catch (e) {
    // Fail silently for individual files to keep speed up
    console.warn(`Failed to process file ${file.name}`);
  }

  return matches.map(m => ({ ...m, sourceFile: file.name }));
};

/**
 * Automatically scans configured Google Drive folders for match data.
 * @param onProgress - Callback for progress updates
 * @param targetNameParts - Optional name parts to filter by (e.g., ["RIFAT", "GURSES"])
 */
export const autoScanDriveFolder = async (
  onProgress: (msg: string, type?: LogType) => void,
  targetNameParts?: string[]
): Promise<MatchDetails[]> => {
  if (!API_KEY || API_KEY.length < 10) {
    throw new Error("API Key bulunamadı veya geçersiz.");
  }

  const allResults: MatchDetails[] = [];

  try {
    const nameInfo = targetNameParts ? targetNameParts.join(' ') : 'Tüm kullanıcılar';
    onProgress(`Hızlı tarama başlatılıyor: ${nameInfo}`, 'info');

    // Scan all target root folders in parallel
    const rootFolderPromises = TARGET_FOLDERS.map(folder =>
      scanFolderRecursive(folder.id, folder, onProgress, targetNameParts)
        .catch(e => {
          onProgress(`${folder.name} erişilemedi: ${e.message}`, 'error');
          return [];
        })
    );

    const results = await Promise.all(rootFolderPromises);
    results.forEach(r => allResults.push(...r));

    return allResults;
  } catch (error: any) {
    console.error("Auto Scan Error:", error);
    throw new Error(error.message || "Otomatik tarama sırasında hata oluştu.");
  }
};