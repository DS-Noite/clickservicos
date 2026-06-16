/* ══════════════════════════════════════════
   home.js — Feed de profissionais
   Renderiza cards + filtros + busca
   ══════════════════════════════════════════ */

/* Matriz global que armazenará a lista completa de profissionais retornada do banco de dados */
let todosOsProfissionais = [];

/* ── Inicialização ── */
async function initHome() {
  /* Altera cabeçalhos, fotos e nomes na interface baseado no usuário logado */
  if (typeof aplicarSessaoNaUI === 'function') {
    aplicarSessaoNaUI();
  }

  /* ── SINCRONIZAÇÃO DINÂMICA COM O PAINEL ── */
  setTimeout(() => {
    let nomeAtualizado = null;
    let fotoAtualizada = null;
    
    // 1. Busca os dados reais salvos na sessão (mesma usada pelo painel.js)
    const sessaoStorage = localStorage.getItem("cs_session");
    if (sessaoStorage) {
      try {
        const dadosSessao = JSON.parse(sessaoStorage);
        nomeAtualizado = dadosSessao.nome;
        fotoAtualizada = dadosSessao.foto;
      } catch(e) { console.error("Erro ao ler sessão:", e) }
    }

    if (!nomeAtualizado) {
      nomeAtualizado = localStorage.getItem("perfil_nome") || "Usuário";
    }

    if (nomeAtualizado) {
      // 2. Atualiza os Textos (Nomes)
      const elementosNome = document.querySelectorAll('[data-user-name], [data-user-name-mobile], #userName, .user-name, .nome-usuario');
      elementosNome.forEach(el => {
        if (el.textContent.trim().toLowerCase().startsWith('olá')) {
          el.textContent = `Olá, ${nomeAtualizado.split(' ')[0]}`;
        } else {
          el.textContent = `${nomeAtualizado}`;
        }
      });

      // 3. Atualiza as Imagens (Avatares) buscando pelo atributo data-user-foto
      const urlAvatar = fotoAtualizada || `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeAtualizado)}&background=091E3F&color=fff&bold=true`;
      
      const avatares = document.querySelectorAll('[data-user-foto]');
      avatares.forEach(img => {
        img.src = urlAvatar;
      });
    }
  }, 50);

  try {
    todosOsProfissionais = await getProfissionais();
    await renderCategorias();
    renderCards(todosOsProfissionais);
    initFiltros();
  } catch (e) {
    console.error('[home.js] Erro ao carregar profissionais:', e);
    const grid = document.getElementById('profGrid');
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>Erro ao carregar dados</p>
          <small>Verifique se o db.json está acessível.</small>
        </div>
      `;
    }
  }
}

/* ── Renderiza chips de categoria ── */
async function renderCategorias() {
  if (typeof getCategorias !== 'function') return;
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
  
  const busca = document.getElementById('buscaInput');
  if (busca) busca.value = cat;
  
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
  const buscaInput = document.getElementById('buscaInput');
  const filtroCidade = document.getElementById('filtroCidade');
  const filtroGenero = document.getElementById('filtroGenero');
  const filtroStatus = document.getElementById('filtroStatus');
  const filtroOrdenar = document.getElementById('filtroOrdenar');

  if(buscaInput) buscaInput.value = '';
  if(filtroCidade) filtroCidade.value = '';
  if(filtroGenero) filtroGenero.value = 'todos';
  if(filtroStatus) filtroStatus.value = 'todos';
  if(filtroOrdenar) filtroOrdenar.value = '';
  
  const radios = document.querySelectorAll('[name="minEstrelas"]');
  radios.forEach(r => r.checked = false);
  
  document.querySelectorAll('#catChips .chip').forEach(b => b.classList.remove('active'));
  document.querySelector('#catChips .chip')?.classList.add('active');
  
  renderCards(todosOsProfissionais);
  
  const count = document.getElementById('resultCount');
  if (count) count.textContent = todosOsProfissionais.length + ' profissionais';
}

/* ── Renderiza grid de cards (UX OTIMIZADA) ── */
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

  const salvos = JSON.parse(localStorage.getItem("cs_favoritos") || "[]");

  grid.innerHTML = lista.map(p => {
    const estaDisponivel = p.status === 'disponivel';
    const btnContratarClasse = estaDisponivel ? 'btn-contratar' : 'btn-contratar desativado';
    const btnContratarTexto = estaDisponivel ? 'Contratar' : 'Indisponível';

    const precoExibido = typeof formatarPreco === 'function' ? formatarPreco(p.precificacao) : 'R$ ' + p.precificacao;
    const ehFavorito = salvos.includes(p.id);
    const classeFavorito = ehFavorito ? 'btn-favoritar active' : 'btn-favoritar';

    return `
      <div class="prof-card">
        <a href="perfil.html?id=${p.id}" class="card-link-wrapper">
          <div class="card-top">
            <div class="card-avatar-wrap">
              <img class="card-avatar" src="${p.foto}" alt="${p.nome}" onerror="this.src='https://i.pravatar.cc/150?u=${p.id}'">
              <div class="card-status-dot ${!estaDisponivel ? 'ocupado' : ''}"></div>
            </div>
          </div>
          
          <div class="card-body">
            <div class="card-name">${p.nome}</div>
            <div class="card-title">${p.titulo}</div>
            <div class="card-location">📍 ${p.cidade}, ${p.estado}</div>
            
            <div class="card-rating">
              ${typeof renderStars === 'function' ? renderStars(p.estrelas, p.totalAvaliacoes) : '⭐ ' + p.estrelas}
              <div class="badge badge--${p.status}">${p.status}</div>
            </div>
            
            <div class="card-tags">
              ${p.servicos.slice(0, 3).map(s => `<span class="card-tag">${s}</span>`).join('')}
              ${p.servicos.length > 3 ? `<span class="card-tag">+${p.servicos.length - 3}</span>` : ''}
            </div>

            <div class="card-price-row">
              <span class="card-price">${precoExibido}</span>
            </div>
          </div>
        </a>

        <div class="card-actions">
          <button class="${classeFavorito}" onclick="favoritarProfissional('${p.id}', this)" title="Favoritar">
            <svg class="icon-coracao" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <button class="${btnContratarClasse}" ${!estaDisponivel ? 'disabled' : ''} onclick="acaoContratar('${p.id}', '${p.nome}')">
            ${btnContratarTexto}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/* ── Salva permanentemente no LocalStorage ── */
function favoritarProfissional(id, botao) {
  let salvos = JSON.parse(localStorage.getItem("cs_favoritos") || "[]");
  botao.classList.toggle('active');

  if (botao.classList.contains('active')) {
    if (!salvos.includes(id)) {
      salvos.push(id);
    }
  } else {
    salvos = salvos.filter(itemId => itemId !== id);
  }

  localStorage.setItem("cs_favoritos", JSON.stringify(salvos));
  localStorage.setItem("cs_favorites", JSON.stringify(salvos));
}

function acaoContratar(id, nome) {
  // Redireciona o usuário direto para a página de perfil do profissional passando o ID dele
  window.location.href = `perfil.html?id=${id}`;
}

function sair() {
  if (typeof clearSession === 'function') {
    clearSession();
  } else {
    localStorage.clear();
  }
  window.location.href = '../../index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  initHome();

  const btnHamburger = document.getElementById('btnHamburger');
  const sidebar = document.querySelector('.sidebar');
  const homeLayout = document.querySelector('.home-layout');

  if (btnHamburger) {
    btnHamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      btnHamburger.classList.toggle('active');
      
      if (sidebar) sidebar.classList.toggle('active');
      if (homeLayout) homeLayout.classList.toggle('menu-aberto');
    });

    document.addEventListener('click', (e) => {
      if (sidebar && !sidebar.contains(e.target) && !btnHamburger.contains(e.target)) {
        btnHamburger.classList.remove('active');
        sidebar.classList.remove('active');
        if (homeLayout) homeLayout.classList.remove('menu-aberto');
      }
    });
    
    if (sidebar) {
      const filtros = sidebar.querySelectorAll('select, input, button');
      filtros.forEach(filtro => {
        filtro.addEventListener('change', () => {
          if(filtro.id !== 'buscaInput') {
            btnHamburger.classList.remove('active');
            sidebar.classList.remove('active');
            if (homeLayout) homeLayout.classList.remove('menu-aberto');
          }
        });
      });
    }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const btnHamburger = document.getElementById('btnHamburger');
    const sidebar = document.querySelector('.sidebar');
    const homeLayout = document.querySelector('.home-layout');
    
    if (sidebar && sidebar.classList.contains('active')) {
      if (btnHamburger) btnHamburger.classList.remove('active');
      sidebar.classList.remove('active');
      if (homeLayout) homeLayout.classList.remove('menu-aberto');
    }
  }
});