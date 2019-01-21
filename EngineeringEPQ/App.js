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
import { map, filter } from "rxjs/operators";


type Props = {};
export default class App extends Component<Props> {
  constructor(props) {
	  super(props);
	  this.state = {"accel": {}};
	  this.state.accel = {"x": 0, "y": 0, "z": 0};
	  var self = this;
	  setUpdateIntervalForType(SensorTypes.accelerometer, 100);
	  const subscription = accelerometer
		  .subscribe(({x, y, z, timestamp}) => {
			  self.setState(prev => {
				  prev.accel.x = x;
				  prev.accel.y = y;
				  prev.accel.z = z;
				  return prev;
			  })
		  });
  }
  render() {
    return (
      <ScrollView style={styles.container}>

	    <Button
	    onPress={() => Alert.alert('Yay!')}
	    title="Button!"
	    />
	<Text style={styles.welcome}>Ooh look, maybe I can convince myself my EPQ isn't a failure!</Text>
        <Text style={styles.instructions}>x: {this.state.accel.x.toPrecision(3)}</Text>
        <Text style={styles.instructions}>y: {this.state.accel.y.toPrecision(3)}</Text>
        <Text style={styles.instructions}>z: {this.state.accel.z.toPrecision(3)}</Text>
	    <Slider style={styles.slider} maximumValue={10} minimumValue={-10} value={this.state.accel.x} />
	    <Slider style={styles.slider} maximumValue={10} minimumValue={-10} value={this.state.accel.y} />
	    <Slider style={styles.slider} maximumValue={8} minimumValue={13} value={this.state.accel.z} />
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
