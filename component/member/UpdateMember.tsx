import React, { useState } from 'react';
import { Modal, View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Title } from 'react-native-paper';
import { updateMember } from '@/firebase/functions';

interface UpdateMemberModalProps {
  visible: boolean;
  onClose: () => void;
  member: any; // Replace 'any' with your Member type if available
  onUpdate: () => void;
}

const UpdateMemberModal: React.FC<UpdateMemberModalProps> = ({ visible, onClose, member, onUpdate }) => {
  const [formData, setFormData] = useState({
    fullName: member.fullName,
    address: member.address,
    contactNumber: member.contactNumber,
    email: member.email,
    admissionDate: member.addmissionDate.toISOString().split('T')[0],
    expiryDate: member.expiryDate.toISOString().split('T')[0],
    seatNumber: member.seatNumber,
    dueAmount: member.dueAmount.toString(),
    totalAmount: member.totalAmount.toString(),
    paidAmount: member.paidAmount.toString(),
    plan: member.plan,
  });

  const handleChange = (name: string, value: string) => {
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      await updateMember({ memberId: member.id, data: formData });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating member:', error);
      // Handle error (e.g., show an error message)
    }
  };

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide">
      <ScrollView style={styles.container}>
        <Title style={styles.title}>Update Member</Title>
        <TextInput
          label="Full Name"
          value={formData.fullName}
          onChangeText={(text) => handleChange('fullName', text)}
          style={styles.input}
        />
        <TextInput
          label="Address"
          value={formData.address}
          onChangeText={(text) => handleChange('address', text)}
          style={styles.input}
        />
        <TextInput
          label="Contact Number"
          value={formData.contactNumber}
          onChangeText={(text) => handleChange('contactNumber', text)}
          style={styles.input}
          keyboardType="phone-pad"
        />
        <TextInput
          label="Email"
          value={formData.email}
          onChangeText={(text) => handleChange('email', text)}
          style={styles.input}
          keyboardType="email-address"
        />
        <TextInput
          label="Admission Date"
          value={formData.admissionDate}
          onChangeText={(text) => handleChange('admissionDate', text)}
          style={styles.input}
        />
        <TextInput
          label="Expiry Date"
          value={formData.expiryDate}
          onChangeText={(text) => handleChange('expiryDate', text)}
          style={styles.input}
        />
        <TextInput
          label="Seat Number"
          value={formData.seatNumber}
          onChangeText={(text) => handleChange('seatNumber', text)}
          style={styles.input}
        />
        <TextInput
          label="Due Amount"
          value={formData.dueAmount}
          onChangeText={(text) => handleChange('dueAmount', text)}
          style={styles.input}
          keyboardType="numeric"
        />
        <TextInput
          label="Total Amount"
          value={formData.totalAmount}
          onChangeText={(text) => handleChange('totalAmount', text)}
          style={styles.input}
          keyboardType="numeric"
        />
        <TextInput
          label="Paid Amount"
          value={formData.paidAmount}
          onChangeText={(text) => handleChange('paidAmount', text)}
          style={styles.input}
          keyboardType="numeric"
        />
        <TextInput
          label="Plan"
          value={formData.plan}
          onChangeText={(text) => handleChange('plan', text)}
          style={styles.input}
        />
        <View style={styles.buttonContainer}>
          <Button mode="contained" onPress={handleSubmit} style={styles.button}>
            Update
          </Button>
          <Button mode="outlined" onPress={onClose} style={styles.button}>
            Cancel
          </Button>
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    width: '40%',
  },
});

export default UpdateMemberModal;