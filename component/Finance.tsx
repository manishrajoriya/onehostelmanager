import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db } from "@/utils/firebaseConfig"; // Import Firebase config and auth
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

import useStore from "@/hooks/store";

// Define the shape of each item
interface Item {
  readonly id?: string; // Firestore will generate this ID
  readonly description: string;
  readonly amount: number;
  readonly type: "Earning" | "Expense";
  readonly userId: string;
 
}

// Custom hook for Firebase operations
const useFirebaseItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const itemsCollection = collection(db, "finance");

  const activeLibrary = useStore((state: any) => state.activeLibrary);
  const currentUser = useStore((state: any) => state.currentUser);

  const fetchItems = async () => {
    try {
      const q = query(itemsCollection, where("userId", "==", currentUser.uid), where("libraryId", "==", activeLibrary.id));
      const querySnapshot = await getDocs(q);
      const data: Item[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Item[];
      setItems(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const addItem = async (item: Omit<Item, "id">) => {
    try {
      const docRef = await addDoc(itemsCollection, { ...item, userId: currentUser.uid, libraryId: activeLibrary.id });
      setItems((prevItems) => [...prevItems, { ...item, id: docRef.id }]);
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const updateItem = async (item: Item) => {
    try {
      if (item.id) {
        await updateDoc(doc(db, "finance", item.id), {
          description: item.description,
          amount: item.amount,
          type: item.type,
        });
        setItems((prevItems) =>
          prevItems.map((prevItem) => (prevItem.id === item.id ? item : prevItem))
        );
      }
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, "finance", id));
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  useEffect(() => {
   
      fetchItems();
    
  }, []);

  return { items, addItem, updateItem, deleteItem };
};

const Finance: React.FC = () => {
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isEarning, setIsEarning] = useState<boolean>(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const { items, addItem, updateItem, deleteItem } = useFirebaseItems();

 

  const handleAddOrUpdate = async () => {
    if (!description || !amount) {
      Alert.alert("Error", "Please enter both description and amount.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount greater than 0.");
      return;
    }

    const newItem: Omit<Item, "id"> = {
      description,
      amount: parsedAmount,
      type: isEarning ? "Earning" : "Expense",
      userId: userId!,
    };

    if (editingIndex !== null) {
      const updatedItem = { ...items[editingIndex], ...newItem };
      await updateItem(updatedItem);
      setEditingIndex(null);
    } else {
      await addItem(newItem);
    }

    setDescription("");
    setAmount("");
  };

  const handleDelete = (id: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteItem(id),
      },
    ]);
  };

const calculateTotal = (): number => {
    return items.reduce(
      (acc, item) => (item.type === "Earning" ? acc + item.amount : acc - item.amount),
      0
    );
  };

  const handleEdit = (index: number) => {
    const item = items[index];
    setDescription(item.description);
    setAmount(item.amount.toString());
    setIsEarning(item.type === "Earning");
    setEditingIndex(index);
  };

  const renderItem = ({ item, index }: { item: Item; index: number }) => (
    <ItemRow
      item={item}
      onEdit={() => handleEdit(index)}
      onDelete={() => handleDelete(item.id!)}
    />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Earnings & Expenses Tracker</Text>
      <Text style={styles.balance}>Balance: ₹{calculateTotal().toFixed(2)}</Text>

      <InputSection
        description={description}
        amount={amount}
        isEarning={isEarning}
        onDescriptionChange={setDescription}
        onAmountChange={setAmount}
        onToggleEarning={() => setIsEarning(!isEarning)}
        onAddOrUpdate={handleAddOrUpdate}
        isEditing={editingIndex !== null}
      />

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id!}
        style={styles.list}
      />
    </View>
  );
};

const ItemRow: React.FC<{
  item: Item;
  onEdit: () => void;
  onDelete: () => void;
}> = React.memo(({ item, onEdit, onDelete }) => (
  <View style={styles.item}>
    <View>
      <Text style={styles.itemDescription}>{item.description}</Text>
      <Text
        style={[
          styles.itemAmount,
          item.type === "Earning" ? styles.earning : styles.expense,
        ]}
      >
        {item.type === "Earning" ? "+" : "-"}₹{item.amount.toFixed(2)}
      </Text>
    </View>
    <View style={styles.actions}>
      <TouchableOpacity onPress={onEdit}>
        <Ionicons name="pencil" size={20} color="#4285F4" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={{ marginLeft: 16 }}>
        <Ionicons name="trash" size={20} color="#EA4335" />
      </TouchableOpacity>
    </View>
  </View>
));

const InputSection: React.FC<{
  description: string;
  amount: string;
  isEarning: boolean;
  onDescriptionChange: (text: string) => void;
  onAmountChange: (text: string) => void;
  onToggleEarning: () => void;
  onAddOrUpdate: () => void;
  isEditing: boolean;
}> = ({
  description,
  amount,
  isEarning,
  onDescriptionChange,
  onAmountChange,
  onToggleEarning,
  onAddOrUpdate,
  isEditing,
}) => (
  <View style={styles.inputContainer}>
    <TextInput
      placeholder="Amount"
      value={amount}
      onChangeText={onAmountChange}
      style={styles.input}
      keyboardType="numeric"
    />
    <TextInput
      placeholder="Description"
      value={description}
      onChangeText={onDescriptionChange}
      style={styles.input}
    />
    <View style={styles.typeToggle}>
      <TouchableOpacity
        style={[styles.toggleButton, isEarning ? styles.active : {}]}
        onPress={onToggleEarning}
      >
        <Text style={styles.toggleText}>Earning</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggleButton, !isEarning ? styles.active : {}]}
        onPress={onToggleEarning}
      >
        <Text style={styles.toggleText}>Expense</Text>
      </TouchableOpacity>
    </View>
    <TouchableOpacity style={styles.addButton} onPress={onAddOrUpdate}>
      <Text style={styles.addButtonText}>{isEditing ? "Update" : "Add"}</Text>
    </TouchableOpacity>
  </View>
);

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  balance: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  typeToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 8,
    alignItems: "center",
  },
  active: {
    backgroundColor: "#e0f7fa",
    borderColor: "#00796b",
  },
  toggleText: {
    fontSize: 16,
    color: "#333",
  },
  addButton: {
    backgroundColor: "#34A853",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  list: {
    flex: 1,
  },
  item: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  earning: {
    color: "#34A853",
  },
  expense: {
    color: "#EA4335",
  },
  actions: {
    flexDirection: "row",
  },
});

export default Finance;