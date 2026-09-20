# Life RPG

66 günlük alışkanlık RPG'si. Vite + React + TypeScript, Firebase Auth (Google) + Firestore, PWA.
Oyun kuralları `src/logic.ts` içinde (XP, seri, ceza, seviye) ve testli.

## 1. Firebase'i hazırla (5 dk)

1. Firebase console'da proje aç (ya da mevcut birini kullan).
2. **Build > Authentication > Sign-in method**: Google'ı aç.
3. **Build > Firestore Database**: oluştur (production mode, `eur3` veya `europe-west1`).
4. **Project settings > Your apps**: Web app (`</>`) ekle. Çıkan `firebaseConfig` değerlerini al.

## 2. Yerelde çalıştır

```bash
cp .env.example .env      # değerleri doldur
npm install
npm run dev
```

`.env` boş bırakılırsa uygulama giriş istemeden **yerel modda** (localStorage) çalışır.

## 3. Yayınla

```bash
npx firebase-tools login
npx firebase-tools use --add     # projeni seç
npm run deploy                   # build + hosting + firestore.rules
```

`firestore.rules` her kullanıcının sadece kendi verisine (`users/{uid}/...`) erişmesine izin verir.
İlk deploy'dan sonra Authentication > Settings > **Authorized domains** listesinde
`<proje>.web.app` ve `<proje>.firebaseapp.com` olduğunu kontrol et (varsayılan gelir).

## 4. Telefona ekle

Yayın adresini telefonda aç, **Ana Ekrana Ekle** de. Uygulama tam ekran ve çevrimdışı çalışır;
internet yokken işaretlediklerin bağlanınca senkronlanır.

iOS'ta ana ekran uygulamasından Google girişi sorun çıkarırsa: önce Safari'de aç, giriş yap, sonra ana ekrana ekle.

## 5. Tek dosyalı sürümden veri taşıma

Eski uygulamada **Ayar > YEDEĞİ GÖSTER** > metni kopyala.
Buradaki **Ayar > YEDEK / TAŞIMA** kutusuna yapıştır > **İÇE AKTAR**. Seri ve XP aynen devam eder.

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm test` | Oyun mantığı + arayüz duman testleri |
| `npm run build` | Tip kontrolü + üretim derlemesi |
| `npm run deploy` | Build + Firebase deploy (hosting + kurallar + index) |
| `python3 scripts/make-icons.py` | PWA ikonlarını yeniden üretir |
| `node tools/send-reminders.mjs --dry-run` | Hatırlatmanın kime gideceğini gösterir (gönderme yok) |

## Yapı

```
firestore.indexes.json  koleksiyon-grubu index'i (hatırlatma sorgusu için şart)
src/logic.ts        oyun kuralları (saf fonksiyonlar)
src/store.ts        Firebase Auth + Firestore canlı senkron (çevrimdışı önbellekli)
src/sprite.ts       seviyeye göre değişen pixel karakter
src/push.ts         bildirim izni + cihaz token'ı (Firestore: users/{uid}/push)
public/push-sw.js   arka plan bildirimi (ayrı kapsam, PWA worker'ına dokunmaz)
tools/              GitHub Actions'ın çalıştırdığı hatırlatma göndericisi
src/components/     Today, Character, MapView, Settings, Overlays, Login
firestore.rules     kullanıcı bazlı erişim kuralları
```

## 6. Telefona hatırlatma bildirimi (isteğe bağlı)

Akşam çekirdek görevlerin bitmediyse telefona bildirim düşer; bittiyse düşmez.
Gönderimi ücretsiz GitHub Actions cron'u yapar, Blaze planı gerekmez.

1. **Console > Project settings > Cloud Messaging > Web Push certificates > Generate key pair**.
   Çıkan genel anahtarı `.env` içine `VITE_FIREBASE_VAPID_KEY=` olarak yaz, yeniden deploy et.
2. **Console > Project settings > Service accounts > Generate new private key**: inen JSON'u
   GitHub'da **Settings > Secrets and variables > Actions > New repository secret** ile
   `FIREBASE_SERVICE_ACCOUNT` adıyla kaydet (dosyanın tamamını yapıştır).
3. Uygulamada **Ayar > HATIRLATMA > BU CİHAZDA AÇ**, saati seç. Her cihaz için ayrı açılır.
4. Denemek için Actions sekmesinde **Hatırlatma gönder > Run workflow** (dry run seçeneğiyle
   kime gideceğini bildirim atmadan görebilirsin).

Bilinmesi gerekenler:

- **iPhone**: bildirim yalnızca uygulama **Ana Ekrana Ekle** ile kurulmuşsa çalışır (iOS 16.4+).
  Safari sekmesinde açıkken bildirim gelmez. Android'de böyle bir kısıt yok.
- GitHub cron'u yoğun saatlerde birkaç dakika gecikebilir; script hedef saatten sonraki
  3 saatlik pencerede hâlâ gönderir ve aynı gün ikinci kez göndermez.
- Depoda 60 gün hiç hareket olmazsa GitHub zamanlanmış işi durdurur, Actions sekmesinden
  tek tıkla geri açılır.

## Sıradaki adımlar (henüz yok)

- **Gardırop**: ekipman slotları, sandıktan eşya, renk varyantları.
- **Boss görevleri** ve haftalık gözden geçirme ekranı.
