import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

interface ActionButtonProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}

export const ActionButton: React.FC<ActionButtonProps> = React.memo(({ icon, label, onPress }) => (
  <TouchableOpacity
    style={styles.actionButton}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <Feather name={icon} size={20} color="#555" />
    <Text style={styles.actionButtonText}>{label}</Text>
  </TouchableOpacity>
));

const styles = StyleSheet.create({
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    marginRight: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    minWidth: 100,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
});