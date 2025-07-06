const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

async function scrapeConcurrency( username ) {

    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
        args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled',
            '--no-zygote'
        ]
    })

  const page = await browser.newPage()

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36')

  await page.setViewport({ width: 1366, height: 768 })

  try {

    let wagerAmount = 0

    await page.goto(`https://shuffle.com/?modal=user&md-name=${username}`, { waitUntil: 'networkidle2', timeout: 0 })

    // await new Promise(resolve => setTimeout(resolve, 5000)); // wait for the page to fully load

    const joinDateSelector = '.StatisticsPanel_infoValue__p6TM3'

    await page.waitForSelector(joinDateSelector, {
        timeout: 60000
    })

    const wagerSelector = '.ValueWithIcon_root__eGsJu'

    // Select all buttons with usernames and extract text
    const joinDate = await page.$eval(
      joinDateSelector,
      joinedDate => joinedDate.textContent.trim()
    )

    const userExists = joinDate != '-' ? true : false

    if(userExists){

        const wager = await page.$eval(
            wagerSelector,
            amount => amount.textContent.trim()
        );

        wagerAmount = wager

    }

    return {
        user: userExists,
        wagerAmount: wagerAmount
    };

  } catch (error) {

    console.error('Error scraping usernames:', error)
    return []; // return empty array on error

  } finally {

    await browser.close()
    
  }
}

module.exports = scrapeConcurrency