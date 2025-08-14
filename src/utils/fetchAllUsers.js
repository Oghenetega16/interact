import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

export const fetchAllUsers = async () => {
  const usersRef = collection(db, "users");
  const querySnapshot = await getDocs(usersRef);

  return querySnapshot.docs.map(doc => doc.data());
};
