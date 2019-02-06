import React, {Component} from 'react';
import {Platform, Button, Alert, StyleSheet, Text, ScrollView, View, Slider, Switch} from 'react-native';
import {
  accelerometer,
  gyroscope,
  setUpdateIntervalForType,
  SensorTypes
} from "react-native-sensors";
import { LineChart } from 'react-native-svg-charts'
import { map, filter } from "rxjs/operators";
import LPF from 'lpf';
import { StepDetector, BestFitAlgorithm } from './lib/steps';

export default class App extends Component {
  constructor(props) {
    super(props);
    var self = this;
    this.state = {"steps": [], "heading": 0};
    var steps = this.state.steps;
    this.state.step_detector = new StepDetector();
    this.state.alg = new BestFitAlgorithm();
    this.state.alg_steps = [];
    this.state.recording = false;
    this.state.detecting = false;
    this.state.step_detector.on_drop_found = function(diff, hdg) {
      self.setState((prev) => {
	if (prev.detecting) {
	  prev.heading = hdg;
	  prev.steps.push(hdg + "° " + diff.toFixed(2) + " m/s^2 @ " + Date.now());
	  if (prev.recording) {
	    prev.alg.route_headings.push(hdg);
	  }
	  else {
	    prev.alg.detected_headings.push(hdg);
	    console.log(prev.alg.detected_headings);
	    console.log(prev.alg.route_headings);
	    console.log(prev.alg.matrix);
	  }
	}
	return prev;
      });
    };
  }
  render() {
    var self = this;
    const steps = self.state.steps.map((step, idx) => {
      return (<Text key={idx} style={styles.instructions}>{step}</Text>);
    });
    const switchState = (val) => {
      self.setState((prev) => {
	prev.recording = val;
	return prev;
      });
    };
    const switchDetecting = (val) => {
      self.setState((prev) => {
	prev.detecting = val;
	return prev;
      });
    };
    var pos = 0;
    if (!self.state.recording) {
      self.state.alg.recalc_matrix();
      pos = self.state.alg.get_pos() || 0;
    }
    const clearStepsRec = () => {
      self.setState((prev) => {
	prev.steps = [];
	prev.alg.route_headings = [];
	return prev;
      });
    };
    const clearSteps = () => {
      self.setState((prev) => {
	prev.steps = [];
	prev.alg.detected_headings = [];
	return prev;
      });
    };
    return (
      <ScrollView style={styles.container}>
      <Text style={styles.welcome}>EPQ FootPath testing</Text>
      <Text style={styles.status}>Heading: {self.state.heading}°</Text>
      <View style={{flex: 1, flexDirection: 'row', alignItems: 'stretch'}}>
      <Text style={styles.status}>Detect steps? ({self.state.alg.detected_headings.length} steps)</Text>
      <Switch value={self.state.detecting} onValueChange={switchDetecting} />
      </View>
      <View style={{flex: 1, flexDirection: 'row', alignItems: 'stretch'}}>
      <Text style={styles.status}>Recording steps? ({self.state.alg.route_headings.length} steps)</Text>
      <Switch value={self.state.recording} onValueChange={switchState} />
      </View>
      <Text style={styles.status}>Pos: {pos} of {self.state.alg.route_headings.length-1}</Text>
      <Slider style={styles.slider} maximumValue={self.state.alg.route_headings.length-1} minimumValue={0} value={pos} />
      <Button title="Clear detected steps" onPress={clearSteps} />
      <Button title="Clear recorded steps" onPress={clearStepsRec} />

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
    width: 400
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  status: {
    fontSize: 18,
    margin: 5
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
