/**
 * Google Apps Script Backend for Elementary School Scheduling System
 * @author Jeff
 * @date 2026-03-08
 */

function doGet(e) {
  console.log("[INFO] Received GET request");
  try {
    const data = initData();
    console.log("[INFO] Successfully retrieved and aggregated data");
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: data }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error(`[ERROR] Failed to process GET request: ${error.message}`);
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  console.log("[INFO] Received POST request");
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    
    if (action === "login") {
      const { username, password } = payload;
      const result = handleLogin(username, password);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "saveSchedule") {
      const result = handleSaveSchedule(payload.scheduleData);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    console.log(`[WARN] Unknown action: ${action}`);
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error(`[ERROR] Failed to process POST request: ${error.message}`);
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle user authentication
 * @param {string} username 
 * @param {string} password 
 * @returns {object} status and message
 */
function handleLogin(username, password) {
  console.log(`[INFO] Attempting login for user: ${username}`);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("user");
  if (!sheet) {
    console.error("[ERROR] Sheet 'user' not found");
    throw new Error("Database configuration error.");
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const userIdx = headers.indexOf("username");
  const passIdx = headers.indexOf("password");
  
  if (userIdx === -1 || passIdx === -1) {
    console.error("[ERROR] Invalid 'user' sheet schema");
    throw new Error("Database schema error.");
  }
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][userIdx] === username && data[i][passIdx] === password) {
      console.log(`[INFO] Login successful for user: ${username}`);
      return { status: "success", message: "Login successful" };
    }
  }
  
  console.log(`[INFO] Invalid credentials for user: ${username}`);
  return { status: "error", message: "Invalid credentials" };
}

/**
 * 處理排課存檔與衝突驗證 (Conflict Check)
 * @param {object} scheduleData 包含 Teacher_ID, Subject, Grade, Class, Day, Slot
 */
function handleSaveSchedule(scheduleData) {
  console.log(`[INFO] Validating schedule for: ${scheduleData.Teacher_ID} at ${scheduleData.Day} ${scheduleData.Slot}`);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. 檢查最高優先級鎖定 (Fixed_Locks)
  const locksSheet = ss.getSheetByName("Fixed_Locks");
  if (locksSheet) {
    const locks = locksSheet.getDataRange().getValues();
    if (locks.length > 1) {
      for (const lock of locks.slice(1)) {
        const [type, lockSubject, lockGrade, lockDay, lockSlot, lockTeacherId] = lock;
        if (lockDay === scheduleData.Day && lockSlot === scheduleData.Slot) {
          if (lockTeacherId === scheduleData.Teacher_ID) {
            console.log(`[WARN] Fixed lock conflict for teacher at ${scheduleData.Day} ${scheduleData.Slot}`);
            return { status: "error", message: "該時段老師已被行政/資優班排程鎖定" };
          }
        }
      }
    }
  }

  // 2. 檢查老師時段與班級時段衝突
  const scheduleSheet = ss.getSheetByName("Schedules");
  if (!scheduleSheet) {
    console.error(`[ERROR] Sheet 'Schedules' not found`);
    throw new Error("Schedules sheet missing.");
  }
  
  const schedules = scheduleSheet.getDataRange().getValues();
  if (schedules.length > 1) {
    let teacherSlotCount = 0;
    
    for (const row of schedules.slice(1)) {
      const [sid, rGrade, rClass, rDay, rSlot, rTeacherId, rSubject] = row;
      
      // 檢查時段衝突
      if (rDay === scheduleData.Day && rSlot === scheduleData.Slot) {
         if (rTeacherId === scheduleData.Teacher_ID) {
           console.log(`[WARN] Teacher time conflict at ${scheduleData.Day} ${scheduleData.Slot}`);
           return { status: "error", message: "該名老師在此時段已有其他課程" };
         }
         if (rGrade === scheduleData.Grade && rClass === scheduleData.Class) {
           console.log(`[WARN] Class time conflict at ${scheduleData.Day} ${scheduleData.Slot}`);
           return { status: "error", message: "該班級此時段已安排其他課程" };
         }
      }
      
      // 統計該老師總節數
      if (rTeacherId === scheduleData.Teacher_ID) {
        teacherSlotCount++;
      }
    }
    
    // 3. 檢查總節數上限 (Teachers)
    const teachersSheet = ss.getSheetByName("Teachers");
    if (teachersSheet) {
      const teachers = teachersSheet.getDataRange().getValues().slice(1);
      const teacher = teachers.find(t => t[0] === scheduleData.Teacher_ID);
      const maxSlots = teacher ? teacher[2] : 99;
      
      if (teacherSlotCount >= maxSlots) {
        console.log(`[WARN] Teacher slot limit exceeded for ${scheduleData.Teacher_ID}`);
        return { status: "error", message: "該名老師已達每週授課節數上限" };
      }
    }
  }
  
  // 通過檢查，寫入 Schedule Sheet
  const newId = `SCH_${new Date().getTime()}`;
  scheduleSheet.appendRow([
    newId,
    scheduleData.Grade,
    scheduleData.Class,
    scheduleData.Day,
    scheduleData.Slot,
    scheduleData.Teacher_ID,
    scheduleData.Subject
  ]);
  
  console.log(`[INFO] Schedule saved successfully. ID: ${newId}`);
  return { status: "success", message: "排課成功", scheduleId: newId };
}

/**
 * Initialize and aggregate data from various sheets
 * @returns {object} Aggregated nested JSON
 */
function initData() {
  console.log("[INFO] Starting data aggregation in initData()");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const getSheetData = (sheetName) => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      console.error(`[ERROR] Sheet '${sheetName}' not found`);
      return [];
    }
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const headers = data[0];
    return data.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
         obj[header] = row[index] !== undefined && row[index] !== "" ? row[index] : null;
      });
      return obj;
    });
  };

  const teachers = getSheetData("Teachers");
  const expertise = getSheetData("Teacher_Expertise");
  const preferences = getSheetData("Teacher_Preferences");
  
  console.log(`[INFO] Loaded ${teachers.length} teachers, ${expertise.length} expertise, ${preferences.length} preferences`);

  const aggregatedTeachers = teachers.map(teacher => {
    return {
      Teacher_ID: teacher.Teacher_ID,
      Name: teacher.Name,
      Total_Required_Slots: teacher.Total_Required_Slots,
      Note: teacher.Note,
      Expertise: expertise
        .filter(e => e.Teacher_ID === teacher.Teacher_ID)
        .map(e => ({
          Subject: e.Subject,
          Priority: e.Priority
        })),
      Preferences: preferences
        .filter(p => p.Teacher_ID === teacher.Teacher_ID)
        .map(p => ({
          Grade: p.Grade,
          Preference_Level: p.Preference_Level
        }))
    };
  });

  console.log("[INFO] Data aggregation completed successfully.");
  return {
    teachers: aggregatedTeachers
  };
}
