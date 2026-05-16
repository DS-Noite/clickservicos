/* ══════════════════════════════════════════
   auth.js — Gerenciamento de sessão local
   Usa localStorage como "sessão"
   ══════════════════════════════════════════ */

/* Define a chave de identificação que será usada para salvar e buscar os dados da sessão no navegador */
const AUTH_KEY = 'cs_session';

/**
 * Retorna o usuário logado ou null
 */
function getSession() {
  /* Tenta buscar o texto bruto (string) armazenado na chave definida */
  const raw = localStorage.getItem(AUTH_KEY);
  
  /* Se não existir nada guardado, retorna null (não logado) */
  if (!raw) return null;
  
  try { 
    /* Como o localStorage só guarda texto, converte o texto JSON de volta para um Objeto JavaScript */
    return JSON.parse(raw); 
  }
  catch { 
    /* Se o texto estiver corrompido ou malformado, captura o erro e retorna null */
    return null; 
  }
}

/**
 * Salva sessão no localStorage
 */
function setSession(usuario) {
  /* Converte o objeto de dados do usuário em uma string JSON e o grava no localStorage */
  localStorage.setItem(AUTH_KEY, JSON.stringify(usuario));
}

/**
 * Remove sessão (logout)
 */
function clearSession() {
  /* Apaga permanentemente o registro da sessão do armazenamento local */
  localStorage.removeItem(AUTH_KEY);
}

/**
 * Redireciona se não estiver logado
 * @param {string} redirect - URL de destino após login
 */
function requireAuth(redirect = '/') {
  /* Verifica se existe uma sessão ativa */
  const session = getSession();
  
  /* Se NÃO houver usuário logado, força o navegador a ir para a página de redirecionamento */
  if (!session) {
     window.location.href = redirect;
  }
  
  /* Retorna os dados da sessão caso o usuário esteja devidamente autenticado */
  return session;
}

/**
 * Redireciona se já estiver logado (útil na página de login)
 * @param {string} destino - ex: 'home.html'
 */
function redirectIfLoggedIn(destino = 'home.html') {
  /* Verifica se existe uma sessão ativa */
  const session = getSession();
  
  /* Se o usuário JÁ estiver logado, impede que ele veja a página atual (como login/cadastro) e o manda para o destino */
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
    /* Faz a requisição assíncrona para buscar os dados fictícios do banco de dados (provavelmente uma função fetch externa) */
    const db = await fetchDB();
    
    /* Procura na lista de usuários um e-mail que coincida (removendo espaços extras e ignorando maiúsculas/minúsculas) e a senha correta */
    const usuario = db.usuarios.find(
       u => u.email === email.trim().toLowerCase() && u.senha === senha
    );

    /* Se nenhum usuário com esses dados for encontrado, retorna uma resposta de falha */
    if (!usuario) {
       return { ok: false, erro: 'E-mail ou senha incorretos.' };
    }

    /* Cria um novo objeto copiando todas as propriedades do usuário localizado (usando o operador spread ...) */
    const sessao = { ...usuario };
    
    /* Verifica se o usuário que está logando possui a função/role de 'profissional' */
    if (usuario.role === 'profissional') {
       /* Busca na tabela/lista de profissionais o perfil correspondente ao ID deste usuário */
       const perfil = db.profissionais.find(p => p.usuarioId === usuario.id);
       
       /* Se encontrar o perfil do profissional, anexa o ID desse perfil dentro dos dados da sessão */
       if (perfil) sessao.perfilId = perfil.id;
    }

    /* Grava os dados finais estruturados no localStorage */
    setSession(sessao);
    
    /* Retorna uma resposta de sucesso junto com o objeto da sessão criada */
    return { ok: true, usuario: sessao };

  } catch (e) {
    /* Captura qualquer erro de conexão ou leitura do fetchDB e retorna um aviso amigável */
    return { ok: false, erro: 'Erro ao acessar o banco de dados.' };
  }
}

/**
 * Exibe o nome do usuário logado em elementos com [data-user-name]
 * Exibe a foto em elementos com [data-user-foto]
 * Esconde elementos [data-auth="guest"] se logado e vice-versa
 */
function aplicarSessaoNaUI() {
  /* Obtém o estado atual da sessão */
  const session = getSession();

  /* Procura todos os elementos HTML que possuam o atributo 'data-user-name' */
  document.querySelectorAll('[data-user-name]').forEach(el => {
     /* Se houver sessão, pega o nome completo, divide pelos espaços e exibe apenas o primeiro nome. Se não, exibe 'Visitante' */
     el.textContent = session ? session.nome.split(' ')[0] : 'Visitante';
  });

  /* Procura todos os elementos HTML que possuam o atributo 'data-user-foto' (geralmente tags <img>) */
  document.querySelectorAll('[data-user-foto]').forEach(el => {
     /* Se houver uma sessão válida e ela tiver uma propriedade 'foto', define essa foto como a origem (src) da imagem */
     if (session?.foto) el.src = session.foto;
  });

  /* Procura elementos que só devem sumir ou aparecer para usuários estritamente logados */
  document.querySelectorAll('[data-auth="logado"]').forEach(el => {
     /* Se estiver logado, redefine o estilo display para o padrão (visível). Se não estiver, oculta com 'none' */
     el.style.display = session ? '' : 'none';
  });

  /* Procura elementos voltados apenas para visitantes/visitantes não autenticados (guests) */
  document.querySelectorAll('[data-auth="guest"]').forEach(el => {
     /* Se houver usuário logado, oculta o elemento. Se for visitante, deixa visível */
     el.style.display = session ? 'none' : '';
  });
}