import React, { useEffect, useState } from "react";
import Lottie from "lottie-react";

import micStart from "../assets/Animation - 1744383706581.json"; // 초기 애니메이션
import micSpeaking from "../assets/Animation - 1744383725640.json"; // 전환 애니메이션
import "../styles/FaceAnimation.css"

function DynamicMic() {
    const [animationData, setAnimationData] = useState(micStart);

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimationData(micSpeaking); // 10초 뒤에 교체
        }, 10000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div  className="container" style={{
            backgroundColor: "transparent", // 배경 제거
            opacity: 0.5, // 투명도 적용
            pointerEvents: "none", // 클릭 방지 (선택사항)
            display: "flex", margin: "auto 0px"

        }} >
            <Lottie
                animationData={animationData}
                loop
                autoplay
                style={{width : "80px"}}
            />
        </div>
    );
}

export default DynamicMic;
