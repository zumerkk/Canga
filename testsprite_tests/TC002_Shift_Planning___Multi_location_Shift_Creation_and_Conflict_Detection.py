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
        # Input the password for login
        elem = frame.locator('xpath=html/body/div/div/div[5]/div[2]/div/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('28150503')
        

        # -> Click the login button to enter the system
        frame = context.pages[-1]
        # Click the login button to enter the system
        elem = frame.locator('xpath=html/body/div/div/div[5]/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on 'Yeni Vardiya' (New Shift) to start creating shifts
        frame = context.pages[-1]
        # Click on 'Yeni Vardiya' button to create a new shift
        elem = frame.locator('xpath=html/body/div/div/div/nav/div/div/div/div[3]/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Set start and end dates for the first shift using keyboard input or date picker interaction
        frame = context.pages[-1]
        # Click start date input to open date picker
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[3]/div/div/div[2]/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        # Click end date input to open date picker
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[3]/div/div/div[3]/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Proceed to next step by clicking 'Devam Et' to continue to employee selection or create second overlapping shift if required
        frame = context.pages[-1]
        # Click 'Devam Et' button to proceed to next step in shift creation
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[3]/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Manuel Oluştur' button to proceed with manual employee selection for the shift
        frame = context.pages[-1]
        # Click 'Manuel Oluştur' button to manually select employees for the shift
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[3]/div/div[2]/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Assign an employee to the first shift (08:00-18:00) in 'MERKEZ FABRİKA' by clicking 'Çalışan Ekle' and selecting an employee
        frame = context.pages[-1]
        # Click on 'Çalışan Ekle' input box for first shift in MERKEZ FABRİKA to add employee
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[3]/div/div[2]/div[2]/div/div[2]/div/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select the first employee 'Abbas Can ÖNGER' from the list to assign to the shift
        frame = context.pages[-1]
        # Select employee 'Abbas Can ÖNGER' from the employee list
        elem = frame.locator('xpath=html/body/div[5]/div/ul/li').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Assign an employee to the second overlapping shift (08:00-16:00) in 'MERKEZ FABRİKA' by clicking 'Çalışan Ekle' and selecting an employee
        frame = context.pages[-1]
        # Click on 'Çalışan Ekle' input box for second shift in MERKEZ FABRİKA to add employee
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[3]/div/div[2]/div[3]/div/div[2]/div/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select an employee from the dropdown list to assign to the second shift
        frame = context.pages[-1]
        # Select employee 'Abbas Can ÖNGER' from the dropdown list for second shift
        elem = frame.locator('xpath=html/body/div[5]/div/ul/li').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the 'İleri' (Next) button to proceed to the final step for saving and submitting the shift schedule for approval
        frame = context.pages[-1]
        # Click 'İleri' button to proceed to the final step for saving and submitting the shift schedule
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[3]/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Kaydet' button to save the shift schedule and trigger conflict detection and approval workflow
        frame = context.pages[-1]
        # Click 'Kaydet' button to save the shift schedule and trigger conflict detection and approval workflow
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[3]/div/div[2]/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Close the confirmation modal and start creating shifts with non-overlapping times to verify no conflict warnings and proper visibility.
        frame = context.pages[-1]
        # Click 'Kapat' button to close the confirmation modal
        elem = frame.locator('xpath=html/body/div[3]/div[3]/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Vardiya başarıyla hazırlandı! Artık kaydedip Excel çıktısı alabilirsiniz.').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    