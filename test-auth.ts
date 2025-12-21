import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

const config = {
    apiKey: "AIzaSyCILoR2i6TtjpMl6pW0OOBhc3naQHAd12Q",
    authDomain: "mactakibi-50e0b.firebaseapp.com",
    projectId: "mactakibi-50e0b"
};

async function testAuth() {
    console.log("🔐 Firebase Auth Test Ediliyor...");
    try {
        firebase.initializeApp(config);
        const auth = firebase.auth();

        // This will fail since no body/invalid request, but if it's a 404 project-wise it's a bigger issue
        // We can check if signInAnonymously works if enabled
        try {
            await auth.signInAnonymously();
            console.log("✅ Anonim giriş başarılı! (Auth çalışıyor)");
        } catch (e: any) {
            if (e.code === 'auth/operation-not-allowed') {
                console.log("✅ API Erişilebilir, ancak anonim giriş devre dışı. (Auth altyapısı sağlam)");
            } else {
                console.log("ℹ️ Auth Hatası (Beklenen veya Gerçek): " + e.message);
            }
        }
    } catch (e: any) {
        console.error("❌ HATA:", e.message);
    }
    process.exit();
}

testAuth();
