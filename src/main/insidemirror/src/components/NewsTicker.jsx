import React, { useEffect, useState } from "react";
import "../styles/NewsTicker.css";

const dummyNews = [
    { category: "정치", text: "법원, 재판출석 尹 요청시 지하출입 허용…차량통제·검색강화" },
    { category: "경제", text: "정부, 긴급재난지원금 논의 시작" },
    { category: "IT", text: "AI 기술로 위조 방지 기술 급부상" },
    { category: "사회", text: "국내 관광객 수, 팬데믹 이후 최고치" },
    { category: "날씨", text: "기상청, 이번 주말 전국 맑고 따뜻" }
];

function NewsTicker() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % dummyNews.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    const { category, text } = dummyNews[currentIndex];

    return (
        <div className="news-ticker-enhanced">
            <span className="category-label">{category}</span>
            <span className="news-text">{text}</span>
        </div>
    );
}

export default NewsTicker;
