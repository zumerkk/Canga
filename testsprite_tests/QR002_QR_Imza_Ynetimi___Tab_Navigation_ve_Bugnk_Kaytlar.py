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
        # -> Input password and click login button to access the main page with tabs.
        frame = context.pages[-1]
        # Input the password into the password field.
        elem = frame.locator('xpath=html/body/div/div/div[5]/div[2]/div/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('28150503')
        

        # -> Click the login button to complete login and access the main page.
        frame = context.pages[-1]
        # Click the login button to submit the password and login.
        elem = frame.locator('xpath=html/body/div/div/div[5]/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Verify the presence of all five tabs: 'Bugünkü Kayıtlar', 'QR Kod Yönetimi', 'İmza Kayıtları', 'Raporlama', 'Analitik'.
        frame = context.pages[-1]
        # Click on 'Bugünkü Kayıtlar' tab to ensure it is active and visible.
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[3]/div/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Type a search term in the search field to test filtering functionality on 'Bugünkü Kayıtlar' tab.
        frame = context.pages[-1]
        # Type 'test' in the search field to check filtering.
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[4]/div/div/div/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('test')
        

        # -> Click on the 'MERKEZ' location filter chip to test filtering by location on 'Bugünkü Kayıtlar' tab.
        frame = context.pages[-1]
        # Click on 'MERKEZ' location filter chip to filter records by location.
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[4]/div/div/div[2]/div/div[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on the next tab 'QR Kod Yönetimi' to verify it loads correctly.
        frame = context.pages[-1]
        # Click on 'QR Kod Yönetimi' tab to verify navigation and content loading.
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[3]/div/div[2]/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on 'İmza Kayıtları' tab to verify it loads correctly.
        frame = context.pages[-1]
        # Click on 'İmza Kayıtları' tab to verify navigation and content loading.
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[3]/div/div[2]/div/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on 'Raporlama' tab to verify it loads correctly.
        frame = context.pages[-1]
        # Click on 'Raporlama' tab to verify navigation and content loading.
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[3]/div/div[2]/div/button[4]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on 'Analitik' tab to verify it loads correctly.
        frame = context.pages[-1]
        # Click on 'Analitik' tab to verify navigation and content loading.
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[3]/div/div[2]/div/button[5]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Bugünkü Kayıtlar').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=QR Kod Yönetimi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=İmza Kayıtları').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Raporlama').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Analitik').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Çalışan ara (isim, TC, pozisyon)...').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=TÜM').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=MERKEZ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=İŞL').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=OSB').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=İŞIL').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Çalışan').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Giriş').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Çıkış').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Çalışma Süresi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Yöntem').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Durum').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=İşlemler').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    