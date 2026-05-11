/* ══════════════════════════════════════════
   auth.js — Gerenciamento de sessão local
   Usa localStorage como "sessão"
   ══════════════════════════════════════════ */

const AUTH_KEY = 'cs_session';

/**
 * Retorna o usuário logado ou null
 */
function getSession() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch { return null; }
}

/**
 * Salva sessão no localStorage
 */
function setSession(usuario) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(usuario));
}

/**
 * Remove sessão (logout)
 */
function clearSession() {
  localStorage.removeItem(AUTH_KEY);
}

/**
 * Redireciona se não estiver logado
 * @param {string} redirect - URL de destino após login
 */
function requireAuth(redirect = '/') {
  const session = getSession();
  if (!session) {
    window.location.href = redirect;
  }
  return session;
}

/**
 * Redireciona se já estiver logado (útil na página de login)
 * @param {string} destino - ex: 'home.html'
 */
function redirectIfLoggedIn(destino = 'home.html') {
  const session = getSession();
  if (session) {
    window.location.href = destino;
  }
}

/**
 * Faz login: busca no db.json, valida, salva sessão
 * @param {string} email
 * @param {string} senha
 * @returns {Promise<{ok: boolean, erro?: string, usuario?: object}>}
 */
async function fazerLogin(email, senha) {
  try {
    const db = await fetchDB();
    const usuario = db.usuarios.find(
      u => u.email === email.trim().toLowerCase() && u.senha === senha
    );

    if (!usuario) {
      return { ok: false, erro: 'E-mail ou senha incorretos.' };
    }

    // Enriquece sessão com dados do profissional, se for o caso
    const sessao = { ...usuario };
    if (usuario.role === 'profissional') {
      const perfil = db.profissionais.find(p => p.usuarioId === usuario.id);
      if (perfil) sessao.perfilId = perfil.id;
    }

    setSession(sessao);
    return { ok: true, usuario: sessao };

  } catch (e) {
    return { ok: false, erro: 'Erro ao acessar o banco de dados.' };
  }
}

/**
 * Exibe o nome do usuário logado em elementos com [data-user-name]
 * Exibe a foto em elementos com [data-user-foto]
 * Esconde elementos [data-auth="guest"] se logado e vice-versa
 */
function aplicarSessaoNaUI() {
  const session = getSession();

  document.querySelectorAll('[data-user-name]').forEach(el => {
    el.textContent = session ? session.nome.split(' ')[0] : 'Visitante';
  });

  document.querySelectorAll('[data-user-foto]').forEach(el => {
    if (session?.foto) el.src = session.foto;
  });

  document.querySelectorAll('[data-auth="logado"]').forEach(el => {
    el.style.display = session ? '' : 'none';
  });

  document.querySelectorAll('[data-auth="guest"]').forEach(el => {
    el.style.display = session ? 'none' : '';
  });
}
