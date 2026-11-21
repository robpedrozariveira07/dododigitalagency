// Nodo Academy · registros de la clase gratis
// 1) Guarda cada registro de la web en la hoja "Nodo Academy · Registros clase gratis".
// 2) Manda el correo de bienvenida desde academy@nododigitalagency.com con el link de la clase.
//
// Instalación (una sola vez, con la cuenta roberto@nododigitalagency.com):
//   En la hoja: Extensiones > Apps Script > pega este archivo > Guardar.
//   Ejecutar > prueba  (Google pedirá permisos: Sheets, Gmail y Calendar. Acéptalos tú).
//   Implementar > Nueva implementación > Aplicación web
//     Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario > Implementar.
//   Copia la URL que termina en /exec y pásasela a Claude.

var REMITENTE = 'academy@nododigitalagency.com';
var NOMBRE_REMITENTE = 'Nodo Academy';
var WHATSAPP = '525559098750';

// Una entrada por fecha. La llave es el texto exacto del selector de la web.
// meet: link de Google Meet de esa sesión. inicio: fecha y hora en Ciudad de México.
var CLASES = {
  'Jueves 10 de diciembre, 7:00 pm': { meet: 'https://meet.google.com/sjx-ckcy-uxb', inicio: '2026-12-10T19:00:00-06:00' },
  'Jueves 14 de enero, 7:00 pm':     { meet: 'https://meet.google.com/hsc-wpyp-ioe', inicio: '2027-01-14T19:00:00-06:00' },
  'Jueves 21 de enero, 7:00 pm':     { meet: 'https://meet.google.com/uof-zvkh-nvc', inicio: '2027-01-21T19:00:00-06:00' }
};
var DURACION_MIN = 90;
var HEADERS = ['fecha_registro','evento','fecha','nombre','whatsapp','correo','giro','vende','acepto','origen',
  'utm_source','utm_medium','utm_campaign','utm_content','asistio','compro','notas'];
var TITULO = 'Clase gratis · Tu negocio con Claude: recupera horas cada semana y automatiza tus ventas';

function doPost(e) {
  var p = (e && e.parameter) || {};
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastColumn() === 0) configurar();
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = headers.map(function (h) {
      var v = p[h] || '';
      if (h === 'whatsapp' && v) v = "'" + v; // teléfono como texto
      return v;
    });
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
  try {
    if (p.correo) enviarBienvenida(p);
  } catch (err) {
    console.error('No se pudo mandar el correo: ' + err);
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function enviarBienvenida(p) {
  var nombre = String(p.nombre || '').split(' ')[0] || 'Hola';
  var clase = CLASES[p.fecha] || null;
  var fechaTxt = p.fecha || 'la fecha que elegiste';
  var meet = clase && clase.meet.indexOf('http') === 0 ? clase.meet : '';
  var calLink = clase ? linkCalendario(clase, meet) : '';

  var asunto = nombre + ', tu lugar para la clase gratis está apartado';
  var html =
    '<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.55;color:#1d1d1f;max-width:560px">' +
    '<p>Hola ' + esc(nombre) + ',</p>' +
    '<p>Ya estás registrado en la clase gratis de Nodo Academy:</p>' +
    '<p style="font-size:18px"><b>Tu negocio con Claude: recupera horas cada semana y automatiza tus ventas</b><br>' +
    esc(fechaTxt) + ' (hora del centro de México) · en vivo por Google Meet</p>' +
    (meet
      ? '<p><a href="' + meet + '" style="display:inline-block;background:#2f54eb;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Entrar a la clase</a></p>'
      : '<p>Un día antes te mandamos el link para entrar.</p>') +
    (calLink ? '<p><a href="' + calLink + '">Agregar a mi Google Calendar</a></p>' : '') +
    '<p><b>Para aprovecharla:</b></p>' +
    '<ul>' +
    '<li>Conéctate desde una computadora, no desde el celular.</li>' +
    '<li>Ten a la mano una tarea que repites cada semana: mensajes, cotizaciones, reportes.</li>' +
    '<li>Si puedes, crea tu cuenta gratis en claude.ai antes de la clase.</li>' +
    '</ul>' +
    '<p>¿Dudas? Responde este correo o escríbenos por <a href="https://wa.me/' + WHATSAPP + '">WhatsApp</a>.</p>' +
    '<p>Nos vemos,<br>Roberto<br>Nodo Academy · <a href="https://nododigitalagency.com/academy/">nododigitalagency.com/academy</a></p>' +
    '</div>';

  var opciones = { htmlBody: html, name: NOMBRE_REMITENTE, replyTo: REMITENTE };
  if (GmailApp.getAliases().indexOf(REMITENTE) !== -1) opciones.from = REMITENTE;
  GmailApp.sendEmail(p.correo, asunto, textoPlano(html), opciones);
}

function linkCalendario(clase, meet) {
  var ini = new Date(clase.inicio);
  var fin = new Date(ini.getTime() + DURACION_MIN * 60000);
  var f = function (d) { return Utilities.formatDate(d, 'UTC', "yyyyMMdd'T'HHmmss'Z'"); };
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    '&text=' + encodeURIComponent(TITULO) +
    '&dates=' + f(ini) + '/' + f(fin) +
    '&details=' + encodeURIComponent('Clase gratis de Nodo Academy.' + (meet ? '\nEntrar: ' + meet : '')) +
    (meet ? '&location=' + encodeURIComponent(meet) : '');
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
}

function textoPlano(html) {
  return html.replace(/<br>/g, '\n').replace(/<\/p>|<\/li>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
}

// Pone nombre a la hoja y los encabezados. Se corre sola la primera vez.
function configurar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.rename('Nodo Academy · Registros clase gratis');
  var sh = ss.getSheets()[0];
  sh.setName('Registros');
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold').setBackground('#eef1ff');
  sh.setFrozenRows(1);
}

// Prueba: agrega una fila "Prueba" y te manda el correo a ti.
function prueba() {
  doPost({ parameter: {
    fecha_registro: new Date().toISOString(), evento: 'clase-gratis',
    fecha: 'Jueves 10 de diciembre, 7:00 pm', nombre: 'Prueba Nodo',
    whatsapp: '+52 55 0000 0000', correo: Session.getActiveUser().getEmail()
  } });
}
