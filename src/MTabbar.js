import React, { Component } from 'react';
import {
   StyleSheet,
} from 'react-native';

import MModuleTabbar from './MModuleTabbar';

export default class MTabbar extends component {
   constructor(props) {
      super(props);
   }

   render() {
      /*
       * 突然喷水.jpg
       * 突然嚣张.jpg
       * 突然害羞.jpg
       * 突然抽筋.jpg
       * 突然绝望.jpg
       */
      const tabItems = [
         { icon: 'imgs/突然喷水.jpg', text: '喷水', },
         { icon: 'imgs/突然嚣张.jpg', text: '嚣张', },
         { icon: 'imgs/突然害羞.jpg', text: '害羞', },
         { icon: 'imgs/突然抽筋.jpg', text: '抽筋', },
         { icon: 'http://kepkezelo.com/images/59fqze7llmos6freeupr.png', text: '滑稽', },
      ];

      return (
         <MModuleTabbar style={styles.tabbar}
            tabItems={tabItems}
            initialIndex={0}
            highlightOnClick={true}
            highlightCurrentTab={true}
            onClickDown={(tabItem, index) => {
               console.log('onClickDown');
            }}
            onClickUp={(tabItem, index) => {
               console.log('onClickUp');
            }}
         />
      );
   }
};

var styles = StyleSheet.create({
   tabbar: {
      height: 49,
      backgroundColor: '#000', // testing
   },
});
