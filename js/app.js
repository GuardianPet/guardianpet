
/* ──────────────────────────────────────────
   CORE APP LOGIC
   ────────────────────────────────────────── */
window.addEventListener('load', function(){
  applyT(S.theme);
  renderOb();
  tick();
  setInterval(tick, 30000);
  setTimeout(function(){
    var al = gi('lyr-app');
    if(al && al.classList.contains('front')) return;
    if(S.firstTime){ go('lyr-ob'); } else { go('lyr-auth'); }
  }, 2200);
});

function tick(){
  var n = new Date();
  var el = gi('clk');
  if(el) el.textContent = n.getHours().toString().padStart(2,'0') + ':' + n.getMinutes().toString().padStart(2,'0');
}

var LAYERS = ['lyr-splash','lyr-ob','lyr-auth','lyr-forgot','lyr-reg','lyr-app'];
function go(id){
  LAYERS.forEach(function(l){
    var e = gi(l); if(!e) return;
    e.classList.toggle('front', l === id);
    e.classList.toggle('off', l !== id);
  });
}

/* ── ONBOARDING ── */
var OB_STEP = 0;
function renderOb(){
  var s = OB[OB_STEP];
  var t = gi('ob-t'), d = gi('ob-d'), bt = gi('ob-bt');
  if(t) t.textContent = s.t;
  if(d) d.textContent = s.d;
  if(bt) bt.textContent = OB_STEP < 2 ? 'Próximo' : 'Começar';
  for(var i=0; i<3; i++){
    var dot = gi('od'+i);
    if(dot){ dot.className = 'ob-dot' + (i===OB_STEP?' act':''); }
  }
}
function obNext(){
  if(OB_STEP < 2){ OB_STEP++; renderOb(); }
  else { goAuth(); }
}
function goAuth(){
  S.firstTime = false;
  try{ localStorage.setItem('gp_firstTime','false'); }catch(e){}
  go('lyr-auth');
}

/* ── AUTH UI ── */
function authSw(t){
  gi('at-login').className = 'atab'+(t==='login'?' act':'');
  gi('at-reg').className = 'atab'+(t==='register'?' act':'');
  gi('f-login').style.display = t==='login'?'block':'none';
  gi('f-reg').style.display = t==='register'?'block':'none';
}
function validEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e); }
function setE(id, on){
  var f=gi(id), e=gi(id+'-e');
  if(f) f.classList.toggle('err', on);
  if(e) e.classList.toggle('on', on);
}
function openForgot(){
  var liEm = gi('li-em');
  var fgEm = gi('fg-em');
  gi('fg-form').style.display = 'block';
  gi('fg-ok').style.display = 'none';
  if(fgEm && liEm && liEm.value) fgEm.value = liEm.value;
  if(fgEm) fgEm.classList.remove('err');
  var errEl = gi('fg-em-e'); if(errEl) errEl.classList.remove('on');
  go('lyr-forgot');
}

/* ── BOOT ── */
function bootApp(){
 // Recarrega plano atualizado do Firebase
  if(S.user && S.user.uid){
    fbDb.collection('users').doc(S.user.uid).get().then(function(snap){
      if(snap.exists){
        var d = snap.data();
        if(d.plano) S.user.plano = d.plano;
      if(d.avatar) S.user.avatar = d.avatar;
      }
      var av = gi('c-av');
      if(av && S.user && S.user.avatar) av.childNodes[0].textContent = S.user.avatar;
      refreshUI();
      refreshPlanoBadge();
    }).catch(function(){
      refreshUI();
      refreshPlanoBadge();
    });
  } else {
    refreshUI();
    refreshPlanoBadge();
  }
  go('lyr-app');
  swP('p-home');
  sTab('home');
  // Inicia data padrão no campo exame
  var exData = gi('ex-data');
  if(exData) exData.value = new Date().toISOString().split('T')[0];
  // Gera QR com delay para garantir DOM pronto
  setTimeout(generateQR, 1000);
  setTimeout(renderSugestoes, 800);
  updateWaPreview();
  updateCheckinUI();
  if(window._checkinTicker) clearInterval(window._checkinTicker);
  window._checkinTicker = setInterval(updateCheckinUI, 60000);
// Carrega dados reais do Firebase (só uma vez no boot)
  S.exames = [];
  S.cuidadores = [];
  setTimeout(loadExames, 1200);
  setTimeout(function(){ 
  loadMeds(); // carrega meds e atualiza o contador na home
}, 1400);
  setTimeout(loadCuidadores, 1600);
  setTimeout(loadVacinas, 2000);
setTimeout(loadEventos, 3500);
  setTimeout(loadSintomas, 4000);
  setTimeout(initNotifications, 5000);
  // Anúncios apenas para plano free
  if(S.user && S.user.plano === 'free'){
    if(window._adTimer) clearInterval(window._adTimer);
    window._adTimer = setInterval(showAd, 10 * 60 * 1000);
  }
}

function refreshUI(){
  var u = S.user, p = S.pet;
  if(!u || !p) return;
  var fn = u.name.split(' ')[0];
  var cl = p.cond;
  var h = new Date().getHours();
  var saud = h<12 ? 'Bom dia' : h<18 ? 'Boa tarde' : 'Boa noite';
  var gs = gi('h-greeting-sub'); if(gs) gs.textContent = saud + ', tutor';
  var hg = gi('h-greet'); if(hg) hg.textContent = 'Olá, '+fn+' 👋';
  var hpem = gi('h-pem');
if(hpem) hpem.childNodes[0].textContent = p.emoji||'🐾';
  gi('h-pnm').textContent = p.name;
  gi('h-psb').textContent = (p.breed||'')+(cl&&cl!=='saudavel'?' · '+(COND_LABELS[cl]||''):'');
  gi('h-pw').textContent = (p.peso||'–')+' kg';
  gi('h-ptg').textContent = COND_LABELS[cl]||'Saudável';
  gi('pr-em').textContent = p.emoji||'🐾';
  gi('pr-nm').textContent = p.name;
  gi('pr-br').textContent = (p.breed||'')+(p.castrado?' · Castrado(a)':'');
  gi('pr-pw').textContent = (p.peso||'–')+' kg';
  gi('pr-cond').textContent = COND_LABELS[cl]||'Saudável';
  gi('c-nm').textContent = u.name;
  gi('c-em').textContent = u.email;
  gi('c-av').childNodes[0].textContent = (S.user && S.user.avatar) ? S.user.avatar : (u.google?'🌐':'🧑');
 var cpem = gi('c-pem');
if(cpem) cpem.textContent = p.emoji||'🐾';
  gi('c-pnm').textContent = p.name;
  gi('c-psb').textContent = (p.breed||'')+(cl?' · '+(COND_LABELS[cl]||''):'');
  var mPetLbl = gi('m-pet-lbl'); if(mPetLbl) mPetLbl.textContent = p.name+' · '+(COND_LABELS[cl]||'Saudável');
  var scPetNm = gi('sc-pet-nm'); if(scPetNm) scPetNm.textContent = p.name;
  var scResPet = gi('sc-res-pet'); if(scResPet) scResPet.textContent = p.name+' ('+( COND_LABELS[cl]||'Saudável')+')';
  var qrPetNm = gi('qr-pet-name'); if(qrPetNm) qrPetNm.textContent = p.name;
  // Alert condicional
 var alertEl = gi('h-alert'), alertTxt = gi('h-alert-txt');
  if(alertEl) alertEl.style.display = 'none';
  if(cl === 'irc1' || cl === 'irc2'){
    if(alertEl) alertEl.style.display = 'flex';
    if(alertTxt) alertTxt.innerHTML = '<strong>Condição ativa: '+COND_LABELS[cl]+'</strong> — use o Scanner para verificar a ração atual.';
  }
  updateKitContent();
  updateWaPreview();
}

function refreshPlanoBadge(){
  var u = S.user||{};
  var plano = u.plano||'free';
  var badge = gi('plano-badge'), miLbl = gi('plano-mi-lbl'), banner = gi('upgrade-banner');
  var textos = {
    free:{badge:'⭐ Plano Gratuito',mi:'Plano Gratuito',showBanner:true},
    pendente:{badge:'⏳ Ativação pendente',mi:'Aguardando ativação',showBanner:false},
    mensal:{badge:'⭐ GuardianPro · Mensal',mi:'GuardianPro Mensal',showBanner:false},
    anual:{badge:'⭐ GuardianPro · Anual',mi:'GuardianPro Anual',showBanner:false}
  };
  var t = textos[plano]||textos.free;
  if(badge) badge.textContent = t.badge;
  if(miLbl) miLbl.textContent = t.mi;
  if(banner) banner.style.display = t.showBanner ? 'block' : 'none';
}

function openEditPet(){
  var p = S.pet||{};
  gi('ep-pn').value = p.name||'';
gi('ep-esp').value = p.especie||'';
  gi('ep-ra').value = p.breed||'';
  gi('ep-ps').value = p.peso||'';
  gi('ep-cd').value = p.cond||'saudavel';
  gi('ep-cast').checked = !!(p.castrado);
  var btn = gi('ep-save-btn'); if(btn){btn.disabled=false;btn.textContent='Salvar alterações ✓';}
  openSheet('sh-editpet');
}
function openEditTutor(){
  var u = S.user||{};
  gi('et-nm').value = u.name||'';
  gi('et-em').value = u.email||'';
  var btn = gi('et-save-btn'); if(btn){btn.disabled=false;btn.textContent='Salvar alterações ✓';}
  openSheet('sh-edittutor');
}

/* ── PANELS & TABS ── */
var curP = 'p-home';
function swP(id){
  var old = gi(curP);
  if(old){ old.classList.remove('front'); old.classList.add('off'); }
  curP = id;
  var nw = gi(id);
  if(nw){ nw.classList.remove('off'); nw.classList.add('front'); nw.scrollTop = 0; }
  if(id === 'p-pron') setTimeout(function(){ drawChart(_chartMetric); }, 300);
  var fab=gi('fab-emer'),fabLbl=gi('fab-emer-lbl');
if(fab){ fab.style.display=id==='p-home'?'flex':'none'; }
if(fabLbl){ fabLbl.style.display=id==='p-home'?'block':'none'; }
}
function sTab(t){
  document.querySelectorAll('.tabbtn').forEach(function(b){ b.classList.remove('act'); });
  var e = gi('tb-'+t); if(e) e.classList.add('act');
}
document.querySelectorAll('.panel').forEach(function(p){ p.classList.add('off'); });

/* ── FIX: SHEETS — usando funções nomeadas sem redefinição ── */
function openSheet(id){
  var el = gi(id);
  if(!el) return;
  el.classList.add('open');
}
function closeSheet(id){
  var el = gi(id);
  if(!el) return;
  el.classList.remove('open');
  // Reset steps do plano quando fechar
  if(id === 'sh-planos'){
    setTimeout(function(){
      var s1 = gi('plan-step-1'), s2 = gi('plan-step-2');
      if(s1) s1.style.display = 'block';
      if(s2) s2.style.display = 'none';
    }, 400);
  }
}
// Fechar ao clicar fundo
document.querySelectorAll('.sh-ov').forEach(function(ov){
  ov.addEventListener('click', function(e){
    if(e.target === ov) closeSheet(ov.id);
  });
});

/* ── CONFIRM DIALOG ── */
var cfAct = '';
function cfm(a){
  cfAct = a;
  var C = {
    logout:{ic:'🚪',t:'Sair da conta?',d:'Você precisará entrar novamente.',cls:'btn-s',bt:'Sair'},
    delete:{ic:'🗑️',t:'Deletar conta?',d:'Ação irreversível. Todos os seus dados serão apagados.',cls:'btn-d',bt:'Deletar'}
  };
  var c = C[a];
  gi('cf-ic').textContent = c.ic;
  gi('cf-t').textContent = c.t;
  gi('cf-d').textContent = c.d;
  var b = gi('cf-ab');
  b.className = 'btn '+c.cls;
  b.style.flex = '1';
  b.style.fontSize = '13px';
  b.textContent = c.bt;
  gi('cf-ov').classList.add('open');
}
function closeCf(){ gi('cf-ov').classList.remove('open'); }
function doCf(){
  closeCf();
  if(cfAct === 'logout') _FB.doLogout();
  else if(cfAct === 'delete') _FB.doDelete();
}

/* ── TOAST ── */
var tT;
function toast(msg){
  var t = gi('tst');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(tT);
  tT = setTimeout(function(){ t.classList.remove('on'); }, 2800);
}

/* ── TEMA ── */
function applyT(t){
  gi('phone').setAttribute('data-theme', t==='default'?'':t);
  S.theme = t;
  try{ localStorage.setItem('gp_theme', t); }catch(e){}
  var lbl = gi('th-lbl'); if(lbl) lbl.textContent = TN[t]||'Personalizado';
}
function setT(t, el){
  document.querySelectorAll('.th-opt').forEach(function(o){ o.classList.remove('sel'); });
  el.classList.add('sel');
  applyT(t);
}

/* ── CHECK-IN ── */
function doCheckin(){
  S.checkinTime = new Date();
  try{ localStorage.setItem('gp_checkin', S.checkinTime.toISOString()); }catch(e){}
  
  var deadline = new Date(S.checkinTime.getTime() + S.checkinWindow * 3600000).toISOString();
  
  if(S.user && S.user.uid){
    fbDb.collection('users').doc(S.user.uid).update({
      lastCheckin: S.checkinTime.toISOString(),
      nextDeadline: deadline,
      protocoloAtivo: false,
      protocoloEtapa: 0
    }).catch(function(){});

    // Registra log
    fbDb.collection('users').doc(S.user.uid).collection('checkins').add({
      data: S.checkinTime.toISOString(),
      deadline: deadline,
      janela: S.checkinWindow
    }).catch(function(){});
  }

  // Agenda notificações locais
  agendarAlertsContingencia();
  updateCheckinUI();
  toast('✓ Check-in registrado! Próxima janela em '+S.checkinWindow+'h');
}

function agendarAlertsContingencia(){
  // Cancela alertas anteriores
  if(window._contTimers){ window._contTimers.forEach(function(t){ clearTimeout(t); }); }
  window._contTimers = [];

  if(!S.checkinTime) return;
  var deadline = new Date(S.checkinTime.getTime() + S.checkinWindow * 3600000);
  var now = Date.now();

  // T-2h: aviso local
  var t1 = deadline.getTime() - 2*3600000 - now;
  if(t1 > 0){
    window._contTimers.push(setTimeout(function(){
      enviarNotifLocal('⏰ Check-in — 2h restantes',
        'Sua janela fecha em 2 horas. Abra o GuardianPet e faça o check-in!','checkin-2h');
    }, t1));
  }

  // T+0 (deadline): dispara protocolo
  var t2 = deadline.getTime() - now;
  if(t2 > 0){
    window._contTimers.push(setTimeout(function(){
      dispararProtocolo();
    }, t2));
  }

  // T+6h: SMS/WhatsApp cuidador primário
  var t3 = deadline.getTime() + 6*3600000 - now;
  if(t3 > 0){
    window._contTimers.push(setTimeout(function(){
      acionarCuidador(1, 'T+6h');
    }, t3));
  }

  // T+12h: cuidador secundário
  var t4 = deadline.getTime() + 12*3600000 - now;
  if(t4 > 0){
    window._contTimers.push(setTimeout(function(){
      acionarCuidador(2, 'T+12h');
    }, t4));
  }

  // T+24h: todos os cuidadores
  var t5 = deadline.getTime() + 24*3600000 - now;
  if(t5 > 0){
    window._contTimers.push(setTimeout(function(){
      acionarTodosCuidadores();
    }, t5));
  }
}

function dispararProtocolo(){
  if(!S.user || !S.user.uid) return;
  fbDb.collection('users').doc(S.user.uid).update({
    protocoloAtivo: true,
    protocoloEtapa: 1,
    protocoloIniciado: new Date().toISOString()
  }).catch(function(){});

  enviarNotifLocal('🚨 Protocolo de contingência ativado',
    'Você não fez check-in no prazo. Cuidadores serão acionados em 6h.','protocolo-ativo');

  // Registra evento de protocolo
  fbDb.collection('protocolos').add({
    uid: S.user.uid,
    nome: S.user.name,
    email: S.user.email,
    pet: S.pet,
    etapa: 1,
    timestamp: new Date().toISOString(),
    cuidadores: S.cuidadores || []
  }).catch(function(){});
}

function acionarCuidador(prioridade, etapa){
  if(!S.user) return;
  var cg = (S.cuidadores||[]).find(function(c){ return c.prioridade == prioridade; });
  if(!cg) return;

  // Notifica localmente
  enviarNotifLocal('🚨 Acionando cuidador '+prioridade,
    cg.nome+' ('+cg.telefone+') será notificado agora.','cuidador-'+prioridade);

  // Gera link WhatsApp com kit de emergência
  var msg = buildKitText()
    + '\n\n⚠️ *ALERTA AUTOMÁTICO GuardianPet*\n'
    + '_'+S.user.name+' não fez check-in há mais de '+etapa.replace('T+','')+'._\n'
    + '_Por favor, verifique se está bem._';
  var tel = cg.telefone.replace(/\D/g,'');
  if(!tel.startsWith('55')) tel = '55'+tel;

  // Abre WhatsApp como fallback (Firebase Functions enviaria SMS real)
  window.open('https://wa.me/'+tel+'?text='+encodeURIComponent(msg),'_blank');

  // Registra no Firebase
  if(S.user.uid){
    fbDb.collection('users').doc(S.user.uid).update({
      protocoloEtapa: prioridade + 1
    }).catch(function(){});
    fbDb.collection('acionamentos').add({
      uid: S.user.uid, cuidador: cg, etapa: etapa,
      timestamp: new Date().toISOString()
    }).catch(function(){});
  }
}

function acionarTodosCuidadores(){
  if(!S.user) return;
  var arr = S.cuidadores||[];
  if(arr.length === 0) return;
  arr.forEach(function(cg, i){
    setTimeout(function(){
      var tel = cg.telefone.replace(/\D/g,'');
      if(!tel.startsWith('55')) tel = '55'+tel;
      var msg = buildKitText()
        + '\n\n🚨 *ALERTA MÁXIMO — GuardianPet*\n'
        + '_'+S.user.name+' está incomunicável há mais de 24h._\n'
        + '_Protocolo de emergência ativado para '+(S.pet&&S.pet.name||'o pet')+'._';
      window.open('https://wa.me/'+tel+'?text='+encodeURIComponent(msg),'_blank');
    }, i * 3000); // espaça 3s entre cada abertura
  });
  enviarNotifLocal('🚨 T+24h — Todos os cuidadores acionados',
    'Protocolo máximo ativado. WhatsApp aberto para cada cuidador.','protocolo-max');
  if(S.user.uid){
    fbDb.collection('users').doc(S.user.uid).update({ protocoloEtapa: 4 }).catch(function(){});
  }
}

function enviarNotifLocal(titulo, corpo, tag){
  if(Notification && Notification.permission === 'granted'){
    new Notification(titulo, {
      body: corpo,
      icon: 'https://guardianpetapp.web.app/icon.png',
      tag: tag,
      requireInteraction: true
    });
  }
}
function updateCheckinUI(){
  var lastEl = gi('cont-last-checkin'), nextEl = gi('cont-next-time');
  var windowEl = gi('cont-window-lbl'), homeEl = gi('h-checkin-lbl');
  if(windowEl) windowEl.textContent = S.checkinWindow+'h';
  if(!S.checkinTime){
    if(lastEl) lastEl.textContent = 'Nunca realizado';
    if(nextEl) nextEl.textContent = '–';
    if(homeEl) homeEl.textContent = 'Aguardando check-in';
    return;
  }
  var now = new Date(), diff = now - S.checkinTime;
  var diffMin = Math.floor(diff/60000), diffH = Math.floor(diffMin/60);
  var agoStr = diffH>0 ? diffH+'h atrás' : diffMin>0 ? diffMin+'min atrás' : 'Agora mesmo';
  if(lastEl) lastEl.textContent = agoStr;
  if(homeEl) homeEl.textContent = 'Check-in ' + agoStr;
  var nextTime = new Date(S.checkinTime.getTime() + S.checkinWindow*3600000);
  var remaining = nextTime - now;
  if(remaining > 0){
    var rH = Math.floor(remaining/3600000), rM = Math.floor((remaining%3600000)/60000);
    if(nextEl) nextEl.textContent = rH+'h '+rM+'min';
  } else {
    if(nextEl){ nextEl.textContent = 'VENCIDO ⚠'; nextEl.style.color = '#ff6b5b'; }
  }
}
function saveContinConfig(){
  var janela = parseInt(gi('ci-janela').value)||24;
  S.checkinWindow = janela;
  try{ localStorage.setItem('gp_checkin_window', janela); }catch(e){}
  if(S.user && S.user.uid){
    fbDb.collection("users").doc(S.user.uid).update({checkinWindow:janela}).catch(function(){});
  }
  updateCheckinUI();
  closeSheet('sh-ci');
  toast('Configurações salvas ✓');
}

/* ── NOTIFICAÇÕES ── */
function saveNotif(){
  var prefs = {
    vacina:   gi('notif-vacina')   && gi('notif-vacina').checked,
    exame:    gi('notif-exame')    && gi('notif-exame').checked,
    med:      gi('notif-med')      && gi('notif-med').checked,
    checkin:  gi('notif-checkin')  && gi('notif-checkin').checked,
    alerta:   gi('notif-alerta')   && gi('notif-alerta').checked
  };
  try{ localStorage.setItem('gp_notif', JSON.stringify(prefs)); }catch(e){}
  if(S.user && S.user.uid){
    fbDb.collection('users').doc(S.user.uid).update({notifPrefs:prefs}).catch(function(){});
  }
  // Solicita permissão do navegador na primeira vez que ativar algo
  if((prefs.vacina || prefs.checkin || prefs.alerta) && Notification && Notification.permission === 'default'){
    Notification.requestPermission().then(function(perm){
      if(perm === 'granted'){ toast('Notificações ativadas ✓'); scheduleNotifications(prefs); }
      else { toast('Permissão negada pelo navegador.'); }
    });
  } else if(Notification && Notification.permission === 'granted'){
    scheduleNotifications(prefs);
    toast('Preferências salvas ✓');
  }
}

function scheduleNotifications(prefs){
  // Limpa timers anteriores
  if(window._notifTimers){ window._notifTimers.forEach(function(t){ clearTimeout(t); }); }
  window._notifTimers = [];

  // Notificação de check-in: avisa 2h antes da janela fechar
  if(prefs.checkin && S.checkinTime){
    var deadline = new Date(S.checkinTime.getTime() + S.checkinWindow * 3600000);
    var alertTime = deadline.getTime() - 2 * 3600000; // 2h antes
    var delay = alertTime - Date.now();
    if(delay > 0 && delay < 86400000){ // só agenda se for nas próximas 24h
      var t = setTimeout(function(){
        if(Notification.permission === 'granted'){
          new Notification('⏰ GuardianPet — Check-in', {
            body: 'Sua janela de check-in fecha em 2 horas! Abra o app e confirme.',
            icon: 'https://guardianpetapp.web.app/icon.png',
            tag: 'checkin-reminder'
          });
        }
      }, delay);
      window._notifTimers.push(t);
    }
  }

  // Notificação de vacinas vencendo em 7 dias
  if(prefs.vacina && S.vacinas){
    var hoje = new Date(); hoje.setHours(0,0,0,0);
    S.vacinas.forEach(function(v){
      if(!v.proxima) return;
      var prox = new Date(v.proxima+'T00:00:00');
      var diasRestantes = Math.ceil((prox - hoje) / 86400000);
      if(diasRestantes === 7){
        var t2 = setTimeout(function(){
          if(Notification.permission === 'granted'){
            new Notification('💉 Vacina em 7 dias — '+v.nome, {
              body: 'A vacina '+v.nome+' de '+((S.pet&&S.pet.name)||'seu pet')+' vence em 7 dias!',
              icon: 'https://guardianpetapp.web.app/icon.png',
              tag: 'vacina-'+v.id
            });
          }
        }, 500);
        window._notifTimers.push(t2);
      } else if(diasRestantes > 0 && diasRestantes <= 7){
        // Notifica imediatamente se já está na janela de 7 dias
        var t3 = setTimeout(function(){
          if(Notification.permission === 'granted'){
            new Notification('💉 Vacina próxima — '+v.nome, {
              body: v.nome+' vence em '+diasRestantes+' dia'+(diasRestantes>1?'s':'')+'. Agende agora.',
              icon: 'https://guardianpetapp.web.app/icon.png',
              tag: 'vacina-soon-'+v.id
            });
          }
        }, 1000);
        window._notifTimers.push(t3);
      }
    });
  }
}

function initNotifications(){
  try{
    var saved = JSON.parse(localStorage.getItem('gp_notif')||'{}');
    if(saved.vacina || saved.checkin || saved.alerta){
      if(Notification && Notification.permission === 'granted'){
        scheduleNotifications(saved);
      }
    }
  }catch(e){}
}
/* ── ALTERAR SENHA ── */
function changePassword(){
  var user = fbAuth.currentUser;
  if(!user){ toast('Faça login novamente.'); return; }

  // Usuário Google não tem senha para alterar
  var isGoogle = user.providerData && user.providerData[0] && user.providerData[0].providerId === 'google.com';
  if(isGoogle){
    closeSheet('sh-pw');
    toast('Conta Google — altere a senha em myaccount.google.com');
    return;
  }

  var oldPw  = gi('pw-old')  ? gi('pw-old').value  : '';
  var newPw  = gi('pw-new')  ? gi('pw-new').value  : '';
  var confPw = gi('pw-conf') ? gi('pw-conf').value : '';

  if(!oldPw){ toast('Digite sua senha atual.'); return; }
  if(newPw.length < 8){ toast('Nova senha deve ter mínimo 8 caracteres.'); return; }
  if(newPw !== confPw){ toast('As senhas não coincidem.'); return; }

  var cred = firebase.auth.EmailAuthProvider.credential(user.email, oldPw);
  user.reauthenticateWithCredential(cred)
    .then(function(){ return user.updatePassword(newPw); })
    .then(function(){
      closeSheet('sh-pw');
      gi('pw-old').value = ''; gi('pw-new').value = ''; gi('pw-conf').value = '';
      toast('Senha alterada com sucesso ✓');
    })
    .catch(function(err){
      if(err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'){
        toast('Senha atual incorreta.');
      } else if(err.code === 'auth/too-many-requests'){
        toast('Muitas tentativas. Aguarde alguns minutos.');
      } else {
        toast('Erro ao alterar senha. Tente novamente.');
      }
    });
}

/* ──────────────────────────────────────────
   EXAMES — FIREBASE REAL
   ────────────────────────────────────────── */

function loadExames(forceReload){
  if(!S.user || !S.user.uid) return;
  var timeline = gi('exames-timeline');
  if(timeline){
    timeline.innerHTML = '<div style="text-align:center;padding:20px"><div style="display:flex;gap:6px;justify-content:center"><div class="qr-loading-dot"></div><div class="qr-loading-dot"></div><div class="qr-loading-dot"></div></div></div>';
  }

  fbDb.collection('users').doc(S.user.uid).collection('exames')
    .orderBy('data', 'desc')
    .limit(50)
    .get()
    .then(function(snap){
      S.exames = [];
      snap.forEach(function(doc){ S.exames.push(Object.assign({id: doc.id}, doc.data())); });
      renderExamesTimeline();
      updateExameCount();
    })
    .catch(function(){
      // fallback sem orderBy (índice não criado ainda)
      fbDb.collection('users').doc(S.user.uid).collection('exames')
        .limit(50)
        .get()
        .then(function(snap){
          S.exames = [];
          snap.forEach(function(doc){ S.exames.push(Object.assign({id: doc.id}, doc.data())); });
          S.exames.sort(function(a,b){ return new Date(b.data) - new Date(a.data); });
          renderExamesTimeline();
          updateExameCount();
        })
        .catch(function(){ toast('Erro ao carregar exames. Verifique a conexão.'); });
    });
}

function renderExamesTimeline(){
  var timeline = gi('exames-timeline');
  if(!timeline) return;

  if(!S.exames || S.exames.length === 0){
    timeline.innerHTML = '<div class="empty-state"><div class="empty-state-ic">🔬</div><div class="empty-state-t">Nenhum exame ainda</div><div class="empty-state-d">Adicione o primeiro exame<br>do seu pet tocando em "+ Adicionar"</div></div>';
    return;
  }

  var html = '';
  S.exames.forEach(function(ex){
    var dateStr = '–';
    if(ex.data){
      try{
        var parts = ex.data.split('-');
        var d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
        dateStr = d.toLocaleDateString('pt-BR', {day:'2-digit', month:'short', year:'numeric'});
      }catch(e){ dateStr = ex.data; }
    }

    var dotColor = 'var(--green-l)';
    var chips = '';

    if(ex.creatinina != null){
      var ok = ex.creatinina < 1.6;
      if(!ok) dotColor = 'var(--amber)';
      chips += '<span class="exam-chip '+(ok?'ok':'high')+'">Creat. <strong>'+ex.creatinina+'</strong></span>';
    }
    if(ex.ureia != null){
      var uOk = ex.ureia < 60;
      chips += '<span class="exam-chip '+(uOk?'ok':'high')+'">Ureia <strong>'+ex.ureia+'</strong></span>';
    }
    if(ex.fosforo != null){
      var fOk = ex.fosforo < 5.0;
      var fVhigh = ex.fosforo > 6;
      if(!fOk) dotColor = fVhigh ? 'var(--coral)' : 'var(--amber)';
      chips += '<span class="exam-chip '+(fOk?'ok': fVhigh?'vhigh':'high')+'">Fósforo <strong>'+ex.fosforo+(fOk?'':' ⚠')+'</strong></span>';
    }
    if(ex.hematocrito != null){
      chips += '<span class="exam-chip '+(ex.hematocrito>=30?'ok':'high')+'">Ht <strong>'+ex.hematocrito+'%</strong></span>';
    }

    html += '<div class="exam-item">';
    html += '<div class="exam-dot" style="background:'+dotColor+'"></div>';
    html += '<div class="exam-card">';
    html += '<div class="exam-date">'+dateStr+' · '+(ex.tipo||'Exame')+'</div>';
    html += '<div class="exam-title">'+(ex.tipo||'Exame')+'</div>';
    if(chips) html += '<div class="exam-chips">'+chips+'</div>';
    if(ex.observacoes) html += '<div class="exam-obs" style="margin-top:6px">'+ex.observacoes+'</div>';
    // Botão deletar
    html += '<button onclick="deleteExam(\''+ex.id+'\')" style="margin-top:8px;background:none;border:none;font-size:11px;color:var(--coral);cursor:pointer;padding:0;font-family:var(--font-b)">🗑 Remover</button>';
    html += '</div></div>';
  });
  timeline.innerHTML = html;
}

function deleteExam(id){
  if(!S.user || !S.user.uid || !id){ toast('Erro ao remover.'); return; }
  if(!confirm('Remover este exame?')) return;
  fbDb.collection('users').doc(S.user.uid).collection('exames').doc(id).delete()
    .then(function(){
   S.exames = S.exames.filter(function(e){ return e.id !== id; });
      renderExamesTimeline();
      updateExameCount();
      loadEventos();
      toast('Exame removido ✓');
    })
    .catch(function(){ toast('Erro ao remover exame.'); });
}

function updateExameCount(){
  var cnt = S.exames ? S.exames.length : 0;
  var h = gi('h-exam-count'); if(h) h.textContent = cnt;
  var pr = gi('pr-exam-count'); if(pr) pr.textContent = cnt;
}

function saveExam(){
  if(!S.user || !S.user.uid){ toast('Faça login para salvar.'); return; }

  var tipo      = gi('ex-tipo')    ? gi('ex-tipo').value                             : 'Bioquímico';
  var dataVal   = gi('ex-data')    ? gi('ex-data').value                             : new Date().toISOString().split('T')[0];
  var creat     = gi('ex-creat')   ? (parseFloat(gi('ex-creat').value)   || null)    : null;
  var ureia     = gi('ex-ureia')   ? (parseFloat(gi('ex-ureia').value)   || null)    : null;
  var fos       = gi('ex-fosforo') ? (parseFloat(gi('ex-fosforo').value) || null)    : null;
  var ht        = gi('ex-ht')      ? (parseFloat(gi('ex-ht').value)      || null)    : null;
  var obs       = gi('ex-obs')     ? gi('ex-obs').value.trim()                       : '';

  if(!creat && !ureia && !fos && !ht && !obs){
    toast('Preencha pelo menos um campo do exame.');
    return;
  }

  var exam = { tipo: tipo, data: dataVal, criadoEm: new Date().toISOString() };
  if(creat  != null) exam.creatinina  = creat;
  if(ureia  != null) exam.ureia       = ureia;
  if(fos    != null) exam.fosforo     = fos;
  if(ht     != null) exam.hematocrito = ht;
  if(obs)            exam.observacoes = obs;

  var btn = gi('exam-save-btn');
  if(btn){ btn.disabled = true; btn.textContent = 'Salvando...'; }

  fbDb.collection('users').doc(S.user.uid).collection('exames').add(exam)
    .then(function(docRef){
      exam.id = docRef.id;
      if(!S.exames) S.exames = [];
      S.exames.unshift(exam);
      renderExamesTimeline();
      updateExameCount();
      closeSheet('sh-exam');

      // limpar campos
      ['ex-creat','ex-ureia','ex-fosforo','ex-ht','ex-obs'].forEach(function(id){
        var el = gi(id); if(el) el.value = '';
      });
      var ocrResult = gi('ocr-result'); if(ocrResult) ocrResult.style.display = 'none';
      if(btn){ btn.disabled = false; btn.textContent = 'Salvar exame ✓'; }
      toast('Exame salvo com sucesso ✓');
    })
    .catch(function(err){
      console.error('saveExam error:', err);
      if(btn){ btn.disabled = false; btn.textContent = 'Salvar exame ✓'; }
      toast('Erro ao salvar. Verifique as regras do Firestore.');
    });
}

function saveVacina(){
  if(!S.user || !S.user.uid){ toast('Faça login para salvar.'); return; }
  var nome = gi('vac-nome') ? gi('vac-nome').value.trim() : '';
  var data = gi('vac-data') ? gi('vac-data').value : '';
  var prox = gi('vac-prox') ? gi('vac-prox').value : '';
  var vet  = gi('vac-vet')  ? gi('vac-vet').value.trim() : '';
  if(!nome){ toast('Digite o nome da vacina.'); return; }
  if(!data){ toast('Selecione a data de aplicação.'); return; }
  if(prox && prox <= data){ toast('A próxima dose deve ser depois da data de aplicação.'); return; }
  var btn = gi('vac-save-btn');
  if(btn){ btn.disabled = true; btn.textContent = 'Salvando...'; }
  var vac = { nome: nome, data: data, proxima: prox, veterinario: vet, criadoEm: new Date().toISOString() };
  fbDb.collection('users').doc(S.user.uid).collection('vacinas').add(vac)
    .then(function(){
      closeSheet('sh-vacina');
      gi('vac-nome').value = ''; gi('vac-data').value = ''; gi('vac-prox').value = ''; gi('vac-vet').value = '';
      if(btn){ btn.disabled = false; btn.textContent = 'Salvar vacina ✓'; }
     if(!S.vacinas) S.vacinas = [];
S.vacinas.unshift(vac);
renderVacinas();
toast('Vacina registrada ✓');
    })
    .catch(function(){
      if(btn){ btn.disabled = false; btn.textContent = 'Salvar vacina ✓'; }
      toast('Erro ao salvar. Tente novamente.');
    });
}
function loadVacinas(){
  if(!S.user || !S.user.uid) return;
  fbDb.collection('users').doc(S.user.uid).collection('vacinas')
    .orderBy('data', 'desc')
    .get()
    .then(function(snap){
      S.vacinas = [];
      snap.forEach(function(doc){ S.vacinas.push(Object.assign({id: doc.id}, doc.data())); });
      renderVacinas();
    })
    .catch(function(){
      fbDb.collection('users').doc(S.user.uid).collection('vacinas').get()
       .then(function(snap){
  S.vacinas = [];
  snap.forEach(function(doc){ S.vacinas.push(Object.assign({id: doc.id}, doc.data())); });
  renderVacinas();
  loadEventos();
})
    });
}

function renderVacinas(){
  var lista = gi('vacinas-lista');
   var vcnt = gi('pr-vac-count');
  if(vcnt) vcnt.textContent = (S.vacinas||[]).length;
  if(!lista) return;
  var arr = S.vacinas || [];
  if(arr.length === 0){
    lista.innerHTML = '<div class="empty-state" style="padding:14px 0"><div class="empty-state-ic" style="font-size:28px">💉</div><div class="empty-state-d">Nenhuma vacina registrada ainda.</div></div>';
    return;
  }
  var html = '';
  arr.forEach(function(v){
    var dataStr = '–';
    if(v.data){
      try{
        var parts = v.data.split('-');
        var d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
        dataStr = d.toLocaleDateString('pt-BR', {day:'2-digit', month:'short', year:'numeric'});
      }catch(e){ dataStr = v.data; }
    }
    var proxStr = '';
    if(v.proxima){
      try{
        var parts2 = v.proxima.split('-');
        var d2 = new Date(parseInt(parts2[0]), parseInt(parts2[1])-1, parseInt(parts2[2]));
        proxStr = ' · Próxima: ' + d2.toLocaleDateString('pt-BR', {day:'2-digit', month:'short', year:'numeric'});
      }catch(e){}
    }
    html += '<div class="exam-item">';
    html += '<div class="exam-dot" style="background:var(--teal)"></div>';
    html += '<div class="exam-card">';
    html += '<div class="exam-date">'+dataStr+(v.veterinario?' · '+v.veterinario:'')+'</div>';
    html += '<div class="exam-title">💉 '+(v.nome||'Vacina')+'</div>';
    if(proxStr) html += '<div class="exam-obs">'+proxStr+'</div>';
    html += '<button onclick="deleteVacina(\''+v.id+'\')" style="margin-top:8px;background:none;border:none;font-size:11px;color:var(--coral);cursor:pointer;padding:0;font-family:var(--font-b)">🗑 Remover</button>';
    html += '</div></div>';
  });
  lista.innerHTML = html;
}

function deleteVacina(id){
  if(!S.user || !S.user.uid || !id) return;
  if(!confirm('Remover esta vacina?')) return;
  fbDb.collection('users').doc(S.user.uid).collection('vacinas').doc(id).delete()
    .then(function(){
    S.vacinas = S.vacinas.filter(function(v){ return v.id !== id; });
      renderVacinas();
      loadEventos();
      toast('Vacina removida ✓');
    })
    .catch(function(){ toast('Erro ao remover.'); });
}
function loadEventos(){
  if(!S.user || !S.user.uid) return;
  var hoje = new Date().toISOString().split('T')[0];
  S.eventos = [];
  if(S.vacinas){
    S.vacinas.forEach(function(v){
      if(v.proxima && v.proxima >= hoje){
        S.eventos.push({id:'vac_'+v.id,tipo:'vacina',descricao:'Vacina: '+v.nome,data:v.proxima,auto:true});
      }
    });
  }
  fbDb.collection('users').doc(S.user.uid).collection('eventos')
    .get()
    .then(function(snap){
      snap.forEach(function(doc){
        var ev = Object.assign({id: doc.id}, doc.data());
        if(ev.data >= hoje) S.eventos.push(ev);
      });
      S.eventos.sort(function(a,b){ return a.data > b.data ? 1 : -1; });
      renderEventos();
    })
    .catch(function(){
      S.eventos.sort(function(a,b){ return a.data > b.data ? 1 : -1; });
      renderEventos();
    });
}

function renderEventos(){
  var lista = gi('home-events-list');
  var empty = gi('home-events-empty');
  var nextEl = gi('h-next-event');
  if(!lista || !empty) return;
  var hoje = new Date().toISOString().split('T')[0];
  var proximos = (S.eventos||[]).filter(function(e){ return e.data >= hoje; }).slice(0, 4);
  if(proximos.length === 0){
    lista.style.display = 'none';
    empty.style.display = 'block';
    if(nextEl) nextEl.textContent = '–';
    return;
  }
  empty.style.display = 'none';
  lista.style.display = 'block';
  var ICONS = {consulta:'🏥', retorno:'🔁', vacina:'💉', exame:'🔬', outro:'📌'};
  var CORES = {consulta:'var(--teal-xl)', retorno:'var(--accent-xl)', vacina:'var(--green-xl)', exame:'var(--amber-xl)', outro:'var(--bg2)'};
  lista.innerHTML = proximos.map(function(ev){
    var parts = ev.data.split('-');
    var d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
    var dataStr = d.toLocaleDateString('pt-BR', {day:'2-digit', month:'short'});
    var diffMs = d - new Date();
    var diffDias = Math.ceil(diffMs / 86400000);
    var difStr = diffDias === 0 ? 'Hoje!' : diffDias === 1 ? 'Amanhã' : 'em '+diffDias+' dias';
    return '<div class="ev-row">'
      + '<div class="ev-ic" style="background:'+CORES[ev.tipo||'outro']+'">'+(ICONS[ev.tipo||'outro'])+'</div>'
      + '<div style="flex:1"><div style="font-size:13px;font-weight:600;color:var(--text)">'+(ev.descricao||ev.tipo)+'</div>'
      + '<div style="font-size:11px;color:var(--text2);opacity:.5">'+dataStr+(ev.hora?' · '+ev.hora:'')+'</div></div>'
      + '<div style="font-size:11px;font-weight:600;color:var(--accent)">'+difStr+'</div>'
      + (!ev.auto ? '<button onclick="deleteEvento(\''+ev.id+'\')" style="background:none;border:none;cursor:pointer;font-size:14px;color:var(--coral);padding:4px;margin-left:4px">🗑</button>' : '')
      + '</div>';
  }).join('');
  if(nextEl) nextEl.textContent = proximos[0] ? (function(){
    var p=proximos[0].data.split('-');
    var dd=new Date(parseInt(p[0]),parseInt(p[1])-1,parseInt(p[2]));
    return dd.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
  })() : '–';
}

function saveEvento(){
  if(!S.user || !S.user.uid){ toast('Faça login para salvar.'); return; }
  var tipo  = gi('ev-tipo') ? gi('ev-tipo').value : 'outro';
  var desc  = gi('ev-desc') ? gi('ev-desc').value.trim() : '';
  var data  = gi('ev-data') ? gi('ev-data').value : '';
  var hora  = gi('ev-hora') ? gi('ev-hora').value : '';
  var hoje  = new Date().toISOString().split('T')[0];
  if(!desc){ toast('Digite uma descrição.'); return; }
  if(!data){ toast('Selecione a data.'); return; }
  if(data < hoje){ toast('A data não pode ser no passado.'); return; }
  var btn = gi('ev-save-btn');
  if(btn){ btn.disabled = true; btn.textContent = 'Salvando...'; }
  var ev = { tipo: tipo, descricao: desc, data: data, hora: hora, criadoEm: new Date().toISOString() };
  fbDb.collection('users').doc(S.user.uid).collection('eventos').add(ev)
    .then(function(docRef){
      ev.id = docRef.id;
      if(!S.eventos) S.eventos = [];
      S.eventos.push(ev);
      S.eventos.sort(function(a,b){ return a.data > b.data ? 1 : -1; });
      renderEventos();
      closeSheet('sh-evento');
      gi('ev-desc').value = ''; gi('ev-data').value = ''; gi('ev-hora').value = '';
      if(btn){ btn.disabled = false; btn.textContent = 'Salvar evento ✓'; }
      toast('Evento agendado ✓');
    })
    .catch(function(){
      if(btn){ btn.disabled = false; btn.textContent = 'Salvar evento ✓'; }
      toast('Erro ao salvar. Tente novamente.');
    });
}

function deleteEvento(id){
  if(!S.user || !S.user.uid || !id) return;
  if(!confirm('Remover este evento?')) return;
  fbDb.collection('users').doc(S.user.uid).collection('eventos').doc(id).delete()
    .then(function(){
      S.eventos = S.eventos.filter(function(e){ return e.id !== id; });
      renderEventos();
      toast('Evento removido ✓');
    })
    .catch(function(){ toast('Erro ao remover.'); });
}
/* ── SINTOMA ── */
function tgSint(b){
  var on = b.dataset.on === '1';
b.setAttribute('data-on', on ? '0' : '1');
  b.style.background = on ? 'var(--bg)' : 'var(--coral-xl)';
  b.style.borderColor = on ? 'var(--bg3)' : 'var(--coral)';
}
function saveSintoma(){
  var obs = gi('sint-obs') ? gi('sint-obs').value.trim() : '';
  var selecionados = [];
  document.querySelectorAll('#sh-sint button[data-on="1"]').forEach(function(b){
    selecionados.push(b.querySelector('div:last-child').textContent.trim());
  });
  if(selecionados.length === 0 && !obs){ toast('Selecione pelo menos um sintoma.'); return; }
  if(!S.user || !S.user.uid){ closeSheet('sh-sint'); toast('Sintoma registrado localmente ✓'); return; }
  var sint = { sintomas: selecionados, observacao: obs, data: new Date().toISOString() };
  fbDb.collection('users').doc(S.user.uid).collection('sintomas').add(sint)
    .then(function(docRef){
      sint.id = docRef.id;
      if(!S.sintomas) S.sintomas = [];
      S.sintomas.unshift(sint);
      renderSintomas();
      var sintObs = gi('sint-obs'); if(sintObs) sintObs.value = '';
      document.querySelectorAll('#sh-sint button[data-on="1"]').forEach(function(b){
        b.dataset.on = '0'; b.style.background = 'var(--bg)'; b.style.borderColor = 'var(--bg3)';
      });
      toast('Sintoma registrado ✓');
    })
    .catch(function(){ toast('Erro ao salvar. Tente novamente.'); });
}

function loadSintomas(){
  if(!S.user || !S.user.uid) return;
  fbDb.collection('users').doc(S.user.uid).collection('sintomas')
    .orderBy('data', 'desc').limit(20).get()
    .then(function(snap){
      S.sintomas = [];
      snap.forEach(function(doc){ S.sintomas.push(Object.assign({id: doc.id}, doc.data())); });
      renderSintomas();
    })
    .catch(function(){
      fbDb.collection('users').doc(S.user.uid).collection('sintomas').limit(20).get()
        .then(function(snap){
          S.sintomas = [];
          snap.forEach(function(doc){ S.sintomas.push(Object.assign({id: doc.id}, doc.data())); });
          S.sintomas.sort(function(a,b){ return new Date(b.data) - new Date(a.data); });
          renderSintomas();
        }).catch(function(){});
    });
}

function renderSintomas(){
  var lista = gi('sint-lista');
  if(!lista) return;
  var arr = S.sintomas || [];
  if(arr.length === 0){
    lista.innerHTML = '<div style="text-align:center;padding:12px;font-size:12px;color:var(--text2);opacity:.6">Nenhum sintoma registrado ainda.</div>';
    return;
  }
  lista.innerHTML = arr.map(function(s){
    var d = new Date(s.data);
    var ds = d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}) + ' ' + d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    var tags = (s.sintomas||[]).map(function(st){ return '<span style="background:var(--coral-xl);color:var(--coral);border-radius:6px;padding:2px 7px;font-size:10px;font-weight:600">'+st+'</span>'; }).join(' ');
    return '<div style="background:var(--surface);border-radius:var(--r-md);padding:10px 12px;margin-bottom:8px;box-shadow:var(--sh)">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
      + '<span style="font-size:10px;color:var(--text2);opacity:.5">'+ds+'</span>'
      + '<button onclick="deleteSintoma(\''+s.id+'\')" style="background:none;border:none;font-size:11px;color:var(--coral);cursor:pointer;padding:0;font-family:var(--font-b)">🗑</button>'
      + '</div>'
      + (tags ? '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px">'+tags+'</div>' : '')
      + (s.observacao ? '<div style="font-size:11px;color:var(--text2);line-height:1.4">'+s.observacao+'</div>' : '')
      + '</div>';
  }).join('');
}

function deleteSintoma(id){
  if(!S.user || !S.user.uid || !id) return;
  if(!confirm('Remover este registro?')) return;
  fbDb.collection('users').doc(S.user.uid).collection('sintomas').doc(id).delete()
    .then(function(){
      S.sintomas = S.sintomas.filter(function(s){ return s.id !== id; });
      renderSintomas();
      toast('Registro removido ✓');
    })
    .catch(function(){ toast('Erro ao remover.'); });
}

/* ──────────────────────────────────────────
   QR CODE — ROBUSTO
   ────────────────────────────────────────── */
var _qrObj = null, _qrExpires = null, _qrRetry = 0;

function generateQR(){
  _qrRetry = 0;
  _tryQR();
}

function _tryQR(){
  var wrap = gi('qr-canvas-wrap');
  var loadEl = gi('qr-loading-state');
  if(!wrap){ setTimeout(_tryQR, 300); return; }

  var pet = S.pet || {name:'Meu Pet'};
  var user = S.user || {name:'Tutor'};
  var cond = COND_LABELS[pet.cond]||'Saudável';

  var texto = 'Pet: ' + (pet.name||'?')
    + ' | Raca: ' + (pet.breed||'SRD')
    + ' | Peso: ' + (pet.peso||'?') + 'kg'
    + ' | ' + cond
    + ' | Tutor: ' + (user.name||'?')
    + ' | Email: ' + (user.email||'?');

  var url = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data='
    + encodeURIComponent(texto);

  wrap.innerHTML = '';
  var img = document.createElement('img');
  img.width = 220;
  img.height = 220;
  img.style.borderRadius = '12px';
  img.style.boxShadow = 'var(--sh)';
  img.onload = function(){
    if(loadEl) loadEl.style.display = 'none';
    wrap.style.display = 'flex';
    var qrTimer = gi('qr-timer'), qrInfo = gi('qr-info');
    if(qrTimer) qrTimer.style.display = 'block';
    if(qrInfo) qrInfo.style.display = 'block';
    var qpn = gi('qr-pet-name'); if(qpn) qpn.textContent = pet.name;
    _qrExpires = new Date(new Date().getTime() + 72*3600000);
    startQRCountdown();
    toast('QR Code gerado ✓');
  };
  img.onerror = function(){
    if(loadEl) loadEl.style.display = 'none';
    wrap.style.display = 'flex';
    wrap.innerHTML = '<div style="text-align:center;padding:16px;font-size:12px;color:var(--text2)">Sem conexão. Toque em "Gerar novo" quando estiver online.</div>';
  };
  img.src = url;
  wrap.appendChild(img);
}
 

function startQRCountdown(){
  if(window._qrInterval) clearInterval(window._qrInterval);
  window._qrInterval = setInterval(function(){
    if(!_qrExpires){ clearInterval(window._qrInterval); return; }
    var diff = _qrExpires - new Date();
    var ce = gi('qr-countdown'); if(!ce){ clearInterval(window._qrInterval); return; }
    if(diff <= 0){ ce.textContent = 'Expirado'; clearInterval(window._qrInterval); return; }
    var h = Math.floor(diff/3600000);
    var m = Math.floor((diff%3600000)/60000);
    var s = Math.floor((diff%60000)/1000);
    ce.textContent = h.toString().padStart(2,'0')+':'+m.toString().padStart(2,'0')+':'+s.toString().padStart(2,'0');
  }, 1000);
}

function regenerateQR(){
  var wrap = gi('qr-canvas-wrap'), loadEl = gi('qr-loading-state');
  var qrTimer = gi('qr-timer'), qrInfo = gi('qr-info');
  if(wrap){ wrap.style.display = 'none'; wrap.innerHTML = ''; }
  if(loadEl) loadEl.style.display = 'flex';
  if(qrTimer) qrTimer.style.display = 'none';
  if(qrInfo) qrInfo.style.display = 'none';
  _qrRetry = 0;
  setTimeout(generateQR, 400);
  toast('Gerando novo QR Code...');
}

function downloadQR(){
  var wrap = gi('qr-canvas-wrap'); if(!wrap) return;
  var img = wrap.querySelector('img');
  var canvas = wrap.querySelector('canvas');

  if(img && img.src){
    // Baixa via fetch para evitar erro CORS
    fetch(img.src)
      .then(function(r){ return r.blob(); })
      .then(function(blob){
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'guardianpet-qr-'+(S.pet?S.pet.name:'pet').toLowerCase().replace(/\s/g,'-')+'.png';
        a.click();
        setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
        toast('QR Code salvo ✓');
      })
      .catch(function(){
        // Fallback: abre a imagem numa nova aba para o usuário salvar manualmente
        window.open(img.src, '_blank');
        toast('Aberto em nova aba — pressione e segure para salvar ✓');
      });
  } else if(canvas){
    var a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'guardianpet-qr-'+(S.pet?S.pet.name:'pet').toLowerCase().replace(/\s/g,'-')+'.png';
    a.click();
    toast('QR Code salvo ✓');
  } else {
    regenerateQR();
    toast('Gerando QR para download...');
  }
}


/* ── CÂMERA ── */
var _html5Qr = null, _camOn = false;
function toggleCam(){ _camOn ? stopCam() : startCam(); }
function startCam(){
  var ph=gi('cam-placeholder'), rd=gi('reader'), ov=gi('cam-overlay'), btn=gi('cam-btn');
  if(ph) ph.style.display='none';
  if(rd) rd.style.display='block';
  if(ov) ov.style.display='flex';
  if(btn) btn.textContent='⏹ Parar câmera';
  _camOn = true;
  _html5Qr = new Html5Qrcode('reader');
  _html5Qr.start({facingMode:'environment'},{fps:10,qrbox:{width:160,height:160}},
    function(decodedText){
      stopCam();
      try{
        var data = JSON.parse(decodedText);
        if(data.pet) toast('Prontuário de '+data.pet.name+' carregado ✓');
        else toast('QR Code lido ✓');
      }catch(e){
        gi('sc-ph').style.display = 'none';
        gi('sc-res').style.display = 'block';
        toast('Código lido — analisando...');
      }
    },
    function(){}
  ).catch(function(err){
    stopCam();
    if(err.toString().indexOf('permission')>-1||err.toString().indexOf('NotAllowed')>-1){
      toast('Permissão de câmera negada.');
    } else { toast('Câmera indisponível. Use entrada manual.'); }
    if(ph) ph.style.display='flex';
    if(rd) rd.style.display='none';
    if(ov) ov.style.display='none';
  });
}
function stopCam(){
  if(_html5Qr && _camOn){
    _html5Qr.stop().then(function(){ _html5Qr.clear(); _html5Qr=null; }).catch(function(){ _html5Qr=null; });
  }
  _camOn = false;
  var ph=gi('cam-placeholder'), rd=gi('reader'), ov=gi('cam-overlay'), btn=gi('cam-btn');
  if(ph) ph.style.display='flex';
  if(rd){ rd.style.display='none'; rd.innerHTML=''; }
  if(ov) ov.style.display='none';
  if(btn) btn.textContent='📷 Abrir câmera';
}

/* ── OCR ── */
function processOCR(input){
  var file = input.files[0]; if(!file) return;
  var prog=gi('ocr-progress'), bar=gi('ocr-bar'), status=gi('ocr-status'), pct=gi('ocr-pct');
  if(prog) prog.style.display = 'block';

  var isScanSheet = !!(gi('sh-exam') && gi('sh-exam').classList.contains('open'));
  toast('Iniciando leitura da imagem...');

  Tesseract.recognize(file, 'por+eng', {
    logger: function(m){
      if(m.status === 'recognizing text'){
        var p = Math.round(m.progress*100);
        if(bar) bar.style.width = p+'%';
        if(pct) pct.textContent = p+'%';
        if(status) status.textContent = 'Lendo... '+p+'%';
      } else if(m.status === 'loading tesseract core'){
        if(status) status.textContent = 'Carregando motor OCR...';
      } else if(m.status === 'initializing tesseract'){
        if(status) status.textContent = 'Inicializando...';
      }
    }
  }).then(function(res){
    if(prog) prog.style.display = 'none';
    var txt = res.data.text;
    if(isScanSheet){
      parseLabResults(txt);
    } else {
      parseFoodLabel(txt);
    }
    toast('Leitura concluída ✓');
  }).catch(function(e){
    if(prog) prog.style.display = 'none';
    console.error('OCR error:', e);
    toast('Erro na leitura. Preencha manualmente.');
  });
  input.value = '';
}

function parseFoodLabel(text){
  var t = text.replace(/\n/g,' ');
  var fosforo   = extractNum(t, /f[oó]sforo[^\d]{0,20}?(\d+[,\.]\d+|\d+)\s*%/i);
  var sodio     = extractNum(t, /s[oó]dio[^\d]{0,20}?(\d+[,\.]\d+|\d+)\s*%/i);
  var proteina  = extractNum(t, /prote[ií]na[^\d]{0,20}?(\d+[,\.]\d+|\d+)\s*%/i);
  var gordura   = extractNum(t, /gordura|extrato\s*et[eé]reo[^\d]{0,20}?(\d+[,\.]\d+|\d+)\s*%/i);

  if(!fosforo && !proteina && !sodio){
    toast('Nutrientes não detectados. Use modo Manual ou melhore a foto.');
    swP('p-scan-m'); sTab('scanner');
    return;
  }

  var rs = document.querySelectorAll('#p-scan-m input[type=range]');
  if(rs[0] && fosforo)  rs[0].value = Math.min(1.5, Math.max(0.1, fosforo));
  if(rs[1] && sodio)    rs[1].value = Math.min(0.8, Math.max(0.05, sodio));
  if(rs[2] && proteina) rs[2].value = Math.min(80,  Math.max(10, proteina));
  if(rs[3] && gordura)  rs[3].value = Math.min(40,  Math.max(5, gordura));
  calcM();

  swP('p-scan-m'); sTab('scanner');
  var scPh=gi('sc-ph'), scRes=gi('sc-res');
  if(scPh) scPh.style.display='none';
  if(scRes) scRes.style.display='block';
  toast('Nutrientes detectados ✓ — verifique os valores');
}

function extractNum(text, regex){
  var m = text.match(regex);
  if(!m) return null;
  // Pega o último grupo numérico capturado
  var raw = '';
  for(var i = m.length-1; i >= 1; i--){
    if(m[i]){ raw = m[i]; break; }
  }
  if(!raw) raw = m[0].match(/(\d+[,\.]\d+|\d+)\s*%/);
  if(Array.isArray(raw)) raw = raw[1]||raw[0];
  var val = parseFloat(String(raw).replace(',','.'));
  return isNaN(val) ? null : val;
}

function parseLabResults(text){
  var t = text.replace(/\n/g,' ');
  var fields = [
    {label:'Creatinina', regex:/creat[a-z]*[^\d]{0,15}?(\d+[,\.]\d+)/i, unit:'mg/dL', el:'ex-creat'},
    {label:'Ureia',      regex:/ureia[^\d]{0,15}?(\d+[,\.]\d+|\d{1,3})/i, unit:'mg/dL', el:'ex-ureia'},
    {label:'Fósforo',    regex:/f[oó]sforo[^\d]{0,15}?(\d+[,\.]\d+)/i, unit:'mg/dL', el:'ex-fosforo'},
    {label:'Hematócrito',regex:/hemat[oó]crito[^\d]{0,15}?(\d+[,\.]\d+|\d{1,2})/i, unit:'%', el:'ex-ht'}
  ];
  var found = [];
  fields.forEach(function(f){
    var m = t.match(f.regex);
    if(m){
      var val = (m[1]||'').replace(',','.');
      found.push({label:f.label, val:val, unit:f.unit, el:f.el});
      var el=gi(f.el); if(el) el.value = parseFloat(val);
    }
  });
  var result=gi('ocr-result'), fieldsDiv=gi('ocr-fields');
  if(result) result.style.display='block';
  if(fieldsDiv){
    fieldsDiv.innerHTML = found.length > 0
      ? found.map(function(f){
          return '<div class="ocr-field-found">'+f.label+'<span>'+f.val+' '+f.unit+'</span></div>';
        }).join('')
        + '<div style="font-size:11px;color:var(--green);margin-top:6px">✓ '+found.length+' valor(es) detectado(s). Confirme antes de salvar.</div>'
      : '<div style="font-size:12px;color:var(--text2);opacity:.7;padding:8px 0">Nenhum valor detectado automaticamente. Preencha manualmente.</div>';
  }
}

function extractBrandName(text){
  var lines = text.split('\n').map(function(l){ return l.trim(); })
    .filter(function(l){ return l.length > 3 && l.length < 40; });
  return lines[0] || 'Ração escaneada';
}
function parseLabResults(text){
  var fields = [
    {label:'Creatinina',regex:/creat[a-z]*[\s\S]{0,10}?(\d+[,\.]\d+)/i,unit:'mg/dL',el:'ex-creat'},
    {label:'Ureia',regex:/ureia[\s\S]{0,10}?(\d+[,\.]\d+|\d+)/i,unit:'mg/dL',el:'ex-ureia'},
    {label:'Fósforo',regex:/f[oó]sforo[\s\S]{0,10}?(\d+[,\.]\d+)/i,unit:'mg/dL',el:'ex-fosforo'},
    {label:'Hematócrito',regex:/hemat[oó]crito[\s\S]{0,10}?(\d+[,\.]\d+|\d+)/i,unit:'%',el:'ex-ht'}
  ];
  var found = [];
  fields.forEach(function(f){
    var m = text.match(f.regex);
    if(m){ var val=m[1].replace(',','.'); found.push({label:f.label,val:val,unit:f.unit,el:f.el}); if(f.el){var el=gi(f.el);if(el)el.value=parseFloat(val);} }
  });
  var result=gi('ocr-result'), fieldsDiv=gi('ocr-fields');
  if(result && fieldsDiv){
    result.style.display = 'block';
    fieldsDiv.innerHTML = found.length > 0
      ? found.map(function(f){ return '<div class="ocr-field-found">'+f.label+'<span>'+f.val+' '+f.unit+'</span></div>'; }).join('')
      : '<div style="font-size:12px;color:var(--text2);opacity:.7;padding:8px 0">Nenhum valor detectado. Preencha manualmente.</div>';
  }
}

/* ── SCANNER MANUAL ── */
/* ── BANCO DE RAÇÕES — nutrientes reais ── */
var RACOES_DB = [
  // GATOS
  {nome:'Royal Canin Renal Feline',esp:'Gato',fosforo:0.26,sodio:0.33,proteina:27,gordura:18},
  {nome:'Royal Canin Indoor',esp:'Gato',fosforo:0.67,sodio:0.37,proteina:34,gordura:14},
  {nome:'Royal Canin Urinary',esp:'Gato',fosforo:0.55,sodio:0.93,proteina:34,gordura:14},
  {nome:'Hills kd Feline',esp:'Gato',fosforo:0.24,sodio:0.19,proteina:28,gordura:21},
  {nome:'Hills cd Feline',esp:'Gato',fosforo:0.67,sodio:0.38,proteina:34,gordura:12},
  {nome:'Hills Science Diet Adulto Gato',esp:'Gato',fosforo:0.72,sodio:0.32,proteina:34,gordura:18},
  {nome:'Purina Pro Plan Renal Feline',esp:'Gato',fosforo:0.30,sodio:0.35,proteina:26,gordura:18},
  {nome:'Purina Pro Plan Adulto Gato',esp:'Gato',fosforo:0.90,sodio:0.40,proteina:40,gordura:16},
  {nome:'Guabi Natural Gato Adulto',esp:'Gato',fosforo:0.85,sodio:0.38,proteina:36,gordura:14},
  {nome:'Whiskas Adulto',esp:'Gato',fosforo:1.10,sodio:0.55,proteina:30,gordura:10},
  {nome:'Premier Gato Adulto',esp:'Gato',fosforo:0.78,sodio:0.35,proteina:36,gordura:14},
  {nome:'Farmina ND Gato Adulto',esp:'Gato',fosforo:0.95,sodio:0.42,proteina:44,gordura:18},
  {nome:'Iams Gato Adulto',esp:'Gato',fosforo:0.88,sodio:0.40,proteina:36,gordura:14},
  {nome:'Ração Seca Equilibrio Gato',esp:'Gato',fosforo:0.82,sodio:0.36,proteina:34,gordura:13},
  {nome:'Royal Canin Kitten',esp:'Gato',fosforo:1.05,sodio:0.42,proteina:36,gordura:19},
  {nome:'Hills kd Feline Mobility',esp:'Gato',fosforo:0.22,sodio:0.17,proteina:27,gordura:20},
  {nome:'Purina NF Renal Feline',esp:'Gato',fosforo:0.28,sodio:0.31,proteina:25,gordura:19},
  {nome:'Specific Feline CKD',esp:'Gato',fosforo:0.25,sodio:0.28,proteina:26,gordura:17},

  // CÃES
  {nome:'Royal Canin Renal Canine',esp:'Cão',fosforo:0.20,sodio:0.20,proteina:14,gordura:11},
  {nome:'Royal Canin Adulto Cão',esp:'Cão',fosforo:0.75,sodio:0.40,proteina:25,gordura:14},
  {nome:'Royal Canin Mini Adulto',esp:'Cão',fosforo:0.72,sodio:0.38,proteina:26,gordura:15},
  {nome:'Hills kd Canine',esp:'Cão',fosforo:0.21,sodio:0.19,proteina:14,gordura:15},
  {nome:'Hills Science Diet Adulto Cão',esp:'Cão',fosforo:0.80,sodio:0.33,proteina:22,gordura:14},
  {nome:'Hills cd Canine',esp:'Cão',fosforo:0.62,sodio:0.36,proteina:20,gordura:13},
  {nome:'Purina Pro Plan Adulto Cão',esp:'Cão',fosforo:0.88,sodio:0.42,proteina:30,gordura:18},
  {nome:'Purina NF Renal Canine',esp:'Cão',fosforo:0.22,sodio:0.22,proteina:14,gordura:14},
  {nome:'Guabi Natural Cão Adulto',esp:'Cão',fosforo:0.82,sodio:0.38,proteina:28,gordura:14},
  {nome:'Golden Cão Adulto',esp:'Cão',fosforo:0.90,sodio:0.45,proteina:24,gordura:10},
  {nome:'Pedigree Adulto',esp:'Cão',fosforo:1.05,sodio:0.52,proteina:22,gordura:8},
  {nome:'Premier Cão Adulto',esp:'Cão',fosforo:0.76,sodio:0.36,proteina:28,gordura:14},
  {nome:'Farmina ND Cão Adulto',esp:'Cão',fosforo:0.92,sodio:0.44,proteina:38,gordura:20},
  {nome:'Iams Cão Adulto',esp:'Cão',fosforo:0.85,sodio:0.40,proteina:26,gordura:14},
  {nome:'Nutrópica Cão Adulto',esp:'Cão',fosforo:0.80,sodio:0.38,proteina:26,gordura:12},
  {nome:'Biofresh Cão Adulto',esp:'Cão',fosforo:0.78,sodio:0.36,proteina:28,gordura:14},
  {nome:'Three Cats Adulto',esp:'Gato',fosforo:0.95,sodio:0.44,proteina:34,gordura:13},
  {nome:'Special Dog Adulto',esp:'Cão',fosforo:0.98,sodio:0.48,proteina:22,gordura:8},
  {nome:'Royal Canin Cardiac Canine',esp:'Cão',fosforo:0.42,sodio:0.08,proteina:16,gordura:18},
  {nome:'Hills hd Cardiac Canine',esp:'Cão',fosforo:0.38,sodio:0.07,proteina:15,gordura:22},
  {nome:'Royal Canin Hepatic Canine',esp:'Cão',fosforo:0.45,sodio:0.35,proteina:16,gordura:20},
  {nome:'Royal Canin Diabetic Canine',esp:'Cão',fosforo:0.65,sodio:0.38,proteina:30,gordura:11},
  {nome:'Hills wd Diabetic Canine',esp:'Cão',fosforo:0.60,sodio:0.30,proteina:18,gordura:8},
  {nome:'Purina HA Hypoallergenic',esp:'Cão',fosforo:0.70,sodio:0.35,proteina:16,gordura:12},
  {nome:'Royal Canin Hypoallergenic',esp:'Cão',fosforo:0.68,sodio:0.33,proteina:19,gordura:14},
  {nome:'Equilibrio Veterinary Renal',esp:'Cão',fosforo:0.23,sodio:0.21,proteina:14,gordura:13},
  {nome:'Affinity Advance Renal',esp:'Cão',fosforo:0.19,sodio:0.18,proteina:14,gordura:14},
  {nome:'Specific CRD Renal Canine',esp:'Cão',fosforo:0.20,sodio:0.17,proteina:13,gordura:16},
  {nome:'Acana Adulto Cão',esp:'Cão',fosforo:1.10,sodio:0.46,proteina:38,gordura:18},
  {nome:'Orijen Adulto Cão',esp:'Cão',fosforo:1.15,sodio:0.48,proteina:42,gordura:20},
  {nome:'Acana Adulto Gato',esp:'Gato',fosforo:1.08,sodio:0.44,proteina:42,gordura:20},
];

/* ── BUSCA NO BANCO ── */
function buscarRacao(termo){
  if(!termo || termo.length < 2) return [];
  var t = termo.toLowerCase().trim();
  return RACOES_DB.filter(function(r){
    return r.nome.toLowerCase().indexOf(t) > -1;
  }).slice(0, 6);
}

function renderResultadosBusca(resultados){
  var lista = gi('scan-search-results');
  if(!lista) return;
  if(resultados.length === 0){
    lista.innerHTML = '<div style="padding:10px;font-size:12px;color:var(--text2);opacity:.6;text-align:center">Nenhuma ração encontrada. Use "Manual".</div>';
    return;
  }
  lista.innerHTML = resultados.map(function(r){
    return '<button onclick="selecionarRacao(\''+encodeURIComponent(JSON.stringify(r))+'\')" style="'
      +'width:100%;text-align:left;background:var(--surface);border:none;border-bottom:1px solid var(--bg2);'
      +'padding:12px 14px;cursor:pointer;font-family:var(--font-b)">'
      +'<div style="font-size:13px;font-weight:600;color:var(--text)">'+r.nome+'</div>'
      +'<div style="font-size:11px;color:var(--text2);opacity:.6;margin-top:2px">'+r.esp
      +' · P:'+r.fosforo+'% · Na:'+r.sodio+'% · Prot:'+r.proteina+'%</div>'
      +'</button>';
  }).join('');
}

function selecionarRacao(encoded){
  var r = JSON.parse(decodeURIComponent(encoded));
  // Preenche os sliders
  var rs = document.querySelectorAll('#p-scan-m input[type=range]');
  if(rs[0]) rs[0].value = Math.min(1.5, Math.max(0.1, r.fosforo));
  if(rs[1]) rs[1].value = Math.min(0.8, Math.max(0.05, r.sodio));
  if(rs[2]) rs[2].value = Math.min(80,  Math.max(10, r.proteina));
  if(rs[3]) rs[3].value = Math.min(40,  Math.max(5, r.gordura));
  calcM();
  // Atualiza nome no resultado
  var nomeEl = gi('sc-nome-racao');
  if(nomeEl) nomeEl.textContent = r.nome;
  // Navega para o resultado
  var searchWrap = gi('scan-search-wrap');
  if(searchWrap) searchWrap.style.display = 'none';
  gi('sc-ph').style.display = 'none';
  gi('sc-res').style.display = 'block';
  swP('p-scan-m'); sTab('scanner');
  toast(r.nome+' — análise gerada ✓');
}

function simScan(){
  selecionarRacao(encodeURIComponent(JSON.stringify(RACOES_DB[0])));
}
function calcM(){
  var rs = document.querySelectorAll('#p-scan-m input[type=range]');
  var f=+rs[0].value, s=+rs[1].value, p=+rs[2].value, g=+rs[3].value;
  gi('mf').textContent = f.toFixed(2)+'%';
  gi('ms').textContent = s.toFixed(2)+'%';
  gi('mp').textContent = p+'%';
  gi('mg').textContent = g+'%';
  var sc=100, pens=[];
  if(f>0.6){sc-=35;pens.push({t:'Fósforo crítico >0,6% MS',v:-35,c:'coral'});}
  else if(f>0.5){sc-=25;pens.push({t:'Fósforo elevado >0,5% — limiar IRIS I',v:-25,c:'amber'});}
  else{sc+=8;pens.push({t:'Fósforo controlado ✓',v:8,c:'green'});}
  if(s>0.35){sc-=10;pens.push({t:'Sódio elevado para nefropata',v:-10,c:'amber'});}
  else{sc+=5;pens.push({t:'Sódio adequado ✓',v:5,c:'green'});}
  if(p>35){sc-=10;pens.push({t:'Proteína >35% — catabolismo renal',v:-10,c:'amber'});}
  else if(p<28){sc-=8;pens.push({t:'Proteína <28% — risco sarcopenia',v:-8,c:'amber'});}
  sc = Math.max(0,Math.min(100,Math.round(sc)));
  var l,cor,ds;
  if(sc>=88){l='A';cor='var(--green)';ds='Excelente para este pet';}
  else if(sc>=75){l='B+';cor='#2d7a3a';ds='Adequada com ressalvas';}
  else if(sc>=62){l='B−';cor='#BA7517';ds='Aceitável — monitorar';}
  else if(sc>=48){l='C';cor='var(--amber)';ds='Inadequada — substituir';}
  else if(sc>=30){l='D';cor='var(--coral)';ds='Contraindicada';}
  else{l='F';cor='#a32d2d';ds='Alto risco — não usar';}
  gi('mn').textContent = l; gi('mn').style.color = cor;
  gi('md').textContent = ds;
  gi('msc').textContent = 'Score: '+sc+' / 100';
  gi('mb').style.width = sc+'%'; gi('mb').style.background = cor;
  var cc={coral:'var(--coral)',amber:'var(--amber)',green:'var(--green-l)'};
  gi('mpen').innerHTML = pens.map(function(pt){
    return '<div class="pen-it"><div class="pdot" style="background:'+cc[pt.c]+'"></div><div class="ptxt">'+pt.t+'</div><div class="ppts '+(pt.v<0?'pneg':'ppos')+'">'+(pt.v>0?'+':'')+pt.v+' pts</div></div>';
  }).join('');
}
function toggleScanOpts(){
  var opts = gi('scan-opts');
  var lbl = gi('scan-opts-lbl');
  if(!opts) return;
  var aberto = opts.style.display !== 'none';
  opts.style.display = aberto ? 'none' : 'block';
  if(lbl) lbl.textContent = aberto
    ? '▼ Ração não encontrada? Usar câmera ou foto'
    : '▲ Fechar câmera';
  if(aberto) stopCam();
}

function renderSugestoes(){
  var el = gi('sc-sugestoes'); if(!el) return;
  var cond = S.pet && S.pet.cond;
  // Filtra sugestões pela condição do pet
  var filtro = [];
  if(cond === 'irc1' || cond === 'irc2'){
    filtro = RACOES_DB.filter(function(r){ return r.fosforo <= 0.30; }).slice(0,6);
  } else if(cond === 'cardio'){
    filtro = RACOES_DB.filter(function(r){ return r.sodio <= 0.10; }).slice(0,6);
  } else if(cond === 'diabetes'){
    filtro = RACOES_DB.filter(function(r){ return r.proteina >= 30 && r.gordura <= 12; }).slice(0,6);
  } else {
    filtro = RACOES_DB.slice(0,6);
  }
  el.innerHTML = filtro.map(function(r){
    return '<button onclick="selecionarRacao(\''+encodeURIComponent(JSON.stringify(r))+'\')" '
      +'style="background:var(--bg);border:1.5px solid var(--bg3);border-radius:100px;'
      +'padding:5px 12px;font-size:11px;font-weight:600;color:var(--text);cursor:pointer;'
      +'font-family:var(--font-b);white-space:nowrap">'
      +r.nome.split(' ').slice(0,3).join(' ')+'</button>';
  }).join('');
}
calcM();

/* ──────────────────────────────────────────
   KIT WHATSAPP — DADOS REAIS
   ────────────────────────────────────────── */
function updateKitContent(){
  var p = S.pet||{name:'Meu Pet',breed:'SRD',peso:4,cond:'saudavel',emoji:'🐾'};
  var u = S.user||{name:'Tutor'};
  var cond = COND_LABELS[p.cond]||'Saudável';
  var p1 = gi('kit-p1'), p2 = gi('kit-p2'), p3 = gi('kit-p3');
 var cgArr = S.cuidadores || [];
  var cgStr = cgArr.length > 0
    ? cgArr.map(function(c){ return '• '+c.nome+' 📱 '+c.telefone; }).join('<br>')
    : '• Nenhum cuidador cadastrado';
  if(p1) p1.innerHTML = '• <strong>'+p.name+'</strong> '+p.emoji+' · '+(p.breed||'SRD')+' · '+(p.peso||'–')+' kg<br>• Condição: <strong>'+cond+'</strong>'+(p.castrado?' · Castrado(a)':'')+'<br><br><strong>Cuidadores:</strong><br>'+cgStr;
  if(p2) p2.innerHTML = '• Diagnóstico: '+cond+' (IRIS 2023)<br>• Alerta: vômitos + prostração → clínica imediatamente<br>• Responsável: '+u.name;
 var cnt = (S.exames && S.exames.length) ? S.exames.length : 0;
if(p3) p3.innerHTML = '• QR Code válido 72h<br>• <strong>'+cnt+'</strong> exame'+(cnt!==1?'s':'') +' registrados<br>• E-mail tutor: '+((S.user&&S.user.email)||'–');
}
function buildKitText(){
  var p = S.pet||{name:'Meu Pet'};
  var u = S.user||{name:'Tutor'};
  var cond = COND_LABELS[p.cond]||'Saudável';
  var now = new Date().toLocaleDateString('pt-BR');
  var txt = '🐾 *KIT DE SOBREVIVÊNCIA — '+p.name.toUpperCase()+'*\n_Gerado pelo GuardianPet em '+now+'_\n\n';
  txt += '━━━━━━━━━━━━━━━━━━\n⚡ *PRIORIDADE 1 — PRIMEIRAS 2h*\n';
  txt += '• Pet: *'+p.name+'* '+(p.emoji||'🐾')+'\n• Raça: '+(p.breed||'SRD')+'\n• Peso: '+(p.peso||'–')+' kg\n';
 var cgArr2 = S.cuidadores || [];
  if(cgArr2.length > 0){
    txt += '• Cuidadores:\n';
    cgArr2.forEach(function(c){ txt += '  - '+c.nome+': '+c.telefone+'\n'; });
  }
  txt += '\n';
  txt += '━━━━━━━━━━━━━━━━━━\n🏥 *PRIORIDADE 2 — CONDIÇÃO ATIVA*\n';
  txt += '• Diagnóstico: '+cond+'\n• Responsável: '+u.name+'\n\n';
  txt += '━━━━━━━━━━━━━━━━━━\n📋 *PRIORIDADE 3 — HISTÓRICO*\n';
 txt += '• '+((S.exames && S.exames.length) || 0)+' exames registrados\n';
  txt += '• E-mail: '+u.email+'\n\n';
  txt += '_GuardianPet — Ecossistema de saúde do seu pet_';
  return txt;
}
function updateWaPreview(){
  var preview = gi('wa-preview');
  if(preview) preview.textContent = buildKitText();
  updateKitContent();
}
function sendWhatsApp(){
  var numInput = gi('wa-num');
  var rawNum = numInput ? numInput.value.replace(/\D/g,'') : '';
  if(!rawNum || rawNum.length < 10){ toast('Digite o número com DDD'); if(numInput) numInput.focus(); return; }
  var num = rawNum.startsWith('55') ? rawNum : '55'+rawNum;
  window.open('https://wa.me/'+num+'?text='+encodeURIComponent(buildKitText()),'_blank');
  toast('Abrindo WhatsApp... ✓');
}
function copyKitText(){
  fallbackCopy(buildKitText());
}
function fallbackCopy(txt){
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(function(){ toast('Copiado ✓'); }).catch(function(){
      var ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';
      document.body.appendChild(ta);ta.select();
      try{document.execCommand('copy');toast('Copiado ✓');}catch(e){toast('Não foi possível copiar.');}
      document.body.removeChild(ta);
    });
  } else {
    var ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';
    document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');toast('Copiado ✓');}catch(e){toast('Não foi possível copiar.');}
    document.body.removeChild(ta);
  }
}
/* ──────────────────────────────────────────
   CUIDADORES — FIREBASE REAL
   ────────────────────────────────────────── */

function loadCuidadores(){
  if(!S.user || !S.user.uid) return;
  fbDb.collection('users').doc(S.user.uid).collection('cuidadores')
    .orderBy('prioridade', 'asc')
    .get()
    .then(function(snap){
      S.cuidadores = [];
      snap.forEach(function(doc){ S.cuidadores.push(Object.assign({id: doc.id}, doc.data())); });
      renderCuidadores();
    })
    .catch(function(){
      fbDb.collection('users').doc(S.user.uid).collection('cuidadores').get()
        .then(function(snap){
          S.cuidadores = [];
          snap.forEach(function(doc){ S.cuidadores.push(Object.assign({id: doc.id}, doc.data())); });
          renderCuidadores();
        }).catch(function(){});
    });
}

function renderCuidadores(){
  var lista = gi('cuidadores-lista');
  if(!lista) return;
  var arr = S.cuidadores || [];

  if(arr.length === 0){
    lista.innerHTML = '<div class="empty-state" style="padding:16px 0"><div class="empty-state-ic" style="font-size:28px">👤</div><div class="empty-state-d">Nenhum cuidador cadastrado ainda.</div></div>';
    return;
  }

  var RELS = {familiar:'Familiar', amigo:'Amigo(a)', vizinho:'Vizinho(a)', veterinario:'Veterinário(a)', outro:'Outro'};
  var PRIS = {'1':'Contato primário','2':'Secundário','3':'Terciário'};

 lista.innerHTML = arr.map(function(c){
    return '<div class="cg-c" style="position:relative">'
      + '<div class="cg-av">'+(c.icone||'🧑')+'</div>'
      + '<div style="flex:1"><div style="font-size:14px;font-weight:600;color:var(--text)">'+(c.nome||'')+'</div>'
      + '<div style="font-size:11px;color:var(--text2);opacity:.5">'+(PRIS[c.prioridade]||'')+(c.relacao?' · '+(RELS[c.relacao]||c.relacao):'')+'</div>'
      + (c.telefone?'<div style="font-size:11px;color:var(--accent);margin-top:2px">📱 '+c.telefone+'</div>':'')
      + '</div>'
      + '<button onclick="deleteCuidador(\''+c.id+'\')" style="background:none;border:none;cursor:pointer;font-size:16px;padding:4px;color:var(--coral)">🗑</button>'
      + '</div>';
  }).join('');
}

function saveCuidador(){
  if(!S.user || !S.user.uid){ toast('Faça login para salvar.'); return; }
  var nome = gi('cg-nome') ? gi('cg-nome').value.trim() : '';
  var tel  = gi('cg-tel')  ? gi('cg-tel').value.replace(/\D/g,'') : '';
  var rel  = gi('cg-rel')  ? gi('cg-rel').value  : 'familiar';
  var pri  = gi('cg-pri')  ? parseInt(gi('cg-pri').value) : 1;
  var icone = gi('cg-icone') ? gi('cg-icone').value : '👤';

  if(!nome){ toast('Digite o nome do cuidador.'); return; }
  if(!tel || tel.length < 10){ toast('Digite um telefone válido com DDD.'); return; }

var data = { nome: nome, telefone: tel, relacao: rel, prioridade: pri, icone: icone, criadoEm: new Date().toISOString() };

  var btn = gi('cg-save-btn');
  if(btn){ btn.disabled = true; btn.textContent = 'Salvando...'; }

  fbDb.collection('users').doc(S.user.uid).collection('cuidadores').add(data)
    .then(function(docRef){
      data.id = docRef.id;
      if(!S.cuidadores) S.cuidadores = [];
      S.cuidadores.push(data);
      S.cuidadores.sort(function(a,b){ return a.prioridade - b.prioridade; });
      renderCuidadores();
      closeSheet('sh-cuidador');
      gi('cg-nome').value = ''; gi('cg-tel').value = '';
      if(btn){ btn.disabled = false; btn.textContent = 'Salvar cuidador ✓'; }
      toast('Cuidador salvo ✓');
    })
    .catch(function(err){
      console.error(err);
      if(btn){ btn.disabled = false; btn.textContent = 'Salvar cuidador ✓'; }
      toast('Erro ao salvar. Verifique a conexão.');
    });
}

function deleteCuidador(id){
  if(!S.user || !S.user.uid || !id) return;
  if(!confirm('Remover este cuidador?')) return;
  fbDb.collection('users').doc(S.user.uid).collection('cuidadores').doc(id).delete()
    .then(function(){
      S.cuidadores = S.cuidadores.filter(function(c){ return c.id !== id; });
      renderCuidadores();
      toast('Cuidador removido ✓');
    })
    .catch(function(){ toast('Erro ao remover.'); });
}
/* ── PLANOS & PIX ── */
var PIX_KEY = '51509194894', PIX_NAME = 'GuardianPet', PIX_CITY = 'SAO PAULO';
window._pixPlanoSel = 'anual';
function selPlano(p){
  window._pixPlanoSel = p;
  var sA=gi('sel-anual'), sM=gi('sel-mensal'), cA=gi('plan-anual'), cM=gi('plan-mensal');
  if(p==='anual'){
    if(sA){sA.style.background='var(--accent)';sA.style.borderColor='var(--accent)';sA.textContent='✓';}
    if(sM){sM.style.background='transparent';sM.style.borderColor='var(--bg3)';sM.textContent='';}
    if(cA) cA.classList.add('sel'); if(cM) cM.classList.remove('sel');
  } else {
    if(sM){sM.style.background='var(--accent)';sM.style.borderColor='var(--accent)';sM.textContent='✓';}
    if(sA){sA.style.background='transparent';sA.style.borderColor='var(--bg3)';sA.textContent='';}
    if(cM) cM.classList.add('sel'); if(cA) cA.classList.remove('sel');
  }
}
function irParaPix(){
  var plano = window._pixPlanoSel||'anual';
  var valor = plano==='anual' ? 39.90 : 7.90;
  gi('pix-plano-nome').textContent = plano==='anual'?'Anual':'Mensal';
  gi('pix-valor').textContent = 'R$'+valor.toFixed(2).replace('.',',');
  gi('plan-step-1').style.display = 'none';
  gi('plan-step-2').style.display = 'block';
  setTimeout(function(){ gerarPixQR(valor, plano); }, 300);
}
function voltarPlanos(){
  gi('plan-step-1').style.display = 'block';
  gi('plan-step-2').style.display = 'none';
}
function crc16(str){
  var crc=0xFFFF;
  for(var i=0;i<str.length;i++){
    crc^=(str.charCodeAt(i)<<8);
    for(var j=0;j<8;j++){
      if(crc&0x8000){crc=(crc<<1)^0x1021;}else{crc<<=1;}
      crc&=0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4,'0');
}
function montarPayloadPix(chave,nome,cidade,valor,txid){
  function tlv(id,val){return id+val.length.toString().padStart(2,'0')+val;}
  var mai=tlv('00','BR.GOV.BCB.PIX')+tlv('01',chave);
  var maiBlock=tlv('26',mai);
  var valorStr=valor.toFixed(2);
  var nomePayload=nome.substring(0,25).toUpperCase();
  var cidadePayload=cidade.substring(0,15).toUpperCase();
  var txidVal=(txid||'guardianpet').substring(0,25);
  var addBlock=tlv('62',tlv('05',txidVal));
  var payload=tlv('00','01')+tlv('01','12')+maiBlock+tlv('52','0000')+tlv('53','986')+tlv('54',valorStr)+tlv('58','BR')+tlv('59',nomePayload)+tlv('60',cidadePayload)+addBlock+'6304';
  return payload+crc16(payload);
}
var _pixQrObj = null;
function gerarPixQR(valor, plano){
  var wrap = gi('pix-qr-wrap'), codeEl = gi('pix-code-txt');
  if(!wrap) return;
  var txid = 'gp'+Date.now().toString().slice(-8);
  var payload = montarPayloadPix(PIX_KEY, PIX_NAME, PIX_CITY, valor, txid);
  if(codeEl) codeEl.textContent = payload;
  if(typeof QRCode === 'undefined'){ wrap.innerHTML = '<div style="text-align:center;padding:10px;font-size:12px;color:var(--text2)">Copie o código abaixo para pagar via Pix.</div>'; return; }
  wrap.innerHTML = '';
  try{
    _pixQrObj = new QRCode(wrap, {text:payload,width:180,height:180,colorDark:'#000000',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
  }catch(e){ wrap.innerHTML = '<div style="text-align:center;padding:10px;font-size:12px;color:var(--text2)">Use o código Pix abaixo para pagar.</div>'; }
}
function copyPixCode(){
  var txt = gi('pix-code-txt') ? gi('pix-code-txt').textContent : '';
  if(!txt || txt==='Gerando...'){ toast('Aguarde o código ser gerado.'); return; }
  fallbackCopy(txt);
  toast('Código Pix copiado! ✓');
}
function pagarStripe(){
  var plano = window._pixPlanoSel||'anual';
  // Substitua pelos seus Price IDs reais do Stripe Dashboard
  var STRIPE_LINKS = {
    anual:  'https://buy.stripe.com/test_8x29AM5Mp9Ss6Ai5MN8Vi00',
    mensal: 'https://buy.stripe.com/test_9B6cMYa2FggQ6Ai8YZ8Vi01'
  };
  var url = STRIPE_LINKS[plano];
  if(!url || url.indexOf('SEU_LINK')>-1){
    toast('Pagamento por cartão em breve! Use o Pix por enquanto.');
    return;
  }
  // Adiciona email do usuário como parâmetro para preencher automaticamente
  var email = S.user && S.user.email ? '?prefilled_email='+encodeURIComponent(S.user.email) : '';
  window.open(url+email, '_blank');
  toast('Abrindo checkout seguro...');
}
/* ── AVATAR ── */
function setAvatar(emoji){
  if(!S.user || !S.user.uid){ toast('Faça login primeiro.'); return; }
  fbDb.collection('users').doc(S.user.uid).update({ avatar: emoji })
    .then(function(){
      S.user.avatar = emoji;
      var av = gi('c-av'); if(av) av.childNodes[0].textContent = emoji;
      closeSheet('sh-avatar');
      toast('Avatar atualizado ✓');
    })
    .catch(function(){ toast('Erro ao salvar avatar.'); });
}
/* ── ADS (só free) ── */
// URLs de apps reais na Play Store (substitua pelos seus app IDs)
var GP_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.guardianpet.app';

var ADS_LIST = [
  {
    ic:'🐾', titulo:'GuardianPet no Android',
    desc:'Baixe o app oficial na Google Play. Notificações nativas, offline e muito mais!',
    cta:'Baixar grátis', ctaUrl: GP_PLAY_URL, badgePlay: true
  },
  {
    ic:'💊', titulo:'Petlove — Petshop Online',
    desc:'Rações veterinárias com entrega expressa. 10% off na primeira compra.',
    cta:'Ver ofertas', ctaUrl:'https://www.petlove.com.br', badgePlay: false
  },
  {
    ic:'🏥', titulo:'Vet Smart — Consulta Online',
    desc:'Fale agora com um veterinário 24h. A partir de R$29,90.',
    cta:'Consultar agora', ctaUrl:'https://www.vetsmart.com.br', badgePlay: false
  },
  {
    ic:'🛒', titulo:'Cobasi — Tudo para seu Pet',
    desc:'Mais de 10.000 produtos. Frete grátis acima de R$99.',
    cta:'Comprar agora', ctaUrl:'https://www.cobasi.com.br', badgePlay: false
  }
];

function showAd(){
  if(S.user && S.user.plano !== 'free') return;
  var ov = gi('ad-ov'); if(!ov) return;

  // Sorteia anúncio
  var ad = ADS_LIST[Math.floor(Math.random() * ADS_LIST.length)];

  // Atualiza conteúdo do overlay
  var icEl    = ov.querySelector('.ad-ic');
  var titEl   = ov.querySelector('.ad-title');
  var descEl  = ov.querySelector('.ad-desc');
  var ctaEl   = ov.querySelector('.ad-cta');
  var badgeEl = ov.querySelector('.ad-play-badge');

  if(icEl)    icEl.textContent    = ad.ic;
  if(titEl)   titEl.textContent   = ad.titulo;
  if(descEl)  descEl.textContent  = ad.desc;
  if(ctaEl){  ctaEl.textContent   = ad.cta;
              ctaEl.onclick = function(){ closeAd(); window.open(ad.ctaUrl,'_blank'); }; }
  if(badgeEl) badgeEl.style.display = ad.badgePlay ? 'block' : 'none';

  ov.style.display = 'flex';

  var btn = gi('ad-skip-btn'), ce = gi('ad-count');
  if(btn){ btn.disabled=true; btn.textContent='Pular em 5s'; }
  var n=5;
  if(window._adCd) clearInterval(window._adCd);
  window._adCd = setInterval(function(){
    n--;
    var el=gi('ad-count'); if(el) el.textContent=n;
    if(n<=0){
      clearInterval(window._adCd);
      var skipBtn=gi('ad-skip-btn');
      if(skipBtn){ skipBtn.disabled=false; skipBtn.textContent='Pular'; }
    }
  }, 1000);
}
function closeAd(){ var ov=gi('ad-ov'); if(ov) ov.style.display='none'; }
/* ── GRÁFICO DE EXAMES ── */
var _chartMetric = 'creatinina';
var CHART_REFS = {
  creatinina: {label:'Creatinina', unit:'mg/dL', max:3, danger:1.6, warn:1.4, color:'#2d9960'},
  ureia:       {label:'Ureia',       unit:'mg/dL', max:120,danger:80,  warn:60,  color:'#c9712a'},
  fosforo:     {label:'Fósforo',     unit:'mg/dL', max:10, danger:6,   warn:5,   color:'#1a6b72'},
  hematocrito: {label:'Hematócrito',unit:'%',    max:55, danger:25,  warn:30,  color:'#c94a3a'}
};

function drawChart(metric, tabEl) {
  _chartMetric = metric;
  if(tabEl){
    document.querySelectorAll('.ctab').forEach(function(t){t.classList.remove('act')});
    tabEl.classList.add('act');
  }
  var canvas = gi('exam-chart');
  var emptyMsg = gi('chart-empty-msg');
  var legend = gi('chart-legend');
  if(!canvas) return;

  // Filtra exames que têm o campo selecionado
  var data = (S.exames||[])
    .filter(function(e){ return e[metric] != null; })
    .sort(function(a,b){ return new Date(a.data) - new Date(b.data); })
    .slice(-8); // últimos 8 pontos

  if(data.length < 2){
    canvas.style.display = 'none';
    emptyMsg.style.display = 'flex';
    if(legend) legend.innerHTML = '';
    return;
  }
  canvas.style.display = 'block';
  emptyMsg.style.display = 'none';

 var ref = CHART_REFS[metric];
  var dpr = window.devicePixelRatio || 1;
  /* Pega largura real — fallback para quando o painel ainda está oculto */
  var W = canvas.parentElement.offsetWidth || 300;
  if(W < 10){
    /* Painel invisível: agenda retry após transição */
    setTimeout(function(){ drawChart(metric, tabEl); }, 350);
    return;
  }
  var H = 160;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';

  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0,0,W,H);

  var pad = {t:16,r:16,b:28,l:42};
  var cW = W - pad.l - pad.r;
  var cH = H - pad.t - pad.b;
  var vals = data.map(function(d){return +d[metric]||0;}); vals.push(ref.max);
var maxVal = Math.max.apply(null, vals);

  // Linhas de referência
  [ref.warn, ref.danger].forEach(function(v, i){
    var y = pad.t + cH - (v/maxVal)*cH;
    ctx.beginPath();
    ctx.strokeStyle = i===0 ? 'rgba(201,113,42,.35)' : 'rgba(201,74,58,.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4,4]);
    ctx.moveTo(pad.l, y); ctx.lineTo(pad.l+cW, y);
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = i===0 ? 'rgba(201,113,42,.7)' : 'rgba(201,74,58,.7)';
    ctx.font = '9px sans-serif';
    ctx.fillText(v, 2, y-2);
  });

  // Área preenchida
  var pts = data.map(function(d,i){
    return {
      x: pad.l + (i/(data.length-1))*cW,
      y: pad.t + cH - ((+d[metric]||0)/maxVal)*cH
    };
  });
  var grad = ctx.createLinearGradient(0,pad.t,0,pad.t+cH);
  grad.addColorStop(0, ref.color+'44');
  grad.addColorStop(1, ref.color+'00');
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pad.t+cH);
  pts.forEach(function(p){ ctx.lineTo(p.x, p.y); });
  ctx.lineTo(pts[pts.length-1].x, pad.t+cH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Linha principal
  ctx.beginPath();
  ctx.strokeStyle = ref.color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  pts.forEach(function(p,i){ i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y); });
  ctx.stroke();

  // Pontos + labels eixo X
  pts.forEach(function(p,i){
    var val = +data[i][metric];
    var isHigh = val >= ref.danger;
    var isWarn = !isHigh && val >= ref.warn;
    var dotColor = isHigh ? '#c94a3a' : isWarn ? '#c9712a' : ref.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
    ctx.fillStyle = dotColor;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Valor acima do ponto
    ctx.fillStyle = dotColor;
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(val, p.x, p.y-8);
    // Data eixo X
    if(data[i].data){
      var parts = data[i].data.split('-');
      var d = new Date(+parts[0],+parts[1]-1,+parts[2]);
      var ds = d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
      ctx.fillStyle = 'rgba(100,120,110,.7)';
      ctx.font = '9px sans-serif';
      ctx.fillText(ds, p.x, H-6);
    }
  });

  // Legenda
  if(legend){
    legend.innerHTML = '<div class="chart-legend-item"><div class="chart-legend-dot" style="background:'+ref.color+'"></div>'+ref.label+' ('+ref.unit+')</div>'
      +'<div class="chart-legend-item"><div class="chart-legend-dot" style="background:#c9712a"></div>Atenção ≥'+ref.warn+'</div>'
      +'<div class="chart-legend-item"><div class="chart-legend-dot" style="background:#c94a3a"></div>Alto ≥'+ref.danger+'</div>';
  }
}

// Chama o gráfico ao abrir o prontuário
// Localize: function swP(id){ ... }
// Adicione dentro do if, após nw.scrollTop = 0:
// if(id === 'p-pron') setTimeout(function(){ drawChart(_chartMetric); }, 300);
var _linkPublicoAtual = null;

function gerarLinkPublico(){
  if(!S.user || !S.user.uid){ toast('Faça login primeiro.'); return; }
  var btn = document.querySelector('button[onclick="gerarLinkPublico()"]');
  if(btn){ btn.disabled=true; btn.textContent='Gerando...'; }

  var token = Math.random().toString(36).substring(2,10)
            + Date.now().toString(36);
  var expira = new Date(Date.now() + 72*3600000).toISOString();
  var p = S.pet||{};
  var u = S.user||{};

  var payload = {
    token: token, uid: u.uid, expira: expira,
    criadoEm: new Date().toISOString(),
    expiresAt: firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 72*3600000)),
    pet: { name:p.name, emoji:p.emoji, breed:p.breed, peso:p.peso, cond:p.cond, castrado:p.castrado },
    tutor: { name:u.name, email:u.email },
    exames: (S.exames||[]).slice(0,10),
    vacinas: (S.vacinas||[]).slice(0,10)
  };

  fbDb.collection('prontuarios_publicos').doc(token).set(payload)
    .then(function(){
     // Link aponta para viewer.html?t=TOKEN — crie esse arquivo no hosting
      _linkPublicoAtual = 'https://viewer-guardianpet-ofc.netlify.app/?t=' + token;
      var wrap = gi('link-publico-wrap');
      var urlEl = gi('link-publico-url');
      if(wrap) wrap.style.display = 'block';
      if(urlEl) urlEl.textContent = _linkPublicoAtual;
      if(btn){ btn.disabled=false; btn.textContent='🔗 Gerar novo link'; }
      toast('Link gerado ✓ — válido por 72h');
    })
    .catch(function(){
      if(btn){ btn.disabled=false; btn.textContent='🔗 Gerar link para veterinário'; }
      toast('Erro ao gerar link. Verifique a conexão.');
    });
}

function copiarLinkPublico(){
  if(!_linkPublicoAtual){ toast('Gere o link primeiro.'); return; }
  fallbackCopy(_linkPublicoAtual);
}

function compartilharLink(){
  if(!_linkPublicoAtual){ toast('Gere o link primeiro.'); return; }
  var petName = (S.pet && S.pet.name) || 'meu pet';
  if(navigator.share){
    navigator.share({
      title: 'Prontuário de '+petName+' — GuardianPet',
      text: 'Acesse o prontuário digital de '+petName+'. Válido por 72h.',
      url: _linkPublicoAtual
    }).catch(function(){});
  } else {
    // Fallback: abre WhatsApp
    var msg = 'Prontuário de '+petName+': '+_linkPublicoAtual;
    window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
  }
}
/* ── MEDICAÇÕES — salva no doc do usuário (evita permission-denied) ── */
function loadMeds(){
  if(!S.user||!S.user.uid){ renderMeds(); return; }
  fbDb.collection('users').doc(S.user.uid).get()
    .then(function(snap){
      S.meds = (snap.exists && snap.data().medicacoes) ? snap.data().medicacoes : [];
      renderMeds();
    }).catch(function(){
      S.meds = [];
      renderMeds();
    });
}

function renderMeds(){
  var lista=gi('med-lista'); if(!lista) return;
  var arr=S.meds||[];
  var cnt=gi('h-med-count');
  if(cnt) cnt.textContent=arr.length>0 ? arr.length+' ativa'+(arr.length>1?'s':'') : 'Nenhuma ativa';
  if(arr.length===0){
    lista.innerHTML='<div class="empty-state" style="padding:14px 0"><div class="empty-state-ic" style="font-size:28px">💊</div><div class="empty-state-d">Nenhum medicamento cadastrado ainda.</div></div>';
    return;
  }
  var INTS={'8':'A cada 8h','12':'A cada 12h','24':'1x ao dia','48':'A cada 2 dias'};
  lista.innerHTML=arr.map(function(m,idx){
    var proxima='';
    if(m.proximaDose){
      var d=new Date(m.proximaDose);
      proxima=d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    }
    return '<div style="background:var(--surface);border-radius:var(--r-md);padding:12px;margin-bottom:8px;box-shadow:var(--sh);display:flex;align-items:center;gap:10px">'
      +'<div style="width:40px;height:40px;border-radius:10px;background:rgba(88,166,255,.1);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">💊</div>'
      +'<div style="flex:1"><div style="font-size:13px;font-weight:600;color:var(--text)">'+m.nome+' <span style="font-size:11px;color:var(--text2);font-weight:400">'+(m.dose||'')+'</span></div>'
      +'<div style="font-size:11px;color:var(--text2);opacity:.6">'+(INTS[String(m.intervalo)]||'')+(proxima?' · Próxima: '+proxima:'')+'</div></div>'
      +'<button onclick="deleteMed('+idx+')" style="background:none;border:none;cursor:pointer;font-size:16px;color:var(--coral);padding:4px">🗑</button></div>';
  }).join('');
}

function saveMed(){
  if(!S.user||!S.user.uid){ toast('Faça login primeiro.'); return; }
  var nome=gi('med-nome')?gi('med-nome').value.trim():'';
  var dose=gi('med-dose')?gi('med-dose').value.trim():'';
  var intervalo=gi('med-int')?parseInt(gi('med-int').value):12;
  var hora=gi('med-hora')?gi('med-hora').value:'08:00';
  if(!nome){ toast('Digite o nome do medicamento.'); return; }
  var agora=new Date();
  var parts=hora.split(':');
  var proxima=new Date(agora.getFullYear(),agora.getMonth(),agora.getDate(),+parts[0],+parts[1]);
  if(proxima<=agora) proxima=new Date(proxima.getTime()+intervalo*3600000);
  var med={
    nome:nome, dose:dose, intervalo:intervalo, hora:hora,
    proximaDose:proxima.toISOString(), ativo:true,
    criadoEm:new Date().toISOString()
  };
  var btn=gi('med-save-btn');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  if(!S.meds) S.meds=[];
  var novaLista = S.meds.concat([med]);
  fbDb.collection('users').doc(S.user.uid).update({ medicacoes: novaLista })
    .then(function(){
  if(Notification && Notification.permission === 'default'){
    Notification.requestPermission().then(function(p){
      if(p==='granted') scheduleMedNotif(med);
    });
  } else {
    scheduleMedNotif(med);
  }
  S.meds = novaLista;
  renderMeds();
  var nEl=gi('med-nome'); if(nEl) nEl.value='';
  var dEl=gi('med-dose'); if(dEl) dEl.value='';
  if(btn){btn.disabled=false;btn.textContent='Salvar medicamento ✓';}
  toast('Medicamento salvo ✓');
})
}

function deleteMed(idx){
  if(!S.user||!S.user.uid) return;
  if(!confirm('Remover este medicamento?')) return;
  var novaLista = (S.meds||[]).filter(function(_,i){ return i!==idx; });
  fbDb.collection('users').doc(S.user.uid).update({ medicacoes: novaLista })
    .then(function(){
      S.meds = novaLista;
      renderMeds();
      toast('Removido ✓');
    }).catch(function(){ toast('Erro ao remover.'); });
}

// ── NOTIFICAÇÕES AVANÇADAS — 1h e 10min antes ──
function agendarNotifItem(titulo, corpo, tag, dataHoraISO) {
  if (!Notification || Notification.permission !== 'granted') return;
  var alvo = new Date(dataHoraISO).getTime();
  var agora = Date.now();

  // 1 hora antes
  var delay1h = alvo - 3600000 - agora;
  if (delay1h > 0 && delay1h < 7 * 24 * 3600000) {
    setTimeout(function () {
      new Notification('⏰ ' + titulo + ' — em 1 hora', {
        body: corpo + '\nFalta 1 hora!',
        icon: 'https://guardianpetapp.web.app/icon.png',
        tag: tag + '-1h',
        requireInteraction: true
      });
    }, delay1h);
  }

  // 10 minutos antes
  var delay10m = alvo - 600000 - agora;
  if (delay10m > 0 && delay10m < 7 * 24 * 3600000) {
    setTimeout(function () {
      new Notification('🔔 ' + titulo + ' — em 10 minutos!', {
        body: corpo + '\nFaltam só 10 minutos!',
        icon: 'https://guardianpetapp.web.app/icon.png',
        tag: tag + '-10m',
        requireInteraction: true
      });
    }, delay10m);
  }
}

// ── Agenda notifs para todos os itens ──
function agendarTodasNotificacoes() {
  if (!Notification || Notification.permission !== 'granted') return;

  // MEDICAÇÕES
  (S.meds || []).forEach(function (m, i) {
    if (!m.proximaDose) return;
    agendarNotifItem(
      '💊 ' + m.nome + ' ' + (m.dose || ''),
      'Hora do remédio de ' + ((S.pet && S.pet.name) || 'seu pet'),
      'med-' + i,
      m.proximaDose
    );
  });

  // VACINAS
  (S.vacinas || []).forEach(function (v) {
    if (!v.proxima) return;
    // proxima é só data (YYYY-MM-DD), assume horário 08:00
    var dataHora = v.proxima + 'T08:00:00';
    agendarNotifItem(
      '💉 Vacina: ' + v.nome,
      'Vacina de ' + ((S.pet && S.pet.name) || 'seu pet') + ' hoje!',
      'vac-' + v.id,
      dataHora
    );
  });

  // EVENTOS / CONSULTAS
  (S.eventos || []).forEach(function (ev) {
    if (!ev.data) return;
    var hora = ev.hora || '08:00';
    var dataHora = ev.data + 'T' + hora + ':00';
    agendarNotifItem(
      (ev.descricao || ev.tipo || 'Evento'),
      'Compromisso de ' + ((S.pet && S.pet.name) || 'seu pet'),
      'ev-' + ev.id,
      dataHora
    );
  });
}
function scheduleMedNotif(med) {
  if (!Notification || Notification.permission !== 'granted') return;
  var pet = (S.pet && S.pet.name) || 'seu pet';

  function agendarProxima(dataISO) {
    var delay = new Date(dataISO) - Date.now();
    if (delay <= 0) delay += med.intervalo * 3600000;
    if (delay <= 0 || delay > 72 * 3600000) return;

    // Notif 1h antes
    if (delay > 3600000) {
      setTimeout(function () {
        new Notification('⏰ Remédio em 1 hora — ' + med.nome, {
          body: 'Prepare a dose de ' + (med.dose || '') + ' para ' + pet,
          icon: 'https://guardianpetapp.web.app/icon.png',
          tag: 'med-1h-' + med.criadoEm
        });
      }, delay - 3600000);
    }

    // Notif 10min antes
    if (delay > 600000) {
      setTimeout(function () {
        new Notification('🔔 Remédio em 10 min — ' + med.nome, {
          body: 'Quase na hora da dose de ' + pet + '!',
          icon: 'https://guardianpetapp.web.app/icon.png',
          tag: 'med-10m-' + med.criadoEm
        });
      }, delay - 600000);
    }

    // Notif na hora
    setTimeout(function () {
      new Notification('💊 Hora do remédio — ' + med.nome, {
        body: 'Dose de ' + (med.dose || '') + ' para ' + pet + '. Não esqueça!',
        icon: 'https://guardianpetapp.web.app/icon.png',
        tag: 'med-' + med.criadoEm,
        requireInteraction: true
      });
      agendarProxima(new Date(Date.now() + med.intervalo * 3600000).toISOString());
    }, delay);
  }

  agendarProxima(med.proximaDose);
}
/* ── BOTÃO DE EMERGÊNCIA ── */
function openEmer(){
  var ov = gi('emer-ov'); if(!ov) return;
  ov.classList.add('open');
  // Atualiza label do pet
  var lbl = gi('emer-pet-lbl');
  if(lbl && S.pet) lbl.textContent = 'Ações rápidas para '+(S.pet.name||'seu pet');
  // Renderiza cuidadores
  var cgEl = gi('emer-cuidadores');
  if(cgEl){
    var arr = S.cuidadores||[];
    if(arr.length===0){
      cgEl.innerHTML = '<div style="background:#2a0a0a;border:1px solid rgba(201,74,58,.2);border-radius:12px;padding:12px 14px;margin-bottom:10px;font-size:12px;color:rgba(255,144,144,.5)">'
        +'Nenhum cuidador cadastrado. <span style="color:#ff9090;text-decoration:underline;cursor:pointer" onclick="closeEmer();swP(\'p-cont\');sTab(\'cont\')">Adicionar agora</span></div>';
    } else {
      cgEl.innerHTML = arr.slice(0,3).map(function(c){
        return '<button class="emer-action" onclick="ligarCuidador(\''+c.telefone+'\')">'
          +'<div class="emer-action-ic" style="background:rgba(201,74,58,.2)">'+(c.icone||'🧑')+'</div>'
          +'<div><div class="emer-action-t">'+c.nome+'</div><div class="emer-action-s">'+c.telefone+' — Toque para ligar</div></div></button>';
      }).join('');
    }
  }
}

function closeEmer(){
  var ov = gi('emer-ov'); if(ov) ov.classList.remove('open');
}

function ligarCuidador(tel){
  if(!tel) return;
  window.location.href = 'tel:' + tel.replace(/\D/g,'');
}

function buscarClinicas(){
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(pos){
      var lat=pos.coords.latitude, lng=pos.coords.longitude;
      window.open('https://www.google.com/maps/search/clinica+veterinaria+24h/@'+lat+','+lng+',14z','_blank');
    }, function(){
      window.open('https://www.google.com/maps/search/clinica+veterinaria+24+horas','_blank');
    });
  } else {
    window.open('https://www.google.com/maps/search/clinica+veterinaria+24+horas','_blank');
  }
}

function ligarSAMU(){
  window.location.href = 'tel:156';
}

/* Mostra/oculta FAB conforme o painel ativo.
   Localize a função swP(id) e adicione ao final dela: */
// var fab=gi('fab-emer'), fabLbl=gi('fab-emer-lbl');
// if(fab){ fab.style.display = id==='p-home'?'flex':'none'; }
// if(fabLbl){ fabLbl.style.display = id==='p-home'?'block':'none'; }
/* ── ÍCONE DO PET ── */
var PET_ICONS = {
  'Gato':    ['🐱','😺','😸','😻','🐈','🐈‍⬛','🙀','😹'],
  'Cão':     ['🐶','🐕','🦴','🐕‍🦺','🐩','🐾','😀','🐻'],
  'Coelho':  ['🐰','🐇','🐾','🌿','🥕','🐾','🌸','🤍'],
  'Pássaro': ['🐦','🦜','🦚','🦩','🐧','🦅','🦋','🌈'],
  'Outro':   ['🐾','🐠','🐢','🦎','🐍','🦔','🐹','🐭']
};

function openPetIconSheet(){
  var grid = gi('pet-icon-grid');
  if(!grid) return;

  var emo = (S.pet && S.pet.emoji) || '🐾';

  // Espécie salva no banco tem prioridade absoluta
  var especie = (S.pet && S.pet.especie) ? S.pet.especie : 'Outro';

  var icons = PET_ICONS[especie] || PET_ICONS['Outro'];

  grid.innerHTML = icons.map(function(ic){
    var sel = ic === emo;
    return '<button onclick="setPetIcon(\''+ic+'\')" style="'
      +'font-size:32px;padding:14px;border-radius:16px;'
      +'border:2px solid '+(sel?'var(--accent)':'var(--bg3)')+';'
      +'background:'+(sel?'var(--accent-xl)':'var(--surface)')+';'
      +'cursor:pointer;transition:all .2s;width:100%">'
      +ic+'</button>';
  }).join('');

  openSheet('sh-pet-icon');
}

function setPetIcon(emoji){
  if(!S.user || !S.user.uid){ toast('Faça login primeiro.'); return; }
  var novoPet = Object.assign({}, S.pet, { emoji: emoji });
  fbDb.collection('users').doc(S.user.uid).update({ pet: novoPet })
    .then(function(){
      S.pet = novoPet;
      // Atualiza todos os elementos visuais
      var els = ['h-pem','pr-em','c-pem'];
      els.forEach(function(id){ var e=gi(id); if(e) e.textContent=emoji; });
      closeSheet('sh-pet-icon');
      toast('Ícone atualizado ✓');
    })
    .catch(function(){ toast('Erro ao salvar. Tente novamente.'); });
}
