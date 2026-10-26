/**
 * @file robotNavigation.js
 * @description Coordinate Waypoints and Trajectory Models for Simulation and Digital Twin Visualization.
 * 
 * Thesis Context:
 * In autonomous indoor service robotics, visual simulation and planar motion planning
 * utilize discrete coordinate sequences to render path trajectories on dashboard canvases.
 * This module defines the 2D planar kinematic path vectors (translations 'move' in arbitrary grid units
 * and yaw rotations 'turn' in angular degrees) for outward journeys ('going') and return home loops ('returning')
 * corresponding to tables 1 through 4.
 * 
 * @module data/robotNavigation
 * @author Thesis Research Team
 */

/**
 * Trajectory coordinate and heading waypoint dictionary mapped by table index.
 * @type {Object.<number, {name: string, going: Array<{type: string, x?: number, y?: number, angle?: number}>, returning: Array<{type: string, x?: number, y?: number, angle?: number}>}>}
 */
export const robotPaths = {
  1: {
    name: "Table 1",
    going: [
      { type: "move", x: 0, y: 5 },
      { type: "turn", angle: 90 },
      { type: "move", x: 10, y: 5 },
    ],
    returning: [
      { type: "move", x: 10, y: 5 },
      { type: "turn", angle: -90 },
      { type: "move", x: 0, y: 0 },
    ],
  },
  2: {
    name: "Table 2",
    going: [
      { type: "move", x: 0, y: 10 },
      { type: "turn", angle: 90 },
      { type: "move", x: 10, y: 10 },
    ],
    returning: [
      { type: "move", x: 10, y: 10 },
      { type: "turn", angle: -90 },
      { type: "move", x: 0, y: 0 },
    ],
  },
  3: {
    name: "Table 3",
    going: [
      { type: "move", x: 0, y: 15 },
      { type: "turn", angle: 90 },
      { type: "move", x: 10, y: 15 },
    ],
    returning: [
      { type: "move", x: 10, y: 15 },
      { type: "turn", angle: -90 },
      { type: "move", x: 0, y: 0 },
    ],
  },
  4: {
    name: "Table 4",
    going: [
      { type: "move", x: 0, y: 20 },
      { type: "turn", angle: 90 },
      { type: "move", x: 10, y: 20 },
    ],
    returning: [
      { type: "move", x: 10, y: 20 },
      { type: "turn", angle: -90 },
      { type: "move", x: 0, y: 0 },
    ],
  },
};
