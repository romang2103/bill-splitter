import { CameraView, useCameraPermissions } from "expo-camera";
import { useState, useRef } from "react";
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
} from "react-native";
import Slider from "@react-native-community/slider";

export default function ScanBill() {
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [focusDepth, setFocusDepth] = useState(0); // Default focus depth
  const [photoUri, setPhotoUri] = useState(null);
  const [textResult, setTextResult] = useState("");

  const performOCR = async () => {
    if (!photoUri) return;

    const formData = new FormData();
    formData.append("document", {
      uri: photoUri,
      type: "image/jpeg",
      name: "document.jpg",
    });

    try {
      const response = await fetch(
        "https://protected-dawn-92499-c2ffee5a716f.herokuapp.com/process-document",
        {
          method: "POST",
          body: formData,
        }
      );
      const result = await response.json();
      if (result.entities) {
        setTextResult(JSON.stringify(result.entities));
      } else {
        console.error("OCR text extraction failed:", result);
      }
    } catch (error) {
      console.error("Error performing OCR:", error);
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  const takePhoto = async () => {
    if (cameraRef.current) {
      const { uri } = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        autoFocus: "on",
      });
      setPhotoUri(uri);
      setTextResult("");
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
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing={facing}
            ref={cameraRef}
            autoFocus="on"
            focusDepth={focusDepth}
          >
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={toggleCameraFacing}
              >
                <Text style={styles.text}>Flip Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={takePhoto}>
                <Text style={styles.text}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
          <Slider
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
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
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
