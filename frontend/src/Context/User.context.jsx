import { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        // Try to load the user from local storage

        const savedUser = localStorage.getItem("user");
        // console.log(savedUser);
        return savedUser ? JSON.parse(savedUser) : null;

    });

    useEffect(() => {

        if (user) {
            // console.log(user)
            localStorage.setItem("user", JSON.stringify(user)); // Save when user logs in
        } else {
            localStorage.removeItem("user");
        }
    }, [user]);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};
