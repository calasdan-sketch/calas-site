// Held-out job descriptions written AFTER the engine was built, to check it
// generalizes rather than fitting cases.js. Same format as cases.js.
"use strict";
module.exports = [
  { id: 101, city: "Winnipeg", job: "We want to put a 10 x 20 deck off the back patio door, its about 3 feet up", need: ["building", "development"] },
  { id: 102, city: "Winnipeg", job: "new chain link fence front yard 4ft", none: true },
  { id: 103, city: "Winnipeg", job: "Convert the spare room into a bedroom", need: ["building"], allow: ["development", "electrical"] },
  { id: 104, city: "Winnipeg", job: "redo the ensuite, new shower and move the toilet", need: ["building", "plumbing"], allow: ["electrical", "development"] },
  { id: 105, city: "Winnipeg", job: "install central air conditioning", need: ["mechanical"], allow: ["electrical", "gas"] },
  { id: 106, city: "Winnipeg", job: "gas fireplace in the living room", need: ["gas"], allow: ["electrical", "building"] },
  { id: 107, city: "Winnipeg", job: "build a 10x12 greenhouse", need: ["building"], allow: ["development"] },
  { id: 108, city: "Winnipeg", job: "replace our front door, same size", none: true },
  { id: 109, city: "Winnipeg", job: "add outlets in the garage", need: ["electrical"] },
  { id: 110, city: "Winnipeg", job: "carport", need: ["building", "electrical"], allow: ["development"] },
  { id: 111, city: "Winnipeg", job: "two storey addition on the back of the house with a bathroom", need: ["building", "development", "plumbing"], allow: ["electrical"] },
  { id: 112, city: "Winnipeg", job: "garden suite in the backyard for my mom", need: ["development", "building", "electrical", "plumbing"] },
  { id: 113, city: "Winnipeg", job: "replace the vinyl siding with the same vinyl siding", none: true },
  { id: 114, city: "Winnipeg", job: "remove asbestos tiles in basement", check: true, allow: ["building", "electrical", "plumbing"] },
  { id: 115, city: "Winnipeg", job: "restaurant renovation with new kitchen hood", need: ["food", "building"], allow: ["development", "electrical", "plumbing", "mechanical", "gas"] },
  { id: 116, city: "Winnipeg", job: "office fit-out in a leased bay, new walls and lighting", need: ["building", "electrical"], allow: ["development", "plumbing", "mechanical"] },
  { id: 117, city: "Winnipeg", job: "knock down the shed", need: ["demolition"] },
  { id: 118, city: "Winnipeg", job: "bathroom fan replacement", check: true, allow: ["electrical", "mechanical"] },
  { id: 119, city: "Calgary", job: "covered deck with a roof", need: ["building"], allow: ["development"] },
  { id: 120, city: "Edmonton", job: "finish the basement with a bedroom", need: ["building", "electrical"], allow: ["plumbing"] },
  { id: 121, city: "Other", job: "build a deck", need: ["building"] },
  { id: 122, city: "Other", job: "rewire the kitchen", need: ["electrical"], allow: ["building"] }
];
