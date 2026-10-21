// Google Apps Script - Code.gs
// يدعم:
// 1. ورقة SubData: التحقق من المشتركين والدروس المقيدة
// 2. ورقة Questions-AR: قراءة وتحديث بنك الأسئلة أفقياً لكل درس
// 3. ورقة Answers-AR: حفظ إجابات وتقييمات الطلاب لكل حصة (يدعم الجوال، التابلت، والكمبيوتر)
// 4. ورقة Events: سجل أحداث الكاميرا المباشرة

var SUBSCRIBERS_SHEET = "SubData";
var QUESTIONS_SHEET = "Questions-AR";
var ANSWERS_SHEET = "Answers-AR";
var EVENTS_SHEET = "Events";
var SUBMISSIONS_SHEET = "Submissions";

// 1. معالجة طلبات GET (فحص المشتركين + جلب الأسئلة + تسجيل إجابات الطلاب + جلب الإجابات)
function doGet(e) {
  try {
    var action = (e.parameter && e.parameter.action) ? e.parameter.action : "";
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // أ) التحقق من المشترك في ورقة SubData
    if (action === "verifySubscriber") {
      var phone = (e.parameter.phone || "").toString().trim().replace(/[\s\-\(\)]/g, "");
      var name = (e.parameter.name || "").toString().trim().toLowerCase();

      var subSheet = ss.getSheetByName(SUBSCRIBERS_SHEET);
      if (!subSheet) {
        subSheet = ss.insertSheet(SUBSCRIBERS_SHEET);
        subSheet.appendRow(["رقم المشترك / الجوال", "اسم المشترك"]);
        return createJsonResponse({
          success: false,
          message: "تم إنشاء ورقة SubData تلقائياً في الشيت، يرجى وضع أرقام المشتركين في العمود A وأسمائهم في العمود B."
        });
      }

      var subData = subSheet.getDataRange().getValues();
      for (var i = 1; i < subData.length; i++) {
        var rowPhone = (subData[i][0] || "").toString().trim().replace(/[\s\-\(\)]/g, "");
        var rowName = (subData[i][1] || "").toString().trim().toLowerCase();

        if (rowPhone && phone && rowPhone === phone) {
          if (!name || rowName.indexOf(name) !== -1 || name.indexOf(rowName) !== -1) {
            return createJsonResponse({
              success: true,
              name: subData[i][1] || e.parameter.name,
              phone: subData[i][0] || e.parameter.phone
            });
          }
        }
      }

      return createJsonResponse({
        success: false,
        message: "عذراً، هذا الاسم أو الرقم غير مسجل في ورقة المشتركين (SubData)."
      });
    }

    // ب) جلب بنك الأسئلة من ورقة Questions-AR
    if (action === "getQuestions") {
      var qSheet = ss.getSheetByName(QUESTIONS_SHEET);
      if (!qSheet) {
        qSheet = ss.insertSheet(QUESTIONS_SHEET);
        qSheet.appendRow([
          "عنوان الدرس",
          "رابط صورة السؤال 1",
          "نص السؤال 1",
          "خيارات السؤال 1 أو «نص»",
          "طريقة الإجابة / الإجابة الصحيحة 1",
          "رابط صورة السؤال 2",
          "نص السؤال 2",
          "خيارات السؤال 2 أو «نص»",
          "طريقة الإجابة / الإجابة الصحيحة 2"
        ]);
        return createJsonResponse({
          success: true,
          message: "تم إنشاء ورقة Questions-AR بنجاح وهي جاهزة لإضافة الأسئلة.",
          rows: []
        });
      }

      var rows = qSheet.getDataRange().getValues();
      return createJsonResponse({
        success: true,
        rows: rows
      });
    }

    // ج) تسجيل إجابات وتقييمات الطلاب في ورقة Answers-AR (مضمون 100% للجوال والتابلت والكمبيوتر)
    if (action === "submitAnswers") {
      var ansSheet = ss.getSheetByName(ANSWERS_SHEET) || ss.insertSheet(ANSWERS_SHEET);
      if (ansSheet.getLastRow() === 0) {
        var headerRow = [
          "تاريخ ووقت التسجيل",
          "رقم الطالب",
          "اسم المستخدم",
          "موضوع الحصة"
        ];
        for (var q = 1; q <= 20; q++) {
          headerRow.push("إجابة السؤال " + q);
        }
        ansSheet.appendRow(headerRow);
      }

      var ansCols = [];
      try {
        ansCols = JSON.parse(e.parameter.answerColumns || "[]");
      } catch (err) {
        ansCols = [];
      }

      var newRow = [
        e.parameter.timestamp || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+3", "yyyy-MM-dd HH:mm:ss"),
        e.parameter.studentPhone || "",
        e.parameter.studentName || "زائر",
        e.parameter.lessonTitle || ""
      ].concat(ansCols);

      ansSheet.appendRow(newRow);

      return createJsonResponse({
        success: true,
        status: "success",
        message: "✓ تم تسجيل إجابات الطالب في ورقة Answers-AR بنجاح!"
      });
    }

    // د) جلب سجلات إجابات الطلاب من ورقة Answers-AR لكافة الأجهزة (جوالات، تابلت، كمبيوتر)
    if (action === "getAnswers") {
      var ansSheet = ss.getSheetByName(ANSWERS_SHEET);
      if (!ansSheet) {
        return createJsonResponse({
          success: true,
          rows: []
        });
      }
      var rows = ansSheet.getDataRange().getValues();
      return createJsonResponse({
        success: true,
        rows: rows
      });
    }

    return createJsonResponse({
      status: "ready",
      app: "Smart AR Book Web App",
      sheets: [SUBSCRIBERS_SHEET, QUESTIONS_SHEET, ANSWERS_SHEET]
    });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

// 2. معالجة طلبات POST (تحديث ورقة Questions-AR + تسجيل إجابات الطلاب في Answers-AR + الأحداث)
function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (errP) {
        data = {};
      }
    }
    if ((!data || !data.action) && e && e.parameter && e.parameter.action) {
      data = e.parameter;
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // أ) تحديث وحفظ كافة الأسئلة في ورقة Questions-AR أفقياً
    if (data.action === "syncQuestions") {
      var qSheet = ss.getSheetByName(QUESTIONS_SHEET) || ss.insertSheet(QUESTIONS_SHEET);
      qSheet.clearContents();

      if (data.rows && data.rows.length > 0) {
        var maxCols = 1;
        for (var r = 0; r < data.rows.length; r++) {
          if (data.rows[r].length > maxCols) maxCols = data.rows[r].length;
        }

        var paddedRows = data.rows.map(function(row) {
          var copy = row.slice();
          while (copy.length < maxCols) copy.push("");
          return copy;
        });

        qSheet.getRange(1, 1, paddedRows.length, maxCols).setValues(paddedRows);
      }

      return createJsonResponse({
        success: true,
        message: "✓ تم تحديث ورقة Questions-AR في Google Sheets بنجاح!"
      });
    }

    // ب) تسجيل إجابات وتقييمات الطالب في ورقة Answers-AR
    if (data.action === "submitAnswers") {
      var ansSheet = ss.getSheetByName(ANSWERS_SHEET) || ss.insertSheet(ANSWERS_SHEET);
      var ansCols = data.answerColumns || [];
      if (typeof ansCols === "string") {
        try { ansCols = JSON.parse(ansCols); } catch (_) { ansCols = [ansCols]; }
      }
      if (!Array.isArray(ansCols)) ansCols = [];

      if (ansSheet.getLastRow() === 0) {
        var headerRow = [
          "تاريخ ووقت التسجيل",
          "رقم الطالب",
          "اسم المستخدم",
          "موضوع الحصة"
        ];
        var ansCount = ansCols.length ? ansCols.length : 10;
        for (var q = 1; q <= Math.max(ansCount, 10); q++) {
          headerRow.push("إجابة السؤال " + q);
        }
        ansSheet.appendRow(headerRow);
      }

      var newRow = [
        data.timestamp || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+3", "yyyy-MM-dd HH:mm:ss"),
        data.studentPhone || "",
        data.studentName || "زائر",
        data.lessonTitle || ""
      ].concat(ansCols);

      ansSheet.appendRow(newRow);

      return createJsonResponse({
        success: true,
        status: "success",
        message: "✓ تم تسجيل إجابات الطالب في ورقة Answers-AR بنجاح!"
      });
    }

    // ج) تسجيل إجابة فردية (دعم توافقي سابق)
    if (data.action === "student_submission") {
      var subSheet = ss.getSheetByName(SUBMISSIONS_SHEET) || ss.insertSheet(SUBMISSIONS_SHEET);
      if (subSheet.getLastRow() === 0) {
        subSheet.appendRow(["التاريخ والوقت", "اسم الطالب", "رقم الجوال", "اسم الدرس", "السؤال", "إجابة الطالب", "صحيحة؟", "النتيجة"]);
      }
      subSheet.appendRow([
        data.submittedAt || new Date().toISOString(),
        data.studentName || "",
        data.studentPhone || "",
        data.lessonTitle || "",
        data.questionText || "",
        data.studentAnswer || "",
        data.isCorrect ? "نعم ✓" : "لا ✗",
        data.score || 0
      ]);
      return createJsonResponse({ status: "success", type: "submission_recorded" });
    }

    // د) تسجيل أحداث الكاميرا والدروس
    var eventSheet = ss.getSheetByName(EVENTS_SHEET) || ss.insertSheet(EVENTS_SHEET);
    if (eventSheet.getLastRow() === 0) {
      eventSheet.appendRow(["التاريخ والوقت", "معرف الجلسة", "معرف الهدف", "عنوان الدرس", "الحدث", "الجهاز", "اللغة"]);
    }
    eventSheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.session_id || "session",
      data.target_id || "lesson",
      data.lesson_title || "",
      data.action || "action",
      data.device || "device",
      data.language || "ar"
    ]);
    return createJsonResponse({ status: "success", type: "event_recorded" });
  } catch (err) {
    return createJsonResponse({ status: "error", error: err.toString() });
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
