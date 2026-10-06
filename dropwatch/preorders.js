/* Pre-order status, checked by hand on each shop's own listing. Keyed by drop id.
   Re-check before trusting: pre-orders sell out within hours. */
window.PREORDERS = {
  "ptcg-delta-reign": {
    checked: "2026-10-05",
    opens: "",            // day pre-orders open (YYYY-MM-DD) when a shop announces it; glows green on the calendar
    status: "Open now at some shops (checked Oct 5); sold out at most.",
    shops: [
      {name: "Banana Games", url: "https://bananagames.ca/search?q=delta+reign", ships: "ships in Canada", items: [
        ["Booster Bundle", "C$109.95", true], ["Build & Battle Kit", "C$84.95", true],
        ["Elite Trainer Box + acrylic case", "C$279.95", true], ["Booster Box + acrylic case", "C$449.95", true],
        ["Elite Trainer Box", "C$249.95", false], ["Booster Box", "C$459.95", false]]},
      {name: "Hobbiesville", url: "https://www.hobbiesville.com/collections/pokemon-delta-reign", ships: "ships in Canada", items: [
        ["Elite Trainer Box", "C$99.95", false], ["Booster Box", "C$349.95", false], ["Build & Battle", "C$44.95", false]]},
      {name: "401 Games", url: "https://store.401games.ca/collections/mega-evolution-delta-reign", ships: "ships in Canada", items: [
        ["Every Delta Reign pre-order", "", false]]},
      {name: "Pokémon Center", url: "https://www.pokemoncenter.com/en-ca/search/delta-reign", ships: "official store", items: [
        ["Listed — price and stock not checked", "", null]]}
    ],
    note: "Sold out at normal prices at most shops. The open ones above are well over retail (an Elite Trainer Box is usually about C$70–100), so you'd be paying a reseller's price before it's even out. Walmart, Best Buy and EB Games weren't checked. Prerelease events (play the new cards early) run in late October at local game stores — ask yours."
  }
};
