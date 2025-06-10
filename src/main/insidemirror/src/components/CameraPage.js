import React, { useRef, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "../styles/CameraPage.css";
import * as faceMesh from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import HeartFilter from "../img/heartFilter.png";
import GlassesFilter from "../img/glassMando.png";
import CameraIcon from "../img/camera2.png";
import * as hands from "@mediapipe/hands";

function CameraPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const heartRef = useRef(null);
  const glassesRef = useRef(null);
  const captureButtonRef = useRef(null);

  const [savedImages, setSavedImages] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("heart");
  const [distortType, setDistortType] = useState(null);
  const [lastCapture, setLastCapture] = useState(0);
  const [captureTimeout, setCaptureTimeout] = useState(null);
  const [lastGestureTime, setLastGestureTime] = useState(0);
  const [countdown, setCountdown] = useState(null);

  const API_BASE = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    if (captureButtonRef.current) {
      const rect = captureButtonRef.current.getBoundingClientRect();
      console.log("카메라 버튼 좌표:", {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      });
    }
  }, []);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");

    const faceMeshInstance = new faceMesh.FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMeshInstance.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMeshInstance.onResults((results) => {
      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;

      const video = videoRef.current;
      canvasElement.width = video.videoWidth;
      canvasElement.height = video.videoHeight;
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

      const landmarks = results.multiFaceLandmarks[0];
      const forehead = landmarks[10]; //하트
      const eyeCenter = landmarks[234]; // 안경만두

      //하트
      if (selectedFilter === "heart" && heartRef.current?.complete) {
        const imageWidth = 200;
        const imageHeight = 120;
        const x = forehead.x * canvasElement.width - imageWidth / 2;
        const y = forehead.y * canvasElement.height - imageHeight * 1.5;
        canvasCtx.drawImage(heartRef.current, x, y, imageWidth, imageHeight);
      }

      //안경만두
      if (selectedFilter === "glasses" && glassesRef.current?.complete) {
        const imageWidth = 100;
        const imageHeight = 100;
        const x = eyeCenter.x * canvasElement.width - imageWidth / 2;
        const y = eyeCenter.y * canvasElement.height - imageHeight / 2;
        canvasCtx.drawImage(glassesRef.current, x, y, imageWidth, imageHeight);
      }

      // 왜곡 효과 적용
      if (distortType) {
        applyDistortion(canvasCtx, canvasElement, distortType);
      }
    });

    if (videoRef.current) {
      const cam = new Camera(videoRef.current, {
        onFrame: async () => {
          const frame = videoRef.current;
          await faceMeshInstance.send({ image: frame });
          await handDetector.send({ image: frame }); // ✅ 손도 동시에 분석
        },
        width: 640,
        height: 480,
      });
      cam.start();
    }
  }, [selectedFilter]);

  const handleSaveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL("image/png");
    setSavedImages((prev) => [dataURL, ...prev]);

    const blob = dataURLtoBlob(dataURL);
    const file = new File([blob], `photo_${Date.now()}.png`, { type: "image/png" });

    uploadImage(file);
  };

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  };

  const userName = localStorage.getItem("userName") || "Unknown";

  useEffect(() => {
    if (userName && userName !== "Unknown") {
      const today = getTodayString();
      fetchImages(userName, today);
    }
  }, []);

  const uploadImage = async (file) => {
    if (!userName || userName === "Unknown") {
      console.warn("사용자 이름이 없습니다.");
      return;
    }

    const formData = new FormData();
    formData.append("name", userName);
    formData.append("date", getTodayString());
    formData.append("file", file);

    try {
      const response = await axios.post(`${API_BASE}/api/images`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("업로드 성공:", response.data);
    } catch (error) {
      console.error("업로드 실패:", error.response?.data?.message || error.message);
    }
  };

  const fetchImages = async (name, date) => {
    try {
      const response = await axios.get(`${API_BASE}/api/images`, {
        params: { name, date },
      });
      const images = response.data;
      const srcs = images.map((img) => `${API_BASE}${img.imagePath}`);
      setSavedImages((prev) => [...srcs, ...prev]);
    } catch (error) {
      console.error("이미지 조회 실패:", error);
    }
  };

  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  };

  // 손 모듈 초기화
  const handDetector = new hands.Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });
  handDetector.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
  });

  // 손 인식 결과 처리
  handDetector.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      const thumb = landmarks[4];
      const pinky = landmarks[20];

      const dx = thumb.x - pinky.x;
      const dy = thumb.y - pinky.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const now = Date.now();

      if (distance > 0.3 && now - lastGestureTime > 5000) {
        if (!captureTimeout) {
          console.log("손바닥 감지됨 - 카운트다운 시작");

          let count = 3;
          setCountdown(count);

          const intervalId = setInterval(() => {
            count -= 1;
            if (count === 0) {
              clearInterval(intervalId);
              setCountdown(null);
              handleSaveImage();
              setLastGestureTime(Date.now());
            } else {
              setCountdown(count);
            }
          }, 1000);

          setCaptureTimeout(intervalId); // 재사용 방지
        }
      }
    }
  });

  useEffect(() => {
    return () => {
      if (captureTimeout) clearInterval(captureTimeout);
    };
  }, [captureTimeout]);

  const shouldCapture = () => {
    const now = Date.now();
    if (now - lastCapture > 2000) {
      // 최소 2초 간격
      setLastCapture(now);
      return true;
    }
    return false;
  };

  // canvasCtx: CanvasRenderingContext2D, canvasElement: HTMLCanvasElement
  function applyDistortion(canvasCtx, canvasElement, type) {
    // 원본 이미지 데이터 복사
    const src = canvasCtx.getImageData(0, 0, canvasElement.width, canvasElement.height);
    const dst = canvasCtx.createImageData(src);
    const w = canvasElement.width,
      h = canvasElement.height;
    const cx = w / 2,
      cy = h / 2;
    const maxR = Math.min(w, h) / 2;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // 중심 기준 좌표
        const dx = x - cx;
        const dy = y - cy;
        const r = Math.sqrt(dx * dx + dy * dy);
        const theta = Math.atan2(dy, dx);

        let nr = r;
        if (type === "bulge") {
          // 볼록: 중심에 가까울수록 더 팽창
          nr = r * (1 - 0.5 * Math.cos((Math.PI * r) / maxR));
        } else if (type === "pinch") {
          // 오목: 중심에 가까울수록 더 압축
          nr = r * (1 + 0.5 * Math.cos((Math.PI * r) / maxR));
        } else if (type === "swirl") {
          // 소용돌이: 각도를 비틀기
          const angle = ((Math.PI * (maxR - r)) / maxR) * 0.7;
          const nx = Math.round(cx + r * Math.cos(theta + angle));
          const ny = Math.round(cy + r * Math.sin(theta + angle));
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const si = (ny * w + nx) * 4;
            const di = (y * w + x) * 4;
            dst.data[di] = src.data[si];
            dst.data[di + 1] = src.data[si + 1];
            dst.data[di + 2] = src.data[si + 2];
            dst.data[di + 3] = src.data[si + 3];
          }
          continue;
        }

        // 볼록/오목 변환 좌표
        const nx = Math.round(cx + nr * Math.cos(theta));
        const ny = Math.round(cy + nr * Math.sin(theta));
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const si = (ny * w + nx) * 4;
          const di = (y * w + x) * 4;
          dst.data[di] = src.data[si];
          dst.data[di + 1] = src.data[si + 1];
          dst.data[di + 2] = src.data[si + 2];
          dst.data[di + 3] = src.data[si + 3];
        }
      }
    }
    canvasCtx.putImageData(dst, 0, 0);
  }

  return (
    <>
      <div className="camera">
        <div className="photoBoothTop">
          <div className="iconBox">
            <button className="icon" style={{ background: "#FF5F57" }}></button>
            <button className="icon" style={{ background: "#FFBD2E" }}></button>
            <button className="icon" style={{ background: "#28C840" }}></button>
          </div>
          <p>PhotoBooth</p>
        </div>

        <div className="camera-container">
          <video ref={videoRef} style={{ display: "none" }} />
          <canvas ref={canvasRef} className="face-canvas" />

          {countdown !== null && <div className="countdown-overlay">{countdown}</div>}
        </div>

        {/* 카메라 촬영 버튼 */}
        <div className="camera-button">
          <button className="camera-box" onClick={handleSaveImage} title="사진 저장" ref={captureButtonRef}>
            <img src={CameraIcon} alt="카메라 아이콘" />
          </button>
        </div>
        {/* 필터 이미지들 */}
        <img ref={heartRef} src={HeartFilter} alt="Heart Filter" style={{ display: "none" }} />
        <img ref={glassesRef} src={GlassesFilter} alt="Glasses Filter" style={{ display: "none" }} />

        {/* 필터 선택 버튼 */}
        <div className="filter-buttons">
          <button onClick={() => setSelectedFilter("heart")}>❤️ 하트</button>
          <button onClick={() => setSelectedFilter("glasses")}>🕶️ 안경만두</button>
          <button onClick={() => setDistortType("bulge")}>🔵 볼록</button>
          <button onClick={() => setDistortType("pinch")}>⚫ 오목</button>
          <button onClick={() => setDistortType("swirl")}>🌀 소용돌이</button>
          <button onClick={() => setDistortType(null)}>🚫 왜곡 끄기</button>
        </div>
      </div>

      <div className="saved-images-slide">
        {savedImages.map((imgSrc, idx) => (
          <img key={idx} src={imgSrc} alt={`저장된 사진 ${idx + 1}`} onClick={() => window.open(imgSrc, "_blank")} />
        ))}
      </div>
    </>
  );
}

export default CameraPage;
