import React, { Component } from 'react';
import {
   Navigator,
   Text,
} from 'react-native';

import MSceneList from './MSceneList';
//import MSceneDetails from './MSceneDetails'; // remain

export default class Index extends Component {
   render() {
      return (
         <Navigator
            initialRoute={ {title: '', index: 0, } }
            renderScene={(route, navigator) => {
               return <MSceneList route={route} navigator={navigator} />;
               //if (route.index === 0) { // remain
               //   return <MSceneList route={route} navigator={navigator} />;
               //} else {
               //   return <MSceneDetails route={route} navigator={navigator} />;
               //}
            }}
         />
      );
   }
}
