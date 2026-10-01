"use strict";
const STORE = "hammer.phase1.review.v21";
let db;
try {
  db = JSON.parse(localStorage.getItem(STORE));
} catch {}
if (!db || db.version !== 21) db = HammerSeed();

// Auto-migrate old statuses
const statusMap = {
  complete: "published",
  incomplete: "needs_review",
  matched: "published",
  new: "needs_review",
  archived: "closed",
  expired: "closed",
  error: "rejected",
};
let migrated = false;
if (db && db.ai_opportunities) {
  db.ai_opportunities.forEach((o) => {
    if (statusMap[o.status]) {
      o.status = statusMap[o.status];
      migrated = true;
    }
  });
  if (migrated) localStorage.setItem(STORE, JSON.stringify(db));
}
const ui = {
  mode: "dancer",
  cms: "jobs",
  mobile: "feed",
  role: "admin",
  guest: false,
  sourceTab: "sources",
  queueTab: "community",
  hub: "all",
  job: null,
  lang: "en",
  search: "",
  status: "",
  feedSearch: "",
  filters: { city: "", type: "", radius: null, duration: 365, min: 0 },
  running: false,
  dialog: null,
  metrics: null,
  pendingJob: null,
  dirty: false,
};
const $ = (s) => document.querySelector(s);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
const dancer = () => db.dancers[0];
const ext = () => db.extensions;
const job = (id) => db.ai_opportunities.find((o) => o.id === Number(id));
const history = (id) =>
  (ext().history[id] ||= {
    saved: false,
    drafts: {},
    subjects: {},
    applied_at: null,
  });
const stamp = (v) =>
  v
    ? new Date(v).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not yet";
const dateLabel = (v) =>
  v ? new Date(v).toLocaleDateString("en-GB") : "Not provided";
const icon = (n) =>
  `<i class="${n.endsWith("-fill") ? "ph-fill" : "ph"} ph-${n.replace(/-fill$/, "")}" aria-hidden="true"></i>`;
const btn = (action, label, value = "", cls = "", disabled = false) =>
  `<button data-action="${action}" data-value="${esc(value)}" class="${cls}" ${disabled ? "disabled" : ""}>${label}</button>`;
const ib = (action, label, symbol, value = "", disabled = false) =>
  `<button class="icon-button" data-action="${action}" data-value="${esc(value)}" aria-label="${esc(label)}" title="${esc(label)}" ${disabled ? "disabled" : ""}>${icon(symbol)}</button>`;
const pill = (label, kind = "") =>
  `<span class="pill ${kind}">${esc(label)}</span>`;
const options = (list, value) => {
  const vals = Array.isArray(value)
    ? value.map(String)
    : String(value ?? "").split(",");
  return list
    .map((x) => {
      const [v, t] = Array.isArray(x) ? x : [x, x];
      return `<option value="${esc(v)}" ${vals.includes(String(v)) ? "selected" : ""}>${esc(t)}</option>`;
    })
    .join("");
};
const field = (name, label, value = "", type = "text", attrs = "") =>
  `<label class="field"><span>${label}</span><input name="${name}" type="${type}" value="${esc(value)}" ${attrs}></label>`;
const select = (name, label, list, value = "", attrs = "") =>
  `<label class="field"><span>${label}</span><select name="${name}" ${attrs}>${options(list, value)}</select></label>`;
const area = (name, label, value = "", attrs = "") =>
  `<label class="field"><span>${label}</span><textarea name="${name}" ${attrs}>${esc(value)}</textarea></label>`;
const kv = (items) =>
  `<dl class="kv">${items.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v ?? "Not provided")}</dd>`).join("")}</dl>`;
const empty = (title, text = "", action = "") =>
  `<div class="empty"><h3>${title}</h3><p>${text}</p>${action}</div>`;
const table = (heads, rows) =>
  `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.join("") : `<tr><td colspan="${heads.length}">${empty("No records", "Try a different search or filter.")}</td></tr>`}</tbody></table></div>`;
const row = (cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
const types = ["audition", "workshop", "commercial"];
const statuses = [
  ["needs_review", "🟡 Chờ duyệt"],
  ["published", "🟢 Đang hiển thị"],
  ["suspended", "🟡 Tạm ẩn"],
  ["closed", "🔴 Đã đóng"],
];
const countries = ["Japan", "Singapore"];
const cities = ["Tokyo", "Osaka", "Kyoto", "Singapore"];
const normalizeKeyword = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
const geoData = {
  Asia: {
    AF: { name: "Afghanistan", cities: ["Kabul"] },
    BH: { name: "Bahrain", cities: ["Manama"] },
    BD: { name: "Bangladesh", cities: ["Dhaka", "Chittagong"] },
    BT: { name: "Bhutan", cities: ["Thimphu"] },
    BN: { name: "Brunei", cities: ["Bandar Seri Begawan"] },
    KH: { name: "Cambodia", cities: ["Phnom Penh", "Siem Reap"] },
    CN: {
      name: "China",
      cities: ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu"],
    },
    IN: {
      name: "India",
      cities: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai"],
    },
    ID: {
      name: "Indonesia",
      cities: ["Jakarta", "Surabaya", "Bandung", "Bali"],
    },
    IR: { name: "Iran", cities: ["Tehran"] },
    IQ: { name: "Iraq", cities: ["Baghdad"] },
    IL: { name: "Israel", cities: ["Tel Aviv", "Jerusalem"] },
    JP: {
      name: "Japan",
      cities: [
        "Tokyo",
        "Osaka",
        "Kyoto",
        "Yokohama",
        "Nagoya",
        "Fukuoka",
        "Sapporo",
      ],
    },
    JO: { name: "Jordan", cities: ["Amman"] },
    KZ: { name: "Kazakhstan", cities: ["Almaty", "Astana"] },
    KW: { name: "Kuwait", cities: ["Kuwait City"] },
    LB: { name: "Lebanon", cities: ["Beirut"] },
    MY: { name: "Malaysia", cities: ["Kuala Lumpur", "Penang", "Johor Bahru"] },
    MV: { name: "Maldives", cities: ["Malé"] },
    MN: { name: "Mongolia", cities: ["Ulaanbaatar"] },
    MM: { name: "Myanmar", cities: ["Yangon", "Mandalay"] },
    NP: { name: "Nepal", cities: ["Kathmandu"] },
    OM: { name: "Oman", cities: ["Muscat"] },
    PK: { name: "Pakistan", cities: ["Karachi", "Lahore", "Islamabad"] },
    PH: {
      name: "Philippines",
      cities: ["Manila", "Cebu", "Quezon City", "Davao"],
    },
    QA: { name: "Qatar", cities: ["Doha"] },
    SA: { name: "Saudi Arabia", cities: ["Riyadh", "Jeddah", "Mecca"] },
    SG: { name: "Singapore", cities: ["Singapore"] },
    KR: { name: "South Korea", cities: ["Seoul", "Busan", "Incheon", "Daegu"] },
    LK: { name: "Sri Lanka", cities: ["Colombo"] },
    SY: { name: "Syria", cities: ["Damascus"] },
    TW: { name: "Taiwan", cities: ["Taipei", "Kaohsiung", "Taichung"] },
    TH: { name: "Thailand", cities: ["Bangkok", "Chiang Mai", "Phuket"] },
    TR: { name: "Turkey", cities: ["Istanbul", "Ankara", "Izmir"] },
    AE: { name: "United Arab Emirates", cities: ["Dubai", "Abu Dhabi"] },
    VN: {
      name: "Vietnam",
      cities: ["Ho Chi Minh City", "Hanoi", "Da Nang", "Hai Phong", "Can Tho"],
    },
    YE: { name: "Yemen", cities: ["Sanaa"] },
  },
  Europe: {
    AL: { name: "Albania", cities: ["Tirana"] },
    AT: { name: "Austria", cities: ["Vienna", "Salzburg", "Innsbruck"] },
    BY: { name: "Belarus", cities: ["Minsk"] },
    BE: { name: "Belgium", cities: ["Brussels", "Antwerp", "Ghent"] },
    BA: { name: "Bosnia and Herzegovina", cities: ["Sarajevo"] },
    BG: { name: "Bulgaria", cities: ["Sofia"] },
    HR: { name: "Croatia", cities: ["Zagreb", "Split"] },
    CZ: { name: "Czech Republic", cities: ["Prague", "Brno"] },
    DK: { name: "Denmark", cities: ["Copenhagen", "Aarhus"] },
    FI: { name: "Finland", cities: ["Helsinki", "Espoo"] },
    FR: {
      name: "France",
      cities: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice"],
    },
    DE: {
      name: "Germany",
      cities: ["Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne"],
    },
    GR: { name: "Greece", cities: ["Athens", "Thessaloniki"] },
    HU: { name: "Hungary", cities: ["Budapest"] },
    IS: { name: "Iceland", cities: ["Reykjavik"] },
    IE: { name: "Ireland", cities: ["Dublin", "Cork"] },
    IT: {
      name: "Italy",
      cities: ["Rome", "Milan", "Naples", "Turin", "Florence"],
    },
    NL: {
      name: "Netherlands",
      cities: ["Amsterdam", "Rotterdam", "The Hague"],
    },
    NO: { name: "Norway", cities: ["Oslo", "Bergen"] },
    PL: { name: "Poland", cities: ["Warsaw", "Kraków", "Wrocław"] },
    PT: { name: "Portugal", cities: ["Lisbon", "Porto"] },
    RO: { name: "Romania", cities: ["Bucharest", "Cluj-Napoca"] },
    RU: {
      name: "Russia",
      cities: ["Moscow", "Saint Petersburg", "Novosibirsk"],
    },
    RS: { name: "Serbia", cities: ["Belgrade"] },
    ES: {
      name: "Spain",
      cities: ["Madrid", "Barcelona", "Valencia", "Seville"],
    },
    SE: { name: "Sweden", cities: ["Stockholm", "Gothenburg", "Malmö"] },
    CH: { name: "Switzerland", cities: ["Zurich", "Geneva", "Basel"] },
    UA: { name: "Ukraine", cities: ["Kyiv", "Kharkiv", "Odesa"] },
    UK: {
      name: "United Kingdom",
      cities: ["London", "Manchester", "Birmingham", "Edinburgh", "Glasgow"],
    },
  },
  "North America": {
    BS: { name: "Bahamas", cities: ["Nassau"] },
    CA: {
      name: "Canada",
      cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
    },
    CR: { name: "Costa Rica", cities: ["San José"] },
    CU: { name: "Cuba", cities: ["Havana"] },
    DO: { name: "Dominican Republic", cities: ["Santo Domingo"] },
    SV: { name: "El Salvador", cities: ["San Salvador"] },
    GT: { name: "Guatemala", cities: ["Guatemala City"] },
    HT: { name: "Haiti", cities: ["Port-au-Prince"] },
    HN: { name: "Honduras", cities: ["Tegucigalpa"] },
    JM: { name: "Jamaica", cities: ["Kingston"] },
    MX: {
      name: "Mexico",
      cities: ["Mexico City", "Guadalajara", "Monterrey", "Cancún"],
    },
    NI: { name: "Nicaragua", cities: ["Managua"] },
    PA: { name: "Panama", cities: ["Panama City"] },
    US: {
      name: "United States",
      cities: [
        "New York",
        "Los Angeles",
        "Chicago",
        "Houston",
        "Phoenix",
        "Miami",
        "Atlanta",
        "San Francisco",
        "Las Vegas",
        "Seattle",
      ],
    },
  },
  "South America": {
    AR: { name: "Argentina", cities: ["Buenos Aires", "Córdoba", "Rosario"] },
    BO: { name: "Bolivia", cities: ["La Paz", "Santa Cruz", "Sucre"] },
    BR: {
      name: "Brazil",
      cities: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
    },
    CL: { name: "Chile", cities: ["Santiago", "Valparaíso"] },
    CO: { name: "Colombia", cities: ["Bogotá", "Medellín", "Cali"] },
    EC: { name: "Ecuador", cities: ["Quito", "Guayaquil"] },
    GY: { name: "Guyana", cities: ["Georgetown"] },
    PY: { name: "Paraguay", cities: ["Asunción"] },
    PE: { name: "Peru", cities: ["Lima", "Arequipa", "Cusco"] },
    SR: { name: "Suriname", cities: ["Paramaribo"] },
    UY: { name: "Uruguay", cities: ["Montevideo"] },
    VE: { name: "Venezuela", cities: ["Caracas", "Maracaibo"] },
  },
  Oceania: {
    AU: {
      name: "Australia",
      cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
    },
    FJ: { name: "Fiji", cities: ["Suva"] },
    NZ: {
      name: "New Zealand",
      cities: ["Auckland", "Wellington", "Christchurch"],
    },
    PG: { name: "Papua New Guinea", cities: ["Port Moresby"] },
    WS: { name: "Samoa", cities: ["Apia"] },
  },
  Africa: {
    DZ: { name: "Algeria", cities: ["Algiers"] },
    AO: { name: "Angola", cities: ["Luanda"] },
    EG: { name: "Egypt", cities: ["Cairo", "Alexandria"] },
    ET: { name: "Ethiopia", cities: ["Addis Ababa"] },
    GH: { name: "Ghana", cities: ["Accra"] },
    KE: { name: "Kenya", cities: ["Nairobi", "Mombasa"] },
    MA: { name: "Morocco", cities: ["Casablanca", "Rabat", "Marrakech"] },
    NG: { name: "Nigeria", cities: ["Lagos", "Abuja"] },
    ZA: {
      name: "South Africa",
      cities: ["Johannesburg", "Cape Town", "Durban", "Pretoria"],
    },
    TZ: { name: "Tanzania", cities: ["Dar es Salaam"] },
    UG: { name: "Uganda", cities: ["Kampala"] },
  },
};
const queryRegions = [
  ["", "All regions"],
  ...Object.keys(geoData).map((r) => [r, r]),
];
const getCountriesForRegion = (rStr) => {
  const regions = rStr ? rStr.split(",") : [];
  const all = [];
  if (regions.length === 0 || regions.includes("")) {
    for (const reg of Object.values(geoData))
      for (const [code, c] of Object.entries(reg)) all.push([code, c.name]);
  } else {
    for (const r of regions)
      if (geoData[r])
        for (const [code, c] of Object.entries(geoData[r]))
          all.push([code, c.name]);
  }
  return [
    ["", "All countries"],
    ...all.sort((a, b) => a[1].localeCompare(b[1])),
  ];
};
const getRegionForCountry = (cStr) => {
  const countries = cStr ? cStr.split(",") : [];
  if (countries.length === 0) return "";
  const regions = new Set();
  for (const cc of countries)
    for (const [r, reg] of Object.entries(geoData)) if (reg[cc]) regions.add(r);
  return Array.from(regions).join(",");
};
const getCitiesForCountry = (cStr) => {
  const countries = cStr ? cStr.split(",") : [];
  if (countries.length === 0 || countries.includes(""))
    return [["", "All cities"]];
  const all = [];
  for (const reg of Object.values(geoData))
    for (const cc of countries) if (reg[cc]) all.push(...reg[cc].cities);
  return [["", "All cities"], ...[...new Set(all)].map((c) => [c, c]).sort()];
};
const queryCountries = getCountriesForRegion("");
const queryCities = (country) => getCitiesForCountry(country);
function prepareQueries() {
  for (const q of db.ai_discovery_queries) {
    q.normalized_keyword = normalizeKeyword(q.keyword);
    q.country = { Japan: "JP", Singapore: "SG" }[q.country] ?? q.country ?? "";
    q.city = q.city ?? "";
    q.region =
      q.region ||
      (geoData.Asia?.[q.country]
        ? "Asia"
        : geoData.Europe?.[q.country]
          ? "Europe"
          : geoData["North America"]?.[q.country]
            ? "North America"
            : geoData["South America"]?.[q.country]
              ? "South America"
              : geoData.Oceania?.[q.country]
                ? "Oceania"
                : "");
    q.created_at = q.created_at ?? now();
    q.updated_at = q.updated_at ?? q.created_at;
  }
}
prepareQueries();
function prepareRunSamples() {
  if (ext().runSamplesVersion) return;
  const at = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();
  const q = db.ai_discovery_queries[0],
    candidate = db.ai_discovered_source_candidates.find(
      (c) => c.discovery_query_id === q?.id,
    );
  ext().discoveryRuns = [
    {
      id: "sample-discovery-batch",
      query_id: null,
      keyword: "5 keywords (Batch)",
      started_at: at(15),
      status: "success",
      links: 45,
      new_links: 12,
      duplicates: 33,
      candidate_ids: [],
      error: null,
    },
    {
      id: "sample-discovery-success",
      query_id: q?.id,
      keyword: q?.keyword,
      started_at: at(30),
      status: "success",
      links: candidate ? 1 : 0,
      new_links: candidate ? 1 : 0,
      duplicates: 0,
      candidate_ids: candidate ? [candidate.id] : [],
      error: null,
    },
    {
      id: "sample-discovery-empty",
      query_id: q?.id,
      keyword: q?.keyword,
      started_at: at(90),
      status: "success",
      links: 0,
      new_links: 0,
      duplicates: 0,
      candidate_ids: [],
      error: null,
    },
    {
      id: "sample-discovery-error",
      query_id: q?.id,
      keyword: q?.keyword,
      started_at: at(150),
      status: "failed",
      links: null,
      new_links: null,
      duplicates: null,
      candidate_ids: [],
      error: "Search provider timed out. Retry later.",
    },
  ];
  if (q) q.last_run_at = at(30);
  if (!db.ai_pipeline_runs.length)
    db.ai_pipeline_runs.push(
      {
        id: "sample-crawl-empty",
        name: "Sample scheduled crawl",
        pipeline_type: "ingestion",
        trigger_type: "scheduled",
        status: "success",
        started_at: at(45),
        finished_at: at(44),
        total_sources: 1,
        total_raw_pages: 0,
        total_opportunities: 0,
        error_message: "Source checked; content unchanged.",
      },
      {
        id: "sample-crawl-error",
        name: "Sample failed crawl",
        pipeline_type: "ingestion",
        trigger_type: "scheduled",
        status: "failed",
        started_at: at(120),
        finished_at: at(119),
        total_sources: 1,
        total_raw_pages: 0,
        total_opportunities: 0,
        error_message: "HTTP 503: source temporarily unavailable.",
      },
    );
  ext().runSamplesVersion = 1;
}
prepareRunSamples();
const discoveryRuns = () => (ext().discoveryRuns ||= []);
const helpHeading = (label, description) =>
  `${label} <button type="button" class="column-help" data-help="${esc(description)}" aria-label="About ${esc(label)}" title="${esc(description)}">${icon("info")}</button>`;
function dismissHelp() {
  document.getElementById("field-help-tooltip")?.remove();
}
function showHelp(button) {
  dismissHelp();
  const tip = document.createElement("div");
  tip.id = "field-help-tooltip";
  tip.setAttribute("role", "tooltip");
  tip.textContent = button.dataset.help;
  document.body.append(tip);
  const r = button.getBoundingClientRect();
  tip.style.left =
    Math.max(8, Math.min(r.left, innerWidth - tip.offsetWidth - 8)) + "px";
  tip.style.top =
    (r.bottom + tip.offsetHeight + 8 < innerHeight
      ? r.bottom + 6
      : Math.max(8, r.top - tip.offsetHeight - 6)) + "px";
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-help]");
  if (b) showHelp(b);
  else dismissHelp();
  if (!e.target.closest(".custom-multi")) {
    document
      .querySelectorAll(".multi-drop")
      .forEach((x) => (x.style.display = "none"));
  }
});
document.addEventListener("mouseover", (e) => {
  const b = e.target.closest("[data-help]");
  if (b) showHelp(b);
});
document.addEventListener("mouseout", (e) => {
  if (e.target.closest("[data-help]")) dismissHelp();
});
document.addEventListener("focusin", (e) => {
  if (e.target.matches("[data-help]")) showHelp(e.target);
});
document.addEventListener("focusout", (e) => {
  if (e.target.matches("[data-help]")) dismissHelp();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") dismissHelp();
});
window.addEventListener("scroll", dismissHelp, true);
window.addEventListener("resize", dismissHelp);
const formatCountry = (code) =>
  code
    ? code
        .split(",")
        .map((c) => queryCountries.find(([cc]) => cc === c)?.[1] || c)
        .join(", ")
    : "All countries";
function paginationControls(total, page, limit, stateKey) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1 && total <= limit) return "";
  const prev =
    page > 1
      ? `<button type="button" class="secondary" data-page="${page - 1}" data-page-for="${stateKey}">Prev</button>`
      : `<button type="button" class="secondary" disabled>Prev</button>`;
  const next =
    page < pages
      ? `<button type="button" class="secondary" data-page="${page + 1}" data-page-for="${stateKey}">Next</button>`
      : `<button type="button" class="secondary" disabled>Next</button>`;
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#fff;border:1px solid #e5e7eb;border-top:none;border-bottom-left-radius:8px;border-bottom-right-radius:8px;"><div style="font-size:0.9em;color:#6b7280;">Showing ${(page - 1) * limit + 1} to ${Math.min(page * limit, total)} of ${total} entries</div><div style="display:flex;align-items:center;gap:16px;"><label style="font-size:0.9em;color:#6b7280;">Rows per page: <select data-limit-for="${stateKey}" style="padding:4px 8px;border:1px solid #ccc;border-radius:4px;background:#fff;">${[5, 10, 20, 50].map((v) => `<option value="${v}" ${v === limit ? "selected" : ""}>${v}</option>`).join("")}</select></label><div class="actions" style="margin-left:8px;">${prev} <span style="font-size:0.9em;margin:0 8px;">Page ${page} of ${pages}</span> ${next}</div></div></div>`;
}
function keywordTable(list) {
  const p = ui.pagination?.keywords || { page: 1, limit: 10 };
  const total = list.length;
  const start = (p.page - 1) * p.limit;
  const sliced = list.slice(start, start + p.limit);
  const num = (v) =>
    `<div style="text-align:right;font-variant-numeric:tabular-nums;">${v}</div>`;
  const ctr = (v) => `<div style="text-align:center">${v}</div>`;
  return (
    keywordBulkToolbar(list) +
    table(
      [
        ctr("Select"),
        ctr("ID"),
        "Keyword",
        "Location (Region › Country › City)",
        ctr(
          helpHeading(
            "Enabled",
            "Controls whether this keyword is enabled for discovery.",
          ),
        ),
        "Last run",
        ctr(
          helpHeading(
            "Status",
            "Result of the latest search. Success can also mean no matching links were found.",
          ),
        ),
        num(
          helpHeading(
            "Found",
            "Links returned by the latest search, including duplicates. A dash means no result is available.",
          ),
        ),
        num(
          helpHeading(
            "New",
            "New source candidates added by the latest search after duplicate checks. These are not jobs.",
          ),
        ),
        num(
          helpHeading(
            "Pending",
            "All source candidates from this keyword still awaiting admin review, across all runs.",
          ),
        ),
        `<div style="text-align:right">Action</div>`,
      ],
      sliced.map((q) => {
        const r = discoveryRuns().find((r) => r.query_id === q.id);
        const pending = db.ai_discovered_source_candidates.filter(
          (c) => c.discovery_query_id === q.id && c.status === "pending_review",
        ).length;
        const geoArr = [];
        if (q.region) geoArr.push(q.region);
        if (q.country) geoArr.push(formatCountry(q.country));
        if (q.city) geoArr.push(q.city);
        const geoText = geoArr.length ? geoArr.join(" › ") : "Global";
        return row([
          ctr(
            `<input type="checkbox" data-select-keyword="${q.id}" aria-label="Select keyword ${q.id}" ${selectedKeywords.has(q.id) && q.enabled ? "checked" : ""} ${!editable() || ui.discoveryRunning || !q.enabled ? "disabled" : ""}>`,
          ),
          ctr(q.id),
          `<strong>${esc(q.keyword)}</strong>`,
          esc(geoText),
          ctr(
            `<input type="checkbox" class="switch" aria-label="Enable keyword ${q.id}" data-query-toggle="${q.id}" ${q.enabled ? "checked" : ""} ${!editable() || ui.discoveryRunning ? "disabled" : ""}>`,
          ),
          stamp(r?.started_at),
          ctr(
            pill(
              r?.status || "Not run",
              r?.status === "failed" ? "red" : r ? "green" : "",
            ),
          ),
          num(r?.links ?? "—"),
          num(r?.new_links ?? "—"),
          num(pending),
          `<div class="actions" style="justify-content:flex-end">${ib("source-edit", "Edit keyword " + q.id, "pencil", q.id, !editable() || ui.discoveryRunning)}${ib("discover", "Discover keyword " + q.id, "magnifying-glass", q.id, !editable() || ui.discoveryRunning || !q.enabled)}${ib("query-details", "View details", "info", q.id)}${ib("delete-query", "Delete keyword " + q.id, "trash", q.id, !editable() || ui.discoveryRunning)}</div>`,
        ]);
      }),
    ) +
    paginationControls(total, p.page, p.limit, "keywords")
  );
}
function discoveryTable(
  runs = discoveryRuns(),
  grouped = true,
  disablePagination = false,
) {
  if (!runs.length) return empty("No discovery runs yet");
  const p = ui.pagination?.discovery || { page: 1, limit: 10 };
  const num = (v) =>
    `<div style="text-align:right;font-variant-numeric:tabular-nums;">${v}</div>`;
  const ctr = (v) => `<div style="text-align:center">${v}</div>`;
  if (!grouped) {
    const total = runs.length;
    const start = (p.page - 1) * p.limit;
    const sliced = disablePagination
      ? runs
      : runs.slice(start, start + p.limit);
    const html = sliced.flatMap((r) => {
      const candidates = db.ai_discovered_source_candidates.filter((c) =>
        r.candidate_ids.includes(c.id),
      );
      const detail = candidates.length
        ? table(
            ["Link", "Current review status"],
            candidates.map((c) =>
              row([external(c.url, c.title || c.url), pill(c.status)]),
            ),
          )
        : empty(
            r.status === "failed" ? "Discovery failed" : "No links returned",
            r.error || "The search completed without matching links.",
          );
      return [
        row([
          ctr(r.query_id || "—"),
          disablePagination
            ? stamp(r.started_at).split(", ")[1] || stamp(r.started_at)
            : stamp(r.started_at),
          esc(r.keyword),
          ctr(pill(r.status, r.status === "failed" ? "red" : "green")),
          num(r.links ?? "—"),
          num(r.new_links ?? "—"),
          num(r.duplicates ?? "—"),
          esc(r.error || (r.links === 0 ? "No matching links found." : "—")),
          `<div style="text-align:right">${btn("toggle-run-results", "View results", r.id, "link")}</div>`,
        ]),
        `<tr id="run-results-${r.id}" style="display:none;background:#f8f9fa;"><td colspan="9" style="padding:16px 24px;border-bottom:2px solid #ddd;box-shadow:inset 0 3px 6px rgba(0,0,0,0.04);">${detail}</td></tr>`,
      ];
    });
    return (
      table(
        [
          ctr("Keyword ID"),
          disablePagination ? "Time" : "Started",
          "Keyword",
          ctr("Status"),
          num("Found"),
          num("New"),
          num("Duplicates"),
          "Message",
          `<div style="text-align:right">Action</div>`,
        ],
        html,
      ) +
      (disablePagination
        ? ""
        : paginationControls(total, p.page, p.limit, "discovery"))
    );
  }
  const groups = {};
  for (const r of runs) {
    const d = stamp(r.started_at);
    if (!groups[d]) groups[d] = [];
    groups[d].push(r);
  }
  const groupEntries = Object.entries(groups).sort(
    (a, b) => new Date(b[1][0].started_at) - new Date(a[1][0].started_at),
  );
  const total = groupEntries.length;
  const start = (p.page - 1) * p.limit;
  const sliced = groupEntries.slice(start, start + p.limit);
  const html = sliced.flatMap(([dateStr, dayRuns], idx) => {
    const totalLinks = dayRuns.reduce((sum, r) => sum + (r.links || 0), 0);
    const totalNew = dayRuns.reduce((sum, r) => sum + (r.new_links || 0), 0);
    const totalDups = dayRuns.reduce((sum, r) => sum + (r.duplicates || 0), 0);
    const failed = dayRuns.filter((r) => r.status === "failed").length;
    const groupStatus =
      failed === 0
        ? "success"
        : failed === dayRuns.length
          ? "failed"
          : "partial_success";
    const runId = "batch-" + idx + "-" + Date.now();
    const displayId = dayRuns.length === 1 ? dayRuns[0].query_id || "—" : "—";
    const subTableHTML = discoveryTable(dayRuns, false, true);
    return [
      row([
        ctr(displayId),
        dateStr,
        `<strong>${dayRuns.length} keyword${dayRuns.length > 1 ? "s" : ""}</strong>`,
        ctr(
          pill(
            groupStatus,
            groupStatus === "failed"
              ? "red"
              : groupStatus === "partial_success"
                ? "amber"
                : "green",
          ),
        ),
        num(totalLinks),
        num(totalNew),
        num(totalDups),
        esc(failed > 0 ? `${failed} failed` : "All success"),
        `<div style="text-align:right">${btn("toggle-run-results", "View details", runId, "link")}</div>`,
      ]),
      `<tr id="run-results-${runId}" style="display:none;background:#f8f9fa;"><td colspan="9" style="padding:16px 24px;border-bottom:2px solid #ddd;box-shadow:inset 0 3px 6px rgba(0,0,0,0.04);"><h4 style="margin-top:0">Chi tiết lô chạy lúc ${dateStr}</h4>${subTableHTML}</td></tr>`,
    ];
  });
  return (
    table(
      [
        ctr("Keyword ID"),
        "Date & Time",
        "Keyword / Batch",
        ctr("Status"),
        num("Total Found"),
        num("Total New"),
        num("Duplicates"),
        "Message",
        `<div style="text-align:right">Action</div>`,
      ],
      html,
    ) + paginationControls(total, p.page, p.limit, "discovery")
  );
}
function queryDetails(id) {
  const q = db.ai_discovery_queries.find((q) => q.id === Number(id));
  if (!q) return;
  const meta = `<fieldset disabled style="border:0;padding:0;margin:0 0 24px 0">${field("v_kw", "Keyword", q.keyword)}<div class="form-grid" style="margin-top:16px">${field("v_reg", "Region", q.region || "All regions")}${field("v_ctr", "Country", formatCountry(q.country))}${field("v_cty", "City", q.city || "All cities")}</div><div class="form-grid" style="margin-top:16px">${field("v_cr", "Created at", stamp(q.created_at))}${field("v_up", "Last updated", stamp(q.updated_at || q.created_at))}</div></fieldset>`;
  dialog(
    "query-details",
    "Keyword Details",
    `${meta}<div class="divider"></div><h3>Lịch sử chạy (Run logs)</h3>${discoveryTable(
      discoveryRuns().filter((r) => r.query_id === q.id),
      false,
    )}`,
    "",
    editable()
      ? btn("source-edit", icon("pencil") + " Edit Keyword", q.id)
      : "",
    "drawer",
  );
}
function discoverKeyword(id) {
  const q = db.ai_discovery_queries.find((q) => q.id === Number(id));
  if (!q?.enabled) return;
  q.last_run_at = now();
  const normalized = "https://example.net/discovered/" + q.id;
  let c = db.ai_discovered_source_candidates.find(
    (s) => s.normalized_url === normalized,
  );
  const duplicate = !!c;
  if (!c) {
    c = {
      id:
        Math.max(0, ...db.ai_discovered_source_candidates.map((c) => c.id)) + 1,
      discovery_query_id: q.id,
      provider: "search",
      keyword: q.keyword,
      url: normalized,
      normalized_url: normalized,
      city: q.city,
      country: formatCountry(q.country).replace("All countries", ""),
      snippet: "Sample search result. Review before approving.",
      status: "pending_review",
    };
    db.ai_discovered_source_candidates.unshift(c);
  }
  discoveryRuns().unshift({
    id: "discovery-" + q.id + "-" + Date.now(),
    query_id: q.id,
    keyword: q.keyword,
    started_at: q.last_run_at,
    status: "success",
    links: 1,
    new_links: duplicate ? 0 : 1,
    duplicates: duplicate ? 1 : 0,
    candidate_ids: [c.id],
    error: null,
  });
  audit("discovery run", q.id);
  render();
  toast("Sample discovery finished.");
}
const editable = () => ui.role === "admin";
function persist() {
  try {
    localStorage.setItem(STORE, JSON.stringify(db));
  } catch {
    toast("Storage unavailable. Changes will last for this session only.");
  }
}
function audit(action, entity) {
  ext().audit.unshift({
    action,
    entity,
    actor: ui.mode === "cms" ? ui.role : "dancer",
    at: now(),
  });
  persist();
}
let toastTimer;
function toast(msg) {
  $("#toast").textContent = msg;
  $("#toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 4200);
}
function normalize(value) {
  try {
    const u = new URL(value);
    if (
      !["http:", "https:"].includes(u.protocol) ||
      u.username ||
      u.password ||
      !u.hostname.includes(".")
    )
      return null;
    u.hash = "";
    u.hostname = u.hostname.toLowerCase();
    for (const k of [...u.searchParams.keys()])
      if (/^utm_|^(fbclid|gclid)$/i.test(k)) u.searchParams.delete(k);
    u.searchParams.sort();
    u.pathname = u.pathname.replace(/\/+$/, "") || "/";
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}
function external(url, label) {
  const safe =
    String(url || "").startsWith("mailto:") &&
    /^mailto:[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(url)
      ? url
      : normalize(url);
  return safe
    ? `<a href="${esc(safe)}" target="_blank" rel="noopener noreferrer">${esc(label)} ${icon("arrow-up-right")}</a>`
    : "Not provided";
}
function ageAllowed() {
  const a = ext().age;
  if (!a.dob || !a.accepted_at) return false;
  const d = new Date(a.dob + "T00:00:00Z"),
    n = new Date();
  let years = n.getUTCFullYear() - d.getUTCFullYear();
  if (
    n.getUTCMonth() < d.getUTCMonth() ||
    (n.getUTCMonth() === d.getUTCMonth() && n.getUTCDate() < d.getUTCDate())
  )
    years--;
  return years >= 18;
}
function available(o) {
  return (
    o &&
    o.status === "published" &&
    (!o.deadline || o.deadline >= today()) &&
    !ext().moderation[o.id]
  );
}
const moderationLabel = (id) =>
  ({ hidden: "Temporarily hidden", removed: "Removed" })[
    ext().moderation[id]
  ] || "No restriction";
function money(o) {
  const c = o.compensation;
  return c?.amount != null
    ? `${Number(c.amount).toLocaleString("en-US")} ${c.currency} / ${c.unit}`
    : "Compensation not disclosed";
}
function duration(o) {
  return o.event_start_date && o.event_end_date
    ? Math.max(
        1,
        Math.round(
          (new Date(o.event_end_date) - new Date(o.event_start_date)) /
            86400000,
        ) + 1,
      )
    : null;
}
// Distances and scoring weights are test fixtures, not an approved matching rubric.
function distance(o) {
  return o.city === dancer().city ? { 101: 8, 102: 18 }[o.id] || 10 : null;
}
function score(o) {
  const d = dancer(),
    p = ext().profile,
    styles = d.dance_styles.split(",").map((s) => s.trim());
  const c = o.compensation;
  const comparable =
    c?.currency === p.currency && c?.unit === p.compensation_unit;
  const parts = [
    ["Style", 30, o.dance_styles.some((s) => styles.includes(s))],
    ["Location", 25, distance(o) !== null && distance(o) <= d.travelRadiusKm],
    [
      "Experience",
      20,
      d.year_experience >= (o.requirements?.years_experience || 0),
    ],
    ["Compensation", 25, comparable ? c.amount >= d.min_compensation : null],
  ];
  const weight = parts.reduce((n, p) => n + (p[2] === null ? 0 : p[1]), 0),
    points = parts.reduce((n, p) => n + (p[2] ? p[1] : 0), 0);
  const is_estimated = (weight < 80) || (o.requirements && o.requirements.years_experience && (d.year_experience === undefined || d.year_experience === null || d.year_experience === ''));
  const missing_dancer_info = is_estimated && weight >= 80;
  return {
    value: Math.round((points / weight) * 100),
    est: is_estimated,
    missing_dancer_info,
    parts,
    risks: comparable
      ? []
      : [
          "Compensation is not comparable with your preferred currency / pay basis.",
        ],
  };
}
function rebuildRecommendations() {
  db.ai_recommendations = db.ai_opportunities.map((o) => {
    const s = score(o);
    return {
      id: o.id + 1000,
      opportunity_id: o.id,
      dancer_id: dancer().id,
      final_score: s.value / 100,
      style_score: s.parts[0][2] ? 1 : 0,
      location_score: s.parts[1][2] ? 1 : 0,
      experience_score: s.parts[2][2] ? 1 : 0,
      compensation_score: s.parts[3][2] === null ? null : s.parts[3][2] ? 1 : 0,
      reason: s.parts
        .filter((p) => p[2])
        .map((p) => p[0])
        .join(", "),
      risks: s.risks,
      status: available(o) ? "pending_review" : "expired",
      matched_at: now(),
    };
  });
}
function metrics() {
  return {
    at: now(),
    crawls: db.ai_crawl_attempts.length,
    jobs: db.ai_opportunities.filter(available).length,
    recommendations: db.ai_recommendations.length,
    copied: Object.values(ext().history).filter((h) => h.copied_at).length,
    applied: Object.values(ext().history).filter((h) => h.applied_at).length,
  };
}
function heading(code, title, subtitle, actions = "") {
  return `<div class="page-heading"><div><div class="eyebrow">${code}</div><h1>${helpHeading(title, subtitle)}</h1></div><div class="actions">${actions}</div></div>`;
}
function render() {
  if (!$("#preview-alert")) {
    const button = document.createElement("button");
    button.id = "preview-alert";
    button.className = "icon-button";
    button.dataset.action = "preview-alert";
    button.title = "Preview a matched-job notification";
    button.setAttribute("aria-label", button.title);
    button.innerHTML = icon("bell");
    $(".preview-options").prepend(button);
  }
  $("#preview-alert").hidden = ui.mode !== "dancer";
  $("#mode-cms").classList.toggle("active", ui.mode === "cms");
  $("#mode-dancer").classList.toggle("active", ui.mode === "dancer");
  $("#preview-role").innerHTML =
    ui.mode === "cms"
      ? options(
          [
            ["admin", "Administrator"],
            ["reviewer", "Read-only reviewer"],
          ],
          ui.role,
        )
      : options(
          [
            ["dancer", "Signed-in dancer"],
            ["guest", "Guest"],
          ],
          ui.guest ? "guest" : "dancer",
        );
  $("#app").innerHTML = ui.mode === "cms" ? renderCMS() : renderDancer();
}
function renderCMS() {
  const pages = [
    ["jobs", "briefcase", "Danh sách Job"],
    ["sources", "globe", "Nguồn dữ liệu"],
    ["queue", "tray", "Hàng đợi duyệt"],
    ["dancers", "users", "Users & Job Activity"],
    ["operations", "chart-bar", "Cấu hình vận hành"],
  ];
  const content = {
    jobs: cmsJobs,
    sources: cmsSources,
    queue: cmsQueue,
    dancers: cmsDancers,
    operations: cmsOperations,
  }[ui.cms]();
  return `<div class="layout"><aside class="sidebar"><div class="sidebar-title">JOB AGENT</div>${pages.map(([id, i, l]) => btn("cms", icon(i) + l, id, ui.cms === id ? "active" : "")).join("")}<div class="footnote">Phase 1 delivery<br>07 Sep – 13 Nov 2026<br><br>Sprint 1 demo · 21 Sep</div></aside><section class="workspace">${!editable() ? '<div class="permission">Read-only access</div>' : ""}${content}</section></div>`;
}
function searchBar(statusList = []) {
  return `<div class="toolbar"><input type="search" id="cms-search" aria-label="Search records" placeholder="Search title, organization, city or URL" value="${esc(ui.search)}">${statusList.length ? `<select id="cms-status" aria-label="Filter status">${options([["", "All statuses"], ...statusList], ui.status)}</select>` : ""}</div>`;
}
function matches(o) {
  return (
    (!ui.search ||
      JSON.stringify(o).toLowerCase().includes(ui.search.toLowerCase())) &&
    (!ui.status || o.status === ui.status)
  );
}
const selectedJobs = new Set();
function jobBulkToolbar(paginatedList) {
  const selected = db.ai_opportunities.filter((o) => selectedJobs.has(o.id));
  if (!selected.length) return "";
  return `<div class="toolbar bulk-toolbar" style="margin-bottom:16px; background:#f0fdf4; border:1px solid #bbf7d0; padding:12px; border-radius:8px; display:flex; gap:12px; align-items:center;">
    <span style="font-weight:600; color:#15803d;">Đã chọn ${selected.length} jobs</span>
    ${btn("bulk-job-approve", "🟢 Duyệt (Publish)", "", "primary", !editable())}
    ${btn("bulk-job-suspend", "🟡 Tạm ẩn (Suspend)", "", "", !editable())}
    <span style="width:1px; height:24px; background:#bbf7d0; margin:0 4px;"></span>
    ${btn("bulk-job-delete", icon("trash") + " Xóa (Ẩn khỏi danh sách)", "", "danger", !editable())}
    ${btn("clear-job-selection", "Hủy chọn", "", "link")}
  </div>`;
}
function cmsJobs() {
  let baseJobs = db.ai_opportunities.filter((o) => !o.is_deleted);

  // Apply timeframe filter
  const tf = ui.jobF?.time || "all";
  if (tf !== "all") {
    const now = new Date();
    baseJobs = baseJobs.filter((o) => {
      const d = new Date(o.extracted_at);
      if (tf === "today") return d.toDateString() === now.toDateString();
      if (tf === "week") return now - d <= 7 * 86400000;
      if (tf === "month") return now - d <= 30 * 86400000;
      return true;
    });
  }

  // Calculate Dashboard Metrics based on the TIMEFRAME-FILTERED baseJobs, NOT the search-filtered ones
  const total = baseJobs.length;
  const published = baseJobs.filter((o) => o.status === "published").length;
  const needsReview = baseJobs.filter(
    (o) => o.status === "needs_review",
  ).length;
  const reportedCount = baseJobs.filter((o) =>
    ext().reports?.some(
      (r) => r.opportunity_id === o.id && r.status === "pending",
    ),
  ).length;

  const jobWidget = `<div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:24px;">
    <div style="padding:16px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
      <div style="color:#6b7280;font-size:0.9em;margin-bottom:8px">Tổng số Job</div>
      <div style="font-size:1.8em;font-weight:600">${total}</div>
    </div>
    <div style="padding:16px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
      <div style="color:#6b7280;font-size:0.9em;margin-bottom:8px">Đang hiển thị (Published)</div>
      <div style="font-size:1.8em;font-weight:600;color:#10b981">${published}</div>
    </div>
    <div style="padding:16px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
      <div style="color:#6b7280;font-size:0.9em;margin-bottom:8px">Cần duyệt (Needs review)</div>
      <div style="font-size:1.8em;font-weight:600;color:#f59e0b">${needsReview}</div>
    </div>
    <div style="padding:16px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
      <div style="color:#6b7280;font-size:0.9em;margin-bottom:8px">Bị báo cáo (Reported)</div>
      <div style="font-size:1.8em;font-weight:600;color:#ef4444">${reportedCount}</div>
    </div>
  </div>`;

  const tfSelect = (id, val) =>
    `<select id="${id}" style="min-width:100px; height: 38px;"><option value="today" ${val === "today" ? "selected" : ""}>Hôm nay</option><option value="week" ${val === "week" ? "selected" : ""}>Tuần này</option><option value="month" ${val === "month" ? "selected" : ""}>Tháng này</option><option value="all" ${val === "all" ? "selected" : ""}>Tất cả</option></select>`;

  const allStyles = [
    ...new Set(
      db.ai_opportunities
        .flatMap((o) =>
          Array.isArray(o.dance_styles) ? o.dance_styles : [o.dance_styles],
        )
        .filter(Boolean),
    ),
  ]
    .map((s) => [s, s])
    .sort();
  const jobFilters = `<div class="filter-bar" style="margin-bottom:16px; display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
    <input type="search" id="job-search" placeholder="Tìm kiếm Job..." value="${esc(ui.jobF?.q || "")}" style="flex:1; height: 38px; min-width: 150px;">
    ${tfSelect("job-time", tf)}
    <div style="width:160px">${multiSelect("job-status", "Trạng thái", statuses, ui.jobF?.status || "")}</div>
    <div style="width:160px">${multiSelect("job-country", "Quốc gia", queryCountries, ui.jobF?.country || "")}</div>
    <div style="width:160px">${multiSelect("job-city", "Thành phố", queryCities(ui.jobF?.country || ""), ui.jobF?.city || "")}</div>
    <div style="width:160px">${multiSelect("job-style", "Thể loại nhảy", allStyles, ui.jobF?.style || "")}</div>
    <div style="width:140px">${multiSelect(
      "job-reported",
      "Bị báo cáo",
      [
        ["yes", "Có report"],
        ["no", "Không có"],
      ],
      ui.jobF?.reported || "",
    )}</div>
    <button type="button" class="primary" data-action="apply-job-filters" style="height: 38px;">Lọc</button>
  </div>`;

  // Apply search/status filters on top of baseJobs
  let filteredJobs = baseJobs;
  if (ui.jobF?.q) {
    const q = ui.jobF.q.toLowerCase();
    filteredJobs = filteredJobs.filter(
      (o) =>
        (o.title || "").toLowerCase().includes(q) ||
        (o.organization || "").toLowerCase().includes(q) ||
        String(o.id) === q,
    );
  }
  if (ui.jobF?.status) {
    const arr = ui.jobF.status.split(",");
    filteredJobs = filteredJobs.filter((o) => arr.includes(o.status));
  }
  if (ui.jobF?.country) {
    const arr = ui.jobF.country.split(",");
    filteredJobs = filteredJobs.filter((o) => arr.includes(o.country));
  }
  if (ui.jobF?.city) {
    const arr = ui.jobF.city.split(",");
    filteredJobs = filteredJobs.filter((o) => arr.includes(o.city));
  }
  if (ui.jobF?.style) {
    const arr = ui.jobF.style.split(",");
    filteredJobs = filteredJobs.filter((o) => {
      const styles = Array.isArray(o.dance_styles)
        ? o.dance_styles
        : [o.dance_styles];
      return styles.some((s) => arr.includes(s));
    });
  }
  if (ui.jobF?.reported) {
    const arr = ui.jobF.reported.split(",");
    filteredJobs = filteredJobs.filter((o) => {
      const hasReport = ext().reports?.some(
        (r) => r.opportunity_id === o.id && r.status === "pending",
      );
      if (arr.includes("yes") && arr.includes("no")) return true;
      if (arr.includes("yes")) return hasReport;
      if (arr.includes("no")) return !hasReport;
      return true;
    });
  }

  const p = ui.pagination?.jobs || { page: 1, limit: 10 };
  const totalPaginated = filteredJobs.length;
  const start = (p.page - 1) * p.limit;
  const paginatedJobs = filteredJobs.slice(start, start + p.limit);
  const ctr = (v) => `<div style="text-align:center">${v}</div>`;

  return (
    heading(
      "CMS-01 · SPRINT 1",
      "Danh sách Job",
      "Review extracted opportunities and their original sources.",
    ) +
    jobWidget +
    jobFilters +
    jobBulkToolbar(paginatedJobs) +
    table(
      [
        ctr("Select"),
        ctr("ID"),
        "JOB TITLE",
        "TYPE",
        "STYLE",
        "Organization",
        "Location",
        "Rubric Scores",
        "Status",
        ctr("Reports"),
        '<div style="text-align:right">Action</div>',
      ],
      paginatedJobs.map((o) => {
        const pendingReports =
          ext().reports?.filter(
            (r) => r.opportunity_id === o.id && r.status === "pending",
          ) || [];
        const badges = pendingReports.length
          ? `<span class="pill red">🚩 ${pendingReports.length}</span>`
          : "—";
        const quickActions = [];
        if (o.status === "needs_review" || o.status === "suspended")
          quickActions.push(
            ib("quick-approve", "Duyệt ngay", "check", o.id, !editable()),
          );
        if (o.status === "published")
          quickActions.push(
            ib("quick-suspend", "Tạm ẩn", "pause", o.id, !editable()),
          );
        quickActions.push(
          ib("quick-delete", "Xóa (Ẩn)", "trash", o.id, !editable()),
        );
        quickActions.push(
          ib("job-drawer", "Chi tiết Job", "arrow-square-out", o.id),
        );

        return row([
          ctr(
            `<input type="checkbox" data-select-job="${o.id}" aria-label="Select job ${o.id}" ${selectedJobs.has(o.id) ? "checked" : ""} ${!editable() ? "disabled" : ""}>`,
          ),
          ctr(`#${o.id}`),
          `<strong>${esc(o.title || "Untitled")}</strong>`,
          `${pill(types.find((t) => t[0] === o.opportunity_type)?.[1] || o.opportunity_type || "N/A", "")}`,
          `<span style="color:#6b7280;font-size:0.9em">${esc(Array.isArray(o.dance_styles) ? o.dance_styles.join(", ") : o.dance_styles || "Not specified")}</span>`,
          esc(o.organization || "Not provided"),
          `${esc(o.city || "")}${o.city && o.country ? ", " : ""}${esc(o.country || "")}` ||
            "Not provided",
          `<div style="font-size:0.85em"><span style="color:${o.completeness_score * 10 < 6 ? "#ef4444" : "#10b981"}">Info: ${(o.completeness_score * 10).toFixed(1)}</span> | <span style="color:${o.confidence * 10 < 7 ? "#ef4444" : "#10b981"}">Trust: ${(o.confidence * 10).toFixed(1)}</span></div>`,
          pill(
            statuses.find((s) => s[0] === o.status)?.[1] || o.status,
            o.status === "closed"
              ? "red"
              : o.status === "suspended"
                ? "amber"
                : o.status === "needs_review"
                  ? "amber"
                  : "green",
          ),
          ctr(badges),
          `<div class="actions" style="justify-content:flex-end">${quickActions.join("")}</div>`,
        ]);
      }),
    ) +
    paginationControls(totalPaginated, p.page, p.limit, "jobs")
  );
}
const selectedSources = new Set();
const selectedKeywords = new Set();
function keywordBulkToolbar(list) {
  const eligible = list.filter((q) => q.enabled),
    selected = db.ai_discovery_queries.filter(
      (q) => q.enabled && selectedKeywords.has(q.id),
    );
  return `<div class="toolbar bulk-toolbar"><label class="check-row"><input type="checkbox" data-select-keywords-visible aria-label="Select all visible enabled keywords" ${eligible.length && eligible.every((q) => selectedKeywords.has(q.id)) ? "checked" : ""} ${!editable() || ui.discoveryRunning || !eligible.length ? "disabled" : ""}>Select visible</label><span>${selected.length} selected</span>${btn("clear-keyword-selection", "Clear selection", "", "link", !selected.length || ui.discoveryRunning)}${btn("search-selected", icon("magnifying-glass") + "Search selected", "", "primary", !editable() || ui.discoveryRunning || !selected.length)}${btn("search-all-keywords", icon("magnifying-glass") + "Search all enabled", "", "", !editable() || ui.discoveryRunning || !db.ai_discovery_queries.some((q) => q.enabled))}${ui.discoveryRunning ? '<span role="status">Searching...</span>' : ""}</div>`;
}
async function searchKeywords(all) {
  if (!editable() || ui.discoveryRunning) return;
  const ids = db.ai_discovery_queries
    .filter((q) => q.enabled && (all || selectedKeywords.has(q.id)))
    .map((q) => q.id);
  if (!ids.length) return;
  if (
    !confirm(
      `Search ${all ? "all enabled" : "selected"} ${ids.length} keywords, including any outside the current filter? This runs sample searches only.`,
    )
  )
    return;
  ui.discoveryRunning = true;
  render();
  try {
    for (const id of ids) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      discoverKeyword(id);
    }
    selectedKeywords.clear();
    toast(`Sample search complete: ${ids.length} keywords processed.`);
  } finally {
    ui.discoveryRunning = false;
    render();
  }
}
const visibleSources = () =>
  db.ai_source_links.filter(
    (s) =>
      !ui.search ||
      JSON.stringify(s).toLowerCase().includes(ui.search.toLowerCase()),
  );
function sourceBulkToolbar(list) {
  const eligible = list.filter((s) => s.enabled),
    selected = db.ai_source_links.filter(
      (s) => s.enabled && selectedSources.has(s.id),
    );
  return `<div class="toolbar bulk-toolbar"><label class="check-row"><input type="checkbox" data-select-visible aria-label="Select all visible enabled sources" ${eligible.length && eligible.every((s) => selectedSources.has(s.id)) ? "checked" : ""} ${!editable() || ui.running || !eligible.length ? "disabled" : ""}>Select visible</label><span>${selected.length} selected</span>${btn("clear-source-selection", "Clear selection", "", "link", !selected.length || ui.running)}${btn("crawl-selected", icon("arrows-clockwise") + "Crawl selected", "", "primary", !editable() || ui.running || !selected.length)}${btn("crawl-all-sources", icon("arrows-clockwise") + "Crawl all enabled", "", "", !editable() || ui.running || !db.ai_source_links.some((s) => s.enabled))}</div>`;
}
async function confirmSourceCrawl(all) {
  if (!editable() || ui.running) return;
  const ids = db.ai_source_links
    .filter((s) => s.enabled && (all || selectedSources.has(s.id)))
    .map((s) => s.id);
  if (!ids.length) return;
  if (
    !confirm(
      all
        ? `Run a sample crawl for all ${ids.length} enabled sources, including sources outside the current filter?`
        : `Run a sample crawl for ${ids.length} selected sources, including any selected sources outside the current filter?`,
    )
  )
    return;
  await crawl(ids);
  selectedSources.clear();
  render();
}
function multiSelect(id, placeholder, list, selectedStr) {
  const selected = selectedStr ? selectedStr.split(",") : [];
  let label = placeholder;
  if (selected.length === 1) {
    const found = list.find(
      (x) => (typeof x === "string" ? x : x[0]) === selected[0],
    );
    if (found) label = typeof found === "string" ? found : found[1];
  } else if (selected.length > 1) label = selected.length + " selected";
  let html = `<div style="position:relative;width:100%;min-width:140px;" class="custom-multi" id="${id}-wrapper">
    <button type="button" style="width:100%;text-align:left;height:38px;background:#fff;border:1px solid #ccc;border-radius:4px;padding:0 8px;display:flex;justify-content:space-between;align-items:center;font-size:14px;color:#333;" onclick="const d=this.nextElementSibling;document.querySelectorAll('.multi-drop').forEach(x=>x!==d&&(x.style.display='none'));d.style.display=d.style.display==='none'?'block':'none';"><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(label)}</span> <span style="font-size:10px;color:#999">▼</span></button>
    <div class="multi-drop" style="display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid #ccc;z-index:999;max-height:220px;overflow-y:auto;box-shadow:0 4px 6px rgba(0,0,0,0.1);padding:4px;border-radius:4px;margin-top:2px;">`;
  for (const item of list) {
    const val = typeof item === "string" ? item : item[0];
    if (!val && val !== "") continue;
    const text = typeof item === "string" ? item : item[1];
    const isSel = selected.includes(val);
    if (val === "") continue;
    html += `<label style="display:flex;align-items:center;padding:6px 8px;cursor:pointer;font-size:14px;white-space:nowrap;"><input type="checkbox" data-multi-parent="${id}" value="${val}" style="margin:0 8px 0 0;" ${isSel ? "checked" : ""}> ${esc(text)}</label>`;
  }
  return html + `</div></div>`;
}

function sourceTable(list) {
  const p = ui.pagination?.sources || { page: 1, limit: 10 };
  const total = list.length;
  const start = (p.page - 1) * p.limit;
  const sliced = list.slice(start, start + p.limit);
  const ctr = (v) => `<div style="text-align:center">${v}</div>`;
  const html = sliced.map((s) => {
    const geoArr = [];
    const reg = getRegionForCountry(s.country);
    if (reg) geoArr.push(reg);
    if (s.country) geoArr.push(formatCountry(s.country));
    if (s.city) geoArr.push(s.city);
    const geoText = geoArr.length ? geoArr.join(" › ") : "Global";
    const pDisplay =
      s.provider === "admin" || s.provider === "website"
        ? '<span title="Added by: Mr. Hammer" style="border-bottom: 1px dashed #999; cursor: help;">Admin</span>'
        : s.provider === "dancer" || s.provider === "community"
          ? '<a href="#" onclick="toast(\'Opening Dancer profile...\'); return false;" title="View Dancer profile">@quyen_dancer</a>'
          : s.provider === "ai_keyword" || s.provider === "search"
            ? "Keyword"
            : esc(s.provider);
    return row([
      ctr(
        `<input type="checkbox" data-select-source="${s.id}" aria-label="Select ${esc(s.source_code)}" ${selectedSources.has(s.id) && s.enabled ? "checked" : ""} ${!editable() || ui.running || !s.enabled ? "disabled" : ""}>`,
      ),
      ctr(s.id),
      `<a href="${s.url}" target="_blank" title="${s.url}" style="display:inline-block; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; vertical-align: middle;">${esc(s.url)}</a>`,
      esc(geoText),
      pDisplay,
      ctr(
        `<input type="checkbox" class="switch" aria-label="Enable ${esc(s.source_code)}" data-source-toggle="${s.id}" ${s.enabled ? "checked" : ""} ${!editable() || ui.running ? "disabled" : ""}>`,
      ),
      ctr(
        pill(
          s.crawl_status,
          s.crawl_status === "failed"
            ? "red"
            : s.crawl_status === "success"
              ? "green"
              : "",
        ),
      ),
      stamp(s.last_crawled_at),
      stamp(s.next_crawl_at),
      `<div class="actions" style="justify-content:flex-end">${ib("source-edit", "Edit source " + s.id, "pencil", s.id, !editable())}${ib("crawl-one", "Crawl source " + s.id, "arrows-clockwise", s.id, !editable() || ui.running || !s.enabled)}${ib("delete-source", "Delete source " + s.id, "trash", s.id, !editable() || ui.running)}</div>`,
    ]);
  });
  return (
    sourceBulkToolbar(list) +
    table(
      [
        ctr("Select"),
        ctr("ID"),
        "URL",
        "Location (Region › Country › City)",
        "Source Origin",
        ctr("Enabled"),
        ctr("Status"),
        "Last Run",
        "Next Run",
        `<div style="text-align:right">Action</div>`,
      ],
      html,
    ) +
    paginationControls(total, p.page, p.limit, "sources")
  );
}

function cmsSources() {
  const isSource = ui.sourceTab === "sources";
  let list = (isSource ? db.ai_source_links : db.ai_discovery_queries).filter(
    (o) => !o.is_deleted,
  );
  const tf = isSource ? ui.srcF?.time || "today" : ui.kwF?.time || "today";
  const now = new Date();
  const isWithin = (dateStr) => {
    if (!dateStr || tf === "all") return true;
    const d = new Date(dateStr);
    if (tf === "today") return d.toDateString() === now.toDateString();
    if (tf === "week") return now - d <= 7 * 86400000;
    if (tf === "month") return now - d <= 30 * 86400000;
    return true;
  };
  const provMap = { admin: "Admin", dancer: "Dancer", ai_keyword: "Keyword" };
  const srcProviders = Array.from(
    new Set(db.ai_source_links.map((s) => s.provider).filter(Boolean)),
  ).map((p) => [p, provMap[p] || p]);
  const statuses = [
    ["pending", "Pending"],
    ["crawling", "Crawling"],
    ["success", "Success"],
    ["unchanged", "Unchanged"],
    ["failed", "Failed"],
  ];
  if (isSource) {
    if (tf !== "all") list = list.filter((o) => isWithin(o.last_crawled_at));
    if (ui.srcF?.q) {
      const q = ui.srcF.q.toLowerCase();
      list = list.filter(
        (o) =>
          String(o.id) === q ||
          o.url.toLowerCase().includes(q) ||
          o.source_code.toLowerCase().includes(q),
      );
    }
    if (ui.srcF?.provider) {
      const arr = ui.srcF.provider.split(",");
      list = list.filter((o) => arr.includes(o.provider));
    }
    if (ui.srcF?.region) {
      const arr = ui.srcF.region.split(",");
      list = list.filter((o) => {
        const reg = o.country ? getRegionForCountry(o.country) : "";
        return arr.some((r) => reg.includes(r));
      });
    }
    if (ui.srcF?.country) {
      const arr = ui.srcF.country.split(",");
      list = list.filter((o) => arr.includes(o.country));
    }
    if (ui.srcF?.city) {
      const arr = ui.srcF.city.split(",");
      list = list.filter((o) => arr.includes(o.city));
    }
    if (ui.srcF?.status) {
      list = list.filter((o) => o.crawl_status === ui.srcF.status);
    }
  } else {
    if (tf !== "all") list = list.filter((o) => isWithin(o.last_run_at));
    if (ui.kwF?.q)
      list = list.filter((o) =>
        o.keyword.toLowerCase().includes(ui.kwF.q.toLowerCase()),
      );
    if (ui.kwF?.region) {
      const arr = ui.kwF.region.split(",");
      list = list.filter((o) => arr.some((r) => o.region?.includes(r)));
    }
    if (ui.kwF?.country) {
      const arr = ui.kwF.country.split(",");
      list = list.filter((o) => arr.some((c) => o.country?.includes(c)));
    }
    if (ui.kwF?.city) {
      const arr = ui.kwF.city.split(",");
      list = list.filter((o) => arr.some((c) => o.city?.includes(c)));
    }
    if (ui.kwF?.status) {
      list = list.filter((o) => {
        const r = discoveryRuns().find((x) => x.query_id === o.id);
        const st = r ? r.status : "not_run";
        return st === ui.kwF.status;
      });
    }
  }

  const tfLabel =
    tf === "today"
      ? "hôm nay"
      : tf === "week"
        ? "tuần này"
        : tf === "month"
          ? "tháng này"
          : "(Tất cả)";
  const tfSelect = (id, val) =>
    `<select id="${id}" style="min-width:100px; height: 38px;"><option value="today" ${val === "today" ? "selected" : ""}>Hôm nay</option><option value="week" ${val === "week" ? "selected" : ""}>Tuần này</option><option value="month" ${val === "month" ? "selected" : ""}>Tháng này</option><option value="all" ${val === "all" ? "selected" : ""}>Tất cả</option></select>`;

  const filteredRuns = discoveryRuns().filter((r) => isWithin(r.started_at));
  const kwWidget = `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:32px;"><div style="padding:16px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.05);"><div style="color:#6b7280;font-size:0.9em;margin-bottom:8px">Đã chạy ${tfLabel}</div><div style="font-size:1.8em;font-weight:600">${filteredRuns.length} keywords</div></div><div style="padding:16px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.05);"><div style="color:#6b7280;font-size:0.9em;margin-bottom:8px">Ra được</div><div style="font-size:1.8em;font-weight:600;color:#10b981">${filteredRuns.reduce((a, b) => a + (b.new_links || 0), 0)} mới / ${filteredRuns.reduce((a, b) => a + (b.links || 0), 0)} tổng</div></div><div style="padding:16px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.05);"><div style="color:#6b7280;font-size:0.9em;margin-bottom:8px">Lỗi</div><div style="font-size:1.8em;font-weight:600;color:#ef4444">${filteredRuns.filter((r) => r.status === "failed").length} keywords</div></div></div>`;

  const activeSrcCount = db.ai_source_links.filter((s) => s.enabled).length;
  const filteredSrcPipelines = db.ai_pipeline_runs.filter((r) =>
    isWithin(r.started_at),
  );
  const filteredSrcCount = filteredSrcPipelines.reduce(
    (a, b) => a + (b.total_sources || 0),
    0,
  );
  const failedSrcCount = db.ai_source_links.filter(
    (s) => s.crawl_status === "failed",
  ).length;
  const srcWidget = `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:32px;"><div style="padding:16px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.05);"><div style="color:#6b7280;font-size:0.9em;margin-bottom:8px">Tổng Sources (Active)</div><div style="font-size:1.8em;font-weight:600">${activeSrcCount} sources</div></div><div style="padding:16px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.05);"><div style="color:#6b7280;font-size:0.9em;margin-bottom:8px">Đã cào ${tfLabel}</div><div style="font-size:1.8em;font-weight:600;color:#10b981">${filteredSrcCount} lượt</div></div><div style="padding:16px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.05);"><div style="color:#6b7280;font-size:0.9em;margin-bottom:8px">Lỗi (Failed)</div><div style="font-size:1.8em;font-weight:600;color:#ef4444">${failedSrcCount} sources</div></div></div>`;

  const srcFilters = `<div class="toolbar" style="margin-bottom:16px;gap:12px;display:flex;align-items:flex-start;background:#fff;padding:12px;border-radius:8px;border:1px solid #e5e7eb;"><input type="search" id="src-search" placeholder="Search URL or ID..." value="${esc(ui.srcF?.q || "")}" style="flex:1; height: 38px; min-width: 150px;"><div style="display:flex; flex-direction:column; gap:4px;"><label style="font-size:0.8em;color:#6b7280;font-weight:600">Timeframe</label>${tfSelect("src-time", ui.srcF?.time || "today")}</div><div style="display:flex; flex-direction:column; gap:4px; flex:1;"><label style="font-size:0.8em;color:#6b7280;font-weight:600">Origin</label>${multiSelect("src-provider", "All", srcProviders, ui.srcF?.provider || "")}</div><div style="display:flex; flex-direction:column; gap:4px; flex:1;"><label style="font-size:0.8em;color:#6b7280;font-weight:600">Region</label>${multiSelect("src-region", "All regions", queryRegions, ui.srcF?.region || "")}</div><div style="display:flex; flex-direction:column; gap:4px; flex:1;"><label style="font-size:0.8em;color:#6b7280;font-weight:600">Country</label>${multiSelect("src-country", "All countries", getCountriesForRegion(ui.srcF?.region || ""), ui.srcF?.country || "")}</div><div style="display:flex; flex-direction:column; gap:4px;"><label style="font-size:0.8em;color:#6b7280;font-weight:600">Status</label><select id="src-status" style="min-width:120px; height: 38px;"><option value="">All</option><option value="pending" ${ui.srcF?.status === "pending" ? "selected" : ""}>Pending</option><option value="crawling" ${ui.srcF?.status === "crawling" ? "selected" : ""}>Crawling</option><option value="success" ${ui.srcF?.status === "success" ? "selected" : ""}>Success</option><option value="unchanged" ${ui.srcF?.status === "unchanged" ? "selected" : ""}>Unchanged</option><option value="failed" ${ui.srcF?.status === "failed" ? "selected" : ""}>Failed</option></select></div><div style="display:flex; align-items:flex-end; height:100%; padding-top:20px;">${btn("apply-src-filters", "Filter", "", "primary")}</div></div>`;

  const kwFilters = `<div class="toolbar" style="margin-bottom:16px;gap:12px;display:flex;align-items:flex-start;background:#fff;padding:12px;border-radius:8px;border:1px solid #e5e7eb;">
<input type="search" id="kw-search" placeholder="Search keywords..." value="${esc(ui.kwF?.q || "")}" style="flex:1; height: 38px; min-width: 150px;">
<div style="display:flex; flex-direction:column; gap:4px;"><label style="font-size:0.8em;color:#6b7280;font-weight:600">Timeframe</label>${tfSelect("kw-time", ui.kwF?.time || "today")}</div>
<div style="display:flex; flex-direction:column; gap:4px; flex:1;"><label style="font-size:0.8em;color:#6b7280;font-weight:600">Region</label>${multiSelect("kw-region", "All regions", queryRegions, ui.kwF?.region || "")}</div>
<div style="display:flex; flex-direction:column; gap:4px; flex:1;"><label style="font-size:0.8em;color:#6b7280;font-weight:600">Country</label>${multiSelect("kw-country", "All countries", getCountriesForRegion(ui.kwF?.region || ""), ui.kwF?.country || "")}</div>
<div style="display:flex; flex-direction:column; gap:4px; flex:1;"><label style="font-size:0.8em;color:#6b7280;font-weight:600">City</label>${multiSelect("kw-city", "All cities", getCitiesForCountry(ui.kwF?.country || ""), ui.kwF?.city || "")}</div>
<div style="display:flex; flex-direction:column; gap:4px;"><label style="font-size:0.8em;color:#6b7280;font-weight:600">Run Status</label><select id="kw-status" style="min-width:120px; height: 38px;">
  <option value="">All</option>
  <option value="success" ${ui.kwF?.status === "success" ? "selected" : ""}>Success</option>
  <option value="failed" ${ui.kwF?.status === "failed" ? "selected" : ""}>Failed</option>
  <option value="not_run" ${ui.kwF?.status === "not_run" ? "selected" : ""}>Not run yet</option>
</select></div>
<div style="display:flex; align-items:flex-end; height:100%; padding-top:20px;">${btn("apply-kw-filters", "Filter", "", "primary")}</div></div>`;

  return (
    heading(
      "CMS-04 · SPRINT 1",
      "Crawler sources",
      "Manage approved URLs and discovery keywords.",
      btn(
        "source-edit",
        icon("plus") + (isSource ? "Add source" : "Add keyword"),
        "",
        "primary",
        !editable(),
      ),
    ) +
    `<div class="tabs">${btn("source-tab", "URL sources", "sources", isSource ? "active" : "")}${btn("source-tab", "Discovery keywords", "keywords", !isSource ? "active" : "")}</div>` +
    (isSource
      ? srcWidget +
        srcFilters +
        sourceTable(list) +
        `<div class="section-heading" style="margin-top: 48px;"><h3>Recent crawl runs</h3></div>` +
        runTable()
      : kwWidget +
        kwFilters +
        keywordTable(list) +
        `<div class="section-heading" style="margin-top: 48px;"><h3>Recent discovery runs</h3></div>` +
        discoveryTable(discoveryRuns()))
  );
}
function runTable() {
  if (!db.ai_pipeline_runs.length) return empty("No crawl runs yet");
  const p = ui.pagination?.runs || { page: 1, limit: 10 };
  const total = db.ai_pipeline_runs.length;
  const start = (p.page - 1) * p.limit;
  const sliced = db.ai_pipeline_runs.slice(start, start + p.limit);
  const num = (v) =>
    `<div style="text-align:right;font-variant-numeric:tabular-nums;">${v}</div>`;
  const ctr = (v) => `<div style="text-align:center">${v}</div>`;

  const html = sliced.flatMap((r) => {
    const attempts = db.ai_crawl_attempts.filter(
      (a) => a.pipeline_run_id === r.id,
    );
    const detail = attempts.length
      ? table(
          [ctr("Source ID"), "URL", ctr("Status"), ctr("HTTP"), "Message"],
          attempts.map((a) => {
            const f_url =
              a.final_url ||
              a.url ||
              db.ai_source_links.find((s) => s.id === a.source_link_id)?.url ||
              "";
            const url =
              f_url.length > 50 ? f_url.substring(0, 47) + "..." : f_url;
            return row([
              ctr(a.source_link_id),
              external(f_url, url),
              ctr(
                pill(
                  a.status,
                  a.status === "failed"
                    ? "red"
                    : a.status === "success"
                      ? "green"
                      : "",
                ),
              ),
              ctr(a.http_status),
              esc(a.error_message || "—"),
            ]);
          }),
        )
      : empty("No source data available");

    return [
      row([
        stamp(r.started_at),
        esc(r.trigger_type),
        ctr(
          pill(
            r.status,
            r.status === "failed"
              ? "red"
              : r.status === "partial_success"
                ? "amber"
                : "green",
          ),
        ),
        num(r.total_sources),
        num(r.total_raw_pages),
        num(r.total_opportunities),
        esc(r.error_message || "All success"),
        `<div style="text-align:right">${btn("toggle-run-results", "View details", r.id, "link")}</div>`,
      ]),
      `<tr id="run-results-${r.id}" style="display:none;background:#f8f9fa;"><td colspan="8" style="padding:16px 24px;border-bottom:2px solid #ddd;box-shadow:inset 0 3px 6px rgba(0,0,0,0.04);"><h4 style="margin-top:0">Chi tiết lô chạy lúc ${stamp(r.started_at)}</h4>${detail}</td></tr>`,
    ];
  });

  return (
    table(
      [
        "Date & Time",
        "Trigger",
        ctr("Status"),
        num("Sources"),
        num("Pages"),
        num("Jobs"),
        "Message",
        `<div style="text-align:right">Action</div>`,
      ],
      html,
    ) + paginationControls(total, p.page, p.limit, "runs")
  );
}
function cmsQueue() {
  const community = ui.queueTab === "community";
  const rows = (
    community ? ext().submissions : db.ai_discovered_source_candidates
  ).filter(matches);
  return (
    heading(
      "CMS-03 · SPRINT 4",
      "Review queue",
      "Approve a source for ingestion; review extracted jobs in the pipeline.",
    ) +
    `<div class="tabs">${btn("queue-tab", "Dancer contributions", "community", community ? "active" : "")}${btn("queue-tab", "Discovered sources", "discovery", !community ? "active" : "")}</div>` +
    searchBar(["pending_review", "approved", "rejected", "duplicate"]) +
    table(
      [
        "Submitted source",
        community ? "Contributor" : "Discovery keyword",
        "Note",
        "Review reason",
        helpHeading(
          "Status",
          "Review decision. Statuses: Pending, Approved, Rejected, Duplicate.",
        ),
        "Action",
      ],
      rows.map((s) =>
        row([
          external(s.url, s.url),
          community ? `Dancer #${s.dancer_id}` : esc(s.keyword),
          esc(s.note || s.snippet || "—"),
          esc(s.reason || "—"),
          pill(
            s.status,
            s.status === "approved"
              ? "green"
              : s.status === "rejected"
                ? "red"
                : "amber",
          ),
          s.status === "pending_review"
            ? `<div class="actions">${btn("approve", "Approve source", s.id, "", !editable())}${btn("reject", "Reject", s.id, "danger", !editable())}</div>`
            : "Reviewed",
        ]),
      ),
    )
  );
}

function cmsProspects() {
  return (ext().prospects ||= [
    { id: "P-001", display_name: "Aiko Mori", email: "aiko.mori@example.com", phone_number: "+81 90 1234 7788", city: "Tokyo", country: "Japan", status: "New", source: "Admin import", dance_styles: "Contemporary, Ballet" },
    { id: "P-002", display_name: "Nadia Lim", email: "nadia.lim@example.com", phone_number: "+65 8123 3344", city: "Singapore", country: "Singapore", status: "Invited", source: "Event signup", dance_styles: "Hip-Hop, K-pop" },
  ]);
}

function userJobRecords(user, isProspect = false) {
  const jobs = db.ai_opportunities.filter((job) => !job.is_deleted).slice(0, 8);
  const activity = ["Applied", "Viewed", "Saved", "Not viewed", "Applied", "Not viewed", "Viewed", "Saved"];
  return jobs.map((job, index) => ({
    job,
    score: Math.max(54, 96 - index * 6 - (Number(user.id) % 4)),
    matchStatus: index < 6 ? "Matched" : "Not eligible",
    delivery: isProspect ? (index < 2 ? "Shared manually" : "Not sent") : index < 5 ? "Shown in app" : "Not shown",
    activity: isProspect ? (index === 0 ? "Interested" : "No response") : activity[index],
    updated: index < 2 ? "Today" : `${index + 1} days ago`,
  }));
}

function userActivityPill(value) {
  const styles = {
    Applied: "green",
    Interested: "green",
    Saved: "amber",
    Viewed: "blue",
    "Not viewed": "",
    "No response": "",
  };
  return pill(value, styles[value] || "");
}

function cmsDancerDetail(id, kind = "user") {
  const isProspect = kind === "prospect";
  const user = isProspect
    ? cmsProspects().find((item) => item.id === String(id))
    : db.dancers.find((item) => item.id === Number(id));
  if (!user) return empty("User not found", "The selected record is unavailable.");

  const records = userJobRecords(user, isProspect);
  const applied = records.filter((item) => ["Applied", "Interested"].includes(item.activity)).length;
  const viewed = records.filter((item) => ["Viewed", "Saved", "Applied", "Interested"].includes(item.activity)).length;
  const tab = ui.cmsUserTab || "jobs";
  const name = user.display_name || user.email?.split("@")[0] || `User ${user.id}`;
  const accountStatus = isProspect ? user.status : user.isActive === false ? "Suspended" : "Active";

  const profilePanel = `<div class="user-profile-grid">
    ${kv([
      ["Name", name],
      ["User ID", isProspect ? "Not registered" : `#${user.id}`],
      ["Email", user.email || "Not provided"],
      ["Phone number", user.phone_number || "Not provided"],
      ["Status", accountStatus],
      ["Location", [user.city, user.country].filter(Boolean).join(", ") || "Not provided"],
      ["Dance styles", Array.isArray(user.dance_styles) ? user.dance_styles.join(", ") : user.dance_styles],
      [isProspect ? "Lead source" : "Skill level", isProspect ? user.source : user.skill_level],
    ])}
  </div>`;

  const jobsPanel = `
    <div class="user-job-summary">
      <div><strong>${records.filter((item) => item.matchStatus === "Matched").length}</strong><span>Matched jobs</span></div>
      <div><strong>${viewed}</strong><span>${isProspect ? "Contacted" : "Viewed or saved"}</span></div>
      <div><strong>${applied}</strong><span>${isProspect ? "Interested" : "Applied"}</span></div>
      <div><strong>${records.filter((item) => item.delivery.includes("Not")).length}</strong><span>Not delivered</span></div>
    </div>
    <div class="section-heading user-job-heading">
      <div><h3>Job Activity</h3><small>One record for each relationship between this ${isProspect ? "prospect" : "user"} and a CMS job.</small></div>
      <select aria-label="Filter job activity"><option>All job activity</option><option>Matched only</option><option>Applied / interested</option><option>Not delivered</option></select>
    </div>
    ${table(
      ["Job", "CMS status", "Match", "Delivery", isProspect ? "Prospect response" : "User activity", "Last update", "Action"],
      records.map(({ job, score, matchStatus, delivery, activity, updated }) =>
        row([
          `<strong>#${job.id} · ${esc(job.title)}</strong><small>${esc(job.organization || "Organization not provided")}</small>`,
          pill(statuses.find((status) => status[0] === job.status)?.[1] || job.status, job.status === "published" ? "green" : job.status === "closed" ? "red" : "amber"),
          matchStatus === "Matched" ? `<strong class="match-score">${score}%</strong><small>Style, location and experience</small>` : pill(matchStatus),
          `<span>${esc(delivery)}</span>`,
          userActivityPill(activity),
          esc(updated),
          ib("job-drawer", "View job", "arrow-square-out", job.id),
        ]),
      ),
    )}`;

  return `
    <div class="user-detail-topline">
      ${btn("user-list", icon("arrow-left") + "Back to users")}
      <div class="actions">${isProspect ? btn("link-prospect", "Link to existing user", user.id) + btn("invite-prospect", "Send invitation", user.id, "primary") : ib("edit-user", "Edit user", "pencil-simple", user.id)}</div>
    </div>
    <div class="user-detail-header">
      <div class="user-avatar">${esc(name.slice(0, 1).toUpperCase())}</div>
      <div class="user-heading"><div class="actions"><h1>${esc(name)}</h1>${pill(isProspect ? "Prospect" : "Existing user", isProspect ? "amber" : "green")}</div><p>${esc(user.email || user.phone_number || "No contact information")}</p></div>
      <div class="user-state"><span>Account status</span><strong>${esc(accountStatus)}</strong><small>${isProspect ? "No Hammer account linked" : "Registered Hammer user"}</small></div>
    </div>
    <div class="user-detail-tabs">
      <button class="${tab === "profile" ? "active" : ""}" onclick="ui.cmsUserTab='profile';render();">Profile Details</button>
      <button class="${tab === "jobs" ? "active" : ""}" onclick="ui.cmsUserTab='jobs';render();">Job Activity <span>${records.length}</span></button>
    </div>
    <div class="user-detail-panel">${tab === "profile" ? profilePanel : jobsPanel}</div>`;
}

function cmsDancers() {
  if (ui.cmsDancerId) return cmsDancerDetail(ui.cmsDancerId, ui.cmsUserKind || "user");
  const view = ui.cmsUsersView || "users";
  const prospects = cmsProspects();
  const users = db.dancers.filter(matches);
  const listTable = view === "users"
    ? table(
        ["ID", "Name", "User name", "Email", "Phone number", "Status", "Matched jobs", "Applied", "Action"],
        users.map((user) => {
          const records = userJobRecords(user);
          return row([
            `#${user.id}`,
            `<strong>${esc(user.display_name || user.email?.split("@")[0] || "Not provided")}</strong>`,
            esc(`dancer_${user.id}`),
            esc(user.email || "—"),
            esc(user.phone_number || "—"),
            pill(user.isActive === false ? "Suspended" : "Active", user.isActive === false ? "red" : "green"),
            `<strong>${records.filter((item) => item.matchStatus === "Matched").length}</strong>`,
            `<strong>${records.filter((item) => item.activity === "Applied").length}</strong>`,
            `<div class="actions">${ib("view-user-jobs", "View user and jobs", "eye", `${user.id}|user`)}${ib("edit-user", "Edit user", "pencil-simple", user.id)}</div>`,
          ]);
        }),
      )
    : table(
        ["Prospect ID", "Name", "Email", "Phone number", "Location", "Lead source", "Status", "Related jobs", "Action"],
        prospects.map((user) => row([
          user.id,
          `<strong>${esc(user.display_name)}</strong>`,
          esc(user.email),
          esc(user.phone_number),
          esc(`${user.city}, ${user.country}`),
          esc(user.source),
          pill(user.status, user.status === "Invited" ? "blue" : "amber"),
          `<strong>${userJobRecords(user, true).length}</strong>`,
          `<div class="actions">${ib("view-user-jobs", "View prospect and jobs", "eye", `${user.id}|prospect`)}${ib("link-prospect", "Link to existing user", "link", user.id)}</div>`,
        ])),
      );

  return heading(
    "ACCOUNTS · JOB AGENT",
    "Users & Job Activity",
    "Manage registered users, new prospects and their relationship with every job in CMS.",
    btn("add-prospect", icon("plus") + "Add prospect", "", "primary"),
  ) + `
    <div class="user-list-tabs">
      <button class="${view === "users" ? "active" : ""}" onclick="ui.cmsUsersView='users';render();">Existing Users <span>${db.dancers.length}</span></button>
      <button class="${view === "prospects" ? "active" : ""}" onclick="ui.cmsUsersView='prospects';render();">New Prospects <span>${prospects.length}</span></button>
    </div>
    <div class="user-list-toolbar">
      <input type="search" id="cms-search" aria-label="Search users" placeholder="Search ID, name, username, email or phone" value="${esc(ui.search)}">
      <select aria-label="Filter user status"><option>All statuses</option><option>Active</option><option>Suspended</option><option>Invited</option><option>New</option></select>
    </div>
    ${listTable}`;
}

function operationsConfig() {
  const c = ext().operationsConfig || {
    emergency_stop: false,
    publish_score: 7,
    reject_score: 3,
    expiry_days: 30,
    report_limit: 3,
    push_threshold: 85,
  };
  return `<div class="section-heading"><h3>Global configuration</h3><small>Proposed settings · local prototype only</small></div><form id="operations-config-form"><fieldset ${!editable() ? "disabled" : ""} style="border:0;padding:0;margin:0"><label class="check-row"><input type="checkbox" role="switch" name="emergency_stop" ${c.emergency_stop ? "checked" : ""}>Emergency kill switch</label><div class="form-grid">${field("publish_score", "Auto-publish score (0–9)", c.publish_score, "number", 'min="0" max="9" step="1" required')}${field("reject_score", "Auto-reject score (0–9)", c.reject_score, "number", 'min="0" max="9" step="1" required')}${field("expiry_days", "Job expiry duration (days)", c.expiry_days, "number", 'min="1" max="3650" step="1" required')}${field("report_limit", "Report suspension limit (dancers)", c.report_limit, "number", 'min="1" max="10000" step="1" required')}${field("push_threshold", "Push notification threshold (%)", c.push_threshold, "number", 'min="0" max="100" step="1" required')}</div><div class="error-text" id="operations-config-error" role="alert"></div><button type="submit" class="primary">Save configuration</button></fieldset></form>`;
}
function cmsOperations() {
  const m = (ui.metrics ||= metrics());
  return (
    heading(
      "CMS-05 · SPRINT 5",
      "Operations",
      "Periodic operational summary.",
      btn("refresh-metrics", icon("arrows-clockwise") + "Refresh summary"),
    ) +
    `<small>Snapshot updated ${stamp(m.at)} · All sample records</small><div class="stats">${[
      ["Crawl attempts", m.crawls],
      ["Available jobs", m.jobs],
      ["Copied drafts", m.copied],
      ["Self-reported applications", m.applied],
    ]
      .map(
        ([l, v]) =>
          `<div class="stat"><span>${helpHeading(l, { "Crawl attempts": "Recorded individual source crawl attempts, including failures.", "Available jobs": "Jobs currently available under prototype visibility rules.", "Copied drafts": "Jobs with a recorded draft copy, not confirmed applications.", "Self-reported applications": "Jobs marked as applied by dancers, not verified submissions to employers." }[l])}</span><b>${v}</b></div>`,
      )
      .join("")}</div>
    <div class="section-heading"><h3>Quality review</h3><small>Final UAT window</small></div>${table(["Metric", "Target", "Measured result"], [row(["Verified job precision", "≥ 70%", "Not measured · audit sample required"]), row(["Hidden opportunity discovery", "≥ 40%", "Not measured · reference-board comparison required"])])}
    <div class="section-heading"><h3>Crawler schedule</h3></div><form id="schedule-form"><div class="form-grid">${field("crawl_time", "Daily run time", ext().schedule.crawl_time, "time", "required")}${select("timezone", "Time zone", ["Asia/Singapore", "Asia/Tokyo", "UTC"], ext().schedule.timezone)}</div><label class="check-row"><input name="enabled" type="checkbox" ${ext().schedule.enabled ? "checked" : ""} ${!editable() ? "disabled" : ""}>Scheduled crawling enabled</label>${btn("save-schedule", "Save schedule", "", "", !editable())}</form>
    ${operationsConfig()}<div class="section-heading"><h3>Reported jobs</h3><small>No automatic source suspension</small></div>${table(
      [
        "Job",
        "Reason",
        "Note",
        helpHeading(
          "Status",
          "Pending reports await review. Resolved reports have an admin decision.",
        ),
        "Action",
      ],
      ext().reports.map((r) =>
        row([
          `<strong>${esc(job(r.opportunity_id)?.title || "Unavailable job")}</strong><small>#${r.opportunity_id}</small>`,
          esc(r.reason),
          esc(r.note || "—"),
          pill(r.status, r.status === "pending" ? "amber" : "green"),
          btn("moderate", "Review", r.id),
        ]),
      ),
    )}
    <div class="section-heading"><h3>Recent discovery runs</h3></div>${discoveryTable()}<div class="section-heading"><h3>Pipeline health · crawl runs</h3></div>${runTable()}<p class="summary-line">${ui.running ? "A sample pipeline is running." : "No sample pipeline running."}</p>
    <div class="section-heading"><h3>Recent activity</h3></div>${table(
      ["Time", "Actor", "Action", "Record"],
      ext()
        .audit.slice(0, 10)
        .map((a) =>
          row([stamp(a.at), esc(a.actor), esc(a.action), esc(a.entity)]),
        ),
    )}`
  );
}
function mobileNav() {
  return `<nav class="mobile-bottom" aria-label="Dancer navigation">${[
    ["home", "house", "Home", true],
    ["event", "calendar", "Event", true],
    ["learn", "medal", "Learn", true],
    ["feed", "briefcase", "Jobs", false],
    ["profile", "user-circle", "Profile", true],
  ]
    .map(([s, i, l, disabled]) =>
      btn("mobile", icon(i) + l, s, ui.mobile === s ? "active" : "", disabled),
    )
    .join("")}
    <div style="flex:1; display:flex; align-items:center;"><button class="create-btn" disabled><i class="ph ph-plus"></i></button></div>
    </nav>`;
}
function renderDancer() {
  let body = "",
    title = "",
    tools = "",
    below = "";
  if (ui.guest)
    return `<div class="dancer-stage">
  
  
  
  
  
  <section class="mobile-app"><div class="mobile-top"><h1>Job opportunities</h1></div>${empty("Sign in to continue", "Find opportunities and manage your applications.", btn("sign-in", "Sign in", "", "primary"))}</section></div>`;
  if (!ageAllowed() || ext().agentSuspensions[dancer().id]) {
    if (ext().agentSuspensions[dancer().id]) {
        return `<div class="dancer-stage">
  
  
  
  
  
  <section class="mobile-app"><div class="mobile-top"><h1>Job opportunities</h1></div>${empty("Job Agent access is paused", "Contact Hammer support to review your access.")}</section></div>`;
    }
    return `<div class="dancer-stage">
  
  
  
  
  
  <section class="mobile-app">
      <div class="mobile-top"><h1>Confirm you are 18 or older</h1></div>
      <div class="mobile-body">
        <form id="dialog-form" data-kind="age">
          <p class="muted compact">Hammer is dedicated to helping professional dancers find legitimate work opportunities. To use the Job Agent, you must be 18 or older.</p>
          <div class="divider"></div>
          ${field("dob", "Date of birth *", ext().age.dob || "", "date", 'required max="' + today() + '"')}
          <label class="check-row" style="margin-top: 1.5rem; align-items: flex-start;">
            <input name="agreement" type="checkbox" required>
            <span style="line-height: 1.4;">I confirm my date of birth is accurate and I understand Hammer uses this to provide professional work opportunities.</span>
          </label>
          <div class="error-text" id="dialog-error" role="alert"></div>
          <button class="primary wide-button" type="submit" style="margin-top: 2rem;">Confirm & continue</button>
        </form>
      </div>
    </section></div>`;
  }
  if (ui.mobile === "feed") {
    title = "";
    tools = "";
    below = `<div style="display:flex; justify-content:space-between; align-items:center; width:100%; font-size:16px; font-weight:bold;">
        <div style="width:24px;"></div>
        <div style="display:flex; gap:16px; color:#000;">
          <span style="opacity:0.5;">Following</span>
          <span>Jobs (AI)</span>
        </div>
        <button data-action="mobile" data-value="hub" style="background:none; border:none; color:#000; font-size:24px;"><i class="ph ph-magnifying-glass"></i></button>
      </div>
      <div class="toolbar" style="margin-top:10px;"><input id="feed-search" type="search" value="${esc(ui.feedSearch)}" aria-label="Search jobs" placeholder="Title, organization or city">${ib("filters", "Filter jobs", "sliders-horizontal")}</div>
      <button data-action="mobile" data-value="profile" style="width:100%; margin-top:16px; padding:10px; background:#f3f4f6; border:1px solid #e5e7eb; border-radius:8px; color:#374151; font-size:13px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:6px;">
        <i class="ph ph-user-circle" style="font-size:18px;"></i> Edit Job Profile & Preferences
      </button>`;
    const list = filteredJobs();
    body =
      (!dancer().availibility
        ? '<div class="notice">New job alerts are paused. You can still browse and apply.</div>'
        : "") +
      `<div class="section-heading"><h3>Recommended opportunities</h3><small>${list.length} jobs</small></div>` +
      (list.length
        ? list.map(jobCard).join("")
        : empty(
            "No matching opportunities",
            "Adjust your filters to see more jobs.",
            btn("reset-filters", "Reset filters"),
          ));
    if (!list.length) {
      const nearest = db.ai_opportunities
        .filter(available)
        .sort((a, b) => score(b).value - score(a).value)
        .slice(0, 2);
      body += `<div class="section-heading"><h3>Outside your current filters</h3></div>${nearest.map(jobCard).join("")}`;
    }
  } else if (ui.mobile === "hub") {
    title = "Job History";
    below = `<div class="tabs" style="display:flex; gap:12px; border-bottom: 1px solid #e5e7eb; padding-bottom:0;">${["saved", "drafted", "applied"].map((s) => btn("hub", { saved: "Saved", drafted: "Drafts", applied: "Applied" }[s], s, (ui.hub === s || (ui.hub === "all" && s === "saved")) ? "active" : "")).join("")}</div>`;
    const items = db.ai_opportunities.filter((o) => {
      const h = ext().history[o.id];
      return (
        h &&
        (ui.hub === "all"
          ? h.saved || Object.keys(h.drafts).length || h.applied_at
          : ui.hub === "saved"
            ? h.saved
            : ui.hub === "drafted"
              ? Object.keys(h.drafts).length && !h.applied_at
              : !!h.applied_at)
      );
    });
    body = items.length
      ? items.map((o) => jobCard(o, true)).join("")
      : empty(
          "Nothing here yet",
          "Save a job or create an application draft.",
          btn("mobile", "Browse jobs", "feed"),
        );
  } else if (ui.mobile === "profile") {
    title = "Profile & preferences";
    body = profileForm();
  } else if (ui.mobile === "submit") {
    title = "Contribute a job link";
    body = `<p class="muted compact">Share a public recruitment link for the Hammer team to review.</p><div class="divider"></div><form id="submission-form">${field("url", "Recruitment URL *", "", "url", 'required placeholder="https://…"')}${area("note", "Optional note", "", 'maxlength="500"')}<div class="error-text" id="submission-error" role="alert"></div><button type="submit" class="primary wide-button">Submit for review</button></form><div class="section-heading"><h3>Your contributions</h3></div>${
      ext()
        .submissions.filter((s) => s.dancer_id === dancer().id)
        .map(
          (s) =>
            `<div class="job-card">${external(s.url, new URL(s.url).hostname)}<p class="detail-meta">${pill(s.status)} ${esc(s.reason || "")}</p></div>`,
        )
        .join("") || "<small>No contributions yet.</small>"
    }`;
  } else if (["home", "event", "learn"].includes(ui.mobile)) {
    title = ui.mobile.charAt(0).toUpperCase() + ui.mobile.slice(1);
    body = empty(
      "Hammer Main App",
      "This is a placeholder for the existing " + title + " tab. <br>The Phase 1 prototype focuses on the Jobs (AI) tab.",
      btn("mobile", "Go to AI Jobs", "feed", "primary")
    );
  } else {
    title = btn("mobile", "‹ Job Detail", "feed", "link", false, 'style="color:#111827; font-weight:800; text-decoration:none; padding:0; background:none; border:none; cursor:pointer;"');
    const aj = job(ui.job);
    const hj = aj ? (ext().history[aj.id] || {}) : {};
    tools = aj
      ? ib('share', 'Share job', 'share-network', ui.job) +
        ib('save-job', hj.saved ? 'Unsave job' : 'Save job', hj.saved ? 'bookmark-simple-fill' : 'bookmark-simple', aj.id) +
        ib('report', 'Report job', 'flag', ui.job)
      : "";
    body = jobDetail();
  }
  const alert =
    ui.alertJob && available(job(ui.alertJob))
      ? `<button class="push-preview" data-action="open-alert" data-value="${ui.alertJob}">${icon("bell")}<span><strong>New job opportunity</strong>${esc(job(ui.alertJob).title)}</span></button>`
      : "";
  
  const floatingNote = '';
  return `<div class="dancer-stage" style="position:relative;">
  
  
  
  <div class="annotation-box" style="position:absolute; top:40px; left:40px; width:300px; padding:16px; background:#fff; border:2px solid #e11d48; border-radius:8px; box-shadow:0 10px 25px rgba(0,0,0,0.1); display:none; z-index:9999;">
    <h3 style="color:#e11d48; margin-top:0; font-size:16px;">💡 Navigation Update (Option 2)</h3>
    <ul style="font-size:13px; line-height:1.6; padding-left:20px; color:#475569; margin-bottom:0;">
      <li><b>Teach</b> tab was moved into Profile (Instructor Dashboard).</li>
      <li>Added <b>Jobs (AI)</b> Agent as a main tab.</li>
      <li>Home, Event, Learn, and Profile are disabled in this prototype.</li>
      <li><b>Job Agent Profile</b> settings are accessed via the User icon on the top right of the Jobs feed.</li>
    </ul>
  </div>
  <style>
    @media (min-width: 1000px) { .annotation-box { display: block !important; } }
  </style>
  <section class="mobile-app"><header class="mobile-top"><div class="mobile-title" style="${title ? '' : 'display:none;'}"><h1>${title}</h1><div class="actions">${tools}</div></div>${below}</header><div class="mobile-body">${alert}${body}</div>${mobileNav()}</section></div>`;
}
function filteredJobs() {
  return db.ai_opportunities
    .filter(available)
    .filter((o) => {
      const f = ui.filters,
        d = distance(o),
        days = duration(o),
        c = o.compensation;
      return (
        (!ui.feedSearch ||
          [o.title, o.organization, o.city]
            .join(" ")
            .toLowerCase()
            .includes(ui.feedSearch.toLowerCase())) &&
        (!f.city || o.city === f.city) &&
        (!f.type || o.opportunity_type === f.type) &&
        (f.radius === null || (d !== null && d <= f.radius)) &&
        (f.duration === 365 || (days !== null && days <= f.duration)) &&
        (!f.min ||
          (c &&
            c.currency === ext().profile.currency &&
            c.unit === ext().profile.compensation_unit &&
            c.amount >= f.min))
      );
    })
    .sort((a, b) => score(b).value - score(a).value);
}
function jobCard(o, inHub = false) {
    const h = ext().history[o.id], open = available(o);
    const s = score(o);

    // 1. Badge Logic
    const ot = (o.opportunity_type || "").toLowerCase();
    const isShowcase = ot.includes("audition") || ot.includes("battle") || ot.includes("jam") || ot.includes("contest") || ot.includes("competition") || ot.includes("casting") || ot.includes("workshop");
    
    let typeBg = isShowcase ? "#f3e8ff" : "#f3f4f6";
    let typeColor = isShowcase ? "#9333ea" : "#374151";
    const typeLabel = isShowcase ? "SHOWCASE" : "JOB";
    
    const typePill = `<span style="background: ${typeBg}; color: ${typeColor}; font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 4px; text-transform: uppercase;">${typeLabel}</span>`;

    // 2. Match Badge
    let matchPill = "";
    if (open) {
        matchPill = `<span style="background: #d1fae5; color: #047857; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; display: flex; align-items: center; gap: 4px;">✨ ${s.value}% Match${s.est ? ' <span style="opacity: 0.8; font-size: 10px;">· Estimate</span>' : ''}</span>`;
    } else {
        matchPill = `<span style="background: #fee2e2; color: #b91c1c; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px;">Closed</span>`;
    }

    // 3. Org & Location
    const loc = o.city ? `${o.city}${o.country ? ", " + o.country : ""}` : "Worldwide";
    const orgLoc = `${esc(o.organization || "Private")} &bull; ${esc(loc)}`;

    // 4. Extra Meta: Dance Styles & Dates
    const styles = (o.dance_styles || []).join(", ");
    let styleHtml = "";
    if (styles) {
        styleHtml = `<div style="font-size: 12px; color: #6b7280; margin-top: 4px; display: flex; align-items: center; gap: 4px;"><svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M216,104v8a56.06,56.06,0,0,1-56,56H136v40h16a8,8,0,0,1,0,16H104a8,8,0,0,1,0-16h16V168H104a56.06,56.06,0,0,1-56-56v-8a8,8,0,0,1,16,0v8a40,40,0,0,0,40,40h16V88H104A40,40,0,0,1,64,48V40a8,8,0,0,1,16,0v8a24,24,0,0,0,24,24h16V32a8,8,0,0,1,16,0V72h16a24,24,0,0,0,24-24V40a8,8,0,0,1,16,0v8A40,40,0,0,1,152,88h-16v64h24a40,40,0,0,0,40-40v-8a8,8,0,0,1,16,0Z"></path></svg> ${esc(styles)}</div>`;
    }

    let dateHtml = "";
    if (o.event_start_date) {
        let dateText = dateLabel(o.event_start_date);
        if (o.event_end_date && o.event_end_date !== o.event_start_date) {
            dateText += " to " + dateLabel(o.event_end_date);
        }
        dateHtml = `<div style="font-size: 12px; color: #6b7280; margin-top: 4px; display: flex; align-items: center; gap: 4px;"><svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V72H48V48ZM208,208H48V88H208V208Z"></path></svg> ${dateText}</div>`;
    }

    // 5. Compensation
    let compMain = "Contact Organizer";
    
    if (o.compensation && (o.compensation.min_amount || o.compensation.max_amount || o.compensation.amount)) {
        compMain = (isShowcase ? "Prize: " : "") + money(o);
    }
    
    // 6. Fake Activity Counter (FOMO)
    // Generates a stable pseudo-random number (3 to 32) based on job ID
    const interestedCount = (o.id * 7 % 30) + 3;
    const interestedPill = `<span style="font-size: 11px; color: #4b5563; font-weight: 600; display: flex; align-items: center; gap: 4px; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">👥 ${interestedCount} interested</span>`;

    return `<article class="job-card" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-align: left;" data-job="${o.id}">
      
      <!-- Top Row: Badges -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        ${typePill}
        ${matchPill}
      </div>

      <!-- Title & Org -->
      <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #111827;">
        <button data-action="job" data-value="${o.id}" class="link" style="color: inherit; text-decoration: none; text-align: left; background: none; border: none; padding: 0; font-family: inherit; font-size: inherit; font-weight: inherit; cursor: pointer;">${esc(o.title)}</button>
      </h3>
      <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px; font-weight: 500;">
        ${orgLoc}
      </div>
      
      <!-- Extra Meta: Styles & Dates -->
      ${styleHtml}
      ${dateHtml}

      <!-- Divider -->
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 12px 0;">

      <!-- Bottom Row: Compensation & Action -->
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 16px; font-weight: 800; color: #111827;">
            ${esc(compMain)}
        </div>
        
        <div style="display: flex; gap: 8px; align-items: center;">
            ${interestedPill}
            ${ib("save-job", h?.saved ? "Unsave job" : "Save job", h?.saved ? "bookmark-simple-fill" : "bookmark-simple", o.id)}
        </div>
      </div>
      
    </article>`;
  }
  function jobDetail() {
    const o = job(ui.job);
    if (!o) return empty("Job unavailable", "This link may no longer be available.", btn("mobile", "Browse jobs", "feed"));
      
    const s = score(o);
    const h = history(o.id);
    const open = available(o);
      
    const ot = (o.opportunity_type || "").toLowerCase();
    const isShowcase = ot.includes("audition") || ot.includes("battle") || ot.includes("jam") || ot.includes("contest") || ot.includes("competition") || ot.includes("casting") || ot.includes("workshop");
    const typeLabel = isShowcase ? "SHOWCASE" : "JOB";
    
    const loc = o.city ? `${o.city}${o.country ? ", " + o.country : ""}` : "Worldwide";
    
    let compMain = "Contact Organizer";
    if (o.compensation && (o.compensation.min_amount || o.compensation.max_amount || o.compensation.amount)) {
        compMain = money(o);
    }

    // Build AI Match Reason String
    const matchedParts = s.parts.filter(p => p[2] === true).map(p => p[0]);
    let matchStr = matchedParts.length > 0 ? matchedParts.join(" + ") : "General profile match";
    if (s.est) matchStr += s.missing_dancer_info ? " (Please complete your profile for a more accurate match score)" : " (Provisional score due to limited job info)";
    if(s.risks && s.risks.length > 0) matchStr += " (Note: " + s.risks[0] + ")";

    let dateStr = "";
    if (o.event_start_date) {
        dateStr = dateLabel(o.event_start_date);
        if (o.event_end_date && o.event_end_date !== o.event_start_date) dateStr += " to " + dateLabel(o.event_end_date);
    }

    // STRICT UI/UX REDESIGN
    // 1. Removed the duplicate custom header. We rely on the framework's '.mobile-top'.
    // 2. Used clean dividers instead of heavy nested borders.
    // 3. Perfected padding, font-sizes, and hierarchy.

    return `
    <!-- No outer wrapper to prevent layout stretching -->
    <div style="background: white; margin: -24px -20px; padding-top: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827;">
        
        <!-- Badges -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding: 16px 20px 12px 20px;">
            <span style="background: #111827; color: white; font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 4px; letter-spacing: 0.5px;">${typeLabel}</span>
            ${open ? `<span style="border: 1px solid #10b981; color: #10b981; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: rgba(16,185,129,0.05);">+ ${s.value}% Match</span>` : `<span style="border: 1px solid #ef4444; color: #ef4444; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: rgba(239,68,68,0.05);">Closed</span>`}
        </div>

        <!-- Title -->
        <div style="padding: 0 20px 20px 20px;">
            <h1 style="font-size: 24px; font-weight: 800; line-height: 1.25; margin: 0 0 8px 0; color: #0f172a;">${esc(o.title)}</h1>
            <p style="font-size: 14px; color: #64748b; margin: 0;">${esc(o.organization || "Private")} &bull; ${esc(loc)}</p>
        </div>

        <!-- Meta Data (Clean layout, no boxes) -->
        <div style="padding: 0 20px 20px 20px;">
            <div style="display: grid; gap: 12px; font-size: 14px; color: #475569;">
                <div style="display:flex; align-items: flex-start; gap: 10px;">
                    <i class="ph ph-calendar-blank" style="font-size: 18px; color: #94a3b8; margin-top:1px;"></i>
                    <div style="line-height: 1.5;">
                        <div style="margin-bottom: 4px;"><strong style="color: #1e293b; font-weight: 600;">Deadline:</strong> ${o.deadline ? dateLabel(o.deadline) : "Open-ended"}</div>
                        ${dateStr ? `<div><strong style="color: #1e293b; font-weight: 600;">Event:</strong> ${dateStr}</div>` : ""}
                    </div>
                </div>
                <div style="display:flex; align-items: flex-start; gap: 10px;">
                    <i class="ph ph-users" style="font-size: 18px; color: #94a3b8; margin-top:1px;"></i>
                    <div style="line-height: 1.5;">
                        <strong style="color: #1e293b; font-weight: 600;">Styles:</strong> ${o.dance_styles.join(", ")}
                    </div>
                </div>
                ${o.google_maps_url ? `
                <div style="display:flex; align-items: center; gap: 10px;">
                    <i class="ph ph-map-pin" style="font-size: 18px; color: #94a3b8;"></i>
                    <a href="${esc(o.google_maps_url)}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 500;">Open in Google Maps <i class="ph ph-arrow-up-right" style="font-size: 14px; vertical-align: middle;"></i></a>
                </div>` : ""}
            </div>
        </div>

        <!-- AI Match Box -->
        <div style="padding: 0 20px 24px 20px;">
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px;">
                <div style="font-size: 12px; font-weight: 800; color: #1e40af; margin-bottom: 6px; display:flex; align-items:center; gap:6px;"><i class="ph-fill ph-sparkle"></i> AI MATCH REASON:</div>
                <div style="font-size: 14px; color: #2563eb; line-height: 1.5;">${esc(matchStr)}.</div>
            </div>
        </div>

        <div style="height: 8px; background: #f8fafc; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; width: 100%;"></div>

        <!-- Job Description -->
        <div style="padding: 24px 20px;">
            <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Job Description</h2>
            <div style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px; white-space: pre-wrap;">${esc(o.description)}</div>
${(o.requirements && Array.isArray(o.requirements) && o.requirements.length > 0) ? `
            <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Requirements</h3>
            <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #334155; font-size: 15px; line-height: 1.6;">
                ${o.requirements.map(req => `<li>${esc(req)}</li>`).join('')}
            </ul>` : (o.requirements && !Array.isArray(o.requirements)) ? `
            <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Requirements</h3>
            <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #334155; font-size: 15px; line-height: 1.6;">
                ${o.requirements.skill_level ? `<li><strong>Skill Level:</strong> ${esc(o.requirements.skill_level)}</li>` : ""}
                ${o.requirements.years_experience ? `<li><strong>Experience:</strong> ${esc(o.requirements.years_experience)}+ years</li>` : ""}
            </ul>` : ""}
            
            <div style="display:flex; justify-content:space-between; align-items: center; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #0f172a;">
                <div><span style="color:#64748b;">Pay:</span> <strong style="margin-left: 4px; font-size: 15px;">${esc(compMain)}</strong></div>
            </div>
        </div>

        <div style="height: 8px; background: #f8fafc; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; width: 100%;"></div>

        <!-- Application Methods -->
        <div style="padding: 24px 20px;">
            <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">How to Apply</h2>
            ${o.application_instructions ? `<div style="font-size: 14px; line-height: 1.5; color: #475569; margin-bottom: 16px; background: #f8fafc; padding: 12px; border-radius: 6px; border-left: 3px solid #cbd5e1;">${esc(o.application_instructions)}</div>` : ""}

            ${(o.contact_email || o.whatsapp_link) ? `<div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
                ${o.whatsapp_link ? `
                <div style="display: flex; align-items: center; justify-content: space-between; background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <div style="background: #dcfce7; color: #16a34a; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;"><i class="ph ph-whatsapp-logo" style="font-size: 20px;"></i></div>
                        <div>
                            <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">WhatsApp</div>
                            <div style="font-size: 15px; font-weight: 700; color: #0f172a;">${esc(o.whatsapp_link.replace(/https?:\/\/wa\.me\//, '+'))}</div>
                        </div>
                    </div>
                    <a href="${esc(o.whatsapp_link)}" target="_blank" style="background: white; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 6px; color: #334155; font-size: 13px; font-weight: 600; text-decoration: none; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">Chat</a>
                </div>` : ""}
                ${o.contact_email ? `
                <div style="display: flex; align-items: center; justify-content: space-between; background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <div style="background: #fee2e2; color: #ef4444; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;"><i class="ph ph-envelope-simple" style="font-size: 20px;"></i></div>
                        <div>
                            <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Email</div>
                            <div style="font-size: 15px; font-weight: 700; color: #0f172a;">${esc(o.contact_email)}</div>
                        </div>
                    </div>
                    <button onclick="alert('Copied!')" style="background: white; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 6px; color: #334155; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">Copy</button>
                </div>` : ""}
            </div>` : ""}

            ${(o.application_url || o.instagram_dm || o.facebook_link) ? `<div style="display: flex; flex-direction: column; gap: 1px; background: #e2e8f0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                ${o.application_url ? `<a href="${esc(o.application_url)}" target="_blank" style="display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 14px 16px; text-decoration: none; color: #0f172a; font-weight: 500; font-size: 15px;">
                    <div style="display: flex; align-items: center; gap: 12px;"><i class="ph ph-link" style="font-size: 20px; color: #6366f1;"></i> Submit via Portal</div>
                    <i class="ph ph-caret-right" style="color: #94a3b8;"></i>
                </a>` : ""}
                ${o.facebook_link ? `<a href="${esc(o.facebook_link)}" target="_blank" style="display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 14px 16px; text-decoration: none; color: #0f172a; font-weight: 500; font-size: 15px;">
                    <div style="display: flex; align-items: center; gap: 12px;"><i class="ph ph-facebook-logo" style="font-size: 20px; color: #1877f2;"></i> Message on Facebook</div>
                    <i class="ph ph-caret-right" style="color: #94a3b8;"></i>
                </a>` : ""}
                ${o.instagram_dm ? `<a href="${esc(o.instagram_dm)}" target="_blank" style="display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 14px 16px; text-decoration: none; color: #0f172a; font-weight: 500; font-size: 15px;">
                    <div style="display: flex; align-items: center; gap: 12px;"><i class="ph ph-instagram-logo" style="font-size: 20px; color: #e1306c;"></i> Direct Message Instagram</div>
                    <i class="ph ph-caret-right" style="color: #94a3b8;"></i>
                </a>` : ""}
            </div>` : ""}

            <!-- AI Pitch Draft Box -->
            ${o.contact_email || true ? `
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); overflow: hidden;">
                <div style="background: #f8fafc; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; display:flex; justify-content: space-between; align-items: center;">
                    <div style="font-weight: 700; font-size: 12px; color: #475569; display:flex; align-items:center; gap:6px; letter-spacing: 0.5px;"><i class="ph ph-magic-wand" style="color: #2563eb; font-size: 16px;"></i> AI PITCH DRAFT</div>
                    <div style="display:flex; gap: 12px; align-items: center;">
                        <div style="display:flex; gap: 4px; background: #e2e8f0; padding: 2px; border-radius: 12px;">
                            <span style="background: white; color: #0f172a; padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.05); cursor:pointer;">EN</span>
                            <span style="color: #64748b; padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; cursor:pointer;">JP</span>
                        </div>
                        <button onclick="alert('Regenerating draft...')" style="background: white; border: 1px solid #cbd5e1; color: #475569; padding: 4px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; box-shadow: 0 1px 2px rgba(0,0,0,0.02);" title="Regenerate draft">
                            <i class="ph ph-arrows-clockwise" style="font-size: 16px;"></i>
                        </button>
                    </div>
                </div>

                <div style="padding: 16px;">
                    <div style="font-size: 14px; line-height: 1.6; color: #1e293b; margin-bottom: 20px; white-space: pre-wrap;">To: ${esc(o.contact_email || 'casting@example.com')}

Dear ${esc(o.organization || "Team")},

I am an advanced dancer based in ${esc(o.city || "your city")}. I am very interested in your ${esc(o.title)} listing.

My profile aligns perfectly with your requirements for ${(Array.isArray(o.dance_styles) ? o.dance_styles : []).join(", ")}.

Let me know if you need my dance reel.</div>

                    <div style="display:flex;">
                        <button onclick="alert('Copied to clipboard!')" style="flex:1; border: none; background: #0f172a; color: white; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 600; display:flex; justify-content:center; align-items:center; gap:8px; cursor:pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><i class="ph ph-copy" style="font-size: 18px;"></i> Copy & Apply</button>
                    </div>
                </div>
            </div>
            ` : ""}
        </div>

        
        <!-- Report Section -->
        
        
        <!-- Progress Tracker Hidden Temporarily -->
        </div>
    `;
  }
function profileForm() {
  const d = dancer(), p = ext().profile;
  const styles = ["Hip-hop", "Contemporary", "Ballet", "Jazz", "K-pop", "Open Choreo", "Heels", "Other"];
  const roles = ["Performance", "Teaching", "Choreography", "Other"];
  const langs = ["English", "Vietnamese", "Japanese", "Mandarin", "Korean", "Other"];
  
  const renderChips = (name, list, current) => {
    const curArr = (current || "").split(",");
    return `<div class="chip-group" style="margin-top:0;">${list.map(item => `<label><input type="checkbox" name="${name}" value="${item}" class="chip-input" ${curArr.includes(item) ? "checked" : ""}><span class="chip-label">${item}</span></label>`).join("")}</div>`;
  };

  return `<div class="profile-heading" style="margin-bottom:16px; display:none;">
    <img class="avatar" src="assets/dancer.jpg" alt="Sample dancer portrait">
    <div><h3 style="margin:0;font-size:18px;">${esc(p.display_name)}</h3><small style="color:#6b7280;">${esc(d.email)}</small></div>
  </div>
  
  <form id="profile-form">
  
  <div class="pro-card" style="display:flex; align-items:center; justify-content:space-between; border-left:4px solid #10b981; padding:12px 16px;">
    <div>
      <span style="font-weight:700; display:block; font-size:15px; color:#111827;">Open to Work</span>
      <span style="font-size:12px; color:#6b7280; margin-top:2px; display:block;">Get personalized job alerts and recommendations.</span>
    </div>
    <input id="open-to-work-profile" name="availibility" class="switch" type="checkbox" ${d.availibility ? "checked" : ""}>
  </div>

  <h3 style="font-size:18px; font-weight:800; color:#111827; margin:24px 0 16px;">Basic Info</h3>
  
  <!-- 1. LOCATION BLOCK -->
  <div style="margin-bottom:24px;">
    <h4 style="font-size:14px; font-weight:700; color:#374151; margin:0 0 12px; display:flex; align-items:center; gap:6px;">1. Location</h4>
    
    <div style="display:flex; gap:16px; margin-bottom:16px;">
      <div style="flex:1;"><label class="form-label" style="font-size:11px;">Country</label>${select("country", "", ["Singapore", "Japan", "Vietnam", "United States"], d.country || "Singapore").replace('<label class="field"><span></span>', "").replace('</label>', "")}</div>
      <div style="flex:1;"><label class="form-label" style="font-size:11px;">City</label>${select("city", "", cities, d.city).replace('<label class="field"><span></span>', "").replace('</label>', "")}</div>
    </div>
    
    <label class="field"><span class="range-value" style="font-weight:600; font-size:12px; margin-top:8px;">Willing to travel locally up to <output id="radius-output" style="color:#10b981;">${d.travelRadiusKm || 20} km</output></span><input type="range" name="travelRadiusKm" min="5" max="100" value="${d.travelRadiusKm || 20}" data-output="radius-output" data-unit=" km"></label>
    
    <div style="margin-top:16px; display:flex; flex-direction:column; gap:12px; ">
      <label class="check-row" style="margin:0;"><input type="checkbox" name="work_abroad" ${d.work_abroad ? "checked" : ""}> <span style="font-size:13px; font-weight:500;">Open to international travel / work abroad</span></label>
      <label class="check-row" style="margin:0;"><input type="checkbox" name="include_online" ${d.include_online ? "checked" : ""}> <span style="font-size:13px; font-weight:500;">Include online/remote projects</span></label>
    </div>
  </div>

  <!-- 2. STYLES BLOCK -->
  <div style="margin-bottom:24px;">
    <h4 style="font-size:14px; font-weight:700; color:#374151; margin:0 0 10px; display:flex; align-items:center; gap:6px;">2. Dance Styles</h4>
    ${renderChips("dance_styles", styles, d.dance_styles)}
  </div>

  <!-- 3. ROLES BLOCK -->
  <div style="margin-bottom:24px;">
    <h4 style="font-size:14px; font-weight:700; color:#374151; margin:0 0 10px; display:flex; align-items:center; gap:6px;">3. Preferred Roles</h4>
    ${renderChips("preferred_types", roles, d.preferred_types)}
  </div>

  <!-- 4. EXPERIENCE BLOCK -->
  <div style="margin-bottom:24px;">
    <h4 style="font-size:14px; font-weight:700; color:#374151; margin:0 0 10px; display:flex; align-items:center; gap:6px;">4. Experience</h4>
    <div style="display:flex; gap:16px;">
      <div style="flex:2;"><label class="form-label" style="font-size:11px;">Skill Level</label>${select("skill_level", "", ["Beginner", "Intermediate", "Advanced"], d.skill_level).replace('<label class="field"><span></span>', "").replace('</label>', "")}</div>
      <div style="flex:1;"><label class="form-label" style="font-size:11px;">Years</label>${field("year_experience", "", d.year_experience, "number", 'min="0" max="80"').replace('<label class="field"><span></span>', "").replace('</label>', "")}</div>
    </div>
  </div>

  <!-- 5. ADVANCED BLOCK -->
  <details class="pro-card" style="padding:0; margin-bottom:24px; overflow:hidden;">
    <summary style="font-weight:600; cursor:pointer; padding:16px; color:#3b82f6; background:#f8fafc; border-bottom:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center;">
      <span style="display:flex; align-items:center; gap:6px;"><i class="ph ph-plus-circle"></i> Add rate & details for better matches</span>
      <i class="ph ph-caret-down"></i>
    </summary>
    <div style="padding:16px;">
      <label class="form-label" style="font-size:12px; margin-bottom:8px;">Minimum acceptable rate</label>
      <div style="display:flex; gap:8px; margin-bottom:20px;">
        <div style="flex:2;">${field("min_compensation", "", d.min_compensation, "number", 'min="0" step="1" placeholder="e.g. 50"').replace('<label class="field"><span></span>', "").replace('</label>', "")}</div>
        <div style="flex:1;">${select("currency", "", ["SGD", "USD", "VND"], p.currency).replace('<label class="field"><span></span>', "").replace('</label>', "")}</div>
        <div style="flex:2;">${select("compensation_unit", "", ["Per hour", "Per class", "Per gig", "Per month", "Other"], p.compensation_unit).replace('<label class="field"><span></span>', "").replace('</label>', "")}</div>
      </div>
      
      <label class="form-label" style="font-size:12px; margin-bottom:8px;">Languages you speak</label>
      ${renderChips("languages", langs, d.languages)}
      
      
    </div>
  </details>

  <div class="error-text" id="profile-error" role="alert"></div>
  <button class="primary wide-button" type="submit" style="padding:14px; font-size:15px; font-weight:600; border-radius:8px;">Save & View Jobs</button>
  </form>`;
}

let lastFocus = null;
function dialog(kind, title, body, saveLabel = "", extra = "", shape = "") {
  lastFocus = document.activeElement;
  ui.dialog = kind;
  ui.dirty = false;
  $("#overlay-root").innerHTML =
    `<div class="overlay ${shape}"><section class="dialog ${shape === "drawer" ? "" : "wide"}" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><header class="dialog-head"><h2 id="dialog-title">${title}</h2>${ib("close", "Close dialog", "x")}</header><div class="dialog-body"><form id="dialog-form" data-kind="${kind}"><div class="error-text" id="dialog-error" role="alert"></div>${body}</form></div><footer class="dialog-footer">${extra}${btn("close", "Close")}${saveLabel ? `<button class="primary" type="submit" form="dialog-form" ${ui.mode === "cms" && !editable() ? "disabled" : ""}>${saveLabel}</button>` : ""}</footer></section></div>`;
  document.body.style.overflow = "hidden";
  setTimeout(
    () =>
      $(
        "#overlay-root input:not([type=hidden]),#overlay-root select,#overlay-root button",
      )?.focus(),
    0,
  );
}
function closeDialog(force = false) {
  if (ui.dirty && !force && !confirm("Discard unsaved changes?")) return false;
  $("#overlay-root").innerHTML = "";
  document.body.style.overflow = "";
  ui.dialog = null;
  ui.dirty = false;
  lastFocus?.isConnected && lastFocus.focus();
  return true;
}
function formError(message) {
  $("#dialog-error").textContent = message;
  $("#dialog-error").scrollIntoView({ block: "nearest" });
}
function openAge() {
  // Do nothing. Age gate is now handled inline within renderDancer()
}
function ensureAccess() {
  if (ui.guest) {
    render();
    return false;
  }
  if (ext().agentSuspensions[dancer().id]) {
    render();
    return false;
  }
  if (!ageAllowed()) {
    render();
    openAge();
    return false;
  }
  return true;
}
function showJob(id) {
  ui.mode = "dancer";
  ui.pendingJob = Number(id);
  if (!ensureAccess()) return;
  ui.job = Number(id);
  ui.mobile = "detail";
  ui.pendingJob = null;
  render();
}
function openFilters() {
  const f = ui.filters;
  dialog(
    "filters",
    "Filter opportunities",
    `${select("city", "City", [["", "All cities"], ...cities], f.city)}${select("type", "Job type", [["", "All types"], ...types], f.type)}<label class="check-row"><input type="checkbox" name="limit_radius" ${f.radius !== null ? "checked" : ""}>Limit distance from my profile city</label><label class="field"><span class="range-value">Travel radius <output id="filter-radius">${f.radius ?? 25} km</output></span><input type="range" name="radius" min="5" max="100" value="${f.radius ?? 25}" data-output="filter-radius" data-unit=" km"></label><label class="field"><span class="range-value">Maximum duration <output id="filter-duration">${f.duration} days</output></span><input type="range" name="duration" min="1" max="365" value="${f.duration}" data-output="filter-duration" data-unit=" days"></label>${field("min", `Minimum pay (${esc(ext().profile.currency)} / ${esc(ext().profile.compensation_unit)})`, f.min, "number", 'min="0" step="1"')}<small>Unknown or differently denominated pay is excluded when a minimum is set.</small>`,
    "Apply filters",
    btn("reset-filters", "Reset"),
    "sheet",
  );
}
function draftFor(id, lang) {
  const h = history(id),
    o = job(id),
    t = db.ai_application_templates.find(
      (t) => t.language === lang && t.enabled,
    );
  if (!t) return null;
  if (h.drafts[lang] != null)
    return { body: h.drafts[lang], subject: h.subjects?.[lang] || "" };
  const d = dancer();
  const vars = {
    organization: o.organization,
    title: o.title,
    city: d.city,
    skill_level: d.skill_level,
    year_experience: d.year_experience,
    dance_styles: Array.isArray(d.dance_styles)
      ? d.dance_styles.join(", ")
      : d.dance_styles,
    portfolio_url: d.portfolio_url,
  };
  const missing = t.required_variables.filter((k) => !vars[k]);
  if (missing.length) return { missing };
  const fill = (s) =>
    s.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
  return { body: fill(t.body_template), subject: fill(t.subject_template) };
}
function openPitch(id, lang = ui.lang) {
  ui.job = Number(id);
  ui.lang = lang;
  const d = draftFor(id, lang),
    o = job(id),
    h = history(id);
  if (!d || d.missing) {
    dialog(
      "missing-profile",
      "Complete your profile",
      `<p>Needed before preparing a draft: ${esc(d?.missing?.join(", ") || "enabled template")}.</p>`,
      "",
      btn("go-profile", "Edit profile", "", "primary"),
    );
    return;
  }
  if (!available(o) && !h.drafts[lang]) {
    toast("This opportunity is closed. No new draft can be created.");
    return;
  }
  dialog(
    "pitch",
    "Application draft",
    `<p><strong>${esc(o.organization || "Organizer")}</strong></p><p class="muted compact">${esc(o.title)}</p><div class="tabs">${btn("pitch-lang", "English", "en", lang === "en" ? "active" : "")}${btn("pitch-lang", "日本語", "ja", lang === "ja" ? "active" : "")}</div>${field("subject", "Email subject", d.subject)}${area("body", "Your draft", d.body, 'rows="9" required')}<small>Review before sending. Hammer does not submit the application.</small>`,
    "Save draft",
    btn("copy-draft", icon("copy") + "Copy draft"),
  );
}
function captureDraft() {
  const f = $("#dialog-form");
  if (ui.dialog !== "pitch" || !f) return;
  const v = new FormData(f);
  const h = history(ui.job);
  h.drafts[ui.lang] = v.get("body");
  (h.subjects ||= {})[ui.lang] = v.get("subject");
  persist();
  ui.dirty = false;
}
function sourceDialog(id) {
  const isSource = ui.sourceTab === "sources";
  const s =
    (isSource ? db.ai_source_links : db.ai_discovery_queries).find(
      (s) => s.id === Number(id),
    ) || {};
  ui.editId = s.id || null;
  let historyLogs = "";
  if (s.id && isSource) {
    const attempts = db.ai_crawl_attempts.filter(
      (a) => a.source_link_id === s.id,
    );
    const attemptHtml = attempts.length
      ? table(
          ["Run ID", "Time", "Status", "HTTP Code", "Message"],
          attempts.map((a) =>
            row([
              a.pipeline_run_id,
              stamp(a.started_at),
              pill(
                a.status,
                a.status === "failed"
                  ? "red"
                  : a.status === "success"
                    ? "green"
                    : "",
              ),
              a.http_status,
              esc(a.error_message || "—"),
            ]),
          ),
        )
      : empty("Chưa có lịch sử cào cho URL này.");
    historyLogs = `<div class="divider"></div><h3>Lịch sử cào (Crawl Logs)</h3>${attemptHtml}`;
  }
  dialog(
    "source",
    `${s.id ? "Edit" : "Add"} ${isSource ? "crawler source" : "discovery keyword"}`,
    isSource
      ? `<div class="form-grid">${field("source_code", "Source name (Alias) *", s.source_code, "text", 'required maxlength="50"')}${select(
          "provider",
          "Source Origin (Type) *",
          [
            ["admin", "Admin"],
            ["dancer", "Dancer"],
            ["ai_keyword", "Keyword"],
          ],
          s.provider || "admin",
        )}<div class="full">${field("url", "Public source URL *", s.url, "url", "required")}</div>${field("region", "Region (Auto-tracked)", getRegionForCountry(s.country || "JP") || "Global", "text", "readonly disabled")}${select("country", "Country", queryCountries, s.country || "JP")}${select("city", "City", getCitiesForCountry(s.country || "JP"), s.city || "Tokyo")}${field("priority", "Priority (1 highest, 5 lowest)", s.priority || 3, "number", 'min="1" max="5" required')}</div>${area("notes", "Notes", s.notes)}<label class="check-row"><input type="checkbox" name="enabled" ${s.enabled !== false ? "checked" : ""}>Enabled for crawling</label>${historyLogs}`
      : `${field("keyword", "Search keyword *", s.keyword, "text", 'required maxlength="200"')}<div class="form-grid">${select("region", "Region", queryRegions, s.region ?? "", 'multiple size="4"')}${select("country", "Country", getCountriesForRegion(s.region), s.country ?? "", 'multiple size="4"')}${select("city", "City", getCitiesForCountry(s.country), s.city ?? "", 'multiple size="4"')}</div><label class="check-row"><input type="checkbox" name="enabled" ${s.enabled !== false ? "checked" : ""}>Enabled for discovery</label>`,
    "Save",
    "",
    "drawer",
  );
}
function jobDrawer(id) {
  const o = job(id);
  ui.editId = o.id;
  const c = o.compensation || {};
  const source = db.ai_source_links.find((s) => s.id === o.source_link_id);
  const raw = db.ai_raw_pages.find((r) => r.id === o.raw_page_id);
  const provisional =
    o.status === "needs_review" &&
    (o.missing_fields.length ||
      new Date() - new Date(o.extracted_at) > 30 * 86400 * 1000);

  const matched = (db.ai_recommendations || []).filter(
    (r) => r.opportunity_id === ui.editId,
  );
  const applicationMethods = o.application_methods || [];
  const methodValue = (...types) =>
    applicationMethods.find((method) => types.includes(method.type))?.value ||
    "";

  const leftCol = `
    <fieldset ${!editable() ? "disabled" : ""} style="border:0;padding:0;margin:0">
      <div class="form-grid">
        <h3 style="grid-column:1/-1; margin:0 0 12px; border-bottom:1px solid var(--line); padding-bottom:8px; color:var(--ink); font-size:14px;">1. Trạng thái & Cơ bản</h3>
        ${select("status", "Trạng thái Job (Status)", statuses, o.status)}
        ${field("opportunity_type", "Opportunity type (Extracted)", o.opportunity_type, "text")}
        <div class="full" ${!o.title ? 'style="border:2px solid red;padding:5px;border-radius:4px"' : ""}>
          ${!o.title ? '<span style="color:red;font-size:12px;font-weight:bold">⚠️ THIẾU BẮT BUỘC</span>' : ""}
          ${field("title", "Job title *", o.title, "text", "required")}
        </div>
        <div ${!o.organization ? 'style="border:2px solid red;padding:5px;border-radius:4px"' : ""}>
          ${!o.organization ? '<span style="color:red;font-size:12px;font-weight:bold">⚠️ THIẾU BẮT BUỘC</span>' : ""}
          ${field("organization", "Organization", o.organization)}
        </div>
        <div class="full">${field("dance_styles", "Dance styles (comma separated)", Array.isArray(o.dance_styles) ? o.dance_styles.join(", ") : o.dance_styles)}</div>
        
        <h3 style="grid-column:1/-1; margin:24px 0 12px; border-bottom:1px solid var(--line); padding-bottom:8px; color:var(--ink); font-size:14px;">2. Địa điểm & Nội dung</h3>
        <div ${!o.city ? 'style="border:2px solid red;padding:5px;border-radius:4px"' : ""}>
          ${!o.city ? '<span style="color:red;font-size:12px;font-weight:bold">⚠️ THIẾU BẮT BUỘC</span>' : ""}
          ${field("city", "City", o.city)}
        </div>
        ${field("country", "Country", o.country)}
        <div class="full">${field("google_maps_url", "Google Maps URL", `https://maps.google.com/?q=${encodeURIComponent(o.location_text || o.city || "")}`, "url", "readonly")}</div>
        <div class="full">${area("description", "Description *", o.description, "required")}</div>
        <div class="full">${area("requirements", "Yêu cầu công việc (Kinh nghiệm / Bằng cấp)", typeof o.requirements === "object" ? JSON.stringify(o.requirements, null, 2) : o.requirements || "")}</div>
        
        <h3 style="grid-column:1/-1; margin:24px 0 12px; border-bottom:1px solid var(--line); padding-bottom:8px; color:var(--ink); font-size:14px;">3. Quyền lợi & Thời gian</h3>
        <div class="full" style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:16px;">
          ${field("amount", "Compensation amount", c.amount ?? "", "number", 'min="0" step="0.01"')}
          ${select("currency", "Currency", ["USD", "SGD", "JPY", "VND"], c.currency || "USD")}
          ${select("unit", "Pay basis", ["project", "day", "hour", "month"], c.unit || "project")}
        </div>
        ${field("deadline", "Application deadline", o.deadline || "", "date")}
        <div style="display:flex; align-items:flex-end; padding-bottom:8px;">
          <label class="check-row" style="margin:0;"><input type="checkbox" name="is_perpetual" ${o.is_perpetual ? "checked" : ""}> Tuyển vô thời hạn (Bỏ qua mốc 30 ngày)</label>
        </div>
        ${field("event_start_date", "Event start date", o.event_start_date || "", "date")}
        ${field("event_end_date", "Event end date", o.event_end_date || "", "date")}
        
        <h3 class="job-form-section-title">4. Application & contact methods</h3>
        <div class="full source-reference">
          <div>
            <strong>Original source</strong>
            <small>Used by Admin to verify the extracted job and application instructions.</small>
          </div>
          <a href="${esc(o.raw_url)}" target="_blank" rel="noopener">${icon("arrow-square-out")} Open source</a>
        </div>
        <div class="full application-fields-note">Fill only the methods stated in the source. All fields are optional.</div>
        <div class="full">${field("online_form_url", "Online application form URL", methodValue("online_form") || o.application_url || "", "url")}</div>
        <div class="full">${field("career_portal_url", "Career portal / platform application URL", methodValue("career_portal", "platform_profile"), "url")}</div>
        ${field("application_email", "Application email", methodValue("email") || o.contact_email || "", "email")}
        ${field("application_phone", "Application phone / SMS", methodValue("phone") || o.contact_phone || "", "tel")}
        ${field("whatsapp", "WhatsApp number or link", methodValue("whatsapp"))}
        ${field("instagram", "Instagram profile / DM", methodValue("instagram_dm"))}
        ${field("facebook", "Facebook page / Messenger", methodValue("facebook_messenger"))}
        ${field("in_person", "In-person / open-call details", methodValue("in_person"))}
        <div class="full">${field("other_application_method", "Other application method", methodValue("other"))}</div>
        <div class="full">${area("application_instructions", "Application instructions", o.application_instructions || "", 'placeholder="For example: send your CV and dance reel via WhatsApp, or complete the form before the deadline."')}</div>
      </div>
    </fieldset>
  `;

  const rightCol = `
    <div style="border:1px solid #e5e7eb; padding:16px; border-radius:8px; background:#fff; margin-bottom: 24px; box-shadow:0 1px 3px rgba(0,0,0,0.02);">
      <h4 style="margin:0 0 12px; font-size:14px; font-weight:600; color:var(--ink);">Bằng chứng cào & Điểm số</h4>
      ${kv([
        ["Source", source?.source_code],
        ["Raw page ID", o.raw_page_id],
        ["Extraction attempt ID", o.extraction_attempt_id],
        ["Trục 1 (Thông tin)", (o.completeness_score * 10).toFixed(1) + "/10đ"],
        ["Trục 2 (Tin cậy)", (o.confidence * 10).toFixed(1) + "/10đ"],
        ["Missing fields", o.missing_fields.join(", ") || "None"],
        ["Extracted at", stamp(o.extracted_at)],
      ])}
      <details style="margin-top:12px;">
        <summary style="font-size:12px; color:var(--blue); cursor:pointer;">Captured source text</summary>
        <pre class="raw" style="margin-top:8px;">${esc(raw?.text || "Not available")}</pre>
      </details>
      <details style="margin-top:8px;">
        <summary style="font-size:12px; color:var(--blue); cursor:pointer;">Extracted JSON record</summary>
        <pre class="raw" style="margin-top:8px;">${esc(JSON.stringify(o, null, 2))}</pre>
      </details>
    </div>
    <div style="border:1px solid #e5e7eb; padding:16px; border-radius:8px; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,0.02);">
      <h4 style="margin:0 0 12px; font-size:14px; font-weight:600; color:var(--ink);">Dancer đề xuất (AI Match) (${matched.length})</h4>
      ${
        matched.length
          ? `<table class="basic-table" style="width:100%; font-size:12px; border-collapse:collapse; border:1px solid #e5e7eb;">
        <thead style="background:#f3f4f6; text-align:left;">
          <tr><th style="padding:6px; border-bottom:1px solid #e5e7eb;">Dancer</th><th style="padding:6px; border-bottom:1px solid #e5e7eb;">Match</th><th style="padding:6px; border-bottom:1px solid #e5e7eb;">Action</th></tr>
        </thead>
        <tbody>
          ${matched.map((r) => `<tr><td style="padding:6px; border-bottom:1px solid #e5e7eb; font-weight:500;">#${r.dancer_id}</td><td style="padding:6px; border-bottom:1px solid #e5e7eb;">${Math.round(r.final_score * 100)}%</td><td style="padding:6px; border-bottom:1px solid #e5e7eb;">${pill(r.status)}</td></tr>`).join("")}
        </tbody>
      </table>`
          : `<div style="font-size:12px; color:#6b7280; padding:12px; background:#f9fafb; border-radius:4px; text-align:center;">Không có Dancer đề xuất cho Job này.</div>`
      }
    </div>
  `;

  dialog(
    "edit-job",
    `Chi tiết Công việc (Job #${o.id})`,
    `
  <div class="actions">
    ${pill(statuses.find((s) => s[0] === o.status)?.[1] || o.status, o.status === "closed" ? "red" : o.status === "suspended" ? "amber" : o.status === "needs_review" ? "amber" : "green")}
    ${provisional ? '<span class="pill amber">⚠️ Điểm tạm</span>' : ""}
  </div>
  <div class="divider"></div>
  <div style="display:flex; flex-direction:column; gap: 32px; padding-bottom: 24px;">
    <div>${leftCol}</div>
    <div style="border-top:2px solid var(--line); padding-top:24px;">
      <h3 style="margin-bottom:16px; font-size:16px; color:var(--ink);">Thông tin phân tích & Ứng viên</h3>
      <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap: 24px;">
        ${rightCol}
      </div>
    </div>
  </div>`,
    "Save changes",
    "",
    "drawer",
  );
}
function reportDialog(id) {
  const o = job(id);
  ui.job = o.id;
  dialog(
    "report",
    "Report this job",
    `<p><strong>${esc(o.title)}</strong></p><div class="divider"></div>${select("reason", "Reason *", ["Broken link", "Incorrect compensation", "Spam or scam", "Other"], "Broken link")}${area("note", "Additional details", "", 'maxlength="1000"')}`,
    "Submit report",
  );
}
function moderationDialog(id) {
  const r = ext().reports.find((r) => r.id === Number(id)),
    o = job(r.opportunity_id);
  ui.reportId = r.id;
  dialog(
    "moderation",
    `Review report #${r.id}`,
    `<h3>${esc(o.title)}</h3><p class="muted compact">${esc(o.organization)} · Job #${o.id}</p><div class="notice">${esc(r.reason)}<br>${esc(r.note)}</div>${external(o.raw_url, "Open original listing")}<div class="divider"></div><div class="form-grid">${field("title", "Corrected title *", o.title, "text", "required")}${field("amount", "Compensation amount", o.compensation?.amount ?? "", "number", 'min="0" step="0.01"')}${select("currency", "Currency", ["USD", "SGD", "JPY"], o.compensation?.currency || "USD")}${select("unit", "Pay basis", ["project", "day", "hour"], o.compensation?.unit || "project")}${field("deadline", "Deadline", o.deadline, "date")}</div>${select(
      "action",
      "Resolution",
      [
        ["correct", "Save correction & restore job"],
        ["hide", "Hide this job"],
        ["remove", "Remove this job from the feed"],
        ["dismiss", "Dismiss report & restore job"],
      ],
      ext().moderation[o.id] ? "dismiss" : "correct",
    )}${area("resolution_note", "Review note *", "", 'required maxlength="1000"')}`,
    "Confirm resolution",
  );
}
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    toast("Clipboard unavailable. Select and copy the text manually.");
    return false;
  }
}
function shareDialog() {
  const url = new URL(location.href);
  url.hash = "job=" + ui.job;
  dialog(
    "share",
    "Share opportunity",
    `${field("share_url", "Job link", url.href, "text", "readonly")}<div class="notice">This local prototype link opens on this computer. Production app-link routing requires integration.</div>`,
    "",
    btn("copy-link", icon("copy") + "Copy link"),
    "sheet",
  );
}
async function crawl(ids) {
  if (!editable() || ui.running) return;
  const sources = db.ai_source_links.filter(
    (s) => s.enabled && (!ids || ids.includes(s.id)),
  );
  if (!sources.length) {
    toast("No enabled sources to crawl.");
    return;
  }
  ui.running = true;
  const run = {
    id: Date.now(),
    name: "Manual crawl",
    pipeline_type: "ingestion",
    trigger_type: "manual",
    status: "running",
    started_at: now(),
    finished_at: null,
    total_sources: sources.length,
    total_raw_pages: 0,
    total_opportunities: 0,
    total_recommendations: 0,
    error_message: null,
  };
  db.ai_pipeline_runs.unshift(run);
  sources.forEach((s) => (s.crawl_status = "crawling"));
  persist();
  render();
  await new Promise((r) => setTimeout(r, 600));
  let failures = 0;
  for (const s of sources) {
    const started = now();
    s.crawl_count = (s.crawl_count || 0) + 1;
    s.last_crawled_at = now();
    const attempt = {
      id: Date.now() + s.id,
      source_link_id: s.id,
      pipeline_run_id: run.id,
      status: "success",
      started_at: started,
      finished_at: now(),
      requested_url: s.url,
      final_url: s.url,
      http_status: 200,
      was_content_changed: false,
    };
    if (s.id === 2 && s.crawl_count === 2) {
      s.crawl_status = "failed";
      s.last_http_status = 503;
      s.error_message = "Source temporarily unavailable. Retry later.";
      s.failed_count++;
      failures++;
      Object.assign(attempt, {
        status: "failed",
        http_status: 503,
        error_message: s.error_message,
      });
    } else {
      const existing = db.ai_opportunities.find(
        (o) => o.source_link_id === s.id,
      );
      s.crawl_status = existing ? "unchanged" : "success";
      s.last_http_status = 200;
      s.error_message = null;
      attempt.status = s.crawl_status;
      if (existing) {
        s.unchanged_count++;
      } else {
        const id = Math.max(...db.ai_opportunities.map((o) => o.id)) + 1;
        const raw = {
          id: Date.now() + s.id + 10,
          source_link_id: s.id,
          crawl_attempt_id: attempt.id,
          url: s.url,
          final_url: s.url,
          title: "New opportunity",
          text: "Sample source content awaiting full data review.",
          content_hash: s.normalized_url,
          status_code: 200,
          scraped_at: now(),
        };
        db.ai_raw_pages.push(raw);
        const extraction = {
          id: raw.id + 100,
          raw_page_id: raw.id,
          pipeline_run_id: run.id,
          status: "success",
          started_at: now(),
          finished_at: now(),
          model: "sample-extractor",
          input_token_count: 0,
          output_token_count: 0,
          opportunities_count: 1,
        };
        db.ai_extraction_attempts.push(extraction);
        db.ai_opportunities.push({
          id,
          source_link_id: s.id,
          raw_page_id: raw.id,
          extraction_attempt_id: extraction.id,
          canonical_key: s.normalized_url,
          title: "New dance opportunity · " + s.city,
          organization: null,
          opportunity_type: "audition",
          description: raw.text,
          dance_styles: [],
          city: s.city,
          country: s.country,
          requirements: {},
          compensation: null,
          application_url: s.url,
          raw_url: s.url,
          deadline: null,
          event_start_date: null,
          event_end_date: null,
          status: "pending",
          confidence: 0.5,
          completeness_score: 0.35,
          missing_fields: ["organization", "compensation", "deadline"],
          first_seen_at: now(),
          last_seen_at: now(),
          extracted_at: now(),
        });
        run.total_raw_pages++;
        run.total_opportunities++;
        attempt.was_content_changed = true;
      }
    }
    db.ai_crawl_attempts.unshift(attempt);
  }
  run.status =
    failures === sources.length
      ? "failed"
      : failures
        ? "partial_success"
        : "success";
  run.finished_at = now();
  run.error_message = failures
    ? `${failures} source failed; remaining sources processed.`
    : null;
  ui.running = false;
  rebuildRecommendations();
  audit("crawl completed", run.id);
  render();
  toast(
    failures
      ? "Crawl completed with source errors. Review the run details."
      : `Crawl complete: ${run.total_opportunities} new jobs; unchanged content skipped.`,
  );
}
function approveSource(id) {
  const community = ui.queueTab === "community";
  const s = (
    community ? ext().submissions : db.ai_discovered_source_candidates
  ).find((s) => s.id === Number(id));
  if (!s || s.status !== "pending_review") return;
  const existing = db.ai_source_links.find(
    (x) => x.normalized_url === s.normalized_url,
  );
  if (existing) {
    s.status = "duplicate";
    s.reason = "Already configured as source #" + existing.id;
  } else {
    const sourceId = Math.max(...db.ai_source_links.map((s) => s.id)) + 1;
    db.ai_source_links.push({
      id: sourceId,
      source_code: "APPROVED_" + sourceId,
      provider: community ? "community" : s.provider,
      url: s.url,
      normalized_url: s.normalized_url,
      country: s.country || "Japan",
      city: s.city || "Tokyo",
      priority: 3,
      enabled: true,
      crawl_status: "pending",
      last_crawled_at: null,
      next_crawl_at: null,
      last_http_status: null,
      error_message: null,
      notes: s.note || s.snippet || "",
      crawl_count: 0,
      failed_count: 0,
      unchanged_count: 0,
    });
    s.status = "approved";
    s.approved_source_link_id = sourceId;
  }
  audit("source reviewed", s.id);
  render();
  toast(
    s.status === "approved"
      ? "Source approved. Crawl it before a job appears in the pipeline."
      : "Duplicate source detected.",
  );
}
function route() {
  const match = location.hash.match(/^#job=(\d+)$/);
  if (match) showJob(Number(match[1]));
}
function preserveFocusRender(id) {
  const e = document.getElementById(id),
    pos = e?.selectionStart;
  render();
  const n = document.getElementById(id);
  n?.focus();
  try {
    if (pos != null) n?.setSelectionRange(pos, pos);
  } catch {}
}
const cmsMutations = new Set([
  "crawl",
  "crawl-one",
  "source-edit",
  "approve",
  "reject",
  "discover",
  "suspend",
  "save-schedule",
]);
document.addEventListener("click", async (event) => {
  const b = event.target.closest("[data-action], [data-page-for]");
  if (!b || b.disabled) return;
  event.preventDefault();
  if (b.dataset.pageFor) {
    ui.pagination = ui.pagination || {};
    ui.pagination[b.dataset.pageFor] = ui.pagination[b.dataset.pageFor] || {
      page: 1,
      limit: 10,
    };
    ui.pagination[b.dataset.pageFor].page = parseInt(b.dataset.page);
    render();
    return;
  }
  const a = b.dataset.action,
    v = b.dataset.value;
  if (ui.mode === "cms" && cmsMutations.has(a) && !editable()) {
    toast("Read-only access.");
    return;
  }
  if (
    ui.mode === "dancer" &&
    !["mode", "reset", "age", "close", "sign-in"].includes(a) &&
    !ensureAccess()
  )
    return;
  if (
    ["mode", "mobile", "cms"].includes(a) &&
    ui.dirty &&
    !confirm("Discard unsaved changes?")
  )
    return;
  if (a === "mode") {
    closeDialog(true);
    ui.dirty = false;
    ui.mode = v;
    ui.search = "";
    ui.status = "";
    render();
    if (
      v === "dancer" &&
      !ui.guest &&
      !ext().agentSuspensions[dancer().id] &&
      !ageAllowed()
    )
      openAge();
  } else if (a === "cms") {
    ui.cms = v;
    ui.search = "";
    ui.status = "";
    if (v === "operations") ui.metrics = null;
    render();
  } else if (a === "mobile") {
    ui.mobile = v;
    ui.dirty = false;
    render();
  } else if (a === "sign-in") {
    ui.guest = false;
    render();
    openAge();
  } else if (a === "age") openAge();
  else if (a === "close") closeDialog();
  else if (a === "job") showJob(v);
  else if (a === "save-job") {
    history(v).saved = !history(v).saved;
    audit("bookmark changed", v);
    render();
  } else if (a === "filters") openFilters();
  else if (a === "reset-filters") {
    ui.filters = { city: "", type: "", radius: null, duration: 365, min: 0 };
    ui.feedSearch = "";
    closeDialog(true);
    render();
  } else if (a === "hub") {
    ui.hub = v;
    render();
  } else if (a === "pitch") openPitch(v);
  else if (a === "pitch-lang") {
    captureDraft();
    openPitch(ui.job, v);
  } else if (a === "go-profile") {
    closeDialog(true);
    ui.mobile = "profile";
    render();
  } else if (a === "copy-draft") {
    if (!$("#dialog-form").reportValidity()) return;
    captureDraft();
    if (await copyText(history(ui.job).drafts[ui.lang])) {
      history(ui.job).copied_at = now();
      audit("draft copied", ui.job);
      toast("Draft copied. Submit it through the original listing.");
    }
  } else if (a === "applied") {
    const h = history(v);
    if (!h.applied_at && !available(job(v))) return;
    h.applied_at = h.applied_at ? null : now();
    audit("self-reported application changed", v);
    render();
    toast(
      h.applied_at ? "Marked as applied by you." : "Applied status removed.",
    );
  } else if (a === "share") shareDialog();
  else if (a === "preview-alert") {
    if (!dancer().availibility || !ext().push.enabled) {
      toast("Matched-job alerts are paused in your preferences.");
      return;
    }
    const target = available(job(102))
      ? job(102)
      : db.ai_opportunities.find(available);
    if (!target) {
      toast("No available job for the alert preview.");
      return;
    }
    ui.alertJob = target.id;
    render();
  } else if (a === "open-alert") {
    ui.alertJob = null;
    showJob(v);
  } else if (a === "copy-link") {
    if (await copyText($("#dialog-form [name=share_url]").value))
      toast("Link copied.");
  } else if (a === "report") reportDialog(v);
  else if (a === "source-tab") {
    ui.sourceTab = v;
    ui.search = "";
    render();
  } else if (a === "queue-tab") {
    ui.queueTab = v;
    ui.search = "";
    ui.status = "";
    render();
  } else if (a === "source-edit") sourceDialog(v);
  else if (a === "job-drawer") jobDrawer(v);
  else if (a === "view-user-jobs") {
    const [id, kind] = v.split("|");
    ui.cmsDancerId = kind === "prospect" ? id : Number(id);
    ui.cmsUserKind = kind;
    ui.cmsUserTab = "jobs";
    render();
  } else if (a === "user-list") {
    ui.cmsDancerId = null;
    ui.cmsUserKind = null;
    ui.cmsUserTab = "jobs";
    render();
  } else if (a === "add-prospect") {
    dialog(
      "add-prospect",
      "Add new prospect",
      `<div class="form-grid">${field("name", "Name *", "", "text", "required")}${field("email", "Email", "", "email")}${field("phone", "Phone number", "", "tel")}${field("location", "City / country")}${field("source", "Lead source")}${field("notes", "Notes")}</div><small>A prospect can be linked to jobs before a Hammer account exists.</small>`,
      "Create prospect",
    );
  } else if (a === "link-prospect") {
    toast("Prototype: select an existing CMS user to preserve and transfer this prospect's job history.");
  } else if (a === "invite-prospect") {
    toast("Invitation prepared for this prospect.");
  } else if (a === "edit-user") {
    toast("Use the existing CMS User Edit screen for account details.");
  }
  else if (a === "crawl") await crawl();
  else if (a === "crawl-one") {
    if (confirm("Bạn có chắc chắn muốn cào thử nguồn này ngay lập tức?"))
      await crawl([Number(v)]);
  } else if (a === "delete-source") {
    if (confirm("Bạn có chắc chắn muốn xóa (ẩn) nguồn này khỏi danh sách?")) {
      const s = db.ai_source_links.find((x) => x.id === Number(v));
      if (s) s.is_deleted = true;
      render();
    }
  } else if (a === "crawl-selected") await confirmSourceCrawl(false);
  else if (a === "search-selected") await searchKeywords(false);
  else if (a === "search-all-keywords") await searchKeywords(true);
  else if (a === "clear-keyword-selection") {
    if (ui.discoveryRunning) return;
    selectedKeywords.clear();
    render();
  } else if (a === "crawl-all-sources") await confirmSourceCrawl(true);
  else if (a === "clear-source-selection") {
    if (ui.running) return;
    selectedSources.clear();
    render();
  } else if (a === "quick-approve") {
    const j = db.ai_opportunities.find((o) => o.id === Number(v));
    if (j) {
      j.status = "published";
      rebuildRecommendations();
      render();
      toast("Đã duyệt Job");
    }
  } else if (a === "quick-suspend") {
    if (confirm("Bạn có chắc chắn muốn tạm ẩn Job này không?")) {
      const j = db.ai_opportunities.find((o) => o.id === Number(v));
      if (j) {
        j.status = "suspended";
        rebuildRecommendations();
        render();
        toast("Đã tạm ẩn Job");
      }
    }
  } else if (a === "quick-delete") {
    if (confirm("Bạn có chắc chắn muốn xóa (ẩn) Job này khỏi hệ thống?")) {
      const j = db.ai_opportunities.find((o) => o.id === Number(v));
      if (j) {
        j.is_deleted = true;
        rebuildRecommendations();
        render();
        toast("Đã xóa Job");
      }
    }
  } else if (a === "bulk-job-approve") {
    const selected = db.ai_opportunities.filter((o) => selectedJobs.has(o.id));
    if (selected.length) {
      selected.forEach((j) => (j.status = "published"));
      selectedJobs.clear();
      rebuildRecommendations();
      render();
      toast("Đã duyệt các Job được chọn");
    }
  } else if (a === "bulk-job-suspend") {
    if (
      confirm(
        `Bạn có chắc chắn muốn tạm ẩn ${selectedJobs.size} Job đang chọn không?`,
      )
    ) {
      const selected = db.ai_opportunities.filter((o) =>
        selectedJobs.has(o.id),
      );
      if (selected.length) {
        selected.forEach((j) => (j.status = "suspended"));
        selectedJobs.clear();
        rebuildRecommendations();
        render();
        toast("Đã tạm ẩn các Job được chọn");
      }
    }
  } else if (a === "bulk-job-delete") {
    if (
      confirm(
        `Bạn có chắc chắn muốn xóa ${selectedJobs.size} Job khỏi hệ thống không?`,
      )
    ) {
      const selected = db.ai_opportunities.filter((o) =>
        selectedJobs.has(o.id),
      );
      if (selected.length) {
        selected.forEach((j) => (j.is_deleted = true));
        selectedJobs.clear();
        rebuildRecommendations();
        render();
        toast("Đã xóa các Job được chọn");
      }
    }
  } else if (a === "clear-job-selection") {
    selectedJobs.clear();
    render();
  } else if (a === "apply-job-filters") {
    const getMulti = (id) =>
      Array.from(
        document.querySelectorAll(`input[data-multi-parent="${id}"]:checked`),
      )
        .map((cb) => cb.value)
        .join(",");
    ui.jobF = {
      q: $("#job-search")?.value || "",
      time: $("#job-time")?.value || "all",
      status: getMulti("job-status"),
      country: getMulti("job-country"),
      city: getMulti("job-city"),
      style: getMulti("job-style"),
      reported: getMulti("job-reported"),
    };
    render();
  } else if (a === "apply-kw-filters") {
    const getMulti = (id) =>
      Array.from(document.getElementById(id)?.selectedOptions || [])
        .map((o) => o.value)
        .join(",");
    ui.kwF = {
      q: $("#kw-search")?.value || "",
      time: $("#kw-time")?.value || "today",
      region: getMulti("kw-region"),
      country: getMulti("kw-country"),
      city: getMulti("kw-city"),
      status: $("#kw-status")?.value || "",
    };
    if (ui.pagination && ui.pagination.keywords)
      ui.pagination.keywords.page = 1;
    render();
  } else if (a === "apply-src-filters") {
    const getMulti = (id) =>
      Array.from(document.getElementById(id)?.selectedOptions || [])
        .map((o) => o.value)
        .join(",");
    ui.srcF = {
      q: $("#src-search")?.value || "",
      time: $("#src-time")?.value || "today",
      provider: getMulti("src-provider"),
      region: getMulti("src-region"),
      country: getMulti("src-country"),
      city: getMulti("src-city"),
      status: $("#src-status")?.value || "",
    };
    if (ui.pagination && ui.pagination.sources) ui.pagination.sources.page = 1;
    render();
  } else if (a === "toggle-run-results") {
    const tr = document.getElementById("run-results-" + v);
    if (tr)
      tr.style.display = tr.style.display === "none" ? "table-row" : "none";
  } else if (a === "suspend") {
    ui.suspendId = Number(v);
    dialog(
      "suspend",
      ext().agentSuspensions[v]
        ? "Restore Job Agent access"
        : "Suspend Job Agent access",
      `<p>This affects Job Agent only. Existing Hammer classes and wallet access are unchanged.</p>${area("reason", "Reason *", "", "required")}`,
      "Confirm",
    );
  } else if (a === "moderate") moderationDialog(v);
  else if (a === "refresh-metrics") {
    ui.metrics = metrics();
    render();
    toast("Summary refreshed.");
  } else if (a === "save-schedule") $("#schedule-form").requestSubmit();
  else if (a === "reset") {
    if (!confirm("Reset all sample data on this computer?")) return;
    db = HammerSeed();
    persist();
    location.hash = "";
    location.reload();
  }
});
document.addEventListener("input", (event) => {
  const t = event.target;
  if (t.dataset.output) {
    document.getElementById(t.dataset.output).textContent =
      t.value + (t.dataset.unit || "");
  }
  if (t.id === "cms-search") {
    ui.search = t.value;
    preserveFocusRender(t.id);
  } else if (t.id === "feed-search") {
    ui.feedSearch = t.value;
    preserveFocusRender(t.id);
  } else if (t.closest("#profile-form,#dialog-form")) ui.dirty = true;
});
document.addEventListener("change", (event) => {
  const t = event.target;
  if (t.dataset.limitFor) {
    ui.pagination = ui.pagination || {};
    ui.pagination[t.dataset.limitFor] = ui.pagination[t.dataset.limitFor] || {
      page: 1,
      limit: 10,
    };
    ui.pagination[t.dataset.limitFor].limit = parseInt(t.value);
    ui.pagination[t.dataset.limitFor].page = 1;
    render();
    return;
  }
  if (
    t.hasAttribute("data-select-keywords-visible") ||
    t.hasAttribute("data-select-keyword")
  ) {
    if (!editable() || ui.discoveryRunning) {
      render();
      return;
    }
    const list = db.ai_discovery_queries.filter(
      (q) =>
        q.enabled &&
        (t.hasAttribute("data-select-keywords-visible")
          ? !ui.search ||
            JSON.stringify(q).toLowerCase().includes(ui.search.toLowerCase())
          : q.id === Number(t.dataset.selectKeyword)),
    );
    for (const q of list) {
      if (t.checked) selectedKeywords.add(q.id);
      else selectedKeywords.delete(q.id);
    }
    render();
    return;
  }
  if (
    t.hasAttribute("data-select-visible") ||
    t.hasAttribute("data-select-source")
  ) {
    if (!editable() || ui.running) {
      render();
      return;
    }
    const sources = t.hasAttribute("data-select-visible")
      ? visibleSources()
      : db.ai_source_links.filter(
          (s) => s.id === Number(t.dataset.selectSource),
        );
    for (const s of sources.filter((s) => s.enabled)) {
      if (t.checked) selectedSources.add(s.id);
      else selectedSources.delete(s.id);
    }
    render();
    return;
  }
  if (
    t.hasAttribute("data-select-jobs-visible") ||
    t.hasAttribute("data-select-job")
  ) {
    if (!editable()) {
      render();
      return;
    }
    if (t.hasAttribute("data-select-jobs-visible")) {
      document.querySelectorAll("input[data-select-job]").forEach((cb) => {
        const id = Number(cb.dataset.selectJob);
        if (t.checked) selectedJobs.add(id);
        else selectedJobs.delete(id);
      });
    } else {
      const id = Number(t.dataset.selectJob);
      if (t.checked) selectedJobs.add(id);
      else selectedJobs.delete(id);
    }
    render();
    return;
  }
  if (
    t.name === "region" &&
    t.closest("#dialog-form") &&
    ui.sourceTab === "keywords" &&
    t.form?.dataset.kind === "source"
  ) {
    const country = $("#dialog-form [name=country]"),
      city = $("#dialog-form [name=city]");
    const vals = Array.from(t.selectedOptions)
      .map((o) => o.value)
      .join(",");
    if (country) country.innerHTML = options(getCountriesForRegion(vals), "");
    if (city) city.innerHTML = options(getCitiesForCountry(""), "");
  }
  if (
    t.name === "country" &&
    t.closest("#dialog-form") &&
    ui.sourceTab === "keywords" &&
    t.form?.dataset.kind === "source"
  ) {
    const city = $("#dialog-form [name=city]"),
      regSelect = $("#dialog-form [name=region]");
    const vals = Array.from(t.selectedOptions)
      .map((o) => o.value)
      .join(",");
    if (city) city.innerHTML = options(getCitiesForCountry(vals), "");
    if (vals && regSelect) {
      const inferred = getRegionForCountry(vals);
      if (inferred && regSelect.value !== inferred) {
        const infArr = inferred.split(",");
        for (const opt of regSelect.options)
          opt.selected = infArr.includes(opt.value);
        t.innerHTML = options(getCountriesForRegion(inferred), vals);
      }
    }
  }
  if (t.dataset.multiParent) {
    const id = t.dataset.multiParent;
    const getM = (pid) =>
      Array.from(
        document.querySelectorAll(`input[data-multi-parent="${pid}"]:checked`),
      )
        .map((cb) => cb.value)
        .join(",");
    const vals = getM(id);
    const num = document.querySelectorAll(
      `input[data-multi-parent="${id}"]:checked`,
    ).length;
    const wrapper = document.getElementById(id + "-wrapper");
    if (wrapper) {
      const btnSpan = wrapper.querySelector("button span");
      if (num === 0)
        btnSpan.textContent =
          id === "kw-region"
            ? "All regions"
            : id === "kw-country"
              ? "All countries"
              : "All cities";
      else if (num === 1)
        btnSpan.textContent = wrapper
          .querySelector("input:checked")
          .nextSibling.textContent.trim();
      else btnSpan.textContent = num + " selected";
    }
    if (id === "kw-region") {
      const ctryWrapper = document.getElementById("kw-country-wrapper");
      if (ctryWrapper)
        ctryWrapper.outerHTML = multiSelect(
          "kw-country",
          "All countries",
          getCountriesForRegion(vals),
          "",
        );
    }
    if (id === "kw-country") {
      const cityWrapper = document.getElementById("kw-city-wrapper");
      if (cityWrapper)
        cityWrapper.outerHTML = multiSelect(
          "kw-city",
          "All cities",
          getCitiesForCountry(vals),
          "",
        );
    }
  }
  if (t.id === "preview-role") {
    if (ui.dirty && !confirm("Discard unsaved changes?")) {
      render();
      return;
    }
    closeDialog(true);
    if (ui.mode === "cms") ui.role = t.value;
    else ui.guest = t.value === "guest";
    render();
    // auto popup disabled for inline age gate
  } else if (t.id === "cms-status") {
    ui.status = t.value;
    render();
  } else if (t.dataset.sourceToggle) {
    if (!editable() || ui.running) {
      render();
      return;
    }
    const s = db.ai_source_links.find((s) => s.id === +t.dataset.sourceToggle);
    s.enabled = t.checked;
    if (t.checked) s.crawl_status = "pending";
    audit("source enabled changed", s.id);
    render();
  } else if (t.dataset.queryToggle) {
    if (!editable() || ui.discoveryRunning) {
      render();
      return;
    }
    const q = db.ai_discovery_queries.find(
      (q) => q.id === +t.dataset.queryToggle,
    );
    q.enabled = t.checked;
    q.updated_at = now();
    if (!q.enabled) selectedKeywords.delete(q.id);
    audit("keyword enabled changed", q.id);
    render();
  } else if (t.id === "open-to-work") {
    if (!ensureAccess()) return;
    dancer().availibility = t.checked;
    audit("availability changed", dancer().id);
    render();
  }
});
document.addEventListener("submit", (event) => {
  event.preventDefault();
  const f = event.target;
  if (!f.reportValidity()) return;
  const fd = new FormData(f);
  const v = Object.fromEntries(fd);
  for (const el of f.querySelectorAll("select[multiple]"))
    v[el.name] = fd.getAll(el.name).join(",");
  const kind = f.dataset.kind;
  if (ui.mode === "cms" && !editable()) {
    toast("Read-only access.");
    return;
  }
  if (ui.mode === "dancer" && kind !== "age" && !ensureAccess()) return;
  if (kind === "add-prospect") {
    const prospects = cmsProspects();
    const nextNumber = Math.max(0, ...prospects.map((item) => Number(String(item.id).replace("P-", "")) || 0)) + 1;
    prospects.unshift({
      id: `P-${String(nextNumber).padStart(3, "0")}`,
      display_name: v.name.trim(),
      email: v.email || null,
      phone_number: v.phone || null,
      city: v.location || null,
      country: "",
      status: "New",
      source: v.source || "Admin entry",
      notes: v.notes || null,
      dance_styles: "",
    });
    persist();
    closeDialog(true);
    ui.cmsUsersView = "prospects";
    render();
    toast("Prospect created.");
  } else if (kind === "age") {
    const prev = ext().age;
    ext().age = { dob: v.dob, accepted_at: v.agreement ? now() : null };
    if (v.dob > today() || !ageAllowed()) {
      ext().age = prev;
      formError(
        "Job Agent is available only from your 18th birthday. Check your date of birth.",
      );
      return;
    }
    audit("age declared", dancer().id);
      persist();
    closeDialog(true);
    if (ui.pendingJob) showJob(ui.pendingJob);
    else render();
  } else if (kind === "filters") {
    ui.filters = {
      city: v.city,
      type: v.type,
      radius: v.limit_radius ? +v.radius : null,
      duration: +v.duration,
      min: +v.min,
    };
    closeDialog(true);
    render();
  } else if (kind === "pitch") {
    captureDraft();
    audit("draft saved", ui.job);
    closeDialog(true);
    render();
    toast("Draft saved for this job and language.");
  } else if (kind === "source") {
    const isSource = ui.sourceTab === "sources";
    const list = isSource ? db.ai_source_links : db.ai_discovery_queries;
    let item = list.find((s) => s.id === ui.editId);
    const normalized = isSource ? normalize(v.url) : null;
    if (!(isSource ? v.source_code : v.keyword).trim()) {
      formError(
        isSource ? "Source name is required." : "Search keyword is required.",
      );
      return;
    }
    if (isSource) {
        if (!normalized) {
          formError("Enter a valid public URL.");
          return;
        }
        const existing = list.find((s) => s.id !== ui.editId && (s.normalized_url === normalized || s.source_code.toLowerCase() === v.source_code.trim().toLowerCase()));
        if (existing) {
          dialog(
            "duplicate-conflict",
            "Duplicate Source",
            `<p style="margin-bottom:12px;">The source <strong>${esc(existing.source_code)}</strong> already exists.</p>
             <p style="color:var(--muted); font-size:13px;">Would you like to view its details?</p>
             <input type="hidden" name="target_id" value="${existing.id}">`,
            "View Details"
          );
          return;
        }
      }
      if (!isSource) {
        const existing = list.find((q) => q.id !== ui.editId && normalizeKeyword(q.keyword) === normalizeKeyword(v.keyword) && q.region === v.region && q.country === v.country && q.city === v.city);
        if (existing) {
          dialog(
            "duplicate-conflict",
            "Duplicate Keyword",
            `<p style="margin-bottom:12px;">The keyword <strong>${esc(existing.keyword)}</strong> already exists.</p>
             <p style="color:var(--muted); font-size:13px;">Would you like to view its details?</p>
             <input type="hidden" name="target_id" value="${existing.id}">`,
            "View Details"
          );
          return;
        }
      }
      const changes = isSource
      ? {
          source_code: v.source_code.trim(),
          provider: v.provider,
          url: normalized,
          normalized_url: normalized,
          country: v.country,
          city: v.city,
          priority: +v.priority,
          enabled: !!v.enabled,
          notes: v.notes,
        }
      : {
          keyword: v.keyword.trim(),
          normalized_keyword: normalizeKeyword(v.keyword),
          updated_at: now(),
          region: v.region,
          country: v.country,
          city: v.city,
          enabled: !!v.enabled,
        };
    if (!item) {
      item = {
        id: Math.max(0, ...list.map((s) => s.id)) + 1,
        ...(isSource
          ? {
              crawl_status: "pending",
              last_crawled_at: null,
              next_crawl_at: null,
              crawl_count: 0,
              failed_count: 0,
              unchanged_count: 0,
            }
          : { last_run_at: null, created_at: now() }),
      };
      list.push(item);
    }
    Object.assign(item, changes);
    audit("source configuration saved", item.id);
    closeDialog(true);
    render();
    toast("Configuration saved.");
  } else if (kind === "edit-job") {
    if (!v.title.trim() || !v.description.trim()) {
      formError("Job title and description are required.");
      return;
    }
    if (
      v.event_start_date &&
      v.event_end_date &&
      v.event_end_date < v.event_start_date
    ) {
      formError("End date must not be before the start date.");
      return;
    }
    if (
      (v.online_form_url && !normalize(v.online_form_url)) ||
      (v.career_portal_url && !normalize(v.career_portal_url))
    ) {
      formError("Enter valid HTTP(S) URLs for application links.");
      return;
    }
    const o = job(ui.editId);
    Object.assign(o, {
      title: v.title.trim(),
      organization: v.organization.trim() || null,
      opportunity_type: v.opportunity_type,
      status: v.status,
      dance_styles: v.dance_styles
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      description: v.description.trim(),
      city: v.city,
      country: v.country,
      compensation:
        v.amount === ""
          ? null
          : { amount: +v.amount, currency: v.currency, unit: v.unit },
      deadline: v.deadline || null,
      is_perpetual: !!v.is_perpetual,
      event_start_date: v.event_start_date || null,
      event_end_date: v.event_end_date || null,
      application_url: v.online_form_url || v.career_portal_url || null,
      contact_email: v.application_email || null,
      contact_phone: v.application_phone || null,
      application_instructions: v.application_instructions || null,
      application_methods: [
        ["online_form", v.online_form_url],
        ["career_portal", v.career_portal_url],
        ["email", v.application_email],
        ["phone", v.application_phone],
        ["whatsapp", v.whatsapp],
        ["instagram_dm", v.instagram],
        ["facebook_messenger", v.facebook],
        ["in_person", v.in_person],
        ["other", v.other_application_method],
      ]
        .filter(([, value]) => value)
        .map(([type, value]) => ({ type, value })),
      updated_at: now(),
    });
    rebuildRecommendations();
    audit("job corrected", o.id);
    closeDialog(true);
    render();
    toast("Job updated.");
  } else if (kind === "reject") {
    if (!v.reason.trim()) {
      formError("A rejection reason is required.");
      return;
    }
    const s = (
      ui.queueTab === "community"
        ? ext().submissions
        : db.ai_discovered_source_candidates
    ).find((s) => s.id === ui.rejectId);
    s.status = "rejected";
    s.reason = v.reason.trim();
    audit("source rejected", s.id);
    closeDialog(true);
    render();
  } else if (kind === "suspend") {
    if (!v.reason.trim()) {
      formError("A reason is required.");
      return;
    }
    ext().agentSuspensions[ui.suspendId] =
      !ext().agentSuspensions[ui.suspendId];
    audit("Agent access changed: " + v.reason, ui.suspendId);
    closeDialog(true);
    render();
  } else if (kind === "duplicate-conflict") {
      closeDialog(true);
      sourceDialog(Number(v.target_id));
    } else if (kind === "report") {
    if (
      ext().reports.some(
        (r) =>
          r.opportunity_id === ui.job &&
          r.dancer_id === dancer().id &&
          r.status === "pending",
      )
    ) {
      formError("You already have an open report for this job.");
      return;
    }
    ext().reports.push({
      id: Date.now(),
      opportunity_id: ui.job,
      dancer_id: dancer().id,
      reason: v.reason,
      note: v.note,
      status: "pending",
      created_at: now(),
    });
    audit("job reported", ui.job);
    closeDialog(true);
    toast("Report submitted for admin review.");
  } else if (kind === "moderation") {
    if (!v.title.trim() || !v.resolution_note.trim()) {
      formError("Job title and review note are required.");
      return;
    }
    const r = ext().reports.find((r) => r.id === ui.reportId),
      o = job(r.opportunity_id);
    if (v.action === "correct") {
      o.title = v.title.trim();
      o.compensation =
        v.amount === ""
          ? null
          : { amount: +v.amount, currency: v.currency, unit: v.unit };
      o.deadline = v.deadline || null;
    }
    if (["correct", "dismiss"].includes(v.action))
      delete ext().moderation[o.id];
    else ext().moderation[o.id] = v.action === "hide" ? "hidden" : "removed";
    r.status = "resolved";
    r.resolution = v.action;
    r.resolution_note = v.resolution_note;
    r.resolved_at = now();
    rebuildRecommendations();
    audit("report resolved: " + v.action, r.id);
    closeDialog(true);
    render();
    toast("Review recorded. Source settings were not changed.");
  } else if (f.id === "profile-form") {
    const error = $("#profile-error");
    if (
      !v.dance_styles.trim() ||
      (v.portfolio_url && !normalize(v.portfolio_url))
    ) {
      error.textContent =
        "Enter your dance styles and a valid public portfolio URL.";
      return;
    }
    if ((v.city === "Singapore") !== (v.country === "Singapore")) {
      error.textContent = "City and country do not match.";
      return;
    }
    Object.assign(dancer(), {
      availibility: !!document.getElementById("open-to-work-profile")?.checked,
      dance_styles: v.dance_styles.trim(),
      city: v.city,
      skill_level: v.skill_level,
      year_experience: +v.year_experience,
      preferred_types: v.preferred_types,
      languages: v.languages,
      min_compensation: +v.min_compensation,
      accept_unpaid: !!v.accept_unpaid,
      include_online: !!v.include_online,
      travelRadiusKm: +(v.travelRadiusKm || 20),
    });
    Object.assign(ext().profile, {
      currency: v.currency,
      compensation_unit: v.compensation_unit,
    });
    ext().push.enabled = !!v.push;
    ui.filters.radius = +v.travelRadiusKm;
    ui.filters.duration = +v.max_duration_days;
    ui.dirty = false;
    rebuildRecommendations();
    audit("profile preferences saved", dancer().id);
    ui.mobile = "feed";
    render();
    toast("Preferences saved. Matches refreshed.");
  } else if (f.id === "submission-form") {
    const normalized = normalize(v.url);
    if (!normalized) {
      $("#submission-error").textContent =
        "Enter a valid public HTTP(S) recruitment URL.";
      return;
    }
    const existing =
      ext().submissions.find((s) => s.normalized_url === normalized) ||
      db.ai_source_links.find((s) => s.normalized_url === normalized) ||
      db.ai_opportunities.find((o) => normalize(o.raw_url) === normalized);
    if (existing) {
      dialog(
        "submitted",
        "Link already received",
        "<p>This link is already submitted or available. No duplicate contribution was created.</p>",
      );
      return;
    }
    ext().submissions.unshift({
      id: Date.now(),
      dancer_id: dancer().id,
      url: normalized,
      normalized_url: normalized,
      note: v.note,
      status: "pending_review",
      submitted_at: now(),
    });
    audit("community link submitted", normalized);
    render();
    dialog(
      "submitted",
      "Thank you for contributing",
      "<p>Your link is waiting for admin review. It will not appear in the job feed until it has been reviewed and processed.</p>",
    );
  } else if (f.id === "operations-config-form") {
    if (!editable()) return;
    const c = {
      emergency_stop: !!v.emergency_stop,
      publish_score: +v.publish_score,
      reject_score: +v.reject_score,
      expiry_days: +v.expiry_days,
      report_limit: +v.report_limit,
      push_threshold: +v.push_threshold,
    };
    if (c.reject_score >= c.publish_score) {
      $("#operations-config-error").textContent =
        "Auto-reject score must be lower than auto-publish score.";
      return;
    }
    ext().operationsConfig = c;
    audit("proposed configuration saved", "operations");
    render();
    toast("Configuration saved locally. Backend rules unchanged.");
  } else if (f.id === "schedule-form") {
    ext().schedule = {
      enabled: !!v.enabled,
      crawl_time: v.crawl_time,
      timezone: v.timezone,
    };
    audit("schedule saved", "crawler");
    toast("Sample schedule saved.");
  }
});
document.addEventListener("keydown", (e) => {
  if (!ui.dialog) return;
  if (e.key === "Escape") {
    e.preventDefault();
    closeDialog();
  }
  if (e.key === "Tab") {
    const items = [
      ...$("#overlay-root").querySelectorAll(
        "button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]",
      ),
    ].filter((x) => x.getClientRects().length);
    const first = items[0],
      last = items.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
window.addEventListener("beforeunload", (e) => {
  if (ui.dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
window.addEventListener("hashchange", route);
// Read-only inspection hooks for the local review suite, never backend integration.
window.HammerReview = {
  state: () => JSON.parse(JSON.stringify(db)),
  ui: () => JSON.parse(JSON.stringify(ui)),
  openJob: showJob,
  normalize,
  ageAllowed,
};
rebuildRecommendations();
render();
route();
