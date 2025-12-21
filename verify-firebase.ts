import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/auth';

const config = {
    apiKey: "AIzaSyCILoR2i6TtjpMl6pW0OOBhc3naQHAd12Q",
    authDomain: "mactakibi-50e0b.firebaseapp.com",
    projectId: "mactakibi-50e0b",
    storageBucket: "mactakibi-50e0b.firebaseapp.com",
    messagingSenderId: "529275453572",
    appId: "1:529275453572:web:4d6102920b55724e5902d1",
    measurementId: "G-V793VBMXF7",
    databaseURL: "https://mactakibi-50e0b.firebaseio.com"
};

async function test() {
    console.log("🔥 Firebase Bağlantısı Test Ediliyor...");
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(config);
        }
        console.log("✅ Firebase Initialize Başarılı.");

        // Test Database connection with a timeout
        const db = firebase.database();
        console.log("📡 Veritabanına bağlanılıyor: " + config.databaseURL);

        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Bağlantı zaman aşımına uğradı (10s)")), 10000)
        );

        const connectionTask = db.ref('.info/connected').once('value');

        const snapshot = await Promise.race([connectionTask, timeout]) as any;
        if (snapshot.val() === true) {
            console.log("✅ Veritabanı bağlantısı AKTİF.");
        } else {
            console.log("❌ Veritabanı bağlantısı KURULAMADI (.info/connected false)");
        }

        // Test if 'users' path is accessible (might fail due to rules, but connection is what matters)
        try {
            await db.ref('users').limitToFirst(1).once('value');
            console.log("✅ 'users' yoluna erişim başarılı (veya boş).");
        } catch (e: any) {
            console.log("ℹ️ 'users' yolu kısıtlı olabilir (Kuralları kontrol edin): " + e.message);
        }

    } catch (e: any) {
        console.error("❌ HATA:", e.message);
    }
    process.exit();
}

test();
