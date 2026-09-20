import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' })
await page.screenshot({ path: 'hero.png' })
await page.evaluate(() => { document.getElementById('scrollWrap').scrollLeft = window.innerWidth })
await page.waitForTimeout(300)
await page.screenshot({ path: 'quienes-somos.png' })
await page.evaluate(() => { document.getElementById('scrollWrap').scrollLeft = window.innerWidth * 2 })
await page.waitForTimeout(300)
await page.screenshot({ path: 'trabajos.png' })
await browser.close()
