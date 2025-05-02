// src/components/PaywallModal.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { showPaywall } from "@/firebase/subscription"

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscriptionComplete: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  onSubscriptionComplete,
}) => {
  const handlePurchase = async () => {
    const hasSubscribed = await showPaywall();
    if (hasSubscribed) {
      onSubscriptionComplete();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Upgrade Required</Text>
        <Text style={styles.text}>
          You've reached the limit of 5 members. Upgrade to premium to add unlimited members.
        </Text>
        
        <View style={styles.features}>
          <Text style={styles.featureItem}>✓ Add Unlimited members</Text>
          <Text style={styles.featureItem}>✓ Add 20+ Hostels</Text>
          <Text style={styles.featureItem}>✓ Add Unlimited Data</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.purchaseButton}
          onPress={handlePurchase}
        >
          <Text style={styles.purchaseButtonText}>View Subscription Options</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onClose}
        >
          <Text style={styles.closeButtonText}>Not Now</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  features: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  featureItem: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  purchaseButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 15,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
  },
});