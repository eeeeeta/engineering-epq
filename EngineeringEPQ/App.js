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

function smooth(smoothed, smoothing, lastUpdate, newval) {
	var now = new Date;
	var elapsedTime = now - lastUpdate;
	smoothed += elapsedTime * ( newval - smoothed ) / smoothing;
	lastUpdate = now;
	return smoothed;
}
type Props = {};
export default class App extends Component<Props> {
  constructor(props) {
	  super(props);
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
  }
  render() {
	  var self = this;
    return (
      <ScrollView style={styles.container}>
	<Text style={styles.welcome}>EPQ Accelerometer Testing</Text>
        <Text style={styles.instructions}>x: {this.state.accel.x.toPrecision(3)}</Text>
        <Text style={styles.instructions}>y: {this.state.accel.y.toPrecision(3)}</Text>
        <Text style={styles.instructions}>z: {this.state.accel.z.toPrecision(3)}</Text>
	    <Slider style={styles.slider} maximumValue={10} minimumValue={-10} value={this.state.accel.x} />
	    <Slider style={styles.slider} maximumValue={10} minimumValue={-10} value={this.state.accel.y} />
	    <Slider style={styles.slider} maximumValue={8} minimumValue={13} value={this.state.accel.z} />
	    <Text style={styles.instructions}>lpf smoothing: {this.state.smoothing}</Text>
	    <Slider style={styles.slider} maximumValue={100} minimumValue={1} value={this.state.smoothing} onValueChange={function (val) { self.state.smoothing = val; }} />
	    <LineChart
	    style={ { height: 200, width: "100%" } }
	    data={ this.state.zdata }
	    svg={ {
		    stroke: 'rgb(134, 65, 244)',
	    } }
	    >
	    </LineChart>
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
