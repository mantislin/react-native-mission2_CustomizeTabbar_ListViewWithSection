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
                  var brandsInit = brands[initial]; //首字母同为${initial}的品牌列表
                  brandsInit = (brandsInit === undefined ? [] : brandsInit);
                  brandsInit.push(brand);
                  brands[initial] = brandsInit;
               });
               sectionIds = Object.keys(brands).map(val => val);
               this.setState({
                  brands: brands,
                  sectionIds: sectionIds,
                  dataSource: this.state.ds.cloneWithRowsAndSections(brands, sectionIds),
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
            //console.log(`onPanResponderMove:`); // testing
            //console.log(`event = ${event}`); // testing
            //console.log(`gestureState = ${Object.keys(gestureState)}`); // testing
            //estureState = stateID,moveX,moveY,x0,y0,dx,dy,vx,vy,numberActiveTouches,_accountsForMovesUpTo // testing
            //console.log(`x0,y0       = {${gestureState.x0},${gestureState.y0}}`); // testing
            //console.log(`moveX,moveY = {${gestureState.moveX},${gestureState.moveY}}`); // testing
            //console.log(`this.state.frameOfSectionNavigator = ${this.state.frameOfSectionNavigator}`); // testing
            if (this.state.frameOfSectionNavigator === undefined) {
               this._measureElement(this.refs.sectionNavigator);
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

               //console.log(`{v, i} = {${val}, ${index}}`); // testing
               //console.log(`ref = ${ref}`); // testing
               //console.log(`element = ${Object.keys(element)}`); // testing

               //var element = this.ReactNativeComponentTree.getInstanceFromNode(event.target); // delete
               //this._measureElement(element); // here
               if (this.state.sectionHeaders === undefined) return;
               var tag = `sectionId.${val}`;
               var nodeId = this.state.sectionHeaders[tag];
               var instance = this.ReactNativeComponentTree.getInstanceFromNode(nodeId);
               if (instance === null || instance === undefined || instance._currentElement === undefined) return;
               console.log('=================================================='); // testing
               console.log(`tag = ${tag}`); // testing
               console.log(`nodeId = ${nodeId}`); // testing
               console.log(`instance.keys = ${Object.keys(instance)}`); // testing
               console.log(`tag = ${instance._currentElement.props.tag}`); // testing

               this._measureElement(instance);
            });
         },
         //onPanResponderTerminationRequest:(event, gestureState) => true,
         onShouldBlockNativeResponder:(event, gestureState) => true,
      });
   }

   componentDidMount() {
      //setTimeout(() => { // delete
      //   this._measureElement(this.refs.container); // delete
      //}, 0); // delete
   }

   _measureElement(element) {
      //console.log(`element = ${element}`); // testing
      console.log(`==================================================`); // testing

      if (element === this.refs.listView && element.measure != undefined) {
         element.measure((ox, oy, width, height, px, py) => {
            console.log(`this.refs.listView.measure = ${element.measure}`); // testing
            var frame = {
               ox: ox,
               oy: oy,
               width: width,
               height: height,
               px: px,
               py: py,
            };
            if (frame !== this.state.frameOfListView) {
               //console.log(`ox = ${ox}`); // testing
               //console.log(`oy = ${oy}`); // testing
               //console.log(`width = ${width}`); // testing
               //console.log(`height = ${height}`); // testing
               //console.log(`px = ${px}`); // testing
               //console.log(`py = ${py}`); // testing
               //console.log(`{ox,oy,width,height,px,py} = {${ox},${oy},${width},${height},${px},${py}}`); // testing
               this.setState({
                  frameOfListView: frame,
               });
            }
         });
         return;
      }

      if (element === this.refs.sectionNavigator && element.measure != undefined) {
         element.measure((ox, oy, width, height, px, py) => {
            console.log(`this.refs.sectionNavigator.measure = ${element.measure}`); // testing
            //console.log(`ox = ${ox}`); // testing
            //console.log(`oy = ${oy}`); // testing
            //console.log(`width = ${width}`); // testing
            //console.log(`height = ${height}`); // testing
            //console.log(`px = ${px}`); // testing
            //console.log(`py = ${py}`); // testing
            //console.log(`{ox,oy,width,height,px,py} = {${ox},${oy},${width},${height},${px},${py}}`); // testing
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

      console.log(`element.measure = ${element.measure}`); // testing
      console.log(`element.keys = ${Object.keys(element)}`); // testing
      console.log(`element.type = ${element.type}`); // testing
      if (element.measure != undefined) {
         console.log(`element._currentElement.props.tag = ${element._currentElement.props.tag}`); // testing
         element.measure((ox, oy, width, height, px, py) => {
            //section jump // here
            console.log(`{ox,oy,width,height,px,py} = {${ox},${oy},${width},${height},${px},${py}}`); // testing
            this.refs.listView.scrollTo({ x: 0, y: oy, animated: false, });
         });
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
               renderRow={rowData => this._renderRow(rowData)}
               renderSeparator={this._renderSeparator}
               renderScrollComponent={props => <RecyclerViewBackedScrollView {...props} />}
               onLayout={(event) => {
                  //console.log(`layout.keys = ${Object.keys(event.nativeEvent.layout)}`); // testing
                  //console.log(`x = ${event.nativeEvent.layout.x}`); // testing
                  //console.log(`y = ${event.nativeEvent.layout.y}`); // testing
                  //console.log(`width = ${event.nativeEvent.layout.width}`); // testing
                  //console.log(`height = ${event.nativeEvent.layout.height}`); // testing
                  this.setState({
                     frameOfListView: {
                        ox: event.nativeEvent.layout.x,
                        oy: event.nativeEvent.layout.y,
                        width: event.nativeEvent.layout.width,
                        height: event.nativeEvent.layout.height,
                     },
                  });
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
         //console.log(`sectionIds.length = ${sectionIds.length}`); // testing
         //console.log(`heightOne = ${heightOne}`); // testing
         //console.log(`heightAll = ${heightAll}`); // testing
         //console.log(`heightLimit = ${heightLimit}`); // testing

         var innerHTML = sectionIds.map((val, index) => {
            //console.log(`val = ${val}`); // testing
            //console.log(`index = ${index}`); // testing
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
               ref="sectionNavigator"
               {...this._panResponder.panHandlers}
               //onLayout=((event) => {
               //   console.log(`layout.keys = ${Object.keys(event.nativeEvent.layout)}`); // testing
               //   console.log(`x = ${event.nativeEvent.layout.x}`); // testing
               //   console.log(`y = ${event.nativeEvent.layout.y}`); // testing
               //   console.log(`width = ${event.nativeEvent.layout.width}`); // testing
               //   console.log(`height = ${event.nativeEvent.layout.height}`); // testing
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

   _renderSectionHeader(rowDatas, sectionId) {
      //console.log(`sectionId = ${sectionId}`); // testing
      //console.log(`rowDatas = ${rowDatas}`); // testing
      var ref = `sectionId.${sectionId}`;
      //console.log(`ref = ${ref}`); // testing
      return (
         <View
            style={{
               height: 26,
               backgroundColor: '#AA3',
               flexDirection: 'row',
               justifyContent: 'flex-start',
               alignItems: 'center',
               paddingLeft: 12,
            }}
            tag={ref}
            onLayout={event => { // here
               console.log(`==================================================`); // testing
               //console.log(`event.keys = Object.keys(event)`); // testing
               //console.log(`event.nativeEvent.keys = Object.keys(event.nativeEvent)`); // testing
               //console.log(`element._currentElement.keys = ${Object.keys(element._currentElement)}`); // testing
               //console.log(`element._currentElement.ref = ${element._currentElement.ref}`); // testing
               //console.log(`element._currentElement.key = ${element._currentElement.key}`); // testing
               //console.log(`element._currentElement.props.ref = ${element._currentElement.props.ref}`); // testing
               //console.log(`element._currentElement.props.key = ${element._currentElement.props.key}`); // testing
               //console.log(`element._currentElement.props.tag = ${element._currentElement.props.tag}`); // testing
               //var element = this.ReactNativeComponentTree.getInstanceFromNode(event.target);
               //this._measureElement(element._currentElement);
               var element = this.ReactNativeComponentTree.getInstanceFromNode(event.target);
               if (element._currentElement.props.tag === undefined) return;

               console.log(`element._currentElement.props.tag = ${element._currentElement.props.tag}`); // testing
               this.state.sectionHeaders[element._currentElement.props.tag] = event.target;
               console.log(`this.state.sectionHeaders.keys = ${Object.keys(this.state.sectionHeaders)}`);
            }}
         >
            <Text style={{ fontWeight: 'bold', }}>{sectionId}</Text>
         </View>
      )
   }

   _renderRow(rowData) {
      //console.log(`rowData["name"] = ${rowData["name"]}`); // testing
      return (
         <View style={{ height: 72, backgroundColor: '#080', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', }}>
            <Image style={{ width: 48, height: 48, margin: 12, backgroundColor: '#CCC', }}
               source={{ uri: rowData["icon"] }}
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
