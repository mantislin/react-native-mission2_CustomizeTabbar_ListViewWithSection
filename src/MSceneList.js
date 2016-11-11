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

                  //name = name.toString().substr(0, 2); //get "奥迪" from "A 奥迪"

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
               sectionIds.forEach((sectionId, sectionIndex) => { // here
                  this.state.sectionHeaderYs[sectionId] = sectionHeaderY;
                  brands[sectionId].forEach((brand, brandIndex) => {
                     sectionHeaderY += (brandIndex == 0 ? this._heightOfSectionHeader(brand, sectionId) : 0);
                     sectionHeaderY += this._heightOfRow(brand, sectionId, brandIndex);
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
         //onStartShouldSetPanResponder:(event, gestureState) => true,
         //onStartShouldSetPanResponderCapture:(event, gestureState) => true,
         onMoveShouldSetPanResponder:(event, gestureState) => true,
         //onMoveShouldSetPanResponderCapture:(event, gestureState) => true,

         onPanResponderMove:(event, gestureState) => {
            //estureState = stateID,moveX,moveY,x0,y0,dx,dy,vx,vy,numberActiveTouches,_accountsForMovesUpTo // testing
            if (this.state.frameOfSectionNavigator === undefined) {
               this._measureElement(this.refs.sectionIndex);
               return;
            }
            if (this.state.sectionIds === undefined) return;

            this.state.sectionIds.forEach((val, index) => {
               var startY = this.state.frameOfSectionNavigator.py + this.state.heightOne * index;
               var endY = this.state.frameOfSectionNavigator.py + this.state.heightOne * (index + 1);
               if ((gestureState.moveY < startY || gestureState.moveY >= endY)
                  && (index != 0 && index != this.state.sectionIds.length - 1)) return;
               if (index == 0 && gestureState.moveY > endY) return;
               if (index == this.state.sectionIds.length - 1 && gestureState.moveY < startY) return;

               var y = this.state.sectionHeaderYs[val];
               if (y === undefined) return;

               this.refs.listView.scrollTo({ x: 0, y: y, animated: false, });
            });
         },
         //onPanResponderTerminationRequest:(event, gestureState) => true,
         onShouldBlockNativeResponder:(event, gestureState) => true,
      });
   }

   _measureElement(element, tag) {

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

      if (element === this.refs.sectionIndex && element.measure != undefined) {
         element.measure((ox, oy, width, height, px, py) => {
            this.state.frameOfSectionNavigator = {
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
            {this._renderSectionNavigator(this.refs["listView"])}
         </View>
      );
   }

   _renderSectionNavigator(listView) {
      var sectionIds = this.state.sectionIds;
      if (this.state.frameOfListView === undefined || sectionIds === undefined) {
         return <View />
      } else {
         var heightOne = this.state.heightOne;
         var heightAll = heightOne * sectionIds.length;
         var heightLimit = this.state.frameOfListView.height;

         var innerHTML = sectionIds.map((val, index) => {
            return (
               <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#9FF', }}
                  key={val}
               >
                  <Text style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', textAlign: 'center', textAlignVertical: 'center', fontSize: 10, }}>{val}</Text>
               </View>
            )
         });

         return (
            <View
               style={{
                  top: (heightLimit - heightAll) * 0.5,
                  right: 12,
                  width: 15,
                  height: heightAll,
                  paddingVertical: 3,
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  backgroundColor: 'whitesmoke', // testing
                  position: 'absolute',
               }}
               ref="sectionIndex"
               {...this._panResponder.panHandlers}
               //onLayout=((event) => {
               //   this.setState.frameOfSectionNavigator = {
               //      ox: event.nativeEvent.layout.x,
               //      oy: event.nativeEvent.layout.y,
               //      width: event.nativeEvent.layout.width,
               //      height: event.nativeEvent.layout.height,
               //   };
               //});
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
      var ref = `sectionId.${sectionId}`;
      return (
         <View
            style={{
               height: this._heightOfSectionHeader(rowDatas, sectionId),
               backgroundColor: '#AA3',
               flexDirection: 'row',
               justifyContent: 'flex-start',
               alignItems: 'center',
               paddingLeft: 12,
            }}
            tag={ref}
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
               backgroundColor: '#080',
               flexDirection: 'row',
               justifyContent: 'flex-start',
               alignItems: 'center',
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
      return <View key={`${sectionID}.${rowID}`} style={{ height: 0.5, backgroundColor: '#000', }} />
   }
}

var styles = StyleSheet.create({
   container: {
      flex: 1,
   },
   listView: {
      flex: 1,
      marginTop: 20,
   },
});
