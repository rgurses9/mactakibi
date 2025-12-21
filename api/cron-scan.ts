import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import * as XLSX from 'xlsx';

// Firebase Config
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCILoR2i6TtjpMl6pW0OOBhc3naQHAd12Q",
    authDomain: "mactakibi-50e0b.firebaseapp.com",
    projectId: "mactakibi-50e0b",
    storageBucket: "mactakibi-50e0b.firebaseapp.com",
    messagingSenderId: "529275453572",
    appId: "1:529275453572:web:4d6102920b55724e5902d1",
    measurementId: "G-V793VBMXF7",
    databaseURL: "https://mactakibi-50e0b.firebaseio.com"
};

const DRIVE_API_KEY = "AIzaSyCILoR2i6TtjpMl6pW0OOBhc3naQHAd12Q";

// Drive Config
const TARGET_FOLDERS = [
    { id: "0ByPao_qBUjN-YXJZSG5Fancybmc", resourceKey: "0-MKTgAd4XnpTp7S5flJBKuA", name: "Ana Maç Klasörü", recursive: false },
    { id: "1Tqtn2oN96UAyeARYtmYFGSfzkrSJOG9s", name: "Ek Maç Klasörü", recursive: true },
    { id: "1gBZ_nHumGI-VjgqYjKTLTe_moSi4Pbl6", name: "Yeni Maç Klasörü", recursive: true }
];

const TARGET_FILES = [
    { id: "1HrTEuaINToqL53CIk6ndCTAnYudrCRuAFshrHQC_5kY", name: "OKUL İL VE İLÇE (2025-2026)" },
    { id: "1djS7vV33pawiJa_zcuK2Z4j69RD0VKr-rYsRnLZ8H8s", name: "MASA GÖREVLİLERİ (2025-2026)" }
];

// Helper: Normalize String
const normalizeString = (str: string): string => {
    if (!str) return "";
    return str
        .toLocaleUpperCase('tr-TR')
        .replace(/\./g, '')
        .replace(/\s+/g, ' ')
        .replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S')
        .replace(/İ/g, 'I').replace(/I/g, 'I').replace(/Ö/g, 'O').replace(/Ç/g, 'C')
        .replace(/ğ/g, 'G').replace(/ü/g, 'U').replace(/ş/g, 'S')
        .replace(/ı/g, 'I').replace(/ö/g, 'O').replace(/ç/g, 'C')
        .trim();
};

const getMatchId = (match: any): string => {
    const str = `${match.date}_${match.time}_${match.teamA}_${match.teamB}_${match.hall}`;
    return Buffer.from(str, 'utf8').toString('base64').replace(/[^a-zA-Z0-9]/g, '');
};

const containsName = (value: any, nameParts: string[]): boolean => {
    if (!value) return false;
    const val = normalizeString(String(value));
    return nameParts.every(part => val.includes(normalizeString(part)));
};

// Parser logic
const parseWorkbookData = (data: any, type: 'array' | 'string', fileName?: string): any[] => {
    const workbook = XLSX.read(data, { type: type });
    const matches: any[] = [];
    let columnsToCheck = ['H', 'I', 'J', 'K', 'L', 'M'];

    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any>(sheet, { header: "A", raw: false, defval: "" });
        rows.forEach((row) => {
            const date = String(row['A'] || "").trim();
            if (!date || date.length < 5) return;

            matches.push({
                date,
                hall: String(row['B'] || "").trim(),
                time: String(row['C'] || "").trim(),
                teamA: String(row['D'] || "").trim(),
                teamB: String(row['E'] || "").trim(),
                category: String(row['F'] || "").trim(),
                group: String(row['G'] || "").trim(),
                h: String(row['H'] || "").trim(),
                i: String(row['I'] || "").trim(),
                j: String(row['J'] || "").trim(),
                k: String(row['K'] || "").trim(),
                l: String(row['L'] || "").trim(),
                m: String(row['M'] || "").trim(),
                sourceFile: fileName
            });
        });
    });
    return matches;
};

// WhatsApp logic
const sendBotMessage = async (phone: string, apiKey: string, msg: string) => {
    try {
        const encoded = encodeURIComponent(msg);
        const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`;
        await fetch(url);
    } catch (e) {
        console.error("Bot Error:", e);
    }
};

export default async function handler(req: any, res: any) {
    if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
    }
    const db = firebase.database();

    try {
        console.log("Cron started...");

        // 1. Get all users
        const usersSnapshot = await db.ref('users').once('value');
        const usersData = usersSnapshot.val();
        if (!usersData) return res.status(200).json({ status: "no users" });

        const approvedUsers = Object.keys(usersData)
            .map(uid => ({ uid, ...usersData[uid] }))
            .filter(u => u.isApproved && u.botConfig?.phone && u.botConfig?.apiKey);

        if (approvedUsers.length === 0) return res.status(200).json({ status: "no approved users with bot config" });

        // 2. Scan Drive
        const allMatches: any[] = [];

        // Helper to scan a folder
        const scanFolder = async (folderId: string, resourceKey?: string, fileName?: string) => {
            const query = `'${folderId}' in parents and trashed=false`;
            let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&key=${DRIVE_API_KEY}&fields=files(id,name,mimeType)`;
            const headers: any = {};
            if (resourceKey) headers['X-Goog-Drive-Resource-Keys'] = `${folderId}/${resourceKey}`;

            const resp = await fetch(url, { headers });
            const data = await resp.json();
            const files = data.files || [];

            for (const file of files) {
                if (file.mimeType.includes('spreadsheet')) {
                    const exportUrl = file.mimeType.includes('google-apps.spreadsheet')
                        ? `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv&key=${DRIVE_API_KEY}`
                        : `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${DRIVE_API_KEY}`;

                    const fileResp = await fetch(exportUrl, { headers });
                    if (fileResp.ok) {
                        const content = await (file.mimeType.includes('google-apps.spreadsheet') ? fileResp.text() : fileResp.arrayBuffer());
                        const found = parseWorkbookData(content, file.mimeType.includes('google-apps.spreadsheet') ? 'string' : 'array', file.name);
                        allMatches.push(...found);
                    }
                }
            }
        };

        // Scan root folders (non-recursive for speed in cron)
        for (const folder of TARGET_FOLDERS) {
            await scanFolder(folder.id, folder.resourceKey);
        }

        // Scan target files
        for (const fileConfig of TARGET_FILES) {
            const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileConfig.id}/export?mimeType=text/csv&key=${DRIVE_API_KEY}`;
            const fileResp = await fetch(exportUrl);
            if (fileResp.ok) {
                const content = await fileResp.text();
                const found = parseWorkbookData(content, 'string', fileConfig.name);
                allMatches.push(...found);
            }
        }

        console.log(`Total matches found: ${allMatches.length}`);

        // 3. Process each user
        for (const user of approvedUsers) {
            const nameParts = `${user.firstName} ${user.lastName}`.toLocaleUpperCase('tr-TR').split(' ').filter(p => p.length > 1);
            const userMatches = allMatches.filter(m => {
                const cols = [m.h, m.i, m.j, m.k, m.l, m.m];
                return cols.some(val => containsName(val, nameParts));
            });

            if (userMatches.length === 0) continue;

            // Check for new ones
            const notifiedSnapshot = await db.ref(`notified_matches/${user.uid}`).once('value');
            const notifiedIds = notifiedSnapshot.val() || {};

            const newMatches = userMatches.filter(m => !notifiedIds[getMatchId(m)]);

            if (newMatches.length > 0) {
                let msg = `🚀 *YENİ GÖREV SİSTEME EKLENDİ!*\n\n`;
                for (const m of newMatches) {
                    msg += `🏀 ${m.teamA} vs ${m.teamB}\n📅 ${m.date} | ⏰ ${m.time}\n🏟️ ${m.hall}\n\n`;
                    // Mark as notified
                    await db.ref(`notified_matches/${user.uid}/${getMatchId(m)}`).set(true);
                }
                msg += `_Vercel Arka Plan Taraması tarafından iletildi._`;

                await sendBotMessage(user.botConfig.phone, user.botConfig.apiKey, msg);
                console.log(`Notification sent to ${user.firstName} for ${newMatches.length} matches.`);
            }
        }

        res.status(200).json({ status: "success", count: allMatches.length });
    } catch (error: any) {
        console.error("Cron Error:", error);
        res.status(500).json({ error: error.message });
    }
}
