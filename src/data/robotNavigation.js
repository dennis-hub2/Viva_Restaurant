/**
 * Robot Navigation Data
 * Contains 'going' and 'returning' paths for each table.
 * Each path is an array of waypoint coordinates or commands.
 */

export const robotPaths = {
  1: {
    name: "Table 1",
    going: [
      { type: "move", x: 0, y: 5 },
      { type: "turn", angle: 90 },
      { type: "move", x: 10, y: 5 }
    ],
    returning: [
      { type: "move", x: 10, y: 5 },
      { type: "turn", angle: -90 },
      { type: "move", x: 0, y: 0 }
    ]
  },
  2: {
    name: "Table 2",
    going: [
      { type: "move", x: 0, y: 10 },
      { type: "turn", angle: 90 },
      { type: "move", x: 10, y: 10 }
    ],
    returning: [
      { type: "move", x: 10, y: 10 },
      { type: "turn", angle: -90 },
      { type: "move", x: 0, y: 0 }
    ]
  },
  3: {
    name: "Table 3",
    going: [
      { type: "move", x: 0, y: 15 },
      { type: "turn", angle: 90 },
      { type: "move", x: 10, y: 15 }
    ],
    returning: [
      { type: "move", x: 10, y: 15 },
      { type: "turn", angle: -90 },
      { type: "move", x: 0, y: 0 }
    ]
  },
  4: {
    name: "Table 4",
    going: [
      { type: "move", x: 0, y: 20 },
      { type: "turn", angle: 90 },
      { type: "move", x: 10, y: 20 }
    ],
    returning: [
      { type: "move", x: 10, y: 20 },
      { type: "turn", angle: -90 },
      { type: "move", x: 0, y: 0 }
    ]
  },
  5: {
    name: "Table 5",
    going: [
      { type: "move", x: 0, y: 25 },
      { type: "turn", angle: 90 },
      { type: "move", x: 10, y: 25 }
    ],
    returning: [
      { type: "move", x: 10, y: 25 },
      { type: "turn", angle: -90 },
      { type: "move", x: 0, y: 0 }
    ]
  }
};
