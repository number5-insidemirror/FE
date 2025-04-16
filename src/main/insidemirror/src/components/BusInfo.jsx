import React, { useEffect, useState } from "react";
import "../styles/BusInfo.css";

const dummyBusData = [
    {
        busNumber: "7016",
        destination: "서울역",
        arrivalInMin: 3
    },
    {
        busNumber: "152",
        destination: "노원역",
        arrivalInMin: 7
    },
    {
        busNumber: "1111",
        destination: "도봉산역",
        arrivalInMin: 12
    }
];

function BusInfo() {
    const [busList, setBusList] = useState([]);

    useEffect(() => {
        // 추후 fetch로 교체 가능
        const loadBusData = () => {
            setBusList(dummyBusData);
        };

        loadBusData();

        const interval = setInterval(loadBusData, 15000); // 15초마다 갱신
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bus-info-container">
            <div className="bus-stop-title">도봉초등학교 정류장</div>
            <div className="bus-list">
                {busList.map((bus, idx) => (
                    <div className="bus-item" key={idx}>
                        <div className="bus-number">{bus.busNumber}</div>
                        <div className="bus-destination">{bus.destination}행</div>
                        <div className="bus-arrival">{bus.arrivalInMin}분 후 도착</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default BusInfo; 