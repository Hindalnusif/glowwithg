const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTJtkQfP0ltM9raiB_JGrxddm71y8GKJviu1QVjdEpY4QJOOX-4etAy0M_zblw5R2mEVtNKbHf-HSJN/pub?output=csv";

async function loadSchedule() {
  const response = await fetch(SHEET_URL);
  const csv = await response.text();

  const rows = csv.trim().split("\n").slice(1);
  const grouped = {};

  rows.forEach(row => {
    const cols = row.split(",");

    const gym = cols[0]?.trim();
    const handle = cols[1]?.trim();
    const classType = cols[2]?.trim();
    const day = cols[3]?.trim();
    const time = cols[4]?.trim();
    const link = cols[5]?.trim();
    const logo = cols[6]?.trim();
    const active = cols[7]?.trim().toUpperCase();

    if (active !== "TRUE") return;

    if (!grouped[gym]) {
      grouped[gym] = {
        handle,
        classType,
        link,
        logo,
        times: []
      };
    }

    grouped[gym].times.push(`${day} • ${time}`);
  });

  const scheduleList = document.getElementById("schedule-list");

  scheduleList.innerHTML = Object.entries(grouped).map(([gym, item]) => `
    <div class="schedule-card">
      <div class="schedule-top">
        <img src="${item.logo}" class="gym-logo" alt="${gym} logo">

        <div>
          <p class="handle">${item.handle}</p>
          <h2>${gym}</h2>
        </div>
      </div>

      <p class="class-type">${item.classType}</p>

      <ul class="time-list">
        ${item.times.map(time => `<li>${time}</li>`).join("")}
      </ul>

      <a href="${item.link}" target="_blank" class="btn">Open Instagram</a>
    </div>
  `).join("");
}

loadSchedule();