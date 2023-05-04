import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet, ScrollView, Share, Clipboard } from 'react-native';
import { SQLite } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';

const db = SQLite.openDatabase('texts.db');

const App = () => {
  const [texts, setTexts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('Tous');
  const [fontSize, setFontSize] = useState(16);
  const [autoScroll, setAutoScroll] = useState(false);
  const [selectedText, setSelectedText] = useState(null);
  const [highlightedTexts, setHighlightedTexts] = useState([]);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS texts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, number INTEGER, category TEXT, content TEXT);'
      );
    });
  }, []);

  useEffect(() => {
    if (searchTerm.length > 0) {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM texts WHERE title LIKE ?;',
          [`%${searchTerm}%`],
          (_, { rows }) => setTexts(rows._array)
        );
      });
    } else if (category === 'Tous') {
      db.transaction((tx) => {
        tx.executeSql('SELECT * FROM texts;', [], (_, { rows }) => setTexts(rows._array));
      });
    } else {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM texts WHERE category = ?;',
          [category],
          (_, { rows }) => setTexts(rows._array)
        );
      });
    }
  }, [searchTerm, category]);

  const handleAddText = () => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO texts (title, number, category, content) VALUES (?, ?, ?, ?);',
        ['Nouveau texte', Math.floor(Math.random() * 100), 'Non classé', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'],
        (_, { insertId }) => {
          setTexts([...texts, { id: insertId, title: 'Nouveau texte', number: Math.floor(Math.random() * 100), category: 'Non classé', content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' }]);
        }
      );
    });
  };

  const handleToggleFavorite = (text) => {
    if (favorites.some((fav) => fav.id === text.id)) {
      setFavorites(favorites.filter((fav) => fav.id !== text.id));
    } else {
      setFavorites([...favorites, text]);
    }
  };

  const handleDeleteText = (id) => {
    db.transaction((tx) => {
      tx.executeSql('DELETE FROM texts WHERE id = ?;', [id], () => {
        setTexts(texts.filter((text) => text.id !== id));
      });
    });
  };

  const handleSearch = (text) => {
    setSearchTerm(text);
  };

  const handleCategoryChange = (category) => {
    setCategory(category);
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
  };

  const handleAutoScrollChange = () => {
    setAutoScroll(!autoScroll);
  };

  const handleTextPress = (text) => {
    setSelectedText(text);
  };

  const handleHighlight = (text) => {
    if (highlightedTexts.some((highlighted) => highlighted.id === text.id)) {
      setHighlightedTexts(highlightedTexts.filter((highlighted) => highlighted.id !== text.id));
    } else {
      setHighlightedTexts([...highlightedTexts, text]);
    }
  };

  const handleShare = () => {
    Share.share({
      message: `Lisez "${selectedText.title}" sur Ma bibliothèque de textes : ${selectedText.content}`,
    });
  };

  const handleCopy = () => {
    Clipboard.setString(selectedText.content);
  };

  const renderText = ({ item }) => (
    <TouchableOpacity onPress={() => handleTextPress(item)}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{item.title}</Text>
        {favorites.some((fav) => fav.id === item.id) ? (
          <Text style={{ color: 'red', fontSize: 20 }}>★</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const renderCategory = (categoryName) => (
    <TouchableOpacity onPress={() => handleCategoryChange(categoryName)}>
      <View style={[styles.categoryButton, category === categoryName ? styles.activeCategoryButton : null]}>
        <Text style={{ color: 'white', fontSize: 16 }}>{categoryName}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHighlightedText = (text) => (
    <TouchableOpacity onPress={() => handleTextPress(text)}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 }}>
        <Text style={{ fontSize: 18 }}>{text.title}</Text>
        <Text style={{ color: 'red', fontSize: 18 }}>★</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Ma bibliothèque de textes</Text>
      </View>
      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} placeholder="Rechercher" value={searchTerm} onChangeText={handleSearch} />
        <TouchableOpacity onPress={handleAddText}>
          <Ionicons name="add-circle-outline" size={28} color="blue" style={{ marginLeft: 10 }} />
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
        {renderCategory('Tous')}
        {renderCategory('Non classé')}
        {renderCategory('Favoris')}
      </ScrollView>
      <View style={styles.preferencesContainer}>
        <TouchableOpacity onPress={() => handleFontSizeChange(fontSize + 2)}>
          <Ionicons name="add-circle-outline" size={28} color="blue" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18 }}>{fontSize}</Text>
        <TouchableOpacity onPress={() => handleFontSizeChange(fontSize - 2)}>
          <Ionicons name="remove-circle-outline" size={28} color="blue" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAutoScrollChange}>
          <Ionicons name={autoScroll ? 'ios-checkbox-outline' : 'ios-square-outline'} size={28} color="blue" />
        </TouchableOpacity>
      </View>
      {selectedText ? (
        <View style={styles.selectedTextContainer}>
          <Text style={{ fontSize }}>{selectedText.content}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <TouchableOpacity onPress={handleToggleFavorite.bind(null, selectedText)}>
              {favorites.some((fav) => fav.id === selectedText.id) ? (
                <Ionicons name="star" size={28} color="red" />
              ) : (
                <Ionicons name="star-outline" size={28} color="blue" />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCopy}>
              <Ionicons name="copy" size={28} color="blue" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare}>
              <Ionicons name="share" size={28} color="blue" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList data={highlightedTexts} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => renderHighlightedText(item)} />
      )}
      <FlatList data={texts} keyExtractor={(item) => item.id.toString()} renderItem={renderText} />
      {autoScroll ? <View style={{ height: 100 }} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'blue',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 5,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  categoryButton: {
    backgroundColor: 'gray',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginRight: 10,
  },
  activeCategoryButton: {
    backgroundColor: 'blue',
  },
  preferencesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    marginBottom: 10,
  },
  selectedTextContainer: {
    marginHorizontal: 10,
    marginTop: 10,
  }
});