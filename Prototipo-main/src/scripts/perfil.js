/* ══════════════════════════════════════════
   perfil.js — Perfil do profissional
   Lê ?id= da URL, carrega do db.json
   ══════════════════════════════════════════ */

async function initPerfil() {
  aplicarSessaoNaUI();

  // Pega o ID da URL
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    window.location.href = 'home.html';
    return;
  }

  try {
    const prof = await getProfissionalById(id);
    if (!prof) {
      document.getElementById('perfilContent').innerHTML = `
        <p style="padding:3rem;text-align:center;color:var(--text-3)">
          Profissional não encontrado.
        </p>
      `;
      return;
    }
    renderPerfil(prof);
  } catch (e) {
    console.error('[perfil.js] Erro:', e);
  }
}

function renderPerfil(p) {
  // Atualiza <title>
  document.title = `${p.nome} — ClickServiços`;

  // ── IDENTITY CARD ──
  document.getElementById('idAvatar').src = p.foto;
  document.getElementById('idName').textContent = p.nome;
  document.getElementById('idRole').textContent = p.titulo;
  document.getElementById('idLocation').textContent = `📍 ${p.cidade}, ${p.estado}`;
  document.getElementById('idDesc').textContent = p.descricao;
  document.getElementById('idDot').className = 'identity-dot ' + (p.status === 'ocupado' ? 'ocupado' : '');

  // Quick stats
  document.getElementById('statEstrelas').textContent = p.estrelas.toFixed(1);
  document.getElementById('statAvaliacoes').textContent = p.totalAvaliacoes;
  document.getElementById('statTempo').textContent = p.tempoPlatforma + 'm';

  // ── INFO CARD ──
  document.getElementById('infoHorario').textContent = p.horario;
  document.getElementById('infoPreco').textContent = formatarPreco(p.precificacao);
  document.getElementById('infoStatus').innerHTML = `<div class="badge badge--${p.status}">${p.status}</div>`;
  document.getElementById('infoGenero').textContent = p.genero.charAt(0).toUpperCase() + p.genero.slice(1);

  // ── SERVIÇOS ──
  document.getElementById('servicosGrid').innerHTML = p.servicos
    .map(s => `<span class="service-tag">${s}</span>`)
    .join('');

  // ── TRABALHOS ANTERIORES ──
  const clContainer = document.getElementById('cardlinksGrid');
  if (p.cardLinks.length === 0) {
    clContainer.innerHTML = `<div class="cardlinks-empty">Nenhum trabalho registrado ainda.</div>`;
  } else {
    clContainer.innerHTML = p.cardLinks.map(cl => `
      <div class="cardlink">
        <div class="cardlink-imgs">
          <img src="${cl.fotoAntes}" alt="Antes" title="Antes">
          <div class="cardlink-divider"></div>
          <img src="${cl.fotoDepois}" alt="Depois" title="Depois">
        </div>
        <div class="cardlink-body">
          <p class="cardlink-desc">${cl.descricao}</p>
          <div class="cardlink-meta">
            <span class="cardlink-chip">⏱ ${cl.tempo}</span>
            ${cl.materiais.slice(0, 2).map(m => `<span class="cardlink-chip">${m}</span>`).join('')}
          </div>
        </div>
      </div>
    `).join('');
  }

  // ── AVALIAÇÕES ──
  document.getElementById('reviewScore').textContent = p.estrelas.toFixed(1);
  document.getElementById('reviewStars').textContent = '★'.repeat(Math.round(p.estrelas)) + '☆'.repeat(5 - Math.round(p.estrelas));
  document.getElementById('reviewTotal').textContent = p.totalAvaliacoes + ' avaliações';

  const reviewList = document.getElementById('reviewList');
  if (p.avaliacoes.length === 0) {
    reviewList.innerHTML = `<p style="color:var(--text-3);font-size:.9rem">Ainda sem avaliações escritas.</p>`;
  } else {
    reviewList.innerHTML = p.avaliacoes.map(av => `
      <div class="review-item">
        <div class="review-header">
          <div class="reviewer">
            <img src="${av.clienteFoto}" alt="${av.clienteNome}" onerror="this.src='https://i.pravatar.cc/36'">
            <div>
              <div class="reviewer-name">${av.clienteNome}</div>
              <div class="reviewer-date">${formatarData(av.data)}</div>
            </div>
          </div>
          <div class="stars" style="color:#f59e0b;font-size:1rem">
            ${'★'.repeat(av.estrelas)}${'☆'.repeat(5 - av.estrelas)}
          </div>
        </div>
        <p class="review-text">${av.comentario}</p>
      </div>
    `).join('');
  }
}

function abrirChat(nome) {
  alert(`💬 Chat com ${nome}\n\nFuncionalidade de bate-papo chegando em breve!`);
}

document.addEventListener('DOMContentLoaded', initPerfil);
