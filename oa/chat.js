/* OA 렌탈관리 홈페이지 AI 상담 채팅창
   <script src="chat.js" defer data-api="https://nuri-ask.sindoida.co.kr" data-product="oa" data-name="OA 렌탈관리"></script>
   - AI 답변: 문의함 서버(NAS)의 /chat
   - 상담원 연결 · 원격 지원 요청: 문의함 서버의 /submit (텔레그램 알림) */
(function () {
  "use strict";
  var me = document.currentScript || document.querySelector('script[src*="chat.js"]');
  var API = ((me && me.dataset.api) || "https://nuri-ask.sindoida.co.kr").replace(/\/$/, "");
  var PRODUCT = (me && me.dataset.product) || "oa";
  var NAME = (me && me.dataset.name) || "OA 렌탈관리";
  var PRIVACY = (me && me.dataset.privacy) || "../privacy.html";
  var KEY = "oa_chat_v1";
  var QUICK = ["가격이 얼마예요?", "체험판은 어떻게 설치하나요?", "카운터 청구는 어떻게 하나요?",
               "다른 PC나 휴대폰에서도 쓸 수 있나요?", "원격 지원을 받고 싶어요"];
  var HELLO = "안녕하세요! " + NAME + " 상담입니다. 기능·가격·설치·라이선스 등 궁금한 점을 물어보세요. " +
              "AI가 바로 답해 드리고, 담당자 연결이나 원격 지원 요청도 받습니다.";

  var state = load() || {sid: rid(), msgs: [{role: "assistant", content: HELLO}], opened: false};
  var ai = null, busy = false, openedAt = Date.now();

  function rid() { return (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)); }
  function load() { try { return JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 저장 안 돼도 동작 */ } }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  // ---------------------------------------------------------------- 모양
  var css = "\
.oac-btn{position:fixed;right:20px;bottom:20px;z-index:9998;display:flex;align-items:center;gap:8px;border:0;border-radius:28px;padding:13px 18px 13px 16px;\
background:#1d3557;color:#fff;font:600 15px/1 'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif;box-shadow:0 8px 24px rgba(20,40,70,.28);cursor:pointer}\
.oac-btn:hover{background:#2f6fd0}.oac-btn svg{width:20px;height:20px}\
.oac-btn .dot{width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 0 2px #1d3557}\
.oac{--a:#2f6fd0;--n:#1d3557;--bg:#fff;--bg2:#f3f6fa;--tx:#1f2733;--mu:#5f6b7b;--ln:#dfe3ea;position:fixed;right:20px;bottom:20px;z-index:9999;width:380px;max-width:calc(100vw - 24px);\
height:600px;max-height:calc(100vh - 40px);display:none;flex-direction:column;background:var(--bg);color:var(--tx);border-radius:16px;overflow:hidden;\
box-shadow:0 18px 50px rgba(20,40,70,.32);font:15px/1.6 'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif;word-break:keep-all}\
@media (prefers-color-scheme:dark){.oac{--bg:#1b212a;--bg2:#232b36;--tx:#e6ebf2;--mu:#a3adbb;--ln:#2c3440}}\
.oac.on{display:flex}.oac *{box-sizing:border-box}\
.oac-h{background:var(--n);color:#fff;padding:14px 14px 12px 16px;display:flex;align-items:flex-start;gap:10px}\
.oac-h b{display:block;font-size:16px}.oac-h small{display:block;font-size:12px;opacity:.8;margin-top:2px}\
.oac-h button{margin-left:auto;background:transparent;border:0;color:#fff;font-size:24px;line-height:1;cursor:pointer;padding:0 4px}\
.oac-m{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:var(--bg2)}\
.oac-b{max-width:86%;padding:10px 13px;border-radius:14px;white-space:pre-wrap;font-size:14.5px}\
.oac-b.u{align-self:flex-end;background:var(--a);color:#fff;border-bottom-right-radius:4px}\
.oac-b.a{align-self:flex-start;background:var(--bg);border:1px solid var(--ln);border-bottom-left-radius:4px}\
.oac-b.sys{align-self:center;background:transparent;color:var(--mu);font-size:12.5px;text-align:center;padding:2px}\
.oac-act{align-self:flex-start;display:flex;gap:6px;flex-wrap:wrap;margin-top:-4px}\
.oac-act button,.oac-q button{border:1px solid var(--a);color:var(--a);background:var(--bg);border-radius:18px;padding:6px 12px;font:600 13px/1.2 inherit;cursor:pointer}\
.oac-act button:hover,.oac-q button:hover{background:var(--a);color:#fff}\
.oac-q{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px;background:var(--bg2)}\
.oac-q button{font-weight:500;border-color:var(--ln);color:var(--tx)}\
.oac-typing{align-self:flex-start;display:flex;gap:4px;padding:12px 14px;background:var(--bg);border:1px solid var(--ln);border-radius:14px}\
.oac-typing i{width:7px;height:7px;border-radius:50%;background:var(--mu);animation:oacb 1s infinite}.oac-typing i:nth-child(2){animation-delay:.15s}.oac-typing i:nth-child(3){animation-delay:.3s}\
@keyframes oacb{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}\
.oac-in{display:flex;gap:8px;padding:10px 12px;border-top:1px solid var(--ln);background:var(--bg)}\
.oac-in textarea{flex:1;resize:none;border:1px solid var(--ln);border-radius:10px;padding:9px 11px;font:inherit;font-size:14.5px;height:44px;max-height:110px;background:var(--bg);color:var(--tx)}\
.oac-in textarea:focus{outline:2px solid var(--a);outline-offset:-1px}\
.oac-in button{border:0;border-radius:10px;background:var(--a);color:#fff;font:700 14px/1 inherit;padding:0 15px;cursor:pointer}\
.oac-in button:disabled{opacity:.5;cursor:default}\
.oac-f{display:flex;gap:6px;padding:0 12px 8px;background:var(--bg)}\
.oac-f button{flex:1;border:1px solid var(--ln);background:var(--bg);color:var(--tx);border-radius:8px;padding:7px 6px;font:600 13px/1.2 inherit;cursor:pointer}\
.oac-f button:hover{border-color:var(--a);color:var(--a)}\
.oac-note{font-size:11px;color:var(--mu);padding:0 14px 10px;background:var(--bg);line-height:1.45}\
.oac-form{position:absolute;inset:0;top:62px;background:var(--bg);padding:16px;overflow-y:auto;display:none}\
.oac-form.on{display:block}.oac-form h4{margin:0 0 4px;font-size:16px}.oac-form p{margin:0 0 10px;color:var(--mu);font-size:13px}\
.oac-form label{display:block;font-size:13px;color:var(--mu);margin:10px 0 4px}\
.oac-form input,.oac-form textarea{width:100%;border:1px solid var(--ln);border-radius:8px;padding:9px 11px;font:inherit;font-size:14.5px;background:var(--bg);color:var(--tx)}\
.oac-form textarea{height:84px;resize:vertical}\
.oac-form .agree{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;color:var(--mu);margin-top:12px}.oac-form .agree input{width:auto;margin-top:3px}\
.oac-form .row{display:flex;gap:8px;margin-top:14px}.oac-form .row button{flex:1;border-radius:9px;padding:11px;font:700 14px/1 inherit;cursor:pointer;border:1px solid var(--ln);background:var(--bg);color:var(--tx)}\
.oac-form .row .go{background:var(--a);border-color:var(--a);color:#fff}\
.oac-form .err{color:#c0392b;font-size:13px;margin-top:8px;min-height:1em}\
.oac-form .hp{position:absolute;left:-9999px}\
.oac-form .warn{background:#fff6e5;color:#7a5200;border-radius:8px;padding:8px 10px;font-size:12.5px;margin:8px 0 0}\
@media (prefers-color-scheme:dark){.oac-form .warn{background:#3a2f17;color:#f5d58a}}\
@media (max-width:560px){.oac{right:0;bottom:0;width:100vw;max-width:100vw;height:100%;max-height:100%;border-radius:0}.oac-btn{right:14px;bottom:14px}.oac-in textarea,.oac-form input,.oac-form textarea{font-size:16px}}";
  var st = el("style"); st.textContent = css; document.head.appendChild(st);

  var btn = el("button", "oac-btn"); btn.type = "button"; btn.setAttribute("aria-label", "AI 상담 열기");
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>AI 상담<span class="dot"></span>';
  var box = el("div", "oac"); box.setAttribute("role", "dialog"); box.setAttribute("aria-label", NAME + " 상담");
  box.innerHTML =
    '<div class="oac-h"><div><b>' + NAME + ' 상담</b><small>AI가 바로 답해 드려요 · 담당자 연결 가능</small></div><button type="button" aria-label="닫기">×</button></div>' +
    '<div class="oac-m" aria-live="polite"></div><div class="oac-q"></div>' +
    '<div class="oac-in"><textarea rows="1" maxlength="500" placeholder="궁금한 점을 입력하세요"></textarea><button type="button">보내기</button></div>' +
    '<div class="oac-f"><button type="button" data-k="contact">👤 상담원 연결</button><button type="button" data-k="remote">🖥 원격 지원 요청</button></div>' +
    '<div class="oac-note">AI 답변은 안내용이며 틀릴 수 있습니다. 정확한 내용은 담당자(031-433-2480)에게 확인해 주세요. 상담 품질을 위해 대화 내용을 90일 보관합니다. 이름·전화번호 등 개인정보는 채팅에 적지 마세요.</div>' +
    '<form class="oac-form" novalidate></form>';
  document.body.appendChild(btn); document.body.appendChild(box);
  var list = box.querySelector(".oac-m"), quick = box.querySelector(".oac-q"),
      ta = box.querySelector(".oac-in textarea"), send = box.querySelector(".oac-in button"), form = box.querySelector(".oac-form");

  // ---------------------------------------------------------------- 대화 그리기
  function bubble(m, i) {
    if (m.role === "sys") { list.appendChild(el("div", "oac-b sys", m.content)); return; }
    list.appendChild(el("div", "oac-b " + (m.role === "user" ? "u" : "a"), m.content));
    if (m.handoff && i === state.msgs.length - 1) {
      var act = el("div", "oac-act");
      if (m.handoff === "remote") act.appendChild(actBtn("🖥 원격 지원 요청하기", "remote"));
      act.appendChild(actBtn("👤 상담원 연결하기", "contact"));
      list.appendChild(act);
    }
  }
  function actBtn(t, k) { var b = el("button", "", t); b.type = "button"; b.onclick = function () { openForm(k); }; return b; }
  function render() {
    list.innerHTML = "";
    state.msgs.forEach(bubble);
    quick.style.display = state.msgs.length <= 1 ? "" : "none";
    list.scrollTop = list.scrollHeight;
  }
  QUICK.forEach(function (q) {
    var b = el("button", "", q); b.type = "button";
    b.onclick = function () { if (/원격/.test(q)) { push("user", q); push("assistant", REMOTE_INFO, {handoff: "remote"}); } else ask(q); };
    quick.appendChild(b);
  });
  var REMOTE_INFO = "원격 지원은 상담원이 고객님 화면을 보며 직접 도와드리는 서비스입니다.\n" +
    "1. 아래 [원격 지원 요청하기]로 연락처와 편한 시간을 남겨 주세요. (급하시면 031-433-2480)\n" +
    "2. 프로그램 왼쪽 아래 [원격 지원 안내]에서 울트라뷰어를 내려받아 설치합니다.\n" +
    "3. 상담원 전화를 받으시면 울트라뷰어 창의 ID·비밀번호를 전화로 알려 주세요.\n" +
    "※ ID·비밀번호는 채팅이나 문의 글에 적지 마세요.";

  function push(role, content, extra) {
    var m = {role: role, content: content};
    if (extra) for (var k in extra) m[k] = extra[k];
    state.msgs.push(m);
    if (state.msgs.length > 60) state.msgs = state.msgs.slice(-60);
    save(); render();
  }

  // ---------------------------------------------------------------- 보내기
  function post(path, body, json) {
    return fetch(API + path, {method: "POST", mode: "cors", credentials: "omit",
      headers: json ? {"Content-Type": "text/plain;charset=UTF-8"} : {"Accept": "application/json"},
      body: body}).then(function (r) { return r.json().catch(function () { return {ok: false, msg: "서버 응답 오류"}; }); });
  }
  function ask(q) {
    q = (q || "").trim();
    if (!q || busy) return;
    if (q.length > 500) q = q.slice(0, 500);
    push("user", q);
    if (/원격/.test(q) && q.length <= 30) {   // "원격 지원 요청" 같은 짧은 요청은 바로 안내 (AI 호출 없이)
      push("assistant", REMOTE_INFO, {handoff: "remote"}); render(); return;
    }
    if (ai === false) {
      push("assistant", "지금은 AI 답변을 준비 중입니다. 아래 [상담원 연결]로 연락처를 남기시면 담당자가 연락드립니다. (전화 031-433-2480)", {handoff: "contact"});
      return;
    }
    busy = true; send.disabled = true;
    var typing = el("div", "oac-typing"); typing.innerHTML = "<i></i><i></i><i></i>"; list.appendChild(typing); list.scrollTop = list.scrollHeight;
    var hist = state.msgs.filter(function (m) { return m.role === "user" || m.role === "assistant"; })
      .slice(-17).map(function (m) { return {role: m.role, content: m.content}; });
    post("/chat", JSON.stringify({product: PRODUCT, sid: state.sid, messages: hist}), true).then(function (j) {
      if (j.ok) push("assistant", j.answer, j.handoff ? {handoff: j.handoff} : null);
      else push("sys", j.msg || "잠시 후 다시 시도해 주세요.");
    }).catch(function () {
      push("assistant", "연결이 원활하지 않습니다. 잠시 후 다시 시도하시거나 031-433-2480으로 전화 주세요.", {handoff: "contact"});
    }).then(function () { busy = false; send.disabled = false; typing.remove(); render(); ta.focus(); });
  }
  send.onclick = function () { var q = ta.value; ta.value = ""; ask(q); };
  ta.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); send.onclick(); }
  });
  ta.addEventListener("input", function () { ta.style.height = "44px"; ta.style.height = Math.min(110, ta.scrollHeight) + "px"; });

  // ---------------------------------------------------------------- 상담원 연결 · 원격 지원 요청
  function lastQuestion() {
    for (var i = state.msgs.length - 1; i >= 0; i--) if (state.msgs[i].role === "user") return state.msgs[i].content;
    return "";
  }
  function openForm(kind) {
    var remote = kind === "remote";
    form.innerHTML =
      "<h4>" + (remote ? "🖥 원격 지원 요청" : "👤 상담원 연결") + "</h4>" +
      "<p>" + (remote ? "연락처를 남기시면 담당자가 전화드린 뒤 원격으로 화면을 보며 도와드립니다." :
                        "연락처를 남기시면 담당자가 영업일 1일 안에 연락드립니다.") + "</p>" +
      '<label>이름 *</label><input name="name" maxlength="50" autocomplete="name">' +
      '<label>상호 (선택)</label><input name="company" maxlength="80" autocomplete="organization">' +
      '<label>전화번호 *</label><input name="phone" maxlength="30" inputmode="tel" autocomplete="tel" placeholder="010-0000-0000">' +
      (remote ? '<label>연락받기 편한 시간 (선택)</label><input name="when" maxlength="60" placeholder="예: 오늘 오후 3시 이후">' : "") +
      '<label>' + (remote ? "어떤 문제인가요? *" : "문의 내용 *") + '</label><textarea name="body" maxlength="1500"></textarea>' +
      (remote ? '<div class="warn">울트라뷰어 ID·비밀번호는 여기에 적지 마시고, 담당자 전화로 알려 주세요.</div>' : "") +
      '<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<label class="agree"><input type="checkbox" name="agree" value="1"><span>상담을 위해 이름·전화번호를 수집·이용하는 데 동의합니다. (1년 보관 후 삭제 · <a href="' + PRIVACY + '" target="_blank" rel="noopener">개인정보처리방침</a>)</span></label>' +
      '<div class="err"></div><div class="row"><button type="button" class="back">← 채팅으로</button><button type="submit" class="go">보내기</button></div>';
    form.elements.body.value = remote ? "" : lastQuestion();
    form.dataset.kind = kind;
    form.classList.add("on");
    form.querySelector(".back").onclick = function () { form.classList.remove("on"); };
    form.elements.name.focus();
  }
  function fmtPhone(p) {   // 01030802480 → 010-3080-2480
    var d = p.replace(/\D/g, "");
    if (/^02\d{7,8}$/.test(d)) return d.replace(/^(02)(\d{3,4})(\d{4})$/, "$1-$2-$3");
    if (/^0\d{9,10}$/.test(d)) return d.replace(/^(0\d{2})(\d{3,4})(\d{4})$/, "$1-$2-$3");
    return p;
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = form.elements, err = form.querySelector(".err"), remote = form.dataset.kind === "remote";
    var name = f.name.value.trim(), phone = fmtPhone(f.phone.value.trim()), body = f.body.value.trim();
    if (!name || !phone || body.length < 2) { err.textContent = "이름, 전화번호, 내용을 적어 주세요."; return; }
    if (!f.agree.checked) { err.textContent = "개인정보 수집·이용에 동의해 주세요."; return; }
    var text = "[홈페이지 AI 상담에서 " + (remote ? "원격 지원 요청" : "상담원 연결") + "]\n" + body +
               (remote && f.when.value.trim() ? "\n\n연락 편한 시간: " + f.when.value.trim() : "");
    var fd = new URLSearchParams();
    fd.set("product", NAME); fd.set("topic", remote ? "원격 지원 요청" : "구입·가격 문의");
    fd.set("name", name); fd.set("company", f.company.value.trim()); fd.set("phone", phone); fd.set("email", "");
    fd.set("body", text); fd.set("agree", "1"); fd.set("website", f.website.value); fd.set("t", String(openedAt));
    var go = form.querySelector(".go"); go.disabled = true; err.textContent = "";
    post("/submit", fd, false).then(function (j) {
      if (j.ok) {
        form.classList.remove("on");
        push("assistant", (remote ? "원격 지원 요청이 접수되었습니다. 담당자가 " : "접수되었습니다. 담당자가 ") +
             phone + " 으로 연락드리겠습니다. 감사합니다.");
      } else err.textContent = j.msg || "보내지 못했습니다. 031-433-2480으로 전화 주세요.";
    }).catch(function () { err.textContent = "보내지 못했습니다. 031-433-2480으로 전화 주세요."; })
      .then(function () { go.disabled = false; });
  });
  box.querySelectorAll(".oac-f button").forEach(function (b) { b.onclick = function () { openForm(b.dataset.k); }; });

  // ---------------------------------------------------------------- 열고 닫기
  function open() {
    box.classList.add("on"); btn.style.display = "none"; state.opened = true; save(); render();
    if (ai === null) post("/chat", JSON.stringify({product: PRODUCT, hello: 1}), true)
      .then(function (j) { ai = !!(j && j.ai); }).catch(function () { ai = false; });
    setTimeout(function () { ta.focus(); }, 50);
  }
  function close() { box.classList.remove("on"); btn.style.display = ""; state.opened = false; save(); }
  btn.onclick = open;
  box.querySelector(".oac-h button").onclick = close;
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && box.classList.contains("on")) close(); });
  document.querySelectorAll('a[href="#chat"],[data-open-chat]').forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); open(); });
  });
  if (state.opened) open();
})();
