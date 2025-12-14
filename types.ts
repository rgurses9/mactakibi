export interface MatchDetails {
  date: string;       // A Sütunu - TARİH
  hall: string;       // B Sütunu - SALON
  time: string;       // C Sütunu - SAAT
  teamA: string;      // D Sütunu - A TAKIMI
  teamB: string;      // E Sütunu - B TAKIMI
  category: string;   // F Sütunu - KATEGORİ
  group: string;      // G Sütunu - GRUP
  scorer: string;     // J Sütunu - SAYI GÖREVLİSİ
  timer: string;      // K Sütunu - SAAT GÖREVLİSİ
  shotClock: string;  // L Sütunu - ŞUT SAATİ GÖREVLİSİ
  scorerLabel?: string;    // Label for scorer column (e.g., "MASA GÖREVLİSİ 1")
  timerLabel?: string;     // Label for timer column
  shotClockLabel?: string; // Label for shotClock column
  sourceFile?: string; // Optional source file name
}

export interface AnalysisResult {
  fileName: string;
  matches: MatchDetails[];
  error?: string;
}