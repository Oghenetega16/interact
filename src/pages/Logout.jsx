import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import useChatStore from "../store/useChatStore";

const logout = async () => {
  try {
    await signOut(auth);
    useChatStore.getState().logout(); // Zustand reset
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
