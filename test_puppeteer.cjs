const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:8080/');
  await new Promise(r => setTimeout(r, 3000)); // wait for React to render
  
  await page.screenshot({ path: 'screenshot.png' });
  await browser.close();
  console.log('Screenshot saved to screenshot.png');
})();
