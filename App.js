import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  StyleSheet,
  Linking,
} from 'react-native';
import XLSX from 'xlsx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import { AppRegistry } from 'react-native';
AppRegistry.registerComponent('GoogleSheetsClone', () => App);

const ROWS = 10;
const COLUMNS = 5;

const initializeGridData = () => {
  const gridData = [];
  for (let i = 0; i < ROWS; i++) {
    const row = [];
    for (let j = 0; j < COLUMNS; j++) {
      row.push('');
    }
    gridData.push(row);
  }
  return gridData;
};

const App = () => {
  const [gridData, setGridData] = useState([]);

  useEffect(() => {
    loadGridData();
  }, []);

  const loadGridData = async () => {
    try {
      const data = await AsyncStorage.getItem('@gridData');
      if (data) {
        setGridData(JSON.parse(data));
      } else {
        setGridData(initializeGridData());
      }
    } catch (error) {
      console.error('Error loading data from AsyncStorage:', error);
    }
  };

  const saveGridData = async () => {
    try {
      await AsyncStorage.setItem('@gridData', JSON.stringify(gridData));
    } catch (error) {
      console.error('Error saving data to AsyncStorage:', error);
    }
  };

  const handleChange = (rowIndex, colIndex, value) => {
    const updatedGridData = [...gridData];
    updatedGridData[rowIndex][colIndex] = value;
    setGridData(updatedGridData);
  };

  const handleDownload = async () => {
    const worksheet = XLSX.utils.aoa_to_sheet(gridData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const wbout = XLSX.write(workbook, { type: 'binary', bookType: 'xlsx' });
  
    const arrayBuffer = new Uint8Array(wbout.split('').map((char) => char.charCodeAt(0)));
    const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
  
    const fileUri = RNFS.CachesDirectoryPath + '/GoogleSheetsClone.xlsx';
    await RNFS.writeFile(fileUri, blob);
  
    const options = {
      type: 'application/octet-stream',
      url: `file://${fileUri}`,
      showAppsToView: true,
    };
  
    try {
      await Share.open(options);
    } catch (error) {
      console.error('Error opening file:', error);
    }
  
    saveGridData();
  };
  
  
  
  const renderGrid = () => {
    return gridData.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.row}>
        {row.map((cell, colIndex) => (
          <TextInput
            key={colIndex}
            style={styles.cell}
            value={cell}
            onChangeText={(value) => handleChange(rowIndex, colIndex, value)}
            placeholderTextColor="gray"
            autoCapitalize="none"
          />
        ))}
      </View>
    ));
  };


  return (
    <View style={styles.container}>
      <ScrollView horizontal>
        <View style={styles.grid}>{renderGrid()}</View>
      </ScrollView>
      <View style={styles.navbar}>
        <Button title="Download" onPress={handleDownload} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  grid: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cell: {
    width: 90,
    height: 40,
    borderWidth: 1,
    borderColor: 'gray',
    padding: 5,
  },
  navbar: {
    marginTop: 20,
    alignItems: 'center',
  },
});

export default App;
