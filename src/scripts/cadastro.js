/* ══════════════════════════════════════════
   cadastro.js v2
   ══════════════════════════════════════════ */

/* Variável global que armazena qual tipo de conta está selecionado no momento ('cliente' ou 'profissional') */
let tipoContaAtual = 'cliente';

/**
 * Altera visualmente e logicamente o tipo de conta (Cliente ou Profissional)
 */
function selecionarTipo(tipo) {
  /* Atualiza a variável global com o tipo escolhido */
  tipoContaAtual = tipo;
  
  /* Remove a classe de seleção de todos os botões/opções de tipo de conta */
  document.querySelectorAll('.type-option').forEach(c => c.classList.remove('selected'));
  
  /* Adiciona a classe 'selected' apenas no elemento que foi clicado (ex: 'tipo-cliente' ou 'tipo-profissional') */
  const elementoSelecionado = document.getElementById('tipo-' + tipo);
  if (elementoSelecionado) elementoSelecionado.classList.add('selected');

  /* INTERFACE DINÂMICA: Altera o esquema de cores com base na seleção sem danificar o layout */
  const wrapper = document.querySelector('.cadastro-wrapper');
  if (wrapper) {
    if (tipo === 'profissional') {
      wrapper.classList.add('mode-profissional');
    } else {
      wrapper.classList.remove('mode-profissional');
    }
  }

  /* Busca o bloco de campos extras que só os profissionais preenchem */
  const extras = document.getElementById('extrasProfissional');
  
  /* Se o bloco existir, exibe como 'flex' se for profissional, ou esconde com 'none' se for cliente */
  if (extras) extras.style.display = tipo === 'profissional' ? 'flex' : 'none';
}

/**
 * Controla a navegação entre os painéis (etapas) do formulário de cadastro
 */
function irStep(num) {
  /* Esconde todos os painéis de etapas removendo a classe 'visible' */
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('visible'));
  
  /* Busca o painel da etapa atual (ex: 'panel1', 'panel2') */
  const panel = document.getElementById('panel' + num);
  
  /* Se o painel existir, adiciona a classe 'visible' para fazê-lo aparecer na tela */
  if (panel) panel.classList.add('visible');

  /* Atualiza os indicadores visuais (números/bolinhas) das etapas 1, 2 e 3 */
  [1, 2, 3].forEach(i => {
    const s = document.getElementById('s' + i);
    if (!s) return; /* Se o indicador não for encontrado, ignora e pula para o próximo */
    
    /* Reseta o estado do indicador removendo as classes de ativo e concluído */
    s.classList.remove('active', 'done');
    
    /* Se for a etapa atual que o usuário está vendo, marca como 'active' */
    if (i === num)  s.classList.add('active');
    
    /* Se for uma etapa anterior à que ele está vendo, marca como concluída ('done') */
    if (i < num)    s.classList.add('done');
  });
  
  /* Atualiza as linhas conectoras entre as etapas (line1 e line2) */
  [1, 2].forEach(i => {
    const l = document.getElementById('line' + i);
    
    /* Adiciona a classe 'done' se a linha estiver antes da etapa atual, senão remove */
    if (l) l.toggle('done', i < num);
  });
}

/**
 * Processa o envio do formulário, valida os dados e gera o objeto do usuário
 */
function handleCadastro(e) {
  /* Impede que a página recarregue ao enviar o formulário (comportamento padrão do HTML) */
  e.preventDefault();

  /* Captura os valores digitados nos campos, limpando espaços extras (.trim()) e padronizando o e-mail em minúsculas */
  const nome  = document.getElementById('nome').value.trim();
  const email = document.getElementById('emailCad').value.trim().toLowerCase();
  const senha = document.getElementById('senhaCad').value;
  const conf  = document.getElementById('senhaConf').value;
  const erroEl = document.getElementById('cadErro'); /* Elemento de texto onde as mensagens de erro aparecem */

  /* Oculta o painel de erro antes de iniciar uma nova validação */
  if (erroEl) erroEl.style.display = 'none';

  /* Validação 1: Verifica se algum dos campos essenciais está vazio */
  if (!nome || !email || !senha) {
    if (erroEl) {
      erroEl.textContent = 'Preencha todos os campos obrigatórios.';
      erroEl.style.display = 'block';
    }
    return;
  }
  
  /* Validação 2: Exige tamanho mínimo de 6 caracteres para a segurança da senha */
  if (senha.length < 6) {
    if (erroEl) {
      erroEl.textContent = 'A senha deve ter ao menos 6 caracteres.';
      erroEl.style.display = 'block';
    }
    return;
  }
  
  /* Validação 3: Verifica se a confirmação de senha é idêntica à senha digitada */
  if (senha !== conf) {
    if (erroEl) {
      erroEl.textContent = 'As senhas não coincidem.';
      erroEl.style.display = 'block';
    }
    return;
  }

  /* Monta a estrutura do novo usuário se todas as validações passarem */
  const novoUsuario = {
    id: 'u' + Date.now(), /* Gera um ID único baseado na data e milissegundo atual */
    nome,
    email,
    senha,
    role: tipoContaAtual, /* Atribui se é cliente ou profissional */
    foto: `https://i.pravatar.cc/150?u=${email}`, /* Gera um avatar aleatório padrão usando o e-mail como semente */
    /* Captura a cidade do input se ele existir, caso contrário define 'Recife' como padrão */
    cidade: document.getElementById('cidadeCad')?.value || 'Recife',
    estado: 'PE',
    cadastradoEm: new Date().toISOString().split('T')[0] /* Salva a data atual no formato Ano-Mês-Dia */
  };

  /* Salva o usuário recém-criado na sessão */
  if (typeof setSession === 'function') {
    setSession(novoUsuario);
  }
  
  /* Avança o formulário de cadastro para a etapa 3 (geralmente uma tela de sucesso/boas-vindas) */
  irStep(3);
}

/* Evento disparado assim que toda a estrutura HTML da página é carregada */
document.addEventListener('DOMContentLoaded', () => {
  /* Inicializa a página configurando o tipo de conta padrão como 'cliente' */
  selecionarTipo('cliente');
  
  /* Garante que o fluxo de telas comece na primeira etapa (Painel 1) */
  irStep(1);
});