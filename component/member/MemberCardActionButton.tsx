import React from "react";
import { FlatList, StyleSheet } from "react-native";
import { ActionButton } from "../ActionBtnUi"; 
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface ActionItem {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}

interface ActionButtonsProps {
  memberId: string;  // Accepting memberId as a prop
}

export const ActionButtons: React.FC<ActionButtonsProps> = React.memo(({ memberId }) => {
  const router = useRouter();
  const actionData: ActionItem[] = [
    { icon: "edit-2", label: "Edit", onPress: () => handleEdit(memberId) },
    { icon: "plus", label: "Add Pay", onPress: () => handleAddPay(memberId) },
    { icon: "refresh-ccw", label: "Renew", onPress: () => handleRenew(memberId) },
    { icon: "user", label: "Profile", onPress: () => handleProfile(memberId) },
  ];

  // Define handlers with memberId
  function handleEdit(id: string) {
    router.push(`/editMember?id=${id}`);
    console.log(`Edit pressed for Member ID: ${id}`);
  }

  function handleAddPay(id: string) {
    console.log(`Add Pay pressed for Member ID: ${id}`);
  }

  function handleRenew(id: string) {
    console.log(`Renew pressed for Member ID: ${id}`);
  }

  function handleProfile(id: string) {
    console.log(`Profile pressed for Member ID: ${id}`);
  }

  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.actionScrollView}
      data={actionData}
      renderItem={({ item }) => <ActionButton {...item} />}
      keyExtractor={(item) => item.label} // Use label as the key
    />
  );
});

const styles = StyleSheet.create({
  actionScrollView: {
    flexGrow: 0,
  },
});
