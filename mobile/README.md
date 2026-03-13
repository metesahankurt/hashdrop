# HashDrop Mobile

Expo tabanli mobil uygulama artik gercek React Native route'lari uzerinde calisir.

## Neden bu yapi

- Web tarafindaki urun akisi mobile native ekranlar olarak yeniden kurulur.
- Android ve iPhone icin tek Expo kod tabani yeterlidir.
- Ortak is mantigi zamanla `shared` katmanina alinabilir.

## Kurulum

1. `cp mobile/.env.example mobile/.env`
2. Root'tan `npm run mobile:start` calistir.

## Gelistirme notu

Bu asama native foundation asamasidir. Transfer, chatroom ve conference ekranlari gercek native route olarak kuruldu; baglanti motorlari sonraki adimda bu ekranlara native SDK'lar ile baglanir.
