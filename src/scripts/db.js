/* ══════════════════════════════════════════
   db.js — Helpers para acessar o db.json
   Centraliza todo fetch de dados locais
   ══════════════════════════════════════════ */

/* Define um caminho padrão inicial para localizar o arquivo db.json */
const DB_URL = '../../db.json';

// Cache em memória pra não fazer múltiplos fetches
/* Variável global que guardará os dados após a primeira requisição, evitando requisições repetidas ao arquivo */
let _cache = null;

/**
 * Busca o db.json e retorna como objeto.
 * Faz cache automático na primeira chamada.
 */
async function fetchDB() {
  /* Se o cache já tiver os dados guardados, retorna-os imediatamente sem fazer um novo fetch */
  if (_cache) return _cache;
  try {
    // Resolve o caminho relativo dependendo de onde está o arquivo que chama
    /* Lista de caminhos possíveis para encontrar o db.json a partir de diferentes pastas do projeto */
    const paths = ['./db.json', '../db.json', '../../db.json'];
    
    /* Percorre cada caminho da lista tentando carregar o arquivo */
    for (const path of paths) {
      try {
        const res = await fetch(path);
        /* Se a resposta for bem-sucedida (status 200), converte para JSON, salva no cache e retorna */
        if (res.ok) {
          _cache = await res.json();
          return _cache;
        }
      } catch { /* Se falhar em um caminho, o bloco catch ignora silenciosamente e tenta o próximo caminho do loop */ }
    }
    /* Se o loop terminar e nenhum caminho funcionar, dispara um erro customizado */
    throw new Error('db.json não encontrado');
  } catch (e) {
    /* Trata falhas críticas na leitura do arquivo e exibe um alerta no console do desenvolvedor */
    console.error('[db.js] Erro ao carregar db.json:', e);
    throw e;
  }
}

/**
 * Retorna todos os profissionais
 */
async function getProfissionais() {
  /* Aguarda a leitura do banco de dados e retorna a lista/array específica de profissionais */
  const db = await fetchDB();
  return db.profissionais;
}

/**
 * Retorna profissional pelo ID
 */
async function getProfissionalById(id) {
  /* Aguarda a listagem de dados e procura o profissional cujo ID seja estritamente igual ao solicitado */
  const db = await fetchDB();
  return db.profissionais.find(p => p.id === id) || null; /* Retorna null caso o ID não exista */
}

/**
 * Filtra profissionais
 * @param {object} filtros - { servico, cidade, genero, status, minEstrelas, ordenar }
 */
async function filtrarProfissionais(filtros = {}) {
  /* Obtém a lista completa original de profissionais */
  const todos = await getProfissionais();
  /* Cria uma cópia da lista original para aplicar os filtros sem modificar a fonte principal */
  let resultado = [...todos];

  /* Filtro 1: Filtra por termo de busca no serviço ou título da profissão */
  if (filtros.servico) {
    resultado = resultado.filter(p =>
      /* Verifica se alguma tag de serviço inclui o termo digitado (ignorando maiúsculas/minúsculas) */
      p.servicos.some(s => s.toLowerCase().includes(filtros.servico.toLowerCase())) ||
      /* Ou verifica se o título principal do profissional inclui o termo pesquisado */
      p.titulo.toLowerCase().includes(filtros.servico.toLowerCase())
    );
  }

  /* Filtro 2: Filtra pela cidade de atuação de forma exata */
  if (filtros.cidade) {
    resultado = resultado.filter(p =>
      p.cidade.toLowerCase() === filtros.cidade.toLowerCase()
    );
  }

  /* Filtro 3: Filtra por gênero (ignora se a opção selecionada for 'todos') */
  if (filtros.genero && filtros.genero !== 'todos') {
    resultado = resultado.filter(p => p.genero === filtros.genero);
  }

  /* Filtro 4: Filtra por status de disponibilidade (ignora se a opção selecionada for 'todos') */
  if (filtros.status && filtros.status !== 'todos') {
    resultado = resultado.filter(p => p.status === filtros.status);
  }

  /* Filtro 5: Filtra por nota mínima de avaliação (estrelas) */
  if (filtros.minEstrelas) {
    /* Converte o filtro para número decimal e mantém os profissionais com nota igual ou superior */
    resultado = resultado.filter(p => p.estrelas >= parseFloat(filtros.minEstrelas));
  }

  // Ordenação
  /* Ordena a lista de resultados com base no critério selecionado */
  if (filtros.ordenar === 'estrelas') {
    /* Classifica em ordem decrescente de nota (Maior para Menor) */
    resultado.sort((a, b) => b.estrelas - a.estrelas);
  } else if (filtros.ordenar === 'tempo') {
    /* Classifica em ordem decrescente pelo tempo de plataforma do profissional */
    resultado.sort((a, b) => b.tempoPlatforma - a.tempoPlatforma);
  } else if (filtros.ordenar === 'avaliacoes') {
    /* Classifica em ordem decrescente pela quantidade total de avaliações recebidas */
    resultado.sort((a, b) => b.totalAvaliacoes - a.totalAvaliacoes);
  }

  /* Retorna a lista final tratada, filtrada e ordenada */
  return resultado;
}

/**
 * Retorna todas as categorias
 */
async function getCategorias() {
  /* Aguarda o carregamento do banco de dados e retorna a lista de categorias do sistema */
  const db = await fetchDB();
  return db.categorias;
}

/**
 * Formata precificação para exibição
 * ex: { tipo: 'hora', valor: 80 } → "R$ 80/hora"
 */
function formatarPreco(precificacao) {
  /* Retorna um traço se o objeto de preço não existir */
  if (!precificacao) return '–';
  /* Se o tipo for combinar diretamente com o cliente */
  if (precificacao.tipo === 'negociar') return 'A negociar';
  /* Se a cobrança for estipulada por hora */
  if (precificacao.tipo === 'hora') return `R$ ${precificacao.valor}/hora`;
  /* Se o valor for uma estimativa inicial mínima para o projeto */
  if (precificacao.tipo === 'fechado') return `A partir de R$ ${precificacao.valor}`;
  return '–';
}

/**
 * Gera estrelas HTML como string
 */
function renderStars(nota, total = null) {
  /* Obtém a parte inteira da nota (ex: 4.5 vira 4) para desenhar as estrelas cheias */
  const cheia = Math.floor(nota);
  /* Verifica se a sobra decimal é igual ou maior que 0.5 para decidir se exibe meia estrela */
  const meia = nota % 1 >= 0.5;
  let html = '<span class="stars">';
  
  /* Monta um laço fixo de 5 iterações para gerar as 5 estrelas do bloco */
  for (let i = 0; i < 5; i++) {
    if (i < cheia) html += '★'; // Insere caractere de estrela preenchida
    else if (i === cheia && meia) html += '½'; // Insere caractere de meia estrela
    else html += '☆'; // Insere caractere de estrela vazia
  }
  
  /* Converte a nota para exibir obrigatoriamente uma casa decimal (ex: "4.0" ou "4.5") */
  html += ` ${nota.toFixed(1)}`;
  
  /* Se a quantidade total de votos/avaliações for informada, anexa ela entre parênteses ao final */
  if (total) html += `<span>(${total})</span>`;
  html += '</span>';
  
  /* Retorna a estrutura string de texto HTML pronta para ser injetada na tela */
  return html;
}

/**
 * Formata data ISO para pt-BR
 */
function formatarData(iso) {
  /* Retorna vazio caso nenhuma data bruta seja passada */
  if (!iso) return '';
  /* Transforma a string de data (ex: "2026-05-15") em um objeto de data do JavaScript */
  const d = new Date(iso);
  /* Converte e retorna a data adaptada às regras brasileiras (ex: "15 de mai. de 2026") */
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}