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
import OpenAI from "openai";

require("dotenv").config();

export default function ScanBill() {
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [focusDepth, setFocusDepth] = useState(0); // Default focus depth
  const [photoUri, setPhotoUri] = useState(null);
  const [textResult, setTextResult] = useState("");

  const openai = new OpenAI();

  const performOCRAndAnalysis = async () => {
    if (!photoUri) return;

    const formData = new FormData();
    formData.append("document", {
      uri: photoUri,
      type: "image/jpeg",
      name: "document.jpg",
    });

    try {
      // Convert the image to a blob and create a URL
      const response = await fetch(photoUri);
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      // Send the image URL to GPT-4o for analysis
      const gpt4oResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "json_object",
                    text: "Analyze the image and return a json object containing items, quantities, price, total price, and anything relating to service charge or tax",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: imageUrl,
                      detail: "high",
                    },
                  },
                ],
              },
            ],
            max_tokens: 300,
          }),
        }
      );

      const result = await gpt4oResponse.json();
      if (result.choices && result.choices[0].message.content) {
        setTextResult(JSON.stringify(result.choices[0].message.content));
      } else {
        console.error("Processing failed:", result);
      }
    } catch (error) {
      console.error("Error processing document:", error);
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
