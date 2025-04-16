import React, { useEffect, useState } from 'react';

const greetings = [
    "Wishing you a happy day today!",
    "This very moment is precious.",
    "It's time for your efforts to shine.",
    "Close your eyes and take a deep breath.",
    "You're doing great today.",
    "Happiness is closer than you think.",
    "You are not alone.",
    "May today be a day full of gratitude for even the small things.",
    "You're doing just fine in this very moment.",
    "Wishing you a peaceful and calm day.",
    "Don't forget to take things slow and breathe.",
    "It's the beginning of a good day!",
];

function Hello() {
    const [greeting, setGreeting] = useState("");

    useEffect(() => {
        const updateGreeting = () => {
            const hour = new Date().getHours();
            const index = hour % greetings.length;
            setGreeting(greetings[index]);
        };

        updateGreeting();
        const interval = setInterval(updateGreeting, 3600000); // 1시간마다

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="hello-message">
            <h2>{greeting}</h2>
        </div>
    );
}

export default Hello;
