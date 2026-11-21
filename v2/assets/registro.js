// Registro al workshop gratis de Nodo Academy.
// Si SHEET_ENDPOINT tiene la URL de tu Apps Script, el registro se guarda en Google Sheets.
// Si está vacío, el registro se manda por WhatsApp para que no se pierda ninguno.
(function () {
  var SHEET_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzb1kviGC9eRwgMCVo3C7-OcjynwaAhOqHtqWVZpLTj0tHl_JDL4LEVibP5fjY-T6KigQ/exec';
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
      if (!name || !tel || !mail) { err.textContent = 'Escribe tu nombre, WhatsApp y correo: al correo te llega el link de la clase.'; (!name ? f.nombre : !tel ? f.whatsapp : f.correo).focus(); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { err.textContent = 'Revisa tu correo: parece que le falta algo.'; f.correo.focus(); return; }
      if (f.objetivo && !d.get('objetivo')) { err.textContent = 'Cuéntanos qué quieres lograr; así preparamos la clase para ti.'; f.objetivo.focus(); return; }
      var opt = f.fecha && f.fecha.options[f.fecha.selectedIndex];
      if (opt && opt.disabled) { err.textContent = 'Esa fecha ya está llena. Elige otra.'; f.fecha.focus(); return; }
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

// Diagnóstico gratis de la agencia: guarda el contacto y lleva a elegir horario.
(function () {
  var f = document.querySelector('form[data-diagnostico]');
  if (!f) return;
  var EP = 'https://script.google.com/macros/s/AKfycbzb1kviGC9eRwgMCVo3C7-OcjynwaAhOqHtqWVZpLTj0tHl_JDL4LEVibP5fjY-T6KigQ/exec';
  var err = f.querySelector('.err');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(f);
    var name = (d.get('nombre') || '').trim(), biz = (d.get('negocio') || '').trim(),
        tel = (d.get('whatsapp') || '').trim(), mail = (d.get('correo') || '').trim(), ventas = d.get('ventas_mes') || '';
    if (!name || !biz || !tel || !mail) { err.textContent = 'Escribe tu nombre, negocio, WhatsApp y correo.'; (!name ? f.nombre : !biz ? f.negocio : !tel ? f.whatsapp : f.correo).focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { err.textContent = 'Revisa tu correo: parece que le falta algo.'; f.correo.focus(); return; }
    if (!ventas) { err.textContent = 'Elige cuánto vendes al mes; nos ayuda a preparar tu llamada.'; f.ventas_mes.focus(); return; }
    if (!f.acepto.checked) { err.textContent = 'Para continuar necesitamos que aceptes el aviso de privacidad.'; f.acepto.focus(); return; }
    err.textContent = '';
    var q = new URLSearchParams(location.search);
    var b = new URLSearchParams({ evento: 'contacto-agencia', formulario: 'diagnostico', idioma: 'es', fecha_registro: new Date().toISOString(),
      nombre: name, negocio: biz, whatsapp: tel, correo: mail, link: (d.get('link') || '').trim(), ventas_mes: ventas,
      inversion_ads: d.get('inversion_ads') || '', problema: (d.get('problema') || '').trim(), origen: document.referrer || 'directo' });
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) { if (q.get(k)) b.append(k, q.get(k)); });
    fetch(EP, { method: 'POST', mode: 'no-cors', body: b }).catch(function () {});
    var noVende = ventas === 'Todavía no vendo';
    try { if (window.fbq) fbq('track', 'Lead', { content_name: noVende ? 'diagnostico-no-califica' : 'diagnostico' }); } catch (_) {}
    f.classList.add(noVende ? 'to-class' : 'to-book');
    f.classList.add('sent');
    var done = f.querySelector('.done'); if (done) { done.setAttribute('tabindex', '-1'); done.focus(); }
  });
  var bk = f.querySelector('a[data-book]');
  if (bk) bk.addEventListener('click', function () { try { if (window.fbq) fbq('track', 'Schedule'); } catch (_) {} });
})();

// Cupo por fecha de la clase gratis: muestra lugares disponibles y bloquea fechas llenas.
(function () {
  var sels = document.querySelectorAll('form[data-registro] select[name=fecha]');
  if (!sels.length) return;
  var EP = 'https://script.google.com/macros/s/AKfycbzb1kviGC9eRwgMCVo3C7-OcjynwaAhOqHtqWVZpLTj0tHl_JDL4LEVibP5fjY-T6KigQ/exec';
  fetch(EP + '?cupo=1').then(function (r) { return r.json(); }).then(function (j) {
    if (!j || !j.cupo) return;
    [].forEach.call(sels, function (sel) {
      var first = -1;
      [].forEach.call(sel.options, function (o, i) {
        var base = o.getAttribute('data-base') || o.textContent; o.setAttribute('data-base', base); o.value = base;
        var left = j.cupo - ((j.counts || {})[base] || 0);
        if (left <= 0) { o.disabled = true; o.textContent = base + ' · Llena'; }
        else { o.textContent = left <= 15 ? base + ' · Quedan ' + left : base; if (first < 0) first = i; }
      });
      if (sel.options[sel.selectedIndex].disabled && first >= 0) sel.selectedIndex = first;
      var lab = sel.closest('label') && sel.closest('label').querySelector('.cupo');
      if (lab) lab.textContent = '· cupo de ' + j.cupo + ' por fecha';
    });
  }).catch(function () {});
})();
