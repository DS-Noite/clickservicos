/* ══════════════════════════════════════════
   perfil.js — Perfil do profissional
   Lê ?id= da URL, carrega do db.json
   ══════════════════════════════════════════ */

/* ── Inicialização do Perfil ── */
async function initPerfil() {
  /* Atualiza os componentes visuais do cabeçalho caso haja um usuário logado */
  aplicarSessaoNaUI();

  // Pega o ID da URL
  /* Instancia o utilitário para mapear os parâmetros passados na barra de endereço (ex: ?id=u123&origem=home) */
  const params = new URLSearchParams(window.location.search);
  /* Captura especificamente o valor associado ao parâmetro 'id' */
  const id = params.get('id');

  /* Se nenhum ID tiver sido passado na URL, barra a execução e manda o visitante de volta para a home */
  if (!id) {
     window.location.href = 'home.html';
     return;
  }

  try {
    /* Faz a busca assíncrona no banco de dados local filtrando por este ID (função declarada no db.js) */
    const prof = await getProfissionalById(id);
    
    /* Se o ID existir na URL mas não corresponder a nenhum profissional cadastrado no JSON */
    if (!prof) {
       document.getElementById('perfilContent').innerHTML = `
         <p style="padding:3rem;text-align:center;color:var(--text-3)">
           Profissional não encontrado.
         </p>
       `;
       return;
    }
    /* Havendo sucesso na localização, dispara a função de preenchimento dos dados do profissional */
    renderPerfil(prof);
  } catch (e) {
    /* Captura e registra falhas inesperadas no fluxo de carregamento */
    console.error('[perfil.js] Erro:', e);
  }
}

/* ── Renderização das Informações Públicas do Perfil ── */
function renderPerfil(p) {
  // Atualiza a tag <title> da aba do navegador dinamicamente com o nome do profissional
  document.title = `${p.nome} — ClickServiços`;

  // ── IDENTITY CARD (Cartão de Identidade Principal) ──
  /* Injeta foto, nome, especialidade, localização e biografia nos respectivos elementos HTML */
  document.getElementById('idAvatar').src = p.foto;
  document.getElementById('idName').textContent = p.nome;
  document.getElementById('idRole').textContent = p.titulo;
  document.getElementById('idLocation').textContent = `📍 ${p.cidade}, ${p.estado}`;
  document.getElementById('idDesc').textContent = p.descricao;
  /* Controla a cor do indicador visual redondo alterando a classe CSS com base na ocupação */
  document.getElementById('idDot').className = 'identity-dot ' + (p.status === 'ocupado' ? 'ocupado' : '');

  // Quick stats: Estatísticas numéricas rápidas de cabeçalho
  document.getElementById('statEstrelas').textContent = p.estrelas.toFixed(1); // Força uma casa decimal
  document.getElementById('statAvaliacoes').textContent = p.totalAvaliacoes;
  document.getElementById('statTempo').textContent = p.tempoPlatforma + 'm'; // Adiciona sufixo de meses

  // ── INFO CARD (Bloco de Informações de Contratação) ──
  document.getElementById('infoHorario').textContent = p.horario;
  document.getElementById('infoPreco').textContent = formatarPreco(p.precificacao); // Chama formatação monetária do db.js
  document.getElementById('infoStatus').innerHTML = `<div class="badge badge--${p.status}">${p.status}</div>`;
  /* Injeta o gênero capitalizando apenas a primeira letra da palavra (ex: "masculino" vira "Masculino") */
  document.getElementById('infoGenero').textContent = p.genero.charAt(0).toUpperCase() + p.genero.slice(1);

  // ── SERVIÇOS ──
  /* Mapeia a lista de especialidades do profissional criando pequenas pílulas de tags de texto */
  document.getElementById('servicosGrid').innerHTML = p.servicos
    .map(s => `<span class="service-tag">${s}</span>`)
    .join('');

  // ── TRABALHOS ANTERIORES (Portfólio Dinâmico) ──
  const clContainer = document.getElementById('cardlinksGrid');
  
  /* Caso o profissional não possua nenhuma foto ou histórico de trabalho prévio cadastrado */
  if (p.cardLinks.length === 0) {
     clContainer.innerHTML = `<div class="cardlinks-empty">Nenhum trabalho registrado ainda.</div>`;
  } else {
     /* Renderiza os blocos estruturados exibindo a comparação lado a lado de "Antes" e "Depois" */
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

  // ── AVALIAÇÕES (Lista de Feedbacks dos Clientes) ──
  /* Injeta a nota média e monta uma string repetindo caracteres de estrelas cheias e vazias */
  document.getElementById('reviewScore').textContent = p.estrelas.toFixed(1);
  document.getElementById('reviewStars').textContent = '★'.repeat(Math.round(p.estrelas)) + '☆'.repeat(5 - Math.round(p.estrelas));
  document.getElementById('reviewTotal').textContent = p.totalAvaliacoes + ' avaliações';

  const reviewList = document.getElementById('reviewList');
  
  /* Caso a lista de depoimentos e comentários esteja completamente vazia */
  if (p.avaliacoes.length === 0) {
     reviewList.innerHTML = `<p style="color:var(--text-3);font-size:.9rem">Ainda sem avaliações escritas.</p>`;
  } else {
     /* Varre o array de avaliações criando a listagem de comentários estruturados dos clientes */
     reviewList.innerHTML = p.avaliacoes.map(av => `
       <div class="review-item">
         <div class="review-header">
           <div class="reviewer">
             <img src="${av.clienteFoto}" alt="${av.clienteNome}" onerror="this.src='https://i.pravatar.cc/36'">
             <div>
               <div class="reviewer-name">${av.clienteNome}</div>
               <div class="reviewer-date">${formatarData(av.data)}</div> </div>
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

/* ── Acionamento de Contato ── */
/* Dispara uma janela modal de alerta nativa simulando a abertura de uma futura janela de chat */
function abrirChat(nome) {
  alert(`💬 Chat com ${nome}\n\nFuncionalidade de bate-papo chegando em breve!`);
}

/* Aguarda o carregamento estrutural completo do HTML para disparar a renderização do perfil */
document.addEventListener('DOMContentLoaded', initPerfil);