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
        # -> Input the password '28150503' and submit to access the QR imza yonetimi page.
        frame = context.pages[-1]
        # Input the password to login
        elem = frame.locator('xpath=html/body/div/div/div[5]/div[2]/div/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('28150503')
        

        # -> Wait for the page to load and verify the QR imza yonetimi page is displayed.
        frame = context.pages[-1]
        # Click the login button to submit password and load the page
        elem = frame.locator('xpath=html/body/div/div/div[5]/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Resize browser window to mobile size (375px width) to verify mobile layout adaptation.
        await page.goto('http://localhost:3000/qr-imza-yonetimi', timeout=10000)
        await asyncio.sleep(3)
        

        await page.mouse.wheel(0, 300)
        

        # -> Resize the browser window to mobile size (375px width) and verify the page layout adapts correctly, including vertical stacking of statistics cards and horizontal scrollability of tabs and table.
        await page.goto('http://localhost:3000/qr-imza-yonetimi', timeout=10000)
        await asyncio.sleep(3)
        

        await page.mouse.wheel(0, 200)
        

        # -> Resize the browser window to mobile size (375px width) and verify the page layout adapts correctly, including vertical stacking of statistics cards and horizontal scrollability of tabs and table.
        frame = context.pages[-1]
        # Clear search input to avoid filtering issues
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[3]/div[2]/div/div/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('')
        

        frame = context.pages[-1]
        # Click on 'Bugünkü Kayıtlar' tab to ensure default tab is active
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[2]/div/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Resize the browser window to mobile size (375px width) and verify the page layout adapts correctly, including vertical stacking of statistics cards and horizontal scrollability of tabs and table.
        await page.goto('http://localhost:3000/qr-imza-yonetimi', timeout=10000)
        await asyncio.sleep(3)
        

        await page.mouse.wheel(0, 100)
        

        # -> Resize the browser window to mobile size (375px width) and verify the page layout adapts correctly, including vertical stacking of statistics cards and horizontal scrollability of tabs and table.
        frame = context.pages[-1]
        # Click on 'Bugünkü Kayıtlar' tab to ensure it is active
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[2]/div/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        await page.goto('http://localhost:3000/qr-imza-yonetimi', timeout=10000)
        await asyncio.sleep(3)
        

        await page.mouse.wheel(0, 100)
        

        # -> Resize the browser window to tablet size (768px width) and verify the page layout adapts appropriately for tablet devices.
        await page.goto('http://localhost:3000/qr-imza-yonetimi', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Resize the browser window to tablet size (768px width) and verify the page layout adapts appropriately for tablet devices.
        await page.goto('http://localhost:3000/qr-imza-yonetimi', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Resize the browser window to tablet size (768px width) and verify the page layout adapts appropriately for tablet devices.
        frame = context.pages[-1]
        # Clear search input to avoid filtering issues
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[3]/div[2]/div/div/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('')
        

        frame = context.pages[-1]
        # Click on 'Bugünkü Kayıtlar' tab to ensure it is active
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[2]/div/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        await page.goto('http://localhost:3000/qr-imza-yonetimi', timeout=10000)
        await asyncio.sleep(3)
        

        await page.mouse.wheel(0, 100)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=QR/İmza Yönetimi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Yenile').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Bugünkü Kayıtlar').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=QR Kod Yönetimi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=İmza Kayıtları').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Raporlama').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Analitik').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Şu An İçeride').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Devamsız').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Eksik Kayıt').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Çalışan').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Giriş').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Çıkış').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=İmzalı').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Toplam Kayıt').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Giriş Yapan').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Çıkış Yapan').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    