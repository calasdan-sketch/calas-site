// Realistic plain-English job descriptions, with the permits a City plans
// examiner would expect, based on the official pages listed in
// permits/engine.js (SOURCES, read 2026-11-19).
//
// need  : permit types the tool must show (as likely or conditional)
// allow : extra permit types that are acceptable to show
// none  : true when the honest answer is "no permit needed" for this job
// check : true when the honest answer is "check with the City"
// flag  : a word that must appear somewhere in the output text (lowercase)
//
// Permit types: building, development, electrical, plumbing, mechanical,
// gas, demolition, sign, food
"use strict";
module.exports = [
  // ---------- Winnipeg homeowners ----------
  { id: 1, city: "Winnipeg", job: "Build a 12x16 deck in the backyard, about 4 ft off the ground", need: ["building", "development"] },
  { id: 2, city: "Winnipeg", job: "small ground level deck in the back yard, maybe 10 inches high", none: true },
  { id: 3, city: "Winnipeg", job: "deck", need: ["building"], allow: ["development"] },
  { id: 4, city: "Winnipeg", job: "replace the old wood fence along the back lane", none: true },
  { id: 5, city: "Winnipeg", job: "8 foot privacy fence in the backyard", none: true, flag: "2.0 m" },
  { id: 6, city: "Winnipeg", job: "put up a 8x10 shed", none: true },
  { id: 7, city: "Winnipeg", job: "12x12 shed with power run to it", need: ["building", "electrical"], allow: ["development"] },
  { id: 8, city: "Winnipeg", job: "Build a detached garage 24x24 with lights and plugs", need: ["building", "electrical"], allow: ["development"] },
  { id: 9, city: "Winnipeg", job: "finish my basement, add a bedroom and a bathroom", need: ["building", "plumbing", "electrical"], allow: ["development"] },
  { id: 10, city: "Winnipeg", job: "basement suite with its own kitchen and separate entrance to rent out", need: ["development", "building", "electrical", "plumbing"] },
  { id: 11, city: "Winnipeg", job: "replace furnace", need: ["gas"], allow: ["mechanical"] },
  { id: 12, city: "Winnipeg", job: "reshingle the roof with the same asphalt shingles", none: true },
  { id: 13, city: "Winnipeg", job: "replace all windows, same size", none: true },
  { id: 14, city: "Winnipeg", job: "make the kitchen window bigger", need: ["building"], allow: ["development"] },
  { id: 15, city: "Winnipeg", job: "kitchen reno, moving the sink and adding pot lights", need: ["building", "plumbing", "electrical"], allow: ["development"] },
  { id: 16, city: "Winnipeg", job: "bathroom remodel", need: ["building", "plumbing"], allow: ["electrical", "development"] },
  { id: 17, city: "Winnipeg", job: "paint the living room and put in new flooring", none: true },
  { id: 18, city: "Winnipeg", job: "install an above ground pool for the summer", need: ["electrical"], allow: ["building", "development"] },
  { id: 19, city: "Winnipeg", job: "inground swimming pool", need: ["building", "electrical"], allow: ["development", "plumbing"] },
  { id: 20, city: "Winnipeg", job: "add a hot tub on the patio", need: ["electrical"], allow: ["building", "development"] },
  { id: 21, city: "Winnipeg", job: "tear down the old single garage", need: ["demolition"] },
  { id: 22, city: "Winnipeg", job: "demolish the house and rebuild", need: ["demolition", "building", "development"], allow: ["electrical", "plumbing", "gas", "mechanical"] },
  { id: 23, city: "Winnipeg", job: "install an EV charger in the garage", need: ["electrical"], flag: "licensed" },
  { id: 24, city: "Winnipeg", job: "solar panels on the roof", need: ["building", "electrical"] },
  { id: 25, city: "Winnipeg", job: "install a wood stove in the family room", need: ["building", "electrical"], flag: "wett" },
  { id: 26, city: "Winnipeg", job: "foundation repair, replacing wood posts with steel teleposts", need: ["building"], flag: "engineer" },
  { id: 27, city: "Winnipeg", job: "dig out and repair weeping tile on one side", none: true },
  { id: 28, city: "Winnipeg", job: "add a sunroom addition off the back", need: ["building", "development"], allow: ["electrical", "plumbing"] },
  { id: 29, city: "Winnipeg", job: "build an attached garage", need: ["building", "development"], allow: ["electrical"] },
  { id: 30, city: "Winnipeg", job: "remove a load bearing wall for open concept", need: ["building"], allow: ["development"] },
  { id: 31, city: "Winnipeg", job: "new 200 amp panel and rewire the house", need: ["electrical"] },
  { id: 32, city: "Winnipeg", job: "run a gas line to the bbq", need: ["gas"] },
  { id: 33, city: "Winnipeg", job: "swap a light fixture in the dining room", none: true },
  // misspelled / casual
  { id: 34, city: "Winnipeg", job: "finsh basment with bathrom", need: ["building", "plumbing"], allow: ["electrical", "development"] },
  { id: 35, city: "Winnipeg", job: "bild a dek 3 feet high", need: ["building", "development"] },
  { id: 36, city: "Winnipeg", job: "new shingels", none: true },
  { id: 37, city: "Winnipeg", job: "garage 22 x 24 with plumbing for a sink", need: ["building", "electrical", "plumbing"], allow: ["development"] },
  // ambiguous
  { id: 38, city: "Winnipeg", job: "fix stuff around the house", check: true },
  // small contractors / commercial
  { id: 39, city: "Winnipeg", job: "new storefront sign for my shop", need: ["sign"], allow: ["building", "development"] },
  { id: 40, city: "Winnipeg", job: "open a small cafe in an empty retail unit", need: ["building", "food"], allow: ["development", "plumbing", "electrical", "mechanical", "gas"] },
  { id: 41, city: "Winnipeg", job: "run a hair salon out of my home", need: ["development"], allow: ["building", "plumbing", "electrical"] },
  { id: 42, city: "Winnipeg", job: "replace the hot water tank", check: true, allow: ["gas", "plumbing"] },
  // ---------- Calgary ----------
  { id: 43, city: "Calgary", job: "deck 3 ft high in the back", need: ["building"], allow: ["development"] },
  { id: 44, city: "Calgary", job: "develop the basement for the first time, rec room and bathroom", need: ["building", "electrical", "plumbing"] },
  { id: 45, city: "Calgary", job: "5 foot fence in the backyard", none: true },
  // ---------- Edmonton ----------
  { id: 46, city: "Edmonton", job: "6 ft fence in the backyard", none: true },
  { id: 47, city: "Edmonton", job: "shed 10x14", need: ["building"] },
  { id: 48, city: "Edmonton", job: "new gas line for a stove", need: ["gas"], flag: "contractor" }
];
