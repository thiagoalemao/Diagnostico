async function printPDF() {
  var logoSrc = '';
  try {
    var resp = await fetch('assets/images/logo-v3.webp');
    var imgBlob = await resp.blob();
    logoSrc = await new Promise(function(res) {
      var r = new FileReader();
      r.onload = function(e) { res(e.target.result); };
      r.readAsDataURL(imgBlob);
    });
  } catch(e) {}

  var sections = buildExportData();
  var clinica = formData.clinica_nome || 'Clinica';
  var respondente = formData.respondente_nome || '';
  var whatsapp = formData.respondente_whatsapp || '';
  var dataPrint = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
  var nums = ['01','02','03','04','05','06','07','08'];

  var sectionsHTML = '';
  var entries = Object.entries(sections);
  for (var i = 0; i < entries.length; i++) {
    var sec = entries[i][1];
    var pairs = Object.entries(sec.respostas);
    if (!pairs.length) continue;
    var rows = '';
    for (var j = 0; j < pairs.length; j++) {
      var label = pairs[j][0];
      var answer = pairs[j][1];
      var answerHTML = (answer && answer !== '—') ? answer : '<em>Nao informado</em>';
      rows += '<div class=r><div class=q>' + label + '</div><div class=a>' + answerHTML + '</div></div>';
    }
    var cls = i > 0 ? 'sec pb' : 'sec';
    sectionsHTML += '<div class="' + cls + '">'
      + '<div class=sh><span class=sn>' + nums[i] + '</span><span class=st>' + sec.titulo + '</span></div>'
      + '<div class=ql>' + rows + '</div>'
      + '</div>';
  }

  var logoTag = logoSrc
    ? '<img class=logo src="' + logoSrc + '" alt="">'
    : '<b style="font-size:14pt;color:#b8923a">Thiago Alemao</b>';

  var infoItems = '';
  if (respondente) infoItems += '<div class=ii><span class=il>Respondente</span><span class=iv>' + respondente + '</span></div>';
  if (whatsapp)    infoItems += '<div class=ii><span class=il>WhatsApp</span><span class=iv>' + whatsapp + '</span></div>';
  infoItems += '<div class=ii><span class=il>Secoes</span><span class=iv>8 areas de gestao</span></div>';

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">'
    + '<title>Diagnostico ' + clinica + '</title>'
    + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap">'
    + '<style>'
    + '*{box-sizing:border-box;margin:0;padding:0}'
    + 'body{font-family:Inter,sans-serif;color:#111;background:#fff;font-size:10pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}'
    + '@page{size:A4;margin:0}'
    + '.cover{padding:36pt 48pt 24pt;border-bottom:2pt solid #b8923a;display:flex;align-items:center;justify-content:space-between;gap:24pt}'
    + '.logo{height:48pt;width:auto;object-fit:contain}'
    + '.cm{text-align:right}'
    + '.cl{font-size:7pt;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#b8923a;margin-bottom:5pt}'
    + '.cc{font-family:"Cormorant Garamond",serif;font-size:22pt;font-weight:500;line-height:1.1}'
    + '.cd{font-size:8pt;color:#888;margin-top:5pt}'
    + '.is{background:#faf5ec;border-bottom:1pt solid #e0cfa0;padding:10pt 48pt;display:flex;gap:36pt}'
    + '.ii{display:flex;flex-direction:column;gap:2pt}'
    + '.il{font-size:6.5pt;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#b8923a}'
    + '.iv{font-size:9pt;color:#111}'
    + '.ct{padding:0 48pt 48pt}'
    + '.sec{padding-top:28pt}'
    + '.pb{page-break-before:always;padding-top:28pt}'
    + '.sh{display:flex;align-items:baseline;gap:12pt;margin-bottom:14pt;padding-bottom:7pt;border-bottom:1.5pt solid #b8923a}'
    + '.sn{font-family:"Cormorant Garamond",serif;font-size:24pt;font-weight:400;color:#b8923a;line-height:1;min-width:28pt}'
    + '.st{font-family:"Cormorant Garamond",serif;font-size:14pt;font-weight:500;color:#111}'
    + '.ql{display:flex;flex-direction:column}'
    + '.r{display:grid;grid-template-columns:46% 54%;padding:7pt 0;border-bottom:1pt solid #e0e0e0}'
    + '.r:last-child{border-bottom:none}'
    + '.q{font-size:8.5pt;font-weight:500;color:#444;padding-right:12pt;line-height:1.45}'
    + '.a{font-size:8.5pt;color:#111;line-height:1.45}'
    + '.a em{color:#aaa;font-style:italic}'
    + '.pf{position:fixed;bottom:16pt;left:48pt;right:48pt;display:flex;justify-content:space-between;font-size:7pt;color:#888;border-top:1pt solid #e0e0e0;padding-top:5pt}'
    + '</style></head><body>'
    + '<div class=cover>' + logoTag
    + '<div class=cm>'
    + '<div class=cl>Diagnostico de Gestao</div>'
    + '<div class=cc>' + clinica + '</div>'
    + '<div class=cd>Preenchido em ' + dataPrint + '</div>'
    + '</div></div>'
    + '<div class=is>' + infoItems + '</div>'
    + '<div class=ct>' + sectionsHTML + '</div>'
    + '<div class=pf><span>Thiago Alemao - Gestao Empresarial Veterinaria</span><span>Confidencial</span></div>'
    + '</body></html>';

  var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  var blobUrl = URL.createObjectURL(blob);
  var win = window.open(blobUrl, '_blank');
  if (!win) {
    alert('Permita pop-ups para gerar o PDF.');
    URL.revokeObjectURL(blobUrl);
    return;
  }
  win.addEventListener('load', function() {
    win.print();
    setTimeout(function() { URL.revokeObjectURL(blobUrl); }, 5000);
  });
}
