/* painel.js v2 */
let perfilAtual = null;
let servicosAtuais = [];

async function initPainel() {
  const session = requireAuth('../../index.html');
  aplicarSessaoNaUI();
  try {
    const db = await fetchDB();
    perfilAtual = db.profissionais.find(p => p.usuarioId === session.id) || db.profissionais[0];
    if (perfilAtual) {
      renderOverview(perfilAtual);
      renderEditForm(perfilAtual);
      renderServicosTab(perfilAtual.servicos);
      renderAvaliacoes(perfilAtual);
    }
  } catch(e) { console.error(e); }
  abrirTab('overview');
}

function abrirTab(tab) {
  document.querySelectorAll('.painel-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.pnav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + tab)?.classList.add('active');
  document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
}

function renderOverview(p) {
  // Profile hero
  const av = document.getElementById('phAvatar'); if(av) av.src = p.foto;
  const nm = document.getElementById('phName'); if(nm) nm.textContent = p.nome;
  const rl = document.getElementById('phRole'); if(rl) rl.textContent = p.titulo;
  const lc = document.getElementById('phLoc'); if(lc) lc.textContent = `📍 ${p.cidade}, ${p.estado}`;
  const dt = document.getElementById('phDot'); if(dt) dt.className = 'ph-dot' + (p.status === 'ocupado' ? ' ocupado' : '');
  const pl = document.getElementById('phPerfilLink'); if(pl) pl.href = `perfil.html?id=${p.id}`;
  const st = document.getElementById('statusLabel'); if(st) st.textContent = p.status === 'disponivel' ? 'Disponível' : 'Ocupado';
  const btn = document.getElementById('btnStatus'); if(btn) btn.className = 'status-toggle' + (p.status === 'ocupado' ? ' ocupado' : '');

  // KPIs
  const kn = document.getElementById('kpiNota'); if(kn) kn.textContent = p.estrelas.toFixed(1);
  const ka = document.getElementById('kpiAv'); if(ka) ka.textContent = p.totalAvaliacoes;
  const ks = document.getElementById('kpiSv'); if(ks) ks.textContent = p.servicos.length;
  const kt = document.getElementById('kpiTp'); if(kt) kt.textContent = p.tempoPlatforma;
  const kf = document.getElementById('kpiFill'); if(kf) setTimeout(() => kf.style.width = ((p.estrelas/5)*100) + '%', 300);

  // Cards
  const desc = document.getElementById('ovDesc'); if(desc) desc.textContent = p.descricao;
  const tags = document.getElementById('ovTags');
  if(tags) tags.innerHTML = p.servicos.map(s=>`<span class="ov-tag">${s}</span>`).join('');
  const info = document.getElementById('ovInfo');
  if(info) info.innerHTML = `
    <div class="ov-info-row"><span class="k">Horário</span><span class="v">${p.horario}</span></div>
    <div class="ov-info-row"><span class="k">Valor</span><span class="v accent">${formatarPreco(p.precificacao)}</span></div>
    <div class="ov-info-row"><span class="k">Status</span><span class="v"><span class="badge badge--${p.status}">${p.status}</span></span></div>
    <div class="ov-info-row"><span class="k">Gênero</span><span class="v">${p.genero.charAt(0).toUpperCase()+p.genero.slice(1)}</span></div>
  `;
}

function renderEditForm(p) {
  const s = (id, v) => { const el=document.getElementById(id); if(el) el.value = v||''; };
  s('editNome', p.nome); s('editTitulo', p.titulo);
  s('editCidade', p.cidade); s('editDesc', p.descricao);
  s('editHorario', p.horario); s('editPreco', p.precificacao?.valor||'');
  const av = document.getElementById('editAvatar'); if(av) av.src = p.foto;
}

function renderServicosTab(servicos) {
  servicosAtuais = [...servicos];
  const c = document.getElementById('servicosEditor');
  if(!c) return;
  c.innerHTML = servicosAtuais.map((s,i)=>`
    <span class="svc-tag">${s}<button onclick="removerServico(${i})">×</button></span>
  `).join('');
}

function removerServico(i) { servicosAtuais.splice(i,1); renderServicosTab(servicosAtuais); }
function adicionarServico() {
  const inp = document.getElementById('novoServico');
  const v = inp?.value.trim(); if(!v) return;
  servicosAtuais.push(v); renderServicosTab(servicosAtuais); inp.value='';
}

function renderAvaliacoes(p) {
  const sum = document.getElementById('avSummary');
  if(sum) sum.innerHTML = `
    <div><div class="av-big">${p.estrelas.toFixed(1)}</div></div>
    <div>
      <div class="av-stars">${'★'.repeat(Math.round(p.estrelas))}${'☆'.repeat(5-Math.round(p.estrelas))}</div>
      <div class="av-total">${p.totalAvaliacoes} avaliações</div>
    </div>
  `;
  const list = document.getElementById('avList');
  if(!list) return;
  if(!p.avaliacoes?.length) {
    list.innerHTML = '<p style="color:var(--text-3);font-size:.9rem;padding:1rem">Ainda sem avaliações escritas.</p>';
    return;
  }
  list.innerHTML = p.avaliacoes.map(av=>`
    <div class="av-item">
      <div class="av-header">
        <div class="av-reviewer">
          <img src="${av.clienteFoto}" onerror="this.src='https://i.pravatar.cc/36'" alt="">
          <div><div class="av-rname">${av.clienteNome}</div><div class="av-date">${formatarData(av.data)}</div></div>
        </div>
        <div style="color:#d97706;font-size:.95rem">${'★'.repeat(av.estrelas)}${'☆'.repeat(5-av.estrelas)}</div>
      </div>
      <p class="av-text">${av.comentario}</p>
    </div>
  `).join('');
}

function toggleStatus() {
  if(!perfilAtual) return;
  perfilAtual.status = perfilAtual.status === 'disponivel' ? 'ocupado' : 'disponivel';
  const isOcupado = perfilAtual.status === 'ocupado';
  const btn = document.getElementById('btnStatus');
  const lbl = document.getElementById('statusLabel');
  const dot = document.getElementById('phDot');
  if(btn) btn.className = 'status-toggle' + (isOcupado ? ' ocupado' : '');
  if(lbl) lbl.textContent = isOcupado ? 'Ocupado' : 'Disponível';
  if(dot) dot.className = 'ph-dot' + (isOcupado ? ' ocupado' : '');
  showToastPainel(`Status: ${perfilAtual.status}`, 'success');
}

function salvarPerfil() { showToastPainel('Perfil salvo! (simulação local)', 'success'); }

function showToastPainel(msg, tipo='') {
  const c = document.getElementById('toastContainer'); if(!c) return;
  const t = document.createElement('div'); t.className='toast '+tipo; t.textContent=msg;
  c.appendChild(t); setTimeout(()=>t.remove(), 3500);
}

function sair() { clearSession(); window.location.href='../../index.html'; }

document.addEventListener('DOMContentLoaded', initPainel);
