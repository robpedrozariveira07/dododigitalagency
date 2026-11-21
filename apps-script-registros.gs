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

var CUPO = 120; // lugares por fecha de la clase gratis
var SHEET_ID = '1kdahJSKvKiI3XX8HeKtJlb6ZknHQyFg9ypzQz21Z4YY';
var REMITENTE = 'academy@nododigitalagency.com';
var NOMBRE_REMITENTE = 'Nodo Academy';
var WHATSAPP = '525559098750';

// Una entrada por fecha. La llave es el texto exacto del selector de la web.
// meet: link de Google Meet de esa sesión. inicio: fecha y hora en Ciudad de México.
var CLASES = {
  'Jueves 14 de enero, 7:00 pm': { meet: 'https://meet.google.com/hsc-wpyp-ioe', inicio: '2027-01-14T19:00:00-06:00' },
  'Jueves 21 de enero, 7:00 pm': { meet: 'https://meet.google.com/uof-zvkh-nvc', inicio: '2027-01-21T19:00:00-06:00' },
  'Jueves 28 de enero, 7:00 pm': { meet: 'https://meet.google.com/sjx-ckcy-uxb', inicio: '2027-01-28T19:00:00-06:00' }
};
var DURACION_MIN = 90;
var HEADERS = ['fecha_registro','evento','fecha','nombre','whatsapp','correo','giro','vende','objetivo','comentario','acepto','origen',
  'utm_source','utm_medium','utm_campaign','utm_content','estatus','asistio','compro','notas'];
var TITULO = 'Clase gratis · Tu negocio con Claude: recupera horas cada semana y automatiza tus ventas';

function doPost(e) {
  var p = (e && e.parameter) || {};
  if (p.evento === 'contacto-agencia') return guardarContacto(p);
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    if (sheet.getLastColumn() === 0) configurar();
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    HEADERS.forEach(function (h) {
      if (headers.indexOf(h) === -1) { headers.push(h); sheet.getRange(1, headers.length).setValue(h).setFontWeight('bold').setBackground('#eef1ff'); }
    });
    p.estatus = (conteo()[p.fecha] || 0) >= CUPO ? 'Lista de espera' : 'Registrado';
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
    if (p.correo && p.estatus === 'Lista de espera') enviarEspera(p);
    else if (p.correo) enviarBienvenida(p);
  } catch (err) {
    console.error('No se pudo mandar el correo: ' + err);
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Formulario "Hablemos de tu negocio" de la página principal de Nodo.
// Guarda el contacto en la pestaña "Contacto agencia" y te avisa por correo.
var HEADERS_CONTACTO = ['fecha_registro','formulario','idioma','nombre','negocio','whatsapp','correo','link','giro',
  'ventas_mes','inversion_ads','problema','origen','utm_source','utm_medium','utm_campaign','utm_content','estatus','notas'];
var AVISAR_A = 'roberto@nododigitalagency.com';

function guardarContacto(p) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sh = ss.getSheetByName('Contacto agencia');
    if (!sh) {
      sh = ss.insertSheet('Contacto agencia');
      sh.getRange(1, 1, 1, HEADERS_CONTACTO.length).setValues([HEADERS_CONTACTO]).setFontWeight('bold').setBackground('#eef1ff');
      sh.setFrozenRows(1);
    }
    // Agrega al final las columnas nuevas que falten, sin mover las existentes.
    var heads = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    HEADERS_CONTACTO.forEach(function (h) {
      if (heads.indexOf(h) === -1) { heads.push(h); sh.getRange(1, heads.length).setValue(h).setFontWeight('bold').setBackground('#eef1ff'); }
    });
    if (!p.formulario) p.formulario = 'contacto';
    sh.appendRow(heads.map(function (h) {
      var v = p[h] || '';
      if (h === 'whatsapp' && v) v = "'" + v;
      if (h === 'estatus') v = 'Nuevo';
      return v;
    }));
  } finally {
    lock.releaseLock();
  }
  try {
    var tel = String(p.whatsapp || '').replace(/[^0-9]/g, '');
    var html = '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5">' +
      '<p><b>Nuevo contacto desde nododigitalagency.com</b></p>' +
      '<p>Formulario: ' + esc(p.formulario) + '<br>Nombre: ' + esc(p.nombre) + '<br>Negocio: ' + esc(p.negocio || '-') +
      '<br>WhatsApp: ' + esc(p.whatsapp) + '<br>Correo: ' + esc(p.correo || '-') + '<br>Instagram/web: ' + esc(p.link || '-') +
      '<br>Giro: ' + esc(p.giro || '-') + '<br>Ventas al mes: ' + esc(p.ventas_mes || '-') + '<br>Inversión en anuncios: ' + esc(p.inversion_ads || '-') +
      '<br>Quiere resolver: ' + esc(p.problema || '-') +
      '<br>Origen: ' + esc(p.utm_source || p.origen || 'directo') + '</p>' +
      (tel ? '<p><a href="https://wa.me/' + tel + '">Escribirle por WhatsApp</a></p>' : '') + '</div>';
    GmailApp.sendEmail(AVISAR_A, (p.formulario === 'diagnostico' ? 'Nuevo diagnóstico Nodo: ' : 'Nuevo contacto Nodo: ') + (p.nombre || '') + (p.negocio ? ' · ' + p.negocio : ''),
      textoPlano(html), { htmlBody: html, name: 'Web Nodo' });
  } catch (err) {
    console.error('No se pudo avisar: ' + err);
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

// Lugares ocupados por fecha (sin contar lista de espera).
function conteo() {
  var sh = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  var n = sh.getLastRow();
  if (n < 2) return {};
  var heads = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var iF = heads.indexOf('fecha'), iE = heads.indexOf('estatus'), iN = heads.indexOf('nombre');
  var rows = sh.getRange(2, 1, n - 1, heads.length).getValues(), c = {};
  rows.forEach(function (r) {
    if (iE !== -1 && r[iE] === 'Lista de espera') return;
    if (iN !== -1 && /^prueba/i.test(String(r[iN]))) return;
    c[r[iF]] = (c[r[iF]] || 0) + 1;
  });
  return c;
}

// La web consulta los lugares disponibles: GET ?cupo=1
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ cupo: CUPO, counts: conteo() }))
    .setMimeType(ContentService.MimeType.JSON);
}

function enviarEspera(p) {
  var nombre = String(p.nombre || '').split(' ')[0] || 'Hola';
  var html = '<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.55;color:#1d1d1f;max-width:560px">' +
    '<p>Hola ' + esc(nombre) + ',</p><p>La clase del <b>' + esc(p.fecha) + '</b> se llenó justo antes de tu registro. ' +
    'Te dejamos en lista de espera: si se libera un lugar te escribimos.</p>' +
    '<p>Si prefieres asegurar tu lugar en otra fecha, contéstanos este correo o escríbenos por <a href="https://wa.me/' + WHATSAPP + '">WhatsApp</a> y te cambiamos.</p>' +
    '<p>Saludos,<br>Roberto<br>Nodo Academy</p></div>';
  var opciones = { htmlBody: html, name: NOMBRE_REMITENTE, replyTo: REMITENTE };
  if (GmailApp.getAliases().indexOf(REMITENTE) !== -1) opciones.from = REMITENTE;
  GmailApp.sendEmail(p.correo, nombre + ', estás en lista de espera para la clase gratis', textoPlano(html), opciones);
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
  var ss = SpreadsheetApp.openById(SHEET_ID);
  ss.rename('Nodo Academy · Registros clase gratis');
  var sh = ss.getSheets()[0];
  sh.setName('Registros');
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold').setBackground('#eef1ff');
  sh.setFrozenRows(1);
}

function pruebaContacto() {
  guardarContacto({ fecha_registro: new Date().toISOString(), idioma: 'es', nombre: 'Prueba Contacto',
    negocio: 'Negocio de prueba', whatsapp: '+52 55 0000 0000', giro: 'Otro', inversion_ads: 'Todavía no', origen: 'prueba' });
}

// Prueba: agrega una fila "Prueba" y te manda el correo a ti.
function prueba() {
  doPost({ parameter: {
    fecha_registro: new Date().toISOString(), evento: 'clase-gratis',
    fecha: 'Jueves 14 de enero, 7:00 pm', nombre: 'Prueba Nodo',
    whatsapp: '+52 55 0000 0000', correo: Session.getActiveUser().getEmail()
  } });
}
