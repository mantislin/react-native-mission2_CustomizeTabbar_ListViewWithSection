import React, { Component } from 'react';
import {
   Image,
   ListView,
   PanResponder,
   RecyclerViewBackedScrollView,
   StyleSheet,
   Text,
   View,
} from 'react-native';

import MModuleTabbar from './MModuleTabbar';

export default class MSceneList extends Component {
   constructor(props) {
      super(props);

      this.ReactNativeComponentTree = require('react/lib/ReactNativeComponentTree');

      const ds = new ListView.DataSource({
         sectionHeaderHasChanged: (r1, r2) => r1 !== r2,
         rowHasChanged: (r1, r2) => r1.id !== r2.id,
      });

      this.state = {
         sectionHeaders: {}, //hash map for { tag: nodeId }
         heightOne: 15, //height for every section index
         ds: ds, //DataSource component of ListView
         dataSource: ds.cloneWithRowsAndSections({}, []), //dataSource for ListView
         sectionIds: [], //the list of section index
         brands: {}, //brand tree data parsed from json data
         imageDefault: 'http://kepkezelo.com/images/59fqze7llmos6freeupr.png',
      };
   }

   _dataFromJsonMe(jsonMe) {
      return {
         id: jsonMe[0],
         name: jsonMe[1],
         icon: jsonMe[2],
      };
   }

   _updateForumTree() {
      //http://mrobot.pcauto.com.cn/v3/bbs/pcauto_v3_bbs_forum_tree
      try {
         var url = 'http://mrobot.pcauto.com.cn/v3/bbs/pcauto_v3_bbs_forum_tree';
         fetch(url)
            .then(response => {
               return response.json();
            })
            .then((responseJson) => {
               var brandTree = responseJson["children"][0]["children"];
               var brands = {};
               var sectionIds = [];
               brandTree.forEach((val, index) => {
                  var id = val["me"][0];
                  var name = val["me"][1];
                  var icon = val["me"][2];

                  var initial = name.toString().substr(0, 1);
                  var regex = /[A-Za-z]/;
                  if (regex.test(initial) === false) return;

                  var brand = { //单个品牌
                     id: id,
                     name: name,
                     icon: icon,
                  };
                  var brandsInit = brands[initial]; //首字母同为${initial}的品牌的列表
                  brandsInit = (brandsInit === undefined ? [] : brandsInit);
                  brandsInit.push(brand);
                  brands[initial] = brandsInit;
               });
               sectionIds = Object.keys(brands).map(val => val);

               this.setState({ //Trigger listview layout
                  brands: brands,
                  sectionIds: sectionIds,
                  dataSource: this.state.ds.cloneWithRowsAndSections(brands, sectionIds),
               });

               //Prepare section index.
               if (this.state.sectionHeaderYs === undefined || this.state.sectionHeaderYs === null)
                  this.state.sectionHeaderYs = {};
               var sectionHeaderY = 0;
               sectionIds.forEach((sectionId, sectionIndex) => {
                  this.state.sectionHeaderYs[sectionId] = sectionHeaderY;
                  brands[sectionId].forEach((brand, brandIndex) => {
                     //section header高度
                     sectionHeaderY += (brandIndex == 0 ? this._heightOfSectionHeader(brand, sectionId) : 0);
                     //row高度
                     sectionHeaderY += this._heightOfRow(brand, sectionId, brandIndex);
                     //separator高度
                     sectionHeaderY += (brandIndex < brands[sectionId].length - 1 ? 0.5 : 0);
                  });
               });
            });
      } catch(error) {
         //console.error(`error = ${error}`);
      }
   }

   componentWillMount() {
      this._updateForumTree();

      this._panResponder = PanResponder.create({
         // Ask to be the responder:
         onStartShouldSetPanResponder:(event, gestureState) => true,
         //onStartShouldSetPanResponderCapture:(event, gestureState) => true,
         onMoveShouldSetPanResponder:(event, gestureState) => true,
         //onMoveShouldSetPanResponderCapture:(event, gestureState) => true,

         onPanResponderStart:(event, gestureState) => {
            this._scrollsToSection(this._sectionIdBeingIndex(event, gestureState));
         },

         onPanResponderMove:(event, gestureState) => {
            this._scrollsToSection(this._sectionIdBeingIndex(event, gestureState));
         },
         //onPanResponderTerminationRequest:(event, gestureState) => true,
         onShouldBlockNativeResponder:(event, gestureState) => true,
      });
   }

   componentDidMount() {
      let foo = 'outer';
      function bar(func = x => foo) {
         let foo = 'inner';
         console.log(func()); // outer // testing
      }
      bar();
   }

   _sectionIdBeingIndex(event, gestureState) {
      var result = null;
      if (this.state.frameOfSectionIndex === undefined) {
         this._measureElement(this.refs.sectionIndex);
         return result;
      }
      if (this.state.sectionIds === undefined) return result;

      /*
       * Use Array#some because I can break this loop by return a true value;
       */
      this.state.sectionIds.some((sectionId, index) => {
         var startY = this.state.frameOfSectionIndex.py + this.state.heightOne * index;
         var endY = this.state.frameOfSectionIndex.py + this.state.heightOne * (index + 1);
         var currentY = (gestureState.moveY <= 0 ? gestureState.y0 : gestureState.moveY);

         if ((currentY < startY || currentY >= endY)
            && (index != 0 && index != this.state.sectionIds.length - 1)) return false;
         if (index == 0 && currentY > endY) return false;
         if (index == this.state.sectionIds.length - 1 && currentY < startY) return false;

         result = sectionId;
         return (result !== null);
      });

      return result;
   }

   _scrollsToSection(sectionId) {
      if (sectionId === null || sectionId === undefined) return;

      var y = this.state.sectionHeaderYs[sectionId];
      if (y === undefined) return;

      this.refs.listView.scrollTo({ x: 0, y: y, animated: false, });
   }

   _measureElement(element, tag) {
      //获取listView的frame，触发sectionIndex的更新
      if ((tag === 'listView') && element.measure != undefined) {
         element.measure((ox, oy, width, height, px, py) => {
            var frame = {
               ox: ox,
               oy: oy,
               width: width,
               height: height,
               px: px,
               py: py,
            };
            if (frame !== this.state.frameOfListView) {
               this.setState({
                  frameOfListView: frame,
               });
            }
         });
         return;
      }

      //记录sectionIndex的frame，用于section索引时的计算
      if (element === this.refs.sectionIndex && element.measure != undefined) {
         element.measure((ox, oy, width, height, px, py) => {
            this.state.frameOfSectionIndex = {
               ox: ox,
               oy: oy,
               width: width,
               height: height,
               px: px,
               py: py,
            };
         });
         return;
      }
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
         //{ icon: './imgs/penshui.png', text: '喷水', },
         //{ icon: './imgs/penshui.png', text: '嚣张', },
         //{ icon: './imgs/penshui.png', text: '害羞', },
         //{ icon: './imgs/penshui.png', text: '抽筋', },
         { icon: 'http://kepkezelo.com/images/59fqze7llmos6freeupr.png', text: '滑稽', },
         { icon: 'http://kepkezelo.com/images/59fqze7llmos6freeupr.png', text: '喷水', },
         { icon: 'http://kepkezelo.com/images/59fqze7llmos6freeupr.png', text: '嚣张', },
         { icon: 'http://kepkezelo.com/images/59fqze7llmos6freeupr.png', text: '害羞', },
         { icon: 'http://kepkezelo.com/images/59fqze7llmos6freeupr.png', text: '抽筋', },
      ];

      return (
         <View style={styles.container} ref="container">
            <ListView style={styles.listView}
               ref="listView"
               enableEmptySections={true}
               showsVerticalScrollIndicator={false}
               dataSource={this.state.dataSource}
               renderSectionHeader={(data, sectionId) => this._renderSectionHeader(data, sectionId)}
               renderRow={this._renderRow.bind(this)}
               renderSeparator={this._renderSeparator}
               renderScrollComponent={props => <RecyclerViewBackedScrollView {...props} />}
               tag="listView"
               onLayout={(event) => {
                  var instance = this.ReactNativeComponentTree.getInstanceFromNode(event.target);
                  if (instance === null) return;
                  this._measureElement(instance, instance._currentElement.props.tag);
               }}
            />
            {this._renderSectionIndex(this.refs["listView"])}
            <MModuleTabbar style={styles.tabbar}
               tabItems={tabItems}
               //initialIndex={0}
               //highlightOnClick={true} // todo
               //highlightCurrentTab={true} // todo
               onPressTab={(index, tabItem) => {
                  console.log(`index = ${index}`); // testing
                  console.log(`tabItem.keys = ${Object.keys(tabItem)}`); // testing
               }}
            />
         </View>
      );
   }

   _renderSectionIndex(listView) {
      var sectionIds = this.state.sectionIds;
      if (this.state.frameOfListView === undefined || sectionIds === undefined) {
         return <View />
      } else {
         var paddingVertical = 3;
         var heightOne = this.state.heightOne;
         var heightAll = heightOne * sectionIds.length + paddingVertical * 2;
         var frame = this.state.frameOfListView;

         var innerHTML = sectionIds.map((val, index) => {
            return (
               <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(240,240,240,0.7)', }}
                  key={val}
               >
                  <Text style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', textAlign: 'center', textAlignVertical: 'center', fontSize: 10, }}>{val}</Text>
               </View>
            )
         });

         return (
            <View
               style={{
                  top: frame.oy + (frame.height - heightAll) * 0.5,
                  right: 12,
                  width: 15,
                  height: heightAll,
                  paddingVertical: paddingVertical,
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  position: 'absolute',
               }}
               ref="sectionIndex"
               {...this._panResponder.panHandlers}
            >
               {innerHTML}
            </View>
         );
      }
   }

   _heightOfSectionHeader(rowDatas, sectionId) {
      return 26;
   }

   _renderSectionHeader(rowDatas, sectionId) {
      var tag = `sectionId.${sectionId}`;
      return (
         <View
            style={{
               height: this._heightOfSectionHeader(rowDatas, sectionId),
               backgroundColor: '[rgba(230,230,230,0.8), rgba(255,255,255,0), ]',
               flexDirection: 'row',
               justifyContent: 'flex-start',
               alignItems: 'center',
               paddingLeft: 12,
            }}
            tag={tag}
         >
            <Text style={{ fontWeight: 'bold', }}>{sectionId}</Text>
         </View>
      )
   }

   _heightOfRow(rowData, sectionId, rowId, highlightRow) {
      return 72;
   }

   _renderRow(rowData, sectionId, rowId, highlightRow) {
      var heightOfRow = this._heightOfRow(rowData, sectionId, rowId, highlightRow);
      var margin = 12;
      var width = heightOfRow - margin * 2;
      var height = width;
      return (
         <View
            style={{
               height: heightOfRow,
               flexDirection: 'row',
               justifyContent: 'flex-start',
               alignItems: 'center',
               backgroundColor: '#f0f8ff',
            }}>
            <Image
               style={{
                  width: width,
                  height: height,
                  margin: margin,
                  backgroundColor: '#CCC',
               }}
               source={{ uri: (rowData["icon"].length > 0 ? rowData["icon"] : this.state.imageDefault) }}
            />
            <Text>{rowData["name"]}</Text>
         </View>
      );
   }

   _renderSeparator(sectionID, rowID, adjacentRowHighlighted) {
      return <View key={`${sectionID}.${rowID}`} style={{ height: 0.5, backgroundColor: '#AAA', }} />
   }
}

var styles = StyleSheet.create({
   container: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'flex-end',
      alignItems: 'stretch',
   },
   listView: {
      flex: 1,
      marginTop: 20,
   },
});
