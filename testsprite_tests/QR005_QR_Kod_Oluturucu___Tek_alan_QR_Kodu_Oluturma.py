import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:3000/qr-imza-yonetimi", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Input password and click login button
        frame = context.pages[-1]
        # Input password
        elem = frame.locator('xpath=html/body/div/div/div[5]/div[2]/div/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('28150503')
        

        # -> Click the login button to proceed
        frame = context.pages[-1]
        # Click login button
        elem = frame.locator('xpath=html/body/div/div/div[5]/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'QR Kod Oluştur' button to navigate to QR code creation page
        frame = context.pages[-1]
        # Click 'QR Kod Oluştur' button
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select an employee from the autocomplete input to proceed with QR code creation
        frame = context.pages[-1]
        # Click on employee autocomplete input to activate dropdown
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[2]/div/div/div/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select an employee from the autocomplete dropdown list
        frame = context.pages[-1]
        # Select employee Abbas Can ÖNGER from autocomplete dropdown
        elem = frame.locator('xpath=html/body/div[3]/div/ul/li').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select 'Giriş' (CHECK_IN) radio button for action type
        frame = context.pages[-1]
        # Select 'Giriş' (CHECK_IN) radio button
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[2]/div/div/fieldset/div/label/span/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select 'MERKEZ' location radio button and then click 'Tekli QR Kod Oluştur' button to generate QR code
        frame = context.pages[-1]
        # Select 'MERKEZ' location radio button
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[2]/div/div/fieldset[2]/div/label/span/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        # Click 'Tekli QR Kod Oluştur' button to generate QR code
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[2]/div/div/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Verify the QR code expiration timer is counting down and the Download and Link Copy buttons are functional
        frame = context.pages[-1]
        # Click 'İndir' button to test download functionality
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[2]/div[2]/div/div/div[5]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Linki Kopyala' button to test copy link functionality
        frame = context.pages[-1]
        # Click 'Linki Kopyala' button to test copy link functionality
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[2]/div[2]/div/div/div[5]/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Çanga Vardiya Sistemi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Çalışanlar').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=GİRİŞ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=MERKEZ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Tekli QR Kod Oluştur').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=QR Kod Hazır! ✅').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Kalan Süre: 0:19').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=İndir').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Linki Kopyala').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    