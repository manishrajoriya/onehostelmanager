import type React from "react"
import { useState } from "react"
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native"

interface WhatsAppModalProps {
  isVisible: boolean
  onClose: () => void
  onSend: (message: string) => void
  contactNumber: string
}

const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ isVisible, onClose, onSend, contactNumber }) => {
  const [message, setMessage] = useState("")

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Send WhatsApp Message</Text>
          <TextInput
            style={styles.input}
            multiline
            placeholder="Type your message here"
            value={message}
            onChangeText={setMessage}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={() => onSend(message)}>
              <Text style={styles.buttonText}>Send</Text>
            </TouchableOpacity>

          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    minHeight: 100,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: "#6B46C1",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
  },
  closeButton: {
    marginTop: 10,
  },
  closeButtonText: {
    color: "#6B46C1",
    textAlign: "center",
  },
})

export default WhatsAppModal

