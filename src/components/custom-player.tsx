"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    SkipBack,
    SkipForward,
    Settings,
    Subtitles,
    Download,
    Share2,
    PictureInPicture2,
} from "lucide-react";

export interface SubtitleTrack {
    src: string;
    srclang: string;
    label: string;
    default?: boolean;
}

interface CustomPlayerProps {
    src: string;
    poster?: string;
    title?: string;
    description?: string;
    subtitles?: SubtitleTrack[];
    autoPlay?: boolean;
    onProgress?: (progress: { currentTime: number; duration: number }) => void;
}

export function CustomNetflixPlayer({
    src,
    poster,
    title,
    description = "You're Watching",
    subtitles = [],
    autoPlay = false,
    onProgress,
}: CustomPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);

    // Format time to MM:SS
    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    // Show controls and reset hide timer
    const showControlsWithTimer = useCallback(() => {
        setShowControls(true);
        if (hideControlsTimer.current) {
            clearTimeout(hideControlsTimer.current);
        }
        hideControlsTimer.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    }, [isPlaying]);

    // Play/Pause toggle
    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    };

    // Skip forward/backward
    const skip = (seconds: number) => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, duration));
    };

    // Toggle mute
    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setIsMuted(video.muted);
    };

    // Change volume
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (!video) return;
        const newVolume = parseFloat(e.target.value);
        video.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    // Seek to position
    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const video = videoRef.current;
        const progressBar = progressRef.current;
        if (!video || !progressBar) return;
        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        video.currentTime = pos * duration;
    };

    // Toggle fullscreen
    const toggleFullscreen = async () => {
        const container = containerRef.current;
        if (!container) return;
        if (!document.fullscreenElement) {
            await container.requestFullscreen();
            setIsFullscreen(true);
        } else {
            await document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Toggle PiP
    const togglePiP = async () => {
        const video = videoRef.current;
        if (!video) return;
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        } else {
            await video.requestPictureInPicture();
        }
    };

    // Change playback rate
    const changePlaybackRate = (rate: number) => {
        const video = videoRef.current;
        if (!video) return;
        video.playbackRate = rate;
        setPlaybackRate(rate);
        setShowSettings(false);
    };

    // Download video (if possible)
    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = src;
        link.download = title || "video";
        link.click();
    };

    // Share
    const handleShare = async () => {
        if (navigator.share) {
            await navigator.share({
                title: title,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
    };

    // Video event handlers
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            if (onProgress) {
                onProgress({ currentTime: video.currentTime, duration: video.duration });
            }
        };
        const handleDurationChange = () => setDuration(video.duration);
        const handleProgress = () => {
            if (video.buffered.length > 0) {
                setBuffered(video.buffered.end(video.buffered.length - 1));
            }
        };
        const handleWaiting = () => setIsLoading(true);
        const handleCanPlay = () => setIsLoading(false);
        const handleLoadedMetadata = () => {
            setDuration(video.duration);
            setIsLoading(false);
        };

        video.addEventListener("play", handlePlay);
        video.addEventListener("pause", handlePause);
        video.addEventListener("timeupdate", handleTimeUpdate);
        video.addEventListener("durationchange", handleDurationChange);
        video.addEventListener("progress", handleProgress);
        video.addEventListener("waiting", handleWaiting);
        video.addEventListener("canplay", handleCanPlay);
        video.addEventListener("loadedmetadata", handleLoadedMetadata);

        if (autoPlay) {
            video.play().catch(() => { });
        }

        return () => {
            video.removeEventListener("play", handlePlay);
            video.removeEventListener("pause", handlePause);
            video.removeEventListener("timeupdate", handleTimeUpdate);
            video.removeEventListener("durationchange", handleDurationChange);
            video.removeEventListener("progress", handleProgress);
            video.removeEventListener("waiting", handleWaiting);
            video.removeEventListener("canplay", handleCanPlay);
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        };
    }, [autoPlay, onProgress]);

    // Fullscreen change listener
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case " ":
                case "k":
                    e.preventDefault();
                    togglePlay();
                    break;
                case "ArrowLeft":
                    skip(-10);
                    break;
                case "ArrowRight":
                    skip(10);
                    break;
                case "m":
                    toggleMute();
                    break;
                case "f":
                    toggleFullscreen();
                    break;
            }
            showControlsWithTimer();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [showControlsWithTimer]);

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const bufferedProgress = duration > 0 ? (buffered / duration) * 100 : 0;

    return (
        <div
            ref={containerRef}
            className="custom-player relative w-full h-full bg-black overflow-hidden select-none"
            onMouseMove={showControlsWithTimer}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                className="w-full h-full object-contain"
                playsInline
                onClick={togglePlay}
            >
                {subtitles.map((track) => (
                    <track
                        key={track.srclang}
                        kind="subtitles"
                        src={track.src}
                        srcLang={track.srclang}
                        label={track.label}
                        default={track.default}
                    />
                ))}
            </video>

            {/* Loading Spinner */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <div className="netflix-spinner">
                        <div className="spinner-ring"></div>
                    </div>
                </div>
            )}

            {/* Center Play Button (when paused) */}
            {!isPlaying && !isLoading && (
                <button
                    onClick={togglePlay}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20
                               w-20 h-20 rounded-full bg-white/25 flex items-center justify-center
                               hover:bg-primary transition-all duration-200 hover:scale-110"
                >
                    <Play className="w-10 h-10 text-white fill-white ml-1" />
                </button>
            )}

            {/* Top Overlay - Title & Logo */}
            <div
                className={`absolute top-0 left-0 right-0 z-20 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"
                    }`}
            >
                <div className="bg-gradient-to-b from-black/90 via-black/50 to-transparent p-6 flex justify-between items-start">
                    <div>
                        <p className="text-gray-300 text-sm font-medium">{description}</p>
                        <h1 className="text-white text-2xl md:text-3xl font-bold uppercase tracking-wide">
                            {title}
                        </h1>
                    </div>
                    <Image
                        src="/svg/evolix.svg"
                        alt="Evolix"
                        width={100}
                        height={32}
                        className="h-8 w-auto"
                    />
                </div>
            </div>

            {/* Center Display Icons (Rewind, Play, Forward) */}
            <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10
                           flex items-center gap-12 transition-opacity duration-300 ${showControls && isPlaying ? "opacity-100" : "opacity-0"
                    }`}
            >
                <button
                    onClick={() => skip(-10)}
                    className="w-16 h-16 rounded-full flex items-center justify-center
                               text-white/80 hover:text-primary transition-colors"
                >
                    <SkipBack className="w-10 h-10" />
                    <span className="absolute text-xs font-bold">10</span>
                </button>
                <button
                    onClick={togglePlay}
                    className="w-20 h-20 rounded-full flex items-center justify-center
                               text-white/80 hover:text-primary transition-colors"
                >
                    {isPlaying ? (
                        <Pause className="w-12 h-12" />
                    ) : (
                        <Play className="w-12 h-12 ml-1" />
                    )}
                </button>
                <button
                    onClick={() => skip(10)}
                    className="w-16 h-16 rounded-full flex items-center justify-center
                               text-white/80 hover:text-primary transition-colors"
                >
                    <SkipForward className="w-10 h-10" />
                    <span className="absolute text-xs font-bold">10</span>
                </button>
            </div>

            {/* Bottom Controls */}
            <div
                className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"
                    }`}
            >
                <div className="bg-gradient-to-t from-black/90 via-black/70 to-transparent px-4 pb-4 pt-16">
                    {/* Progress Bar */}
                    <div
                        ref={progressRef}
                        className="progress-container h-1 bg-gray-700 rounded cursor-pointer mb-4 group hover:h-2 transition-all"
                        onClick={handleSeek}
                    >
                        <div
                            className="progress-buffered h-full bg-gray-500 rounded absolute"
                            style={{ width: `${bufferedProgress}%` }}
                        />
                        <div
                            className="progress-played h-full bg-primary rounded relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="progress-knob absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                        {/* Left Controls */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={togglePlay}
                                className="control-btn"
                                title={isPlaying ? "Pause" : "Play"}
                            >
                                {isPlaying ? (
                                    <Pause className="w-6 h-6" />
                                ) : (
                                    <Play className="w-6 h-6" />
                                )}
                            </button>
                            <button onClick={() => skip(-10)} className="control-btn" title="Rewind 10s">
                                <SkipBack className="w-5 h-5" />
                            </button>
                            <button onClick={() => skip(10)} className="control-btn" title="Forward 10s">
                                <SkipForward className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-2">
                                <button onClick={toggleMute} className="control-btn" title={isMuted ? "Unmute" : "Mute"}>
                                    {isMuted || volume === 0 ? (
                                        <VolumeX className="w-5 h-5" />
                                    ) : (
                                        <Volume2 className="w-5 h-5" />
                                    )}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="volume-slider w-16 h-1 accent-primary"
                                />
                            </div>
                            <span className="text-white text-sm ml-2">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>

                        {/* Right Controls */}
                        <div className="flex items-center gap-3">
                            <button onClick={handleDownload} className="control-btn" title="Download">
                                <Download className="w-5 h-5" />
                            </button>
                            <button className="control-btn" title="Subtitles">
                                <Subtitles className="w-5 h-5" />
                            </button>
                            <button onClick={handleShare} className="control-btn" title="Share">
                                <Share2 className="w-5 h-5" />
                            </button>
                            <div className="relative">
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="control-btn"
                                    title="Settings"
                                >
                                    <Settings className="w-5 h-5" />
                                </button>
                                {showSettings && (
                                    <div className="settings-menu absolute bottom-12 right-0 bg-black/95 rounded-lg p-2 min-w-[150px]">
                                        <p className="text-gray-400 text-xs px-3 py-1">Playback Speed</p>
                                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                            <button
                                                key={rate}
                                                onClick={() => changePlaybackRate(rate)}
                                                className={`block w-full text-left px-3 py-2 text-sm rounded hover:bg-primary/30 ${playbackRate === rate ? "text-primary" : "text-white"
                                                    }`}
                                            >
                                                {rate === 1 ? "Normal" : `${rate}x`}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button onClick={togglePiP} className="control-btn" title="Picture in Picture">
                                <PictureInPicture2 className="w-5 h-5" />
                            </button>
                            <button onClick={toggleFullscreen} className="control-btn" title="Fullscreen">
                                {isFullscreen ? (
                                    <Minimize className="w-5 h-5" />
                                ) : (
                                    <Maximize className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Styles */}
            <style jsx global>{`
                .custom-player {
                    font-family: "Rubik", -apple-system, BlinkMacSystemFont, sans-serif;
                }

                .control-btn {
                    color: #f7f7f7;
                    padding: 8px;
                    border-radius: 4px;
                    transition: color 0.2s;
                }

                .control-btn:hover {
                    color: #f5a623;
                }

                .progress-container {
                    position: relative;
                }

                .progress-buffered,
                .progress-played {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                }

                .volume-slider {
                    -webkit-appearance: none;
                    background: #333;
                    border-radius: 4px;
                }

                .volume-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 12px;
                    height: 12px;
                    background: #f5a623;
                    border-radius: 50%;
                    cursor: pointer;
                }

                /* Netflix-style loading spinner */
                .netflix-spinner {
                    width: 80px;
                    height: 80px;
                }

                .spinner-ring {
                    width: 100%;
                    height: 100%;
                    border: 4px solid transparent;
                    border-top-color: #f5a623;
                    border-radius: 50%;
                    animation: netflix-spin 1s linear infinite;
                }

                @keyframes netflix-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* Settings menu */
                .settings-menu {
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                }

                /* Hide default video controls */
                video::-webkit-media-controls {
                    display: none !important;
                }

                video::-webkit-media-controls-enclosure {
                    display: none !important;
                }
            `}</style>
        </div>
    );
}
