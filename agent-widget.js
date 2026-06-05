/**
 * Widget embedável do Agente SINGLO
 * Uso: AgentWidget.init({ apiUrl: 'http://localhost:8080' })
 */
const AgentWidget = (() => {
  let config = { apiUrl: '' };
  let state = {
    open: false,
    modo: 'educador',
    conversationId: null,
    messages: [],
    loading: false,
  };

  const BRAND = '#013239';
  const BRAND_DARK = '#1f3636';
  const BRAND_LIGHT = '#e0f0f0';
  const ACCENT = '#5bbfbf';

  // SVG icons
  const ICON_CHAT = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  const ICON_CLOSE = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  const ICON_SEND = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
  const ICON_EDU = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
  const ICON_SELL = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>`;
  const ICON_ATTACH = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>`;
  const ICON_MIC = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`;
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  let voiceRec = null;
  let voiceCancelled = false;

  function resetVoice() {
    if (!voiceRec) return;
    voiceCancelled = true;
    try { voiceRec.abort(); } catch {}
    voiceRec = null;
  }

  let attachedFile = null; // { name, content, type: 'text'|'image', base64?, mediaType? }

  function createStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #agent-widget-btn {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: ${BRAND};
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 2px 12px rgba(45,74,74,0.3);
        font-size: 24px;
        z-index: 99999;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #agent-widget-btn:hover {
        box-shadow: 0 4px 20px rgba(45,74,74,0.4);
        transform: translateY(-1px);
      }
      #agent-widget-btn.active {
        background: ${BRAND_DARK};
        border-radius: 12px;
      }

      #agent-widget-panel {
        position: fixed;
        top: 78px;
        right: 20px;
        width: 380px;
        height: calc(100vh - 100px);
        max-height: 620px;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(45,74,74,0.15), 0 0 0 1px rgba(45,74,74,0.06);
        z-index: 99999;
        display: none;
        flex-direction: column;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      #agent-widget-panel.open { display: flex; }

      .agent-header {
        background: ${BRAND};
        color: white;
        padding: 20px 20px 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .agent-header-brand-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .agent-header-logo {
        display: flex;
        align-items: baseline;
      }
      .agent-header-brand {
        font-size: 24px;
        font-weight: 700;
        letter-spacing: 2.5px;
        text-transform: lowercase;
        margin: 0;
      }
      .agent-header-dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        background: ${ACCENT};
        border-radius: 50%;
        margin-left: 2px;
        position: relative;
        top: -8px;
      }
      .agent-header-divider {
        width: 1px;
        height: 20px;
        background: rgba(255,255,255,0.2);
      }
      .agent-header-label {
        font-size: 12px;
        opacity: 0.6;
        font-weight: 400;
        letter-spacing: 0.3px;
      }

      .agent-mode-area {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .agent-mode-select-wrap {
        flex: 1;
        position: relative;
      }
      .agent-mode-select {
        width: 100%;
        padding: 9px 32px 9px 12px;
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 8px;
        background: rgba(255,255,255,0.1);
        color: white;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        outline: none;
        transition: all 0.2s;
      }
      .agent-mode-select:hover {
        background: rgba(255,255,255,0.15);
        border-color: rgba(255,255,255,0.3);
      }
      .agent-mode-select:focus {
        border-color: ${ACCENT};
        box-shadow: 0 0 0 2px rgba(91,191,191,0.25);
      }
      .agent-mode-select option {
        background: ${BRAND};
        color: white;
        padding: 8px;
      }
      .agent-mode-select-arrow {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: rgba(255,255,255,0.6);
      }
      .agent-mode-info-btn {
        width: 30px;
        height: 30px;
        min-width: 30px;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.2);
        background: rgba(255,255,255,0.08);
        color: rgba(255,255,255,0.7);
        cursor: pointer;
        font-size: 14px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        position: relative;
      }
      .agent-mode-info-btn:hover {
        background: rgba(255,255,255,0.15);
        color: white;
        border-color: rgba(255,255,255,0.3);
      }
      .agent-mode-tooltip {
        display: none;
        position: fixed;
        width: 280px;
        background: white;
        color: #334155;
        border-radius: 10px;
        padding: 14px 16px;
        font-size: 12.5px;
        line-height: 1.55;
        box-shadow: 0 8px 30px rgba(0,0,0,0.18);
        z-index: 200000;
        font-weight: 400;
      }
      .agent-mode-tooltip.show { display: block; }
      .agent-mode-tooltip-title {
        font-weight: 700;
        font-size: 13px;
        color: ${BRAND};
        margin-bottom: 10px;
      }
      .agent-mode-tooltip-section {
        margin-bottom: 10px;
      }
      .agent-mode-tooltip-section:last-child { margin-bottom: 0; }
      .agent-mode-tooltip-label {
        font-weight: 600;
        color: ${BRAND};
        margin-bottom: 2px;
      }
      .agent-mode-tooltip-text {
        color: #64748b;
      }

      .agent-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: #f7f9f9;
      }
      .agent-messages::-webkit-scrollbar { width: 4px; }
      .agent-messages::-webkit-scrollbar-track { background: transparent; }
      .agent-messages::-webkit-scrollbar-thumb { background: #c8d4d4; border-radius: 4px; }

      .agent-msg {
        max-width: 85%;
        padding: 10px 14px;
        border-radius: 10px;
        font-size: 13.5px;
        line-height: 1.55;
        word-wrap: break-word;
      }
      .agent-msg.assistant { white-space: normal; }
      .agent-msg.user { white-space: pre-wrap; }
      .agent-msg strong { font-weight: 600; }
      .agent-msg em { font-style: italic; }
      .agent-msg ul, .agent-msg ol { margin: 6px 0; padding-left: 20px; }
      .agent-msg li { margin: 3px 0; line-height: 1.45; }
      .agent-msg p { margin: 6px 0; }
      .agent-msg p:first-child { margin-top: 0; }
      .agent-msg p:last-child { margin-bottom: 0; }
      .agent-msg hr { border: none; border-top: 1px solid #e0e6e6; margin: 10px 0; }
      .agent-msg code {
        background: rgba(45,74,74,0.06);
        padding: 1px 4px;
        border-radius: 3px;
        font-size: 12.5px;
      }
      .agent-msg.user {
        align-self: flex-end;
        background: ${BRAND};
        color: white;
        border-bottom-right-radius: 3px;
      }
      .agent-msg.assistant {
        align-self: flex-start;
        background: #ffffff;
        color: #334155;
        border-bottom-left-radius: 3px;
        border: 1px solid #e2eaea;
        box-shadow: 0 1px 2px rgba(45,74,74,0.04);
      }

      .agent-msg.assistant .knowledge-confirm {
        margin-top: 10px;
        padding: 7px 12px;
        background: ${BRAND};
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: background 0.2s;
      }
      .agent-msg.assistant .knowledge-confirm:hover {
        background: ${BRAND_DARK};
      }

      .agent-typing {
        align-self: flex-start;
        padding: 10px 14px;
        background: #ffffff;
        border: 1px solid #e2eaea;
        border-radius: 10px;
        font-size: 13px;
        color: #94a3b8;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .agent-typing-dots span {
        display: inline-block;
        width: 5px;
        height: 5px;
        background: #94a3b8;
        border-radius: 50%;
        animation: agent-bounce 1.2s infinite;
        margin: 0 1px;
      }
      .agent-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
      .agent-typing-dots span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes agent-bounce {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
        30% { transform: translateY(-4px); opacity: 1; }
      }

      .agent-input-area {
        display: flex;
        padding: 12px 14px;
        gap: 8px;
        border-top: 1px solid #e8eeee;
        background: #fff;
        align-items: center;
      }
      .agent-input-area input {
        flex: 1;
        padding: 10px 14px;
        border: 1px solid #d5dede;
        border-radius: 8px;
        font-size: 13.5px;
        outline: none;
        background: #f7f9f9;
        transition: all 0.2s;
      }
      .agent-input-area input:focus {
        border-color: ${BRAND};
        box-shadow: 0 0 0 3px rgba(45,74,74,0.08);
        background: #fff;
      }
      .agent-input-area button {
        width: 38px;
        height: 38px;
        min-width: 38px;
        padding: 0;
        background: ${BRAND};
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      .agent-input-area button:hover { background: ${BRAND_DARK}; }
      .agent-input-area button:disabled { opacity: 0.4; cursor: not-allowed; }
      .agent-attach-btn {
        width: 38px;
        height: 38px;
        min-width: 38px;
        padding: 0;
        background: #e0f0f0;
        color: ${BRAND};
        border: none;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      .agent-attach-btn:hover { background: #c8e4e4; }
      .agent-mic-btn {
        width: 38px;
        height: 38px;
        min-width: 38px;
        padding: 0;
        background: #e0f0f0;
        color: ${BRAND};
        border: none;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        position: relative;
      }
      .agent-mic-btn:hover { background: #c8e4e4; }
      .agent-mic-btn.recording { background: rgba(220,38,38,0.12); color: #dc2626; }
      .agent-mic-btn.recording::after {
        content: ''; position: absolute; inset: 0; border-radius: 8px;
        box-shadow: 0 0 0 0 rgba(220,38,38,0.5);
        animation: agent-mic-pulse 1.4s infinite;
      }
      @keyframes agent-mic-pulse {
        0% { box-shadow: 0 0 0 0 rgba(220,38,38,0.45); }
        70% { box-shadow: 0 0 0 8px rgba(220,38,38,0); }
        100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
      }
      .agent-file-preview {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        background: #f0f5f5;
        border-top: 1px solid #e8eeee;
        font-size: 11px;
        color: #475569;
      }
      .agent-file-preview span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .agent-file-remove {
        background: none;
        border: none;
        color: #dc2626;
        cursor: pointer;
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .agent-file-remove:hover { background: #fee2e2; }

      .agent-welcome {
        text-align: center;
        padding: 48px 24px;
        color: #64748b;
      }
      .agent-welcome-icon {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        background: ${BRAND};
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
      }
      .agent-welcome h3 {
        color: ${BRAND};
        margin-bottom: 6px;
        font-size: 16px;
        font-weight: 600;
      }
      .agent-welcome p {
        font-size: 13px;
        line-height: 1.5;
      }

      .agent-footer {
        padding: 6px 14px 8px;
        text-align: center;
        font-size: 10px;
        color: #b0bec5;
        background: #fff;
        border-top: 1px solid #f0f4f4;
      }
    `;
    document.head.appendChild(style);
  }

  function render() {
    resetVoice();
    const existing = document.getElementById('agent-widget-container');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'agent-widget-container';

    // Botão flutuante
    const btn = document.createElement('button');
    btn.id = 'agent-widget-btn';
    if (state.open) btn.classList.add('active');
    btn.innerHTML = state.open ? ICON_CLOSE : ICON_CHAT;
    btn.onclick = togglePanel;

    // Painel
    const panel = document.createElement('div');
    panel.id = 'agent-widget-panel';
    if (state.open) panel.classList.add('open');

    panel.innerHTML = `
      <div class="agent-header">
        <div class="agent-header-brand-row">
          <div class="agent-header-logo">
            <p class="agent-header-brand">singlo</p><span class="agent-header-dot"></span>
          </div>
          <div class="agent-header-divider"></div>
          <span class="agent-header-label">Assistente IA</span>
        </div>
        <div class="agent-mode-area">
          <div class="agent-mode-select-wrap">
            <select class="agent-mode-select" id="agent-mode-select">
              <option value="educador" ${state.modo === 'educador' ? 'selected' : ''}>Educador</option>
              <option value="vendedor" ${state.modo === 'vendedor' ? 'selected' : ''}>Vendedor</option>
              <option value="consultor" ${state.modo === 'consultor' ? 'selected' : ''}>Consultor</option>
            </select>
            <span class="agent-mode-select-arrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </div>
          <button class="agent-mode-info-btn" id="agent-mode-info" title="Sobre os modos">?</button>
          <div class="agent-mode-tooltip" id="agent-mode-tooltip">
            <div class="agent-mode-tooltip-title">Sobre os modos</div>
            <div class="agent-mode-tooltip-section">
              <div class="agent-mode-tooltip-label">Educador</div>
              <div class="agent-mode-tooltip-text">Documentação interativa do portal. Aprenda como o sistema funciona, o que cada módulo faz, como navegar e executar qualquer ação passo a passo.</div>
            </div>
            <div class="agent-mode-tooltip-section">
              <div class="agent-mode-tooltip-label">Vendedor</div>
              <div class="agent-mode-tooltip-text">Especialista comercial. Gera pitches personalizados, argumentos de venda, scripts para reunião e respostas a objeções — baseado no perfil e dor do cliente.</div>
            </div>
            <div class="agent-mode-tooltip-section">
              <div class="agent-mode-tooltip-label">Consultor</div>
              <div class="agent-mode-tooltip-text">Especialista técnico em crédito. Planeja políticas de crédito, arquiteturas de motor, escoração, esteiras e analisa JSONs exportados do portal.</div>
            </div>
          </div>
        </div>
      </div>
      <div class="agent-messages" id="agent-messages">
        ${state.messages.length === 0 ? `
          <div class="agent-welcome">
            <div class="agent-welcome-icon">${state.modo === 'educador' ? ICON_EDU.replace('currentColor','white').replace('14','24').replace('14','24') : ICON_SELL.replace('currentColor','white').replace('14','24').replace('14','24')}</div>
            <h3>${getModoTitle()}</h3>
            <p>${getModoDescription()}</p>
          </div>
        ` : state.messages.map(m => renderMessage(m)).join('')}
        ${state.loading ? '<div class="agent-typing"><div class="agent-typing-dots"><span></span><span></span><span></span></div></div>' : ''}
      </div>
      ${attachedFile ? `<div class="agent-file-preview"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>${attachedFile.name}</span><button class="agent-file-remove" id="agent-file-remove">Remover</button></div>` : ''}
      <div class="agent-input-area">
        <label class="agent-attach-btn" for="agent-file-input" title="Anexar arquivo (JSON, imagem, texto)">${ICON_ATTACH}</label>
        <input type="file" id="agent-file-input" accept=".json,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp" style="display:none;" />
        <input type="text" id="agent-input" placeholder="${getPlaceholder()}" ${state.loading ? 'disabled' : ''} />
        ${SpeechRec ? `<button type="button" class="agent-mic-btn" id="agent-mic" title="Ditar por voz" ${state.loading ? 'disabled' : ''}>${ICON_MIC}</button>` : ''}
        <button id="agent-send" ${state.loading ? 'disabled' : ''}>${ICON_SEND}</button>
      </div>
      <div class="agent-footer">Powered by singlo<span style="color:${ACCENT};">&#8226;</span></div>
    `;

    container.appendChild(panel);
    container.appendChild(btn);
    document.body.appendChild(container);

    // Eventos
    const modeSelect = document.getElementById('agent-mode-select');
    if (modeSelect) {
      modeSelect.addEventListener('change', (e) => switchMode(e.target.value));
    }

    const infoBtn = document.getElementById('agent-mode-info');
    if (infoBtn) {
      infoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tooltip = document.getElementById('agent-mode-tooltip');
        if (!tooltip) return;
        const isShowing = tooltip.classList.contains('show');
        if (isShowing) {
          tooltip.classList.remove('show');
        } else {
          const rect = infoBtn.getBoundingClientRect();
          tooltip.style.top = (rect.bottom + 8) + 'px';
          tooltip.style.right = (window.innerWidth - rect.right) + 'px';
          tooltip.classList.add('show');
        }
      });
    }

    const input = document.getElementById('agent-input');
    const sendBtn = document.getElementById('agent-send');

    sendBtn.addEventListener('click', sendMessage);

    const micBtn = document.getElementById('agent-mic');
    if (micBtn && SpeechRec) {
      micBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (voiceRec) { try { voiceRec.stop(); } catch {} return; }

        const rec = new SpeechRec();
        rec.lang = 'pt-BR';
        rec.continuous = true;
        rec.interimResults = true;

        let base = input.value ? input.value.replace(/\s+$/, '') + ' ' : '';
        voiceCancelled = false;

        rec.onresult = (e) => {
          if (voiceCancelled) return;
          let finalText = '', interim = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) finalText += r[0].transcript;
            else interim += r[0].transcript;
          }
          if (finalText) {
            base = (base + finalText).replace(/\s+$/, '') + ' ';
            input.value = base.trimEnd();
          } else {
            input.value = (base + interim).trimEnd();
          }
        };

        const cleanup = () => {
          const btn = document.getElementById('agent-mic');
          if (btn) btn.classList.remove('recording');
          voiceRec = null;
          voiceCancelled = false;
        };
        rec.onerror = cleanup;
        rec.onend = cleanup;

        try {
          rec.start();
          voiceRec = rec;
          micBtn.classList.add('recording');
          input.focus();
        } catch { cleanup(); }
      });
    }
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // File attachment
    const fileInput = document.getElementById('agent-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', handleFileAttach);
    }
    const fileRemoveBtn = document.getElementById('agent-file-remove');
    if (fileRemoveBtn) {
      fileRemoveBtn.addEventListener('click', () => { attachedFile = null; render(); });
    }

    // Scroll para baixo
    const msgs = document.getElementById('agent-messages');
    msgs.scrollTop = msgs.scrollHeight;

    // Foca no input se aberto
    if (state.open && !state.loading) input.focus();
  }

  function renderMessage(m) {
    const content = m.role === 'assistant' ? renderMarkdown(m.content) : escapeHtml(m.content);
    let html = `<div class="agent-msg ${m.role}">${content}</div>`;
    if (m.role === 'assistant' && m.knowledgeExtracted) {
      html = `<div class="agent-msg ${m.role}">${content}<br><button class="knowledge-confirm" data-knowledge='${JSON.stringify(m.knowledgeExtracted).replace(/'/g, "&#39;")}'>Salvar na base</button></div>`;
    }
    return html;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderMarkdown(text) {
    let html = escapeHtml(text);

    // Bold: **text** or __text__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic: *text* (single asterisk, not inside bold)
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

    // Inline code: `text`
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');

    const lines = html.split('\n');
    let result = [];
    let inList = false;
    let listType = 'ul';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Horizontal rule: --- or ***
      if (/^[-*_]{3,}$/.test(trimmed)) {
        if (inList) { result.push(`</${listType}>`); inList = false; }
        result.push('<hr>');
        continue;
      }

      // Headers: # ## ### ####
      const headerMatch = trimmed.match(/^(#{1,4})\s+(.+)/);
      if (headerMatch) {
        if (inList) { result.push(`</${listType}>`); inList = false; }
        const level = headerMatch[1].length;
        const tag = level === 1 ? 'strong' : 'strong';
        const size = level === 1 ? '1.15em' : level === 2 ? '1.05em' : '1em';
        const margin = level <= 2 ? '12px 0 4px 0' : '8px 0 2px 0';
        result.push(`<div style="font-size:${size};margin:${margin}"><${tag}>${headerMatch[2]}</${tag}></div>`);
        continue;
      }

      // Unordered list
      const ulMatch = trimmed.match(/^[-*]\s+(.+)/);
      // Ordered list
      const olMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);

      if (ulMatch) {
        if (!inList || listType !== 'ul') {
          if (inList) result.push(`</${listType}>`);
          result.push('<ul>');
          inList = true;
          listType = 'ul';
        }
        result.push(`<li>${ulMatch[1]}</li>`);
      } else if (olMatch) {
        if (!inList || listType !== 'ol') {
          if (inList) result.push(`</${listType}>`);
          result.push('<ol>');
          inList = true;
          listType = 'ol';
        }
        result.push(`<li>${olMatch[2]}</li>`);
      } else {
        if (inList) {
          result.push(`</${listType}>`);
          inList = false;
        }
        if (trimmed === '') {
          result.push('</p><p>');
        } else {
          result.push(line);
        }
      }
    }
    if (inList) result.push(`</${listType}>`);

    let output = '<p>' + result.join('\n') + '</p>';
    // Clean empty paragraphs
    output = output.replace(/<p>\s*<\/p>/g, '');
    output = output.replace(/<p>\s*<(div|ul|ol|hr)/g, '<$1');
    output = output.replace(/<\/(div|ul|ol)>\s*<\/p>/g, '</$1>');
    return output;
  }

  function getModoTitle() {
    if (state.modo === 'educador') return 'Modo Educador';
    if (state.modo === 'vendedor') return 'Modo Vendedor';
    return 'Modo Consultor';
  }

  function getModoDescription() {
    if (state.modo === 'educador') return 'Aprenda como o sistema funciona, o que cada módulo faz e como executar qualquer ação no portal.';
    if (state.modo === 'vendedor') return 'Gere pitches, argumentos de venda e scripts personalizados para o perfil e dor do seu cliente.';
    return 'Planeje políticas de crédito, arquiteturas de motor e esteiras, e analise JSONs exportados do portal.';
  }

  function getPlaceholder() {
    if (state.modo === 'educador') return 'Como faço para...';
    if (state.modo === 'vendedor') return 'O cliente é... e precisa de...';
    return 'Preciso montar uma política de crédito para...';
  }

  function togglePanel() {
    state.open = !state.open;
    render();
  }

  function switchMode(modo) {
    if (modo === state.modo) return;
    state.modo = modo;
    state.conversationId = null;
    state.messages = [];
    render();
  }

  function authHeaders(extra = {}) {
    const headers = { 'Content-Type': 'application/json', ...extra };
    if (config.token) headers['Authorization'] = `Bearer ${config.token}`;
    return headers;
  }

  async function createConversation() {
    const res = await fetch(`${config.apiUrl}/api/chat/conversations`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ modo: state.modo }),
    });
    const data = await res.json();
    state.conversationId = data.id;
    return data.id;
  }

  function handleFileAttach(e) {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');

    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        attachedFile = { name: file.name, type: 'image', base64, mediaType: file.type };
        render();
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        attachedFile = { name: file.name, type: 'text', content: reader.result };
        render();
      };
      reader.readAsText(file);
    }
  }

  async function sendMessage() {
    resetVoice();
    const input = document.getElementById('agent-input');
    const text = input.value.trim();
    const hasFile = !!attachedFile;

    if (!text && !hasFile) return;
    if (state.loading) return;

    if (!state.conversationId) {
      await createConversation();
    }

    // Build message
    let mensagem = text;
    let imagem = null;
    let displayText = text;

    if (hasFile) {
      if (attachedFile.type === 'image') {
        imagem = { base64: attachedFile.base64, mediaType: attachedFile.mediaType };
        displayText = (text || 'Analise esta imagem') + ' [' + attachedFile.name + ']';
        mensagem = text || 'Analise esta imagem e descreva o que voce ve.';
      } else {
        // Text file (JSON, CSV, TXT)
        displayText = (text || 'Analise este arquivo') + ' [' + attachedFile.name + ']';
        mensagem = (text || 'Analise este arquivo:') + '\n\n[Arquivo: ' + attachedFile.name + ']\n' + attachedFile.content;
      }
      attachedFile = null;
    }

    state.messages.push({ role: 'user', content: displayText });
    state.loading = true;
    render();

    try {
      const body = { mensagem };
      if (imagem) body.imagem = imagem;

      const res = await fetch(`${config.apiUrl}/api/chat/conversations/${state.conversationId}/messages`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        state.messages.push({ role: 'assistant', content: data.error || 'Erro ao processar sua mensagem. Tente novamente.' });
      } else {
        const msg = { role: 'assistant', content: data.reply };
        if (data.knowledgeExtracted) {
          msg.knowledgeExtracted = data.knowledgeExtracted;
        }
        state.messages.push(msg);
      }
    } catch (err) {
      state.messages.push({ role: 'assistant', content: 'Erro ao se comunicar com o servidor. Tente novamente.' });
    }

    state.loading = false;
    render();
  }

  // Fechar tooltip ao clicar fora
  document.addEventListener('click', (e) => {
    const tooltip = document.getElementById('agent-mode-tooltip');
    const infoBtn = document.getElementById('agent-mode-info');
    if (tooltip && infoBtn && !infoBtn.contains(e.target) && !tooltip.contains(e.target)) {
      tooltip.classList.remove('show');
    }
  });

  // Delegação de evento para botão de confirmar conhecimento
  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('knowledge-confirm')) {
      const knowledge = JSON.parse(e.target.dataset.knowledge);
      try {
        await fetch(`${config.apiUrl}/api/chat/knowledge/confirm`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(knowledge),
        });
        e.target.textContent = 'Salvo!';
        e.target.disabled = true;
        e.target.style.background = '#86efac';
        e.target.style.color = '#166534';
      } catch (err) {
        e.target.textContent = 'Erro ao salvar';
      }
    }
  });

  return {
    async init(cfg) {
      config = { ...config, ...cfg };

      // Se token foi passado, valida role admin_neocredit antes de renderizar
      if (config.token) {
        try {
          const res = await fetch(`${config.apiUrl}/api/me`, {
            headers: { Authorization: `Bearer ${config.token}` },
          });
          if (!res.ok) return; // token inválido — não exibe widget
          const user = await res.json();
          if (!user.roles?.includes('admin_neocredit')) return; // sem a role — não exibe widget
        } catch {
          return; // erro de rede — não exibe widget
        }
      }

      createStyles();
      render();
    }
  };
})();
