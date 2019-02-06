// Step detection, using the phone's accelerometer.
//
import {
  accelerometer,
  magnetometer,
  gyroscope,
  setUpdateIntervalForType,
  SensorTypes
} from "react-native-sensors";
import _ from "lodash";
import LPF from 'lpf';
class BestFitAlgorithm {
  constructor() {
    var self = this;

    self.route_headings = [];
    self.detected_headings = [];
    self.matrix = [];
  }
  score(alpha, beta) {
    let diff = 180.0 - Math.abs(Math.abs(alpha - beta) - 180.0);
    if (diff <= 45.0) {
      return 0.0;
    }
    else if (diff <= 90.0) {
      return 1.0;
    }
    else if (diff <= 120.0) {
      return 2.0;
    }
    else {
      return 10.0;
    }
  }
  get_score(m, s) {
    var self = this;
    if (m == 0 || s == 0) {
      return Infinity;
    }
    else {
      return self.score(self.route_headings[m-1], self.detected_headings[s-1]);
    }
  }
  get_d(i, j) {
    if (i == 0 && j == 0) {
      return 0.0;
    }
    else if (i == 0 || j == 0) {
      return Infinity;
    }
    else {
      return this.matrix[i-1][j-1];
    }
  }
  set_d(i, j, val) {
    this.matrix[i-1][j-1] = val;
  }
  recalc_matrix() {
    var self = this;
    let ret = [];
    for (let i = 0; i < self.route_headings.length; i++) {
      let ivec = [];
      for (let j = 0; j < self.detected_headings.length; j++) {
	ivec.push(Infinity);
      }
      ret.push(ivec);
    }
    self.matrix = ret;
    console.log(self.matrix);
    for (let i = 0; i < self.route_headings.length; i++) {
      let eye = i + 1;
      for (let j = 0; j < self.detected_headings.length; j++) {
	let jay = j + 1;
	let first = self.get_d(eye - 1, jay - 1) + self.get_score(eye, jay);
	let second = self.get_d(eye - 1, jay) + self.get_score(eye, jay - 1) + 1.5;
	let third = self.get_d(eye, jay - 1) + self.get_score(eye - 1, jay) + 1.5;
	let result = Math.min(first, second, third);
	self.set_d(eye, jay, result);
      }
    }
  }
  get_pos() {
    var self = this;
    let curmin;
    let val = Infinity;
    let j = self.detected_headings.length;
    for (let i = 0; i < self.route_headings.length; i++) {
      let eye = i + 1;
      let newval = self.get_d(eye, j);
      if (newval < val) {
	curmin = i;
	val = newval;
      }
    }
    return curmin;
  }
}
class StepDetector {
  constructor() {
    var self = this;

    // Parameters

    self.timeout_ms = 333;
    self.window_ms = 165;
    self.difference_accel = 2;

    // Data storage
    self.lpf = LPF;
    self.lpf.init([]);
    self.lpf.smoothing = 0.7;
    //self.lpf.bufferMaxSize = 20;
    self.readings = [];
    self.readings_length = 100;
    self.on_drop_found = function() {};
    self.heading = 0;

    // Accelerometer setup
    setUpdateIntervalForType(SensorTypes.accelerometer, 33);

    accelerometer.subscribe(({x, y, z, timestamp}) => {
      self.on_data(x, y, z, Date.now());
    });
    magnetometer.subscribe(({x, y, z}) => {
      self.on_magnet_data(x, y, z);
    });
  }
  on_magnet_data(x, y, z) {
    let angle;
    if (Math.atan2(y, x) >= 0) {
      angle = Math.atan2(y, x) * (180 / Math.PI);
    }
    else {
      angle = (Math.atan2(y, x) + 2 * Math.PI) * (180 / Math.PI);
    }
    this.heading = Math.round(angle);
  }
  on_data(x, y, z, timestamp) {
    var self = this;
    let smoothed = LPF.next(z);
    //console.log("on_data:", z, smoothed, timestamp);
    self.readings.push([smoothed, timestamp]);
    if (self.readings.length == self.readings_length) {
      self.readings.shift();
    }
    if ((self.last_detection_time + self.timeout_ms) >= timestamp) {
      //console.log("within window");
      return;
    }
    // Look at readings within the window only
    let start_idx = _.findIndex(self.readings, ([z, ts]) => {
      return (ts + self.timeout_ms) >= timestamp;
    });
    if (start_idx) {
      //console.log("found start idx", start_idx, self.readings.length);
      // find the highest accel value
      let highest_accel = 0.0;
      let highest_accel_idx = undefined;
      for (const idx of _.range(start_idx, self.readings.length)) {
	if (self.readings[idx][0] > highest_accel) {
	  highest_accel_idx = idx;
	  highest_accel = self.readings[idx][0];
	}
      }
      //console.log("highest accel", highest_accel);
      // find any drops with difference_accel in this window
      let drop_found = false;
      let drop_diff = undefined;
      for (const idx of _.range(highest_accel_idx, self.readings.length)) {
	let diff = highest_accel - self.readings[idx][0];
	if (diff >= self.difference_accel) {
	  console.log("drop found!");
	  drop_found = true;
	  drop_diff = diff;
	  self.last_detection_time = self.readings[idx][1];
	  break;
	}
      }
      if (drop_found) {
	self.on_drop_found(drop_diff, self.heading);
      }
    }
    else {
      //console.log("no start idx");
    }
  }
}
export { StepDetector, BestFitAlgorithm };
