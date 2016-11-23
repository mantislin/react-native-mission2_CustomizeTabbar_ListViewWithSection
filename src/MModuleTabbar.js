import React, { Component } from 'react';
import {
   Image,
   StyleSheet,
   Text,
   TouchableOpacity,
   View,
} from 'react-native';

//tabbar default height: 49

export default class MModuleTabbar extends Component {
   constructor(props) {
      super(props);

      this.ReactNativeComponentTree = require('react/lib/ReactNativeComponentTree');

      this.state = {
         initialIndex: 0,
         currentIndex: 0,
      };
   }

   componentWillMount() {
   }

   componentDidMount() {
      var initialIndex = this.props.initialIndex;
      initialIndex = (initialIndex === parseInt(initialIndex, 10) ? initialIndex : 0); //数据类型校验
      initialIndex = (this.props.tabItems === undefined //向上越界预防
         || this.props.tabItems.length === undefined
         || initialIndex >= this.props.tabItems.length
         ? 0
         : initialIndex
      );
      initialIndex = (initialIndex < 0 ? 0 : initialIndex); //向下越界预防

      this.setState({
         currentIndex: initialIndex,
      });
   }

   _renderTabItems(tabItems, currentIndex) {
      var result = [];
      if (tabItems === null || tabItems === undefined || tabItems.forEach === undefined) return result;

      tabItems.forEach((tabItem, index) => {
         var icon = tabItem["icon"];
         var regex = /^(http|ftp).*/;
         var source = (regex.test(icon) ? { uri: icon, } : require(icon)); // rest ques: cannot load local iamge
         source = { uri: 'http://kepkezelo.com/images/59fqze7llmos6freeupr.png' }; // testing
         tag = `tabItem.${index}`;
         result.push(
            <View style={styles.viewTabItems} key={index}>
               <TouchableOpacity style={{ flex: 1, }}
                  tag={tag}
                  onPress={(event) => {
                     //if (this.props.onTabClicked == undefined) return; // retain

                     var instance = this.ReactNativeComponentTree.getInstanceFromNode(event.target);
                     if (instance._currentElement.props.tag == undefined) return;
                     if (instance._currentElement.props.tag.toString == undefined) return;

                     var index = instance._currentElement.props.tag.toString().slice(-1);
                     if (this.props.onPressTab === undefined) return;

                     this.props.onPressTab(index, this.props.tabItems[index]);
                  }}
               >
                  <View style={styles.viewTabItem}
                     tag={tag}>
                     <Image style={styles.imageTabItem}
                        tag={tag}
                        resizeMode="contain"
                        source={source} />
                     <Text style={styles.textTabItem} tag={tag}>{tabItem.text}</Text>
                  </View>
               </TouchableOpacity>
            </View>
         );
      });
      return result;
   }

   render() {
      var tabItemsHTML = this._renderTabItems(this.props.tabItems, this.state.currentIndex);
      return (
         <View style={[styles.container, this.props.style]}>
            {tabItemsHTML}
         </View>
      );
   }
}

var styles = StyleSheet.create({
   container: {
      height: 49, // 49 is iOS Tabbar's default height since iOS8.
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'stretch',
   },
      viewTabItems: {
         flex: 1,
         flexDirection: 'row',
         justifyContent: 'center',
         alignItems: 'stretch',
      },
         viewTabItem: {
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            marginVertical: 3,
         },
            imageTabItem: {
               height: 27,
               width: 46,
            },
            textTabItem: {
               height: 12,
               fontSize: 11,
               marginTop: 3,
            },
});
