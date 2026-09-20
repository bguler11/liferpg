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
| `npm run deploy` | Build + Firebase deploy |
| `python3 scripts/make-icons.py` | PWA ikonlarını yeniden üretir |

## Yapı

```
src/logic.ts        oyun kuralları (saf fonksiyonlar)
src/store.ts        Firebase Auth + Firestore canlı senkron (çevrimdışı önbellekli)
src/sprite.ts       seviyeye göre değişen pixel karakter
src/components/     Today, Character, MapView, Settings, Overlays, Login
firestore.rules     kullanıcı bazlı erişim kuralları
```

## Sıradaki adımlar (henüz yok)

- **Push hatırlatma**: FCM + zamanlanmış Cloud Function. Blaze planı (kredi kartı) gerektirir.
- **Gardırop**: ekipman slotları, sandıktan eşya, renk varyantları.
- **Boss görevleri** ve haftalık gözden geçirme ekranı.
