
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** Canga
- **Date:** 2025-11-14
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001
- **Test Name:** Authentication Success with Valid Credentials
- **Test Code:** [TC001_Authentication_Success_with_Valid_Credentials.py](./TC001_Authentication_Success_with_Valid_Credentials.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d53b7c5a-1bdb-4c3d-a9fe-1784c2f272b3/6f919dd3-13a6-4ffd-b24b-197c61f62c42
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002
- **Test Name:** Authentication Failure with Invalid Credentials
- **Test Code:** [TC002_Authentication_Failure_with_Invalid_Credentials.py](./TC002_Authentication_Failure_with_Invalid_Credentials.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d53b7c5a-1bdb-4c3d-a9fe-1784c2f272b3/1ade8d53-32bc-4361-8962-ced49780cef6
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003
- **Test Name:** Employee CRUD Operations
- **Test Code:** [TC003_Employee_CRUD_Operations.py](./TC003_Employee_CRUD_Operations.py)
- **Test Error:** The employee creation test with valid mandatory fields and photo upload was attempted using the bulk quick add form. However, the save action was blocked by validation errors caused by multiple incomplete rows in the form. Attempts to correct and remove extra rows were made but the employee was not successfully created. Consequently, the subsequent steps for retrieval, update, invalid data update, bulk editing, deletion, and retrieval of deleted employee could not be performed. The task is not fully completed due to this failure in the initial creation step.
Browser Console Logs:
[ERROR] Warning: validateDOMNesting(...): %s cannot appear as a descendant of <%s>.%s <div> p 
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItemText (http://localhost:3000/static/js/bundle.js:15721:87)
    at li
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItem (http://localhost:3000/static/js/bundle.js:14604:88)
    at Transition (http://localhost:3000/static/js/bundle.js:75845:30)
    at Fade (http://localhost:3000/static/js/bundle.js:9535:77)
    at ul
    at http://localhost:3000/static/js/bundle.js:909:66
    at List (http://localhost:3000/static/js/bundle.js:14297:87)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Paper (http://localhost:3000/static/js/bundle.js:18676:88)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Container (http://localhost:3000/static/js/bundle.js:27602:19)
    at Dashboard (http://localhost:3000/static/js/bundle.js:89435:82)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Suspense
    at main
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at Layout (http://localhost:3000/static/js/bundle.js:87066:3)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at ProtectedRoutes (http://localhost:3000/static/js/bundle.js:86299:70)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Router (http://localhost:3000/static/js/bundle.js:75392:15)
    at BrowserRouter (http://localhost:3000/static/js/bundle.js:73293:5)
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3)
    at DefaultPropsProvider (http://localhost:3000/static/js/bundle.js:27674:3)
    at RtlProvider (http://localhost:3000/static/js/bundle.js:27844:7)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:26489:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:27933:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:24917:14)
    at App
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3) (at http://localhost:3000/static/js/bundle.js:45378:33)
[ERROR] Warning: validateDOMNesting(...): %s cannot appear as a descendant of <%s>.%s <p> p 
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItemText (http://localhost:3000/static/js/bundle.js:15721:87)
    at li
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItem (http://localhost:3000/static/js/bundle.js:14604:88)
    at Transition (http://localhost:3000/static/js/bundle.js:75845:30)
    at Fade (http://localhost:3000/static/js/bundle.js:9535:77)
    at ul
    at http://localhost:3000/static/js/bundle.js:909:66
    at List (http://localhost:3000/static/js/bundle.js:14297:87)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Paper (http://localhost:3000/static/js/bundle.js:18676:88)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Container (http://localhost:3000/static/js/bundle.js:27602:19)
    at Dashboard (http://localhost:3000/static/js/bundle.js:89435:82)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Suspense
    at main
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at Layout (http://localhost:3000/static/js/bundle.js:87066:3)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at ProtectedRoutes (http://localhost:3000/static/js/bundle.js:86299:70)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Router (http://localhost:3000/static/js/bundle.js:75392:15)
    at BrowserRouter (http://localhost:3000/static/js/bundle.js:73293:5)
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3)
    at DefaultPropsProvider (http://localhost:3000/static/js/bundle.js:27674:3)
    at RtlProvider (http://localhost:3000/static/js/bundle.js:27844:7)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:26489:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:27933:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:24917:14)
    at App
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3) (at http://localhost:3000/static/js/bundle.js:45378:33)
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) (at http://localhost:3000/$%7BAPI_BASE_URL%7D/api/services/routes/names:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d53b7c5a-1bdb-4c3d-a9fe-1784c2f272b3/b4abe80f-337d-4a5d-aa63-38d7e4711099
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004
- **Test Name:** Shift Management with Multi-time Slots and Drag-and-Drop
- **Test Code:** [TC004_Shift_Management_with_Multi_time_Slots_and_Drag_and_Drop.py](./TC004_Shift_Management_with_Multi_time_Slots_and_Drag_and_Drop.py)
- **Test Error:** Testing stopped due to unexpected navigation issue preventing shift creation. Reported the issue for resolution.
Browser Console Logs:
[ERROR] Warning: validateDOMNesting(...): %s cannot appear as a descendant of <%s>.%s <div> p 
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItemText (http://localhost:3000/static/js/bundle.js:15721:87)
    at li
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItem (http://localhost:3000/static/js/bundle.js:14604:88)
    at Transition (http://localhost:3000/static/js/bundle.js:75845:30)
    at Fade (http://localhost:3000/static/js/bundle.js:9535:77)
    at ul
    at http://localhost:3000/static/js/bundle.js:909:66
    at List (http://localhost:3000/static/js/bundle.js:14297:87)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Paper (http://localhost:3000/static/js/bundle.js:18676:88)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Container (http://localhost:3000/static/js/bundle.js:27602:19)
    at Dashboard (http://localhost:3000/static/js/bundle.js:89435:82)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Suspense
    at main
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at Layout (http://localhost:3000/static/js/bundle.js:87066:3)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at ProtectedRoutes (http://localhost:3000/static/js/bundle.js:86299:70)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Router (http://localhost:3000/static/js/bundle.js:75392:15)
    at BrowserRouter (http://localhost:3000/static/js/bundle.js:73293:5)
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3)
    at DefaultPropsProvider (http://localhost:3000/static/js/bundle.js:27674:3)
    at RtlProvider (http://localhost:3000/static/js/bundle.js:27844:7)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:26489:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:27933:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:24917:14)
    at App
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3) (at http://localhost:3000/static/js/bundle.js:45378:33)
[ERROR] Warning: validateDOMNesting(...): %s cannot appear as a descendant of <%s>.%s <p> p 
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItemText (http://localhost:3000/static/js/bundle.js:15721:87)
    at li
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItem (http://localhost:3000/static/js/bundle.js:14604:88)
    at Transition (http://localhost:3000/static/js/bundle.js:75845:30)
    at Fade (http://localhost:3000/static/js/bundle.js:9535:77)
    at ul
    at http://localhost:3000/static/js/bundle.js:909:66
    at List (http://localhost:3000/static/js/bundle.js:14297:87)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Paper (http://localhost:3000/static/js/bundle.js:18676:88)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Container (http://localhost:3000/static/js/bundle.js:27602:19)
    at Dashboard (http://localhost:3000/static/js/bundle.js:89435:82)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Suspense
    at main
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at Layout (http://localhost:3000/static/js/bundle.js:87066:3)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at ProtectedRoutes (http://localhost:3000/static/js/bundle.js:86299:70)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Router (http://localhost:3000/static/js/bundle.js:75392:15)
    at BrowserRouter (http://localhost:3000/static/js/bundle.js:73293:5)
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3)
    at DefaultPropsProvider (http://localhost:3000/static/js/bundle.js:27674:3)
    at RtlProvider (http://localhost:3000/static/js/bundle.js:27844:7)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:26489:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:27933:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:24917:14)
    at App
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3) (at http://localhost:3000/static/js/bundle.js:45378:33)
[WARNING] The specified value "11/14/2025" does not conform to the required format, "yyyy-MM-dd". (at :6328:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d53b7c5a-1bdb-4c3d-a9fe-1784c2f272b3/89ec3f55-aa6a-493b-b695-387ca44e6aae
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005
- **Test Name:** Annual Leave Request and Balance Tracking
- **Test Code:** [TC005_Annual_Leave_Request_and_Balance_Tracking.py](./TC005_Annual_Leave_Request_and_Balance_Tracking.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d53b7c5a-1bdb-4c3d-a9fe-1784c2f272b3/71bce3c4-bd7c-47e0-a156-6fb1a558148e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006
- **Test Name:** Attendance System Multi-method Check-in with AI Anomaly Detection
- **Test Code:** [TC006_Attendance_System_Multi_method_Check_in_with_AI_Anomaly_Detection.py](./TC006_Attendance_System_Multi_method_Check_in_with_AI_Anomaly_Detection.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d53b7c5a-1bdb-4c3d-a9fe-1784c2f272b3/8169457b-829f-40d4-9bcc-78f4ff0e841d
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007
- **Test Name:** QR Code Token Expiry and Usage Tracking
- **Test Code:** [TC007_QR_Code_Token_Expiry_and_Usage_Tracking.py](./TC007_QR_Code_Token_Expiry_and_Usage_Tracking.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d53b7c5a-1bdb-4c3d-a9fe-1784c2f272b3/07e9f28b-69f0-450b-929f-0d8816c6c4a3
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008
- **Test Name:** Service Route Management with Real-time Map Visualizations
- **Test Code:** [TC008_Service_Route_Management_with_Real_time_Map_Visualizations.py](./TC008_Service_Route_Management_with_Real_time_Map_Visualizations.py)
- **Test Error:** The test for creation, assignment, and optimization of service routes linked with vehicles and drivers was partially successful. Login, navigation to service routes, viewing passenger lists, and adding stops to existing routes worked as expected. However, the new service route creation interface did not open, saving updates to routes failed without confirmation, and the interactive map visualization and real-time tracking could not be verified as the map section was not visible or accessible. Therefore, the task is not fully completed due to these blockers.
Browser Console Logs:
[ERROR] Warning: validateDOMNesting(...): %s cannot appear as a descendant of <%s>.%s <div> p 
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItemText (http://localhost:3000/static/js/bundle.js:15721:87)
    at li
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItem (http://localhost:3000/static/js/bundle.js:14604:88)
    at Transition (http://localhost:3000/static/js/bundle.js:75845:30)
    at Fade (http://localhost:3000/static/js/bundle.js:9535:77)
    at ul
    at http://localhost:3000/static/js/bundle.js:909:66
    at List (http://localhost:3000/static/js/bundle.js:14297:87)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Paper (http://localhost:3000/static/js/bundle.js:18676:88)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Container (http://localhost:3000/static/js/bundle.js:27602:19)
    at Dashboard (http://localhost:3000/static/js/bundle.js:89435:82)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Suspense
    at main
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at Layout (http://localhost:3000/static/js/bundle.js:87066:3)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at ProtectedRoutes (http://localhost:3000/static/js/bundle.js:86299:70)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Router (http://localhost:3000/static/js/bundle.js:75392:15)
    at BrowserRouter (http://localhost:3000/static/js/bundle.js:73293:5)
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3)
    at DefaultPropsProvider (http://localhost:3000/static/js/bundle.js:27674:3)
    at RtlProvider (http://localhost:3000/static/js/bundle.js:27844:7)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:26489:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:27933:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:24917:14)
    at App
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3) (at http://localhost:3000/static/js/bundle.js:45378:33)
[ERROR] Warning: validateDOMNesting(...): %s cannot appear as a descendant of <%s>.%s <p> p 
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItemText (http://localhost:3000/static/js/bundle.js:15721:87)
    at li
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItem (http://localhost:3000/static/js/bundle.js:14604:88)
    at Transition (http://localhost:3000/static/js/bundle.js:75845:30)
    at Fade (http://localhost:3000/static/js/bundle.js:9535:77)
    at ul
    at http://localhost:3000/static/js/bundle.js:909:66
    at List (http://localhost:3000/static/js/bundle.js:14297:87)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Paper (http://localhost:3000/static/js/bundle.js:18676:88)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Container (http://localhost:3000/static/js/bundle.js:27602:19)
    at Dashboard (http://localhost:3000/static/js/bundle.js:89435:82)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Suspense
    at main
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at Layout (http://localhost:3000/static/js/bundle.js:87066:3)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at ProtectedRoutes (http://localhost:3000/static/js/bundle.js:86299:70)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Router (http://localhost:3000/static/js/bundle.js:75392:15)
    at BrowserRouter (http://localhost:3000/static/js/bundle.js:73293:5)
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3)
    at DefaultPropsProvider (http://localhost:3000/static/js/bundle.js:27674:3)
    at RtlProvider (http://localhost:3000/static/js/bundle.js:27844:7)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:26489:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:27933:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:24917:14)
    at App
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3) (at http://localhost:3000/static/js/bundle.js:45378:33)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d53b7c5a-1bdb-4c3d-a9fe-1784c2f272b3/8acf32a8-2846-4554-800c-351431a01d1a
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009
- **Test Name:** Calendar System with Drag-and-Drop Scheduling and Smart Filters
- **Test Code:** [TC009_Calendar_System_with_Drag_and_Drop_Scheduling_and_Smart_Filters.py](./TC009_Calendar_System_with_Drag_and_Drop_Scheduling_and_Smart_Filters.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d53b7c5a-1bdb-4c3d-a9fe-1784c2f272b3/3aa9f632-48b6-47a0-aca9-f4f762f9cc30
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010
- **Test Name:** Job Application Public Form Submission and Status Tracking
- **Test Code:** [TC010_Job_Application_Public_Form_Submission_and_Status_Tracking.py](./TC010_Job_Application_Public_Form_Submission_and_Status_Tracking.py)
- **Test Error:** The public job application form has been successfully filled with valid data in all mandatory sections including personal information, family details, and education. The graduation status dropdown was correctly selected. The remaining steps to fully complete the task include filling the work experience section, submitting the application, verifying the application storage and confirmation message, simulating HR review and status update to 'Interview', and confirming notification delivery to the applicant. These steps require further interaction beyond the current form filling. Therefore, the task is not yet fully finished.
Browser Console Logs:
[ERROR] Warning: validateDOMNesting(...): %s cannot appear as a descendant of <%s>.%s <div> p 
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItemText (http://localhost:3000/static/js/bundle.js:15721:87)
    at li
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItem (http://localhost:3000/static/js/bundle.js:14604:88)
    at Transition (http://localhost:3000/static/js/bundle.js:75845:30)
    at Fade (http://localhost:3000/static/js/bundle.js:9535:77)
    at ul
    at http://localhost:3000/static/js/bundle.js:909:66
    at List (http://localhost:3000/static/js/bundle.js:14297:87)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Paper (http://localhost:3000/static/js/bundle.js:18676:88)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Container (http://localhost:3000/static/js/bundle.js:27602:19)
    at Dashboard (http://localhost:3000/static/js/bundle.js:89435:82)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Suspense
    at main
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at Layout (http://localhost:3000/static/js/bundle.js:87066:3)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at ProtectedRoutes (http://localhost:3000/static/js/bundle.js:86299:70)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Router (http://localhost:3000/static/js/bundle.js:75392:15)
    at BrowserRouter (http://localhost:3000/static/js/bundle.js:73293:5)
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3)
    at DefaultPropsProvider (http://localhost:3000/static/js/bundle.js:27674:3)
    at RtlProvider (http://localhost:3000/static/js/bundle.js:27844:7)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:26489:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:27933:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:24917:14)
    at App
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3) (at http://localhost:3000/static/js/bundle.js:45378:33)
[ERROR] Warning: validateDOMNesting(...): %s cannot appear as a descendant of <%s>.%s <p> p 
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItemText (http://localhost:3000/static/js/bundle.js:15721:87)
    at li
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItem (http://localhost:3000/static/js/bundle.js:14604:88)
    at Transition (http://localhost:3000/static/js/bundle.js:75845:30)
    at Fade (http://localhost:3000/static/js/bundle.js:9535:77)
    at ul
    at http://localhost:3000/static/js/bundle.js:909:66
    at List (http://localhost:3000/static/js/bundle.js:14297:87)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Paper (http://localhost:3000/static/js/bundle.js:18676:88)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Container (http://localhost:3000/static/js/bundle.js:27602:19)
    at Dashboard (http://localhost:3000/static/js/bundle.js:89435:82)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Suspense
    at main
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at Layout (http://localhost:3000/static/js/bundle.js:87066:3)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at ProtectedRoutes (http://localhost:3000/static/js/bundle.js:86299:70)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Router (http://localhost:3000/static/js/bundle.js:75392:15)
    at BrowserRouter (http://localhost:3000/static/js/bundle.js:73293:5)
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3)
    at DefaultPropsProvider (http://localhost:3000/static/js/bundle.js:27674:3)
    at RtlProvider (http://localhost:3000/static/js/bundle.js:27844:7)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:26489:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:27933:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:24917:14)
    at App
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3) (at http://localhost:3000/static/js/bundle.js:45378:33)
[WARNING] MUI: You have provided an out-of-range value `Üniversite` for the select component.
Consider providing a value that matches one of the available options or ''.
The available values are `İlkokul`, `Ortaokul`, `Lise`, `Ön Lisans`, `Lisans`, `Yüksek Lisans`, `Doktora`. (at http://localhost:3000/static/js/bundle.js:20921:16)
[WARNING] MUI: You have provided an out-of-range value `Üniversite` for the select component.
Consider providing a value that matches one of the available options or ''.
The available values are `İlkokul`, `Ortaokul`, `Lise`, `Ön Lisans`, `Lisans`, `Yüksek Lisans`, `Doktora`. (at http://localhost:3000/static/js/bundle.js:20921:16)
[WARNING] MUI: You have provided an out-of-range value `Üniversite` for the select component.
Consider providing a value that matches one of the available options or ''.
The available values are `İlkokul`, `Ortaokul`, `Lise`, `Ön Lisans`, `Lisans`, `Yüksek Lisans`, `Doktora`. (at http://localhost:3000/static/js/bundle.js:20921:16)
[WARNING] MUI: You have provided an out-of-range value `Üniversite` for the select component.
Consider providing a value that matches one of the available options or ''.
The available values are `İlkokul`, `Ortaokul`, `Lise`, `Ön Lisans`, `Lisans`, `Yüksek Lisans`, `Doktora`. (at http://localhost:3000/static/js/bundle.js:20921:16)
[WARNING] MUI: You have provided an out-of-range value `Üniversite` for the select component.
Consider providing a value that matches one of the available options or ''.
The available values are `İlkokul`, `Ortaokul`, `Lise`, `Ön Lisans`, `Lisans`, `Yüksek Lisans`, `Doktora`. (at http://localhost:3000/static/js/bundle.js:20921:16)
[WARNING] MUI: You have provided an out-of-range value `Üniversite` for the select component.
Consider providing a value that matches one of the available options or ''.
The available values are `İlkokul`, `Ortaokul`, `Lise`, `Ön Lisans`, `Lisans`, `Yüksek Lisans`, `Doktora`. (at http://localhost:3000/static/js/bundle.js:20921:16)
[WARNING] MUI: You have provided an out-of-range value `Üniversite` for the select component.
Consider providing a value that matches one of the available options or ''.
The available values are `İlkokul`, `Ortaokul`, `Lise`, `Ön Lisans`, `Lisans`, `Yüksek Lisans`, `Doktora`. (at http://localhost:3000/static/js/bundle.js:20921:16)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d53b7c5a-1bdb-4c3d-a9fe-1784c2f272b3/5fc347ab-ba83-4668-8e0e-3ae6b0c2d32c
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011
- **Test Name:** Excel Import and Export Validation with Field Mapping
- **Test Code:** [TC011_Excel_Import_and_Export_Validation_with_Field_Mapping.py](./TC011_Excel_Import_and_Export_Validation_with_Field_Mapping.py)
- **Test Error:** The bulk employee import modal was successfully opened, showing instructions, a template download button, and a file upload area. The system is ready to accept Excel files for employee import. However, the actual upload of Excel files for both valid and invalid data, validation of import success or errors, and export of reports to Excel and PDF formats were not performed. Therefore, the task is not fully completed as per the user's instructions. Further steps would involve uploading files, verifying import results, and testing export functionality.
Browser Console Logs:
[ERROR] Warning: validateDOMNesting(...): %s cannot appear as a descendant of <%s>.%s <div> p 
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItemText (http://localhost:3000/static/js/bundle.js:15721:87)
    at li
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItem (http://localhost:3000/static/js/bundle.js:14604:88)
    at Transition (http://localhost:3000/static/js/bundle.js:75845:30)
    at Fade (http://localhost:3000/static/js/bundle.js:9535:77)
    at ul
    at http://localhost:3000/static/js/bundle.js:909:66
    at List (http://localhost:3000/static/js/bundle.js:14297:87)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Paper (http://localhost:3000/static/js/bundle.js:18676:88)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Container (http://localhost:3000/static/js/bundle.js:27602:19)
    at Dashboard (http://localhost:3000/static/js/bundle.js:89435:82)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Suspense
    at main
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at Layout (http://localhost:3000/static/js/bundle.js:87066:3)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at ProtectedRoutes (http://localhost:3000/static/js/bundle.js:86299:70)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Router (http://localhost:3000/static/js/bundle.js:75392:15)
    at BrowserRouter (http://localhost:3000/static/js/bundle.js:73293:5)
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3)
    at DefaultPropsProvider (http://localhost:3000/static/js/bundle.js:27674:3)
    at RtlProvider (http://localhost:3000/static/js/bundle.js:27844:7)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:26489:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:27933:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:24917:14)
    at App
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3) (at http://localhost:3000/static/js/bundle.js:45378:33)
[ERROR] Warning: validateDOMNesting(...): %s cannot appear as a descendant of <%s>.%s <p> p 
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItemText (http://localhost:3000/static/js/bundle.js:15721:87)
    at li
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItem (http://localhost:3000/static/js/bundle.js:14604:88)
    at Transition (http://localhost:3000/static/js/bundle.js:75845:30)
    at Fade (http://localhost:3000/static/js/bundle.js:9535:77)
    at ul
    at http://localhost:3000/static/js/bundle.js:909:66
    at List (http://localhost:3000/static/js/bundle.js:14297:87)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Paper (http://localhost:3000/static/js/bundle.js:18676:88)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Container (http://localhost:3000/static/js/bundle.js:27602:19)
    at Dashboard (http://localhost:3000/static/js/bundle.js:89435:82)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Suspense
    at main
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at Layout (http://localhost:3000/static/js/bundle.js:87066:3)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at ProtectedRoutes (http://localhost:3000/static/js/bundle.js:86299:70)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Router (http://localhost:3000/static/js/bundle.js:75392:15)
    at BrowserRouter (http://localhost:3000/static/js/bundle.js:73293:5)
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3)
    at DefaultPropsProvider (http://localhost:3000/static/js/bundle.js:27674:3)
    at RtlProvider (http://localhost:3000/static/js/bundle.js:27844:7)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:26489:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:27933:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:24917:14)
    at App
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3) (at http://localhost:3000/static/js/bundle.js:45378:33)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d53b7c5a-1bdb-4c3d-a9fe-1784c2f272b3/e8e180e2-cf00-41ce-af82-4abf04defb2e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012
- **Test Name:** Real-time Notifications Delivery and Read Status Persistence
- **Test Code:** [TC012_Real_time_Notifications_Delivery_and_Read_Status_Persistence.py](./TC012_Real_time_Notifications_Delivery_and_Read_Status_Persistence.py)
- **Test Error:** Testing stopped due to critical issue: unread notification count does not update after marking notifications as read. This blocks further validation of notification persistence and UI updates. Please fix this issue.
Browser Console Logs:
[ERROR] Warning: validateDOMNesting(...): %s cannot appear as a descendant of <%s>.%s <div> p 
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItemText (http://localhost:3000/static/js/bundle.js:15721:87)
    at li
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItem (http://localhost:3000/static/js/bundle.js:14604:88)
    at Transition (http://localhost:3000/static/js/bundle.js:75845:30)
    at Fade (http://localhost:3000/static/js/bundle.js:9535:77)
    at ul
    at http://localhost:3000/static/js/bundle.js:909:66
    at List (http://localhost:3000/static/js/bundle.js:14297:87)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Paper (http://localhost:3000/static/js/bundle.js:18676:88)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Container (http://localhost:3000/static/js/bundle.js:27602:19)
    at Dashboard (http://localhost:3000/static/js/bundle.js:89435:82)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Suspense
    at main
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at Layout (http://localhost:3000/static/js/bundle.js:87066:3)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at ProtectedRoutes (http://localhost:3000/static/js/bundle.js:86299:70)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Router (http://localhost:3000/static/js/bundle.js:75392:15)
    at BrowserRouter (http://localhost:3000/static/js/bundle.js:73293:5)
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3)
    at DefaultPropsProvider (http://localhost:3000/static/js/bundle.js:27674:3)
    at RtlProvider (http://localhost:3000/static/js/bundle.js:27844:7)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:26489:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:27933:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:24917:14)
    at App
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3) (at http://localhost:3000/static/js/bundle.js:45378:33)
[ERROR] Warning: validateDOMNesting(...): %s cannot appear as a descendant of <%s>.%s <p> p 
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItemText (http://localhost:3000/static/js/bundle.js:15721:87)
    at li
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItem (http://localhost:3000/static/js/bundle.js:14604:88)
    at Transition (http://localhost:3000/static/js/bundle.js:75845:30)
    at Fade (http://localhost:3000/static/js/bundle.js:9535:77)
    at ul
    at http://localhost:3000/static/js/bundle.js:909:66
    at List (http://localhost:3000/static/js/bundle.js:14297:87)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Paper (http://localhost:3000/static/js/bundle.js:18676:88)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Container (http://localhost:3000/static/js/bundle.js:27602:19)
    at Dashboard (http://localhost:3000/static/js/bundle.js:89435:82)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Suspense
    at main
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at Layout (http://localhost:3000/static/js/bundle.js:87066:3)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at ProtectedRoutes (http://localhost:3000/static/js/bundle.js:86299:70)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Router (http://localhost:3000/static/js/bundle.js:75392:15)
    at BrowserRouter (http://localhost:3000/static/js/bundle.js:73293:5)
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3)
    at DefaultPropsProvider (http://localhost:3000/static/js/bundle.js:27674:3)
    at RtlProvider (http://localhost:3000/static/js/bundle.js:27844:7)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:26489:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:27933:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:24917:14)
    at App
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3) (at http://localhost:3000/static/js/bundle.js:45378:33)
[WARNING] MUI: The `anchorEl` prop provided to the component is invalid.
The anchor element should be part of the document layout.
Make sure the element is present in the document or that it's not display none. (at http://localhost:3000/static/js/bundle.js:18990:16)
[ERROR] Warning: Failed %s type: %s%s prop MUI: The `anchorEl` prop provided to the component is invalid.
The anchor element should be part of the document layout.
Make sure the element is present in the document or that it's not display none. 
    at Popover (http://localhost:3000/static/js/bundle.js:18921:88)
    at http://localhost:3000/static/js/bundle.js:909:66
    at Menu (http://localhost:3000/static/js/bundle.js:15957:88)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at Notifications (http://localhost:3000/static/js/src_pages_Notifications_js.chunk.js:252:92)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Suspense
    at main
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at Layout (http://localhost:3000/static/js/bundle.js:87066:3)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at ProtectedRoutes (http://localhost:3000/static/js/bundle.js:86299:70)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Router (http://localhost:3000/static/js/bundle.js:75392:15)
    at BrowserRouter (http://localhost:3000/static/js/bundle.js:73293:5)
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3)
    at DefaultPropsProvider (http://localhost:3000/static/js/bundle.js:27674:3)
    at RtlProvider (http://localhost:3000/static/js/bundle.js:27844:7)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:26489:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:27933:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:24917:14)
    at App
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3) (at http://localhost:3000/static/js/bundle.js:79202:33)
[WARNING] MUI: The `anchorEl` prop provided to the component is invalid.
The anchor element should be part of the document layout.
Make sure the element is present in the document or that it's not display none. (at http://localhost:3000/static/js/bundle.js:18990:16)
[WARNING] MUI: The `anchorEl` prop provided to the component is invalid.
The anchor element should be part of the document layout.
Make sure the element is present in the document or that it's not display none. (at http://localhost:3000/static/js/bundle.js:18990:16)
[WARNING] MUI: The `anchorEl` prop provided to the component is invalid.
The anchor element should be part of the document layout.
Make sure the element is present in the document or that it's not display none. (at http://localhost:3000/static/js/bundle.js:18990:16)
[WARNING] MUI: The `anchorEl` prop provided to the component is invalid.
The anchor element should be part of the document layout.
Make sure the element is present in the document or that it's not display none. (at http://localhost:3000/static/js/bundle.js:18990:16)
[WARNING] MUI: The `anchorEl` prop provided to the component is invalid.
The anchor element should be part of the document layout.
Make sure the element is present in the document or that it's not display none. (at http://localhost:3000/static/js/bundle.js:18990:16)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d53b7c5a-1bdb-4c3d-a9fe-1784c2f272b3/97833391-f1bf-4b71-b85d-a12bf3b9c3b3
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013
- **Test Name:** AI Anomaly Detection Flags Duplicate Attendance Entries
- **Test Code:** [TC013_AI_Anomaly_Detection_Flags_Duplicate_Attendance_Entries.py](./TC013_AI_Anomaly_Detection_Flags_Duplicate_Attendance_Entries.py)
- **Test Error:** The task to test the AI module's ability to detect duplicate or inconsistent attendance records and generate actionable anomaly reports and recommendations was partially completed. Duplicate attendance entries were successfully created by adding a new shift and assigning an employee. However, attempts to run the AI anomaly detection process on the attendance data failed as no anomaly detection results or recommendations were accessible or visible. This is a critical blocker preventing full verification of the AI module's functionality. Further investigation or fixes are needed to enable triggering and viewing AI anomaly detection reports. Task success is false due to incomplete verification.
Browser Console Logs:
[ERROR] Warning: validateDOMNesting(...): %s cannot appear as a descendant of <%s>.%s <div> p 
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItemText (http://localhost:3000/static/js/bundle.js:15721:87)
    at li
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItem (http://localhost:3000/static/js/bundle.js:14604:88)
    at Transition (http://localhost:3000/static/js/bundle.js:75845:30)
    at Fade (http://localhost:3000/static/js/bundle.js:9535:77)
    at ul
    at http://localhost:3000/static/js/bundle.js:909:66
    at List (http://localhost:3000/static/js/bundle.js:14297:87)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Paper (http://localhost:3000/static/js/bundle.js:18676:88)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Container (http://localhost:3000/static/js/bundle.js:27602:19)
    at Dashboard (http://localhost:3000/static/js/bundle.js:89435:82)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Suspense
    at main
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at Layout (http://localhost:3000/static/js/bundle.js:87066:3)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at ProtectedRoutes (http://localhost:3000/static/js/bundle.js:86299:70)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Router (http://localhost:3000/static/js/bundle.js:75392:15)
    at BrowserRouter (http://localhost:3000/static/js/bundle.js:73293:5)
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3)
    at DefaultPropsProvider (http://localhost:3000/static/js/bundle.js:27674:3)
    at RtlProvider (http://localhost:3000/static/js/bundle.js:27844:7)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:26489:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:27933:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:24917:14)
    at App
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3) (at http://localhost:3000/static/js/bundle.js:45378:33)
[ERROR] Warning: validateDOMNesting(...): %s cannot appear as a descendant of <%s>.%s <p> p 
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItemText (http://localhost:3000/static/js/bundle.js:15721:87)
    at li
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItem (http://localhost:3000/static/js/bundle.js:14604:88)
    at Transition (http://localhost:3000/static/js/bundle.js:75845:30)
    at Fade (http://localhost:3000/static/js/bundle.js:9535:77)
    at ul
    at http://localhost:3000/static/js/bundle.js:909:66
    at List (http://localhost:3000/static/js/bundle.js:14297:87)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Paper (http://localhost:3000/static/js/bundle.js:18676:88)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Container (http://localhost:3000/static/js/bundle.js:27602:19)
    at Dashboard (http://localhost:3000/static/js/bundle.js:89435:82)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Suspense
    at main
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at Layout (http://localhost:3000/static/js/bundle.js:87066:3)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at ProtectedRoutes (http://localhost:3000/static/js/bundle.js:86299:70)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Router (http://localhost:3000/static/js/bundle.js:75392:15)
    at BrowserRouter (http://localhost:3000/static/js/bundle.js:73293:5)
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3)
    at DefaultPropsProvider (http://localhost:3000/static/js/bundle.js:27674:3)
    at RtlProvider (http://localhost:3000/static/js/bundle.js:27844:7)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:26489:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:27933:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:24917:14)
    at App
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3) (at http://localhost:3000/static/js/bundle.js:45378:33)
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) (at http://localhost:5001/api/employees/68d53b7961570e7b3be1ccad:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d53b7c5a-1bdb-4c3d-a9fe-1784c2f272b3/456f328c-d9a6-4b70-b627-13d297243403
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014
- **Test Name:** Redis Caching Effectiveness in API Response Times
- **Test Code:** [TC014_Redis_Caching_Effectiveness_in_API_Response_Times.py](./TC014_Redis_Caching_Effectiveness_in_API_Response_Times.py)
- **Test Error:** The task to verify Redis caching reducing API response times for frequently accessed endpoints without serving stale or invalid data is partially completed. We successfully logged in, navigated to a frequently accessed employees page, and prepared to test cache invalidation by adding a new employee. However, the final form submission, response time measurements for cached vs uncached calls, cache invalidation verification, and Redis failure simulation were not completed due to UI interaction limits. Further steps require submitting the form, measuring API response times before and after caching, updating data to verify cache invalidation, and simulating Redis downtime to ensure fallback mechanisms. Task success is false as these critical verification steps remain unexecuted.
Browser Console Logs:
[ERROR] Warning: validateDOMNesting(...): %s cannot appear as a descendant of <%s>.%s <div> p 
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItemText (http://localhost:3000/static/js/bundle.js:15721:87)
    at li
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItem (http://localhost:3000/static/js/bundle.js:14604:88)
    at Transition (http://localhost:3000/static/js/bundle.js:75845:30)
    at Fade (http://localhost:3000/static/js/bundle.js:9535:77)
    at ul
    at http://localhost:3000/static/js/bundle.js:909:66
    at List (http://localhost:3000/static/js/bundle.js:14297:87)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Paper (http://localhost:3000/static/js/bundle.js:18676:88)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Container (http://localhost:3000/static/js/bundle.js:27602:19)
    at Dashboard (http://localhost:3000/static/js/bundle.js:89435:82)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Suspense
    at main
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at Layout (http://localhost:3000/static/js/bundle.js:87066:3)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at ProtectedRoutes (http://localhost:3000/static/js/bundle.js:86299:70)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Router (http://localhost:3000/static/js/bundle.js:75392:15)
    at BrowserRouter (http://localhost:3000/static/js/bundle.js:73293:5)
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3)
    at DefaultPropsProvider (http://localhost:3000/static/js/bundle.js:27674:3)
    at RtlProvider (http://localhost:3000/static/js/bundle.js:27844:7)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:26489:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:27933:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:24917:14)
    at App
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3) (at http://localhost:3000/static/js/bundle.js:45378:33)
[ERROR] Warning: validateDOMNesting(...): %s cannot appear as a descendant of <%s>.%s <p> p 
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItemText (http://localhost:3000/static/js/bundle.js:15721:87)
    at li
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItem (http://localhost:3000/static/js/bundle.js:14604:88)
    at Transition (http://localhost:3000/static/js/bundle.js:75845:30)
    at Fade (http://localhost:3000/static/js/bundle.js:9535:77)
    at ul
    at http://localhost:3000/static/js/bundle.js:909:66
    at List (http://localhost:3000/static/js/bundle.js:14297:87)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Paper (http://localhost:3000/static/js/bundle.js:18676:88)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Container (http://localhost:3000/static/js/bundle.js:27602:19)
    at Dashboard (http://localhost:3000/static/js/bundle.js:89435:82)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Suspense
    at main
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at Layout (http://localhost:3000/static/js/bundle.js:87066:3)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at ProtectedRoutes (http://localhost:3000/static/js/bundle.js:86299:70)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Router (http://localhost:3000/static/js/bundle.js:75392:15)
    at BrowserRouter (http://localhost:3000/static/js/bundle.js:73293:5)
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3)
    at DefaultPropsProvider (http://localhost:3000/static/js/bundle.js:27674:3)
    at RtlProvider (http://localhost:3000/static/js/bundle.js:27844:7)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:26489:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:27933:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:24917:14)
    at App
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3) (at http://localhost:3000/static/js/bundle.js:45378:33)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d53b7c5a-1bdb-4c3d-a9fe-1784c2f272b3/f45580c1-7230-43d4-a252-f3094621a8ee
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015
- **Test Name:** Logging System Captures Errors, Audit Trails, and Usage
- **Test Code:** [TC015_Logging_System_Captures_Errors_Audit_Trails_and_Usage.py](./TC015_Logging_System_Captures_Errors_Audit_Trails_and_Usage.py)
- **Test Error:** The task to validate Winston logging capturing error messages, user audit trails, and usage data was partially completed. Successful login, navigation, and error scenario triggering were done, generating error logs. User operations for audit logging were attempted via bulk employee addition, but validation errors and input limitations on dropdown fields prevented full completion and saving of audit logs. Log rotation and archival steps were not performed due to these blockers. Further manual intervention or system fixes are needed to fully validate audit trail logging and log rotation without data loss.
Browser Console Logs:
[ERROR] Warning: validateDOMNesting(...): %s cannot appear as a descendant of <%s>.%s <div> p 
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItemText (http://localhost:3000/static/js/bundle.js:15721:87)
    at li
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItem (http://localhost:3000/static/js/bundle.js:14604:88)
    at Transition (http://localhost:3000/static/js/bundle.js:75845:30)
    at Fade (http://localhost:3000/static/js/bundle.js:9535:77)
    at ul
    at http://localhost:3000/static/js/bundle.js:909:66
    at List (http://localhost:3000/static/js/bundle.js:14297:87)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Paper (http://localhost:3000/static/js/bundle.js:18676:88)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Container (http://localhost:3000/static/js/bundle.js:27602:19)
    at Dashboard (http://localhost:3000/static/js/bundle.js:89435:82)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Suspense
    at main
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at Layout (http://localhost:3000/static/js/bundle.js:87066:3)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at ProtectedRoutes (http://localhost:3000/static/js/bundle.js:86299:70)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Router (http://localhost:3000/static/js/bundle.js:75392:15)
    at BrowserRouter (http://localhost:3000/static/js/bundle.js:73293:5)
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3)
    at DefaultPropsProvider (http://localhost:3000/static/js/bundle.js:27674:3)
    at RtlProvider (http://localhost:3000/static/js/bundle.js:27844:7)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:26489:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:27933:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:24917:14)
    at App
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3) (at http://localhost:3000/static/js/bundle.js:45378:33)
[ERROR] Warning: validateDOMNesting(...): %s cannot appear as a descendant of <%s>.%s <p> p 
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at p
    at http://localhost:3000/static/js/bundle.js:909:66
    at Typography (http://localhost:3000/static/js/bundle.js:23910:92)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItemText (http://localhost:3000/static/js/bundle.js:15721:87)
    at li
    at http://localhost:3000/static/js/bundle.js:909:66
    at ListItem (http://localhost:3000/static/js/bundle.js:14604:88)
    at Transition (http://localhost:3000/static/js/bundle.js:75845:30)
    at Fade (http://localhost:3000/static/js/bundle.js:9535:77)
    at ul
    at http://localhost:3000/static/js/bundle.js:909:66
    at List (http://localhost:3000/static/js/bundle.js:14297:87)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Paper (http://localhost:3000/static/js/bundle.js:18676:88)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Grid (http://localhost:3000/static/js/bundle.js:11512:93)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Container (http://localhost:3000/static/js/bundle.js:27602:19)
    at Dashboard (http://localhost:3000/static/js/bundle.js:89435:82)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Suspense
    at main
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at Layout (http://localhost:3000/static/js/bundle.js:87066:3)
    at div
    at http://localhost:3000/static/js/bundle.js:909:66
    at Box (http://localhost:3000/static/js/bundle.js:28784:72)
    at ProtectedRoutes (http://localhost:3000/static/js/bundle.js:86299:70)
    at RenderedRoute (http://localhost:3000/static/js/bundle.js:74724:5)
    at Routes (http://localhost:3000/static/js/bundle.js:75458:5)
    at Router (http://localhost:3000/static/js/bundle.js:75392:15)
    at BrowserRouter (http://localhost:3000/static/js/bundle.js:73293:5)
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3)
    at DefaultPropsProvider (http://localhost:3000/static/js/bundle.js:27674:3)
    at RtlProvider (http://localhost:3000/static/js/bundle.js:27844:7)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:26489:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:27933:5)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:24917:14)
    at App
    at AuthProvider (http://localhost:3000/static/js/bundle.js:88728:3) (at http://localhost:3000/static/js/bundle.js:45378:33)
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) (at http://localhost:3000/$%7BAPI_BASE_URL%7D/api/services/routes/names:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d53b7c5a-1bdb-4c3d-a9fe-1784c2f272b3/95d1b79f-f519-47b7-bd1e-abe274173efc
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016
- **Test Name:** Security Enforcement: CORS, Rate Limiting, and Data Encryption
- **Test Code:** [TC016_Security_Enforcement_CORS_Rate_Limiting_and_Data_Encryption.py](./TC016_Security_Enforcement_CORS_Rate_Limiting_and_Data_Encryption.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d53b7c5a-1bdb-4c3d-a9fe-1784c2f272b3/db18a017-6521-4135-96eb-45cefafbf795
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017
- **Test Name:** Frontend UI Responsiveness and Accessibility
- **Test Code:** [TC017_Frontend_UI_Responsiveness_and_Accessibility.py](./TC017_Frontend_UI_Responsiveness_and_Accessibility.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d53b7c5a-1bdb-4c3d-a9fe-1784c2f272b3/8fa3beba-e253-43e6-b18d-1903a1d0c549
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **47.06** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---