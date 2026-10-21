// ==UserScript==
// @name         DOM OC TRACKER V2.2
// @namespace    torn-faction-oc
// @version      2.2
// @description  Show delayed oc's
// @match        https://www.torn.com/factions.php?step=your*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @connect      script.google.com
// @connect      googleusercontent.com
// @connect      accounts.google.com
// @author      Hitter
// ==/UserScript==

(function () {
  'use strict';

const BASE_URL = "https://script.google.com/macros/s/AKfycbzoF7CHwC7Tg9lMVRhIOT7wkpTFygT0CM8FYdXN-IS0CEsIgjbBmjJoQs5xBfOmLwjo1g/exec";

function getStoredToken() {
  try {
    return GM_getValue('faction_token', '') || '';
  } catch (e) { return ''; }
}
function saveStoredToken(val) {
  GM_setValue('faction_token', val || '');
}
function clearStoredToken() {
  GM_deleteValue('faction_token');
}


function makeServerUrl() {
  const token = getStoredToken();
  return token ? `${BASE_URL}?token=${encodeURIComponent(token)}` : BASE_URL;
}



  function createNodeFromHTML(html) {
    const tmpl = document.createElement('template');
    tmpl.innerHTML = html.trim();
    return tmpl.content.firstChild;
  }

  function formatCell(s) {
    if (!s && s !== 0) return '';
    return String(s);
  }

  function injectPanel() {
    const header = document.querySelector('.faction-tabs-wrap') || document.querySelector('.faction-tabs');
    const panelHtml = `
      <div id="tfoc-panel" style="
        background:#f0f0f0;
        border:1px solid #aaa;
        border-radius:6px;
        padding:10px;
        margin:10px 0;
        color:#0429B3;
        font-family:Arial, sans-serif;
        width:100%;
        box-sizing:border-box;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="font-weight:700; font-size:18px;">DOM OC Delay Tracker v2</div>
          <div>
            <button id="tfoc-tab-home" style="margin-right:6px;padding:6px 8px;border-radius:4px;border:1px solid #aaa;background:#d9d9d9;cursor:pointer;">Home</button>
            <button id="tfoc-tab-logs" style="padding:6px 8px;border-radius:4px;border:1px solid #007bff;background:#007bff;color:#fff;cursor:pointer;">Logs</button>
            <button id="tfoc-tab-settings" style="padding:6px 8px;border-radius:4px;border:1px solid #666;background:#eee;cursor:pointer;">Settings</button>
         <button id="tfoc-toggle"
        title="Minimize"
        style="
          margin-right:6px;
          padding:5px 8px;
          height:29px;
          line-height:18px;
          min-width:48px;
          border-radius:4px;
          border:1px solid #aaa;
          background:#eee;
          cursor:pointer;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          font-size:14px;
        ">
  🔽
</button>



          </div>
        </div>
        <div id="tfoc-content" style="margin-top:10px;"></div>
      </div>
    `;

    const panelNode = createNodeFromHTML(panelHtml);
    if (header) {
      header.insertAdjacentElement('afterend', panelNode);
    } else {
      panelNode.style.position = 'fixed';
      panelNode.style.right = '20px';
      panelNode.style.bottom = '20px';
      panelNode.style.width = '400px';
      panelNode.style.zIndex = 99999;
      document.body.appendChild(panelNode);
    }

    panelNode.querySelector('#tfoc-tab-home').addEventListener('click', () => showHome(panelNode));
    panelNode.querySelector('#tfoc-tab-logs').addEventListener('click', () => showLogs(panelNode));
    showHome(panelNode);
    panelNode.querySelector('#tfoc-tab-settings').addEventListener('click', () => showSettings(panelNode));
    const contentDiv = panelNode.querySelector('#tfoc-content');
let minimized = false;

function updateToggleButton() {
  const toggleBtn = panelNode.querySelector('#tfoc-toggle');
  if (!toggleBtn) return;

  if (minimized) {
    toggleBtn.textContent = '🔽';
    toggleBtn.title = 'Maximize';
  } else {
    toggleBtn.textContent = '🔼';
    toggleBtn.title = 'Minimize';
  }

  const newBtn = toggleBtn.cloneNode(true);
  toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);

  newBtn.addEventListener('click', () => {
    minimized = !minimized;
    contentDiv.style.display = minimized ? 'none' : '';
    updateToggleButton();
  });
}


updateToggleButton();




  }

  //HOME TAB
  function showHome(panelNode) {
    const content = panelNode.querySelector('#tfoc-content');
    content.innerHTML = `
      <div style="color:#333;">
        <h3 style="margin:6px 0 10px 0;">Welcome</h3>
        <p style="margin:0 0 6px 0;">This is the complete version of OC tracker made by Hitter [2625699].</p>
        <p style="margin:0 0 10px 0;">Click <b>Logs</b> to see all the delays.</p>
        <div id="tfoc-latest" style="margin-top:12px; border-top:1px solid #ccc; padding-top:8px;">
          <h4 style="margin:4px 0; color:#050505;"> Latest Delays</h4>
          <div id="tfoc-latest-body" style="font-size:12px; color:#333;">Loading...</div>
        </div>
      </div>
    `;
    fetchLatestLogs(content.querySelector('#tfoc-latest-body'));
  }

function fetchLatestLogs(container) {
  GM_xmlhttpRequest({
    method: "GET",
    url: makeServerUrl(),
    redirect: "follow",
    onload: function (res) {
      try {
        if (res.status !== 200) {
          container.innerHTML = `<p style="color:red;">Error Server status ${res.status}</p>`;
          return;
        }
        const data = JSON.parse(res.responseText);
        if (!Array.isArray(data) || data.length === 0) {
          container.innerHTML = `<p style="color:gray;">No logs available</p>`;
          return;
        }

        const latest = data.slice(-5).reverse();
        let html = `
          <div style="display:grid; grid-template-columns: 110px 130px 160px 1fr;
                      gap:4px; font-size:13px; border-top:1px solid #ccc;">`;

        for (const row of latest) {
          const ts = formatCell(row.timestamp).slice(0, 16);
          const player = formatCell(row.player);
          const crime = formatCell(row.crimeName || row.crime || "-");
          const reason = formatCell(row.reason);

          html += `
            <div style="display:contents; border-bottom:1px solid #e0e0e0;">
              <div style="color:#666; padding:3px 0;">${ts}</div>
              <div style="color:#0044cc; padding:3px 0;">${player}</div>
              <div style="color:#222; padding:3px 0;">${crime}</div>
              <div style="color:#a00; padding:3px 0;">${reason}</div>
            </div>`;
        }

        html += `</div>`;
        container.innerHTML = html;

      } catch (err) {
        container.innerHTML = `<p style="color:red;">JSON error: ${err.message}</p>`;
      }
    },
    onerror: function () {
      container.innerHTML = `<p style="color:red;"> Error connecting to server.</p>`;
    }
  });
}


  // LOGS TAB
  function showLogs(panelNode) {
  const content = panelNode.querySelector('#tfoc-content');
  content.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
      <div style="font-weight:600;"> Logs</div>
      <div style="display:flex; align-items:center; gap:6px; margin-top:6px;">
                <input id="tfoc-search" type="text" placeholder="Filter by player..."
          style="padding:4px 6px; border:1px solid #aaa; border-radius:4px; width:145px; font-size:12px;">
        <input id="tfoc-reason-search" type="text" placeholder="Filter by reason..."
          style="padding:4px 6px; border:1px solid #aaa; border-radius:4px; width:145px; font-size:12px;">
        <button id="tfoc-clear"
          style="padding:4px 6px; border-radius:4px; border:1px solid #aaa; background:#ddd; cursor:pointer;">Clear</button>
        <button id="tfoc-refresh"
          style="padding:4px 8px;border-radius:4px;border:1px solid #007bff;background:#007bff;color:#fff;cursor:pointer;">Refresh</button>
      </div>
    </div>
    <div id="tfoc-logs-body" style="margin-top:10px; max-height:320px; overflow:auto; background:#fff; border:1px solid #ccc; border-radius:4px; padding:6px;"></div>
  `;

  const refresh = () => fetchAndRenderLogs(panelNode);
  panelNode.querySelector('#tfoc-refresh').addEventListener('click', refresh);

  const clearBtn = panelNode.querySelector('#tfoc-clear');
  clearBtn.addEventListener('click', () => {
        panelNode.querySelector('#tfoc-search').value = "";
    panelNode.querySelector('#tfoc-reason-search').value = "";
    filterLogs(panelNode);
  });
  panelNode.querySelector('#tfoc-search')
    .addEventListener('input', () => filterLogs(panelNode));

  panelNode.querySelector('#tfoc-reason-search')
    .addEventListener('input', () => filterLogs(panelNode));
  // load logs initially
  fetchAndRenderLogs(panelNode);
}


  function fetchAndRenderLogs(panelNode) {
    const body = panelNode.querySelector('#tfoc-logs-body');
    body.innerHTML = `<p style="color:gray;margin:6px 0;">Loading server data...</p>`;

    GM_xmlhttpRequest({
      method: "GET",
      url: makeServerUrl(),
      redirect: "follow",
      onload: function (res) {
        try {
          if (res.status !== 200) {
            body.innerHTML = `<p style="color:red;"> Server status ${res.status}</p>`;
            return;
          }
          const data = JSON.parse(res.responseText);
          renderLogsTable(body, data);
        } catch (err) {
          body.innerHTML = `<p style="color:red;"> JSON error: ${err.message}</p>`;
        }
      },
      onerror: function () {
        body.innerHTML = `<p style="color:red;"> Could not connect to server.</p>`;
      }
    });
  }

function renderLogsTable(container, data) {
  if (!Array.isArray(data) || data.length === 0) {
    container.innerHTML = `<p style="color:gray;margin:6px 0;">No data available.</p>`;
    return;
  }

  const sorted = data.slice().reverse();
  container.dataset.allLogs = JSON.stringify(sorted);

  let html = `
    <table id="tfoc-table" style="width:100%; border-collapse:collapse; font-size:13px;">
      <thead>
        <tr style="background:#f7f7f7; color:#0044cc;">
          <th style="padding:6px; border-bottom:1px solid #ddd;"> Timestamp</th>
          <th style="padding:6px; border-bottom:1px solid #ddd;"> Crime</th>
          <th style="padding:6px; border-bottom:1px solid #ddd;"> Player</th>
          <th style="padding:6px; border-bottom:1px solid #ddd;"> Reason</th>
        </tr>
      </thead><tbody>
  `;

  for (const row of sorted) {
    html += `
      <tr>
        <td style="padding:4px; border-bottom:1px solid #eee; color:#666;">${formatCell(row.timestamp)}</td>
        <td style="padding:4px; border-bottom:1px solid #eee; color:#0044cc;">${formatCell(row.crimeName)}</td>
        <td style="padding:4px; border-bottom:1px solid #eee;">${formatCell(row.player)}</td>
        <td style="padding:4px; border-bottom:1px solid #eee; color:#a00;">${formatCell(row.reason)}</td>
      </tr>
    `;
  }

  html += "</tbody></table>";
  container.innerHTML = html;

    //search input
  const input = document.getElementById("tfoc-search");
  if (input) {
    input.addEventListener("input", () => {
      filterLogs(container.closest("#tfoc-content").parentNode, input.value);
    });
  }
}


function filterLogs(panelNode) {
  const body = panelNode.querySelector('#tfoc-logs-body');
  if (!body) return;

  const all = JSON.parse(body.dataset.allLogs || "[]");

  const playerInput = panelNode.querySelector('#tfoc-search');
  const reasonInput = panelNode.querySelector('#tfoc-reason-search');

  const playerTerm = (playerInput ? playerInput.value : '')
    .trim().toLowerCase();

  const reasonTerm = (reasonInput ? reasonInput.value : '')
    .trim().toLowerCase();

  const filtered = all.filter(row => {
    const player = String(row.player || '').toLowerCase();
    const reason = String(row.reason || '').toLowerCase();

    return (!playerTerm || player.includes(playerTerm)) &&
           (!reasonTerm || reason.includes(reasonTerm));
  });

  let html = `
    <table style="width:100%; border-collapse:collapse; font-size:13px;">
      <thead>
        <tr style="background:#f7f7f7; color:#0044cc;">
          <th style="padding:6px; border-bottom:1px solid #ddd;">Timestamp</th>
          <th style="padding:6px; border-bottom:1px solid #ddd;">Crime</th>
          <th style="padding:6px; border-bottom:1px solid #ddd;">Player</th>
          <th style="padding:6px; border-bottom:1px solid #ddd;">Reason</th>
        </tr>
      </thead>
      <tbody>
  `;

  for (const row of filtered) {
    html += `
      <tr>
        <td style="padding:4px; border-bottom:1px solid #eee; color:#666;">
          ${formatCell(row.timestamp)}
        </td>
        <td style="padding:4px; border-bottom:1px solid #eee; color:#0044cc;">
          ${formatCell(row.crimeName)}
        </td>
        <td style="padding:4px; border-bottom:1px solid #eee;">
          ${formatCell(row.player)}
        </td>
        <td style="padding:4px; border-bottom:1px solid #eee; color:#a00;">
          ${formatCell(row.reason)}
        </td>
      </tr>
    `;
  }

  html += "</tbody></table>";
  body.innerHTML = html;
}

function showSettings(panelNode) {
  const content = panelNode.querySelector('#tfoc-content');
  const current = getStoredToken();

  content.innerHTML = `
    <div style="color:#333;">
      <h2 style="margin:4px 0 10px 0; font-weight:700; color:#000;">Settings</h2>
      <label for="tfoc-token-input" style="display:block; font-weight:600; margin-bottom:6px;">Enter your password below:</label>
      <input id="tfoc-token-input"
             type="text"
             placeholder="Enter Password Here..."
             value="${current}"
             style="padding:6px 8px; width:50%; min-width:220px;
                    border:1px solid #bbb; border-radius:4px;
                    margin-bottom:10px; font-size:13px;">

      <div style="margin-top:4px;">
        <button id="tfoc-save-token"
                style="padding:6px 10px; border-radius:4px;
                       background:#007bff; color:#fff;
                       border:none; cursor:pointer;">Save</button>
        <button id="tfoc-clear-token"
                style="margin-left:8px; padding:6px 10px;
                       border-radius:4px; background:#ddd;
                       border:none; cursor:pointer;">Clear</button>
      </div>

      <p style="font-size:12px; color:#666; margin-top:10px;">
        Password will be saved on your browser
      </p>
    </div>`;
  panelNode.querySelector('#tfoc-save-token').addEventListener('click', () => {
    const val = document.getElementById('tfoc-token-input').value.trim();
    saveStoredToken(val);
    alert('Password saved.');
  });
  panelNode.querySelector('#tfoc-clear-token').addEventListener('click', () => {
    clearStoredToken();
    document.getElementById('tfoc-token-input').value = '';
    alert('Password cleared.');
  });
}


  function init() {
    const tryInsert = setInterval(() => {
      const header = document.querySelector('.faction-tabs-wrap') || document.querySelector('.faction-tabs');
      if (header) {
        clearInterval(tryInsert);
        injectPanel();
      }
    }, 500);
    setTimeout(() => {
      if (!document.getElementById('tfoc-panel')) injectPanel();
    }, 6000);
  }

  setTimeout(init, 1200);
})();
