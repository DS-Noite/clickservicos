/* ══════════════════════════════════════════
   home.js — Feed de profissionais
   Renderiza cards + filtros + busca
   ══════════════════════════════════════════ */

/* Matriz global que armazenará a lista completa de profissionais retornada do banco de dados */
let todosOsProfissionais = [];

/* ── Inicialização ── */
/* Função principal que orquestra o carregamento da página do feed */
async function initHome() {
  /* Altera cabeçalhos, fotos e nomes na interface baseado no usuário logado (definido no auth.js) */
  aplicarSessaoNaUI();

  try {
    /* Faz a requisição assíncrona para buscar todos os profissionais cadastrados */
    todosOsProfissionais = await getProfissionais();
    /* Renderiza as opções de botões de categoria (chips) no topo da tela */
    await renderCategorias();
    /* Desenha os cards de todos os profissionais na tela inicialmente sem filtros */
    renderCards(todosOsProfissionais);
    /* Ativa os ouvintes de eventos (listeners) para detectar quando o usuário interagir com os filtros */
    initFiltros();
  } catch (e) {
    /* Tratamento de erro robusto caso o banco db.json falhe ou esteja inacessível */
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
/* Gera dinamicamente os botões de categorias no topo do feed */
async function renderCategorias() {
  const categorias = await getCategorias();
  const container = document.getElementById('catChips');
  if (!container) return; /* Prevenção de erro caso o container HTML não exista na página atual */

  /* Cria manualmente o primeiro botão padrão chamado "Todos" */
  const allBtn = document.createElement('button');
  allBtn.className = 'chip active'; // Inicia marcado com a classe de destaque 'active'
  allBtn.dataset.cat = ''; // Define um atributo de dados vazio (para trazer todos os resultados)
  allBtn.textContent = 'Todos';
  /* Atribui o evento de clique para limpar o termo de categoria */
  allBtn.onclick = () => selecionarCategoria('', allBtn);
  container.appendChild(allBtn);

  /* Percorre a lista de categorias vindas do banco de dados para criar os demais botões */
  categorias.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.dataset.cat = cat.nome; // Atribui o nome da categoria ao elemento via dataset
    btn.textContent = cat.icone + ' ' + cat.nome; // Combina o emoji/ícone com o texto da categoria
    /* Atribui o evento de clique enviando o nome da categoria clicada e a referência do próprio botão */
    btn.onclick = () => selecionarCategoria(cat.nome, btn);
    container.appendChild(btn);
  });
}

/* Gerencia o comportamento visual dos botões de categoria e injeta o valor na barra de pesquisa */
function selecionarCategoria(cat, btn) {
  /* Remove a classe 'active' de todos os botões para desmarcá-los */
  document.querySelectorAll('#catChips .chip').forEach(b => b.classList.remove('active'));
  /* Adiciona a classe de marcação apenas no botão que acabou de ser clicado */
  btn.classList.add('active');
  /* Joga o nome da categoria diretamente dentro da barra de pesquisa de serviços */
  document.getElementById('buscaInput').value = cat;
  /* Dispara a função que atualiza a lista de profissionais de acordo com a categoria selecionada */
  aplicarFiltros();
}

/* ── Inicializa listeners de filtro ── */
/* Mapeia e escuta as ações do usuário em todos os elementos de filtragem */
function initFiltros() {
  const ids = ['buscaInput', 'filtroCidade', 'filtroGenero', 'filtroStatus', 'filtroOrdenar'];
  
  /* Percorre cada ID de input/select e adiciona um evento do tipo 'input' (disparado a cada tecla ou mudança) */
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', aplicarFiltros);
  });

  /* Localiza os inputs de tipo radio (botões circulares de estrelas) e monitora quando são alterados ('change') */
  document.querySelectorAll('[name="minEstrelas"]').forEach(r => {
    r.addEventListener('change', aplicarFiltros);
  });
}

/* ── Aplica todos os filtros e re-renderiza ── */
/* Centraliza a lógica acumulativa de busca, filtros de seleção e ordenações do feed */
function aplicarFiltros() {
  /* Lê em tempo real os valores de todos os inputs, aplicando valores padrões de segurança caso estejam vazios */
  const servico   = document.getElementById('buscaInput')?.value || '';
  const cidade    = document.getElementById('filtroCidade')?.value || '';
  const genero    = document.getElementById('filtroGenero')?.value || 'todos';
  const status    = document.getElementById('filtroStatus')?.value || 'todos';
  const ordenar   = document.getElementById('filtroOrdenar')?.value || '';
  const minEst    = document.querySelector('[name="minEstrelas"]:checked')?.value || '';

  /* Clona a lista completa original de profissionais para realizar os filtros em cascata */
  let resultado = [...todosOsProfissionais];

  /* 1. Filtro por texto livre (Busca por serviço, título ou nome do profissional) */
  if (servico) {
    const q = servico.toLowerCase();
    resultado = resultado.filter(p =>
      p.servicos.some(s => s.toLowerCase().includes(q)) ||
      p.titulo.toLowerCase().includes(q) ||
      p.nome.toLowerCase().includes(q)
    );
  }
  
  /* 2. Filtro por Cidade (Usa inclusão parcial de texto) */
  if (cidade) {
    resultado = resultado.filter(p => p.cidade.toLowerCase().includes(cidade.toLowerCase()));
  }
  
  /* 3. Filtro por Gênero */
  if (genero !== 'todos') {
    resultado = resultado.filter(p => p.genero === genero);
  }
  
  /* 4. Filtro por Status de Disponibilidade (ex: 'disponivel', 'ocupado') */
  if (status !== 'todos') {
    resultado = resultado.filter(p => p.status === status);
  }
  
  /* 5. Filtro por Nota Mínima de Avaliação */
  if (minEst) {
    resultado = resultado.filter(p => p.estrelas >= parseFloat(minEst));
  }
  
  /* 6. Algoritmos de Ordenação da lista final baseada na escolha do usuário */
  if (ordenar === 'estrelas') {
    resultado.sort((a, b) => b.estrelas - a.estrelas); // Nota maior primeiro
  } else if (ordenar === 'avaliacoes') {
    resultado.sort((a, b) => b.totalAvaliacoes - a.totalAvaliacoes); // Mais votados primeiro
  } else if (ordenar === 'tempo') {
    resultado.sort((a, b) => b.tempoPlatforma - a.tempoPlatforma); // Mais antigos de casa primeiro
  }

  /* Redesenha os cards na tela passando apenas a lista final filtrada */
  renderCards(resultado);

  /* Atualiza o contador de resultados encontrados no topo do feed, cuidando da concordância gramatical plural/singular */
  const count = document.getElementById('resultCount');
  if (count) count.textContent = resultado.length + ' profissional' + (resultado.length !== 1 ? 'is' : '');
}

/* ── Limpa filtros ── */
/* Reseta completamente o estado inicial de todos os componentes de filtro da interface */
function limparFiltros() {
  document.getElementById('buscaInput').value = '';
  document.getElementById('filtroCidade').value = '';
  document.getElementById('filtroGenero').value = 'todos';
  document.getElementById('filtroStatus').value = 'todos';
  document.getElementById('filtroOrdenar').value = '';
  
  /* Desmarca todos os seletores de botão do tipo radio de estrelas */
  const radios = document.querySelectorAll('[name="minEstrelas"]');
  radios.forEach(r => r.checked = false);
  
  /* Reseta visualmente a seleção dos chips de categorias voltando para o botão "Todos" */
  document.querySelectorAll('#catChips .chip').forEach(b => b.classList.remove('active'));
  document.querySelector('#catChips .chip')?.classList.add('active');
  
  /* Renderiza novamente a lista completa sem nenhum critério de exclusão */
  renderCards(todosOsProfissionais);
  
  /* Atualiza o texto do contador para exibir o número total máximo de profissionais */
  const count = document.getElementById('resultCount');
  if (count) count.textContent = todosOsProfissionais.length + ' profissionais';
}

/* ── Renderiza grid de cards ── */
/* Injeta dinamicamente a estrutura HTML estruturada para cada profissional dentro da grade */
function renderCards(lista) {
  const grid = document.getElementById('profGrid');
  if (!grid) return;

  /* Exibe uma mensagem amigável na tela se nenhum profissional corresponder aos filtros aplicados */
  if (lista.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <p>Nenhum profissional encontrado</p>
        <small>Tente outros filtros ou termos de busca.</small>
      </div>
    `;
    return;
  }

  /* Mapeia a lista de objetos gerando um bloco de string HTML customizada por profissional */
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
  `).join(''); /* O .join('') elimina as vírgulas geradas por padrão pelo método .map() na conversão do array */
}

/* ── Logout ── */
/* Finaliza e limpa a sessão atual do usuário ativo */
function sair() {
  clearSession(); // Remove o token/registro da chave do localStorage (definido no auth.js)
  window.location.href = '../../index.html'; // Redireciona de volta para a tela inicial externa do portal
}

/* ── Start ── */
/* Aciona o gatilho inicializando o feed assim que a estrutura DOM do documento estiver totalmente lida pelo navegador */
document.addEventListener('DOMContentLoaded', initHome);