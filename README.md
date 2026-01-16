# 🏀 Maç Takip Sistemi

Basketbol hakem atamaları için akıllı takip ve bildirim sistemi.

## 🚀 Özellikler

- ✅ Google Drive'dan otomatik maç taraması
- ✅ Firebase ile gerçek zamanlı senkronizasyon
- ✅ WhatsApp bildirimleri (CallMeBot entegrasyonu)
- ✅ Hakedişleri takip sistemi
- ✅ Responsive tasarım
- ✅ Kullanıcı bazlı filtreleme
- ✅ Ödeme durumu takibi

## 📱 WhatsApp Bildirim Kurulumu

### API Key Alma

1. WhatsApp'tan **+34 644 71 81 99** numarasına mesaj gönderin:
   ```
   I allow callmebot to send me messages
   ```
2. Gelen yanıttaki API key'i kopyalayın
3. Uygulamaya giriş yapın
4. Bot Ayarları menüsünden API key'i ve telefon numaranızı kaydedin

### Alternatif Numaralar

Ana numara yanıt vermiyorsa:
- `+34 623 78 95 80` - Alternatif bot
- `+34 623 78 64 49` - API key transfer

Detaylı sorun giderme için: [WHATSAPP_TROUBLESHOOTING.md](./WHATSAPP_TROUBLESHOOTING.md)

## 🛠️ Yerel Geliştirme

### Gereksinimler
- Node.js (v16+)
- npm veya yarn

### Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build
```

Uygulama `http://localhost:5173` adresinde çalışacaktır.

## 🔧 Yapılandırma

### Firebase Ayarları
Firebase yapılandırması `App.tsx` dosyasında tanımlıdır. Kendi Firebase projenizi kullanmak için:

1. Firebase Console'dan proje oluşturun
2. Realtime Database'i aktifleştirin
3. Yapılandırma bilgilerinizi `DEFAULT_FIREBASE_CONFIG` değişkenine ekleyin

### Google Drive API
Drive taraması için `services/driveService.ts` dosyasındaki API key ve klasör ID'lerini yapılandırın.

## 📁 Proje Yapısı

```
mactakibi/
├── components/          # React bileşenleri
│   ├── MatchListV4.tsx # Maç listesi görünümü
│   ├── WhatsAppSender.tsx # WhatsApp mesaj gönderimi
│   ├── WhatsAppTester.tsx # WhatsApp bağlantı testi
│   └── ...
├── services/           # API ve servis katmanı
│   ├── driveService.ts # Google Drive entegrasyonu
│   ├── firebaseService.ts # Firebase işlemleri
│   └── paymentService.ts # Ödeme takibi
├── App.tsx            # Ana uygulama
├── index.css          # Global stiller
└── types.ts           # TypeScript tipleri
```

## 🚢 Deployment

Proje Vercel üzerinde deploy edilebilir:

```bash
# Vercel CLI ile deploy
npm install -g vercel
vercel
```

veya GitHub entegrasyonu ile otomatik deploy kullanabilirsiniz.

## 📝 Sürüm Notları

### v11.3 (16 Ocak 2026)
- ✅ CallMeBot telefon numarası güncellendi
- ✅ WhatsApp test aracı eklendi
- ✅ Geliştirilmiş hata yakalama
- ✅ Timeout yönetimi eklendi
- ✅ Detaylı sorun giderme dokümantasyonu

### Önceki Sürümler
- v11.2: Dark mode desteği
- v11.1: Firebase Realtime Database entegrasyonu
- v11.0: Google Drive otomatik tarama

## 🐛 Bilinen Sorunlar & Çözümler

### WhatsApp Bildirimleri Gelmiyor
- API key'inizi yenileyin
- Telefon numarası formatını kontrol edin (ör: 905307853007)
- [Troubleshooting Guide](./WHATSAPP_TROUBLESHOOTING.md) dosyasına bakın

### Drive Taraması Çalışmıyor
- İnternet bağlantınızı kontrol edin
- API key'in geçerli olduğundan emin olun
- Manuel dosya yükleme kullanın

## 📄 Lisans

Bu proje özel kullanım içindir.

## 👥 Katkıda Bulunanlar

- Rıfat Gürses - Proje Sahibi
- Antigravity AI - Geliştirme Desteği

## 📞 Destek

Sorularınız için:
- GitHub Issues açın
- [WhatsApp Sorun Giderme Kılavuzu](./WHATSAPP_TROUBLESHOOTING.md) kontrol edin

---

**Son Güncelleme:** 16 Ocak 2026
