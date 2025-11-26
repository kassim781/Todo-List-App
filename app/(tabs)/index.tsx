import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { Ionicons } from "@expo/vector-icons";

type Task = {
  id: string;
  text: string;
  completed: boolean;
};

export default function App() {
  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const keyboardAnim = useRef(new Animated.Value(0)).current;
  const deleteAnimRefs: Record<string, Animated.Value> = {};

  // ✨ Fade animation on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // 🎹 Keyboard animation
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardWillShow", (e) => {
      Animated.timing(keyboardAnim, {
        toValue: e.endCoordinates.height - 50,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener("keyboardWillHide", () => {
      Animated.timing(keyboardAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const openInput = () => {
    setShowInput(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
  };

  const closeInput = () => {
    Animated.spring(slideAnim, {
      toValue: 300,
      useNativeDriver: true,
    }).start(() => setShowInput(false));
  };

  const addTask = () => {
    if (task.trim().length === 0) return;
    setTasks([...tasks, { id: Date.now().toString(), text: task, completed: false }]);
    setTask("");
    closeInput();
  };

  const toggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const startEditing = (id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
  };

  const saveEdit = (id: string) => {
    if (editingText.trim() === "") return;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text: editingText } : t))
    );
    setEditingId(null);
    setEditingText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const deleteTask = (id: string) => {
    Animated.timing(deleteAnimRefs[id], {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      delete deleteAnimRefs[id];
    });
  };

  // 🧹 Swipe delete UI
  const renderRightActions = (dragX: Animated.AnimatedInterpolation<number>, id: string) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });
    const opacity = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <Animated.View style={[styles.deleteBox, { transform: [{ scale }], opacity }]}>
        <TouchableOpacity onPress={() => deleteTask(id)}>
          <Ionicons name="trash-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderItem = ({ item, drag, isActive }: any) => {
    if (!deleteAnimRefs[item.id]) deleteAnimRefs[item.id] = new Animated.Value(1);
    return (
      <ScaleDecorator>
        <Swipeable
          renderRightActions={(progress, dragX) =>
            renderRightActions(dragX, item.id)
          }
          overshootRight={false}
        >
          <Animated.View
            style={{
              marginBottom: 10,
              opacity: deleteAnimRefs[item.id],
              transform: [{ scale: deleteAnimRefs[item.id] }],
            }}
          >
            <TouchableOpacity
              onLongPress={drag}
              disabled={isActive}
              style={[
                styles.taskItem,
                item.completed && styles.taskCompleted,
                isActive && { transform: [{ scale: 1.05 }] },
              ]}
              activeOpacity={0.9}
            >
              {editingId === item.id ? (
                <View style={styles.editRow}>
                  <TextInput
                    value={editingText}
                    onChangeText={setEditingText}
                    style={styles.editInput}
                    placeholder="Edit your task..."
                    placeholderTextColor="#888"
                  />
                  <TouchableOpacity onPress={() => saveEdit(item.id)}>
                    <Ionicons name="checkmark-circle" size={26} color="#00C853" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={cancelEdit}>
                    <Ionicons name="close-circle" size={26} color="#FF5252" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.row}>
                  <TouchableOpacity onPress={() => toggleComplete(item.id)} style={{ flex: 1 }}>
                    <Text
                      style={[styles.taskText, item.completed && styles.completedText]}
                      numberOfLines={2}
                    >
                      {item.text}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => startEditing(item.id, item.text)}>
                    <Ionicons name="create-outline" size={22} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Swipeable>
      </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ImageBackground
        source={require("@/assets/images/tobg.jpg")}
        style={styles.background}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Animated.View style={{ opacity: fadeAnim, flex: 1, padding: 20 }}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.welcomeText}>Welcome 👋</Text>
              <TouchableOpacity onPress={openInput}>
                <Ionicons name="add-circle-outline" size={36} color="#000" />
              </TouchableOpacity>
            </View>

            <Text style={styles.title}>Your To-Do List</Text>

            <DraggableFlatList
              data={tasks}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              onDragEnd={({ data }) => setTasks(data)}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No tasks yet. Tap + to add one!</Text>
              }
              contentContainerStyle={{ paddingBottom: 100 }}
            />

            {/* Animated Popup */}
            {showInput && (
              <Animated.View
                style={[
                  styles.popupCard,
                  {
                    transform: [
                      { translateY: slideAnim },
                      { translateY: Animated.multiply(keyboardAnim, -1) },
                    ],
                  },
                ]}
              >
                <Text style={styles.popupTitle}>Add New Task</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter a task..."
                  placeholderTextColor="#888"
                  value={task}
                  onChangeText={setTask}
                  autoFocus
                />
                <View style={styles.popupButtons}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={closeInput}>
                    <Text style={styles.btnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addBtn} onPress={addTask}>
                    <Text style={styles.btnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
  },
  welcomeText: { fontSize: 22, color: "#000", fontWeight: "600" },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginVertical: 15,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  taskItem: {
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 15,
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  editRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  editInput: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 16,
  },
  taskCompleted: { backgroundColor: "#C8FACC" },
  taskText: { fontSize: 16, color: "#333" },
  completedText: { textDecorationLine: "line-through", color: "#777" },
  emptyText: {
    textAlign: "center",
    color: "#000",
    fontSize: 16,
    marginTop: 40,
  },
  deleteBox: {
    backgroundColor: "#FF1744",
    justifyContent: "center",
    alignItems: "center",
    width: 70,
    marginVertical: 2,
    borderRadius: 12,
    bottom:5,
  },
  popupCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 10,
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  popupButtons: { flexDirection: "row", justifyContent: "space-between" },
  cancelBtn: {
    backgroundColor: "#FF5252",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  addBtn: {
    backgroundColor: "#00C853",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  btnText: { color: "#fff", fontWeight: "600" },
});
