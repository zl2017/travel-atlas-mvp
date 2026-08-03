(function () {
  const root = document.body;
  const go = (target) => { window.location.href = target; };

  document.querySelectorAll("[data-go]").forEach((el) => {
    el.addEventListener("click", () => go(el.dataset.go));
    el.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); go(el.dataset.go); } });
  });

  const reveal = () => document.querySelectorAll(".reveal").forEach((el) => {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")), { threshold: 0.08 });
    observer.observe(el);
  });
  reveal();

  if (!window.NORWAY_TRIP) return;
  const trip = window.NORWAY_TRIP;
  const mapEl = document.getElementById("map");
  const dayList = document.getElementById("day-list");
  const dayDetail = document.getElementById("day-detail");
  const dayCount = document.getElementById("day-count");
  const reminders = document.getElementById("reminders");
  let selectedId = localStorage.getItem("norway-selected-day") || trip.days[0].id;
  let order = JSON.parse(localStorage.getItem("norway-day-order") || "null") || trip.days.map((day) => day.id);

  const getDay = (id) => trip.days.find((day) => day.id === id) || trip.days[0];

  function renderDayList() {
    dayList.innerHTML = order.map((id, index) => {
      const day = getDay(id);
      return `<button class="day-chip ${day.id === selectedId ? "is-selected" : ""}" draggable="true" data-day-id="${day.id}" aria-pressed="${day.id === selectedId}"><span class="day-number">${String(index + 1).padStart(2, "0")}</span><span><strong>${day.date}</strong><small>${day.label}</small></span><span class="drag-handle">⠿</span></button>`;
    }).join("");
    dayList.querySelectorAll("[data-day-id]").forEach((button) => {
      button.addEventListener("click", () => selectDay(button.dataset.dayId));
      button.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", button.dataset.dayId));
      button.addEventListener("dragover", (event) => event.preventDefault());
      button.addEventListener("drop", (event) => {
        event.preventDefault();
        const from = order.indexOf(event.dataTransfer.getData("text/plain"));
        const to = order.indexOf(button.dataset.dayId);
        if (from < 0 || to < 0 || from === to) return;
        const [moved] = order.splice(from, 1); order.splice(to, 0, moved);
        localStorage.setItem("norway-day-order", JSON.stringify(order)); renderDayList();
      });
    });
  }

  function selectDay(id) {
    selectedId = id; localStorage.setItem("norway-selected-day", id); renderDayList(); renderDayDetail();
    document.querySelectorAll(".day-card").forEach((card) => card.classList.toggle("is-active", card.dataset.dayId === id));
    if (window.__tripMap) focusMap(getDay(id));
  }

  function renderDayDetail() {
    const day = getDay(selectedId); const index = trip.days.findIndex((item) => item.id === day.id) + 1;
    dayCount.textContent = `DAY ${String(index).padStart(2, "0")} / ${trip.days.length}`;
    dayDetail.innerHTML = `<div class="day-detail-top"><div><p class="eyebrow">${day.date} / ${day.zone} / ${day.distance}</p><h2>${day.title}</h2><p class="detail-route">${day.route}</p></div><span class="accent-tag tag-${day.accent}">${day.plan || day.zone}</span></div><div class="day-detail-grid"><div><span class="field-label">FIELD NOTES</span><ul class="highlight-list">${day.highlights.map((item) => `<li>${item}</li>`).join("")}</ul></div><div class="detail-note"><span class="field-label">REMINDER</span><p>${day.reminder}</p><span class="field-label">VOICEOVER SEED</span><p class="voiceover">“${day.mood}”</p></div></div><div class="detail-actions"><a class="text-link" href="https://www.google.com/maps" target="_blank" rel="noreferrer">打开地图工具 ↗</a><span class="mono">PUBLIC / NO PRIVATE DOCUMENTS</span></div>`;
  }

  function renderReminders() {
    const items = [
      ["plan-a", "9/26 Plan A 已锁定", "Gryllefjord → Andenes 轮渡，提前现场排队"],
      ["ferry", "轮渡节点", "Route 181 / Route 180 / Fjord1，按当天班次执行"],
      ["weather", "天气替代", "Hesten、Reinebringen、冰川徒步都以天气与安全为先"],
      ["public", "公开版边界", "不上传订单、联系方式、证件、私人地址或凭证"],
      ["backup", "本地编辑", "拖拽排序和勾选状态只保存在当前设备"],
      ["next", "下一版", "补入真实照片、公开地图链接和 Obsidian 素材索引"]
    ];
    reminders.innerHTML = items.map(([id, title, text]) => `<label class="reminder-item"><input type="checkbox" data-reminder="${id}" /><span class="checkmark"></span><span><strong>${title}</strong><small>${text}</small></span></label>`).join("");
    reminders.querySelectorAll("input").forEach((input) => {
      input.checked = localStorage.getItem(`norway-reminder-${input.dataset.reminder}`) === "1";
      input.addEventListener("change", () => localStorage.setItem(`norway-reminder-${input.dataset.reminder}`, input.checked ? "1" : "0"));
    });
  }

  function initMap() {
    if (!mapEl || !window.L) return;
    const map = L.map(mapEl, { zoomControl: false, scrollWheelZoom: true }).setView([63.2, 10.3], 5);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    const north = L.polyline(trip.route.north, { color: "#ff7d57", weight: 4, opacity: 0.88, dashArray: "1 0" }).addTo(map);
    const south = L.polyline(trip.route.south, { color: "#b5e6d5", weight: 4, opacity: 0.88 }).addTo(map);
    const places = [
      [69.6492, 18.9553, "Tromsø"], [69.4141, 17.6639, "Hesten / Senja"], [69.3723, 17.0675, "Gryllefjord"], [69.3145, 16.1194, "Andenes / PLAN A"], [68.1490, 13.6110, "Svolvær"], [67.9330, 13.0680, "Reine"], [60.3930, 5.3242, "Bergen"], [60.8620, 7.1130, "Flåm"], [62.1010, 7.2050, "Geiranger"], [63.0170, 7.7280, "Atlantic Road"], [61.9000, 10.1200, "Ringebu"], [59.3293, 18.0686, "Stockholm"]
    ];
    places.forEach(([lat, lon, label]) => L.circleMarker([lat, lon], { radius: 6, color: "#102027", weight: 2, fillColor: label.includes("PLAN A") ? "#ffcf6e" : "#ff7d57", fillOpacity: 1 }).addTo(map).bindTooltip(label, { direction: "top", offset: [0, -6] }));
    window.__tripMap = map; window.__routeLayers = { north, south };
    focusMap(getDay(selectedId));
  }
  function focusMap(day) { if (!window.__tripMap || !day.map?.length) return; window.__tripMap.flyToBounds(L.latLngBounds(day.map), { padding: [60, 60], duration: 0.7, maxZoom: 9 }); }

  renderDayList(); renderDayDetail(); renderReminders(); initMap();
})();
