# WhatsApp Bildirim Sorun Giderme Kılavuzu

## Sorun: Manuel mesajlar "iletildi" yazıyor ama gelmiyor

### Olası Nedenler ve Çözümler

#### 1. 🔑 API Key Süresi Dolmuş Olabilir
CallMeBot API key'leri zaman içinde pasif hale gelebilir veya devre dışı kalabilir.

**Çözüm:**
- WhatsApp'tan `+34 644 71 81 99` numarasına aşağıdaki mesajı gönderin:
  ```
  I allow callmebot to send me messages
  ```
- Gelen yanıtta yeni bir API key alacaksınız
- Bot Ayarları menüsünden yeni API key'i kaydedin

#### 2. 📞 Telefon Numarası Formatı Hatalı
Telefon numaranız ülke kodu ile birlikte ve boşluksuz olmalı.

**Doğru Format:**
- ✅ `905307853007` (Türkiye için)
- ✅ `905551234567`

**Yanlış Format:**
- ❌ `+90 530 785 3007` (boşluk var)
- ❌ `0530 785 3007` (ülke kodu yok)
- ❌ `+905307853007` (+ işareti var)

#### 3. 🚫 CallMeBot Günlük Limit Aşımı
CallMeBot ücretsiz kullanımda günlük mesaj limiti vardır.

**Çözüm:**
- Birkaç saat bekleyin
- Çok fazla test mesajı göndermekten kaçının
- Mesajları birleştirerek tek seferde gönderin

#### 4. ⏱️ Zaman Aşımı (Timeout)
CallMeBot servisi bazen yavaş yanıt verebilir.

**Ne Yapmalısınız:**
- "İletildi" yazıyorsa WhatsApp'ınızı kontrol edin
- Mesaj 1-2 dakika gecikmeyle gelebilir
- Birden fazla kez göndermeyin (aynı mesaj tekrar edebilir)

#### 5. 🌐 İnternet Bağlantısı
Zayıf internet bağlantısı mesajların iletilememe sine neden olabilir.

**Kontrol Edin:**
- İnternet bağlantınızın aktif olduğundan emin olun
- Başka web sitelerini açabildiğinizi kontrol edin

## 🔧 Test Adımları

### Adım 1: Bot Ayarlarını Açın
1. Üst menüden "Ayarlar" (⚙️) butonuna tıklayın
2. "Bot Ayarları" seçeneğini seçin

### Adım 2: Bilgilerinizi Kontrol Edin
1. Telefon numaranızın doğru formatta olduğundan emin olun
2. API key'inizin doğru girildiğinden emin olun
3. "Ayarları Kaydet" butonuna tıklayın

### Adım 3: Test Mesajı Gönderin
1. Bot Ayarları penceresinde aşağıda "WhatsApp Bağlantı Testi" bölümünü bulun
2. Test mesajını gözden geçirin (istediğiniz gibi değiştirebilirsiniz)
3. "Test Mesajı Gönder" butonuna tıklayın
4. WhatsApp'ınızı kontrol edin

### Adım 4: Sonuçları Değerlendirin

**✅ Başarılı:** Test mesajı WhatsApp'a geldiyse ayarlarınız doğru!

**❌ Başarısız:** Mesaj gelmediyse:
1. API key'inizi yenileyin (yukarıdaki adımları izleyin)
2. Telefon numaranızı kontrol edin
3. Birkaç dakika bekleyip tekrar deneyin

## 📱 CallMeBot API Key Alma Detayları

### Tam Adımlar
1. WhatsApp'ı açın
2. Yeni sohbet başlatın
3. Şu numarayı ekleyin: `+34 644 71 81 99`
4. Tam olarak şu mesajı gönderin (kopyala-yapıştır önerilir):
   ```
   I allow callmebot to send me messages
   ```
5. Otomatik yanıt gelecek, bu yanıtta API key'iniz yazacak
6. API key'i kopyalayıp Bot Ayarları'nda kaydedin

**Dikkat:**
- Mesajı tam olarak yukarıdaki gibi gönderin (noktalama dahil)
- İngilizce karakterler kullanın
- Başka bir şey eklemeyin

### Alternatif CallMeBot Numaraları

Eğer ana numara (`+34 644 71 81 99`) yanıt vermiyorsa, şu alternatif numaraları deneyebilirsiniz:

- **+34 623 78 95 80** - CallMeBot alternatif bot numarası
- **+34 623 78 64 49** - API key transfer numarası (eski bot çalışmıyorsa)

**Not:** Tüm numaralara aynı mesajı göndermeniz gerekir: `I allow callmebot to send me messages`


## 🛠️ Gelişmiş Sorun Giderme

### Console Loglarını Kontrol Edin
1. Tarayıcınızda F12 tuşuna basın
2. "Console" sekmesini açın
3. Mesaj göndermeyi deneyin
4. Hata mesajlarını okuyun

### Yaygın Hata Mesajları

**"Bot config eksik"**
- API key veya telefon numarası girilmemiş
- Bot Ayarları'ndan bilgileri girin

**"Zaman aşımına uğradı"**
- CallMeBot yavaş yanıt veriyor
- Birkaç dakika bekleyin, mesaj yine de gelmiş olabilir

**"Network error"**
- İnternet bağlantınızı kontrol edin
- Firewall/VPN ayarlarınızı kontrol edin

## 💡 İpuçları

1. **İlk Kurulum:** API key aldıktan hemen sonra mutlaka test mesajı gönderin
2. **Periyodik Kontrol:** Ayda bir test mesajı göndererek API key'inizin çalıştığından emin olun
3. **Mesaj Uzunluğu:** Çok uzun mesajlar sorun çıkarabilir, makul uzunlukta tutun
4. **Emoji Kullanımı:** Emoji'ler genellikle sorunsuz çalışır
5. **Özel Karakterler:** Türkçe karakterler (ğ, ü, ş, vb.) desteklenir

## ❓ Hala Çalışmıyor mu?

Eğer tüm adımları denediyseniz ve hala mesaj almıyorsanız:

1. **Farklı bir telefon numarası deneyin** - Başka bir WhatsApp hesabı ile test edin
2. **CallMeBot alternatiflerini araştırın** - Başka WhatsApp API servisleri mevcut
3. **Sistem yöneticisi ile iletişime geçin** - Kurumsal ağlarda engellemeler olabilir

## 📞 Destek

Sorunlarınız devam ediyorsa:
- Browser console ekran görüntüsü alın
- Kullandığınız telefon numarası formatını kontrol edin
- Test mesajı sonucunu kaydedin

---
**Not:** CallMeBot üçüncü taraf bir servistir ve bu uygulama ile direkt bağlantılı değildir. Servis kesintileri veya değişiklikler olabilir.
