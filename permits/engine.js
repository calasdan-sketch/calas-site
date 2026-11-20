/* Permit Checker engine — Calas Automations.
 * Runs in the browser (window.PermitEngine) and in Node (module.exports) for tests.
 * Every rule below that states a requirement is tied to an official source in
 * SOURCES, each read on the date shown. Where an official page does not settle a
 * question, the engine says "check with the City" instead of guessing.
 * General guidance only, not legal advice; the local authority has the final word.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PermitEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var CHECKED = "19 Nov 2026";

  /* ---------------- Official sources (all read 2026-11-19) ---------------- */
  var W = "https://www.winnipeg.ca/building-development/building-renovating/home-improvement-projects";
  var SOURCES = {
    wpgProjects: { t: "City of Winnipeg — Home improvement projects (incl. work that needs no permit)", u: W },
    wpgDecks: { t: "City of Winnipeg — Decks", u: W + "/decks" },
    wpgDeckBrochure: { t: "City of Winnipeg — Decks: Construction Information (Oct 2025)", u: "https://www.winnipeg.ca/media/4997" },
    wpgAccessory: { t: "City of Winnipeg — Detached garages & accessory structures", u: W + "/detached-garages-accessory-structures" },
    wpgBasement: { t: "City of Winnipeg — Basement/lower level development", u: W + "/basementlower-level-development" },
    wpgElectrical: { t: "City of Winnipeg — Electrical installations", u: W + "/electrical-installations" },
    wpgPlumbing: { t: "City of Winnipeg — Plumbing installations", u: W + "/plumbing-installations" },
    wpgReno: { t: "City of Winnipeg — Home renovations", u: W + "/home-renovations" },
    wpgAdditions: { t: "City of Winnipeg — Additions & attached garages", u: W + "/additions-attached-garages" },
    wpgPools: { t: "City of Winnipeg — Outdoor pools & hot tubs/spas", u: W + "/outdoor-pools-hot-tubsspas" },
    wpgSuites: { t: "City of Winnipeg — Secondary suites", u: W + "/secondary-suites" },
    wpgStoves: { t: "City of Winnipeg — Wood stoves & fireplaces", u: W + "/wood-stoves-fireplaces" },
    wpgFoundation: { t: "City of Winnipeg — Foundation repairs", u: W + "/foundation-repairs" },
    wpgSolar: { t: "City of Winnipeg — Solar PV information bulletin 2026-005", u: "https://www.winnipeg.ca/media/6159" },
    wpgDemolition: { t: "City of Winnipeg — Demolitions", u: "https://legacy.winnipeg.ca/ppd/permits/Residential/Demolitions.stm" },
    wpgDevPermits: { t: "City of Winnipeg — Development permits (and exemptions)", u: "https://legacy.winnipeg.ca/ppd/developmentpermits/default.stm" },
    wpgFences: { t: "City of Winnipeg — Residential Fences brochure (Mar 2023)", u: "https://legacy.winnipeg.ca/ppd/Documents/Brochures/Residential-Fences.pdf" },
    wpgSigns: { t: "City of Winnipeg — Signs", u: "https://legacy.winnipeg.ca/ppd/permits/Commercial/Signs.stm" },
    wpgMechLicence: { t: "City of Winnipeg — Mechanical contractor licensing", u: "https://www.winnipeg.ca/building-development/building-renovating/trade-information-contractor-licensing/contractor-licensing/mechanical-contractor-information" },
    wpgHomeBiz: { t: "City of Winnipeg — Home-based business", u: "https://legacy.winnipeg.ca/ppd/permits/Residential/HomeBusiness.stm" },
    mbGas: { t: "Province of Manitoba — Gas and oil permits (Inspection & Technical Services)", u: "https://www.manitoba.ca/labour/its/gas-oil/permits.html" },
    mbFood: { t: "Province of Manitoba — Food handling establishment health permits", u: "https://gov.mb.ca/health/publichealth/environmentalhealth/protection/food.html" },
    mbHydro: { t: "Manitoba Hydro — Electrical permits (who issues them, inside and outside Winnipeg)", u: "https://hydro.mb.ca/service/permits/contractors" },
    mbReg31: { t: "Manitoba — Performance Standards for Electrical Permits Regulation, M.R. 31/2026", u: "https://web2.gov.mb.ca/laws/regs/current/031-2026.php?lang=en" },
    mbCode: { t: "Manitoba Building Code, M.R. 78/2023", u: "https://web2.gov.mb.ca/laws/regs/current/078-2023.php?lang=en" },
    cgyDecks: { t: "City of Calgary — Decks", u: "https://www.calgary.ca/development/home-building/decks.html" },
    cgyBasements: { t: "City of Calgary — Basements", u: "https://www.calgary.ca/development/home-building/basements.html" },
    cgyFences: { t: "City of Calgary — Fences & retaining walls", u: "https://www.calgary.ca/development/home-building/fences.html" },
    cgySheds: { t: "City of Calgary — Garages, sheds, gazebos", u: "https://www.calgary.ca/development/home-building/garages-sheds.html" },
    cgyProjects: { t: "City of Calgary — Home improvement permit types", u: "https://www.calgary.ca/development/home-building/permit-types.html" },
    yegDecks: { t: "City of Edmonton — Uncovered decks", u: "https://www.edmonton.ca/residential_neighbourhoods/uncovered-deck" },
    yegSheds: { t: "City of Edmonton — Detached garages & sheds", u: "https://www.edmonton.ca/residential_neighbourhoods/detached-garage-shed-permit" },
    yegReno: { t: "City of Edmonton — Renovations & basement development", u: "https://www.edmonton.ca/residential_neighbourhoods/renovations-basement-development" },
    yegFences: { t: "City of Edmonton — Fences & privacy screens", u: "https://www.edmonton.ca/residential_neighbourhoods/fence-permit" },
    yegElectrical: { t: "City of Edmonton — Electrical permits", u: "https://www.edmonton.ca/residential_neighbourhoods/electrical-permit" },
    yegPlumbing: { t: "City of Edmonton — Plumbing permits", u: "https://www.edmonton.ca/residential_neighbourhoods/plumbing-permit" },
    yegGas: { t: "City of Edmonton — Gas permits", u: "https://www.edmonton.ca/residential_neighbourhoods/gas-permit" }
  };

  /* ---------------- Where to apply / contacts per city ---------------- */
  var CITY = {
    winnipeg: {
      label: "Winnipeg",
      office: "City of Winnipeg, Zoning & Permits — Permits Direct Line 204-986-5140, ppd-permit@winnipeg.ca, Unit 31-30 Fort Street (Mon–Fri 8:30–4:30), or 311.",
      apply: ["Winnipeg Permits Online", "https://www.winnipeg.ca/permitsonline"],
      projects: SOURCES.wpgProjects
    },
    calgary: {
      label: "Calgary",
      office: "City of Calgary — apply.calgary.ca (needs a myID account), Planning Services Centre, 3rd floor, 800 Macleod Trail SE, or 311.",
      apply: ["Calgary online permit applications (apply.calgary.ca)", "https://apply.calgary.ca/"],
      projects: SOURCES.cgyProjects
    },
    edmonton: {
      label: "Edmonton",
      office: "City of Edmonton — SelfServe (selfserve.edmonton.ca), Edmonton Service Centre by appointment, or 311 (780-442-5311 from outside Edmonton).",
      apply: ["Edmonton SelfServe", "https://selfserve.edmonton.ca/"],
      projects: SOURCES.yegReno
    },
    other: {
      label: "your area",
      office: "Your municipality's building / planning office (often reachable through 311 or the town office).",
      apply: null,
      projects: null
    }
  };

  /* ---------------- Permit definitions per city ---------------- */
  var OWNER_OR_CONTRACTOR = "The owner, or the contractor doing the work. If you hire a contractor, the City says they must get the permit before work starts. If someone other than the owner applies, the City's forms ask for an Owner Statement signed by the owner.";
  var PERMITS = {
    winnipeg: {
      building: {
        name: "Building permit", issuer: "City of Winnipeg (Zoning & Permits)",
        who: OWNER_OR_CONTRACTOR + " Plans must be sealed by an engineer or architect where the City asks for it (the job notes below say when).",
        apply: [["Apply on Winnipeg Permits Online", "https://www.winnipeg.ca/permitsonline"], ["Or email the package to ppd-permit@winnipeg.ca, or drop it at Unit 31-30 Fort Street", ""]],
        gather: ["Owner Statement (only if the owner is not the applicant)", "Declaration Form for Building Permit Application", "Site plan: street/lane, distances to all property lines, existing buildings, legal description", "Plans for the work (the application form for your job lists exactly which)"],
        src: "wpgProjects"
      },
      development: {
        name: "Development permit (zoning) — or the exemption declaration", issuer: "City of Winnipeg (Zoning & Permits)",
        who: "The owner, or someone the owner authorizes. Confirm this BEFORE the building permit: if your job is exempt you instead attach the Declaration Form for Development Permit Exemption to the building permit.",
        apply: [["Development permit application form (PDF)", "https://legacy.winnipeg.ca/ppd/Documents/Permits/Development-Permit-Application-Form-Residential-Commercial.pdf"], ["Checklist — single/two-family homes (PDF)", "https://legacy.winnipeg.ca/ppd/Documents/Permits/Development-Permit-Application-Checklist-Single-Two-Family-Residential.pdf"], ["Declaration Form for Development Permit Exemption (PDF)", "https://legacy.winnipeg.ca/ppd/documents/permits/exemptions/Declaration-Form-for-Development-Permit-Exemption.pdf"], ["Submit on Winnipeg Permits Online", "https://www.winnipeg.ca/permitsonline"]],
        gather: ["Site plan showing the work and distances to property lines", "Owner authorization if you are not the owner"],
        src: "wpgDevPermits"
      },
      electrical: {
        name: "Electrical permit", issuer: "City of Winnipeg — inside Winnipeg the City issues electrical permits, not Manitoba Hydro",
        who: "A City-licensed electrical contractor, OR you as the homeowner if it is a single detached house that is your primary residence and you do the work yourself (sign the Homeowner Electrical Permit Declaration). Homeowners may NOT take out permits for solar, work over 200 amps, EV chargers, generators, transfer switches, indoor grow rooms or electrical services.",
        apply: [["Housing electrical permit application (PDF)", "https://www.winnipeg.ca/media/6351"], ["Homeowner electrical permit declaration (PDF)", "https://www.winnipeg.ca/media/6352"], ["Find a licensed contractor", "https://www.winnipeg.ca/building-development/building-renovating/trade-information-contractor-licensing/contractor-licensing/list-licensed-contractors"], ["Submit on Winnipeg Permits Online", "https://www.winnipeg.ca/permitsonline"]],
        gather: ["Address and a description of the electrical work", "Licensed contractor's details — or the signed homeowner declaration"],
        src: "wpgElectrical"
      },
      plumbing: {
        name: "Plumbing permit", issuer: "City of Winnipeg",
        who: "A City-licensed plumbing contractor, OR you as the homeowner if it is a single detached house that is your primary residence and you do the work yourself (sign the Homeowner Plumbing Permit Declaration).",
        apply: [["Housing plumbing permit application (PDF)", "https://www.winnipeg.ca/media/6335"], ["Homeowner plumbing permit declaration (PDF)", "https://www.winnipeg.ca/media/6336"], ["Find a licensed contractor", "https://www.winnipeg.ca/building-development/building-renovating/trade-information-contractor-licensing/contractor-licensing/list-licensed-contractors"], ["Submit on Winnipeg Permits Online", "https://www.winnipeg.ca/permitsonline"]],
        gather: ["Address and a description of the plumbing work", "Licensed contractor's details — or the signed homeowner declaration"],
        src: "wpgPlumbing"
      },
      mechanical: {
        name: "Mechanical (HVAC) permit", issuer: "City of Winnipeg",
        who: "The City issues mechanical permits to holders of a City mechanical licence (M1 for HVAC). Whether a like-for-like furnace or A/C swap in a house needs a City permit is not stated on the City's pages — check with the City (204-986-5140).",
        apply: [["Mechanical contractor licensing (City of Winnipeg)", SOURCES.wpgMechLicence.u]],
        gather: ["Contractor's City mechanical licence number", "Equipment details"],
        src: "wpgMechLicence"
      },
      gas: {
        name: "Gas permit", issuer: "Province of Manitoba, Inspection & Technical Services (not the City)",
        who: "Only a licensed person (gas fitter) can apply. Needed before any installation, alteration or addition of gas piping or gas equipment.",
        apply: [["Gas and oil permits — Province of Manitoba", SOURCES.mbGas.u], ["Gas Permit Clerk: 204-945-1359", ""]],
        gather: ["Your licensed gas fitter's details", "Equipment details (input rating)"],
        src: "mbGas"
      },
      demolition: {
        name: "Demolition permit", issuer: "City of Winnipeg",
        who: "A City demolition contractor licence is needed to demolish a building or part of one. No licence is needed for residential accessory structures (decks, detached garages, carports, sheds, gazebos, workshops). Demolition must start within 30 days of the permit and finish within 60.",
        apply: [["Demolition/removal permit application (PDF)", "https://www.winnipeg.ca/media/6525"], ["Manitoba Hydro — disconnect and meter removal", "https://www.hydro.mb.ca/service/connections/removal/"], ["Submit on Winnipeg Permits Online", "https://www.winnipeg.ca/permitsonline"]],
        gather: ["Confirmation from Manitoba Hydro that electric and gas meters are removed (the City won't issue the permit before this, for buildings with service)", "Water shut-off and meter removal arranged with Water and Waste", "Safety fencing plan (6 ft, not climbable)"],
        src: "wpgDemolition"
      },
      sign: {
        name: "Sign permit (combined development and/or building)", issuer: "City of Winnipeg",
        who: "The business or property owner, or the sign company with the owner's authorization. Most signs need a development permit; all signs except face-replacements need a building permit.",
        apply: [["Signs development/building permit application (PDF)", "https://legacy.winnipeg.ca/ppd/Documents/Permits/Commercial/Signs-Development-Building-Permit-Application-Form.pdf"], ["Email signpermitapplications@winnipeg.ca or use Permits Online", "https://www.winnipeg.ca/permitsonline"]],
        gather: ["Sign drawings with size and location", "Owner's authorization if you lease"],
        src: "wpgSigns"
      },
      food: {
        name: "Food handling permit + plan review", issuer: "Province of Manitoba — your area public health inspector",
        who: "The operator. Floor plans with the equipment list go to the public health inspector BEFORE construction or renovation starts; you need the permit before you open.",
        apply: [["Food Handling Permit Registration Form (PDF)", "https://gov.mb.ca/health/publichealth/environmentalhealth/protection/docs/fhp.pdf"], ["Food establishment permits — Province of Manitoba", SOURCES.mbFood.u]],
        gather: ["Detailed floor plan with equipment listed", "Menu"],
        src: "mbFood"
      }
    },
    calgary: {
      building: { name: "Building permit", issuer: "City of Calgary", who: "The owner, or the contractor if you hire one (the City says they apply). Only the original applicant can change the permit.", apply: [["Apply at apply.calgary.ca (myID account)", "https://apply.calgary.ca/"]], gather: ["Site plan and drawings for the work"], src: "cgyProjects" },
      development: { name: "Development permit", issuer: "City of Calgary", who: "The owner or their applicant.", apply: [["Apply at apply.calgary.ca", "https://apply.calgary.ca/"]], gather: ["Site plan"], src: "cgyProjects" },
      electrical: { name: "Electrical permit", issuer: "City of Calgary", who: "The contractor doing the work, or you as homeowner if you own the home, live in it (not a rental) and do the work yourself.", apply: [["Apply at apply.calgary.ca", "https://apply.calgary.ca/"]], gather: ["Description of the electrical work"], src: "cgyBasements" },
      plumbing: { name: "Plumbing permit", issuer: "City of Calgary", who: "The contractor doing the work, or you as homeowner if you own the home, live in it (not a rental) and do the work yourself.", apply: [["Apply at apply.calgary.ca", "https://apply.calgary.ca/"]], gather: ["Description of the plumbing work"], src: "cgyBasements" },
      gas: { name: "Gas permit", issuer: "City of Calgary", who: "The contractor doing the work. Homeowners can take out a gas permit for a gas fireplace in their own home; for other gas work check with the City.", apply: [["Apply at apply.calgary.ca", "https://apply.calgary.ca/"]], gather: ["Gas fitter's details"], src: "cgyBasements" }
    },
    edmonton: {
      building: { name: "Building permit", issuer: "City of Edmonton", who: "The owner, or a contractor applying for them.", apply: [["Edmonton SelfServe", "https://selfserve.edmonton.ca/"]], gather: ["Site plan and drawings for the work"], src: "yegReno" },
      development: { name: "Development permit", issuer: "City of Edmonton", who: "The homeowner, or a contractor for them. Neighbours within 60 m are notified and have about four weeks to appeal.", apply: [["Edmonton SelfServe", "https://selfserve.edmonton.ca/"]], gather: ["Site plan (on a real property report, plot plan or graph paper)"], src: "yegFences" },
      electrical: { name: "Electrical permit", issuer: "City of Edmonton", who: "A contractor, or you as homeowner if you own and live in a single-family house (not a condo, semi, row house or rental) and do the work before it is drywalled. Homeowners can't do the main panel, pool grounding or solar.", apply: [["Electrical permits — City of Edmonton", SOURCES.yegElectrical.u], ["Homeowner electrical permit application (PDF)", "https://www.edmonton.ca/sites/default/files/public-files/assets/electrical_permit_application_for_homeowners.pdf"]], gather: ["Application and a drawing of the work"], src: "yegElectrical" },
      plumbing: { name: "Plumbing permit", issuer: "City of Edmonton", who: "A contractor, or you as homeowner if you own and live in the single detached house and do the work yourself.", apply: [["Plumbing permits — City of Edmonton", SOURCES.yegPlumbing.u]], gather: ["Piping layout drawing with fittings and sizes"], src: "yegPlumbing" },
      gas: { name: "Gas permit", issuer: "City of Edmonton", who: "A qualified contractor. A homeowner gas permit only covers renovations or a re-test of an existing system in a single detached house they own and live in — a homeowner may NOT install a new gas line.", apply: [["Gas permits — City of Edmonton", SOURCES.yegGas.u]], gather: ["Piping layout drawing with fittings, sizes and specifications"], src: "yegGas" }
    }
  };
  var GENERIC = {
    building: "Building permit", development: "Development / zoning permit", electrical: "Electrical permit",
    plumbing: "Plumbing permit", mechanical: "Mechanical (HVAC) permit", gas: "Gas permit", demolition: "Demolition permit",
    sign: "Sign permit", food: "Food premises / health permit"
  };

  /* ---------------- Text understanding ---------------- */
  // Fix common spellings before matching.
  var SPELL = {
    dek: "deck", decs: "decks", deks: "decks", basment: "basement", basemnt: "basement", bsmt: "basement", bathrom: "bathroom",
    bthroom: "bathroom", finsh: "finish", finnish: "finish", shingels: "shingles", shingle: "shingles", sheds: "shed",
    fense: "fence", fance: "fence", fences: "fence", garge: "garage", garag: "garage", grage: "garage", electricl: "electrical",
    elecrical: "electrical", plumming: "plumbing", pluming: "plumbing", furnance: "furnace", furnaces: "furnace",
    demo: "demolish", reno: "renovation", renos: "renovation", renovate: "renovation", remodle: "remodel",
    wiring: "wiring", rewire: "rewire", windows: "window", doors: "door", walls: "wall", decks: "deck",
    pools: "pool", jacuzzi: "hot tub", spa: "hot tub", hottub: "hot tub", gazebos: "gazebo", carports: "carport",
    signs: "sign", storey: "storey", bild: "build", buld: "build", instal: "install", replase: "replace", repalce: "replace",
    fourth: "fourth", sunroom: "sunroom", porchs: "porch", stove: "stove", ac: "air conditioner", "a/c": "air conditioner",
    hwt: "hot water tank", reshingel: "reshingle", reshingling: "reshingle", reroof: "reshingle", "re-roof": "reshingle", "re-shingle": "reshingle"
  };
  var VOCAB = ["deck", "basement", "bathroom", "bedroom", "kitchen", "finish", "shingles", "reshingle", "roof", "fence", "garage", "shed",
    "electrical", "plumbing", "furnace", "demolish", "demolition", "renovation", "remodel", "window", "door", "wall", "pool", "gazebo",
    "carport", "sign", "signage", "build", "install", "replace", "sunroom", "addition", "foundation", "teleposts", "weeping", "solar",
    "fireplace", "stove", "chimney", "secondary", "suite", "restaurant", "cafe", "panel", "outlet", "outlets", "receptacle", "fixture",
    "sink", "toilet", "shower", "bathtub", "plumbing", "siding", "stucco", "flooring", "painting", "cabinets", "pergola", "retaining",
    "greenhouse", "workshop", "driveway", "generator", "charger", "water", "heater", "tank", "boiler", "ductwork", "conditioner",
    "porch", "attached", "detached", "existing", "business", "salon", "daycare", "underpinning", "waterproofing", "sprinkler", "electrician"];

  function lev(a, b) { // Damerau-Levenshtein (optimal string alignment)
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 0; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) {
      var c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[a.length][b.length];
  }
  var COMMON = " the and for with from into onto off our my a an to of in on at by is it its be we i me new old out up down back front side yard lane house home room rooms some all one two three four five six seven eight nine ten feet foot ft high tall long wide big small little about around maybe just like need want would will get put run add make take also both each than then them they this that there here what which who how much many more most very really want need plan planning going doing done other another same size first second third floor level ground grade summer winter spring fall rent rental unit units own separate entrance power lights plugs sink sinks posts post steel wood bbq stuff fix fixing area space empty retail shop store hair family living dining later care safe bank tool tools pole poles hall panes desk dock lake cake sale deal cost cash good garden patio lawn tree trees pond sauna bars plan plans permit permits city town electric need needs dig digging repair repairs install build replace paint ";
  function normalize(text) {
    var s = (" " + String(text || "").toLowerCase() + " ")
      .replace(/[’‘]/g, "'").replace(/[“”]/g, '"')
      .replace(/(\d)\s*(?:x|×|by)\s*(\d)/g, "$1 x $2")
      .replace(/[^a-z0-9.'"\/\- x²]+/g, " ");
    var words = s.split(/\s+/).map(function (w) { return SPELL[w] ? w : w.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ""); }).filter(Boolean);
    var out = words.map(function (w) {
      if (SPELL[w]) return SPELL[w];
      if (/^[0-9]/.test(w) || w.length < 4 || COMMON.indexOf(" " + w + " ") >= 0 || VOCAB.indexOf(w) >= 0) return w;
      // Leave real words that merely contain a known word alone (rebuild, decking, fencing).
      for (var q = 0; q < VOCAB.length; q++) if (VOCAB[q].length >= 4 && w.indexOf(VOCAB[q]) >= 0) return w;
      var best = null, bd = 9;
      for (var k = 0; k < VOCAB.length; k++) {
        var v = VOCAB[k];
        if (Math.abs(v.length - w.length) > 2) continue;
        var dd = lev(w, v), lim = w.length >= 8 ? 2 : 1;
        if (dd <= lim && dd < bd) { bd = dd; best = v; }
      }
      if (best) return best;
      if (/s$/.test(w) && VOCAB.indexOf(w.slice(0, -1)) >= 0) return w.slice(0, -1);
      return w;
    });
    return " " + out.join(" ") + " ";
  }
  function has(t, phrases) {
    for (var i = 0; i < phrases.length; i++) {
      var p = phrases[i];
      if (p.charAt(0) === "~") { if (new RegExp(p.slice(1)).test(t)) return true; }
      else if (t.indexOf(" " + p + " ") >= 0 || t.indexOf(" " + p + "s ") >= 0) return true;
    }
    return false;
  }

  // Dimensions: heights in mm, areas in square feet.
  function toMm(n, u) {
    u = u || "";
    if (/^(mm)$/.test(u)) return n;
    if (/^(cm)$/.test(u)) return n * 10;
    if (/^(m|metre|metres|meter|meters)$/.test(u)) return n * 1000;
    if (/^(in|inch|inches|")$/.test(u)) return n * 25.4;
    return n * 304.8; // feet by default
  }
  function parseDims(raw) {
    var t = " " + String(raw || "").toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"') + " ";
    var res = { heightMm: null, areaSqFt: null };
    var m, re = /(\d+(?:\.\d+)?)\s*(?:x|×|by)\s*(\d+(?:\.\d+)?)\s*(m\b|metres?|meters?|ft|feet|foot|')?/g;
    while ((m = re.exec(t))) {
      var a = parseFloat(m[1]) * parseFloat(m[2]);
      if (m[3] && /^m/.test(m[3])) a = a * 10.7639;
      res.areaSqFt = Math.max(res.areaSqFt || 0, a);
    }
    re = /(\d+(?:\.\d+)?)\s*(sq\.?\s*ft|square\s*f(?:ee|oo)t|sqft|sf|ft2|ft²|m2|m²|sq\.?\s*m\b|square\s*met(?:er|re)s?)/g;
    while ((m = re.exec(t))) {
      var b = parseFloat(m[1]); if (/m/.test(m[2].replace(/square|sq/g, "")) && !/ft|f(ee|oo)t|sf/.test(m[2])) b *= 10.7639;
      res.areaSqFt = Math.max(res.areaSqFt || 0, b);
    }
    // heights: a length with a height word nearby
    re = /(\d+(?:\.\d+)?)\s*(mm|cm|m\b|metres?|meters?|ft|feet|foot|'|inches|inch|in\b|")(?:\s*(\d+(?:\.\d+)?)\s*(?:in|inch|inches|"))?/g;
    while ((m = re.exec(t))) {
      var around = t.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30);
      var before = t.slice(Math.max(0, m.index - 3), m.index);
      if (/x\s*$|by\s*$/.test(before)) continue;
      var after = t.slice(m.index + m[0].length, m.index + m[0].length + 4);
      if (/^\s*(x|by|×)/.test(after)) continue;
      if (/high|tall|height|off the ground|above (the )?(ground|grade)|elevat|raised|up off|\bup\b|fence|deck|privacy/.test(around)) {
        var h = toMm(parseFloat(m[1]), m[2]) + (m[3] ? parseFloat(m[3]) * 25.4 : 0);
        res.heightMm = Math.max(res.heightMm || 0, h);
      }
    }
    if (res.heightMm === null) {
      if (/ground level|on grade|at grade|ground-level|low deck|floating deck|level with the ground/.test(t)) res.heightMm = 300;
      else if (/second (storey|story|floor)|upper deck|raised deck|elevated deck|2nd (storey|story|floor)|walk-?out/.test(t)) res.heightMm = 2000;
    }
    return res;
  }

  /* ---------------- Result builder ---------------- */
  function Result(city) {
    this.city = city; this.projects = []; this.permits = {}; this.order = [];
    this.none = []; this.check = []; this.notes = []; this.questions = []; this.dig = false;
  }
  Result.prototype.add = function (type, status, why, src, extraWho) {
    // status: "likely" or "if"
    if (!this.permits[type]) { this.permits[type] = { type: type, status: status, why: [], srcs: [], extra: [] }; this.order.push(type); }
    var p = this.permits[type];
    if (status === "likely") p.status = "likely";
    if (why && p.why.indexOf(why) < 0) p.why.push(why);
    if (src && p.srcs.indexOf(src) < 0) p.srcs.push(src);
    if (extraWho && p.extra.indexOf(extraWho) < 0) p.extra.push(extraWho);
  };
  Result.prototype.no = function (text, src) { if (!this.none.some(function (n) { return n.text === text; })) this.none.push({ text: text, src: src }); };
  Result.prototype.chk = function (text, src) { if (!this.check.some(function (n) { return n.text === text; })) this.check.push({ text: text, src: src }); };
  Result.prototype.note = function (text, src) { if (!this.notes.some(function (n) { return n.text === text; })) this.notes.push({ text: text, src: src }); };
  Result.prototype.ask = function (q, answers) { if (!this.questions.some(function (x) { return x.q === q; })) this.questions.push({ q: q, answers: answers }); };

  /* ---------------- Project detectors ----------------
   * Each: id, label, test(t, raw) -> bool, and run(r, ctx) per city.
   */
  var DIG_NOTE = "Digging (footings, posts, piles)? Call Click Before You Dig MB first: clickbeforeyoudigmb.com or 1-800-940-3447. It's free.";
  function wired(t) { return has(t, ["power", "electrical", "electricity", "wiring", "wired", "lights", "lighting", "outlet", "plugs", "plug", "receptacle", "hydro", "panel", "subpanel"]); }
  function plumbed(t) { return has(t, ["plumbing", "sink", "water line", "toilet", "shower", "bathroom", "drain", "washroom", "bathtub", "laundry"]); }

  var PROJECTS = [
    {
      id: "suite", label: "Secondary suite",
      test: function (t) {
        return has(t, ["secondary suite", "in-law suite", "inlaw suite", "garden suite", "garage suite", "laneway house", "carriage house", "granny flat", "legal suite", "rental suite", "basement suite", "basement apartment", "second suite", "~ suite .*(rent|tenant)", "~basement .*(rent out|tenant|separate entrance)", "~(rent|tenant|separate entrance).* basement"]);
      },
      run: function (r, c) {
        if (c.city === "winnipeg") {
          ["development", "building", "electrical", "plumbing"].forEach(function (p) { r.add(p, "likely", "Secondary suite: the City says you need a development permit and a building permit, plus separate electrical and plumbing permits.", "wpgSuites"); });
          r.note("Winnipeg secondary suites: one per single-family property; an attached (e.g. basement) suite can be no bigger than 33% of the combined floor area or 74 m² (800 sq ft), whichever is less; at least two off-street parking spaces; detached suites only in R1/R2 zones on lots of 325 m²+. If it doesn't fit zoning it may need a conditional use or variance.", "wpgSuites");
        } else if (c.city === "calgary") {
          r.add("building", "likely", "A basement with a kitchen and a bathroom is a secondary suite in Calgary — you apply for a secondary suite.", "cgyBasements");
          r.add("electrical", "likely", "Calgary: separate electrical permit for all electrical installations.", "cgyBasements");
          r.add("plumbing", "likely", "Calgary: separate plumbing permit for all new plumbing.", "cgyBasements");
          r.chk("Calgary secondary suite: whether you also need a development permit depends on your zoning — check with the City.", "cgyBasements");
        } else {
          ["building", "electrical", "plumbing"].forEach(function (p) { r.add(p, "likely", "Secondary suite (a new dwelling unit).", c.city === "edmonton" ? "yegReno" : null); });
          r.add("development", "if", "Secondary suites are usually a zoning matter too.", null);
          r.chk("Secondary suite rules (size, parking, zoning) — check with your City.", null);
        }
      }
    },
    {
      id: "basement", label: "Basement development",
      test: function (t) { return has(t, ["basement", "lower level", "rec room", "~(finish|develop|frame|drywall).*(basement|lower level)"]); },
      skipIf: ["suite"],
      run: function (r, c, t) {
        var cosmetic = !has(t, ["finish", "develop", "development", "bedroom", "bathroom", "room", "rooms", "frame", "framing", "wall", "office", "suite", "renovation", "remodel", "living space", "kitchen", "bar"]);
        if (cosmetic && has(t, ["paint", "painting", "flooring", "carpet", "floor"])) {
          r.no(c.city === "winnipeg" ? "Cosmetic basement work (painting, flooring, millwork) — the City says no building permit." : "Cosmetic basement work (painting, flooring) usually needs no permit.", c.city === "winnipeg" ? "wpgBasement" : c.city === "edmonton" ? "yegReno" : null);
          return;
        }
        var developing = has(t, ["finish", "develop", "development", "bedroom", "bathroom", "room", "rooms", "frame", "framing", "office", "renovation", "remodel", "living space", "kitchen", "bar", "rec room", "family room", "theatre", "gym"]);
        if (!developing) {
          r.add("building", "if", "Basement work that adds rooms, bedrooms or living space needs a building permit; cosmetic work (painting, flooring, millwork) does not.", c.city === "winnipeg" ? "wpgBasement" : null);
          r.ask("Are you adding rooms or living space in the basement?", [["Yes — new rooms", "finish basement with new rooms"], ["No — cosmetic only", "basement painting and flooring only"]]);
          return;
        }
        if (c.city === "winnipeg") {
          r.add("building", "likely", "Basement development that adds rooms, bedrooms or living space needs a building permit.", "wpgBasement");
          if (has(t, ["kitchen", "stove", "cooking"])) r.chk("A kitchen or cooking equipment in the basement may make it a secondary suite needing a development permit — call 204-986-5140 to speak with a Zoning Development Officer.", "wpgBasement");
          r.note("Basement application form: floor plan with every room labelled by use and sized, all doors and windows with sizes, and the electrical and plumbing layout. Structural drawings if you move or open load-bearing walls or alter joists, beams or stairs (engineering may be required).", "wpgBasement");
        } else if (c.city === "calgary") {
          r.add("building", "likely", "Calgary: a building permit is needed when the basement is developed for the first time, or for structural changes.", "cgyBasements");
          r.add("electrical", "likely", "Calgary: separate electrical permit for all electrical installations and renovations.", "cgyBasements");
          if (has(t, ["kitchen"]) && has(t, ["bathroom"])) r.chk("A basement with a kitchen and bathroom counts as a secondary suite in Calgary.", "cgyBasements");
        } else if (c.city === "edmonton") {
          r.add("building", "likely", "Edmonton: building or finishing a living/recreation room, bedroom or bathroom needs a permit.", "yegReno");
          r.add("electrical", "if", "Edmonton: all new electrical installations need a permit, including basement developments (the building permit comes first).", "yegElectrical");
        } else {
          r.add("building", "likely", "Finishing a basement into living space normally needs a building permit.", null);
        }
        if (!has(t, ["no electrical"]) && c.city === "winnipeg") r.add("electrical", "if", "Any new wiring, outlets or lights in the basement.", "wpgElectrical");
        if (plumbed(t)) r.add("plumbing", "likely", "New plumbing (bathroom, sink, laundry) in the basement.", c.city === "winnipeg" ? "wpgPlumbing" : c.city === "calgary" ? "cgyBasements" : c.city === "edmonton" ? "yegPlumbing" : null);
      }
    },
    {
      id: "deck", label: "Deck",
      test: function (t) { return has(t, ["deck", "sundeck", "~deck"]); },
      run: function (r, c, t, d) {
        var h = d.heightMm, covered = has(t, ["covered", "roof", "roofed", "pergola over", "~roof over"]);
        r.dig = true;
        if (c.city === "winnipeg") {
          if (has(t, ["front yard", "front of the house", "front porch"])) { r.chk("Front-yard deck: the City asks you to confirm requirements with the Permits Direct Line (204-986-5140) or ppd-zoningapplications@winnipeg.ca.", "wpgDecks"); }
          var big = d.areaSqFt === null || d.areaSqFt > 36;
          if (h !== null && h <= 600 && !covered) {
            r.no("An open deck under 600 mm (2 ft) high — the City lists it as work that needs no permit (you must still follow the building code and zoning).", "wpgProjects");
          } else if (h !== null && !big && !covered) {
            r.chk("Deck of 3.4 m² (36 sq ft) or less: the City's deck page lists area over 3.4 m² as one of the triggers — confirm with the City.", "wpgDecks");
          } else {
            var st = h === null ? "if" : "likely";
            r.add("building", st, h === null ? "A deck in a back or side yard more than 600 mm (2 ft) above ground and over 3.4 m² (36 sq ft) needs a building permit. Under 600 mm, no permit." : "Back/side-yard deck more than 600 mm (2 ft) above ground needs a building permit.", "wpgDecks");
            r.add("development", st, "Back/side-yard decks more than 600 mm above ground also need a development permit — unless the deck is level with a main-floor entrance (then building permit only).", "wpgDeckBrochure");
            if (h === null) r.ask("How high off the ground is the deck at its highest point?", [["2 ft or lower", "deck is 1 ft high"], ["More than 2 ft", "deck is 4 ft high"]]);
            if (covered) r.note("Planning a roof, sunroom or screened room on the deck later? The City recommends applying for the whole project now so the deck is designed for it (screw piles for this need engineer-sealed plans).", "wpgDeckBrochure");
          }
          r.note("Deck building permit package: site plan (distance to all property lines, existing buildings, overhead power lines, legal description), construction plans (foundation type, stairs, deck size, beam/post/joist spacing, lumber), elevations (height above ground, guard and handrail), and the City's Deck Checklist. A hot tub on the deck needs extra structural plans and its own permits.", "wpgDecks");
        } else if (c.city === "calgary") {
          if (covered) r.add("building", "likely", "Calgary: covered decks (with a roof or pergola) always need a building permit.", "cgyDecks");
          else if (h !== null && h <= 600) r.no("Calgary: an uncovered deck no higher than 0.6 m (2 ft) at every point needs no building permit.", "cgyDecks");
          else { r.add("building", h === null ? "if" : "likely", "Calgary: an uncovered deck higher than 0.6 m (2 ft) above grade at any point needs a building permit.", "cgyDecks"); if (h === null) r.ask("How high off the ground is the deck at its highest point?", [["2 ft or lower", "deck is 1 ft high"], ["More than 2 ft", "deck is 4 ft high"]]); }
          r.add("development", "if", "Calgary: a development permit is needed if the deck is at the front of the home, closer than 1.2 m to a side property line, closer than 6 m to the rear property line, or in/within 6 m of a floodway.", "cgyDecks");
        } else if (c.city === "edmonton") {
          if (h !== null && h <= 600) r.no("Edmonton: no building permit for an uncovered deck 0.6 m (23⅝ in) or less above ground at every point, if it meets the City's other conditions.", "yegDecks");
          else { r.add("building", h === null ? "if" : "likely", "Edmonton: decks more than 0.6 m (23⅝ in) above ground need a building permit.", "yegDecks"); if (h === null) r.ask("How high off the ground is the deck at its highest point?", [["2 ft or lower", "deck is 1 ft high"], ["More than 2 ft", "deck is 4 ft high"]]); }
          if (h === null || h > 1200) r.add("development", "if", "Edmonton: decks more than 1.2 m (3 ft 11 in) above ground (or not meeting the other conditions) need a development permit.", "yegDecks");
        } else {
          r.add("building", "if", "Most cities require a building permit for raised decks (often over about 0.6 m / 2 ft). Check your local threshold.", null);
        }
      }
    },
    {
      id: "pergola", label: "Pergola",
      test: function (t) { return has(t, ["pergola", "trellis", "arbour", "arbor"]) && !has(t, ["deck"]); },
      run: function (r, c) {
        if (c.city === "winnipeg") r.no("A pergola or trellis that won't carry snow or rain load is not a 'building' under the building code, per the City's deck brochure.", "wpgDeckBrochure");
        else r.chk("Pergolas: check with the City (Calgary treats a deck with a pergola as a covered deck that needs a building permit).", c.city === "calgary" ? "cgyDecks" : null);
      }
    },
    {
      id: "garage_det", label: "Detached garage / carport",
      test: function (t) { return (has(t, ["garage", "carport"]) && !has(t, ["attached garage", "garage suite", "garage sale", "garage door opener", "~in (the|my|our) garage", "~(tear|knock|take) down", "demolish", "demolition"])) || has(t, ["detached garage"]); },
      run: function (r, c, t) {
        r.dig = true;
        if (c.city === "winnipeg") {
          r.add("building", "likely", "Detached garages and accessory structures over 10 m² (108 sq ft) need a building permit.", "wpgAccessory");
          r.add("electrical", "likely", "The City requires a separate electrical permit for ALL detached garages and carports.", "wpgAccessory");
          r.add("development", "if", "Larger accessory buildings may need a development permit; if your garage is exempt you file the Declaration Form for Development Permit Exemption with the building permit. Confirm which applies first.", "wpgDevPermits");
          if (plumbed(t)) r.add("plumbing", "likely", "Plumbing in the garage needs a plumbing permit.", "wpgPlumbing");
          r.note("Garage foundations over 70 m² (753.5 sq ft) need an engineer's seal (City accessory-structure application form).", "wpgAccessory");
        } else if (c.city === "calgary") {
          r.add("building", "likely", "Calgary: garages over 10 m² need a building permit.", "cgySheds");
          r.add("electrical", "likely", "Calgary: all new garages need a separate electrical permit (lights, outlets, garage door).", "cgySheds");
          r.add("development", "if", "Calgary: a development permit is needed if the garage is higher than 4.6 m (15'-1\") or bigger than 75 m² (807 sq ft), among other triggers.", "cgySheds");
        } else if (c.city === "edmonton") {
          r.add("building", "likely", "Edmonton: accessory buildings over 10 m² (108 sq ft) need a permit.", "yegSheds");
          if (wired(t)) r.add("electrical", "likely", "Edmonton: garage wiring needs an electrical permit.", "yegElectrical");
        } else {
          r.add("building", "likely", "A detached garage normally needs a building permit.", null);
          if (wired(t)) r.add("electrical", "likely", "Wiring the garage.", null);
        }
      }
    },
    {
      id: "shed", label: "Shed / accessory building",
      test: function (t) { return has(t, ["shed", "gazebo", "greenhouse", "workshop", "playhouse", "accessory building", "accessory structure", "storage building", "bunkie"]) && !has(t, ["~(tear|knock|take) down", "demolish", "demolition"]); },
      run: function (r, c, t, d) {
        var a = d.areaSqFt;
        r.dig = true;
        if (c.city === "winnipeg" || c.city === "calgary" || c.city === "edmonton") {
          var src = { winnipeg: "wpgAccessory", calgary: "cgySheds", edmonton: "yegSheds" }[c.city];
          if (a !== null && a > 107.6 && a <= 108.5) {
            r.chk("Your building is right at the 10 m² (108 sq ft) line where a building permit starts (" + Math.round(a) + " sq ft = " + (a / 10.7639).toFixed(2) + " m²). Measure the outside footprint and confirm with the City.", src);
          } else if (a !== null && a <= 107.6) {
            r.no(c.city === "edmonton" ? "Edmonton: a shed of 10 m² (108 sq ft) or less can be exempt — but only if it also meets the City's location/height rules and has no electricity, plumbing or gas connected." : "A detached shed or accessory building of 10 m² (108 sq ft) or less needs no building permit.", c.city === "winnipeg" ? "wpgProjects" : src);
          } else {
            r.add("building", a === null ? "if" : "likely", "Sheds, gazebos and workshops over 10 m² (108 sq ft) need a building permit.", src);
            if (a === null) r.ask("How big is it?", [["10 m² (108 sq ft) or less (e.g. 8x10)", "shed is 8x10"], ["Bigger than that (e.g. 12x12)", "shed is 12x12"]]);
            if (c.city === "winnipeg") r.add("development", "if", "Accessory structures under 150 sq ft are exempt from a development permit (file the exemption declaration); larger ones may need one — confirm with the City.", "wpgDevPermits");
          }
          if (wired(t)) r.add("electrical", "likely", "Running power to the building needs an electrical permit.", c.city === "winnipeg" ? "wpgAccessory" : c.city === "edmonton" ? "yegElectrical" : "cgyBasements");
          if (plumbed(t)) r.add("plumbing", "likely", "Plumbing to the building needs a plumbing permit.", c.city === "winnipeg" ? "wpgAccessory" : null);
        } else {
          r.add("building", "if", "Many cities exempt small sheds (often around 10 m² / 108 sq ft). Check your local size limit.", null);
        }
      }
    },
    {
      id: "addition", label: "Addition / attached garage / sunroom",
      test: function (t) { return has(t, ["addition", "attached garage", "sunroom", "sun room", "three season room", "3 season room", "screened room", "screen room", "extension", "bump out", "bump-out", "second storey", "second story", "covered porch", "enclosed porch", "porch"]); },
      run: function (r, c, t) {
        r.dig = true;
        if (c.city === "winnipeg") {
          r.add("development", "likely", "All house additions and attached garages need a development permit.", "wpgAdditions");
          r.add("building", "likely", "All house additions and attached garages need a building permit.", "wpgAdditions");
          if (has(t, ["sunroom", "sun room", "three season room", "3 season room", "screened room", "screen room", "porch"])) r.chk("The City's additions page doesn't name sunrooms or porches specifically — confirm with the Permits Direct Line (204-986-5140).", "wpgAdditions");
          r.add("electrical", wired(t) ? "likely" : "if", "Electrical work in the addition needs its own permit.", "wpgAdditions");
          if (plumbed(t)) r.add("plumbing", "likely", "Plumbing work in the addition needs its own permit.", "wpgAdditions");
        } else {
          r.add("building", "likely", "Additions normally need a building permit.", c.city === "calgary" ? "cgySheds" : null);
          r.add("development", "if", "Additions often need a development permit (setbacks, size).", null);
          if (wired(t)) r.add("electrical", "likely", "Wiring in the addition.", null);
        }
      }
    },
    {
      id: "newhouse", label: "New house",
      test: function (t) { return has(t, ["new house", "new home", "build a house", "build a home", "infill", "custom home", "~rebuild", "new build", "~build (a )?new house"]); },
      run: function (r, c) {
        ["development", "building"].forEach(function (p) { r.add(p, "likely", "A new house needs development and building approval.", c.city === "winnipeg" ? "wpgDevPermits" : null); });
        ["electrical", "plumbing"].forEach(function (p) { r.add(p, "likely", "New-house trade permits.", null); });
        r.add("gas", "if", "Gas service and appliances, if the house has gas.", c.city === "winnipeg" ? "mbGas" : null);
        r.chk("New houses have many more steps (lot grading, servicing, inspections). Call the City early.", null);
        r.dig = true;
      }
    },
    {
      id: "fence", label: "Fence",
      test: function (t) { return has(t, ["fence", "privacy screen", "privacy fence"]) && !has(t, ["pool fence", "~fence (for|around) (the |a )?pool"]); },
      run: function (r, c, t, d) {
        var h = d.heightMm; r.dig = true;
        if (c.city === "winnipeg") {
          r.no("Fences for single/two-family homes need no permit in Winnipeg — but height limits still apply: 2.0 m (6 ft 6 in) in rear and side yards, 1.2 m (4 ft) in front yards (City fence brochure, Mar 2023). On a corner lot, the narrower street side counts as the front yard.", "wpgFences");
          if (h !== null && h > 2000) r.chk("Your fence is taller than 2.0 m (6 ft 6 in) — over the City's limit. Ask the City about a variance before you build.", "wpgFences");
          if (has(t, ["commercial", "apartment", "business", "store", "warehouse"])) r.chk("Fences for anything other than single/two-family homes are not on the City's no-permit list — check with the City.", "wpgProjects");
        } else if (c.city === "calgary") {
          if (h !== null && (h > 2000)) r.add("development", "likely", "Calgary: a fence higher than 2 m (6'-6\") in the rear yard needs a permit.", "cgyFences");
          else r.no("Calgary: typically no permit for a fence up to 2 m (6'-6\") in the rear yard, 1.2 m (4 ft) in the front yard, or 0.75 m (2'-6\") inside a corner visibility triangle.", "cgyFences");
        } else if (c.city === "edmonton") {
          if (h !== null && h > 2000) r.add("development", "likely", "Edmonton: fences over 2.0 m in a rear or interior side yard (1.3 m in a front or flanking side yard) need a development permit.", "yegFences");
          else r.no("Edmonton: no permit for a fence up to 2.0 m in rear and interior side yards or 1.3 m in front and flanking side yards. A building permit is only needed if it's part of a pool or hot tub enclosure.", "yegFences");
        } else {
          r.chk("Fence permits and height limits vary by town — check with your municipality.", null);
        }
      }
    },
    {
      id: "retaining", label: "Retaining wall",
      test: function (t) { return has(t, ["retaining wall", "retaining"]); },
      run: function (r, c, t) {
        if (c.city === "calgary") r.add("building", "if", "Calgary: a permit is typically needed if the wall retains 1.2 m (4 ft) or more of soil, or walls/garden boxes within 1 m of each other add up to 1.2 m or more.", "cgyFences");
        else r.chk("Retaining walls: the rule isn't on the City's homeowner pages we checked — ask the City, especially for walls over about 1.2 m (4 ft) or near a property line.", c.city === "winnipeg" ? "wpgProjects" : null);
        r.dig = true;
      }
    },
    {
      id: "pool", label: "Pool / hot tub",
      test: function (t) { return has(t, ["pool", "swimming pool", "hot tub", "inground", "in-ground", "above ground pool", "above-ground pool", "swim spa"]) && !has(t, ["carpool", "pool table"]); },
      run: function (r, c, t) {
        var seasonal = has(t, ["above ground", "above-ground", "seasonal", "inflatable", "for the summer", "portable"]);
        var tub = has(t, ["hot tub", "swim spa"]);
        if (c.city === "winnipeg") {
          r.add("electrical", "likely", "The City requires a separate electrical permit for ALL outdoor pools and hot tubs/spas.", "wpgPools");
          if (seasonal) r.no("Seasonal (removable) pools need no building permit — but they must meet the Winnipeg Building By-law fencing rules.", "wpgPools");
          else if (tub) r.add("building", "if", "A building permit is needed for outdoor hot tubs/spas that hold 600 mm (2 ft) or more of water; the City says seasonal hot tubs don't need one. Check which yours is.", "wpgPools");
          else { r.add("building", "likely", "Outdoor pools that hold 600 mm (2 ft) or more of water need a building permit. In-ground pool structural designs must be sealed by a structural engineer.", "wpgPools"); r.dig = true; }
          if (!seasonal) r.add("development", "if", "Check the development-permit requirements and exemptions for your pool.", "wpgPools");
          r.note("Pool fences: at least 1.5 m (5 ft) high; the City has a separate pool-fence booklet. A deck around the pool needs its own permits.", "wpgFences");
          if (has(t, ["deck"])) r.note("A hot tub on a deck needs structural plans showing the deck can carry the tub's weight.", "wpgDecks");
        } else if (c.city === "edmonton") {
          r.add("building", "if", "Pools and hot tubs: Edmonton requires a building permit for the pool/hot tub enclosure fence. Check with the City for the pool itself.", "yegFences");
          r.add("electrical", "likely", "Pool/hot tub wiring needs an electrical permit (homeowners can't do pool grounding).", "yegElectrical");
        } else {
          r.add("building", "if", "Many cities require a building permit for pools deeper than about 0.6 m and rules for the fence around them.", null);
          r.add("electrical", "likely", "Pool and hot tub wiring.", null);
        }
      }
    },
    {
      id: "solar", label: "Solar panels",
      test: function (t) { return has(t, ["solar", "solar panel", "photovoltaic", "pv system", "pv panel"]); },
      run: function (r, c) {
        if (c.city === "winnipeg") {
          r.add("building", "likely", "All wall- and roof-mounted (and ground-mounted) solar PV installations need a building permit, with a sealed structural engineer's report.", "wpgSolar");
          r.add("electrical", "likely", "Solar PV electrical permits can ONLY be obtained by a City-licensed electrical contractor — homeowner installations are not permitted.", "wpgSolar");
          r.no("No development permit for roof systems mounted 8 ft or more above grade, or ground-mounted systems — but you still attach the Declaration Form for Development Permit Exemption.", "wpgSolar");
        } else {
          r.add("building", "if", "Solar installations usually need a building permit.", null);
          r.add("electrical", "likely", "Solar electrical work" + (c.city === "edmonton" ? " — Edmonton homeowners (not master electricians) can't take this permit." : "."), c.city === "edmonton" ? "yegElectrical" : null);
        }
      }
    },
    {
      id: "woodstove", label: "Wood stove / fireplace",
      test: function (t) { return has(t, ["wood stove", "woodstove", "wood burning", "wood-burning", "pellet stove", "solid fuel", "wood fireplace"]) || (has(t, ["fireplace"]) && !has(t, ["gas fireplace", "electric fireplace"])); },
      run: function (r, c, t) {
        if (c.city === "winnipeg") {
          r.add("building", "likely", "Installing a solid-fuel (wood) appliance needs a building permit; a WETT-certified inspection report is required after installation. No development permit.", "wpgStoves");
          r.add("electrical", "likely", "Separate electrical permit for the required carbon monoxide detectors and related electrical work.", "wpgStoves");
          if (has(t, ["fireplace"]) && !has(t, ["wood"])) r.chk("Is the fireplace wood-burning or gas? Gas fireplaces need a provincial gas permit by a licensed gas fitter instead.", "mbGas");
        } else {
          r.add("building", "if", "Wood stoves and fireplaces usually need a building permit and an inspection.", c.city === "edmonton" ? "yegReno" : null);
        }
      }
    },
    {
      id: "foundation", label: "Foundation repair",
      test: function (t) { return has(t, ["foundation", "underpinning", "underpin", "teleposts", "telepost", "weeping tile", "weeping", "waterproofing", "damp proofing", "dampproofing", "piles", "~crack(ed|s)? .*wall", "beam end"]); },
      run: function (r, c, t) {
        var exempt = has(t, ["weeping", "waterproofing", "waterproof", "damp proofing", "dampproofing", "membrane", "seal the crack", "seal a crack"]);
        var structural = has(t, ["teleposts", "telepost", "post", "posts", "brace", "bracing", "beam", "underpin", "underpinning", "piles", "structural", "replace", "replacing", "lift", "level"]);
        if (c.city === "winnipeg") {
          if (exempt && !structural) r.no("Excavating and applying damp-proofing/waterproofing, or repairing sections of weeping tile, needs no building permit.", "wpgFoundation");
          else if (structural) r.add("building", "likely", "Placing or replacing any structural part of a foundation (e.g. wood columns to steel teleposts, bracing walls) needs a building permit, and ALL structural foundation repairs must be sealed by a structural engineer.", "wpgFoundation");
          else { r.add("building", "if", "Foundation work that places or replaces structural components needs a building permit (engineer-sealed). Waterproofing and weeping tile repairs do not.", "wpgFoundation"); r.chk("Underpinning, piles and sump pits aren't covered on the City's foundation page — confirm with the City.", "wpgFoundation"); }
        } else {
          r.add("building", structural ? "likely" : "if", "Structural foundation repairs usually need a building permit and an engineer.", null);
        }
        if (has(t, ["dig", "excavat", "weeping"])) r.dig = true;
      }
    },
    {
      id: "demolition", label: "Demolition",
      test: function (t) { return has(t, ["demolish", "demolition", "tear down", "teardown", "knock down", "take down", "~(tear|knock|take) (it |the )?down", "remove the (old )?(garage|shed|house|deck)"]); },
      run: function (r, c, t, d) {
        if (c.city === "winnipeg") {
          var small = has(t, ["shed", "playhouse"]) && d.areaSqFt !== null && d.areaSqFt <= 107.6;
          if (small) r.no("Detached accessory structures under 10 m² (108 sq ft) are exempt from the demolition permit.", "wpgDemolition");
          else r.add("demolition", "likely", "A demolition permit is needed to demolish any building or structure, or part of one (except detached accessory structures under 10 m²).", "wpgDemolition");
          r.note("Demolition — the applicant must arrange: Manitoba Hydro electric/gas disconnect and meter removal (before the permit is issued), water shut-off and meter removal with Water and Waste, telephone/cable disconnects, and a concrete plug in any abandoned sewer line. Asbestos: see the City's demolition FAQ.", "wpgDemolition");
        } else {
          r.add("demolition", "likely", "Demolishing a building normally needs a demolition permit and utility disconnections first.", null);
        }
      }
    },
    {
      id: "electrical", label: "Electrical work",
      test: function (t) { return has(t, ["electrical", "wiring", "rewire", "re-wire", "outlet", "outlets", "receptacle", "plug", "plugs", "pot lights", "potlights", "light fixture", "lights", "panel", "breaker", "subpanel", "sub-panel", "200 amp", "100 amp", "amp service", "service upgrade", "ev charger", "car charger", "electric vehicle", "generator", "transfer switch", "baseboard heater", "hot tub wiring", "switch", "light switch", "ceiling fan", "electrician"]); },
      run: function (r, c, t) {
        var swap = has(t, ["replace", "swap", "change", "new"]) && has(t, ["light fixture", "fixture", "switch", "light switch", "outlet", "receptacle", "ceiling fan"]) &&
          !has(t, ["add", "adding", "extra", "more", "move", "moving", "relocate", "new circuit", "rewire", "panel", "pot lights", "potlights", "basement", "kitchen", "garage"]);
        var contractorOnly = has(t, ["ev charger", "car charger", "electric vehicle", "generator", "transfer switch", "200 amp", "amp service", "service upgrade", "solar", "grow"]) || /\b([3-9]\d\d) ?amp/.test(t);
        if (c.city === "winnipeg") {
          if (swap) { r.no("Replacing a light fixture, switch or receptacle in the same spot in an owner-occupied single detached house needs no electrical permit (if the existing branch circuit is unchanged).", "wpgElectrical"); return; }
          r.add("electrical", "likely", "Inside Winnipeg, the City issues electrical permits for building, altering, repairing or extending electrical systems.", "wpgElectrical",
            contractorOnly ? "This job (EV charger / generator / transfer switch / service / over 200 A / solar) must be done under a City-licensed electrical contractor's permit — homeowners can't take this one." : null);
        } else if (c.city === "edmonton") {
          r.add("electrical", "likely", "Edmonton: a permit is needed to install, alter or add to an electrical system.", "yegElectrical", has(t, ["panel", "service", "amp"]) ? "Homeowners who aren't master electricians can't work on the main service panel." : null);
        } else if (c.city === "calgary") {
          r.add("electrical", "likely", "Calgary: a separate electrical permit is needed for electrical installations and renovations.", "cgyBasements");
        } else {
          r.add("electrical", "likely", "Most electrical work beyond like-for-like fixture swaps needs a permit.", null);
          r.note("In Manitoba outside the City of Winnipeg, electrical permits come from Manitoba Hydro (ePermits).", "mbHydro");
        }
      }
    },
    {
      id: "plumbing", label: "Plumbing work",
      test: function (t) { return has(t, ["plumbing", "pipes", "re-pipe", "repipe", "water line", "water service", "sewer line", "sewer", "drain", "drains", "toilet", "sink", "shower", "bathtub", "faucet", "backwater valve", "sump pit", "sump pump", "laundry", "dishwasher", "~bathroom (reno|renovation|remodel)", "~(reno|renovation|remodel).* bathroom"]); },
      run: function (r, c, t) {
        var minor = has(t, ["leak", "leaking", "clog", "clogged", "stoppage", "unclog", "blocked"]);
        var sameSpot = has(t, ["replace", "swap", "new"]) && has(t, ["toilet", "sink", "faucet"]) && !has(t, ["move", "moving", "relocate", "add", "adding", "bathroom", "basement", "kitchen reno", "renovation", "remodel", "plumbing for"]);
        if (c.city === "winnipeg") {
          if (minor) { r.no("Repairing a leak or clearing a stoppage needs no plumbing permit.", "wpgPlumbing"); return; }
          if (sameSpot) { r.no("Replacing a fixture (sink, toilet) in the same location without modifying the plumbing needs no plumbing permit.", "wpgPlumbing"); return; }
          if (has(t, ["sump pit", "sump pump", "backwater valve"])) { r.add("plumbing", "if", "Sump pits and backwater valves appear on the City's building/plumbing forms — check with the City which permits your job needs.", "wpgPlumbing"); r.chk("Sump pit / backwater valve: confirm the permit with the City (204-986-5140).", "wpgPlumbing"); return; }
          r.add("plumbing", "likely", "Building, altering, repairing or extending plumbing (including replacing water lines) needs a plumbing permit.", "wpgPlumbing");
        } else if (c.city === "edmonton") {
          if (minor || sameSpot) { r.no("Edmonton: replacing a fixture in the same location or maintaining an existing system needs no plumbing permit.", "yegPlumbing"); return; }
          r.add("plumbing", "likely", "Edmonton: installing or altering plumbing needs a permit (provincial Safety Codes Act).", "yegPlumbing");
        } else if (c.city === "calgary") {
          if (minor || sameSpot) { r.chk("Like-for-like fixture swaps and repairs: check with the City.", null); return; }
          r.add("plumbing", "likely", "Calgary: a separate plumbing permit is required for all new plumbing installations.", "cgyBasements");
        } else {
          if (minor) { r.chk("Small repairs usually need no permit — check locally.", null); return; }
          r.add("plumbing", "likely", "New or altered plumbing usually needs a permit.", null);
        }
      }
    },
    {
      id: "waterheater", label: "Hot water tank",
      test: function (t) { return has(t, ["hot water tank", "water heater", "hot water heater", "tankless"]); },
      run: function (r, c) {
        if (c.city === "edmonton") r.add("gas", "likely", "Edmonton: installing, altering or relocating gas equipment (water heaters included) needs a gas permit.", "yegGas");
        else {
          r.chk("Replacing a hot water tank: the City pages we checked don't say whether a like-for-like swap needs a City permit — ask the City. If it's gas-fired, the gas connection needs a gas permit by a licensed gas fitter" + (c.city === "winnipeg" ? " (Province of Manitoba)." : "."), c.city === "winnipeg" ? "mbGas" : null);
          r.add("gas", "if", "If the tank is gas-fired: a gas permit, applied for by a licensed gas fitter.", c.city === "winnipeg" ? "mbGas" : null);
        }
      }
    },
    {
      id: "hvac", label: "Heating / cooling",
      test: function (t) { return has(t, ["furnace", "air conditioner", "air conditioning", "central air", "heat pump", "hvac", "ductwork", "ducts", "hrv", "erv", "boiler", "ventilation", "make-up air", "rooftop unit", "mini split", "mini-split"]); },
      run: function (r, c, t) {
        var gasEquip = has(t, ["furnace", "boiler", "gas"]) && !has(t, ["electric furnace"]);
        if (c.city === "winnipeg") {
          r.add("mechanical", "if", "HVAC work is permitted by the City to holders of a City mechanical (M1) licence. Whether a like-for-like furnace/AC swap in a house needs a City permit is not stated on the City's pages — check with the City.", "wpgMechLicence");
          if (gasEquip) r.add("gas", "likely", "Gas appliances (furnace, boiler): a gas permit is required before installing or altering gas equipment; only a licensed gas fitter can apply.", "mbGas");
        } else if (c.city === "edmonton") {
          if (gasEquip) r.add("gas", "likely", "Edmonton: a gas permit is required to install, alter or relocate gas equipment such as furnaces.", "yegGas");
          r.chk("Edmonton heating/ventilation permits: check the City's heating & ventilation permit page.", null);
        } else {
          r.add("mechanical", "if", "Heating and cooling equipment usually needs a mechanical and/or gas permit, pulled by the licensed contractor.", null);
          if (gasEquip) r.add("gas", "likely", "Gas equipment needs a gas permit by a licensed gas fitter.", c.city === "calgary" ? "cgyBasements" : null);
        }
      }
    },
    {
      id: "gas", label: "Gas line / gas appliance",
      test: function (t) { return has(t, ["gas line", "gas lines", "gas pipe", "gas piping", "gas fireplace", "gas stove", "gas range", "gas bbq", "gas dryer", "natural gas", "propane", "gas fire pit", "~gas .*(bbq|barbecue|stove|range|dryer|fireplace|heater)", "~(bbq|barbecue|stove|range|dryer).* gas line"]); },
      run: function (r, c, t) {
        if (c.city === "winnipeg") r.add("gas", "likely", "Any installation, alteration or addition of gas piping or gas equipment needs a gas permit first. Only a licensed person can apply.", "mbGas");
        else if (c.city === "edmonton") r.add("gas", "likely", "Edmonton: a gas permit is required when installing, altering or relocating gas equipment.", "yegGas", has(t, ["line", "pipe", "piping"]) ? "A homeowner may NOT install a new gas line — a qualified contractor must." : null);
        else if (c.city === "calgary") r.add("gas", "likely", "Calgary: gas work needs a gas permit (homeowners may take one for a gas fireplace in their own home).", "cgyBasements");
        else r.add("gas", "likely", "Gas work needs a gas permit from a licensed gas fitter.", null);
      }
    },
    {
      id: "reno", label: "Renovation",
      test: function (t) {
        return has(t, ["renovation", "remodel", "new kitchen", "new bathroom", "add a bathroom", "adding a bathroom", "extra bathroom", "~(kitchen|bathroom|ensuite) .*(redo|gut|update|upgrade|makeover|refresh)", "~(redo|gut|update|upgrade|refresh) .*(kitchen|bathroom|ensuite)", "open concept", "open-concept", "load bearing", "load-bearing", "remove a wall", "remove wall", "knock out a wall", "take out a wall", "move a wall", "new bedroom", "add a bedroom", "convert", "structural", "beam", "~wall .*(remove|removal|open)", "~(remove|removing|knock|take) .*wall", "fire damage", "flood damage"]);
      },
      skipIf: ["basement", "suite"],
      run: function (r, c, t) {
        var cosmeticOnly = !has(t, ["move", "moving", "relocate", "wall", "bedroom", "open concept", "open-concept", "structural", "beam", "load", "window", "door", "add", "adding", "new bathroom", "layout", "convert", "plumbing", "sink", "toilet", "shower", "electrical", "pot lights", "wiring", "outlets", "remodel", "renovation", "gut", "fire damage", "flood damage"]) &&
          has(t, ["cabinets", "countertop", "countertops", "backsplash", "paint", "painting", "flooring", "tile"]);
        if (cosmeticOnly) { r.no("Cosmetic work (painting, flooring, cabinets, millwork) needs no building permit.", c.city === "winnipeg" ? "wpgReno" : c.city === "edmonton" ? "yegReno" : null); return; }
        var structural = has(t, ["load bearing", "load-bearing", "structural", "beam", "remove a wall", "remove wall", "move a wall", "open concept", "open-concept", "~wall .*(remove|removal|open)", "~(remove|removing|knock|take) .*wall"]);
        if (c.city === "winnipeg") {
          r.add("building", structural || has(t, ["bedroom", "convert"]) ? "likely" : "likely", "Kitchens, bathrooms, adding or converting rooms to bedrooms, open-concept changes and new/larger exterior openings may need a building permit (Winnipeg Building By-law).", "wpgReno");
          if (structural) r.note("Moving or removing load-bearing walls needs structural drawings with the application, and engineering may be required.", "wpgReno");
          if (has(t, ["kitchen", "bathroom"]) && !structural && !has(t, ["move", "moving", "relocate", "add", "adding", "layout"])) r.chk("A like-for-like kitchen or bathroom refresh (no layout, wall, plumbing or wiring changes) may not need a building permit — confirm with the City.", "wpgReno");
        } else if (c.city === "calgary") {
          r.add("building", structural ? "likely" : "if", "Calgary: structural changes such as moving or removing walls need a building permit.", "cgyBasements");
        } else if (c.city === "edmonton") {
          r.add("building", "likely", "Edmonton: structural changes and building or finishing a living room, bedroom or bathroom need a permit.", "yegReno");
        } else {
          r.add("building", structural ? "likely" : "if", "Structural and layout changes normally need a building permit.", null);
        }
        if (has(t, ["bathroom"]) || has(t, ["~(mov|relocat|add)\\w* (the |a )?(sink|toilet|shower|tub|dishwasher)", "~(sink|toilet|shower|dishwasher).* (mov|relocat)"])) r.add("plumbing", "likely", "Moving or adding plumbing fixtures.", c.city === "winnipeg" ? "wpgPlumbing" : null);
        if (has(t, ["kitchen", "bathroom"]) && !r.permits.electrical) r.add("electrical", "if", "If you add or move outlets, lights or circuits.", c.city === "winnipeg" ? "wpgElectrical" : null);
      }
    },
    {
      id: "windows", label: "Windows / doors",
      test: function (t) { return has(t, ["window", "door", "patio door", "egress", "skylight"]) && !has(t, ["garage door opener"]); },
      run: function (r, c, t) {
        var bigger = has(t, ["bigger", "larger", "enlarge", "widen", "new opening", "egress", "cut in", "add a window", "add a door", "new window opening", "skylight", "add window", "add door", "~new (window|door) (in|into|where)"]);
        var same = has(t, ["same size", "same-size", "replace", "replacing", "replacement", "swap"]) && !bigger;
        if (c.city === "winnipeg") {
          if (same) r.no("Replacing doors and windows with the same size needs no permit.", "wpgProjects");
          else if (bigger) r.add("building", "likely", "New or larger exterior door or window openings need a building permit (site plan and elevations required).", "wpgReno");
          else r.ask("Are the windows/doors the same size as the old ones?", [["Same size", "same size windows"], ["New or bigger openings", "bigger window openings"]]);
        } else if (c.city === "edmonton") {
          if (same && has(t, ["same size"])) r.chk("Edmonton lists 'adding or changing the size of a window or exterior door' as needing a permit; same-size replacement isn't listed — confirm with the City.", "yegReno");
          else r.add("building", bigger ? "likely" : "if", "Edmonton: adding or changing the size of a window or exterior door needs a permit.", "yegReno");
        } else {
          if (same) r.chk("Same-size window/door replacement often needs no permit — confirm with your City.", null);
          else r.add("building", bigger ? "likely" : "if", "New or larger openings in an exterior wall usually need a building permit.", null);
        }
      }
    },
    {
      id: "roof", label: "Roof",
      test: function (t) { return has(t, ["roof", "roofing", "reshingle", "shingles", "re-roof"]) && !has(t, ["solar", "deck roof", "~roof over", "covered deck"]); },
      run: function (r, c, t) {
        var structural = has(t, ["truss", "trusses", "rafter", "rafters", "raise the roof", "new roof line", "roofline", "structural", "change the pitch", "dormer", "sheathing"]);
        var otherMaterial = has(t, ["metal roof", "steel roof", "tile roof", "different", "switch to", "change to"]);
        if (c.city === "winnipeg") {
          if (structural) { r.add("building", "likely", "Structural roof changes are a structural alteration — expect a building permit.", null); r.chk("Structural roof work: confirm the permit and any engineering with the City.", "wpgProjects"); }
          else if (otherMaterial) r.chk("Re-roofing with a DIFFERENT material isn't on the City's no-permit list (only same-material shingles are) — check with the City.", "wpgProjects");
          else r.no("Replacing shingles with the same material needs no permit.", "wpgProjects");
        } else {
          if (structural) r.add("building", "likely", "Structural roof changes normally need a building permit.", null);
          else r.chk("Re-shingling like-for-like often needs no permit — confirm with your City.", null);
        }
      }
    },
    {
      id: "siding", label: "Siding / stucco",
      test: function (t) { return has(t, ["siding", "stucco", "cladding", "exterior finish", "vinyl siding", "hardie"]); },
      run: function (r, c, t) {
        var same = has(t, ["same", "like for like", "like-for-like"]);
        if (c.city === "winnipeg") {
          if (same) r.no("Replacing stucco or siding with the same material needs no permit.", "wpgProjects");
          else r.chk("Changing to a DIFFERENT siding/stucco material isn't on the City's no-permit list — check with the City. (Same-material replacement needs no permit.)", "wpgProjects");
        } else if (c.city === "edmonton") r.add("building", "likely", "Edmonton: changing the exterior finish material of a house needs a permit.", "yegReno");
        else r.chk("Siding replacement: check with your City.", null);
      }
    },
    {
      id: "cosmetic", label: "Interior finishing",
      test: function (t) { return has(t, ["paint", "painting", "flooring", "carpet", "laminate", "hardwood", "cabinets", "countertop", "countertops", "backsplash", "trim", "baseboards", "millwork", "shelves", "decorating", "patching", "drywall patch", "vinyl plank", "tile floor"]); },
      run: function (r, c) {
        r.no(c.city === "winnipeg" ? "Interior work like painting, patching, decorating, flooring, millwork, and installing cabinets or shelves needs no permit." : "Painting, flooring and cabinets usually need no permit.", c.city === "winnipeg" ? "wpgProjects" : c.city === "edmonton" ? "yegReno" : null);
      }
    },
    {
      id: "sign", label: "Sign",
      test: function (t) { return has(t, ["sign", "signage", "storefront sign", "pylon", "billboard", "fascia sign", "awning sign", "channel letters"]) && !has(t, ["sign off", "sign-off", "design"]); },
      run: function (r, c, t) {
        if (c.city === "winnipeg") {
          if (has(t, ["window sign", "window decal", "real estate sign", "construction sign"])) r.no("Window signs (covering 50% or less of a window), real-estate signs, construction signs and permitted temporary signs don't need a development permit.", "wpgSigns");
          else r.add("sign", "likely", "Most signs need a development permit; all signs other than face-replacements need a building permit. Applications are combined.", "wpgSigns");
        } else r.add("sign", "likely", "Permanent signs usually need a sign/development permit.", null);
      }
    },
    {
      id: "food", label: "Food business",
      test: function (t) { return has(t, ["restaurant", "cafe", "café", "coffee shop", "bakery", "commercial kitchen", "food truck", "catering", "food service", "deli", "pizzeria", "bar and grill", "ghost kitchen"]); },
      run: function (r, c) {
        if (c.city === "winnipeg") r.add("food", "likely", "Food establishments need a health permit from the public health inspector before operating; floor plans with equipment must be reviewed BEFORE construction or renovation.", "mbFood");
        else r.add("food", "likely", "Food premises need a health permit and plan review by public health.", null);
      }
    },
    {
      id: "commercial", label: "Commercial fit-out / change of use",
      test: function (t) { return has(t, ["fit-out", "fit out", "fitout", "tenant improvement", "build-out", "build out", "buildout", "change of use", "retail unit", "commercial space", "office space", "lease space", "leased space", "warehouse", "~open (a|an|my|our) .*(store|shop|cafe|restaurant|office|clinic|gym|studio|salon|bakery|business)", "commercial reno", "commercial renovation", "strip mall", "bay in", "~empty .*(unit|space)"]) && !has(t, ["home based", "home-based", "~(from|out of|at) (my|our|the) (home|house)"]); },
      run: function (r, c) {
        r.add("building", "likely", "Commercial interior work and fit-outs normally need a building permit; larger work needs drawings sealed by an architect or engineer.", c.city === "winnipeg" ? "wpgDevPermits" : null);
        r.add("development", "if", c.city === "winnipeg" ? "A new use of the space, exterior changes or signs need a development permit; interior alterations with NO change of use and no new dwelling units are exempt." : "A new use of the space usually needs development/zoning approval.", c.city === "winnipeg" ? "wpgDevPermits" : null);
        ["electrical", "plumbing", "mechanical"].forEach(function (p) { r.add(p, "if", "Trade permits for any electrical, plumbing or HVAC work in the space.", null); });
        r.chk("Commercial projects: confirm occupancy, fire-safety and accessibility requirements with the City before you sign a lease or start work.", null);
        if (c.city === "winnipeg") r.note("Commercial development permits use the commercial/multi-unit checklist: legacy.winnipeg.ca → Development-Permit-Application-Checklist-Commercial-Multi-Unit-Residential.pdf. For commercial work by an agent, ask the City for its Letter of Authorization.", "wpgDevPermits");
      }
    },
    {
      id: "homebiz", label: "Home-based business",
      test: function (t) { return has(t, ["home based business", "home-based business", "home business", "~(business|salon|studio|shop|clinic|office|daycare|bakery) (from|out of|at|in) (my|our|the) (home|house)", "~(from|out of) (my|our) (home|house)"]); },
      run: function (r, c) {
        if (c.city === "winnipeg") {
          r.add("development", "likely", "Home-based businesses need a development permit (home-based business application form).", "wpgDevPermits");
          r.note("Home-based business development permit form: legacy.winnipeg.ca/ppd/Documents/Permits/HomeBasedBusiness/Home-Based-Business-Development-Permit-Application-Form.pdf", "wpgHomeBiz");
          r.chk("A home daycare, food business or salon may also need provincial licensing — ask the City and the Province.", null);
        } else r.add("development", "if", "Home businesses usually need a development permit or business licence — check with your City.", null);
      }
    },
    {
      id: "fire", label: "Sprinklers / fire alarm",
      test: function (t) { return has(t, ["sprinkler", "sprinklers", "fire alarm", "fire suppression", "standpipe", "kitchen hood", "suppression system"]) && !has(t, ["lawn sprinkler", "irrigation"]); },
      run: function (r, c) {
        r.chk(c.city === "winnipeg" ? "Sprinkler systems are permitted by the City to holders of an M2 mechanical licence; commercial cooking hood systems need an M3 installer. Fire-alarm permits: check with the City." : "Sprinkler, fire-alarm and suppression systems are permitted to licensed contractors — check with your City/fire department.", c.city === "winnipeg" ? "wpgMechLicence" : null);
        r.add("mechanical", "if", "Fire-protection / special mechanical systems (licensed contractor).", c.city === "winnipeg" ? "wpgMechLicence" : null);
      }
    },
    {
      id: "environmental", label: "Environmental / hazardous",
      test: function (t) { return has(t, ["contaminated", "contamination", "remediation", "asbestos", "vermiculite", "spill", "oil tank", "fuel tank", "underground tank", "wetland", "hazardous", "mould remediation", "mold remediation", "lead paint"]); },
      run: function (r) {
        r.chk("Asbestos, contamination, buried tanks or spills: bring in a qualified environmental professional. Provincial rules apply and this is past a self-serve checklist. (For demolitions, see the City's asbestos FAQ.)", null);
      }
    },
    {
      id: "street", label: "Work on City property",
      test: function (t) { return has(t, ["dumpster on the street", "bin on the street", "on the boulevard", "boulevard", "sidewalk", "road closure", "lane closure", "crane", "hoarding", "driveway approach", "curb cut", "~(bin|dumpster|scaffold\\w*) .*(street|road|sidewalk|lane)"]); },
      run: function (r, c) {
        if (c.city === "winnipeg") r.chk("Crossing or using City property (boulevard, sidewalk, street) other than an existing private approach needs a permit from Public Works: 204-986-6006 or pwd-uos-permits@winnipeg.ca.", "wpgDecks");
        else r.chk("Using the street, sidewalk or boulevard (bins, scaffolding, closures, new driveway approaches) usually needs a separate City permit — ask 311.", null);
      }
    },
    {
      id: "driveway", label: "Driveway / patio / landscaping",
      test: function (t) { return has(t, ["driveway", "concrete patio", "paving stones", "pavers", "interlock", "landscaping", "sod", "garden bed", "raised bed"]); },
      run: function (r, c) {
        r.chk("Driveways, patios and landscaping aren't on the City's homeowner permit pages we checked. Ground-level landscaping usually needs no building permit, but a NEW driveway or curb cut onto the street needs City approval, and lot grading/drainage rules apply — check with the City.", c.city === "winnipeg" ? "wpgProjects" : null);
        r.dig = true;
      }
    }
  ];

  function check(desc, cityIn) {
    var cityKey = String(cityIn || "").toLowerCase();
    if (!CITY[cityKey]) cityKey = "other";
    var raw = String(desc || "");
    var t = normalize(raw);
    var d = parseDims(raw);
    var r = new Result(cityKey);
    var ctx = { city: cityKey };
    var hit = {};
    PROJECTS.forEach(function (p) { if (p.test(t, raw)) hit[p.id] = true; });
    PROJECTS.forEach(function (p) {
      if (!hit[p.id]) return;
      if (p.skipIf && p.skipIf.some(function (s) { return hit[s]; })) return;
      r.projects.push(p.label);
      p.run(r, ctx, t, d);
    });
    if (r.dig) r.note(DIG_NOTE, null);
    // Build final permit list with city-specific details
    var defs = PERMITS[cityKey] || {};
    r.list = r.order.map(function (k) {
      var p = r.permits[k], def = defs[k];
      return {
        type: k, status: p.status, why: p.why, extra: p.extra,
        name: def ? def.name : GENERIC[k],
        issuer: def ? def.issuer : "Your local authority",
        who: def ? def.who : "The owner or the licensed contractor doing the work — confirm locally.",
        apply: def ? def.apply : [],
        gather: def ? def.gather : [],
        srcs: p.srcs.concat(def && def.src && p.srcs.indexOf(def.src) < 0 ? [def.src] : []).filter(Boolean)
      };
    });
    // order: likely first
    r.list.sort(function (a, b) { return (a.status === "likely" ? 0 : 1) - (b.status === "likely" ? 0 : 1); });
    r.dims = d;
    r.office = CITY[cityKey].office;
    r.applyMain = CITY[cityKey].apply;
    r.projectsSrc = CITY[cityKey].projects;
    r.matched = r.projects.length > 0;
    r.needNothing = r.matched && r.list.length === 0 && r.check.length === 0 && r.none.length > 0;
    return r;
  }

  return { check: check, normalize: normalize, parseDims: parseDims, SOURCES: SOURCES, CITY: CITY, CHECKED: CHECKED, PROJECTS: PROJECTS };
});
