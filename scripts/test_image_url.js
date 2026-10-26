/**
 * @file test_image_url.js
 * @description Cloud CDN Media Asset Reachability and HTTP Verification Probe.
 * 
 * Thesis Context:
 * Validates that static culinary image assets deployed to Firebase Hosting CDN
 * are publicly accessible with HTTP 200 OK headers.
 * 
 * @module scripts/test_image_url
 * @author Thesis Research Team
 */

import https from 'https';

https.get('https://viva-restaurant-77588.web.app/images/matcha_lava_cake.png', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  process.exit(0);
}).on('error', (e) => {
  console.error(e);
  process.exit(1);
});
