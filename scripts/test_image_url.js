import https from 'https';

https.get('https://viva-restaurant-77588.web.app/images/matcha_lava_cake.png', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  process.exit(0);
}).on('error', (e) => {
  console.error(e);
  process.exit(1);
});
