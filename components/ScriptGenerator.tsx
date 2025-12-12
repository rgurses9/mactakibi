import React, { useState } from 'react';
import { Copy, Check, FileCode, ExternalLink, Settings, Flame } from 'lucide-react';

const ScriptGenerator: React.FC = () => {
  const [phone, setPhone] = useState('905307853007');
  const [apiKey, setApiKey] = useState('7933007');
  const [folderId, setFolderId] = useState('0ByPao_qBUjN-YXJZSG5Fancybmc');
  const [firebaseUrl, setFirebaseUrl] = useState('https://mactakibi-50e0b.firebaseio.com');
  const [firebaseSecret, setFirebaseSecret] = useState('');
  const [copied, setCopied] = useState(false);

  const generateCode = () => {
    return `// --- KULLANICI AYARLARI ---
var ARANACAK_ISIM = "RIFAT GÜRSES";
var ANA_KLASOR_ID = "${folderId}"; 
var TELEFON_NUMARASI = "${phone}"; 
var API_KEY = "${apiKey}"; 

// --- FIREBASE AYARLARI (Canlı Veri İçin) ---
// Veritabanı URL'si (sonunda / yok)
var FIREBASE_URL = "${firebaseUrl || 'https://PROJE-ID.firebaseio.com'}"; 
// Veritabanı Secret (Project Settings > Service Accounts > Database Secrets)
var FIREBASE_SECRET = "${firebaseSecret || 'FIREBASE_SECRET_KEY'}";

// --- SABİT: Durum Takip Sayfasının Adı ---
var STATE_SHEET_NAME = "RIFAT_GURSES_TAKIP_DURUMU";

// Ana Fonksiyon: Sadece RIFAT GÜRSES satırı değiştiğinde detaylı bildirim gönderir
function otomatikKontrolVeBildirim() {
  var scriptProperties = PropertiesService.getScriptProperties();
  
  // Son kontrol zamanını al
  var sonKontrolZamaniKaydi = scriptProperties.getProperty('SON_KONTROL');
  var sonKontrolZamani = sonKontrolZamaniKaydi ? parseFloat(sonKontrolZamaniKaydi) : new Date().getTime();
  
  var simdikiZaman = new Date().getTime();
  var anaKlasor;
  try {
    anaKlasor = DriveApp.getFolderById(ANA_KLASOR_ID);
  } catch (e) {
    console.error("HATA: Klasöre erişim sağlanamıyor.");
    return;
  }
  
  // Degisiklikleri depolamak için dizi
  var bulunanDegisiklikler = []; 
  // Tüm bulunan maçların temiz listesi (Firebase için)
  var tumGuncelMaclar = [];

  // Durum takip sayfasını yükle ve tüm veriyi hafızaya al
  var stateSheet = getStateSheet();
  var stateData = stateSheet.getDataRange().getValues();

  // Dosyaları tara ve RIFAT GÜRSES'e ait maçları bul
  yeniDosyalariBul(anaKlasor, sonKontrolZamani, bulunanDegisiklikler, tumGuncelMaclar, stateSheet, stateData);
  
  // 1. WhatsApp Bildirimi (Sadece Yeni Değişiklikler İçin)
  if (bulunanDegisiklikler.length > 0) {
    var mesaj = "🚨 *GÖREV BİLGİSİ GÜNCELLENDİ*\\n";
    mesaj += "👤 *İsim:* " + ARANACAK_ISIM + "\\n";
    mesaj += "⏰ *Bildirim Saati:* " + new Date().toLocaleTimeString("tr-TR") + "\\n";
    mesaj += "〰️〰️〰️〰️〰️〰️〰️〰️\\n";
    
    for(var i = 0; i < bulunanDegisiklikler.length; i++) {
      var dosyaVerisi = bulunanDegisiklikler[i];
      mesaj += "📂 *Dosya:* " + dosyaVerisi.fileName + "\\n";
      
      if (dosyaVerisi.details && dosyaVerisi.details.length > 0) {
        for (var j = 0; j < dosyaVerisi.details.length; j++) {
          var d = dosyaVerisi.details[j];
          mesaj += "\\n🏀 *YENİ MAÇ/GÖREV DETAYI:*\\n";
          mesaj += "📅 Tarih: " + d.tarih + "\\n";
          mesaj += "🏟️ Salon: " + d.hall + "\\n"; // JS tarafındaki hall ile eşleşmeli
          mesaj += "⏰ Saat: " + d.time + "\\n";
          mesaj += "⚔️ Maç: " + d.teamA + " 🆚 " + d.teamB + "\\n";
          mesaj += "------------------------\\n";
        }
      }
    }
    mesaj += "\\n✅ _Otomatik Bot tarafından gönderilmiştir._";
    whatsappMesajiGonder(mesaj);
  }
  
  // 2. Firebase Güncelleme (Her zaman en güncel tam listeyi basar)
  if (FIREBASE_URL && FIREBASE_SECRET && tumGuncelMaclar.length > 0) {
     firebaseGuncelle(tumGuncelMaclar);
  } else if (tumGuncelMaclar.length === 0) {
     // Hiç maç yoksa veritabanını temizle veya boş array gönder
     firebaseGuncelle([]); 
  }
  
  // Son kontrol zamanını güncelle
  scriptProperties.setProperty('SON_KONTROL', simdikiZaman.toString());
}

// Alt klasörleri gezer ve değişen dosyaları filtreler
function yeniDosyalariBul(klasor, sonZaman, liste, tamListe, stateSheet, stateData) {
  var dosyalar = klasor.getFilesByType(MimeType.GOOGLE_SHEETS);
  
  while (dosyalar.hasNext()) {
    var dosya = dosyalar.next();
    
    // İçerik kontrolü yap
    var kontrolSonucu = dosyaIceriginiKontrolEt(dosya, stateSheet, stateData);
    
    // Eğer değişiklik varsa bildirim listesine ekle
    if (kontrolSonucu.isChanged) {
        liste.push({
            fileName: dosya.getName(),
            count: kontrolSonucu.count,
            details: kontrolSonucu.details
        });
    }
    
    // Tüm güncel maçları (değişmese bile) ana listeye ekle
    // Not: dosyaIceriginiKontrolEt fonksiyonunu biraz modifiye edip tüm maçları da döndürmesini sağlamalıyız
    // Şimdilik sadece yeni bulunanları değil, dosyada o an bulduğu TÜM Rıfat Gürses satırlarını ekliyoruz.
    if (kontrolSonucu.allMatches && kontrolSonucu.allMatches.length > 0) {
        for(var m=0; m<kontrolSonucu.allMatches.length; m++) {
            // Source file ekle
            var mac = kontrolSonucu.allMatches[m];
            mac.sourceFile = dosya.getName();
            tamListe.push(mac);
        }
    }
  }
  
  // Alt klasörleri de tara
  var altKlasorler = klasor.getFolders();
  while (altKlasorler.hasNext()) {
    yeniDosyalariBul(altKlasorler.next(), sonZaman, liste, tamListe, stateSheet, stateData);
  }
}

// Satır içeriğini karşılaştırır ve detayları çeker
function dosyaIceriginiKontrolEt(dosya, stateSheet, stateData) {
  var ssId = dosya.getId();
  var ssName = dosya.getName();
  var isChanged = false;
  var totalCount = 0; 
  var changedDetails = []; 
  var allMatchesInFile = [];

  try {
    var sheet = SpreadsheetApp.open(dosya).getSheets()[0];
    var veriler = sheet.getDataRange().getValues();
    
    var existingStates = stateData.filter(function(row) { return row[0] === ssId; });
    
    for (var i = 0; i < veriler.length; i++) {
      var satir = veriler[i];
      var satirMetni = satir.join(" ").toUpperCase(); 
      var rowIndex = i + 1; 

      // RIFAT GÜRSES var mı?
      if (satirMetni.indexOf(ARANACAK_ISIM.toUpperCase()) > -1) {
          totalCount++;
      
          // Detay Obj (Web App Type yapısına uygun field isimleri)
          var detayObj = {
              date: tarihFormatla(satir[0]),  // A Sütunu
              hall: satir[1],                 // B Sütunu
              time: saatFormatla(satir[2]),    // C Sütunu
              teamA: satir[3],                // D Sütunu
              teamB: satir[4],                // E Sütunu
              category: satir[5],              // F Sütunu
              group: satir[6],                  // G Sütunu
              scorer: satir[9],         // J Sütunu
              timer: satir[10],        // K Sütunu
              shotClock: satir[11]     // L Sütunu
          };
          
          allMatchesInFile.push(detayObj);

          // Değişiklik kontrolü
          var currentRowHash = satir.join("|||"); 
          var oldState = null;
          for(var k=0; k<existingStates.length; k++) {
             if(existingStates[k][1] === rowIndex) { oldState = existingStates[k]; break; }
          }
          
          if (!oldState || oldState[2] !== currentRowHash) {
            isChanged = true;
            changedDetails.push(detayObj);
            
            var newRow = [ssId, rowIndex, currentRowHash, ssName, new Date()];
            stateSheet.appendRow(newRow);
          }
      } 
    }

  } catch (e) {
    console.log("Hata: " + ssName + " - " + e);
    return { isChanged: false, count: 0, details: [], allMatches: [] };
  }
  
  return { isChanged: isChanged, count: totalCount, details: changedDetails, allMatches: allMatchesInFile };
}

function firebaseGuncelle(data) {
  try {
    var firebaseUrl = FIREBASE_URL + "/matches.json?auth=" + FIREBASE_SECRET;
    var options = {
      method: "put",
      contentType: "application/json",
      payload: JSON.stringify(data),
      muteHttpExceptions: true
    };
    var response = UrlFetchApp.fetch(firebaseUrl, options);
    console.log("Firebase Yanıtı: " + response.getResponseCode());
  } catch(e) {
    console.error("Firebase Hatası: " + e);
  }
}

function tarihFormatla(deger) {
  if (Object.prototype.toString.call(deger) === '[object Date]') {
    return Utilities.formatDate(deger, "GMT+3", "dd.MM.yyyy");
  }
  return deger;
}

function saatFormatla(deger) {
  if (Object.prototype.toString.call(deger) === '[object Date]') {
    return Utilities.formatDate(deger, "GMT+3", "HH:mm");
  }
  return deger;
}

function getStateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(STATE_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(STATE_SHEET_NAME);
    sheet.appendRow(["FILE_ID", "ROW_INDEX", "ROW_HASH", "FILE_NAME", "LAST_CHECK"]);
    sheet.hideSheet(); 
  }
  return sheet;
}

function whatsappMesajiGonder(mesaj) {
  try {
    var encodeMesaj = encodeURIComponent(mesaj);
    var url = "https://api.callmebot.com/whatsapp.php?phone=" + TELEFON_NUMARASI + "&text=" + encodeMesaj + "&apikey=" + API_KEY;
    UrlFetchApp.fetch(url, {method: "post", muteHttpExceptions: true});
  } catch (e) { console.log(e); }
}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="text-blue-600" />
          Bot & Firebase Kurulumu
        </h2>
        
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-orange-900 flex items-center gap-2">
            <Flame size={18} />
            Canlı Veri Özelliği
          </h3>
          <p className="text-sm text-orange-800 mt-2">
            Verilerin anlık olarak web ekranına düşmesi için Bot'un <strong>Firebase Realtime Database</strong> ile konuşması gerekir. 
            Aşağıdaki alanlara Firebase Proje URL'nizi ve Database Secret anahtarını girin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Firebase Veritabanı URL</label>
            <input 
              type="text" 
              placeholder='https://proje-id.firebaseio.com'
              value={firebaseUrl} 
              onChange={(e) => setFirebaseUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Firebase Database Secret</label>
            <input 
              type="password" 
              placeholder='Gizli Anahtar'
              value={firebaseSecret} 
              onChange={(e) => setFirebaseSecret(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
           <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Telefon Numarası</label>
            <input 
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Klasör ID</label>
            <input 
              type="text" 
              value={folderId} 
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="relative">
          <div className="absolute top-2 right-2">
            <button
              onClick={copyToClipboard}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                copied ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Kopyalandı!' : 'Kodu Kopyala'}
            </button>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-xs font-mono h-96">
            {generateCode()}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ScriptGenerator;