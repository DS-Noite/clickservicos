/* ══════════════════════════════════════════
   painel.js — Lógica Unificada do Dashboard
   ══════════════════════════════════════════ */

let abaSolicitacoesFiltro = 'andamento';

// Dados em Mock simulados ATUALIZADOS com endereço e hora
const solicitacoesMockIniciais = [
  { id: "s01", clienteId: "u003", profissionalNome: "Carlos Mendes", servico: "Instalação elétrica", data: "02/06/2026", hora: "14:00", endereco: "Rua das Flores, 123 - Centro, Recife", status: "concluido" },
  { id: "s02", clienteId: "u003", profissionalNome: "Pedro Santos", servico: "Pintura residencial", data: "28/05/2026", hora: "09:30", endereco: "Av. Boa Viagem, 450 - Boa Viagem, Recife", status: "andamento" },
  { id: "s03", clienteId: "u003", profissionalNome: "Marcos Oliveira", servico: "Montagem de móveis", data: "14/05/2026", hora: "16:00", endereco: "Rua Aurora, 88 - Santo Amaro, Recife", status: "concluido" }
];

document.addEventListener("DOMContentLoaded", () => {
  // Inicializa a tabela de solicitações caso o usuário nunca tenha feito pedidos
  if (!localStorage.getItem("cs_solicitacoes")) {
    localStorage.setItem("cs_solicitacoes", JSON.stringify(solicitacoesMockIniciais));
  }

  // Faz a ponte de dados ativos vindos do auth.js e popula o HTML
  sincronizarInterfaceUsuario();
  
  // Renderiza contadores numéricos nos 3 cards do topo
  atualizarContadoresCards();

  // Preenche as listas padrões da aba de Visão Geral
  renderizarVisaoGeralListas();
});

/* ── GERENCIADOR DE ALTERNÂNCIA ENTRE ABAS PRINCIPAIS ── */
function alternarAbasPainel(idAbaDestino) {
  document.querySelectorAll(".pnav-item").forEach(btn => {
    btn.classList.remove("active");
  });

  document.querySelectorAll(".painel-secao-conteudo").forEach(conteudo => {
    conteudo.classList.remove("active");
  });

  const itemMenu = document.getElementById(`btn-${idAbaDestino}`);
  if (itemMenu) itemMenu.classList.add("active");

  const secaoConteudo = document.getElementById(`secao-${idAbaDestino}`);
  if (secaoConteudo) secaoConteudo.classList.add("active");

  if (idAbaDestino === 'visao-geral') {
    renderizarVisaoGeralListas();
  } else if (idAbaDestino === 'solicitacoes') {
    renderizarModuloSolicitacoesCompleto();
  } else if (idAbaDestino === 'favoritos') {
    renderizarModuloFavoritosCompleto();
  }
  
  atualizarContadoresCards();
}

/* ── SINCRONIZAÇÃO E PREENCHIMENTO AUTOMÁTICO DO USUÁRIO ── */
function sincronizarInterfaceUsuario() {
  const usuario = typeof getSession === 'function' ? getSession() : null;

  if (!usuario) {
    configurarDadosVisuaisExibicao("João Silva", "Recife, PE", "(81) 99999-9999", "joao@email.com", "Boa Viagem");
    return;
  }

  const nome = usuario.nome || "Usuário Click";
  const cidade = usuario.cidade || "Recife";
  const estado = usuario.estado || "PE";
  const telefone = usuario.telefone || "(81) 99999-0000";
  const email = usuario.email || "seuemail@clickservicos.com";
  const bairro = usuario.bairro || "Bairro Cadastrado";

  configurarDadosVisuaisExibicao(nome, `${cidade}, ${estado}`, telefone, email, bairro);
}

function configurarDadosVisuaisExibicao(nome, localidade, telefone, email, bairro) {
  if (document.getElementById("phName")) document.getElementById("phName").textContent = nome;
  if (document.getElementById("phLoc")) document.getElementById("phLoc").textContent = `📍 ${localidade}`;
  if (document.getElementById("phPhone")) document.getElementById("phPhone").textContent = `📞 ${telefone}`;
  if (document.getElementById("phEmail")) document.getElementById("phEmail").textContent = `✉ ${email}`;

  if (document.getElementById("resumoNome")) document.getElementById("resumoNome").textContent = nome;
  if (document.getElementById("resumoTelefone")) document.getElementById("resumoTelefone").textContent = telefone;
  if (document.getElementById("resumoEmail")) document.getElementById("resumoEmail").textContent = email;
  if (document.getElementById("resumoLocalidade")) document.getElementById("resumoLocalidade").textContent = `${localidade} (${bairro})`;

  if (document.getElementById("inputNome")) document.getElementById("inputNome").value = nome;
  if (document.getElementById("inputTelefone")) document.getElementById("inputTelefone").value = telefone;
  if (document.getElementById("inputEmail")) document.getElementById("inputEmail").value = email;
  if (document.getElementById("inputCidade")) document.getElementById("inputCidade").value = localidade.split(',')[0];
  if (document.getElementById("inputBairro")) document.getElementById("inputBairro").value = bairro;

  const sessaoStorage = localStorage.getItem("cs_session");
  let fotoAtualizada = null;
  if (sessaoStorage) {
    try { fotoAtualizada = JSON.parse(sessaoStorage).foto; } catch(e) {}
  }
  
  const urlAvatar = fotoAtualizada || `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=091E3F&color=fff&bold=true`;
  
  document.querySelectorAll('[data-user-foto]').forEach(img => {
    img.src = urlAvatar;
  });
}

/* ── PERSISTÊNCIA DAS ALTERAÇÕES DO PERFIL ── */
function salvarAlteracoesPerfil() {
  const nomeVal = document.getElementById("inputNome").value;
  const telVal = document.getElementById("inputTelefone").value;
  const emailVal = document.getElementById("inputEmail").value;
  const cidadeVal = document.getElementById("inputCidade").value;
  const bairroVal = document.getElementById("inputBairro").value;

  if (!nomeVal || !emailVal) {
    mostrarNotificacaoToast("Campos obrigatórios: Nome e E-mail.");
    return;
  }

  const dadosMapeados = { nome: nomeVal, telefone: telVal, email: emailVal, cidade: cidadeVal, bairro: bairroVal };

  if (typeof updateSession === 'function') {
    updateSession(dadosMapeados);
  } else {
    const sessionRaw = localStorage.getItem("cs_session");
    if (sessionRaw) {
      const objetoConvertido = JSON.parse(sessionRaw);
      localStorage.setItem("cs_session", JSON.stringify({ ...objetoConvertido, ...dadosMapeados }));
    }
  }

  sincronizarInterfaceUsuario();
  mostrarNotificacaoToast("Dados cadastrais salvos com sucesso!");
  alternarAbasPainel('visao-geral');
}

/* ── CÁLCULO E CONTADORES DE MÉTRICAS DOS CARDS ── */
function atualizarContadoresCards() {
  // Puxa os dados salvos
  const favsArray = JSON.parse(localStorage.getItem("cs_favoritos") || "[]");
  const solsArray = JSON.parse(localStorage.getItem("cs_solicitacoes") || "[]");
  
  // Atualiza o card de favoritos
  if (document.getElementById("contadorTotalFavoritos")) {
    document.getElementById("contadorTotalFavoritos").textContent = favsArray.length;
  }

  // Ignora o que tiver status 'cancelado'
  const ativos = solsArray.filter(s => {
      const statusAtual = (s.status || '').toLowerCase();
      return statusAtual !== 'cancelado';
  });

  // Conta os andamentos ignorando letras maiúsculas ou espaços
  const totalAndamento = ativos.filter(s => {
    // Se o pedido não tiver status, ele assume 'andamento' como padrão
    const st = (s.status || 'andamento').toLowerCase(); 
    return st.includes('andamento') || st.includes('pendente');
  }).length;

  // Atualiza os números no painel
  if (document.getElementById("contadorTotalContratacoes")) {
    document.getElementById("contadorTotalContratacoes").textContent = ativos.length;
  }
  if (document.getElementById("contadorTotalAndamento")) {
    document.getElementById("contadorTotalAndamento").textContent = totalAndamento;
  }
}

/* ── LISTAS DE RESUMO INTERNAS DA ABA VISÃO GERAL ── */
function renderizarVisaoGeralListas() {
  const containerSols = document.getElementById("visaoGeralListaSolicitacoes");
  if (containerSols) {
    const listaGeral = JSON.parse(localStorage.getItem("cs_solicitacoes") || "[]");
    const ultimosTres = listaGeral.slice(-3).reverse();

    if (ultimosTres.length === 0) {
      containerSols.innerHTML = `<p style="font-size:0.85rem; color:#98a2b3; padding: 12px 0;">Nenhum serviço solicitado recentemente.</p>`;
    } else {
      containerSols.innerHTML = ultimosTres.map(s => {
        const nomeProf = s.profissionalNome || s.profissional || "Profissional";
        const tituloServico = s.profissionalNome ? s.servico : "Solicitação de Serviço";
        const statusLimpo = (s.status === 'pendente' || s.status === 'andamento') ? 'andamento' : 'concluido';

        return `
          <div class="solicitacao" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #f0f2f5; padding-bottom: 12px;">
            <div>
              <strong>${tituloServico}</strong>
              <p style="font-size: 0.8rem; color: #667085; margin: 4px 0 0 0;">Profissional: ${nomeProf} | ${s.data || 'A combinar'}</p>
            </div>
            <span class="${statusLimpo === 'andamento' ? 'badge-warn' : 'badge-ok'}">
              ${statusLimpo === 'andamento' ? 'Em andamento' : 'Concluído'}
            </span>
          </div>
        `;
      }).join('');
    }
  }

  const containerFavs = document.getElementById("visaoGeralListaFavoritos");
  if (containerFavs) {
    const listaFavoritosIds = JSON.parse(localStorage.getItem("cs_favoritos") || "[]");

    if (listaFavoritosIds.length === 0) {
      containerFavs.innerHTML = `<p style="font-size:0.85rem; color:#98a2b3; padding: 12px 0;">Nenhum profissional salvo nos favoritos.</p>`;
    } else {
      if (typeof getProfissionais === 'function') {
        getProfissionais().then(dadosDosProfissionais => {
          const filtrados = dadosDosProfissionais.filter(p => listaFavoritosIds.includes(p.id)).slice(0, 3);
          
          if (filtrados.length === 0) {
            containerFavs.innerHTML = `<p style="font-size:0.85rem; color:#98a2b3;">Profissionais favoritados em outras sessões.</p>`;
            return;
          }

          containerFavs.innerHTML = filtrados.map(p => `
            <div class="fav-card" style="cursor: pointer; display: inline-block; text-align: center; margin-right: 15px;" onclick="alternarAbasPainel('favoritos')">
              <img src="${p.foto}" alt="${p.nome}" onerror="this.src='https://i.pravatar.cc/40'" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover;">
              <span style="display: block; font-size: 0.75rem; color: #344054; margin-top: 5px;">${p.nome.split(' ')[0]}</span>
            </div>
          `).join('');
        }).catch(() => {
          containerFavs.innerHTML = `<p style="font-size:0.85rem; color:#98a2b3;">Erro ao ler banco db.js</p>`;
        });
      }
    }
  }
}

/* ── ABA ESTENDIDA: MÓDULO DE SOLICITAÇÕES COM FILTRO E DETALHES ── */
function mudarSubAbaSolicitacoes(statusFiltro) {
  abaSolicitacoesFiltro = statusFiltro;
  document.getElementById("subTabAndamento").classList.toggle("active", statusFiltro === 'andamento');
  document.getElementById("subTabHistorico").classList.toggle("active", statusFiltro === 'historico');
  renderizarModuloSolicitacoesCompleto();
}

function renderizarModuloSolicitacoesCompleto() {
  const containerAlvo = document.getElementById("painelFiltroSolicitacoesLista");
  if (!containerAlvo) return;

  const todasSolicitacoes = JSON.parse(localStorage.getItem("cs_solicitacoes") || "[]");
  
  const filtradas = todasSolicitacoes.filter(s => {
    const statusLimpo = (s.status === 'pendente' || s.status === 'andamento') ? 'andamento' : 'concluido';
    return statusLimpo === abaSolicitacoesFiltro;
  });

  if (filtradas.length === 0) {
    containerAlvo.innerHTML = `<div class="empty-state-p" style="padding: 20px; color: #667085; text-align: center;">Nenhuma solicitação encontrada nesta aba.</div>`;
    return;
  }

  containerAlvo.innerHTML = filtradas.reverse().map(s => {
    // Tratamento dos dados que vêm do perfil.js x mocks antigos
    const nomeProfissional = s.profissional || s.profissionalNome || "Profissional Direto";
    const tituloServico = s.profissional ? "Serviço Solicitado" : s.servico;
    const descricaoDetalhada = s.profissional ? s.servico : "Sem descrição adicional fornecida.";
    const statusLimpo = (s.status === 'pendente' || s.status === 'andamento') ? 'andamento' : 'concluido';
    
    // Identificador único para a função de cancelar
    const idUnico = s.timestamp || s.id;
    
    let enderecoFormatado = "Endereço não informado";
    if (s.endereco && typeof s.endereco === 'object') {
       enderecoFormatado = `${s.endereco.rua || ''}, ${s.endereco.numero || ''} - ${s.endereco.bairro || ''}, ${s.endereco.cidade || ''}`;
       enderecoFormatado = enderecoFormatado.replace(/^[,\s]+|[,\s]+$/g, '').replace(/,\s*-/, ' -');
    } else if (typeof s.endereco === 'string') {
       enderecoFormatado = s.endereco;
    }

    const badgeClass = (s.status === 'andamento' || s.status === 'pendente') ? 'badge-warn' : 'badge-ok';
    const badgeText = (s.status === 'andamento' || s.status === 'pendente') ? 'Em andamento' : 'Concluído';

    return `
      <div class="sol-card-painel-dinamico" style="background: #fff; border: 1px solid #eaecf0; border-radius: 8px; padding: 16px; margin-bottom: 16px; display: flex; flex-direction: column;">
        <div class="sol-card-content" style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
          <div class="sol-card-info">
            <h3 style="margin: 0 0 8px 0; color: #101828;">${tituloServico}</h3>
            <p style="margin: 0 0 12px 0; font-size: 0.9rem; color: #344054;"><strong>Profissional:</strong> ${nomeProfissional}</p>
            
            <div style="background: #f9fafb; padding: 10px; border-radius: 6px; font-size: 0.85rem; color: #475467;">
              <p style="margin: 0 0 6px 0;"><strong>📅 Agendado para:</strong> ${s.data || 'A combinar'} ${s.hora ? `às ${s.hora}` : ''}</p>
              <p style="margin: 0;"><strong>📍 Endereço do serviço:</strong> ${enderecoFormatado}</p>
            </div>
          </div>
          
          <div class="sol-card-status-desc" style="display: flex; flex-direction: column; align-items: flex-end;">
            <span class="${badgeClass}" style="margin-bottom: 15px; display: inline-block;">${badgeText}</span>
            <div style="display: flex; gap: 15px; align-items: center;">
              <span class="btn-cancelar-pedido" onclick="cancelarPedido('${idUnico}')" style="color: #b42318; font-size: 0.75rem; font-weight: 700; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: 0.2s;">CANCELAR</span>
              <span class="btn-ver-descricao" onclick="toggleDescricao(this)" style="color: #D64824; font-size: 0.75rem; font-weight: 700; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: 0.2s;">VER DESCRIÇÃO</span>
            </div>
          </div>
        </div>
        
        <div class="descricao-oculta" style="display: none; margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e4e7ec; color: #475467; font-size: 0.9rem;">
          <p><strong>Detalhes enviados:</strong> ${descricaoDetalhada}</p>
        </div>
      </div>
    `;
  }).join('');
}

// Alterna exibição da descrição do serviço
function toggleDescricao(botao) {
  const card = botao.closest('.sol-card-painel-dinamico');
  const caixaDescricao = card.querySelector('.descricao-oculta');

  if (caixaDescricao.style.display === 'none' || !caixaDescricao.style.display) {
    caixaDescricao.style.display = 'block';
    botao.innerText = 'OCULTAR DESCRIÇÃO';
  } else {
    caixaDescricao.style.display = 'none';
    botao.innerText = 'VER DESCRIÇÃO';
  }
}

// Ação de Cancelar Pedido
function cancelarPedido(identificador) {
  if (!confirm("Tem certeza que deseja cancelar esta solicitação?")) return;

  let todasSolicitacoes = JSON.parse(localStorage.getItem("cs_solicitacoes") || "[]");
  
  // Filtra removendo o pedido com o id ou timestamp correspondente
  todasSolicitacoes = todasSolicitacoes.filter(s => {
    const currentId = (s.timestamp || s.id).toString();
    return currentId !== identificador.toString();
  });

  localStorage.setItem("cs_solicitacoes", JSON.stringify(todasSolicitacoes));

  // Re-renderiza as listas para atualizar a tela instantaneamente
  renderizarModuloSolicitacoesCompleto();
  renderizarVisaoGeralListas();
  atualizarContadoresCards();
  mostrarNotificacaoToast("Pedido cancelado com sucesso.");
}


/* ── ABA ESTENDIDA: MÓDULO DE FAVORITOS EM GRID ESTILIZADO ── */
async function renderizarModuloFavoritosCompleto() {
  const gridAlvo = document.getElementById("painelFiltroFavoritosGrid") || document.getElementById("favoritosGrid");
  if (!gridAlvo) return;

  gridAlvo.innerHTML = '<div class="empty-state"><p>Carregando favoritos...</p></div>';

  try {
    const listaFavoritosIds = JSON.parse(localStorage.getItem("cs_favoritos") || "[]");

    if (listaFavoritosIds.length === 0) {
      gridAlvo.innerHTML = `
        <div class="empty-state" style="padding: 30px; text-align: center; color: #667085; width: 100%; grid-column: 1 / -1;">
          <p>Você ainda não tem profissionais favoritados.</p>
          <small>Explore a página inicial e clique no coração para salvar seus profissionais preferidos.</small>
        </div>
      `;
      return;
    }

    if (typeof getProfissionais === 'function') {
      const todosOsProfs = await getProfissionais();
      const profissionaisFavoritados = todosOsProfs.filter(p => listaFavoritosIds.includes(p.id));

      if (profissionaisFavoritados.length === 0) {
        gridAlvo.innerHTML = '<div class="empty-state"><p>Nenhum profissional encontrado.</p></div>';
        return;
      }

      gridAlvo.innerHTML = profissionaisFavoritados.map(p => {
        // CORREÇÃO DO [OBJECT OBJECT]: Verifica se a precificação é um objeto e extrai o valor numérico
        let precoReal = p.precificacao;
        if (typeof p.precificacao === 'object' && p.precificacao !== null) {
            precoReal = p.precificacao.valor || p.precificacao.preco || p.precificacao.minimo || '--';
        }

        return `
          <div class="fav-card-painel-dinamico">
            <div>
              <div class="fav-card-header">
                <img src="${p.foto}" alt="${p.nome}" class="fav-card-avatar" onerror="this.src='https://i.pravatar.cc/150?u=${p.id}'">
                <div>
                  <div class="fav-card-name">${p.nome}</div>
                  <div class="fav-card-title">${p.titulo}</div>
                </div>
              </div>
              <p style="font-size: 0.85rem; color: #667085; margin-bottom: 8px;">📍 ${p.cidade || 'Recife'}</p>
              <p style="font-size: 1rem; color: #091E3F; font-weight: 700;">R$ ${precoReal}/hora</p>
            </div>
            
            <div class="fav-card-actions">
              <button class="btn-remover-fav-dinamico" onclick="removerFavoritoDoPainelDirect('${p.id}')">Remover Favorito</button>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (erro) {
    console.error("Erro ao carregar a aba de favoritos:", erro);
    gridAlvo.innerHTML = `<div class="empty-state-p">Erro na comunicação com o banco de dados.</div>`;
  }
}

function removerFavoritoDoPainelDirect(idProfissional) {
  let listaIds = JSON.parse(localStorage.getItem("cs_favoritos") || "[]");
  listaIds = listaIds.filter(id => id !== idProfissional);

  localStorage.setItem("cs_favoritos", JSON.stringify(listaIds));
  localStorage.setItem("cs_favorites", JSON.stringify(listaIds));

  renderizarModuloFavoritosCompleto();
  renderizarVisaoGeralListas(); 
  atualizarContadoresCards();
  mostrarNotificacaoToast("Profissional removido com sucesso.");
}

/* ── GERENCIADOR DE SEGURANÇA INTERNA (SENHAS) ── */
function alterarSenhaSeguranca() {
  const senhaAtual = document.getElementById("inputSenhaAtual").value;
  const novaSenha = document.getElementById("inputNovaSenha").value;
  const confSenha = document.getElementById("inputConfirmarSenha").value;

  if (!senhaAtual || !novaSenha || !confSenha) {
    mostrarNotificacaoToast("Erro: Todos os campos de validação de senha são mandatórios.");
    return;
  }
  if (novaSenha !== confSenha) {
    mostrarNotificacaoToast("Erro: A nova senha e a confirmação divergem.");
    return;
  }

  mostrarNotificacaoToast("Senha de acesso atualizada com sucesso!");
  document.getElementById("inputSenhaAtual").value = "";
  document.getElementById("inputNovaSenha").value = "";
  document.getElementById("inputConfirmarSenha").value = "";
  alternarAbasPainel('visao-geral');
}

function toggleSenha(idInputAlvo) {
  const elementoInput = document.getElementById(idInputAlvo);
  if (!elementoInput) return;
  elementoInput.type = elementoInput.type === "password" ? "text" : "password";
}

/* ── TOAST CONTAINER E NOTIFICAÇÕES FLOATING ── */
function mostrarNotificacaoToast(mensagem) {
  const container = document.getElementById("toastContainer");
  if (!container) {
    alert(mensagem);
    return;
  }

  const boxToast = document.createElement("div");
  boxToast.style.padding = "14px 20px";
  boxToast.style.background = "#091E3F";
  boxToast.style.color = "#ffffff";
  boxToast.style.fontSize = "0.88rem";
  boxToast.style.fontWeight = "500";
  boxToast.style.borderRadius = "10px";
  boxToast.style.marginBottom = "8px";
  boxToast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
  boxToast.textContent = mensagem;

  container.appendChild(boxToast);
  setTimeout(() => { boxToast.remove(); }, 3500);
}

function sair() {
  if (typeof clearSession === 'function') clearSession();
  window.location.href = "../../index.html";
}