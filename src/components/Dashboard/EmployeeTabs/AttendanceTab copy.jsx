import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/components/ui/use-toast';
import { 
  LogIn, 
  LogOut, 
  Clock, 
  Camera,
  CheckCircle,
  AlertTriangle,
  Users as MultipleUsers,
  Loader2,
  User,
  XCircle,
  Image as ImageIcon,
  TrendingUp
} from 'lucide-react';
import { format, differenceInHours, differenceInMinutes, differenceInSeconds, isSameDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useAttendance } from '@/hooks/useAttendance';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import faceRecognitionService from '@/lib/faceRecognitionService';

const AttendanceTab = () => {
  const { user, isAuthenticated, setUser } = useAuth();
  const {
    attendance,
    loading: attendanceLoading,
    fetchAttendance,
    checkIn,
    checkOut,
    getTodayAttendance
  } = useAttendance();

  // Add authentication state check
  const [authChecked, setAuthChecked] = useState(false);

  // State declarations
  const [date, setDate] = useState(new Date());
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [workingHours, setWorkingHours] = useState('0h 0m');
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Face recognition states
  const [faceRecognitionStatus, setFaceRecognitionStatus] = useState('idle');
  const [faceVerificationLoading, setFaceVerificationLoading] = useState(false);
  const [faceVerificationResult, setFaceVerificationResult] = useState(null);
  const [detectedFaces, setDetectedFaces] = useState(0);
  const [faceDetectionActive, setFaceDetectionActive] = useState(false);
  const [faceDetectionInterval, setFaceDetectionInterval] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // ==============================
  // EFFECT HOOKS
  // ==============================

  // Initialize face recognition with profile picture fetching
  useEffect(() => {
    const initializeFaceRecognition = async () => {
      if (!user?.employeeId) {
        console.warn('Cannot initialize face recognition: missing employeeId');
        setFaceRecognitionStatus('failed');
        return;
      }

      try {
        setFaceRecognitionStatus('loading');
        
        let profilePicture = user?.profilePicture || user?.profilePhoto;
        
        // If no profile picture in context, try to fetch it from API
        if (!profilePicture) {
          const employeeProfile = await fetchEmployeeProfile();
          
          if (employeeProfile) {
            profilePicture = employeeProfile.profilePicture;
            
            if (profilePicture) {
              // Update user context with the fetched profile picture
              if (setUser) {
                setUser(prevUser => ({
                  ...prevUser,
                  profilePicture: profilePicture,
                  name: employeeProfile.employeeName || prevUser.name,
                  department: employeeProfile.department || prevUser.department
                }));
              }
            } else {
              setFaceRecognitionStatus('no-profile');
              return;
            }
          } else {
            setFaceRecognitionStatus('failed');
            return;
          }
        }

        // Final validation of profile picture URL
        if (!profilePicture) {
          setFaceRecognitionStatus('no-profile');
          return;
        }

        // Fix URL if it points to frontend instead of backend
        let absoluteProfilePicture = profilePicture;
        if (profilePicture.includes('localhost:3000')) {
          absoluteProfilePicture = profilePicture.replace('localhost:3000', 'localhost:5000');
        } else if (!profilePicture.startsWith('http') && !profilePicture.startsWith('data:')) {
          absoluteProfilePicture = `http://localhost:5000${profilePicture.startsWith('/') ? '' : '/'}${profilePicture}`;
        }

        await faceRecognitionService.init();
        
        try {
          // Register employee's face descriptor from profile picture
          await faceRecognitionService.registerEmployee(
            user.employeeId, 
            absoluteProfilePicture
          );
          
          if (faceRecognitionService.isEmployeeRegistered(user.employeeId)) {
            setFaceRecognitionStatus('ready');
            
            toast({
              title: 'Face Recognition Ready',
              description: 'Face recognition has been initialized successfully.',
              variant: 'default',
              duration: 3000
            });
          } else {
            setFaceRecognitionStatus('failed');
          }
        } catch (faceError) {
          console.error('Error registering face descriptor:', faceError);
          setFaceRecognitionStatus('failed');
          
          toast({
            title: 'Face Data Error',
            description: 'Could not process profile picture for face recognition.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Failed to initialize face recognition:', error);
        setFaceRecognitionStatus('failed');
      }
    };

    if (isAuthenticated && user) {
      initializeFaceRecognition();
    } else {
      setFaceRecognitionStatus('idle');
    }
  }, [user, isAuthenticated, setUser]);

  // Main data loading effect
  useEffect(() => {
    const loadAllData = async () => {
      if (isAuthenticated && user?.employeeId) {
        setAuthChecked(true);
        
        try {
          await Promise.all([
            fetchTodayAttendance(),
            fetchRecentAttendance(),
             fetchCompanyHolidays()
          ]);
        } catch (error) {
          console.error('Error loading initial data:', error);
        }
      } else {
        setAuthChecked(true);
      }
    };

    loadAllData();
  }, [isAuthenticated, user]);

  // Working hours update effect
  useEffect(() => {
    let interval;
    
    if (checkInTime && !checkOutTime) {
      updateWorkingHours();
      
      interval = setInterval(() => {
        updateWorkingHours();
      }, 1000);

      return () => {
        if (interval) clearInterval(interval);
      };
    } else if (checkOutTime) {
      updateWorkingHours();
    }
  }, [checkInTime, checkOutTime]);

  // Start/stop face detection when camera opens/closes
  useEffect(() => {
    if (showCamera && faceRecognitionStatus === 'ready') {
      startFaceDetection();
    } else {
      stopFaceDetection();
    }

    return () => {
      stopFaceDetection();
    };
  }, [showCamera, faceRecognitionStatus]);

  // ==============================
  // FACE DETECTION LOGIC
  // ==============================

  const startFaceDetection = () => {
    if (!videoRef.current || faceDetectionActive) {
      return;
    }

    setFaceDetectionActive(true);
    
    const interval = setInterval(async () => {
      if (videoRef.current && 
          videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
          videoRef.current.videoWidth > 0 &&
          videoRef.current.videoHeight > 0) {
        await detectFacesInFrame();
      }
    }, 1500);

    setFaceDetectionInterval(interval);
  };

  const stopFaceDetection = () => {
    if (faceDetectionInterval) {
      clearInterval(faceDetectionInterval);
      setFaceDetectionInterval(null);
    }
    setFaceDetectionActive(false);
    setDetectedFaces(0);
  };

  const detectFacesInFrame = async () => {
    try {
      if (!videoRef.current || !canvasRef.current) {
        return;
      }

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        return;
      }
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const result = await faceRecognitionService.human.detect(canvas);
      
      if (result?.face && Array.isArray(result.face)) {
        setDetectedFaces(result.face.length);
      } else {
        setDetectedFaces(0);
      }
    } catch (error) {
      console.error('Error detecting faces:', error);
      setDetectedFaces(0);
    }
  };

  const performFaceVerification = async () => {
    if (faceRecognitionStatus !== 'ready') {
      throw new Error('FACE_RECOGNITION_UNAVAILABLE');
    }

    if (detectedFaces > 1) {
      throw new Error('MULTIPLE_FACES_DETECTED');
    }

    if (detectedFaces === 0) {
      throw new Error('NO_FACE_DETECTED');
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const verificationResult = await faceRecognitionService.verifyFace(
      user.employeeId,
      canvas
    );

    setFaceVerificationResult(verificationResult);

    if (!verificationResult.success) {
      throw new Error(verificationResult.message);
    }

    if (!verificationResult.matched) {
      throw new Error('FACE_VERIFICATION_FAILED');
    }

    return verificationResult;
  };

  // ==============================
  // CORE FUNCTIONS
  // ==============================

  const updateWorkingHours = () => {
    if (checkInTime) {
      const endTime = checkOutTime || new Date();
      const totalSeconds = differenceInSeconds(endTime, checkInTime);
      
      const breakSeconds = 60 * 60;
      const netSeconds = totalSeconds > (4 * 60 * 60) ? Math.max(0, totalSeconds - breakSeconds) : totalSeconds;
      
      const hours = Math.floor(netSeconds / 3600);
      const minutes = Math.floor((netSeconds % 3600) / 60);
      const seconds = netSeconds % 60;
      
      if (!checkOutTime) {
        setWorkingHours(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setWorkingHours(`${hours}h ${minutes}m`);
      }
    }
  };

  const fetchEmployeeProfile = async () => {
    try {
      const token = localStorage.getItem('hrms_token');
      let employeeId = user?.employeeId;
      
      if (!employeeId) {
        const storedUser = localStorage.getItem('hrms_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          employeeId = parsedUser.employeeId;
        }
      }

      if (!employeeId) {
        return null;
      }

      const response = await fetch(`http://localhost:5000/api/employee-profiles/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        const employeeData = responseData.data?.employee || responseData.employee || responseData;
        
        let profilePicture = employeeData.profilePicture || 
                       employeeData.profilePhoto ||
                       employeeData.photo || 
                       employeeData.avatar || 
                       employeeData.imageUrl;

        if (profilePicture && profilePicture.includes('localhost:3000')) {
          profilePicture = profilePicture.replace('localhost:3000', 'localhost:5000');
        }
        
        return {
          profilePicture,
          employeeName: employeeData.name || employeeData.employeeName || employeeData.fullName,
          department: employeeData.department,
          position: employeeData.designation || employeeData.position,
          ...employeeData
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching employee profile:', error);
      return null;
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      if (user?.employeeId) {
        const todayAtt = await getTodayAttendance(user.employeeId);
        setTodayAttendance(todayAtt);
        
        if (todayAtt && todayAtt._id) {
          if (todayAtt.checkIn) {
            const now = new Date();
            const [time, period] = todayAtt.checkIn.split(' ');
            const [hours, minutes] = time.split(':');
            
            let hourInt = parseInt(hours);
            if (period === 'PM' && hourInt < 12) hourInt += 12;
            if (period === 'AM' && hourInt === 12) hourInt = 0;
            
            const checkInDate = new Date(now);
            checkInDate.setHours(hourInt, parseInt(minutes), 0, 0);
            setCheckInTime(checkInDate);
          }
          
          if (todayAtt.checkOut) {
            const now = new Date();
            const [time, period] = todayAtt.checkOut.split(' ');
            const [hours, minutes] = time.split(':');
            
            let hourInt = parseInt(hours);
            if (period === 'PM' && hourInt < 12) hourInt += 12;
            if (period === 'AM' && hourInt === 12) hourInt = 0;
            
            const checkOutDate = new Date(now);
            checkOutDate.setHours(hourInt, parseInt(minutes), 0, 0);
            setCheckOutTime(checkOutDate);
          }
          
          if (todayAtt.duration) {
            setWorkingHours(todayAtt.duration);
          } else if (todayAtt.checkIn && todayAtt.checkOut && checkInTime && checkOutTime) {
            const hours = differenceInHours(checkOutTime, checkInTime);
            const minutes = differenceInMinutes(checkOutTime, checkInTime) % 60;
            setWorkingHours(`${hours}h ${minutes}m`);
          }
          
        } else {
          setCheckInTime(null);
          setCheckOutTime(null);
          setWorkingHours('0h 0m');
        }
      }
    } catch (error) {
      console.error('Error in fetchTodayAttendance:', error);
      
      if (error.response?.status === 404) {
        setCheckInTime(null);
        setCheckOutTime(null);
        setWorkingHours('0h 0m');
      } else {
        toast({
          title: 'Attendance Data Error',
          description: error.response?.data?.message || 'Failed to load attendance data',
          variant: 'destructive'
        });
      }
    }
  };
  const fetchCompanyHolidays = async () => {
    try {
      setHolidaysLoading(true);
      const token = localStorage.getItem('hrms_token');
      const res = await fetch('http://localhost:5000/api/settings/company/holidays', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        console.warn('Failed to fetch company holidays', res.status);
        setHolidays([]);
        setHolidaysLoading(false);
        return;
      }

      const json = await res.json();
      // endpoint returns: { success: true, data: { holidays: [...] } }
      const rawHolidays = (json?.data?.holidays) || json?.holidays || [];
      // Normalize to objects with name and date (Date)
      const normalized = rawHolidays
        .map(h => {
          try {
            const d = h.date ? new Date(h.date) : null;
            return d && !isNaN(d) ? { id: h.id || h._id || `${h.name}-${h.date}`, name: h.name || 'Holiday', date: d } : null;
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean);

      setHolidays(normalized);
    } catch (error) {
      console.error('Error fetching company holidays:', error);
      setHolidays([]);
    } finally {
      setHolidaysLoading(false);
    }
  };

  const fetchRecentAttendance = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const filters = {
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        employeeId: user?.employeeId
      };
      
      await fetchAttendance(filters);
      
    } catch (error) {
      console.error('Error fetching recent attendance:', error);
      toast({
        title: 'Data Error',
        description: 'Failed to load attendance history.',
        variant: 'destructive'
      });
    }
  };

  // ==============================
  // LOCATION & CAMERA SERVICES
  // ==============================

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            resolve({
              latitude,
              longitude,
              address: `${data.locality || data.city || 'Unknown'}, ${data.countryName || ''}`,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            resolve({
              latitude,
              longitude,
              address: 'Location detected (details unavailable)',
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString()
            });
          }
        },
        (error) => {
          let errorMessage = 'Unable to retrieve your location.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location services.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    });
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      setShowCamera(true);
      setIsCapturing(true);
      setDetectedFaces(0);
      setFaceVerificationResult(null);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setTimeout(() => {
              startFaceDetection();
            }, 500);
          });
        };
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      toast({
        title: 'Camera Access Required',
        description: 'Please allow camera access to continue with attendance.',
        variant: 'destructive'
      });
      setShowCamera(false);
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    stopFaceDetection();
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => {
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
    setIsCapturing(false);
    setIsProcessing(false);
    setFaceVerificationLoading(false);
    setFaceVerificationResult(null);
    setDetectedFaces(0);
  };

  const capturePhoto = () => {
    return new Promise((resolve) => {
      if (canvasRef.current && videoRef.current) {
        const context = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        const photoData = canvasRef.current.toDataURL('image/jpg', 0.9);
        resolve(photoData);
      }
    });
  };

  // ==============================
  // ATTENDANCE ACTIONS WITH FACE RECOGNITION
  // ==============================

  const handleCheckIn = async () => {
    try {
      const token = localStorage.getItem('hrms_token');
      const storedUser = localStorage.getItem('hrms_user');
      
      let employeeId = user?.employeeId;
      
      if (!employeeId && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          employeeId = parsedUser.employeeId;
        } catch (parseError) {
          console.error('Error parsing stored user:', parseError);
        }
      }

      if (!employeeId) {
        toast({
          title: 'Employee ID Missing',
          description: 'Unable to find your employee ID. Please log in again.',
          variant: 'destructive'
        });
        return;
      }

      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in again to continue.',
          variant: 'destructive'
        });
        return;
      }

      if (faceRecognitionStatus !== 'ready') {
        toast({
          title: 'Face Recognition Required',
          description: 'Face recognition is not available. Please ensure your profile picture is set up correctly.',
          variant: 'destructive'
        });
        return;
      }

      setIsProcessing(true);
      await startCamera();
    } catch (error) {
      console.error('Check-in authentication error:', error);
      toast({ 
        title: 'Check-in Failed', 
        description: error.message || 'Unable to start check-in process.', 
        variant: 'destructive' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmCheckInWithFaceRecognition = async () => {
    try {
      setIsProcessing(true);
      setFaceVerificationLoading(true);
      setFaceVerificationResult(null);

      if (detectedFaces === 0) {
        throw new Error('NO_FACE_DETECTED');
      }

      if (detectedFaces > 1) {
        throw new Error('MULTIPLE_FACES_DETECTED');
      }

      const photo = await capturePhoto();
      const location = await getCurrentLocation();

      let verificationResult = null;
      
      if (faceRecognitionStatus === 'ready') {
        try {
          verificationResult = await performFaceVerification();
          
          if (!verificationResult.matched) {
            throw new Error('FACE_VERIFICATION_FAILED');
          }
        } catch (faceError) {
          if (faceError.message === 'FACE_VERIFICATION_FAILED') {
            throw new Error('Face verification failed. Cannot check in.');
          } else {
            throw new Error(`Face verification error: ${faceError.message}`);
          }
        }
      } else {
        throw new Error('FACE_RECOGNITION_UNAVAILABLE');
      }

      const checkInData = {
        employeeId: user.employeeId,
        employee: user.name || user.employeeName || user.email?.split('@')[0] || 'Employee',
        checkInTime: new Date().toLocaleTimeString('en-US', { hour12: true }),
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        accuracy: location.accuracy,
        photo: photo,
        teamId: user.teamId || 1,
        department: user.department || 'General',
        faceVerified: true,
        faceMatchSimilarity: verificationResult?.similarity,
        verificationMethod: 'face_recognition',
        detectedFaces: detectedFaces
      };

      await checkIn(checkInData);
      
      const now = new Date();
      setCheckInTime(now);
      
      stopCamera();
      
      toast({ 
        title: '✅ Checked In Successfully!', 
        description: `Checked in at ${format(now, 'p')} (Face Verified)`,
        duration: 5000
      });

      await fetchTodayAttendance();
      await fetchRecentAttendance();

    } catch (error) {
      console.error('Check-in error:', error);
      
      let errorMessage = error.message;
      if (error.message === 'MULTIPLE_FACES_DETECTED') {
        errorMessage = 'Multiple faces detected. Only one person should be in the frame.';
      } else if (error.message === 'NO_FACE_DETECTED') {
        errorMessage = 'No face detected. Please ensure your face is clearly visible.';
      } else if (error.message === 'FACE_VERIFICATION_FAILED') {
        errorMessage = 'Face verification failed. Cannot check in. Please try again.';
      } else if (error.message === 'FACE_RECOGNITION_UNAVAILABLE') {
        errorMessage = 'Face recognition is not available. Cannot check in.';
      }

      toast({ 
        title: 'Check-in Failed', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      setIsProcessing(false);
      setFaceVerificationLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      if (!isAuthenticated || !user?.employeeId) {
        const token = localStorage.getItem('hrms_token');
        if (!token) {
          toast({
            title: 'Authentication Required',
            description: 'Please log in again to continue.',
            variant: 'destructive'
          });
          return;
        }
      }

      if (!checkInTime) {
        toast({ 
          title: 'Check-in Required', 
          description: 'You must check in first before checking out.', 
          variant: 'destructive' 
        });
        return;
      }

      if (faceRecognitionStatus !== 'ready') {
        toast({
          title: 'Face Recognition Required',
          description: 'Face recognition is not available. Please ensure your profile picture is set up correctly.',
          variant: 'destructive'
        });
        return;
      }

      setIsProcessing(true);
      await startCamera();
    } catch (error) {
      console.error('Check-out authentication error:', error);
      toast({ 
        title: 'Authentication Failed', 
        description: 'Please log in again.', 
        variant: 'destructive' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmCheckOutWithFaceRecognition = async () => {
    try {
      setIsProcessing(true);
      setFaceVerificationLoading(true);
      setFaceVerificationResult(null);

      if (detectedFaces === 0) {
        throw new Error('NO_FACE_DETECTED');
      }

      if (detectedFaces > 1) {
        throw new Error('MULTIPLE_FACES_DETECTED');
      }

      const photo = await capturePhoto();
      const location = await getCurrentLocation();

      let verificationResult = null;
      
      if (faceRecognitionStatus === 'ready') {
        try {
          verificationResult = await performFaceVerification();
          
          if (!verificationResult.matched) {
            throw new Error('FACE_VERIFICATION_FAILED');
          }
        } catch (faceError) {
          if (faceError.message === 'FACE_VERIFICATION_FAILED') {
            throw new Error('Face verification failed. Cannot check out.');
          } else {
            throw new Error(`Face verification error: ${faceError.message}`);
          }
        }
      } else {
        throw new Error('FACE_RECOGNITION_UNAVAILABLE');
      }

      const checkOutData = {
        employeeId: user.employeeId,
        checkOutTime: new Date().toLocaleTimeString('en-US', { hour12: true }),
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        accuracy: location.accuracy,
        photo: photo,
        faceVerified: true,
        faceMatchSimilarity: verificationResult?.similarity,
        verificationMethod: 'face_recognition',
        detectedFaces: detectedFaces
      };

      await checkOut(checkOutData);

      const now = new Date();
      setCheckOutTime(now);
      
      const hours = differenceInHours(now, checkInTime);
      const minutes = differenceInMinutes(now, checkInTime) % 60;
      setWorkingHours(`${hours}h ${minutes}m`);

      stopCamera();
      
      toast({ 
        title: '✅ Checked Out Successfully!', 
        description: `Checked out at ${format(now, 'p')}. Total: ${hours}h ${minutes}m (Face Verified)`,
        duration: 5000
      });

      await fetchTodayAttendance();
      await fetchRecentAttendance();

    } catch (error) {
      console.error('Check-out error:', error);
      
      let errorMessage = error.message;
      if (error.message === 'MULTIPLE_FACES_DETECTED') {
        errorMessage = 'Multiple faces detected. Only one person should be in the frame.';
      } else if (error.message === 'NO_FACE_DETECTED') {
        errorMessage = 'No face detected. Please ensure your face is clearly visible.';
      } else if (error.message === 'FACE_VERIFICATION_FAILED') {
        errorMessage = 'Face verification failed. Cannot check out. Please try again.';
      } else if (error.message === 'FACE_RECOGNITION_UNAVAILABLE') {
        errorMessage = 'Face recognition is not available. Cannot check out.';
      }

      toast({ 
        title: 'Check-out Failed', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      setIsProcessing(false);
      setFaceVerificationLoading(false);
    }
  };

  // ==============================
  // FACE DETECTION COMPONENTS
  // ==============================

  const FaceDetectionStatus = () => {
    if (!showCamera) return null;

    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-2">
          <Camera className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium">Face Detection</span>
        </div>
        <div className="flex items-center space-x-2">
          {detectedFaces === 0 && (
            <div className="flex items-center text-amber-600">
              <AlertTriangle className="w-4 h-4 mr-1" />
              <span className="text-sm">No face detected</span>
            </div>
          )}
          {detectedFaces === 1 && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span className="text-sm">1 face detected</span>
            </div>
          )}
          {detectedFaces > 1 && (
            <div className="flex items-center text-red-600">
              <MultipleUsers className="w-4 h-4 mr-1" />
              <span className="text-sm">{detectedFaces} faces detected</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const FaceVerificationStatus = () => {
    if (!faceVerificationLoading && !faceVerificationResult) {
      if (faceRecognitionStatus === 'loading') {
        return (
          <div className="flex items-center justify-center p-3 bg-blue-50 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm">Initializing face recognition...</span>
          </div>
        );
      }
      return null;
    }

    if (faceVerificationLoading) {
      return (
        <div className="flex items-center justify-center p-3 bg-blue-50 rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span className="text-sm">Verifying face...</span>
        </div>
      );
    }

    if (faceVerificationResult) {
      if (faceVerificationResult.success && faceVerificationResult.matched) {
        return (
          <div className="flex items-center justify-center p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm text-green-700">Face verified successfully!</span>
          </div>
        );
      } else {
        return (
          <div className="flex items-center justify-center p-3 bg-red-50 rounded-lg">
            <XCircle className="w-4 h-4 text-red-600 mr-2" />
            <span className="text-sm text-red-700">
              {faceVerificationResult.message}
            </span>
          </div>
        );
      }
    }

    return null;
  };

  // ==============================
  // DATA PROCESSING & UTILITIES
  // ==============================

  const getStatusColor = (status) => {
    const colors = {
      present: { backgroundColor: '#10b981', textColor: '#ffffff' },
      absent: { backgroundColor: '#ef4444', textColor: '#ffffff' },
      late: { backgroundColor: '#f59e0b', textColor: '#ffffff' },
      'half-day': { backgroundColor: '#3b82f6', textColor: '#ffffff' },
      weekend: { backgroundColor: '#6b7280', textColor: '#ffffff' }
    };
    return colors[status] || { backgroundColor: '#6b7280', textColor: '#ffffff' };
  };

  // Calculate dynamic stats for quick stats section
  const calculateQuickStats = () => {
    if (!attendance || attendance.length === 0) {
      return {
        present: 0,
        absent: 0,
        late: 0,
        onTimeRate: '0%'
      };
    }

    const presentRecords = attendance.filter(record => record.status === 'present');
    const lateRecords = attendance.filter(record => record.status === 'late');
    
    const totalRecords = attendance.length;
    const onTimeRate = totalRecords > 0 ? Math.round(((presentRecords.length - lateRecords.length) / totalRecords) * 100) : 0;

    return {
      present: presentRecords.length,
      absent: attendance.filter(record => record.status === 'absent').length,
      late: lateRecords.length,
      onTimeRate: `${onTimeRate}%`
    };
  };

    const DayWithStatus = ({ date, ...props }) => {
    const status = getDayStatus(date);
    const isToday = isSameDay(date, new Date());

    // check holiday for this date
    const holiday = holidays.find(h => isSameDay(new Date(h.date), date));

    const statusColors = {
      present: 'bg-green-500 text-white hover:bg-green-600',
      absent: 'bg-red-500 text-white hover:bg-red-600',
      late: 'bg-yellow-500 text-white hover:bg-yellow-600',
      'half-day': 'bg-blue-500 text-white hover:bg-blue-600',
      weekend: 'bg-gray-300 text-gray-600 hover:bg-gray-400',
      holiday: 'bg-purple-600 text-white hover:bg-purple-700',
      default: 'bg-white text-gray-900 hover:bg-gray-100'
    };

    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    // If it's a holiday we want to show 'holiday' regardless of other status
    const displayStatus = holiday ? 'holiday' : (isWeekend ? 'weekend' : status);

    return (
      <div
        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 ${
          statusColors[displayStatus] || statusColors.default
        } ${isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
        onClick={() => setDate(date)}
        // Hover shows holiday name (if any) or status
        title={holiday ? `${holiday.name} — Holiday` : (displayStatus !== 'default' ? displayStatus : '')}
      >
        {date.getDate()}
      </div>
    );
  };


  const getDayStatus = (day) => {
    if (!attendance || attendance.length === 0) return 'default';
    
    const attendanceRecord = attendance.find(record => {
      try {
        const recordDate = new Date(record.date);
        return isSameDay(recordDate, day);
      } catch (error) {
        return false;
      }
    });
    
    if (attendanceRecord) {
      return attendanceRecord.status || 'default';
    }
    
    if (day > new Date()) return 'default';
    if (day.getDay() === 0 || day.getDay() === 6) return 'weekend';
    
    return 'absent';
  };

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-3 border rounded-lg animate-pulse">
          <div className="h-3 w-3 bg-gray-200 rounded-full"></div>
          <div className="space-y-2 flex-1">
            <div className="h-3 bg-gray-200 rounded w-24"></div>
            <div className="h-2 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="h-5 bg-gray-200 rounded w-12"></div>
        </div>
      ))}
    </div>
  );

  const renderAttendanceList = () => (
    <div className="space-y-2">
      {attendanceLoading ? (
        <LoadingSkeleton />
      ) : attendance && attendance.length > 0 ? (
        attendance.slice(0, 8).map((record, index) => (
          <div key={record._id || index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-all duration-200 group">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(record.status).backgroundColor} ring-2 ring-offset-1 ${getStatusColor(record.status).backgroundColor} ring-opacity-50`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {record.date ? format(new Date(record.date), 'MMM dd, yyyy') : 'Unknown Date'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {record.shiftName || record.shift || 'General Shift'}
                </p>
              </div>
            </div>
            
            <div className="text-right space-y-1 flex-shrink-0 ml-2">
              <p className="text-xs font-medium whitespace-nowrap">
                {record.checkIn || '--:--'} - {record.checkOut || '--:--'}
              </p>
              <p className="text-xs text-muted-foreground">{record.duration || '0h 0m'}</p>
              <Badge 
                variant="secondary" 
                className="text-xs capitalize px-2 py-0"
                style={{ 
                  backgroundColor: getStatusColor(record.status).backgroundColor,
                  color: getStatusColor(record.status).textColor
                }}
              >
                {record.status || 'unknown'}
              </Badge>
            </div>
            
            {(record.checkInPhoto || record.checkOutPhoto || record.photo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedImage(record.checkInPhoto || record.checkOutPhoto || record.photo);
                  setImageDialogOpen(true);
                }}
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 h-7 w-7"
              >
                <ImageIcon className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))
      ) : (
        <div className="text-center p-6 border-2 border-dashed rounded-lg bg-muted/20">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground text-sm">No attendance records found</p>
          <p className="text-xs text-muted-foreground mt-1">Your attendance history will appear here once you start checking in</p>
        </div>
      )}
    </div>
  );

  // ==============================
  // MAIN RENDER
  // ==============================

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to access attendance features.</p>
        </div>
      </div>
    );
  }

  const quickStats = calculateQuickStats();

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Present</p>
                <p className="text-2xl font-bold text-green-900">{quickStats.present}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Absent</p>
                <p className="text-2xl font-bold text-red-900">{quickStats.absent}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Late</p>
                <p className="text-2xl font-bold text-yellow-900">{quickStats.late}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">On Time</p>
                <p className="text-2xl font-bold text-blue-900">{quickStats.onTimeRate}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
    {/* First Row: Today's Status (1/3) and Calendar (2/3) */}
<div className="flex flex-col space-y-6">
  {/* First Row: Today's Status and Calendar */}
  <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6">
    
    {/* Left Card: Today's Status - takes 2 columns (2/3) */}
    <div className="lg:flex-1">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Today's Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Check In</p>
              <p className="text-lg font-semibold">
                {checkInTime ? format(checkInTime, 'p') : '--:--'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Check Out</p>
              <p className="text-lg font-semibold">
                {checkOutTime ? format(checkOutTime, 'p') : '--:--'}
              </p>
            </div>
            <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Working Hours</p>
            <p className="text-xl font-bold text-primary">{workingHours}</p>
          </div>
          </div>
          
          

          <div className="flex space-x-2 pt-2">
            {!checkInTime ? (
              <Button 
                onClick={handleCheckIn}
                disabled={isProcessing || faceRecognitionStatus !== 'ready'}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Check In
                  </>
                )}
              </Button>
            ) : !checkOutTime ? (
              <Button 
                onClick={handleCheckOut}
                disabled={isProcessing || faceRecognitionStatus !== 'ready'}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Check Out
                  </>
                )}
              </Button>
            ) : (
              <div className="text-center w-full py-2 px-3 bg-green-100 text-green-800 rounded-md border border-green-200">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Completed for Today
              </div>
            )}
          </div>

          {/* Face Recognition Status */}
          {faceRecognitionStatus === 'loading' && (
            <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
              <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
              Initializing face recognition...
            </div>
          )}

          {faceRecognitionStatus === 'no-profile' && (
            <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
              <User className="w-3 h-3 inline mr-1" />
              Profile picture required for face recognition
            </div>
          )}

          {faceRecognitionStatus === 'failed' && (
            <div className="text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
              <XCircle className="w-3 h-3 inline mr-1" />
              Face recognition unavailable - cannot check in/out
            </div>
          )}

          {faceRecognitionStatus === 'ready' && (
            <div className="text-xs text-green-700 bg-green-50 p-2 rounded border border-green-200">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              Face recognition ready
            </div>
          )}
        </CardContent>
      </Card>
    </div>

   {/* Right Card: Calendar */}
<div className="lg:w-1/3">
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg">Calendar</CardTitle>
    </CardHeader>

    <CardContent className="p-0">
      {/* Responsive layout: column on xs, row from sm */}
      <div className="flex flex-col sm:flex-row items-start gap-4 p-4">
        {/* Calendar area: allow shrinking, keep relative stacking context */}
        <div className="flex-1 min-w-0 relative z-0">
          {/* limit width so legend has room on small containers */}
          <div className="max-w-[220px]">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              components={{
                Day: DayWithStatus
              }}
            />
          </div>
        </div>

        {/* Legend area: fixed, compact, top-aligned */}
        <div className="w-32 self-start z-10">
          <div className="p-2 rounded-md border bg-white">
            <h4 className="text-sm font-medium mb-2">Legend</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2" />
                <span>Present</span>
              </li>
              <li className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2" />
                <span>Absent</span>
              </li>
              <li className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                <span>Late</span>
              </li>
              <li className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2" />
                <span>Half-day</span>
              </li>
              <li className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-gray-300 border border-gray-400 mr-2" />
                <span>Weekend</span>
              </li>
              <li className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-purple-600 mr-2" />
                <span>Holiday</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</div>

  </div>
</div>
    {/* Second Row: Recent Attendance - takes full width (1 column) */}
    <Card>
        <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent>
            {renderAttendanceList()}
        </CardContent>
    </Card>
</div>

      {/* Camera Modal with Face Detection */}
      <Dialog open={showCamera} onOpenChange={stopCamera}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              {checkInTime && !checkOutTime ? 'Check Out Verification' : 'Check In Verification'}
              {faceRecognitionStatus === 'ready' && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                  Face Recognition Active
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto max-h-[300px] object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {detectedFaces > 0 && (
                <div className="absolute top-2 right-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    detectedFaces === 1 ? 'bg-green-500 text-white' : 
                    detectedFaces > 1 ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
                  }`}>
                    {detectedFaces} face{detectedFaces !== 1 ? 's' : ''} detected
                  </div>
                </div>
              )}
            </div>

            {/* Face Detection Status */}
            <FaceDetectionStatus />

            {/* Face Verification Status */}
            <FaceVerificationStatus />

            {/* Multiple Faces Warning */}
            {detectedFaces > 1 && (
              <div className="flex items-center p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-sm text-red-700">
                  Multiple faces detected. Please ensure only one person is in the frame.
                </span>
              </div>
            )}

            {/* No Face Warning */}
            {detectedFaces === 0 && (
              <div className="flex items-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 mr-2" />
                <span className="text-sm text-amber-700">
                  No face detected. Please ensure your face is clearly visible.
                </span>
              </div>
            )}

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={stopCamera}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              
              {checkInTime && !checkOutTime ? (
                <Button
                  onClick={confirmCheckOutWithFaceRecognition}
                  disabled={isProcessing || faceVerificationLoading || detectedFaces !== 1}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {isProcessing || faceVerificationLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      Confirm Check Out
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={confirmCheckInWithFaceRecognition}
                  disabled={isProcessing || faceVerificationLoading || detectedFaces !== 1}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isProcessing || faceVerificationLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Confirm Check In
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Attendance Photo</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {selectedImage && (
              <img 
                src={selectedImage} 
                alt="Attendance verification" 
                className="max-w-full h-auto rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceTab;