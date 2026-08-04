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

  function initAtlasMap() {
    const atlasEl = document.getElementById("atlas-map");
    const trip = window.NORWAY_TRIP;
    if (!atlasEl || !window.maplibregl || !trip) return;
    const frame = atlasEl.closest(".globe-map-frame");
    const gimbal = frame?.closest(".globe-gimbal");
    const ring = document.querySelector(".globe-map-ring");
    const initialView = { center: [60, 20], zoom: 1.25, bearing: -12, pitch: 8 };
    const normalizeAngle = (angle) => {
      let value = angle;
      while (value > 180) value -= 360;
      while (value < -180) value += 360;
      return value;
    };
    const atlasMap = new maplibregl.Map({
      container: atlasEl,
      style: "https://tiles.openfreemap.org/styles/liberty",
      ...initialView,
      projection: { type: "globe" },
      dragPan: false,
      dragRotate: false,
      touchZoomRotate: true,
      touchPitch: false,
      pitchWithRotate: false,
      maxPitch: 58,
      maxZoom: 3.7,
      attributionControl: true
    });
    atlasMap.touchZoomRotate?.disableRotation?.();
    atlasMap.addControl(new maplibregl.NavigationControl({ showCompass: true }), "bottom-right");
    installGlobeDrag(atlasMap, atlasEl, frame, ring, gimbal);

    const places = [
      { lat: 69.6492, lon: 18.9553, label: "Tromsø", meta: "NORWAY / NORTH", accent: "north", href: "trip.html" },
      { lat: 69.4141, lon: 17.6639, label: "Senja", meta: "NORWAY / NORTH", accent: "north", href: "trip.html" },
      { lat: 67.9330, lon: 13.0680, label: "Reine", meta: "NORWAY / LOFOTEN", accent: "north", href: "trip.html" },
      { lat: 60.3930, lon: 5.3242, label: "Bergen", meta: "NORWAY / FJORDS", accent: "south", href: "trip.html" },
      { lat: 62.1010, lon: 7.2050, label: "Geiranger", meta: "NORWAY / FJORDS", accent: "south", href: "trip.html" },
      { lat: 59.3293, lon: 18.0686, label: "Stockholm", meta: "SWEDEN / CITY", accent: "south", href: "trip.html" },
      { lat: 39.9042, lon: 116.4074, label: "北京", meta: "HOME BASE", accent: "home" }
    ];
    afterMapStyleReady(atlasMap, () => {
      atlasMap.setProjection({ type: "globe" });
      atlasMap.setSky({ "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 1, 3.4, 1, 3.7, 0.8] });
      addLocalBasemap(atlasMap, places);
      addRouteSource(atlasMap, "atlas-north", trip.route.north, "#ff7d57");
      addRouteSource(atlasMap, "atlas-south", trip.route.south, "#2d9b86");
      addAtlasPlaceLayers(atlasMap, places);
    });
    atlasMap.on("dragstart", () => frame?.classList.add("is-dragging"));
    atlasMap.on("move", () => {
      const center = atlasMap.getCenter();
      const longitude = center.lng;
      const viewPitch = Math.max(-32, Math.min(32, (initialView.center[1] - center.lat) * 0.72));
      gimbal?.style.setProperty("--axis-turn", `${normalizeAngle(longitude - initialView.center[0])}deg`);
      gimbal?.style.setProperty("--view-pitch", `${viewPitch}deg`);
    });
    atlasMap.on("dragend", () => frame?.classList.remove("is-dragging"));
    atlasMap.on("rotatestart", () => frame?.classList.add("is-dragging"));
    atlasMap.on("rotateend", () => frame?.classList.remove("is-dragging"));
    document.addEventListener("click", (event) => {
      if (event.target.closest("#atlas-map, a, button, input, textarea, select, [data-go], .journey-card, .maplibregl-popup, .maplibregl-ctrl")) return;
      atlasMap.easeTo({ ...initialView, duration: 900, essential: true });
      ring?.style.setProperty("--atlas-turn", `${initialView.bearing}deg`);
      gimbal?.style.setProperty("--axis-turn", "0deg");
      gimbal?.style.setProperty("--view-pitch", "0deg");
    });
    window.__atlasMap = atlasMap;
  }

  function installGlobeDrag(map, element, frame, ring, gimbal) {
    let gesture = null;
    const stop = (event) => {
      if (!gesture) return;
      gesture = null;
      frame?.classList.remove("is-dragging");
      element.releasePointerCapture?.(event.pointerId);
    };
    element.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || event.target.closest(".maplibregl-marker, .maplibregl-ctrl")) return;
      const center = map.getCenter();
      gesture = { x: event.clientX, y: event.clientY, center, bearing: map.getBearing(), pitch: map.getPitch() };
      element.setPointerCapture?.(event.pointerId);
      frame?.classList.add("is-dragging");
      event.preventDefault();
    }, { passive: false });
    element.addEventListener("pointermove", (event) => {
      if (!gesture) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      const longitude = ((gesture.center.lng - dx * 0.22 + 540) % 360) - 180;
      const latitude = Math.max(-78, Math.min(78, gesture.center.lat + dy * 0.32));
      map.jumpTo({ center: [longitude, latitude], bearing: gesture.bearing, pitch: gesture.pitch });
      event.preventDefault();
    }, { passive: false });
    element.addEventListener("pointerup", stop);
    element.addEventListener("pointercancel", stop);
    element.addEventListener("lostpointercapture", stop);
  }

  function toLineString(coordinates) {
    return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coordinates.map(([lat, lon]) => [Number(lon), Number(lat)]) } };
  }

  function afterMapStyleReady(map, callback) {
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      callback();
    };
    map.once("style.load", start);
    map.once("load", start);
    if (map.isStyleLoaded?.()) queueMicrotask(start);
    window.setTimeout(() => map.isStyleLoaded?.() && start(), 3500);
  }

  function addRasterFallback(map) {
    const sourceId = "atlas-osm-raster-fallback";
    if (map.getSource(sourceId)) return;
    map.addSource(sourceId, {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© OpenStreetMap contributors"
    });
    const firstContentLayer = map.getStyle().layers?.find((layer) => layer.type !== "background");
    map.addLayer({ id: "atlas-osm-raster-fallback", type: "raster", source: sourceId, paint: { "raster-opacity": 1 } }, firstContentLayer?.id);
  }

  function addLocalBasemap(map, places = []) {
    if (map.getSource("atlas-local-countries")) return;
    const firstContentLayer = map.getStyle().layers?.find((layer) => layer.type !== "background");
    map.addSource("atlas-local-countries", { type: "geojson", data: "data/world-countries.geojson" });
    map.addLayer({
      id: "atlas-local-ocean",
      type: "background",
      paint: { "background-color": "#88bdd8" },
    }, firstContentLayer?.id);
    map.addLayer({
      id: "atlas-local-land",
      type: "fill",
      source: "atlas-local-countries",
      paint: {
        "fill-color": ["match", ["get", "CONTINENT"], "Europe", "#d8e8ce", "Asia", "#dce6c5", "North America", "#d7e4c7", "South America", "#d5e2bf", "Africa", "#e4dfb8", "Oceania", "#d5e1c2", "#d9e3c7"],
        "fill-opacity": 0.94,
      },
    }, firstContentLayer?.id);
    map.addLayer({
      id: "atlas-local-boundaries",
      type: "line",
      source: "atlas-local-countries",
      paint: { "line-color": "#75949a", "line-width": ["interpolate", ["linear"], ["zoom"], 0, 0.35, 4, 0.8, 8, 1.2], "line-opacity": 0.72 },
    }, firstContentLayer?.id);
    map.addLayer({
      id: "atlas-local-country-labels",
      type: "symbol",
      source: "atlas-local-countries",
      layout: {
        "text-field": ["coalesce", ["get", "NAME_ZH"], ["get", "NAME_EN"]],
        "text-size": ["interpolate", ["linear"], ["zoom"], 0, 7, 2, 9, 5, 12, 8, 14],
        "text-max-width": 8,
        "text-allow-overlap": false,
        "text-ignore-placement": false,
      },
      paint: { "text-color": "#30555d", "text-halo-color": "#eef4e7", "text-halo-width": 1.3, "text-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.35, 1.7, 0.65, 3, 1] },
    }, firstContentLayer?.id);
    const placeFeatures = places.map((place) => ({ type: "Feature", properties: { label: place.label }, geometry: { type: "Point", coordinates: [Number(place.lon), Number(place.lat)] } }));
    map.addSource("atlas-local-places", { type: "geojson", data: { type: "FeatureCollection", features: placeFeatures } });
    map.addLayer({
      id: "atlas-local-place-labels",
      type: "symbol",
      source: "atlas-local-places",
      minzoom: 2.8,
      layout: { "text-field": ["get", "label"], "text-size": ["interpolate", ["linear"], ["zoom"], 3, 9, 7, 13], "text-offset": [0, 1.2], "text-anchor": "top", "text-allow-overlap": false },
      paint: { "text-color": "#234c56", "text-halo-color": "#f2f5eb", "text-halo-width": 1.5 },
    }, firstContentLayer?.id);
  }

  function addRouteSource(map, id, coordinates, color) {
    map.addSource(id, { type: "geojson", data: toLineString(coordinates) });
    map.addLayer({ id: `${id}-glow`, type: "line", source: id, paint: { "line-color": color, "line-width": 16, "line-opacity": 0.18, "line-blur": 5 } });
    map.addLayer({ id: `${id}-line`, type: "line", source: id, paint: { "line-color": color, "line-width": 4, "line-opacity": 0.96, "line-dasharray": [2, 1] } });
  }

  function addAtlasPlaceLayers(map, places) {
    const features = places.map((place, index) => ({
      type: "Feature",
      properties: { label: place.label, meta: place.meta, accent: place.accent, href: place.href || "", indexLabel: String(index + 1).padStart(2, "0"), coordinates: `${Number(place.lat).toFixed(4)}°N, ${Number(place.lon).toFixed(4)}°E` },
      geometry: { type: "Point", coordinates: [Number(place.lon), Number(place.lat)] }
    }));
    map.addSource("atlas-discovery-points", { type: "geojson", data: { type: "FeatureCollection", features } });
    map.addLayer({
      id: "atlas-discovery-halo",
      type: "circle",
      source: "atlas-discovery-points",
      paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 9, 2.5, 13, 3.7, 16], "circle-color": ["match", ["get", "accent"], "home", "#bdacd9", "south", "#b5e6d5", "#ff7d57"], "circle-opacity": 0.24, "circle-blur": 0.35 }
    });
    map.addLayer({
      id: "atlas-discovery-points",
      type: "circle",
      source: "atlas-discovery-points",
      paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 5.5, 2.5, 8, 3.7, 10], "circle-color": ["match", ["get", "accent"], "home", "#bdacd9", "south", "#b5e6d5", "#ff7d57"], "circle-stroke-color": "#092022", "circle-stroke-width": 1.5, "circle-opacity": 0.98 }
    });
    map.addLayer({
      id: "atlas-discovery-numbers",
      type: "symbol",
      source: "atlas-discovery-points",
      layout: { "text-field": ["get", "indexLabel"], "text-size": ["interpolate", ["linear"], ["zoom"], 0, 6, 3.7, 9], "text-allow-overlap": true },
      paint: { "text-color": "#092022", "text-halo-color": "#eef4e7", "text-halo-width": 0.7 }
    });
    map.on("click", "atlas-discovery-points", (event) => {
      const feature = event.features?.[0];
      if (!feature) return;
      const properties = feature.properties || {};
      const coordinates = feature.geometry.coordinates.slice();
      const action = properties.href ? `<a class="atlas-popup-link" href="${properties.href}">打开这次路书 ↗</a>` : `<span class="atlas-popup-note">HOME BASE / ARCHIVE SOON</span>`;
      new maplibregl.Popup({ offset: 14, closeButton: true }).setLngLat(coordinates).setHTML(`<span class="atlas-popup-meta">${properties.meta}</span><strong>${properties.label}</strong><small class="atlas-popup-coordinates">${properties.coordinates}</small>${action}`).addTo(map);
      map.flyTo({ center: coordinates, zoom: 2.9, duration: 700 });
    });
    map.on("mouseenter", "atlas-discovery-points", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "atlas-discovery-points", () => { map.getCanvas().style.cursor = ""; });
  }

  initAtlasMap();

  if (!window.NORWAY_TRIP) return;
  const trip = window.NORWAY_TRIP;
  const mapEl = document.getElementById("map");
  const dayList = document.getElementById("day-list");
  const dayDetail = document.getElementById("day-detail");
  const dayCount = document.getElementById("day-count");
  const reminders = document.getElementById("reminders");
  if (!mapEl || !dayList || !dayDetail || !dayCount || !reminders) return;
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
      layers.forEach((layerId) => window.__tripMap?.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none"));
    });
    (window.__routeMarkers || []).forEach(({ marker, place }) => { marker.getElement().style.opacity = mode === "all" || mode === place.zone ? "1" : "0.22"; });
    (window.__waypointMarkers || []).forEach(({ marker, place }) => { marker.getElement().style.opacity = mode === "all" || mode === place.zone ? "0.92" : "0.18"; });
    renderRouteInspector(mode);
    if (shouldFit && window.__tripMap) {
      const coordinates = mode === "all" ? trip.route.north.concat(trip.route.south) : trip.route[mode];
      fitMapCoordinates(window.__tripMap, coordinates, 42, 7);
    }
  }

  function initMap() {
    if (!mapEl || !window.maplibregl) return;
    const map = new maplibregl.Map({
      container: mapEl,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [10.3, 63.2],
      zoom: 5,
      dragRotate: true,
      pitchWithRotate: true,
      maxPitch: 58,
      attributionControl: true
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "bottom-right");
    afterMapStyleReady(map, () => {
      addLocalBasemap(map, placeCatalog);
      const routeLayers = {};
      ["north", "south"].forEach((key) => {
        const sourceId = `route-${key}`;
        addRouteSource(map, sourceId, trip.route[key], key === "north" ? "#ff7d57" : "#b5e6d5");
        routeLayers[key] = [`${sourceId}-glow`, `${sourceId}-line`];
      });
      const markers = placeCatalog.map((place, index) => {
        const element = document.createElement("button");
        element.type = "button";
        element.className = `route-marker marker-${place.zone}`;
        element.setAttribute("aria-label", place.label);
        element.innerHTML = `<b>${String(index + 1).padStart(2, "0")}</b><i>${iconFor(place.kind)}</i>`;
        const marker = new maplibregl.Marker({ element, anchor: "center" }).setLngLat([place.lon, place.lat]).setPopup(new maplibregl.Popup({ offset: 18 }).setHTML(`<strong>${place.label}</strong><br><span>${place.note}</span>`)).addTo(map);
        marker.getElement().addEventListener("click", () => selectDay(place.dayId));
        return { marker, place };
      });
      const waypointMarkers = secondaryWaypoints.map((place) => {
        const element = document.createElement("button");
        element.type = "button";
        element.className = `route-waypoint marker-${place.zone}`;
        element.setAttribute("aria-label", place.label);
        element.innerHTML = "<i></i>";
        const marker = new maplibregl.Marker({ element, anchor: "center" }).setLngLat([place.lon, place.lat]).setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(`<strong>${place.label}</strong><br><span>${place.note}</span>`)).addTo(map);
        marker.getElement().addEventListener("click", () => selectDay(place.dayId));
        return { marker, place };
      });
      map.addSource("day-focus", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "day-focus-line", type: "line", source: "day-focus", paint: { "line-color": "#ffcf6e", "line-width": 3, "line-opacity": 1, "line-dasharray": [1, 2] } });
      const stopCount = document.getElementById("map-stop-count");
      if (stopCount) stopCount.textContent = String(waypointCatalog.length);
      window.__tripMap = map; window.__routeLayers = routeLayers; window.__routeMarkers = markers; window.__waypointMarkers = waypointMarkers;
      document.querySelectorAll("[data-route-mode]").forEach((button) => button.addEventListener("click", () => setRouteMode(button.dataset.routeMode)));
      document.getElementById("map-reset")?.addEventListener("click", () => setRouteMode(activeRouteMode));
      setRouteMode("all", true); focusMap(getDay(selectedId), false);
      mapEl.setAttribute("aria-busy", "false");
    });
  }

  function fitMapCoordinates(map, coordinates, padding, maxZoom) {
    if (!coordinates?.length) return;
    if (coordinates.length === 1) {
      map.flyTo({ center: [Number(coordinates[0][1]), Number(coordinates[0][0])], zoom: maxZoom, duration: 700 });
      return;
    }
    const bounds = new maplibregl.LngLatBounds();
    coordinates.forEach(([lat, lon]) => bounds.extend([Number(lon), Number(lat)]));
    map.fitBounds(bounds, { padding, maxZoom, duration: 700 });
  }

  function focusMap(day, shouldFly = true) {
    if (!window.__tripMap || !day.map?.length) return;
    const dayFocus = window.__tripMap.getSource("day-focus");
    if (dayFocus) dayFocus.setData(toLineString(day.map));
    const title = document.getElementById("map-focus-title"); const subtitle = document.getElementById("map-focus-subtitle"); const bar = document.getElementById("map-progress-bar");
    if (title) title.textContent = day.title;
    if (subtitle) subtitle.textContent = `${day.date} · ${day.route}`;
    if (bar) bar.style.width = `${Math.max(8, ((trip.days.findIndex((item) => item.id === day.id) + 1) / trip.days.length) * 100)}%`;
    renderRouteInspector(activeRouteMode);
    if (shouldFly) {
      fitMapCoordinates(window.__tripMap, day.map, 70, day.map.length === 1 ? 8 : 10);
    }
  }

  renderDayList(); renderDayDetail(); renderReminders();

  // Defer the map until it is close to the viewport so the first screen stays responsive.
  if (mapEl && "IntersectionObserver" in window) {
    const mapObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      initMap();
      mapObserver.disconnect();
    }, { rootMargin: "360px 0px" });
    mapEl.setAttribute("aria-busy", "true");
    mapObserver.observe(mapEl);
  } else {
    initMap();
  }
})();
