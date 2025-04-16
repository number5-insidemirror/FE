import React, { useState } from "react";
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
import { useYoutube } from "../useYoutube.ts";
import { PlayerState } from "../types.ts";
import "../styles/MusicPlayer.css";

const playlists = {
    봄: "PLQAtNSVSLoZY_-ca0__UHdut_LkqQrUrB", // 기본값
    여름: "RDzKt61XKz8zM",
    가을: "PLQti1QHTNW-3qCCvcTjWrHP8rZ8KMKASU",
    겨울: "PLQAtNSVSLoZbL8Ux86vXSmtiHAtVA0l4x",
};

function MusicPlayer() {
    const [season, setSeason] = useState("봄");
    const { playerDetails, actions } = useYoutube({
        id: playlists[season],
        type: "playlist",
    });

    const renderVolumeIcon = () => {
        if (playerDetails.volume === 0) return <IoVolumeMute />;
        if (playerDetails.volume <= 30) return <IoVolumeLow />;
        if (playerDetails.volume <= 60) return <IoVolumeMedium />;
        return <IoVolumeHigh />;
    };

    return (
        <div className="player-container">
            {/* 계절 버튼 */}
            <div className="season-buttons">
                {Object.keys(playlists).map((name) => (
                    <button
                        key={name}
                        className={season === name ? "active" : ""}
                        onClick={() => setSeason(name)}
                    >
                        {name}
                    </button>
                ))}
            </div>

            {/* 뮤직 플레이어 */}
            <div className="music-player-container">
                <div className="album-thumbnail">
                    <img src={playerDetails.thumbnail} alt="Album Art" />
                </div>
                <div className="music-info">
                    <div className="music-title">{playerDetails.title}</div>
                    <div className="music-author">{playerDetails.author}</div>
                </div>
                <div className="music-controls">
                    <button onClick={actions.previousVideo}><IoPlaySkipBack /></button>
                    {playerDetails.state === PlayerState.PLAYING ? (
                        <button onClick={actions.pauseVideo}><IoPause /></button>
                    ) : (
                        <button onClick={actions.playVideo}><IoPlay /></button>
                    )}
                    <button onClick={actions.stopVideo}><IoStop /></button>
                    <button onClick={actions.nextVideo}><IoPlaySkipForward /></button>
                    <div className="volume-control">
                        {renderVolumeIcon()}
                        <input
                            type="range"
                            value={playerDetails.volume}
                            min={0}
                            max={100}
                            onChange={(e) => actions.setVolume(e.target.valueAsNumber)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MusicPlayer;
