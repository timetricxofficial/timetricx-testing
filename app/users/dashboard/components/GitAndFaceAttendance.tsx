'use client'

import { useEffect, useState, useRef, useCallback } from "react";
import Cookies from "js-cookie";
import * as faceapi from "face-api.js";

import { useTheme } from '../../../../contexts/ThemeContext';
import { useToast } from '../../../../contexts/ToastContext';

import { loadFaceModels } from "../../../../utils/loadFaceModels.client";
import { matchFacesClient } from "../../../../utils/matchFaces.client";

import { GitAndFaceAttendanceSkeleton } from "./SkeletonLoader";
import {
  useSocket,
  useLeaderElection,
  useGitData,
  useAttendance,
  useFaceVerification,
  useHolidayRequests,
  GitGraph,
  GitHubBadge,
  FaceAttendanceCard,
  HolidayBanner,
  CameraModal,
  CompletionPopup
} from './gitandFacePages';
import { InternshipProgress } from './gitandFacePages/components/InternshipProgress';

export default function GitAndFace() {
  const { theme } = useTheme();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [hasNotifiedCompletion, setHasNotifiedCompletion] = useState(false);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [hasAutoCheckedOut, setHasAutoCheckedOut] = useState(false);
  const [userCreatedAt, setUserCreatedAt] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const profileImgRef = useRef<HTMLImageElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Get user createdAt from cookie
  useEffect(() => {
    const userCookie = Cookies.get('user');
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie);
        if (user.createdAt) {
          setUserCreatedAt(user.createdAt);
        }
      } catch (e) {
        console.error('Failed to parse user cookie');
      }
    }
  }, []);

  // Custom hooks
  const { isLeader } = useLeaderElection();
  const { data: gitData } = useGitData();
  const { 
    attendanceData, 
    attendancePercentage, 
    isCheckedIn, 
    workingHours, 
    fetchAttendance,
    handleCheckInSuccess,
    handleCheckOutSuccess 
  } = useAttendance();
  
  const {
    todayHoliday,
    holidayWorkRequest,
    showHolidayReason,
    holidayReason,
    isSubmittingWorkRequest,
    setShowHolidayReason,
    setHolidayReason,
    setHolidayWorkRequest,
    handleRequestToWork
  } = useHolidayRequests();

  const {
    scheduledAt,
    attemptNo,
    requestingAdminId,
    setStartCameraCallback,
    handleVerificationRequest,
    logVerificationAttempt,
    clearVerificationState
  } = useFaceVerification(isCheckedIn, isLeader);

  const { socketRef, emitVerificationResult } = useSocket({
    onVerificationRequest: handleVerificationRequest
  });

  // ------------------ LOAD FACE MODELS (ONCE) ------------------
  useEffect(() => {
    loadFaceModels()
      .then(() => console.log("Face models loaded successfully"))
      .catch(() => error("Failed to load face models"));
  }, [error]);

  // ------------------ AUTH CHECK ------------------
  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      window.location.href = '/landing/auth/login';
    }
  }, []);

  // Set camera start callback
  useEffect(() => {
    setStartCameraCallback((autoCapture: boolean, scheduledTime: string | null) => {
      startCamera(autoCapture, scheduledTime);
    });
  }, [setStartCameraCallback]);

  // ------------------ CAMERA CONTROLS ------------------
  const startCamera = async (autoCapture: boolean = false, scheduledTime: string | null = null) => {
    setShowCamera(true);
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user" 
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        const playVideo = async () => {
          if (!videoRef.current) return;
          try {
            await videoRef.current.play();
            let attempts = 0;
            while ((!videoRef.current.videoWidth || !videoRef.current.videoHeight) && attempts < 20) {
              await new Promise(r => setTimeout(r, 100));
              attempts++;
            }
            
            setCameraReady(true);
            setLoading(false);
            if (autoCapture) {
              setIsAutoVerifying(true);
              setTimeout(() => captureAndMarkAttendance(true, scheduledTime), 500);
            }
          } catch (e) {
            console.error("Video play error:", e);
          }
        };
        playVideo();
      }
    } catch (err) {
      console.error("Camera error:", err);
      error("Could not access camera");
      setShowCamera(false);
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCameraReady(false);
    setIsAutoVerifying(false);
  };

  // ------------------ CAPTURE & VERIFY ------------------
  const captureAndMarkAttendance = async (immediate: boolean = false, scheduledTime: string | null = null) => {
    if (immediate) {
      let retries = 0;
      while (retries < 10) {
        if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
          setCameraReady(true);
          break;
        }
        await new Promise(res => setTimeout(res, 500));
        retries++;
        
      }
    }

    if (!videoRef.current || videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      setLoading(false);
      setIsAutoVerifying(false);
      setShowCamera(false);
      return error("Camera is not ready");
    }

    if (immediate) {
      takePhoto(scheduledTime);
    } else {
      setCountdown(2);
      let t = 2;
      const timer = setInterval(() => {
        t--; setCountdown(t);
        if (t === 0) { clearInterval(timer); takePhoto(); }
      }, 1000);
    }
  };

  const takePhoto = async (passedScheduledAt: string | null = null) => {
    setLoading(true);
    setCountdown(null); // Hide countdown during processing

    const canvas = document.createElement("canvas");
    if (!videoRef.current) return;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg");

    const liveImg = new Image();
    liveImg.src = imageData;
    await new Promise(res => liveImg.onload = res);

    if (!profileImgRef.current) {
      error("Profile image missing");
      setLoading(false);
      return;
    }

    const match = await matchFacesClient(liveImg, profileImgRef.current);
    
    const userCookie = Cookies.get("user");
    if (!userCookie) {
      error("User not found");
      setLoading(false);
      stopCamera();
      return;
    }
    const user = JSON.parse(userCookie);

    const effectiveScheduledAt = passedScheduledAt || scheduledAt;

    // --- LOG VERIFICATION ATTEMPT ---
    if (effectiveScheduledAt) {
      const confidence = match.distance ? (1 - match.distance) : 0;
      // Use matchType if available, fallback to match boolean
      const matchStatus = match.matchType || (match.match ? "success" : match.success ? "fail" : "fail");
      await logVerificationAttempt(user.email, matchStatus, confidence, attemptNo, effectiveScheduledAt);

      let verificationStatus: "verified" | "partial_match" | "present_but_failed" | "not_present";
      let statusMessage: string;
      
      if (matchStatus === "success") {
        verificationStatus = "verified";
        statusMessage = "Face verified ✔";
        success(statusMessage);
      } else if (matchStatus === "partial") {
        verificationStatus = "partial_match";
        statusMessage = "Partial match - User present but low confidence";
        error("Partial match - Please ensure proper lighting and face position");
      } else if (match.success) {
        verificationStatus = "present_but_failed";
        statusMessage = "Face mismatch - Human present but not verified";
        error("Face mismatch");
      } else {
        verificationStatus = "not_present";
        statusMessage = "No face detected - Human not present";
        error("Face not detected");
      }
      
      emitVerificationResult({
        userId: user._id,
        adminId: requestingAdminId || '699764f938248606e0fae6fb',
        userName: user.name || user.email.split('@')[0],
        status: verificationStatus,
        score: match.distance ? (1 - match.distance) : 0,
        message: statusMessage
      });
      
      clearVerificationState();
      setLoading(false);
      stopCamera();
      return; 
    }

    // --- MANUAL CHECK-IN/OUT LOGIC (Only if NOT scheduledAt) ---
    if (!match.success || !match.match) {
      error("Face mismatch");
      setLoading(false);
      stopCamera();
      return;
    }
    
    const apiUrl = isCheckedIn
      ? "/api/attendance/face-checkout"
      : "/api/attendance/face-attendance";

    const deviceId = typeof window !== 'undefined' ? localStorage.getItem('timetricx_device_id') : null;

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, verified: true, deviceId })
    });

    const result = await res.json();

    if (result.success) {
      if (!isCheckedIn) {
        handleCheckInSuccess();
      } else {
        handleCheckOutSuccess();
      }

      success(isCheckedIn ? "Checked Out ✔ (Auto-logout in 30 min)" : "Attendance Marked ✔");
      await fetchAttendance();
    } else {
      error(result.message);
    }

    setLoading(false);
    stopCamera();
  };

  // ------------------ WORKING HOURS & AUTO CHECKOUT ------------------
  useEffect(() => {
    if (!isCheckedIn || workingHours < 8) return;

    if (workingHours >= 8 && !hasAutoCheckedOut) {
      const userCookie = Cookies.get('user');
      if (userCookie) {
        try {
          const user = JSON.parse(userCookie);
          fetch('/api/attendance/checkout-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              user: user
            })
          }).catch(err => console.error('Auto-checkout failed:', err));
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      setHasAutoCheckedOut(true);
    }

    if (workingHours >= 8 && !hasNotifiedCompletion) {
      setShowCompletionPopup(true);
      setHasNotifiedCompletion(true);
      setTimeout(() => setShowCompletionPopup(false), 2000);
    }
  }, [isCheckedIn, workingHours, hasAutoCheckedOut, hasNotifiedCompletion]);

  const handleCheckButtonClick = () => {
    startCamera();
  };

  // Show skeleton while loading git data
  if (!gitData) {
    return <GitAndFaceAttendanceSkeleton />;
  }

  const canWorkOnHoliday = !todayHoliday || holidayWorkRequest?.status === 'approved';

  return (
    <>
      {/* Hidden profile image for face matching */}
      {(() => {
        try {
          const cookie = Cookies.get("user");
          if (!cookie) return null;
          const u = JSON.parse(cookie);
          return (
            <img
              ref={profileImgRef}
              src={u?.profilePicture || undefined}
              alt="profile"
              crossOrigin="anonymous"
              style={{ display: "none" }}
            />
          );
        } catch (e) {
          return null;
        }
      })()}

      {/* MAIN CARD */}
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-4xl shadow border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} p-6 transition-colors`}>
        <div className="flex gap-6 items-start overflow-visible">
          {/* LEFT SIDE - Title, Badge, Graph */}
          <div className="flex-1 min-w-0 flex flex-col gap-2" style={{ maxWidth: 'calc(100% - 240px)' }}>
            <h2 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Git & Face Attendance
            </h2>
            <GitHubBadge  theme={theme} />
            <GitGraph months={gitData.months} theme={theme} />
          </div>

          {/* RIGHT SIDE - Card pushed to right and centered vertically */}
          <div className="flex-shrink-0 ml-auto self-center">
            {todayHoliday && !canWorkOnHoliday ? (
              <HolidayBanner
                todayHoliday={todayHoliday}
                holidayWorkRequest={holidayWorkRequest}
                showHolidayReason={showHolidayReason}
                holidayReason={holidayReason}
                isSubmittingWorkRequest={isSubmittingWorkRequest}
                theme={theme}
                onShowReasonInput={() => setShowHolidayReason(true)}
                onHideReasonInput={() => setShowHolidayReason(false)}
                onReasonChange={setHolidayReason}
                onSubmitRequest={handleRequestToWork}
              />
            ) : (
              <FaceAttendanceCard
                attendancePercentage={attendancePercentage}
                isCheckedIn={isCheckedIn}
                workingHours={workingHours}
                attendanceData={attendanceData}
                onCheckInOutClick={handleCheckButtonClick}
                theme={theme}
              />
            )}
          </div>
        </div>
      </div>

      {/* CAMERA MODAL */}
      <CameraModal
        showCamera={showCamera}
        isAutoVerifying={isAutoVerifying}
        isCheckedIn={isCheckedIn}
        cameraReady={cameraReady}
        loading={loading}
        countdown={countdown}
        theme={theme}
        videoRef={videoRef}
        onClose={stopCamera}
        onCapture={() => captureAndMarkAttendance(false)}
      />

      {/* COMPLETION POPUP */}
      <CompletionPopup show={showCompletionPopup} />
    </>
  );
}
