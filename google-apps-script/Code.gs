/**
 * Google Apps Script - WebAR Educational Book Events Logger
 * 
 * هذا السكريبت يستقبل بيانات الاستخدام من تطبيق WebAR
 * ويسجل كل حدث كصف جديد في جدول بيانات Google Sheets.
 * 
 * الأعمدة:
 * 1. timestamp    (تاريخ ووقت الحدث)
 * 2. session_id   (معرّف الجلسة العشوائي)
 * 3. target_id    (معرّف الهدف / الدرس)
 * 4. lesson_title (عنوان الدرس)
 * 5. action       (نوع الحدث: target_detected, video_open, etc.)
 * 6. device       (نوع الجهاز ونظام التشغيل)
 * 7. language     (لغة التطبيق)
 */

// اسم ورقة العمل المخصصة لتسجيل الأحداث
var SHEET_NAME = "Events";

/**
 * معالجة طلبات POST الواردة من موقع WebAR
 */
function doPost(e) {
  try {
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    
    var result = recordEvent(data);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Event recorded successfully",
      row: result.row
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * معالجة طلبات GET (للاختبار والروابط البديلة)
 */
function doGet(e) {
  try {
    var data = null;
    
    // إذا تم تمرير البيانات كـ JSON في معلمة 'data'
    if (e.parameter && e.parameter.data) {
      data = JSON.parse(e.parameter.data);
    } else if (e.parameter && e.parameter.action) {
      // أو معلمات فردية في الرابط
      data = {
        timestamp: e.parameter.timestamp || new Date().toISOString(),
        session_id: e.parameter.session_id || "test_session",
        target_id: e.parameter.target_id || "lesson_001",
        lesson_title: e.parameter.lesson_title || "دورة الماء",
        action: e.parameter.action || "test_ping",
        device: e.parameter.device || "Browser GET",
        language: e.parameter.language || "ar"
      };
    }
    
    if (data) {
      var result = recordEvent(data);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Event recorded via GET",
        row: result.row
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // صفحة ترحيبية عند فتح رابط Web App في المتصفح
    return ContentService.createTextOutput(JSON.stringify({
      status: "active",
      service: "WebAR Smart Book Logger API",
      time: new Date().toISOString(),
      instructions: "Send POST request with JSON payload or GET with ?data={...}"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * دالة تسجيل الحدث في ورقة Google Sheet
 */
function recordEvent(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  // إذا لم تكن ورقة Events موجودة، يتم إنشاؤها وتنسيق الترويسة تلقائياً
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    setupHeaders(sheet);
  }
  
  var timestamp = data.timestamp || Utilities.formatDate(new Date(), "GMT+3", "yyyy-MM-dd HH:mm:ss");
  var sessionId = data.session_id || "unknown_session";
  var targetId = data.target_id || "unknown_target";
  var lessonTitle = data.lesson_title || "";
  var action = data.action || "unknown_action";
  var device = data.device || "unknown_device";
  var language = data.language || "ar";
  
  // إضافة صف جديد بالبيانات
  sheet.appendRow([
    timestamp,
    sessionId,
    targetId,
    lessonTitle,
    action,
    device,
    language
  ]);
  
  var lastRow = sheet.getLastRow();
  
  // تنسيق تاريخ ووقت العمود الأول
  sheet.getRange(lastRow, 1).setNumberFormat("@");
  
  return { row: lastRow };
}

/**
 * إعداد وترويس الورقة تلقائياً
 */
function setupHeaders(sheet) {
  var headers = [
    "timestamp",
    "session_id",
    "target_id",
    "lesson_title",
    "action",
    "device",
    "language"
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // تنسيق الترويسة (لون كحلي وخلفية متباينة)
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#1e293b");
  headerRange.setFontColor("#f8fafc");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  
  // تجميد الصف الأول
  sheet.setFrozenRows(1);
  
  // ضبط عرض الأعمدة تلقائياً
  for (var i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }
}

/**
 * دالة اختبار سريعة يمكن تشغيلها من داخل محرر Apps Script
 */
function testAddEvent() {
  var sample = {
    timestamp: Utilities.formatDate(new Date(), "GMT+3", "yyyy-MM-dd HH:mm:ss"),
    session_id: "test_" + Math.floor(Math.random() * 10000),
    target_id: "lesson_001",
    lesson_title: "دورة الماء في الطبيعة",
    action: "target_detected",
    device: "iPhone Safari (Test)",
    language: "ar"
  };
  
  var res = recordEvent(sample);
  Logger.log("Result: Event inserted at row " + res.row);
}
