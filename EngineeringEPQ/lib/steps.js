// Step detection, using the phone's accelerometer.
//
import {
  accelerometer,
  gyroscope,
  setUpdateIntervalForType,
  SensorTypes
} from "react-native-sensors";
import _ from "lodash";
import LPF from 'lpf';

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
    self.lpf.smoothing = 0.6;
    self.lpf.bufferMaxSize = 20;
    self.readings = [];
    self.readings_length = 100;
    self.on_drop_found = function() {};

    // Accelerometer setup
    setUpdateIntervalForType(SensorTypes.accelerometer, 33);

    accelerometer.subscribe(({x, y, z, timestamp}) => {
      self.on_data(x, y, z, Date.now());
    });
  }
  on_data(x, y, z, timestamp) {
    var self = this;
    let smoothed = LPF.next(z);
    console.log("on_data:", z, smoothed, timestamp);
    self.readings.push([smoothed, timestamp]);
    if (self.readings.length == self.readings_length) {
      self.readings.shift();
    }
    if ((self.last_detection_time + self.timeout_ms) >= timestamp) {
      console.log("within window");
      return;
    }
    // Look at readings within the window only
    let start_idx = _.findIndex(self.readings, ([z, ts]) => {
      return (ts + self.timeout_ms) >= timestamp;
    });
    if (start_idx) {
      console.log("found start idx", start_idx, self.readings.length);
      // find the highest accel value
      let highest_accel = 0.0;
      let highest_accel_idx = undefined;
      for (const idx of _.range(start_idx, self.readings.length)) {
	if (self.readings[idx][0] > highest_accel) {
	  highest_accel_idx = idx;
	  highest_accel = self.readings[idx][0];
	}
      }
      console.log("highest accel", highest_accel);
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
	self.on_drop_found(drop_diff);
      }
    }
    else {
      console.log("no start idx");
    }
  }
}
export { StepDetector };
