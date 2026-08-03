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

  const placeCatalog = [
    { lat: 69.6492, lon: 18.9553, label: "Tromsø", zone: "north", dayId: "0924", kind: "flight", note: "北线起点" },
    { lat: 69.4141, lon: 17.6639, label: "Hesten / Senja", zone: "north", dayId: "0925", kind: "hike", note: "山海第一幕" },
    { lat: 69.3723, lon: 17.0675, label: "Gryllefjord", zone: "north", dayId: "0926", kind: "ferry", note: "Plan A 排队点" },
    { lat: 69.3145, lon: 16.1194, label: "Andenes", zone: "north", dayId: "0926", kind: "ferry", note: "Route 180 抵达" },
    { lat: 68.1490, lon: 13.6110, label: "Svolvær", zone: "north", dayId: "0927", kind: "sea", note: "海钓日" },
    { lat: 67.9330, lon: 13.0680, label: "Reine", zone: "north", dayId: "0927", kind: "road", note: "红房子与海" },
    { lat: 60.3930, lon: 5.3242, label: "Bergen", zone: "south", dayId: "0929", kind: "flight", note: "南线起点" },
    { lat: 60.8620, lon: 7.1130, label: "Flåm", zone: "south", dayId: "0929", kind: "fjord", note: "峡湾入口" },
    { lat: 62.1010, lon: 7.2050, label: "Geiranger", zone: "south", dayId: "1001", kind: "ferry", note: "蓝冰与峡湾" },
    { lat: 63.0170, lon: 7.7280, label: "Atlantic Road", zone: "south", dayId: "1002", kind: "road", note: "海上公路" },
    { lat: 61.9000, lon: 10.1200, label: "Ringebu", zone: "south", dayId: "1003", kind: "road", note: "荒原入口" },
    { lat: 59.3293, lon: 18.0686, label: "Stockholm", zone: "south", dayId: "1004", kind: "city", note: "城市收束" }
  ];
  const waypointLabels = {
    "69.6492,18.9553": "Tromsø", "69.3554,17.308": "Brehsholmen", "69.4141,17.6639": "Hesten",
    "69.468,17.598": "Ersfjord / Steinfjord", "69.3723,17.0675": "Gryllefjord", "69.3145,16.1194": "Andenes",
    "68.857,16.564": "Gullesfjord", "68.149,13.611": "Svolvær", "68.1524,14.2042": "Henningsvær",
    "68.198,13.536": "Haukland", "68.044,13.347": "Nusfjord", "67.933,13.068": "Reine",
    "67.945,13.12": "Hamnøy", "67.88,12.982": "Å", "68.545,16.558": "Bjerkvik",
    "60.393,5.3242": "Bergen", "60.862,7.113": "Flåm", "60.863,7.121": "Aurland",
    "60.833,6.841": "Gudvangen", "61.571,6.482": "Skei / Jølster", "61.726,6.818": "Briksdal",
    "61.879,6.974": "Lovatnet", "62.085,6.867": "Hellesylt", "62.101,7.205": "Geiranger",
    "62.047,7.268": "Dalsnibba", "62.119,7.169": "Ørnesvingen", "62.456,7.67": "Trollstigen",
    "63.017,7.728": "Atlantic Road", "62.675,8.551": "Sunndalsøra", "62.315,9.548": "Snøhetta / Dovrefjell",
    "62.132,10.225": "Folldal", "61.9,10.12": "Ringebu", "59.9139,10.7522": "Oslo Airport",
    "59.3293,18.0686": "Stockholm"
  };
  const coordinateKey = (coordinates) => coordinates.map((value) => Number(value)).join(",");
  const waypointMap = new Map();
  trip.days.forEach((day) => day.map.forEach((coordinates) => {
    const key = coordinateKey(coordinates);
    if (!waypointMap.has(key)) waypointMap.set(key, { lat: Number(coordinates[0]), lon: Number(coordinates[1]), label: waypointLabels[key] || `${day.label} / waypoint`, zone: day.zone.toLowerCase() === "north" ? "north" : "south", dayId: day.id, kind: "waypoint", note: `${day.date} · ${day.title}` });
  }));
  const waypointCatalog = [...waypointMap.values()];
  const primaryKeys = new Set(placeCatalog.map((place) => coordinateKey([place.lat, place.lon])));
  const secondaryWaypoints = waypointCatalog.filter((place) => !primaryKeys.has(coordinateKey([place.lat, place.lon])));
  const routeModes = {
    all: { label: "全程路线", code: "NORTH + SOUTH", copy: "从北极圈到峡湾，再沿公路回到城市。", layers: ["north", "south"], color: "#ff7d57" },
    north: { label: "北线 / 极光", code: "NORTH / 09.24—09.29", copy: "特罗姆瑟、Senja、Andøya 与罗弗敦，路线由海路接上公路。", layers: ["north"], color: "#ff7d57" },
    south: { label: "南线 / 峡湾", code: "SOUTH / 09.29—10.06", copy: "从卑尔根进入峡湾，穿过冰川、公路与荒原，再抵达 Stockholm。", layers: ["south"], color: "#b5e6d5" }
  };
  let activeRouteMode = "all";

  function routeModePlaces(mode) {
    return placeCatalog.filter((place) => mode === "all" || place.zone === mode);
  }

  function renderRouteInspector(mode) {
    const config = routeModes[mode];
    const title = document.getElementById("route-inspector-title");
    const copy = document.getElementById("route-inspector-copy");
    const list = document.getElementById("route-stop-list");
    if (!title || !copy || !list) return;
    title.textContent = config.label;
    copy.textContent = config.copy;
    list.innerHTML = routeModePlaces(mode).map((place, index) => `<button class="route-stop ${getDay(place.dayId).id === selectedId ? "is-current" : ""}" type="button" data-stop-day="${place.dayId}" data-stop-label="${place.label}"><span class="route-stop-number">${String(index + 1).padStart(2, "0")}</span><span><strong>${place.label}</strong><small>${place.note}</small></span><span class="route-stop-icon">${iconFor(place.kind)}</span></button>`).join("");
    list.querySelectorAll("[data-stop-day]").forEach((stop) => stop.addEventListener("click", () => selectDay(stop.dataset.stopDay)));
  }

  function iconFor(kind) {
    return { flight: "↗", ferry: "≈", hike: "△", sea: "◌", fjord: "⌁", road: "→", city: "✦" }[kind] || "•";
  }

  function setRouteMode(mode, shouldFit = true) {
    activeRouteMode = mode;
    const config = routeModes[mode];
    document.querySelectorAll("[data-route-mode]").forEach((button) => {
      const selected = button.dataset.routeMode === mode;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
    });
    const label = document.getElementById("map-route-label");
    if (label) label.textContent = config.code;
    Object.entries(window.__routeLayers || {}).forEach(([key, layers]) => {
      const visible = mode === "all" || mode === key;
      layers.forEach((layer) => layer.setStyle({ opacity: visible ? layer.options.baseOpacity : 0, weight: visible ? layer.options.baseWeight : 0 }));
    });
    (window.__routeMarkers || []).forEach(({ marker, place }) => marker.setOpacity(mode === "all" || mode === place.zone ? 1 : 0.22));
    (window.__waypointMarkers || []).forEach(({ marker, place }) => marker.setOpacity(mode === "all" || mode === place.zone ? 0.92 : 0.18));
    renderRouteInspector(mode);
    if (shouldFit && window.__tripMap) {
      const coordinates = mode === "all" ? trip.route.north.concat(trip.route.south) : trip.route[mode];
      window.__tripMap.flyToBounds(L.latLngBounds(coordinates), { padding: [42, 42], duration: 0.75, maxZoom: 7 });
    }
  }

  function initMap() {
    if (!mapEl || !window.L) return;
    const map = L.map(mapEl, { zoomControl: false, scrollWheelZoom: true, preferCanvas: true }).setView([63.2, 10.3], 5);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors &copy; CARTO' }).addTo(map);
    const routeLayers = {};
    ["north", "south"].forEach((key) => {
      const color = key === "north" ? "#ff7d57" : "#b5e6d5";
      const glow = L.polyline(trip.route[key], { color, weight: 16, opacity: 0.13, baseOpacity: 0.13, baseWeight: 16, lineCap: "round", lineJoin: "round" }).addTo(map);
      const line = L.polyline(trip.route[key], { color, weight: 4, opacity: 0.94, baseOpacity: 0.94, baseWeight: 4, className: "route-line-animated", lineCap: "round", lineJoin: "round" }).addTo(map);
      routeLayers[key] = [glow, line];
    });
    const markers = placeCatalog.map((place, index) => {
      const icon = L.divIcon({ className: "route-marker-wrap", html: `<span class="route-marker marker-${place.zone}"><b>${String(index + 1).padStart(2, "0")}</b><i>${iconFor(place.kind)}</i></span>`, iconSize: [38, 38], iconAnchor: [19, 19] });
      const marker = L.marker([place.lat, place.lon], { icon, keyboard: true }).addTo(map).bindPopup(`<strong>${place.label}</strong><br><span>${place.note}</span>`);
      marker.on("click", () => selectDay(place.dayId));
      return { marker, place };
    });
    const waypointMarkers = secondaryWaypoints.map((place) => {
      const icon = L.divIcon({ className: "route-waypoint-wrap", html: `<span class="route-waypoint marker-${place.zone}"><i></i></span>`, iconSize: [18, 18], iconAnchor: [9, 9] });
      const marker = L.marker([place.lat, place.lon], { icon, keyboard: true }).addTo(map).bindPopup(`<strong>${place.label}</strong><br><span>${place.note}</span>`);
      marker.on("click", () => selectDay(place.dayId));
      return { marker, place };
    });
    const dayFocus = L.polyline([], { color: "#ffcf6e", weight: 3, opacity: 1, dashArray: "5 10", className: "day-focus-line", lineCap: "round" }).addTo(map);
    const stopCount = document.getElementById("map-stop-count");
    if (stopCount) stopCount.textContent = String(waypointCatalog.length);
    window.__tripMap = map; window.__routeLayers = routeLayers; window.__routeMarkers = markers; window.__waypointMarkers = waypointMarkers; window.__dayFocus = dayFocus;
    document.querySelectorAll("[data-route-mode]").forEach((button) => button.addEventListener("click", () => setRouteMode(button.dataset.routeMode)));
    document.getElementById("map-reset")?.addEventListener("click", () => setRouteMode(activeRouteMode));
    setRouteMode("all", true); focusMap(getDay(selectedId), false);
  }
  function focusMap(day, shouldFly = true) {
    if (!window.__tripMap || !day.map?.length) return;
    window.__dayFocus?.setLatLngs(day.map);
    const title = document.getElementById("map-focus-title"); const subtitle = document.getElementById("map-focus-subtitle"); const bar = document.getElementById("map-progress-bar");
    if (title) title.textContent = day.title;
    if (subtitle) subtitle.textContent = `${day.date} · ${day.route}`;
    if (bar) bar.style.width = `${Math.max(8, ((trip.days.findIndex((item) => item.id === day.id) + 1) / trip.days.length) * 100)}%`;
    renderRouteInspector(activeRouteMode);
    if (shouldFly) {
      window.__tripMap.flyToBounds(L.latLngBounds(day.map), { padding: [70, 70], duration: 0.7, maxZoom: day.map.length === 1 ? 8 : 10 });
    }
  }

  renderDayList(); renderDayDetail(); renderReminders(); initMap();
})();
