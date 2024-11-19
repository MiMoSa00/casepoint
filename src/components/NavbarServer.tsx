'use client';  // This line makes the component a Client Component

import { useState, useEffect } from 'react';

// Define the shape of the user object
interface User {
    given_name: string;
    family_name: string;
    email: string;
    // Add any other properties you expect from the user object
}

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null); // Explicitly define user type as User or null

    useEffect(() => {
        // Call your API route to get user data
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth');
                const data = await res.json();
                setUser(data.authResponse); // Update user data from the API response
            } catch (error) {
                console.error("Error fetching user:", error);
            }
        };

        fetchUser();
    }, []);

    return (
        <nav>
            {user ? <p>Welcome, {user.given_name}</p> : <p>Loading...</p>}
        </nav>
    );
}
