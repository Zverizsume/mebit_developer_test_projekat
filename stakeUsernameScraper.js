const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const { insertUsernames } = require('./db_functions')

puppeteer.use(StealthPlugin())

let browser
let page
let scraping = false
let intervalId

async function startScraping(intervalSeconds = 5) {

  if (scraping) return console.log('Already scraping.')

  scraping = true

  console.log('Starting scraping...')

  browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
    args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--no-zygote'
    ],
    defaultViewport: { width: 1366, height: 768 }
  })

  page = await browser.newPage()

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
  )

  await page.goto('https://stake.com/casino/home', {
    waitUntil: 'domcontentloaded',
    timeout: 0
  })

  await page.waitForSelector('.svelte-bz5w9d', {
    timeout: 60000
  })

  await new Promise(resolve => setTimeout(resolve, 8000))

  // Scroll the page with mousewheel to update some of the content

  await page.mouse.wheel({ deltaY: 1000 })
  await new Promise(resolve => setTimeout(resolve, 2000))

  await page.mouse.wheel({ deltaY: 1000 })
  await new Promise(resolve => setTimeout(resolve, 2000))

  const containerScrollTop = await page.evaluate( async () => {

    const container = document.querySelector('.scrollable')
    const target = document.querySelector('.svelte-bz5w9d')

    if (!container || !target) return -1

    const containerHight = container.scrollHeight

    container.scrollTop = containerHight / 2

    await new Promise(resolve => setTimeout(resolve, 2000)) // wait for scroll to take effect

    return container.scrollTop

  })

  //console.log('Container scroll possition after scrolling', containerScrollTop)

  const buttonClassSelector = 'button[data-analytics="bets-board-all-bets-button"]' // all bets button that needs to be clicked to change view
  const usernameClassSelector = 'button[data-analytics="global-betsBoard-user-button"]' // usernames for scraping

  await page.waitForSelector(buttonClassSelector, { timeout: 10000 })

  await page.click(buttonClassSelector)

  await page.waitForSelector(usernameClassSelector, {
    timeout: 60000
  })

  intervalId = setInterval(async () => {

    try {

      const usernames = await page.$$eval(
        usernameClassSelector,
        elements => elements.map(el => el.textContent.trim())
      )

      console.log('Scraped usernames:', usernames)

      const players = usernames.map( username => ({

        username,
        date: new Date()

      }))

      await insertUsernames(players)

    } catch (err) {

      console.error('Scrape error:', err.message)

    }

  }, intervalSeconds * 1000)
}

async function stopScraping() {

  if (!scraping) return console.log('Not currently scraping.')
  
  scraping = false
  clearInterval(intervalId)
  console.log('Stopped scraping.')

  if (page) await page.close()
  if (browser) await browser.close()

}

module.exports = {
  startScraping,
  stopScraping,
}
