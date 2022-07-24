console.log('hi worker');

const puppeteer = require('puppeteer');

(async function () {
    const browsers = await puppeteer.launch({
        args: ["--no-sandbox",],
        defaultViewport: { width: 850, height: 1920 }
    });
    const page = await browsers.newPage()

    console.log(page);
})();


