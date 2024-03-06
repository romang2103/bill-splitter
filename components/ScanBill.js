import { Camera, CameraType } from "expo-camera";
import { useState, useRef } from "react";
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ImageBackground,
} from "react-native";

export default function ScanBill() {
  const [type, setType] = useState(CameraType.back);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const cameraRef = useRef(null);

  const [photoUri, setPhotoUri] = useState(null);
  const [textResult, setTextResult] = useState("");

  const performOCR = async () => {
    const formData = new FormData();
    formData.append("image", {
      uri: photoUri,
      type: "image/jpeg", // or the correct image type
      name: "image.jpg",
    });

    try {
      const response = await fetch(
        "https://stormy-scrubland-81714-07bd8ed899b9.herokuapp.com/api/ocr",
        {
          method: "POST",
          body: formData,
        }
      );
      console.log("awaiting response");
      const result = await response.json();
      console.log(result.text);
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
      const { uri } = await cameraRef.current.takePictureAsync();
      setPhotoUri(uri);
      console.log(uri);
    }
  };

  const retakePhoto = () => {
    setPhotoUri(null);
  };

  const sendPhotoForAnalysis = () => {
    // Implement logic to send the photo for analysis
    console.log("Sending photo for analysis:", photoUri);
    // Add your logic for sending the photo to the ML model here
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
        <Camera style={styles.camera} type={type} ref={cameraRef}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={toggleCameraType}>
              <Text style={styles.text}>Flip Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={takePhoto}>
              <Text style={styles.text}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        </Camera>
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
});
