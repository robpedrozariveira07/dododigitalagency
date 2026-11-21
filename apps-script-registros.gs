// Recibe los registros de la clase gratis de Nodo Academy y los guarda en la hoja
// "Nodo Academy · Registros clase gratis". Pégalo en Extensiones > Apps Script de esa hoja.
// Después: Implementar > Nueva implementación > Aplicación web,
// Ejecutar como: Yo, Quién tiene acceso: Cualquier usuario. Copia la URL que termina en /exec.

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var p = (e && e.parameter) || {};
    var row = headers.map(function (h) {
      var v = p[h] || '';
      // Guarda teléfonos como texto para que Sheets no los convierta en número.
      if (h === 'whatsapp' && v) v = "'" + v;
      return v;
    });
    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Para probar sin la web: Ejecutar > prueba. Debe aparecer una fila de "Prueba".
function prueba() {
  doPost({ parameter: { fecha_registro: new Date().toISOString(), evento: 'clase-gratis', nombre: 'Prueba', whatsapp: '+52 55 0000 0000' } });
}
