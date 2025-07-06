import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const AssessmentDetailsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Assessment Details</Text>
        <Text style={styles.description}>Details about the selected assessment will be displayed here.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default AssessmentDetailsScreen;
