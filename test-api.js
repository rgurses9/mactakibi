var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// api/cron-scan.ts
var cron_scan_exports = {};
__export(cron_scan_exports, {
  default: () => handler
});
module.exports = __toCommonJS(cron_scan_exports);
var import_app = __toESM(require("firebase/compat/app"), 1);
var import_database = require("firebase/compat/database");
var XLSX = __toESM(require("xlsx"), 1);
var FIREBASE_CONFIG = {
  apiKey: "AIzaSyCILoR2i6TtjpMl6pW0OOBhc3naQHAd12Q",
  authDomain: "mactakibi-50e0b.firebaseapp.com",
  projectId: "mactakibi-50e0b",
  storageBucket: "mactakibi-50e0b.firebaseapp.com",
  messagingSenderId: "529275453572",
  appId: "1:529275453572:web:4d6102920b55724e5902d1",
  measurementId: "G-V793VBMXF7",
  databaseURL: "https://mactakibi-50e0b.firebaseio.com"
};
var DRIVE_API_KEY = "AIzaSyCILoR2i6TtjpMl6pW0OOBhc3naQHAd12Q";
var TARGET_FOLDERS = [
  { id: "0ByPao_qBUjN-YXJZSG5Fancybmc", resourceKey: "0-MKTgAd4XnpTp7S5flJBKuA", name: "Ana Ma\xE7 Klas\xF6r\xFC", recursive: false },
  { id: "1Tqtn2oN96UAyeARYtmYFGSfzkrSJOG9s", name: "Ek Ma\xE7 Klas\xF6r\xFC", recursive: true },
  { id: "1gBZ_nHumGI-VjgqYjKTLTe_moSi4Pbl6", name: "Yeni Ma\xE7 Klas\xF6r\xFC", recursive: true }
];
var TARGET_FILES = [
  { id: "1HrTEuaINToqL53CIk6ndCTAnYudrCRuAFshrHQC_5kY", name: "OKUL \u0130L VE \u0130L\xC7E (2025-2026)" },
  { id: "1djS7vV33pawiJa_zcuK2Z4j69RD0VKr-rYsRnLZ8H8s", name: "MASA G\xD6REVL\u0130LER\u0130 (2025-2026)" }
];
var normalizeString = (str) => {
  if (!str) return "";
  return str.toLocaleUpperCase("tr-TR").replace(/\./g, "").replace(/\s+/g, " ").replace(/Ğ/g, "G").replace(/Ü/g, "U").replace(/Ş/g, "S").replace(/İ/g, "I").replace(/I/g, "I").replace(/Ö/g, "O").replace(/Ç/g, "C").replace(/ğ/g, "G").replace(/ü/g, "U").replace(/ş/g, "S").replace(/ı/g, "I").replace(/ö/g, "O").replace(/ç/g, "C").trim();
};
var getMatchId = (match) => {
  const str = `${match.date}_${match.time}_${match.teamA}_${match.teamB}_${match.hall}`;
  return Buffer.from(str, "utf8").toString("base64").replace(/[^a-zA-Z0-9]/g, "");
};
var containsName = (value, nameParts) => {
  if (!value) return false;
  const val = normalizeString(String(value));
  return nameParts.every((part) => val.includes(normalizeString(part)));
};
var parseWorkbookData = (data, type, fileName) => {
  const workbook = XLSX.read(data, { type });
  const matches = [];
  let columnsToCheck = ["H", "I", "J", "K", "L", "M"];
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: "A", raw: false, defval: "" });
    rows.forEach((row) => {
      const date = String(row["A"] || "").trim();
      if (!date || date.length < 5) return;
      matches.push({
        date,
        hall: String(row["B"] || "").trim(),
        time: String(row["C"] || "").trim(),
        teamA: String(row["D"] || "").trim(),
        teamB: String(row["E"] || "").trim(),
        category: String(row["F"] || "").trim(),
        group: String(row["G"] || "").trim(),
        h: String(row["H"] || "").trim(),
        i: String(row["I"] || "").trim(),
        j: String(row["J"] || "").trim(),
        k: String(row["K"] || "").trim(),
        l: String(row["L"] || "").trim(),
        m: String(row["M"] || "").trim(),
        sourceFile: fileName
      });
    });
  });
  return matches;
};
var sendBotMessage = async (phone, apiKey, msg) => {
  try {
    const encoded = encodeURIComponent(msg);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`;
    await fetch(url);
  } catch (e) {
    console.error("Bot Error:", e);
  }
};
async function handler(req, res) {
  if (!import_app.default.apps.length) {
    import_app.default.initializeApp(FIREBASE_CONFIG);
  }
  const db = import_app.default.database();
  try {
    console.log("Cron started...");
    const usersSnapshot = await db.ref("users").once("value");
    const usersData = usersSnapshot.val();
    if (!usersData) return res.status(200).json({ status: "no users" });
    const approvedUsers = Object.keys(usersData).map((uid) => ({ uid, ...usersData[uid] })).filter((u) => u.isApproved && u.botConfig?.phone && u.botConfig?.apiKey);
    if (approvedUsers.length === 0) return res.status(200).json({ status: "no approved users with bot config" });
    const allMatches = [];
    const scanFolder = async (folderId, resourceKey, fileName) => {
      const query = `'${folderId}' in parents and trashed=false`;
      let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&key=${DRIVE_API_KEY}&fields=files(id,name,mimeType)`;
      const headers = {};
      if (resourceKey) headers["X-Goog-Drive-Resource-Keys"] = `${folderId}/${resourceKey}`;
      const resp = await fetch(url, { headers });
      const data = await resp.json();
      const files = data.files || [];
      for (const file of files) {
        if (file.mimeType.includes("spreadsheet")) {
          const exportUrl = file.mimeType.includes("google-apps.spreadsheet") ? `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv&key=${DRIVE_API_KEY}` : `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${DRIVE_API_KEY}`;
          const fileResp = await fetch(exportUrl, { headers });
          if (fileResp.ok) {
            const content = await (file.mimeType.includes("google-apps.spreadsheet") ? fileResp.text() : fileResp.arrayBuffer());
            const found = parseWorkbookData(content, file.mimeType.includes("google-apps.spreadsheet") ? "string" : "array", file.name);
            allMatches.push(...found);
          }
        }
      }
    };
    for (const folder of TARGET_FOLDERS) {
      await scanFolder(folder.id, folder.resourceKey);
    }
    for (const fileConfig of TARGET_FILES) {
      const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileConfig.id}/export?mimeType=text/csv&key=${DRIVE_API_KEY}`;
      const fileResp = await fetch(exportUrl);
      if (fileResp.ok) {
        const content = await fileResp.text();
        const found = parseWorkbookData(content, "string", fileConfig.name);
        allMatches.push(...found);
      }
    }
    console.log(`Total matches found: ${allMatches.length}`);
    for (const user of approvedUsers) {
      const nameParts = `${user.firstName} ${user.lastName}`.toLocaleUpperCase("tr-TR").split(" ").filter((p) => p.length > 1);
      const userMatches = allMatches.filter((m) => {
        const cols = [m.h, m.i, m.j, m.k, m.l, m.m];
        return cols.some((val) => containsName(val, nameParts));
      });
      if (userMatches.length === 0) continue;
      const notifiedSnapshot = await db.ref(`notified_matches/${user.uid}`).once("value");
      const notifiedIds = notifiedSnapshot.val() || {};
      const newMatches = userMatches.filter((m) => !notifiedIds[getMatchId(m)]);
      if (newMatches.length > 0) {
        let msg = `\u{1F680} *YEN\u0130 G\xD6REV S\u0130STEME EKLEND\u0130!*

`;
        for (const m of newMatches) {
          msg += `\u{1F3C0} ${m.teamA} vs ${m.teamB}
\u{1F4C5} ${m.date} | \u23F0 ${m.time}
\u{1F3DF}\uFE0F ${m.hall}

`;
          await db.ref(`notified_matches/${user.uid}/${getMatchId(m)}`).set(true);
        }
        msg += `_Vercel Arka Plan Taramas\u0131 taraf\u0131ndan iletildi._`;
        await sendBotMessage(user.botConfig.phone, user.botConfig.apiKey, msg);
        console.log(`Notification sent to ${user.firstName} for ${newMatches.length} matches.`);
      }
    }
    res.status(200).json({ status: "success", count: allMatches.length });
  } catch (error) {
    console.error("Cron Error:", error);
    res.status(500).json({ error: error.message });
  }
}
