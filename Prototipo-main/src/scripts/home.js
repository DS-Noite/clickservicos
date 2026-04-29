/* ══════════════════════════════════════════
   home.js — Feed de profissionais
   Renderiza cards + filtros + busca
   ══════════════════════════════════════════ */

let todosOsProfissionais = [];

/* ── Inicialização ── */
async function initHome() {
  aplicarSessaoNaUI();

  try {
    todosOsProfissionais = await getProfissionais();
    await renderCategorias();
    renderCards(todosOsProfissionais);
    initFiltros();
  } catch (e) {
    console.error('[home.js] Erro ao carregar profissionais:', e);
    document.getElementById('profGrid').innerHTML = `
      <div class="empty-state">
        <p>Erro ao carregar dados</p>
        <small>Verifique se o db.json está acessível.</small>
      </div>
    `;
  }
}

/* ── Renderiza chips de categoria ── */
async function renderCategorias() {
  const categorias = await getCategorias();
  const container = document.getElementById('catChips');
  if (!container) return;

  const allBtn = document.createElement('button');
  allBtn.className = 'chip active';
  allBtn.dataset.cat = '';
  allBtn.textContent = 'Todos';
  allBtn.onclick = () => selecionarCategoria('', allBtn);
  container.appendChild(allBtn);

  categorias.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.dataset.cat = cat.nome;
    btn.textContent = cat.icone + ' ' + cat.nome;
    btn.onclick = () => selecionarCategoria(cat.nome, btn);
    container.appendChild(btn);
  });
}

function selecionarCategoria(cat, btn) {
  document.querySelectorAll('#catChips .chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('buscaInput').value = cat;
  aplicarFiltros();
}

/* ── Inicializa listeners de filtro ── */
function initFiltros() {
  const ids = ['buscaInput', 'filtroCidade', 'filtroGenero', 'filtroStatus', 'filtroOrdenar'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', aplicarFiltros);
  });

  document.querySelectorAll('[name="minEstrelas"]').forEach(r => {
    r.addEventListener('change', aplicarFiltros);
  });
}

/* ── Aplica todos os filtros e re-renderiza ── */
function aplicarFiltros() {
  const servico   = document.getElementById('buscaInput')?.value || '';
  const cidade    = document.getElementById('filtroCidade')?.value || '';
  const genero    = document.getElementById('filtroGenero')?.value || 'todos';
  const status    = document.getElementById('filtroStatus')?.value || 'todos';
  const ordenar   = document.getElementById('filtroOrdenar')?.value || '';
  const minEst    = document.querySelector('[name="minEstrelas"]:checked')?.value || '';

  let resultado = [...todosOsProfissionais];

  if (servico) {
    const q = servico.toLowerCase();
    resultado = resultado.filter(p =>
      p.servicos.some(s => s.toLowerCase().includes(q)) ||
      p.titulo.toLowerCase().includes(q) ||
      p.nome.toLowerCase().includes(q)
    );
  }
  if (cidade) {
    resultado = resultado.filter(p => p.cidade.toLowerCase().includes(cidade.toLowerCase()));
  }
  if (genero !== 'todos') {
    resultado = resultado.filter(p => p.genero === genero);
  }
  if (status !== 'todos') {
    resultado = resultado.filter(p => p.status === status);
  }
  if (minEst) {
    resultado = resultado.filter(p => p.estrelas >= parseFloat(minEst));
  }
  if (ordenar === 'estrelas') {
    resultado.sort((a, b) => b.estrelas - a.estrelas);
  } else if (ordenar === 'avaliacoes') {
    resultado.sort((a, b) => b.totalAvaliacoes - a.totalAvaliacoes);
  } else if (ordenar === 'tempo') {
    resultado.sort((a, b) => b.tempoPlatforma - a.tempoPlatforma);
  }

  renderCards(resultado);

  const count = document.getElementById('resultCount');
  if (count) count.textContent = resultado.length + ' profissional' + (resultado.length !== 1 ? 'is' : '');
}

/* ── Limpa filtros ── */
function limparFiltros() {
  document.getElementById('buscaInput').value = '';
  document.getElementById('filtroCidade').value = '';
  document.getElementById('filtroGenero').value = 'todos';
  document.getElementById('filtroStatus').value = 'todos';
  document.getElementById('filtroOrdenar').value = '';
  const radios = document.querySelectorAll('[name="minEstrelas"]');
  radios.forEach(r => r.checked = false);
  document.querySelectorAll('#catChips .chip').forEach(b => b.classList.remove('active'));
  document.querySelector('#catChips .chip')?.classList.add('active');
  renderCards(todosOsProfissionais);
  const count = document.getElementById('resultCount');
  if (count) count.textContent = todosOsProfissionais.length + ' profissionais';
}

/* ── Renderiza grid de cards ── */
function renderCards(lista) {
  const grid = document.getElementById('profGrid');
  if (!grid) return;

  if (lista.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <p>Nenhum profissional encontrado</p>
        <small>Tente outros filtros ou termos de busca.</small>
      </div>
    `;
    return;
  }

  grid.innerHTML = lista.map(p => `
    <a class="prof-card" href="perfil.html?id=${p.id}">
      <div class="card-top">
        <div class="card-avatar-wrap">
          <img class="card-avatar" src="${p.foto}" alt="${p.nome}" onerror="this.src='https://i.pravatar.cc/150?u=${p.id}'">
          <div class="card-status-dot ${p.status === 'ocupado' ? 'ocupado' : ''}"></div>
        </div>
      </div>
      <div class="card-body">
        <div class="card-name">${p.nome}</div>
        <div class="card-title">${p.titulo}</div>
        <div class="card-location">
          📍 ${p.cidade}, ${p.estado}
        </div>
        <div class="card-rating">
          ${renderStars(p.estrelas, p.totalAvaliacoes)}
          <div class="badge badge--${p.status}">${p.status}</div>
        </div>
        <div class="card-tags">
          ${p.servicos.slice(0, 3).map(s => `<span class="card-tag">${s}</span>`).join('')}
          ${p.servicos.length > 3 ? `<span class="card-tag">+${p.servicos.length - 3}</span>` : ''}
        </div>
        <div class="card-footer">
          <span class="card-price">${formatarPreco(p.precificacao)}</span>
          <span class="btn-ghost">Ver perfil →</span>
        </div>
      </div>
    </a>
  `).join('');
}

/* ── Logout ── */
function sair() {
  clearSession();
  window.location.href = '../../index.html';
}

/* ── Start ── */
document.addEventListener('DOMContentLoaded', initHome);
