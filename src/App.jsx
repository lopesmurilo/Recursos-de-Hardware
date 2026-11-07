import { useState, useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import './App.css';

// ID base para notificações imediatas
const ID_IMEDIATA = 280;
// ID base para notificações agendadas (timestamp garante unicidade)
let idAgendadoBase = 2800;

export default function App() {
  const [permissaoConcedida, setPermissaoConcedida] = useState(false);
  const [statusPermissao, setStatusPermissao]       = useState('desconhecido');
  const [segundos, setSegundos]                     = useState(10);
  const [gaveta, setGaveta]                         = useState('A3');         // Desafio Extra
  const [statusMensagem, setStatusMensagem]         = useState('Aguardando ação do usuário...');
  const [tipoStatus, setTipoStatus]                 = useState('idle');       // idle | ok | erro | info
  const [pendentesCount, setPendentesCount]         = useState(0);
  const [historico, setHistorico]                   = useState([]);
  const [tema, setTema]                             = useState('dark');       // dark | light

  // ── Verificação inicial de permissão ────────────────────────────────────────
  useEffect(() => {
    checarPermissaoInicial();
    atualizarPendentes();
  }, []);

  const checarPermissaoInicial = async () => {
    try {
      const status = await LocalNotifications.checkPermissions();
      setStatusPermissao(status.display);
      if (status.display === 'granted') {
        setPermissaoConcedida(true);
        exibirStatus('Permissão já está ativa no sistema ✅', 'ok');
      } else {
        setPermissaoConcedida(false);
        exibirStatus(`Permissão atual: "${status.display}" — clique em Ativar para conceder.`, 'info');
      }
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      exibirStatus('Erro ao consultar permissões nativas.', 'erro');
    }
  };

  // ── Solicitar Permissão (Android 13+ POST_NOTIFICATIONS) ────────────────────
  const solicitarPermissao = async () => {
    try {
      // Se já concedida, apenas informa
      let status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') {
        setPermissaoConcedida(true);
        exibirStatus('Permissão já estava concedida ✅', 'ok');
        return;
      }

      // Solicita ao sistema operacional
      status = await LocalNotifications.requestPermissions();
      setStatusPermissao(status.display);

      if (status.display === 'granted') {
        setPermissaoConcedida(true);
        exibirStatus('Permissão concedida com sucesso! ✅', 'ok');
        adicionarHistorico('🔔 Permissão concedida pelo usuário');
      } else {
        setPermissaoConcedida(false);
        exibirStatus('Usuário recusou a permissão de notificação ❌', 'erro');
        adicionarHistorico('🚫 Permissão recusada');
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      exibirStatus('Falha ao abrir o diálogo de permissão do sistema.', 'erro');
    }
  };

  // ── Notificação Imediata ─────────────────────────────────────────────────────
  const dispararImediata = async () => {
    if (!permissaoConcedida) {
      exibirStatus('⚠️ Ative a permissão antes de enviar alertas!', 'erro');
      return;
    }
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'CleanWash Lavanderia 🧺',
            body: `Suas 5 camisas estão passadas e cheirosas! Gaveta: ${gaveta}`,
            id: ID_IMEDIATA,
            sound: null,
            extra: {
              tipo: 'pronto',
              gaveta: gaveta,
              pecas: 5,
            },
          },
        ],
      });

      exibirStatus('🚀 Notificação imediata enviada! Verifique a barra de status.', 'ok');
      adicionarHistorico(`🧺 Imediata disparada — Gaveta ${gaveta}`);
      atualizarPendentes();
    } catch (err) {
      console.error('Erro ao disparar imediata:', err);
      exibirStatus('Erro ao disparar notificação imediata.', 'erro');
    }
  };

  // ── Notificação Agendada ─────────────────────────────────────────────────────
  const agendarNotificacao = async () => {
    if (!permissaoConcedida) {
      exibirStatus('⚠️ Ative a permissão antes de agendar alertas!', 'erro');
      return;
    }

    const seg = parseInt(segundos) || 10;
    if (seg < 1) {
      exibirStatus('O tempo de agendamento deve ser maior que 0.', 'erro');
      return;
    }

    const dataAlvo = new Date(Date.now() + seg * 1000);
    const idUnico  = idAgendadoBase + (Date.now() % 10000); // ID único

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'CleanWash Lavanderia ⏰',
            body: `Sua roupa está pronta para recolher! Gaveta: ${gaveta}`,
            id: idUnico,
            schedule: { at: dataAlvo },
            extra: {
              tipo: 'lembrete',
              gaveta: gaveta,
            },
          },
        ],
      });

      const horario = dataAlvo.toLocaleTimeString('pt-BR');
      exibirStatus(`⏱️ Agendado para ${horario} (em ${seg}s) — Gaveta ${gaveta}`, 'ok');
      adicionarHistorico(`⏰ Agendada p/ ${horario} (${seg}s) — Gaveta ${gaveta} [ID:${idUnico}]`);
      atualizarPendentes();
    } catch (err) {
      console.error('Erro ao agendar:', err);
      exibirStatus('Erro ao agendar a notificação.', 'erro');
    }
  };

  // ── Cancelar Todas Pendentes ─────────────────────────────────────────────────
  const cancelarTodas = async () => {
    try {
      const pendentes = await LocalNotifications.getPending();
      if (pendentes.notifications.length === 0) {
        exibirStatus('Nenhuma notificação pendente para cancelar.', 'info');
        return;
      }
      await LocalNotifications.cancel(pendentes);
      exibirStatus(`🗑️ ${pendentes.notifications.length} notificação(ões) cancelada(s).`, 'ok');
      adicionarHistorico(`🗑️ Canceladas ${pendentes.notifications.length} pendente(s)`);
      atualizarPendentes();
    } catch (err) {
      console.error('Erro ao cancelar:', err);
      exibirStatus('Erro ao cancelar notificações pendentes.', 'erro');
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const atualizarPendentes = async () => {
    try {
      const lista = await LocalNotifications.getPending();
      setPendentesCount(lista.notifications.length);
    } catch (_) {
      /* silencioso */
    }
  };

  const exibirStatus = (msg, tipo) => {
    setStatusMensagem(msg);
    setTipoStatus(tipo);
  };

  const adicionarHistorico = (msg) => {
    const hora = new Date().toLocaleTimeString('pt-BR');
    setHistorico((prev) => [`[${hora}] ${msg}`, ...prev].slice(0, 8));
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  const corStatus = {
    ok:   '#1a7a4a',
    erro: '#c0392b',
    info: '#1a5276',
    idle: '#555',
  };

  return (
    <div className={`app-wrapper tema-${tema}`}>
      {/* Cabeçalho */}
      <header className="app-header">
        <div className="header-icon">🧺</div>
        <div>
          <h1 className="app-title">CleanWash Lavanderia</h1>
          <p className="app-subtitle">Aluno 28 · Local Notifications · PDM II</p>
        </div>
        <button
          className="btn-tema"
          onClick={() => setTema(t => t === 'dark' ? 'light' : 'dark')}
          title={tema === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {tema === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      <main className="app-main">

        {/* Card: Permissão */}
        <section className="card">
          <h2 className="card-title">🔐 Permissão de Notificação</h2>
          <div className="permission-row">
            <div className="permission-info">
              <span className="badge" style={{ background: permissaoConcedida ? '#1a7a4a' : '#c0392b' }}>
                {permissaoConcedida ? 'Concedida ✅' : 'Bloqueada ❌'}
              </span>
              <span className="perm-detail">Estado OS: <code>{statusPermissao}</code></span>
            </div>
            <button className="btn btn-primary" onClick={solicitarPermissao}>
              {permissaoConcedida ? '🔄 Reverificar' : '🔔 Ativar Permissão'}
            </button>
          </div>
          <p className="card-hint">
            Android 13+ exige <code>POST_NOTIFICATIONS</code> explicitamente.
            O botão acima abre o diálogo nativo do sistema.
          </p>
        </section>

        {/* Card: Desafio Extra — Número da Gaveta */}
        <section className="card card-accent">
          <h2 className="card-title">💡 Desafio Extra: Número da Gaveta</h2>
          <p className="card-hint">
            Informe a gaveta onde a roupa está armazenada.
            Este valor é incluído no <strong>corpo</strong> de todas as notificações.
          </p>
          <div className="input-row">
            <label htmlFor="gaveta" className="input-label">Gaveta / Armário</label>
            <input
              id="gaveta"
              type="text"
              className="input-field"
              value={gaveta}
              maxLength={6}
              onChange={(e) => setGaveta(e.target.value.toUpperCase())}
              placeholder="Ex: A3, B12"
            />
          </div>
          <p className="card-hint" style={{ marginTop: '0.4rem' }}>
            Pré-visualização:{' '}
            <em>"Sua roupa está na <strong>Gaveta {gaveta || '?'}</strong> — pronta para recolher!"</em>
          </p>
        </section>

        {/* Card: Notificação Imediata */}
        <section className="card">
          <h2 className="card-title">🚀 Notificação Imediata</h2>
          <p className="card-hint">
            Enviada instantaneamente para a barra de status.
            Payload inclui título, corpo com gaveta e dados <code>extra</code>.
          </p>
          <button
            className="btn btn-action btn-green"
            onClick={dispararImediata}
            disabled={!permissaoConcedida}
          >
            🧺 Enviar Agora (Gaveta {gaveta || '?'})
          </button>
        </section>

        {/* Card: Notificação Agendada */}
        <section className="card">
          <h2 className="card-title">⏰ Agendar Notificação Futura</h2>
          <p className="card-hint">
            Programa um alerta que disparará mesmo com o app fechado.
            Use <code>schedule: {'{ at: new Date(...) }'}</code>.
          </p>
          <div className="input-row">
            <label className="input-label">Disparar em (segundos)</label>
            <div className="time-presets">
              {[5, 10, 15, 30].map((s) => (
                <button
                  key={s}
                  className={`btn btn-preset ${Number(segundos) === s ? 'btn-preset-active' : ''}`}
                  onClick={() => setSegundos(s)}
                >
                  {s}s
                </button>
              ))}
              <input
                id="segundos"
                type="number"
                className="input-field input-small"
                value={segundos}
                min={1}
                max={3600}
                onChange={(e) => setSegundos(e.target.value)}
              />
            </div>
          </div>
          <button
            className="btn btn-action btn-blue"
            onClick={agendarNotificacao}
            disabled={!permissaoConcedida}
          >
            ⏱️ Agendar para +{segundos}s (Gaveta {gaveta || '?'})
          </button>
        </section>

        {/* Card: Pendentes */}
        <section className="card">
          <h2 className="card-title">📋 Notificações Agendadas Pendentes</h2>
          <div className="pending-row">
            <div className="pending-badge">
              <span className="pending-count">{pendentesCount}</span>
              <span className="pending-label">pendente(s)</span>
            </div>
            <div className="pending-actions">
              <button className="btn btn-secondary" onClick={atualizarPendentes}>
                🔄 Atualizar
              </button>
              <button
                className="btn btn-danger"
                onClick={cancelarTodas}
                disabled={pendentesCount === 0}
              >
                🗑️ Cancelar Todas
              </button>
            </div>
          </div>
        </section>

        {/* Console de Status */}
        <section className="card card-console">
          <h2 className="card-title">🖥️ Console de Status</h2>
          <div
            className="status-box"
            style={{ borderLeftColor: corStatus[tipoStatus] }}
          >
            <span style={{ color: corStatus[tipoStatus] }}>▶ </span>
            {statusMensagem}
          </div>

          {historico.length > 0 && (
            <div className="historico">
              <p className="historico-titulo">Histórico de Ações</p>
              {historico.map((entry, i) => (
                <p key={i} className="historico-item">{entry}</p>
              ))}
            </div>
          )}
        </section>

      </main>

      <footer className="app-footer">
        <p>CleanWash · Aluno 28 · @capacitor/local-notifications v8.3.1</p>
      </footer>
    </div>
  );
}
