import { Camera, CameraType, AutoFocus } from "expo-camera";
import { useState, useRef } from "react";
import Slider from "@react-native-community/slider";
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ImageBackground,
  Dimensions,
} from "react-native";

export default function ScanBill() {
  const [type, setType] = useState(CameraType.back);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const cameraRef = useRef(null);
  const [focusDepth, setFocusDepth] = useState(0); // Default focus depth

  const [photoUri, setPhotoUri] = useState(null);
  const [textResult, setTextResult] = useState("");

  // Focus camera on click
  const handleFocus = async (e) => {
    const newFocusDepth = focusDepth === 0 ? 1 : 0;
    setFocusDepth(newFocusDepth);
  };

  const performOCR = async () => {
    if (!photoUri) return;

    const formData = new FormData();
    formData.append("document", {
      // This key matches the Flask app's expected key
      uri: photoUri,
      type: "image/jpeg", // Ensure this matches the expected MIME type of your backend
      name: "document.jpg",
    });

    try {
      const response = await fetch(
        "https://protected-dawn-92499.herokuapp.com/process-document", // Use your actual backend URL here
        {
          method: "POST",
          body: formData,
        }
      );
      console.log("awaiting response");
      const result = await response.json();
      if (result.entities) {
        // Assuming your backend returns an 'entities' array
        // Process and display the results as needed, perhaps updating state to display the results
        setTextResult(JSON.stringify(result.entities)); // Example: Update state to display the OCR results
        console.log("OCR Entities:", result.entities);
      } else {
        console.error("OCR text extraction failed:", result);
      }
    } catch (error) {
      console.error("Error performing OCR:", error);
    }
  };

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  function toggleCameraType() {
    setType((current) =>
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  }

  const takePhoto = async () => {
    if (cameraRef.current) {
      const { uri } = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        AutoFocus: "on",
      });
      setPhotoUri(uri);
      setTextResult("");
      console.log(uri);
    }
  };

  const retakePhoto = () => {
    setPhotoUri(null);
    setTextResult("");
  };

  return (
    <View style={styles.container}>
      {photoUri ? (
        <View style={styles.photoContainer}>
          <ImageBackground source={{ uri: photoUri }} style={styles.photo}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={retakePhoto}>
                <Text style={styles.text}>Retake Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={performOCR}>
                <Text style={styles.text}>Continue</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>
      ) : (
        <View style={styles.container}>
          <Camera
            style={styles.camera}
            type={type}
            ref={cameraRef}
            autoFocus={AutoFocus.on}
            focusDepth={focusDepth} // Control the focus depth with the slider
          >
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={toggleCameraType}
              >
                <Text style={styles.text}>Flip Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={takePhoto}>
                <Text style={styles.text}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          </Camera>
          <Slider // Add the Slider component
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="#000000"
            value={focusDepth}
            onValueChange={setFocusDepth}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  camera: {
    flex: 1,
    autoFocus: AutoFocus.on,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "transparent",
    margin: 20,
  },
  button: {
    flex: 1,
    alignSelf: "flex-end",
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    color: "white",
  },
  photoContainer: {
    flex: 1,
  },
  photo: {
    flex: 1,
    resizeMode: "cover",
  },
  slider: {
    width: 300,
    height: 40,
    marginTop: 10,
    alignSelf: "center",
    backgroundColor: "transparent",
  },
});
