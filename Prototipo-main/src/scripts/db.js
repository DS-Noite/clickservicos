/* ══════════════════════════════════════════
   db.js — Helpers para acessar o db.json
   Centraliza todo fetch de dados locais
   ══════════════════════════════════════════ */

const DB_URL = '../../db.json';

// Cache em memória pra não fazer múltiplos fetches
let _cache = null;

/**
 * Busca o db.json e retorna como objeto.
 * Faz cache automático na primeira chamada.
 */
async function fetchDB() {
  if (_cache) return _cache;
  try {
    // Resolve o caminho relativo dependendo de onde está o arquivo que chama
    const paths = ['./db.json', '../db.json', '../../db.json'];
    for (const path of paths) {
      try {
        const res = await fetch(path);
        if (res.ok) {
          _cache = await res.json();
          return _cache;
        }
      } catch { /* tenta o próximo */ }
    }
    throw new Error('db.json não encontrado');
  } catch (e) {
    console.error('[db.js] Erro ao carregar db.json:', e);
    throw e;
  }
}

/**
 * Retorna todos os profissionais
 */
async function getProfissionais() {
  const db = await fetchDB();
  return db.profissionais;
}

/**
 * Retorna profissional pelo ID
 */
async function getProfissionalById(id) {
  const db = await fetchDB();
  return db.profissionais.find(p => p.id === id) || null;
}

/**
 * Filtra profissionais
 * @param {object} filtros - { servico, cidade, genero, status, minEstrelas, ordenar }
 */
async function filtrarProfissionais(filtros = {}) {
  const todos = await getProfissionais();
  let resultado = [...todos];

  if (filtros.servico) {
    resultado = resultado.filter(p =>
      p.servicos.some(s => s.toLowerCase().includes(filtros.servico.toLowerCase())) ||
      p.titulo.toLowerCase().includes(filtros.servico.toLowerCase())
    );
  }

  if (filtros.cidade) {
    resultado = resultado.filter(p =>
      p.cidade.toLowerCase() === filtros.cidade.toLowerCase()
    );
  }

  if (filtros.genero && filtros.genero !== 'todos') {
    resultado = resultado.filter(p => p.genero === filtros.genero);
  }

  if (filtros.status && filtros.status !== 'todos') {
    resultado = resultado.filter(p => p.status === filtros.status);
  }

  if (filtros.minEstrelas) {
    resultado = resultado.filter(p => p.estrelas >= parseFloat(filtros.minEstrelas));
  }

  // Ordenação
  if (filtros.ordenar === 'estrelas') {
    resultado.sort((a, b) => b.estrelas - a.estrelas);
  } else if (filtros.ordenar === 'tempo') {
    resultado.sort((a, b) => b.tempoPlatforma - a.tempoPlatforma);
  } else if (filtros.ordenar === 'avaliacoes') {
    resultado.sort((a, b) => b.totalAvaliacoes - a.totalAvaliacoes);
  }

  return resultado;
}

/**
 * Retorna todas as categorias
 */
async function getCategorias() {
  const db = await fetchDB();
  return db.categorias;
}

/**
 * Formata precificação para exibição
 * ex: { tipo: 'hora', valor: 80 } → "R$ 80/hora"
 */
function formatarPreco(precificacao) {
  if (!precificacao) return '–';
  if (precificacao.tipo === 'negociar') return 'A negociar';
  if (precificacao.tipo === 'hora') return `R$ ${precificacao.valor}/hora`;
  if (precificacao.tipo === 'fechado') return `A partir de R$ ${precificacao.valor}`;
  return '–';
}

/**
 * Gera estrelas HTML como string
 */
function renderStars(nota, total = null) {
  const cheia = Math.floor(nota);
  const meia = nota % 1 >= 0.5;
  let html = '<span class="stars">';
  for (let i = 0; i < 5; i++) {
    if (i < cheia) html += '★';
    else if (i === cheia && meia) html += '½';
    else html += '☆';
  }
  html += ` ${nota.toFixed(1)}`;
  if (total) html += `<span>(${total})</span>`;
  html += '</span>';
  return html;
}

/**
 * Formata data ISO para pt-BR
 */
function formatarData(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
