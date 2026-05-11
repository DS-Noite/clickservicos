/* ══════════════════════════════════════════
   cadastro.js v2
   ══════════════════════════════════════════ */

let tipoContaAtual = 'cliente';

function selecionarTipo(tipo) {
  tipoContaAtual = tipo;
  document.querySelectorAll('.type-option').forEach(c => c.classList.remove('selected'));
  document.getElementById('tipo-' + tipo).classList.add('selected');

  const extras = document.getElementById('extrasProfissional');
  if (extras) extras.style.display = tipo === 'profissional' ? 'flex' : 'none';
}

function irStep(num) {
  // Esconde todos os painéis
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('visible'));
  const panel = document.getElementById('panel' + num);
  if (panel) panel.classList.add('visible');

  // Atualiza indicadores
  [1, 2, 3].forEach(i => {
    const s = document.getElementById('s' + i);
    if (!s) return;
    s.classList.remove('active', 'done');
    if (i === num)  s.classList.add('active');
    if (i < num)    s.classList.add('done');
  });
  [1, 2].forEach(i => {
    const l = document.getElementById('line' + i);
    if (l) l.classList.toggle('done', i < num);
  });
}

function handleCadastro(e) {
  e.preventDefault();

  const nome  = document.getElementById('nome').value.trim();
  const email = document.getElementById('emailCad').value.trim().toLowerCase();
  const senha = document.getElementById('senhaCad').value;
  const conf  = document.getElementById('senhaConf').value;
  const erroEl = document.getElementById('cadErro');

  erroEl.style.display = 'none';

  if (!nome || !email || !senha) {
    erroEl.textContent = 'Preencha todos os campos obrigatórios.';
    erroEl.style.display = 'block'; return;
  }
  if (senha.length < 6) {
    erroEl.textContent = 'A senha deve ter ao menos 6 caracteres.';
    erroEl.style.display = 'block'; return;
  }
  if (senha !== conf) {
    erroEl.textContent = 'As senhas não coincidem.';
    erroEl.style.display = 'block'; return;
  }

  const novoUsuario = {
    id: 'u' + Date.now(), nome, email, senha,
    role: tipoContaAtual,
    foto: `https://i.pravatar.cc/150?u=${email}`,
    cidade: document.getElementById('cidadeCad')?.value || 'Recife',
    estado: 'PE',
    cadastradoEm: new Date().toISOString().split('T')[0]
  };

  setSession(novoUsuario);
  irStep(3);
}

document.addEventListener('DOMContentLoaded', () => {
  selecionarTipo('cliente');
  irStep(1);
});
