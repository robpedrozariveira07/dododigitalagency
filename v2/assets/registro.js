// Registro al workshop gratis de Nodo Academy.
// Si SHEET_ENDPOINT tiene la URL de tu Apps Script, el registro se guarda en Google Sheets.
// Si está vacío, el registro se manda por WhatsApp para que no se pierda ninguno.
(function () {
  var SHEET_ENDPOINT = '';
  var WA = '525559098750';

  var menu = document.querySelector('.menu'), links = document.getElementById('links');
  if (menu && links) {
    menu.addEventListener('click', function () { var o = links.classList.toggle('open'); menu.setAttribute('aria-expanded', o); });
    links.addEventListener('click', function (e) { if (e.target.tagName === 'A') { links.classList.remove('open'); menu.setAttribute('aria-expanded', false); } });
  }

  var forms = document.querySelectorAll('form[data-registro]');
  [].forEach.call(forms, function (f) {
    var err = f.querySelector('.err');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(f);
      var name = (d.get('nombre') || '').trim(), tel = (d.get('whatsapp') || '').trim(), mail = (d.get('correo') || '').trim();
      if (!name || !tel) { err.textContent = 'Escribe tu nombre y tu WhatsApp: por ahí te mandamos el enlace de la clase.'; (name ? f.whatsapp : f.nombre).focus(); return; }
      if (!f.acepto.checked) { err.textContent = 'Para registrarte necesitamos que aceptes el aviso de privacidad.'; f.acepto.focus(); return; }
      err.textContent = '';
      d.append('evento', f.getAttribute('data-registro'));
      d.append('fecha_registro', new Date().toISOString());
      d.append('origen', document.referrer || 'directo');
      var p = new URLSearchParams(location.search);
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) { if (p.get(k)) d.append(k, p.get(k)); });
      try { if (window.fbq) fbq('track', 'CompleteRegistration'); } catch (_) {}
      if (SHEET_ENDPOINT) {
        fetch(SHEET_ENDPOINT, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(d) }).catch(function () {});
      } else {
        var msg = 'Hola Nodo, me quiero registrar a la clase gratis.\n\nNombre: ' + name + '\nWhatsApp: ' + tel +
          '\nCorreo: ' + (mail || '-') + '\nGiro: ' + (d.get('giro') || '-') + '\n¿Ya vende?: ' + (d.get('vende') || '-') + '\nFecha: ' + (d.get('fecha') || '-');
        window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(msg), '_blank');
      }
      f.classList.add('sent');
      var done = f.querySelector('.done'); if (done) { done.setAttribute('tabindex', '-1'); done.focus(); }
    });
  });
})();

// Botones de pago: avisan a Meta que alguien inició la compra.
document.querySelectorAll('a[data-pay]').forEach(function (a) {
  a.addEventListener('click', function () {
    try { if (window.fbq) fbq('track', 'InitiateCheckout', { content_name: a.getAttribute('data-pay'), currency: 'MXN' }); } catch (_) {}
  });
});
