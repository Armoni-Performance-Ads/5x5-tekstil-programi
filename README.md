# 5x5 Tekstil Programı — GitHub Pages kaynakları

Hazırlama: 14 Ekim 2026. Hedef: https://5x5tekstilprogrami.com/

Bu klasörün **içeriğini**, gizli `.nojekyll` dosyası dahil, onaylanmış GitHub deposunun yayın köküne yükleyin. Derleme, Node.js, veritabanı veya sunucu kodu gerektirmez. Pages: Settings → Pages → Deploy from a branch → seçilen dal / (root).

**Teknik devir paketi reklam lansmanı onayı değildir.** FormSubmit yurt dışı aktarım güvencesi ve nihai hukuk metinleri açık konudur. İç devir belgeleri ayrı pakettedir; bunları public repoya veya Pages dizinine yüklemeyin.

## Yerel çalıştırma

Bu klasörde `python3 -m http.server 8765 --bind 127.0.0.1` çalıştırın; tarayıcıda http://127.0.0.1:8765/ açın. HTML dosyasını çift tıklayarak test etmeyin. Gerçek form alıcısı korunmuştur; deneme gönderimi gerçek e-posta oluşturabilir. Sağlanan testlerde ağ gönderimleri taklit edilmiştir.

## Dosyalar

- `index.html`: mevcut tek sayfa, form, sekmeler, akordeonlar ve video modalı.
- `style.css`, `app.js`, `application.js`: tasarım ve davranışlar.
- `measurement.js`: yalnızca tarayıcı içi olaylar; analitik servisi/etiketi yok.
- `assets/`: logolar, favicon olarak kullanılan program logosu, dört yerel font ve lisansları, 13 yerel YouTube kapağı.
- `tesekkurler.html`: JavaScript kapalıyken normal POST için dönüş sayfası. Ana akış AJAX ile aynı sayfada başarı panelidir.
- `robots.txt`, `sitemap.xml`, `.nojekyll`.

## Yayın ayarları

Önce alan adı sahipliğini GitHub hesabında doğrulayın; Pages Custom domain alanına `5x5tekstilprogrami.com` ekleyin, sonra DNS'yi ayarlayın. CNAME dosyası bilerek eklenmedi: alan adı bağlama kararını teknik sahip verecek, dal tabanlı yayında GitHub bunu oluşturabilir. HTTPS etkinleştirilmeli; kök ve www yönlendirmesi kontrol edilmeli. MX/SPF/DKIM/DMARC e-posta kayıtlarını koruyun.

Canonical, Open Graph, sitemap ve robots hedef alan adına hazırlanmıştır. Önce github.io alt yolunda denenecekse varlık yolları görecelidir; canonical ve `_next` hedef alan adını göstermeye devam eder. Bu nedenle deneme yayını nihai alan adı kabul testi yerine geçmez.

Form action: `https://formsubmit.co/onur@armoni.agency`.
AJAX endpoint: `https://formsubmit.co/ajax/onur@armoni.agency`.
Normal POST `_next`: `https://5x5tekstilprogrami.com/tesekkurler.html`.
AJAX bu adrese yönlenmez; başarılı sağlayıcı yanıtından sonra mevcut sayfada başarı gösterir. Başarı ekranı posta teslim makbuzu değildir.

Meta Pixel, GA4/GTM, dönüşüm etiketleri ve izin yönetimi kurulmamıştır. Fırat bunları hukuk/işletme kararı ardından kuracaktır. Form alıcısını, endpointi veya hizmet sağlayıcısını ayrıca onay almadan değiştirmeyin.

Resmî kurulum: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
Form: https://formsubmit.co/documentation ve https://formsubmit.co/help
