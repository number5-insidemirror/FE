import React, { useRef, useEffect, useState } from "react";
import "./styles/App.css"; // 스타일 파일
import bus from "../src/img/bus.png";
import {
  IoPause,
  IoPlay,
  IoPlaySkipBack,
  IoPlaySkipForward,
  IoStop,
  IoVolumeHigh,
  IoVolumeLow,
  IoVolumeMedium,
  IoVolumeMute,
} from "react-icons/io5";

import { useYoutube } from "./useYoutube.ts";
import { PlayerState } from "./types.ts";

function App() {
  const { playerDetails, actions } = useYoutube({
    //id: "RDgXWYOF0UhCk",
    id: "PL4fGSI1pDJn5S09aId3dUGp40ygUqmPGc",
    type: "playlist",
  });

  const renderVolumeIcon = () => {
    if (playerDetails.volume === 0) {
      return <IoVolumeMute />;
    }
    if (playerDetails.volume <= 30) {
      return <IoVolumeLow />;
    }
    if (playerDetails.volume <= 60) {
      return <IoVolumeMedium />;
    }
    return <IoVolumeHigh />;
  };

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  const [currentName, setCurrentName] = useState("Unknown");
  const [remainingTime, setRemainingTime] = useState(5);

  // 텍스트 음성 합성 (TTS)
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR"; // 한국어
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (currentName !== "Unknown") {
      speak(`안녕하세요, ${currentName} 님`);
    }
  }, [currentName]); // currentName이 변경될 때마다 음성 출력



  useEffect(() => {
    // 웹캠 시작
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing the camera:", error);
      }
    };

    startCamera();

    /*
    // WebGazer 초기화 및 시선 추적 설정
    const loadWebGazer = () => {
      if (typeof window.webgazer !== "undefined") {
        console.log("WebGazer is loaded");

        // 'TFFacemesh' 추적기 설정
        window.webgazer
            .setRegression("ridge") // 회귀 방식 설정
            .setTracker("TFFacemesh") // 추적기 설정
            .begin()
            .then(() => {
              // WebGazer가 정상적으로 시작되었을 때만 prediction points 표시
              console.log("WebGazer initialized");

              // 시선 추적 데이터 리스너 설정
              window.webgazer.setGazeListener((data, timestamp) => {
                if (data != null) {
                  // 캔버스에 시선 점 표시
                  const canvas = canvasRef.current;
                  if (canvas) {
                    const context = canvas.getContext("2d");
                    if (context) {
                      context.clearRect(0, 0, canvas.width, canvas.height); // 이전 점 지우기
                      context.beginPath();
                      context.arc(data.x, data.y, 5, 0, 2 * Math.PI); // 시선 점 그리기
                      context.fill();
                    }
                  }
                }
              });
            })
            .catch((err) => {
              console.error("Error initializing WebGazer:", err);
            });
      } else {
        console.error("WebGazer not loaded correctly.");
      }
    };

    loadWebGazer();


    return () => {
      // cleanup when component unmounts
      if (window.webgazer) {
        window.webgazer.end();
      }
    };
     */

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    // 매초마다 캡처 후 서버로 전송
    const intervalId = setInterval(captureAndSendFrame, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const updateTimeAndDate = () => {
      const now = new Date();

      // 현재 시간 (00:00 ~ 23:59)
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setTime(`${hours}:${minutes}`);

      // 현재 날짜 (yyyy-mm-dd)
      const options = { year: "numeric", month: "2-digit", day: "2-digit" };
      const formattedDate = now.toLocaleDateString("ko-KR", options).replace(",", "");

      // 요일을 영어로 출력
      const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });
      setDate(`${formattedDate} ${dayOfWeek}`);
    };

    updateTimeAndDate();
    const intervalId = setInterval(updateTimeAndDate, 60000); // 1분마다 시간 갱신

    return () => clearInterval(intervalId);
  }, []);

  const captureAndSendFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        console.error("Blob creation failed.");
        return;
      }

      const formData = new FormData();
      formData.append("file", blob, "frame.jpg");

      try {
        const response = await fetch("http://127.0.0.1:8000/recognize", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        if (data.currentName) {
          setCurrentName(data.currentName); // 감지된 이름 업데이트
          setRemainingTime(data.remainingTime); // 남은 시간 업데이트
        } else {
          // 얼굴이 감지되지 않는 경우 이름 유지
          setRemainingTime((prev) => (prev > 0 ? prev - 1 : 0));
        }
      } catch (error) {
        console.error("Error sending frame:", error);
      }
    }, "image/jpeg");
  };

  return (
      <div className="app">
        {/* <video ref={videoRef} autoPlay muted width="640" height="480" /> */}
        {/* <canvas ref={canvasRef} width="640" height="480" /> */}
        {/* 중앙 시간 및 날씨 */}
        <div className="time-weather">
          <div className="time">{time}</div>
          <div className="date">
            <span>{date}</span>
          </div>
          <div className="weather">
            <span>도봉구 ☀ 2°</span>
          </div>
          <div className="greeting">하이 아이엠!</div>
          <div className="mic-icon">🎤</div>
          <video ref={videoRef} autoPlay muted style={{width: "0%"}}/>
          <canvas ref={canvasRef} style={{display: "none"}}/>
          <p>안녕하세요, {currentName} 님</p>
          <p>(참고용) 지속 시간: {remainingTime}s</p>
        </div>

        {/* 아래 영역 */}
        <div className="bottom-section">
          {/* 오른쪽 영역 */}
          <div className="left-section">
            {/* 대중교통 정보 */}
            <div className="info-box">
              <img src={bus}></img>
            </div>

            {/* 일정 */}
            <div className="schedule">
              <div className="schedule-title">13일 금요일</div>
              <div className="schedule-item">
                <span>복단이랑 쇼핑</span>
                <span>13:00-15:30</span>
              </div>
              <div className="schedule-item">
                <span>치과 정기검진</span>
                <span>17:00-18:00</span>
              </div>
            </div>
          </div>

          {/* 왼쪽 영역 */}
          <div className="now-playing">
            <span>🎵 now playing</span>
            <div id={`youtube-player-${"PL4fGSI1pDJn5S09aId3dUGp40ygUqmPGc"}`} style={{ width: "100%", height: "200px" }}>
              {/* YouTube 비디오가 이 div 내에서 표시됨 */}
            </div>
            <div className="video-title">{playerDetails.title}</div>
            <div className="player-controls">
              <button onClick={actions.previousVideo}>
                <IoPlaySkipBack />
              </button>
              {playerDetails.state === PlayerState.PLAYING ? (
                  <button className="emphasised" onClick={actions.pauseVideo}>
                    <IoPause />
                  </button>
              ) : (
                  <button className="emphasised" onClick={actions.playVideo}>
                    <IoPlay />
                  </button>
              )}
              <button onClick={actions.stopVideo}>
                <IoStop />
              </button>
              <button onClick={actions.nextVideo}>
                <IoPlaySkipForward />
              </button>
              <div className="volume-control">
                {renderVolumeIcon()}
                <input
                    type="range"
                    value={playerDetails.volume}
                    min={0}
                    max={100}
                    onChange={(event) => actions.setVolume(event.target.valueAsNumber)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

export default App;
