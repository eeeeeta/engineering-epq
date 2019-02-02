/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {Platform, Button, Alert, StyleSheet, Text, ScrollView, View, Slider} from 'react-native';
import {
  accelerometer,
  gyroscope,
  setUpdateIntervalForType,
  SensorTypes
} from "react-native-sensors";
import { LineChart } from 'react-native-svg-charts'
import { map, filter } from "rxjs/operators";
import LPF from 'lpf';
import { StepDetector } from './lib/steps';

function smooth(smoothed, smoothing, lastUpdate, newval) {
  var now = new Date;
  var elapsedTime = now - lastUpdate;
  smoothed += elapsedTime * ( newval - smoothed ) / smoothing;
  lastUpdate = now;
  return smoothed;
}
export default class App extends Component {
  constructor(props) {
    super(props);
    var self = this;
    this.state = {"steps": []};
    var steps = this.state.steps;
    this.state.step_detector = new StepDetector();
    this.state.step_detector.on_drop_found = function(diff) {
      self.setState((prev) => {
	console.log("updating?");
	prev.steps.push(diff + " @ " + Date.now());
	return prev;
      });
    };
    /*
    var lpf = LPF;
    LPF.init([]);
    this.state = {"accel": {}, "zdata": [], "zdata_lpf": [], "lpf": LPF};
    this.state.accel = {"x": 0, "y": 0, "z": 0};
    this.state.smoothed   = 0;        // or some likely initial value
    this.state.smoothing  = 10;       // or whatever is desired
    this.state.lastUpdate = new Date;
    var self = this;
    setUpdateIntervalForType(SensorTypes.accelerometer, 10);
    const subscription = accelerometer
      .subscribe(({x, y, z, timestamp}) => {
	self.setState(prev => {
	  prev.accel.x = x;
	  prev.accel.y = y;
	  prev.accel.z = z;
	  prev.zdata.push(smooth(prev.smoothed, prev.smoothing, prev.lastUpdate, z));
	  if (prev.zdata.length > 40) {
	    prev.zdata.shift();
	  }
	  return prev;
	})
      });
      */
  }
  render() {
    var self = this;
    const steps = self.state.steps.map((step, idx) => {
      console.log("step!");
      return (<Text key={idx} style={styles.instructions}>{step}</Text>);
    });
    const clearSteps = () => {
      self.setState((prev) => {
	prev.steps = [];
	return prev;
      });
    };
    return (
      <ScrollView style={styles.container}>
      <Text style={styles.welcome}>EPQ Accelerometer Testing</Text>
      <Button title="Clear steps" onPress={clearSteps} />

      <Text style={styles.instructions}>difference_accel: {self.state.step_detector.difference_accel} m/s^2</Text>
      <Slider
      style={styles.slider}
      maximumValue={5}
      minimumValue={1}
      value={this.state.step_detector.difference_accel}
      onValueChange={function (val) { self.state.step_detector.difference_accel = val; self.forceUpdate(); }} />

      <Text style={styles.instructions}>window_ms: {self.state.step_detector.window_ms} millisecs</Text>
      <Slider
      style={styles.slider}
      maximumValue={1000}
      minimumValue={100}
      value={this.state.step_detector.window_ms}
      onValueChange={function (val) { self.state.step_detector.window_ms = val; self.forceUpdate(); }} />

      <Text style={styles.instructions}>timeout_ms: {self.state.step_detector.timeout_ms} millisecs</Text>
      <Slider
      style={styles.slider}
      maximumValue={1000}
      minimumValue={100}
      value={this.state.step_detector.timeout_ms}
      onValueChange={function (val) { self.state.step_detector.timeout_ms = val; self.forceUpdate(); }} />

      <Text style={styles.instructions}>LPF smoothing: {self.state.step_detector.lpf.smoothing} units</Text>
      <Slider
      style={styles.slider}
      maximumValue={2}
      minimumValue={0}
      value={this.state.step_detector.lpf.smoothing}
      onValueChange={function (val) { self.state.step_detector.lpf.smoothing = Math.min(1, val); self.forceUpdate(); }} />



      {steps}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  slider: {
    width: 500
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
