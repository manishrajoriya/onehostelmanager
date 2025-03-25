import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/utils/firebaseConfig";

export const pickImageSource = () => {
  return new Promise<"camera" | "gallery">((resolve) => {
    Alert.alert(
      "Choose Image Source",
      "Would you like to take a photo or choose from your gallery?",
      [
        {
          text: "Camera",
          onPress: () => resolve("camera"),
        },
        {
          text: "Gallery",
          onPress: () => resolve("gallery"),
        },
      ],
      { cancelable: true }
    );
  });
};

export const pickImage = async (source: "camera" | "gallery") => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permission Required", "Camera and gallery permissions are required!");
    return null;
  }

  let result;
  if (source === "camera") {
    result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  } else {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });
  }

  if (!result.canceled && result.assets && result.assets.length > 0) {
    return result.assets[0].uri;
  }

  return null;
};

export const uploadImageToFirebase = async (uri: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const filename = uri.substring(uri.lastIndexOf("/") + 1);
  const storageRef = ref(storage, `uploads/${filename}`);

  try {
    const snapshot = await uploadBytes(storageRef, blob);
    return await getDownloadURL(snapshot.ref);
  } catch (error: any) {
    console.error("Error uploading file: ", error);
    Alert.alert("Upload Error", "Failed to upload file. The file will be stored locally for now.");
    return uri;
  }
};
