// hooks/useAuth.ts
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase";

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            console.log("Auth state changed:", firebaseUser);

            // Optional: Only allow verified users
            if (firebaseUser && firebaseUser.emailVerified) {
                setUser(firebaseUser);
            } else {
                setUser(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { user, loading };
}
