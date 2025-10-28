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
  BarChart3,
  Calendar as CalendarIcon,
  Loader2,
  User,
  XCircle,
  Image as ImageIcon,
  TrendingUp,
  Users,
  Building,
  CheckCircle
} from 'lucide-react';
import { format, differenceInHours, differenceInMinutes, differenceInSeconds, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useAttendance } from '@/hooks/useAttendance';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
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
  const [weeklyStats, setWeeklyStats] = useState({ worked: 0, total: 5 });
  const [currentShift, setCurrentShift] = useState(null);
  const [shiftSchedule, setShiftSchedule] = useState([]);
  
  // Face recognition states
  const [faceRecognitionStatus, setFaceRecognitionStatus] = useState('idle'); // 'idle', 'loading', 'ready', 'failed', 'no-profile'
  const [faceVerificationLoading, setFaceVerificationLoading] = useState(false);
  const [faceVerificationResult, setFaceVerificationResult] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // ==============================
  // EFFECT HOOKS
  // ==============================

// In AttendanceTab.jsx - Update the fetchEmployeeProfile function
const fetchEmployeeProfile = async () => {
  try {
    const token = localStorage.getItem('hrms_token');
    let employeeId = user?.employeeId;
    
    // Fallback to get employeeId from localStorage if not in context
    if (!employeeId) {
      const storedUser = localStorage.getItem('hrms_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        employeeId = parsedUser.employeeId;
      }
    }

    if (!employeeId) {
      console.error('No employeeId available for profile fetch');
      return null;
    }

    console.log('Fetching employee profile for:', employeeId);

    const response = await fetch(`http://localhost:5000/api/employee-profiles/${employeeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Profile fetch response status:', response.status);

    if (response.ok) {
      const responseData = await response.json();
      console.log('Full API response:', responseData);
      
      // Extract employee data from nested response
      const employeeData = responseData.data?.employee || responseData.employee || responseData;
      console.log('Extracted employee data:', employeeData);
      
      // Check all possible profile picture fields with priority
      const profilePicture = employeeData.profilePicture || 
                           employeeData.profilePhoto ||
                           employeeData.photo || 
                           employeeData.avatar || 
                           employeeData.imageUrl;
      
      console.log('Final profile picture URL:', profilePicture);
      
      if (!profilePicture) {
        console.warn('No profile picture found in employee data fields');
      }
      
      return {
        profilePicture,
        employeeName: employeeData.name || employeeData.employeeName || employeeData.fullName,
        department: employeeData.department,
        position: employeeData.designation || employeeData.position,
        ...employeeData
      };
    } else {
      console.error('Failed to fetch employee profile:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return null;
    }
  } catch (error) {
    console.error('Error fetching employee profile:', error);
    return null;
  }
};

  // Initialize face recognition with profile picture fetching
  useEffect(() => {
   // In AttendanceTab.jsx - Update the initializeFaceRecognition function
const initializeFaceRecognition = async () => {
  if (!user?.employeeId) {
    console.warn('Cannot initialize face recognition: missing employeeId');
    setFaceRecognitionStatus('failed');
    return;
  }

  try {
    console.log('=== FACE RECOGNITION INITIALIZATION STARTED ===');
    console.log('Employee ID:', user.employeeId);
    setFaceRecognitionStatus('loading');
    
    // Try multiple sources for profile picture in user context
    let profilePicture = user?.profilePicture || user?.profilePhoto;
    console.log('Profile picture from user context:', profilePicture);
    
    // If no profile picture in context, try to fetch it from API
    if (!profilePicture) {
      console.log('No profile picture in context, fetching from API...');
      const employeeProfile = await fetchEmployeeProfile();
      
      if (employeeProfile) {
        profilePicture = employeeProfile.profilePicture;
        console.log('Profile picture from API fetch:', profilePicture);
        
        if (profilePicture) {
          console.log('✅ Profile picture found:', profilePicture);
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
          console.warn('❌ Profile picture not found in employee data after fetch');
          setFaceRecognitionStatus('no-profile');
          return;
        }
      } else {
        console.warn('❌ Failed to fetch employee profile data');
        setFaceRecognitionStatus('failed');
        return;
      }
    } else {
      console.log('✅ Using profile picture from user context:', profilePicture);
    }

    // Final validation of profile picture URL
    if (!profilePicture) {
      console.warn('❌ No profile picture available after all attempts');
      setFaceRecognitionStatus('no-profile');
      return;
    }

    // Ensure the URL is absolute
    let absoluteProfilePicture = profilePicture;
    if (!profilePicture.startsWith('http') && !profilePicture.startsWith('data:')) {
      // Make relative URL absolute
      absoluteProfilePicture = `${window.location.origin}${profilePicture.startsWith('/') ? '' : '/'}${profilePicture}`;
      console.log('Converted to absolute URL:', absoluteProfilePicture);
    }

    console.log('Loading face recognition models...');
    const modelsLoaded = await faceRecognitionService.loadModels();
    
    if (modelsLoaded) {
      console.log('✅ Models loaded successfully, now loading face descriptor...');
      
      try {
        // Load employee's face descriptor from profile picture
        await faceRecognitionService.loadEmployeeFaceDescriptor(
          user.employeeId, 
          absoluteProfilePicture
        );
        
        if (faceRecognitionService.isReady(user.employeeId)) {
          setFaceRecognitionStatus('ready');
          console.log('✅ Face recognition initialized successfully');
          
          toast({
            title: 'Face Recognition Ready',
            description: 'Face recognition has been initialized successfully.',
            variant: 'default',
            duration: 3000
          });
        } else {
          setFaceRecognitionStatus('failed');
          console.warn('❌ Face recognition initialized but employee face not loaded');
        }
      } catch (faceError) {
        console.error('❌ Error loading face descriptor:', faceError);
        setFaceRecognitionStatus('failed');
        
        toast({
          title: 'Face Data Error',
          description: 'Could not process profile picture for face recognition.',
          variant: 'destructive'
        });
      }
    } else {
      setFaceRecognitionStatus('failed');
      console.warn('❌ Face recognition models not loaded');
    }
  } catch (error) {
    console.error('❌ Failed to initialize face recognition:', error);
    setFaceRecognitionStatus('failed');
  } finally {
    console.log('=== FACE RECOGNITION INITIALIZATION COMPLETED ===');
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
        console.log('Loading all data for employee:', user.employeeId);
        setAuthChecked(true);
        
        try {
          await Promise.all([
            fetchTodayAttendance(),
            fetchRecentAttendance(),
            fetchShiftDetails()
          ]);
        } catch (error) {
          console.error('Error loading initial data:', error);
        }
      } else {
        console.log('User not authenticated or missing employeeId');
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

  // ==============================
  // CORE FUNCTIONS
  // ==============================

  const updateWorkingHours = () => {
    if (checkInTime) {
      const endTime = checkOutTime || new Date();
      const totalSeconds = differenceInSeconds(endTime, checkInTime);
      
      // Calculate break duration (default 1 hour)
      const breakSeconds = 60 * 60; // 1 hour in seconds
      
      // Subtract break time if working more than 4 hours (typical for lunch break)
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

  const fetchShiftDetails = async () => {
    try {
      const token = localStorage.getItem('hrms_token');
      
      // Get employeeId from multiple sources for fallback
      let employeeId = user?.employeeId;
      if (!employeeId) {
        const storedUser = localStorage.getItem('hrms_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          employeeId = parsedUser.employeeId;
        }
      }

      console.log('Fetching shift details for employeeId:', employeeId);
      
      if (!employeeId) {
        console.error('No employeeId available for shift fetch');
        setCurrentShift(null);
        setShiftSchedule([]);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/employees/employeesShifts?employeeId=${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Shift API Response:', data);
        
        let currentShift = null;
        
        // Find the most recent active shift assignment
        if (data.success && data.assignments && data.assignments.length > 0) {
          // Sort by effectiveDate to get the most recent assignment
          const sortedAssignments = data.assignments.sort((a, b) => 
            new Date(b.effectiveDate) - new Date(a.effectiveDate)
          );
          
          currentShift = sortedAssignments[0]; // Take the most recent active assignment
          console.log('Found current shift assignment:', currentShift);
        }
        
        if (currentShift) {
          setCurrentShift(currentShift);
          
          // Generate dynamic weekly schedule based on the actual shift
          const weekStart = startOfWeek(new Date());
          const weekEnd = endOfWeek(new Date());
          const weekDays = eachDayOfInterval({ 
            start: weekStart, 
            end: weekEnd 
          });
          
          const schedule = weekDays.map(day => ({
            day: format(day, 'EEEE'),
            date: day,
            shift: currentShift,
            status: getDayScheduleStatus(day)
          }));
          
          setShiftSchedule(schedule);
          
          // Update weekly stats based on actual data
          updateWeeklyStats(schedule);
        } else {
          console.log('No active shift assignment found for current user');
          setCurrentShift(null);
          setShiftSchedule([]);
        }
      } else {
        console.error('Failed to fetch shift assignments:', response.status);
        setCurrentShift(null);
        setShiftSchedule([]);
      }
    } catch (error) {
      console.error('Error fetching shift assignments:', error);
      setCurrentShift(null);
      setShiftSchedule([]);
    }
  };

  const updateWeeklyStats = (schedule) => {
    if (!schedule || schedule.length === 0) return;
    
    const today = new Date();
    const workedDays = schedule.filter(day => 
      day.date <= today && 
      (day.status === 'completed' || day.status === 'in-progress') &&
      day.date.getDay() !== 0 && day.date.getDay() !== 6 // Exclude weekends
    ).length;
    
    const totalWorkingDays = schedule.filter(day => 
      day.date <= today && 
      day.date.getDay() !== 0 && day.date.getDay() !== 6
    ).length;
    
    setWeeklyStats({
      worked: workedDays,
      total: totalWorkingDays || 5 // Fallback to 5 if calculation fails
    });
  };

  const getDayScheduleStatus = (day) => {
    const today = new Date();
    if (isSameDay(day, today)) {
      return checkInTime ? (checkOutTime ? 'completed' : 'in-progress') : 'scheduled';
    }
    if (day < today) {
      // Check if this day exists in attendance records
      const dayAttendance = attendance?.find(record => {
        try {
          const recordDate = new Date(record.date);
          return isSameDay(recordDate, day);
        } catch (error) {
          return false;
        }
      });
      return dayAttendance ? 'completed' : 'absent';
    }
    if (day > today) return 'scheduled';
    return 'scheduled';
  };

  const fetchTodayAttendance = async () => {
    try {
      if (user?.employeeId) {
        console.log('Fetching today attendance for:', user.employeeId);
        
        const todayAtt = await getTodayAttendance(user.employeeId);
        console.log('Today attendance raw response:', todayAtt);
        
        setTodayAttendance(todayAtt);
        
        if (todayAtt && todayAtt._id) {
          console.log('Found attendance record:', {
            checkIn: todayAtt.checkIn,
            checkOut: todayAtt.checkOut,
            duration: todayAtt.duration
          });
          
          // Simple time setting - just store the time strings
          // The UI can display these directly without complex date parsing
          if (todayAtt.checkIn) {
            // Create a date object for time calculations
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
          
          // Use duration from backend if available, otherwise calculate
          if (todayAtt.duration) {
            setWorkingHours(todayAtt.duration);
          } else if (todayAtt.checkIn && todayAtt.checkOut && checkInTime && checkOutTime) {
            const hours = differenceInHours(checkOutTime, checkInTime);
            const minutes = differenceInMinutes(checkOutTime, checkInTime) % 60;
            setWorkingHours(`${hours}h ${minutes}m`);
          }
          
        } else {
          console.log('No attendance record found for today');
          setCheckInTime(null);
          setCheckOutTime(null);
          setWorkingHours('0h 0m');
        }
      } else {
        console.log('No employeeId available for fetching attendance');
      }
    } catch (error) {
      console.error('Error in fetchTodayAttendance:', error);
      
      // Check if it's a 404 (no record) vs other errors
      if (error.response?.status === 404) {
        console.log('No attendance record exists for today (404)');
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

  const fetchRecentAttendance = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const filters = {
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        employeeId: user?.employeeId
      };
      
      console.log('Fetching attendance with filters:', filters);
      
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

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
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
  };

  const capturePhoto = () => {
    return new Promise((resolve) => {
      if (canvasRef.current && videoRef.current) {
        const context = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        const photoData = canvasRef.current.toDataURL('image/jpeg', 0.9);
        resolve(photoData);
      }
    });
  };

  // ==============================
  // ATTENDANCE ACTIONS WITH FACE RECOGNITION
  // ==============================

  const performFaceVerification = async () => {
    if (faceRecognitionStatus !== 'ready') {
      throw new Error('Face recognition not available. Using standard verification.');
    }

    const verificationResult = await faceRecognitionService.verifyFace(
      canvasRef.current,
      user.employeeId
    );

    setFaceVerificationResult(verificationResult);

    if (!verificationResult.success) {
      throw new Error(verificationResult.message);
    }

    if (!verificationResult.match) {
      throw new Error('Face verification failed. Please try again.');
    }

    return verificationResult;
  };

  const handleCheckIn = async () => {
    try {
      // Get authentication data from multiple sources
      const token = localStorage.getItem('hrms_token');
      const storedUser = localStorage.getItem('hrms_user');
      
      let employeeId = user?.employeeId;
      
      console.log('Auth check:', {
        hasContextUser: !!user,
        contextEmployeeId: user?.employeeId,
        hasStoredUser: !!storedUser,
        hasToken: !!token
      });

      // If no employeeId from context, try localStorage
      if (!employeeId && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          employeeId = parsedUser.employeeId;
          console.log('Using stored user employeeId:', employeeId);
        } catch (parseError) {
          console.error('Error parsing stored user:', parseError);
        }
      }

      // Final check - if still no employeeId, show error
      if (!employeeId) {
        console.error('No employeeId found in any source:', {
          context: user,
          stored: storedUser ? JSON.parse(storedUser) : null
        });
        
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

      console.log('Proceeding with check-in for employeeId:', employeeId);
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

      // Capture photo from camera
      const photo = await capturePhoto();
      const location = await getCurrentLocation();

      let verificationResult = null;
      let faceVerified = false;
      
      // Only attempt face verification if it's ready
      if (faceRecognitionStatus === 'ready') {
        try {
          verificationResult = await performFaceVerification();
          faceVerified = verificationResult && verificationResult.match;
        } catch (faceError) {
          console.warn('Face verification failed, proceeding with standard check-in:', faceError);
          // Continue with standard verification
        }
      } else {
        console.warn('Face recognition not available, proceeding with standard check-in');
      }

      // Prepare check-in data
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
        faceVerified: faceVerified,
        faceMatchDistance: verificationResult?.distance,
        verificationMethod: faceVerified ? 'face_recognition' : 'standard'
      };

      console.log('Check-in data:', checkInData);

      await checkIn(checkInData);
      
      const now = new Date();
      setCheckInTime(now);
      
      stopCamera();
      
      toast({ 
        title: '✅ Checked In Successfully!', 
        description: `Checked in at ${format(now, 'p')}${faceVerified ? ' (Face Verified)' : ' (Standard Verification)'}`,
        duration: 5000
      });

      await fetchTodayAttendance();
      await fetchRecentAttendance();
      await fetchShiftDetails();

    } catch (error) {
      console.error('Check-in error:', error);
      
      let errorMessage = error.message;
      if (faceVerificationResult?.error === 'MULTIPLE_FACES_DETECTED') {
        errorMessage = 'Multiple faces detected. Only one person should be in the frame.';
      } else if (faceVerificationResult?.error === 'NO_FACE_DETECTED') {
        errorMessage = 'No face detected. Please ensure your face is clearly visible.';
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

  const confirmCheckOutWithFaceRecognition = async () => {
    try {
      setIsProcessing(true);
      setFaceVerificationLoading(true);
      setFaceVerificationResult(null);

      const photo = await capturePhoto();
      const location = await getCurrentLocation();

      let verificationResult = null;
      let faceVerified = false;
      
      // Only attempt face verification if it's ready
      if (faceRecognitionStatus === 'ready') {
        try {
          verificationResult = await performFaceVerification();
          faceVerified = verificationResult && verificationResult.match;
        } catch (faceError) {
          console.warn('Face verification failed, proceeding with standard check-out:', faceError);
          // Continue with standard verification
        }
      } else {
        console.warn('Face recognition not available, proceeding with standard check-out');
      }

      const checkOutData = {
        employeeId: user.employeeId,
        checkOutTime: new Date().toLocaleTimeString('en-US', { hour12: true }),
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        accuracy: location.accuracy,
        photo: photo,
        faceVerified: faceVerified,
        faceMatchDistance: verificationResult?.distance,
        verificationMethod: faceVerified ? 'face_recognition' : 'standard'
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
        description: `Checked out at ${format(now, 'p')}. Total: ${hours}h ${minutes}m${faceVerified ? ' (Face Verified)' : ' (Standard Verification)'}`,
        duration: 5000
      });

      await fetchTodayAttendance();
      await fetchRecentAttendance();
      await fetchShiftDetails();

    } catch (error) {
      console.error('Check-out error:', error);
      
      let errorMessage = error.message;
      if (faceVerificationResult?.error === 'MULTIPLE_FACES_DETECTED') {
        errorMessage = 'Multiple faces detected. Only one person should be in the frame.';
      } else if (faceVerificationResult?.error === 'NO_FACE_DETECTED') {
        errorMessage = 'No face detected. Please ensure your face is clearly visible.';
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

  const handleCheckOut = async () => {
    try {
      // Enhanced authentication check
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

  // ==============================
  // FACE VERIFICATION COMPONENT
  // ==============================

  const FaceVerificationStatus = () => {
    if (!faceVerificationLoading && !faceVerificationResult) {
      // Show face recognition status when not actively verifying
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
      if (faceVerificationResult.success && faceVerificationResult.match) {
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
        halfDay: 0,
        onTimeRate: '0%',
        avgHours: '0h'
      };
    }

    const presentRecords = attendance.filter(record => record.status === 'present');
    const lateRecords = attendance.filter(record => record.status === 'late');
    const halfDayRecords = attendance.filter(record => record.status === 'half-day');
    
    const totalRecords = attendance.length;
    const onTimeRate = totalRecords > 0 ? Math.round(((presentRecords.length - lateRecords.length) / totalRecords) * 100) : 0;
    
    // Calculate average hours (simplified)
    const avgHours = presentRecords.length > 0 ? '8.2h' : '0h';

    return {
      present: presentRecords.length,
      absent: attendance.filter(record => record.status === 'absent').length,
      late: lateRecords.length,
      halfDay: halfDayRecords.length,
      onTimeRate: `${onTimeRate}%`,
      avgHours
    };
  };

  // ==============================
  // COMPONENTS
  // ==============================

  const DayWithStatus = ({ date, ...props }) => {
    const status = getDayStatus(date);
    const isToday = isSameDay(date, new Date());
    
    const statusColors = {
      present: 'bg-green-500 text-white hover:bg-green-600',
      absent: 'bg-red-500 text-white hover:bg-red-600', 
      late: 'bg-yellow-500 text-white hover:bg-yellow-600',
      'half-day': 'bg-blue-500 text-white hover:bg-blue-600',
      weekend: 'bg-gray-300 text-gray-600 hover:bg-gray-400',
      default: 'bg-white text-gray-900 hover:bg-gray-100'
    };

    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const displayStatus = isWeekend ? 'weekend' : status;

    return (
      <div
        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 ${
          statusColors[displayStatus] || statusColors.default
        } ${
          isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''
        }`}
        onClick={() => setDate(date)}
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

  const renderView = (viewType) => (
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

  const ShiftScheduleItem = ({ day, index }) => {
    const getStatusBadge = (status) => {
      const statusConfig = {
        'completed': { label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200' },
        'in-progress': { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        'scheduled': { label: 'Scheduled', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        'absent': { label: 'Absent', color: 'bg-red-100 text-red-800 border-red-200' }
      };
      
      const config = statusConfig[status] || statusConfig.scheduled;
      
      return (
        <Badge variant="outline" className={`text-xs ${config.color}`}>
          {config.label}
        </Badge>
      );
    };

    return (
      <div className={`flex items-center justify-between p-3 ${index !== 0 ? 'border-t' : ''}`}>
        <div className="flex items-center space-x-3">
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium text-muted-foreground">
              {day.day.substring(0, 3).toUpperCase()}
            </span>
            <span className="text-sm font-semibold">
              {format(day.date, 'dd')}
            </span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {day.shift?.shiftName || 'General Shift'}
            </span>
            <span className="text-xs text-muted-foreground">
              {day.shift?.startTime || '09:00'} - {day.shift?.endTime || '18:00'}
            </span>
          </div>
        </div>
        
        {getStatusBadge(day.status)}
      </div>
    );
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Check In/Out */}
        <div className="lg:col-span-1 space-y-6">
          {/* Today's Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Today's Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Working Hours</p>
                <p className="text-xl font-bold text-primary">{workingHours}</p>
              </div>

              <div className="flex space-x-2 pt-2">
                {!checkInTime ? (
                  <Button 
                    onClick={handleCheckIn}
                    disabled={isProcessing}
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
                    disabled={isProcessing}
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
                <div className="text-xs text-muted-foreground bg-yellow-50 p-2 rounded border border-yellow-200">
                  <Camera className="w-3 h-3 inline mr-1" />
                  Face recognition not available. Using standard verification.
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

          {/* Weekly Progress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Weekly Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Days Completed</span>
                  <span className="font-medium">{weeklyStats.worked} / {weeklyStats.total}</span>
                </div>
                <Progress value={(weeklyStats.worked / weeklyStats.total) * 100} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Week Progress</span>
                  <span>{Math.round((weeklyStats.worked / weeklyStats.total) * 100)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Calendar & History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calendar */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                  components={{
                    Day: DayWithStatus
                  }}
                />
              </CardContent>
            </Card>

            {/* Shift Schedule */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  This Week's Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                {shiftSchedule.length > 0 ? (
                  <div className="space-y-1">
                    {shiftSchedule.map((day, index) => (
                      <ShiftScheduleItem key={index} day={day} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No shift schedule available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Attendance History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Recent Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="list" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="list">List View</TabsTrigger>
                  <TabsTrigger value="detailed">Detailed View</TabsTrigger>
                </TabsList>
                
                <TabsContent value="list" className="mt-4">
                  {renderView('list')}
                </TabsContent>
                
                <TabsContent value="detailed" className="mt-4">
                  {renderView('detailed')}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Camera Modal */}
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
              {(faceRecognitionStatus === 'failed' || faceRecognitionStatus === 'no-profile') && (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                  Standard Verification
                </Badge>
              )}
              {faceRecognitionStatus === 'loading' && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  Initializing...
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
            </div>

            <FaceVerificationStatus />

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
                  disabled={isProcessing || faceVerificationLoading}
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
                  disabled={isProcessing || faceVerificationLoading}
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