/* painel.js v2 */

/* Variáveis globais para armazenar os dados do profissional logado e a sua lista de especialidades/serviços ativa */
let perfilAtual = null;
let servicosAtuais = [];

/* ── Inicialização do Painel ── */
async function initPainel() {
  /* Proteção de rota: se não houver sessão ativa, redireciona o usuário para a página inicial */
  const session = requireAuth('../../index.html');
  /* Atualiza as informações do usuário logado na interface (nome, foto) */
  aplicarSessaoNaUI();
  try {
    /* Carrega os dados simulados do db.json */
    const db = await fetchDB();
    /* Localiza o perfil de profissional correspondente ao usuário logado ou adota o primeiro da lista como fallback */
    perfilAtual = db.profissionais.find(p => p.usuarioId === session.id) || db.profissionais[0];
    
    /* Se um perfil for encontrado/definido, dispara todas as funções de preenchimento da interface */
    if (perfilAtual) {
      renderOverview(perfilAtual);    // Exibe o resumo das informações e KPIs
      renderEditForm(perfilAtual);    // Preenche o formulário de edição de dados
      renderServicosTab(perfilAtual.servicos); // Lista as tags de serviços editáveis
      renderAvaliacoes(perfilAtual);  // Mostra o histórico de notas e comentários
    }
  } catch(e) { console.error(e); }
  /* Define a aba de resumo ('overview') como a aba inicial visível */
  abrirTab('overview');
}

/* ── Controle de Abas (Navegação Interna) ── */
function abrirTab(tab) {
  /* Remove a classe de visibilidade ativa de todas as seções de conteúdo do painel */
  document.querySelectorAll('.painel-tab').forEach(t => t.classList.remove('active'));
  /* Remove o destaque visual ativo de todos os botões do menu de navegação do painel */
  document.querySelectorAll('.pnav-item').forEach(n => n.classList.remove('active'));
  
  /* Adiciona a classe de visibilidade apenas no painel correspondente à aba clicada */
  document.getElementById('tab-' + tab)?.classList.add('active');
  /* Adiciona o destaque visual apenas no botão do menu que foi clicado */
  document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
}

/* ── Renderização do Resumo (Overview) ── */
function renderOverview(p) {
  // Profile hero: Atualiza as informações visuais de destaque do cabeçalho do profissional
  const av = document.getElementById('phAvatar'); if(av) av.src = p.foto;
  const nm = document.getElementById('phName'); if(nm) nm.textContent = p.nome;
  const rl = document.getElementById('phRole'); if(rl) rl.textContent = p.titulo;
  const lc = document.getElementById('phLoc'); if(lc) lc.textContent = `📍 ${p.cidade}, ${p.estado}`;
  /* Altera a cor do ponto indicador de status mudando a classe CSS dele */
  const dt = document.getElementById('phDot'); if(dt) dt.className = 'ph-dot' + (p.status === 'ocupado' ? ' ocupado' : '');
  const pl = document.getElementById('phPerfilLink'); if(pl) pl.href = `perfil.html?id=${p.id}`;
  const st = document.getElementById('statusLabel'); if(st) st.textContent = p.status === 'disponivel' ? 'Disponível' : 'Ocupado';
  const btn = document.getElementById('btnStatus'); if(btn) btn.className = 'status-toggle' + (p.status === 'ocupado' ? ' ocupado' : '');

  // KPIs: Injeta as métricas de desempenho nas caixas numéricas superiores do painel
  const kn = document.getElementById('kpiNota'); if(kn) kn.textContent = p.estrelas.toFixed(1);
  const ka = document.getElementById('kpiAv'); if(ka) ka.textContent = p.totalAvaliacoes;
  const ks = document.getElementById('kpiSv'); if(ks) ks.textContent = p.servicos.length;
  const kt = document.getElementById('kpiTp'); if(kt) kt.textContent = p.tempoPlatforma;
  
  /* Loop manual para desenhar visualmente as estrelas do KPI baseando-se na nota do profissional */
  const estrelas = p.estrelas;
  const container = document.getElementById('kpiStars');if (container) {let html = '';for (let i = 1; i <= 5; i++) {html += i <= estrelas? '⭐': '☆';}container.innerHTML = html;}

  // Cards de Informações Gerais: Injeta a biografia, as tags e os detalhes do contrato
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

/* ── Preenchimento do Formulário de Edição ── */
function renderEditForm(p) {
  /* Helper interno para facilitar a injeção automatizada de valores nos inputs, se existirem na tela */
  const s = (id, v) => { const el=document.getElementById(id); if(el) el.value = v||''; };
  s('editNome', p.nome); s('editTitulo', p.titulo);
  s('editCidade', p.cidade); s('editDesc', p.descricao);
  s('editHorario', p.horario); s('editPreco', p.precificacao?.valor||'');
  const av = document.getElementById('editAvatar'); if(av) av.src = p.foto;
}

/* ── Gerenciamento da Lista de Serviços/Especialidades ── */
function renderServicosTab(servicos) {
  /* Clona o array original de serviços para a lista de manipulação temporária */
  servicosAtuais = [...servicos];
  const c = document.getElementById('servicosEditor');
  if(!c) return;
  
  /* Injeta as pílulas de tags com um botão "×" que carrega o índice numérico da posição do serviço no array */
  c.innerHTML = servicosAtuais.map((s,i)=>`
    <span class="svc-tag">${s}<button onclick="removerServico(${i})">×</button></span>
  `).join('');
}

/* Remove um serviço da lista temporária baseado em seu índice no array */
function removerServico(i) { 
  servicosAtuais.splice(i,1); 
  renderServicosTab(servicosAtuais); // Atualiza os elementos na tela
}

/* Adiciona um novo serviço digitado no input para a lista temporária */
function adicionarServico() {
  const inp = document.getElementById('novoServico');
  const v = inp?.value.trim(); if(!v) return; /* Aborta se o campo estiver em branco */
  servicosAtuais.push(v); 
  renderServicosTab(servicosAtuais); // Atualiza os elementos na tela
  inp.value=''; // Limpa o campo de digitação
}

/* ── Renderização das Avaliações/Comentários dos Clientes ── */
function renderAvaliacoes(p) {
  /* Desenha o resumo geral de satisfação e média do profissional */
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
  
  /* Verifica se a lista de avaliações está vazia ou inexistente no cadastro */
  if(!p.avaliacoes?.length) {
    list.innerHTML = '<p style="color:var(--text-3);font-size:.9rem;padding:1rem">Ainda sem avaliações escritas.</p>';
    return;
  }
  
  /* Percorre as avaliações construindo os cards individuais com foto do cliente, comentário e estrelas */
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

/* ── Alternar Disponibilidade (Online/Ocupado) ── */
function toggleStatus() {
  if(!perfilAtual) return;
  
  /* Inverte o estado atual do profissional de forma lógica */
  perfilAtual.status = perfilAtual.status === 'disponivel' ? 'ocupado' : 'disponivel';
  const isOcupado = perfilAtual.status === 'ocupado';
  
  /* Altera as classes visuais e rótulos de texto de todos os elementos impactados na tela */
  const btn = document.getElementById('btnStatus');
  const lbl = document.getElementById('statusLabel');
  const dot = document.getElementById('phDot');
  if(btn) btn.className = 'status-toggle' + (isOcupado ? ' ocupado' : '');
  if(lbl) lbl.textContent = isOcupado ? 'Ocupado' : 'Disponível';
  if(dot) dot.className = 'ph-dot' + (isOcupado ? ' ocupado' : '');
  
  /* Emite uma notificação flutuante de sucesso avisando o status modificado */
  showToastPainel(`Status: ${perfilAtual.status}`, 'success');
}

/* Simula o salvamento dos dados disparando uma notificação visual na tela */
function salvarPerfil() { showToastPainel('Perfil salvo! (simulação local)', 'success'); }

/* ── Sistema Dinâmico de Notificações (Toast) ── */
function showToastPainel(msg, tipo='') {
  const c = document.getElementById('toastContainer'); if(!c) return;
  const t = document.createElement('div'); t.className='toast '+tipo; t.textContent=msg;
  c.appendChild(t); 
  /* Remove automaticamente o elemento de notificação da tela após 3.5 segundos */
  setTimeout(()=>t.remove(), 3500);
}

/* ── Encerramento de Sessão ── */
function sair() { clearSession(); window.location.href='../../index.html'; }

/* Escuta o carregamento estrutural completo da página para rodar a inicialização do painel */
document.addEventListener('DOMContentLoaded', initPainel);