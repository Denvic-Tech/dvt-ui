const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({
    headless: false, // если нужен UI
    executablePath:
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // если используете обычный Chrome
    args: [
      '--user-data-dir=C:\\Users\\YourUser\\AppData\\Local\\Google\\Chrome\\User Data',
      '--profile-directory=Profile 1',
    ],
  });
  const page = await browser.newPage();
  await page.goto('https://example.com');
  // ...
})();
