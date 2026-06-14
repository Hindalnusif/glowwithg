const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTJtkQfP0ltM9raiB_JGrxddm71y8GKJviu1QVjdEpY4QJOOX-4etAy0M_zblw5R2mEVtNKbHf-HSJN/pub?output=csv";

const scheduleList = document.getElementById("schedule-list");

const LOCAL_LOGOS = {
  corpo: "assets/corpo.jpg",
  heat: "assets/heat.jpg",
  openspace: "assets/openspace.jpg",
  open: "assets/openspace.jpg",
  tempo: "assets/tempo.jpg"
};

function parseCsv(csv) {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(current.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  row.push(current.trim());
  if (row.some(Boolean)) rows.push(row);

  return rows;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));
}

function normalizeUrl(value = "") {
  try {
    return new URL(value).href;
  } catch {
    return "";
  }
}

function localLogoFor(item, gym) {
  const source = `${gym} ${item.handle} ${item.link}`.toLowerCase();
  const match = Object.keys(LOCAL_LOGOS).find(key => source.includes(key));

  return match ? LOCAL_LOGOS[match] : "";
}

function logoFor(item, gym) {
  return localLogoFor(item, gym) || normalizeUrl(item.logo);
}

function initialsFor(value = "") {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join("")
    .toUpperCase() || "G";
}

function renderStatus(message) {
  scheduleList.innerHTML = `<p class="schedule-status">${escapeHtml(message)}</p>`;
}

async function loadSchedule() {
  if (!scheduleList) return;

  try {
    const response = await fetch(SHEET_URL);

    if (!response.ok) {
      throw new Error("Schedule request failed");
    }

    const csv = await response.text();
    const rows = parseCsv(csv).slice(1);
    const grouped = new Map();

    rows.forEach(cols => {
      const [gym, handle, classType, day, time, link, logo, active] = cols;

      if (!gym || active?.toUpperCase() !== "TRUE") return;

      if (!grouped.has(gym)) {
        grouped.set(gym, {
          handle,
          classType,
          link,
          logo,
          times: []
        });
      }

      grouped.get(gym).times.push(`${day} • ${time}`);
    });

    if (!grouped.size) {
      renderStatus("No active classes are listed right now. Check back soon.");
      return;
    }

    scheduleList.innerHTML = Array.from(grouped.entries()).map(([gym, item]) => {
      const logo = logoFor(item, gym);
      const logoClass = logo ? "" : " logo-failed";

      return `
        <article class="schedule-card">
          <div class="schedule-top">
            <div class="gym-logo-wrap${logoClass}">
              <img src="${escapeHtml(logo)}" class="gym-logo" alt="${escapeHtml(gym)} logo" onerror="this.parentElement.classList.add('logo-failed')">
              <span class="gym-logo-fallback" aria-hidden="true">${escapeHtml(initialsFor(gym))}</span>
            </div>

            <div>
              <p class="handle">${escapeHtml(item.handle)}</p>
              <h2>${escapeHtml(gym)}</h2>
            </div>
          </div>

          <p class="class-type">${escapeHtml(item.classType)}</p>

          <ul class="time-list">
            ${item.times.map(time => `<li>${escapeHtml(time)}</li>`).join("")}
          </ul>

          <a href="${escapeHtml(normalizeUrl(item.link))}" target="_blank" rel="noopener noreferrer" class="btn">Open Instagram</a>
        </article>
      `;
    }).join("");
  } catch (error) {
    renderStatus("The schedule could not load right now. Please try again soon.");
  }
}

loadSchedule();
