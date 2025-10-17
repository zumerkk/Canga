import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Grid,
  Paper,
  Select,
  MenuItem,
  InputLabel,
  Checkbox,
  IconButton,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Snackbar,
  FormHelperText,
  Container,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Chip,
  Avatar,
  Stack,
  Divider,
  Fade,
  Slide,
  CardHeader
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Computer as ComputerIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  ContactPhone as ContactPhoneIcon,
  Public as PublicIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  FamilyRestroom as FamilyRestroomIcon,
  Contacts as ContactsIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../config/api';

// 🌐 MODERN İŞ BAŞVURU SAYFASI
function PublicJobApplication() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Core states
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [formStructure, setFormStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  
  // Progress tracking
  const [formProgress, setFormProgress] = useState(0);

  // Minimal görünüm için bayrak
  const minimalMode = true;

  // Application meta fields
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().split('T')[0]);
  const [appliedPosition, setAppliedPosition] = useState('');

  // Standart form verileri
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    surname: '',
    gender: '',
    nationality: 'TC',
    birthPlace: '', // PDF'den eklendi
    birthDate: '', // PDF'den eklendi
    address: '',
    phoneHome: '',
    phoneMobile: '',
    email: '',
    militaryStatus: '',
    militaryDate: '',
    militaryExemption: '',
    maritalStatus: '',
    smoking: false,
    drivingLicense: {
      B: false,
      C: false,
      D: false,
      none: true
    } // PDF'deki detaylı sürücü belgesi seçenekleri
  });

  const [familyInfo, setFamilyInfo] = useState({
    spouse: { name: '', profession: '', age: '', educationLevel: '' }, // PDF'den eklendi
    children: [{ name: '', profession: '', age: '', educationLevel: '' }] // PDF'den eklendi
  });

  const [educationInfo, setEducationInfo] = useState([
    { schoolName: '', department: '', startDate: '', endDate: '', degreeReceived: '' }
  ]);

  const [computerSkills, setComputerSkills] = useState([
    { program: '', level: 'Az' }
  ]);

  const [workExperience, setWorkExperience] = useState([
    { 
      companyName: '', 
      position: '', 
      startDate: '', 
      endDate: '', 
      reasonForLeaving: '', 
      salaryReceived: '' 
    }
  ]);

  const [otherInfo, setOtherInfo] = useState({
    healthProblem: false,
    healthDetails: '',
    conviction: false,
    convictionDetails: '',
    contactMethod: '',
    phonePermission: false,
    // PDF'den eklendi - Size ulaşamadığımızda haber verilecek kişi
    emergencyContact: {
      name: '', // Ad-Soyadı
      relationship: '', // Yakınlığı
      phone: '' // Telefonu
    }
  });

  const [references, setReferences] = useState([
    { name: '', company: '', position: '', phone: '' }
  ]);

  // Form yapısını ve verilerini yükle
  useEffect(() => {
    loadFormStructure();
  }, []);
  
  // Form progress calculation
  const calculateProgress = useCallback(() => {
    if (formStructure?.sections) {
      const totalFields = formStructure.sections.reduce((total, section) => 
        total + (section.fields?.length || 0), 0
      );
      const filledFields = Object.values(formData).filter(value => 
        value && value.toString().trim() !== ''
      ).length;
      return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
    } else {
      const requiredFields = ['name', 'surname', 'email', 'phoneMobile', 'gender', 'address'];
      const filledRequired = requiredFields.filter(field => 
        personalInfo[field] && personalInfo[field].toString().trim() !== ''
      ).length;
      return Math.round((filledRequired / requiredFields.length) * 100);
    }
  }, [formData, formStructure, personalInfo]);
  
  // Update progress when form data changes
  useEffect(() => {
    setFormProgress(calculateProgress());
  }, [calculateProgress]);

  const loadFormStructure = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/form-structure`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setFormStructure(result.data);
        initializeFormData(result.data);
        setSnackbar({
          open: true,
          message: '✨ Form yapısı güncellendi!',
          severity: 'info'
        });
      } else {
        setFormStructure(null);
      }
    } catch (error) {
      setFormStructure(null);
      setSnackbar({
        open: true,
        message: 'ℹ️ Standart form kullanılıyor',
        severity: 'info'
      });
    }
    setLoading(false);
  };

  const initializeFormData = (structure) => {
    const initialData = {};
    structure.sections.forEach(section => {
      section.fields.forEach(field => {
        initialData[field.name] = field.defaultValue || '';
      });
    });
    setFormData(initialData);
  };

  // Dinamik liste ekleme fonksiyonları
  const addChild = () => {
    setFamilyInfo(prev => ({
      ...prev,
      children: [...prev.children, { name: '', profession: '', age: '', educationLevel: '' }]
    }));
  };

  const removeChild = (index) => {
    setFamilyInfo(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index)
    }));
  };

  const updateChild = (index, field, value) => {
    setFamilyInfo(prev => ({
      ...prev,
      children: prev.children.map((child, i) => 
        i === index ? { ...child, [field]: value } : child
      )
    }));
  };

  const addEducation = () => {
    setEducationInfo(prev => [...prev, { schoolName: '', department: '', startDate: '', endDate: '', degreeReceived: '' }]);
  };

  const removeEducation = (index) => {
    setEducationInfo(prev => prev.filter((_, i) => i !== index));
  };

  const updateEducation = (index, field, value) => {
    setEducationInfo(prev => prev.map((education, i) => 
      i === index ? { ...education, [field]: value } : education
    ));
  };

  const addComputerSkill = () => {
    setComputerSkills(prev => [...prev, { program: '', level: 'Az' }]);
  };

  const removeComputerSkill = (index) => {
    setComputerSkills(prev => prev.filter((_, i) => i !== index));
  };

  const updateComputerSkill = (index, field, value) => {
    setComputerSkills(prev => prev.map((skill, i) => 
      i === index ? { ...skill, [field]: value } : skill
    ));
  };

  const addWorkExperience = () => {
    setWorkExperience(prev => [...prev, { 
      companyName: '', 
      position: '', 
      startDate: '', 
      endDate: '', 
      reasonForLeaving: '', 
      salaryReceived: '' 
    }]);
  };

  const removeWorkExperience = (index) => {
    setWorkExperience(prev => prev.filter((_, i) => i !== index));
  };

  const updateWorkExperience = (index, field, value) => {
    setWorkExperience(prev => prev.map((work, i) => 
      i === index ? { ...work, [field]: value } : work
    ));
  };

  const addReference = () => {
    setReferences(prev => [...prev, { name: '', company: '', position: '', phone: '' }]);
  };

  const removeReference = (index) => {
    setReferences(prev => prev.filter((_, i) => i !== index));
  };

  const updateReference = (index, field, value) => {
    setReferences(prev => prev.map((reference, i) => 
      i === index ? { ...reference, [field]: value } : reference
    ));
  };

  // Form validasyon fonksiyonu
  const validateForm = () => {
    const errors = {};
    
    if (formStructure && formStructure.sections) {
      formStructure.sections.forEach(section => {
        if (!section.active) return;
        
        section.fields?.forEach(field => {
          const value = formData[field.name];
          
          if (field.required && (!value || value.toString().trim() === '')) {
            errors[field.name] = `${field.label} zorunludur`;
          }
          
          if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              errors[field.name] = 'Geçerli bir e-posta adresi giriniz';
            }
          }
          
          if (field.type === 'tel' && value && field.validation?.pattern) {
            const phoneRegex = new RegExp(field.validation.pattern);
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
              errors[field.name] = 'Geçerli bir telefon numarası giriniz';
            }
          }
          
          if (value && field.validation) {
            if (field.validation.minLength && value.length < field.validation.minLength) {
              errors[field.name] = `En az ${field.validation.minLength} karakter gereklidir`;
            }
            if (field.validation.maxLength && value.length > field.validation.maxLength) {
              errors[field.name] = `En fazla ${field.validation.maxLength} karakter olabilir`;
            }
          }
        });
      });
    } else {
      if (!personalInfo.name.trim()) errors.name = 'Ad alanı zorunludur';
      if (!personalInfo.surname.trim()) errors.surname = 'Soyad alanı zorunludur';
      if (!personalInfo.gender) errors.gender = 'Cinsiyet seçimi zorunludur';
      if (!personalInfo.phoneMobile.trim()) errors.phoneMobile = 'Cep telefonu zorunludur';
      if (!personalInfo.address.trim()) errors.address = 'Adres bilgisi zorunludur';
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!personalInfo.email.trim()) {
        errors.email = 'E-posta adresi zorunludur';
      } else if (!emailRegex.test(personalInfo.email)) {
        errors.email = 'Geçerli bir e-posta adresi giriniz';
      }
      
      const phoneRegex = /^[0-9]{10,11}$/;
      if (personalInfo.phoneMobile && !phoneRegex.test(personalInfo.phoneMobile.replace(/\s/g, ''))) {
        errors.phoneMobile = 'Geçerli bir telefon numarası giriniz (10-11 haneli)';
      }
      
      const validEducation = educationInfo.filter(edu => edu.schoolName.trim() && edu.department.trim());
      if (!minimalMode && validEducation.length === 0) {
        errors.education = 'En az bir eğitim bilgisi girilmelidir';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const resetForm = () => {
    setSubmitSuccess(false);
    setFormErrors({});
    setPersonalInfo({
      name: '',
      surname: '',
      gender: '',
      nationality: 'TC',
      birthPlace: '',
      birthDate: '',
      address: '',
      phoneHome: '',
      phoneMobile: '',
      email: '',
      militaryStatus: '',
      militaryDate: '',
      militaryExemption: '',
      maritalStatus: '',
      smoking: false,
      drivingLicense: {
        B: false,
        C: false,
        D: false,
        none: true
      }
    });
    setFamilyInfo({
      spouse: { name: '', profession: '', age: '', educationLevel: '' },
      children: [{ name: '', profession: '', age: '', educationLevel: '' }]
    });
    setEducationInfo([{ schoolName: '', department: '', startDate: '', endDate: '', degreeReceived: '' }]);
    setComputerSkills([{ program: '', level: 'Az' }]);
    setWorkExperience([{ companyName: '', position: '', startDate: '', endDate: '', reasonForLeaving: '', salaryReceived: '' }]);
    setOtherInfo({ 
      healthProblem: false, 
      healthDetails: '', 
      conviction: false, 
      convictionDetails: '', 
      contactMethod: '', 
      phonePermission: false,
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      }
    });
    setReferences([{ name: '', company: '', position: '', phone: '' }]);
    setAppliedPosition('');
    setApplicationDate(new Date().toISOString().split('T')[0]);
    setSubmittedId('');
  };

  // Form submit işlemi
  const handleSubmit = async () => {
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Lütfen zorunlu alanları eksiksiz doldurun!',
        severity: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    
    let applicationData;
    
    if (formStructure && formStructure.sections) {
      applicationData = {
        formData,
        formStructureId: formStructure._id,
        submittedAt: new Date().toISOString(),
        applicationDate,
        appliedPosition,
        submittedBy: 'PUBLIC',
        applicationId: `JOB-${Date.now()}`,
        source: 'public-dynamic',
        formType: 'dynamic'
      };
    } else {
      applicationData = {
        personalInfo,
        familyInfo,
        educationInfo: educationInfo.filter(edu => edu.schoolName.trim()),
        computerSkills: computerSkills.filter(skill => skill.program.trim()),
        workExperience: workExperience.filter(work => work.companyName.trim()),
        otherInfo,
        references: references.filter(ref => ref.name.trim()),
        submittedAt: new Date().toISOString(),
        applicationDate,
        appliedPosition,
        submittedBy: 'PUBLIC',
        applicationId: `JOB-${Date.now()}`,
        source: 'public-static',
        formType: 'static'
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/job-applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitSuccess(true);
        setSubmittedId(
          result?.savedApplication?.applicationId ||
          result?.application?.applicationId ||
          result?.applicationId ||
          applicationData?.applicationId
        );
        setSnackbar({
          open: true,
          message: 'Başvurunuz başarıyla gönderildi! 🎉',
          severity: 'success'
        });
      } else {
        throw new Error(result.message || 'Başvuru gönderilemedi');
      }
      
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Başvuru gönderilirken bir hata oluştu. Lütfen tekrar deneyin.',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // A. KİŞİSEL BİLGİLER Bölümü
  const renderPersonalInfo = () => (
    <Card 
      elevation={1} 
      sx={{ 
        mb: 3, 
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        p: 2
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', width: 40, height: 40 }}>
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              A. Kişisel Bilgiler
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
              Temel bilgilerinizi eksiksiz doldurun
            </Typography>
          </Box>
        </Stack>
      </Box>
      
      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Adınız"
              value={personalInfo.name}
              onChange={(e) => {
                setPersonalInfo(prev => ({ ...prev, name: e.target.value }));
                if (formErrors.name) {
                  setFormErrors(prev => ({ ...prev, name: '' }));
                }
              }}
              required
              error={!!formErrors.name}
              helperText={formErrors.name}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    }
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Soyadınız"
              value={personalInfo.surname}
              onChange={(e) => {
                setPersonalInfo(prev => ({ ...prev, surname: e.target.value }));
                if (formErrors.surname) {
                  setFormErrors(prev => ({ ...prev, surname: '' }));
                }
              }}
              required
              error={!!formErrors.surname}
              helperText={formErrors.surname}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    }
                  }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="E-posta Adresiniz"
              type="email"
              value={personalInfo.email}
              onChange={(e) => {
                setPersonalInfo(prev => ({ ...prev, email: e.target.value }));
                if (formErrors.email) {
                  setFormErrors(prev => ({ ...prev, email: '' }));
                }
              }}
              required
              error={!!formErrors.email}
              helperText={formErrors.email}
              placeholder="ornek@email.com"
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    }
                  }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Cep Telefonu"
              value={personalInfo.phoneMobile}
              onChange={(e) => {
                setPersonalInfo(prev => ({ ...prev, phoneMobile: e.target.value }));
                if (formErrors.phoneMobile) {
                  setFormErrors(prev => ({ ...prev, phoneMobile: '' }));
                }
              }}
              required
              error={!!formErrors.phoneMobile}
              helperText={formErrors.phoneMobile}
              placeholder="0532 123 45 67"
              InputProps={{
                startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    }
                  }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl component="fieldset" error={!!formErrors.gender}>
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                Cinsiyet
              </FormLabel>
              <RadioGroup
                row
                value={personalInfo.gender}
                onChange={(e) => {
                  setPersonalInfo(prev => ({ ...prev, gender: e.target.value }));
                  if (formErrors.gender) {
                    setFormErrors(prev => ({ ...prev, gender: '' }));
                  }
                }}
              >
                <FormControlLabel 
                  value="Bayan" 
                  control={<Radio />} 
                  label="Bayan"
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.95rem'
                    }
                  }}
                />
                <FormControlLabel 
                  value="Erkek" 
                  control={<Radio />} 
                  label="Erkek"
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.95rem'
                    }
                  }}
                />
              </RadioGroup>
              {formErrors.gender && <FormHelperText>{formErrors.gender}</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Uyruk"
              value={personalInfo.nationality}
              onChange={(e) => setPersonalInfo(prev => ({ ...prev, nationality: e.target.value }))}
              placeholder="TC, Diğer..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    }
                  }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Doğum Yeri"
              value={personalInfo.birthPlace}
              onChange={(e) => setPersonalInfo(prev => ({ ...prev, birthPlace: e.target.value }))}
              placeholder="Doğum yerinizi giriniz"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    }
                  }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Doğum Tarihi"
              type="date"
              value={personalInfo.birthDate}
              onChange={(e) => setPersonalInfo(prev => ({ ...prev, birthDate: e.target.value }))}
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    }
                  }
                }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="İkametgâh Adresiniz"
              value={personalInfo.address}
              onChange={(e) => {
                setPersonalInfo(prev => ({ ...prev, address: e.target.value }));
                if (formErrors.address) {
                  setFormErrors(prev => ({ ...prev, address: '' }));
                }
              }}
              required
              error={!!formErrors.address}
              helperText={formErrors.address}
              placeholder="Tam adresinizi yazınız..."
              InputProps={{
                startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />
              }}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    }
                  }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Ev Telefonu"
              value={personalInfo.phoneHome}
              onChange={(e) => setPersonalInfo(prev => ({ ...prev, phoneHome: e.target.value }))}
              placeholder="0212 123 45 67"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    }
                  }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Medeni Durum</InputLabel>
              <Select
                value={personalInfo.maritalStatus}
                label="Medeni Durum"
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, maritalStatus: e.target.value }))}
                sx={{
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    }
                  }
                }}
              >
                <MenuItem value="Bekar">Bekar</MenuItem>
                <MenuItem value="Evli">Evli</MenuItem>
                <MenuItem value="Boşanmış">Boşanmış</MenuItem>
                <MenuItem value="Dul">Dul</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Askerlik Durumu</InputLabel>
              <Select
                value={personalInfo.militaryStatus}
                label="Askerlik Durumu"
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, militaryStatus: e.target.value }))}
                sx={{
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    }
                  }
                }}
              >
                <MenuItem value="Yapıldı">Yapıldı</MenuItem>
                <MenuItem value="Muaf">Muaf</MenuItem>
                <MenuItem value="Tecilli">Tecilli</MenuItem>
                <MenuItem value="Yapılmadı">Yapılmadı</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {personalInfo.militaryStatus === 'Yapıldı' && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Terhis Tarihi"
                type="date"
                value={personalInfo.militaryDate}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, militaryDate: e.target.value }))}
                InputLabelProps={{
                  shrink: true,
                }}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      }
                    }
                  }
                }}
              />
            </Grid>
          )}

          {personalInfo.militaryStatus === 'Muaf' && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Muafiyet Sebebi"
                value={personalInfo.militaryExemption}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, militaryExemption: e.target.value }))}
                placeholder="Muafiyet sebebinizi belirtiniz"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      }
                    }
                  }
                }}
              />
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={personalInfo.smoking}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, smoking: e.target.checked }))}
                />
              }
              label="Sigara kullanıyor musunuz?"
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontSize: '0.95rem'
                }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Sürücü Belgeniz var mı?
              </Typography>
              <Stack direction="row" spacing={3} flexWrap="wrap">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={personalInfo.drivingLicense.B}
                      onChange={(e) => setPersonalInfo(prev => ({
                        ...prev,
                        drivingLicense: {
                          ...prev.drivingLicense,
                          B: e.target.checked,
                          none: e.target.checked ? false : prev.drivingLicense.none
                        }
                      }))}
                    />
                  }
                  label="B"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={personalInfo.drivingLicense.C}
                      onChange={(e) => setPersonalInfo(prev => ({
                        ...prev,
                        drivingLicense: {
                          ...prev.drivingLicense,
                          C: e.target.checked,
                          none: e.target.checked ? false : prev.drivingLicense.none
                        }
                      }))}
                    />
                  }
                  label="C"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={personalInfo.drivingLicense.D}
                      onChange={(e) => setPersonalInfo(prev => ({
                        ...prev,
                        drivingLicense: {
                          ...prev.drivingLicense,
                          D: e.target.checked,
                          none: e.target.checked ? false : prev.drivingLicense.none
                        }
                      }))}
                    />
                  }
                  label="D"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={personalInfo.drivingLicense.none}
                      onChange={(e) => setPersonalInfo(prev => ({
                        ...prev,
                        drivingLicense: {
                          B: false,
                          C: false,
                          D: false,
                          none: e.target.checked
                        }
                      }))}
                    />
                  }
                  label="Yok"
                />
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // Family Info Section
  const renderFamilyInfo = () => (
    <Card elevation={1} sx={{ 
      mb: 3, 
      borderRadius: 2,
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        p: 2
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', width: 40, height: 40 }}>
            <FamilyRestroomIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              B. Aile Bilgileri
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
              Aile durumunuz ile ilgili bilgileri giriniz
            </Typography>
          </Box>
        </Stack>
      </Box>
      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={2.5}>
          {/* Eş Bilgileri */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Eş Bilgileri
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Eş Adı Soyadı"
              value={familyInfo.spouse.name}
              onChange={(e) => setFamilyInfo(prev => ({
                ...prev,
                spouse: { ...prev.spouse, name: e.target.value }
              }))}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    }
                  }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Eş Yaşı"
              type="number"
              value={familyInfo.spouse.age}
              onChange={(e) => setFamilyInfo(prev => ({
                ...prev,
                spouse: { ...prev.spouse, age: e.target.value }
              }))}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    }
                  }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Eş Mesleği"
              value={familyInfo.spouse.profession}
              onChange={(e) => setFamilyInfo(prev => ({
                ...prev,
                spouse: { ...prev.spouse, profession: e.target.value }
              }))}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    }
                  }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Eş Eğitim Durumu</InputLabel>
              <Select
                value={familyInfo.spouse.educationLevel}
                label="Eş Eğitim Durumu"
                onChange={(e) => setFamilyInfo(prev => ({
                  ...prev,
                  spouse: { ...prev.spouse, educationLevel: e.target.value }
                }))}
                sx={{
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    }
                  }
                }}
              >
                <MenuItem value="İlkokul">İlkokul</MenuItem>
                <MenuItem value="Ortaokul">Ortaokul</MenuItem>
                <MenuItem value="Lise">Lise</MenuItem>
                <MenuItem value="Ön Lisans">Ön Lisans</MenuItem>
                <MenuItem value="Lisans">Lisans</MenuItem>
                <MenuItem value="Yüksek Lisans">Yüksek Lisans</MenuItem>
                <MenuItem value="Doktora">Doktora</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Eş Eğitim Seviyesi"
              value={familyInfo.spouse.educationLevel}
              onChange={(e) => setFamilyInfo(prev => ({
                ...prev,
                spouse: { ...prev.spouse, educationLevel: e.target.value }
              }))}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    }
                  }
                }
              }}
            />
          </Grid>

          {/* Çocuk Bilgileri */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Çocuk Bilgileri
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={addChild}
                startIcon={<AddIcon />}
                sx={{ borderRadius: 2 }}
              >
                Çocuk Ekle
              </Button>
            </Box>
          </Grid>

          {familyInfo.children.map((child, index) => (
            <Grid item xs={12} key={index}>
              <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Çocuk {index + 1}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => removeChild(index)}
                    sx={{ color: 'error.main' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Adı Soyadı"
                      value={child.name}
                      onChange={(e) => updateChild(index, 'name', e.target.value)}
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      label="Yaş"
                      type="number"
                      value={child.age}
                      onChange={(e) => updateChild(index, 'age', e.target.value)}
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Meslek/Okul"
                      value={child.profession}
                      onChange={(e) => updateChild(index, 'profession', e.target.value)}
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Eğitim Seviyesi"
                      value={child.educationLevel}
                      onChange={(e) => updateChild(index, 'educationLevel', e.target.value)}
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  // Education Info Section
  const renderEducationInfo = () => (
    <Card elevation={1} sx={{ 
      mb: 3, 
      borderRadius: 2,
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        p: 2
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', width: 40, height: 40 }}>
            <SchoolIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              C. Eğitim Bilgileri
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
              Eğitim geçmişinizi kronolojik sırayla giriniz
            </Typography>
          </Box>
        </Stack>
      </Box>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            En son mezun olduğunuz okuldan başlayarak doldurunuz
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={addEducation}
            startIcon={<AddIcon />}
            sx={{ borderRadius: 2 }}
          >
            Eğitim Ekle
          </Button>
        </Box>

        {educationInfo.map((education, index) => (
          <Paper key={index} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Eğitim {index + 1}
              </Typography>
              {educationInfo.length > 1 && (
                <IconButton
                  size="small"
                  onClick={() => removeEducation(index)}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Okul Adı"
                  value={education.schoolName}
                  onChange={(e) => updateEducation(index, 'schoolName', e.target.value)}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Bölüm/Alan"
                  value={education.department}
                  onChange={(e) => updateEducation(index, 'department', e.target.value)}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Başlangıç Tarihi"
                  type="date"
                  value={education.startDate}
                  onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Bitiş Tarihi"
                  type="date"
                  value={education.endDate}
                  onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Mezuniyet Durumu</InputLabel>
                  <Select
                    value={education.degreeReceived}
                    label="Mezuniyet Durumu"
                    onChange={(e) => updateEducation(index, 'degreeReceived', e.target.value)}
                    sx={{
                      borderRadius: 2
                    }}
                  >
                    <MenuItem value="Mezun">Mezun</MenuItem>
                    <MenuItem value="Devam Ediyor">Devam Ediyor</MenuItem>
                    <MenuItem value="Yarım Bıraktı">Yarım Bıraktı</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </CardContent>
    </Card>
  );

  // Computer Skills Section
  const renderComputerSkills = () => (
    <Card elevation={1} sx={{ 
      mb: 3, 
      borderRadius: 2,
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        p: 2
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', width: 40, height: 40 }}>
            <ComputerIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              D. Bilgisayar Bilgisi
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
              Bildiğiniz bilgisayar programlarını ve seviyenizi belirtiniz
            </Typography>
          </Box>
        </Stack>
      </Box>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Kullandığınız programları ve yetkinlik seviyenizi belirtiniz
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={addComputerSkill}
            startIcon={<AddIcon />}
            sx={{ borderRadius: 2 }}
          >
            Program Ekle
          </Button>
        </Box>

        {computerSkills.map((skill, index) => (
          <Paper key={index} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Program {index + 1}
              </Typography>
              {computerSkills.length > 1 && (
                <IconButton
                  size="small"
                  onClick={() => removeComputerSkill(index)}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Program Adı"
                  value={skill.program}
                  onChange={(e) => updateComputerSkill(index, 'program', e.target.value)}
                  placeholder="Örn: Microsoft Office, AutoCAD, Photoshop"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Seviye</InputLabel>
                  <Select
                    value={skill.level}
                    label="Seviye"
                    onChange={(e) => updateComputerSkill(index, 'level', e.target.value)}
                    sx={{
                      borderRadius: 2
                    }}
                  >
                    <MenuItem value="Az">Az</MenuItem>
                    <MenuItem value="Orta">Orta</MenuItem>
                    <MenuItem value="İyi">İyi</MenuItem>
                    <MenuItem value="Çok İyi">Çok İyi</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </CardContent>
    </Card>
  );

  // Work Experience Section
  const renderWorkExperience = () => (
    <Card elevation={1} sx={{ 
      mb: 3, 
      borderRadius: 2,
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        p: 2
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', width: 40, height: 40 }}>
            <WorkIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              E. İş Tecrübesi
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
              İş geçmişinizi en son çalıştığınız yerden başlayarak doldurunuz
            </Typography>
          </Box>
        </Stack>
      </Box>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Çalıştığınız işyerlerini kronolojik sırayla giriniz
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={addWorkExperience}
            startIcon={<AddIcon />}
            sx={{ borderRadius: 2 }}
          >
            İş Tecrübesi Ekle
          </Button>
        </Box>

        {workExperience.map((work, index) => (
          <Paper key={index} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                İş Tecrübesi {index + 1}
              </Typography>
              {workExperience.length > 1 && (
                <IconButton
                  size="small"
                  onClick={() => removeWorkExperience(index)}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Firma/Kurum Adı"
                  value={work.companyName}
                  onChange={(e) => updateWorkExperience(index, 'companyName', e.target.value)}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Görev/Pozisyon"
                  value={work.position}
                  onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Başlangıç Tarihi"
                  type="date"
                  value={work.startDate}
                  onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Bitiş Tarihi"
                  type="date"
                  value={work.endDate}
                  onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Aldığı Ücret"
                  value={work.salaryReceived}
                  onChange={(e) => updateWorkExperience(index, 'salaryReceived', e.target.value)}
                  placeholder="Örn: 5000 TL"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Ayrılma Sebebi"
                  value={work.reasonForLeaving}
                  onChange={(e) => updateWorkExperience(index, 'reasonForLeaving', e.target.value)}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        ))}
      </CardContent>
    </Card>
  );

  // Other Info Section
  const renderOtherInfo = () => (
    <Card elevation={1} sx={{ 
      mb: 3, 
      borderRadius: 2,
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        p: 2
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', width: 40, height: 40 }}>
            <DescriptionIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              F. Diğer Bilgiler
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
              Ek bilgiler ve acil durum iletişim bilgileri
            </Typography>
          </Box>
        </Stack>
      </Box>
      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={2.5}>
          {/* Sağlık Durumu */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Sağlık Durumu
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={otherInfo.healthProblem}
                  onChange={(e) => setOtherInfo(prev => ({ ...prev, healthProblem: e.target.checked }))}
                />
              }
              label="Herhangi bir sağlık probleminiz var mı?"
            />
          </Grid>

          {otherInfo.healthProblem && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Sağlık Problemi Detayları"
                multiline
                rows={3}
                value={otherInfo.healthDetails}
                onChange={(e) => setOtherInfo(prev => ({ ...prev, healthDetails: e.target.value }))}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>
          )}

          {/* Adli Sicil */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Adli Sicil
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={otherInfo.conviction}
                  onChange={(e) => setOtherInfo(prev => ({ ...prev, conviction: e.target.checked }))}
                />
              }
              label="Herhangi bir suçtan hüküm giydiniz mi?"
            />
          </Grid>

          {otherInfo.conviction && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hüküm Detayları"
                multiline
                rows={3}
                value={otherInfo.convictionDetails}
                onChange={(e) => setOtherInfo(prev => ({ ...prev, convictionDetails: e.target.value }))}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>
          )}

          {/* İletişim Tercihi */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              İletişim Tercihi
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Sizinle nasıl iletişime geçelim?</InputLabel>
              <Select
                value={otherInfo.contactMethod}
                label="Sizinle nasıl iletişime geçelim?"
                onChange={(e) => setOtherInfo(prev => ({ ...prev, contactMethod: e.target.value }))}
                sx={{
                  borderRadius: 2
                }}
              >
                <MenuItem value="phone">Telefon</MenuItem>
                <MenuItem value="email">E-posta</MenuItem>
                <MenuItem value="both">Her ikisi</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={otherInfo.phonePermission}
                  onChange={(e) => setOtherInfo(prev => ({ ...prev, phonePermission: e.target.checked }))}
                />
              }
              label="Telefon görüşmesi yapılabilir"
            />
          </Grid>

          {/* Acil Durum İletişim */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Size Ulaşamadığımızda Haber Verilecek Kişi
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Ad-Soyadı"
              value={otherInfo.emergencyContact.name}
              onChange={(e) => setOtherInfo(prev => ({
                ...prev,
                emergencyContact: { ...prev.emergencyContact, name: e.target.value }
              }))}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Yakınlığı"
              value={otherInfo.emergencyContact.relationship}
              onChange={(e) => setOtherInfo(prev => ({
                ...prev,
                emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
              }))}
              placeholder="Örn: Eş, Kardeş, Anne"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Telefonu"
              value={otherInfo.emergencyContact.phone}
              onChange={(e) => setOtherInfo(prev => ({
                ...prev,
                emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
              }))}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // References Section
  const renderReferences = () => (
    <Card elevation={1} sx={{ 
      mb: 3, 
      borderRadius: 2,
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        p: 2
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', width: 40, height: 40 }}>
              <ContactsIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                G. Referanslar
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
                Referans vereceğiniz kişilerin bilgileri
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addReference}
            sx={{
              bgcolor: 'rgba(255,255,255,0.15)',
              color: 'white',
              borderRadius: 1.5,
              fontSize: '0.85rem',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.25)'
              }
            }}
          >
            Referans Ekle
          </Button>
        </Stack>
      </Box>
      <CardContent sx={{ p: 3 }}>
        {references.map((reference, index) => (
          <Card key={index} variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  Referans {index + 1}
                </Typography>
                <IconButton
                  onClick={() => removeReference(index)}
                  color="error"
                  size="small"
                  sx={{
                    '&:hover': {
                      backgroundColor: 'error.light',
                      color: 'white'
                    }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Ad Soyadı"
                    value={reference.name}
                    onChange={(e) => updateReference(index, 'name', e.target.value)}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Çalıştığı Kurum"
                    value={reference.company}
                    onChange={(e) => updateReference(index, 'company', e.target.value)}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Görevi"
                    value={reference.position}
                    onChange={(e) => updateReference(index, 'position', e.target.value)}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Telefon Numarası"
                    value={reference.phone}
                    onChange={(e) => updateReference(index, 'phone', e.target.value)}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}

        {references.length === 0 && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 4,
            color: 'text.secondary'
          }}>
            <Typography variant="body1">
              Henüz referans eklenmemiş. "Referans Ekle" butonuna tıklayarak referans ekleyebilirsiniz.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  // Loading state
  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Paper elevation={24} sx={{ 
          p: 6, 
          textAlign: 'center', 
          borderRadius: 4,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)'
        }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" color="primary.main" sx={{ mb: 1, fontWeight: 600 }}>
            Form yükleniyor...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lütfen bekleyiniz
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Success state
  if (submitSuccess) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}>
        <Container maxWidth="sm">
          <Fade in={submitSuccess} timeout={800}>
            <Paper elevation={24} sx={{ 
              p: 6, 
              borderRadius: 4, 
              textAlign: 'center',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)'
            }}>
              <Avatar sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: 'success.main', 
                mx: 'auto', 
                mb: 3 
              }}>
                <CheckCircleIcon sx={{ fontSize: 40 }} />
              </Avatar>
              
              <Typography variant="h4" gutterBottom sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2
              }}>
                Başvuru Tamamlandı!
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                Başvurunuz başarıyla alındı. İnsan Kaynakları departmanımız en kısa sürede sizinle iletişime geçecektir.
              </Typography>
              
              <Box sx={{ 
                bgcolor: 'grey.50', 
                p: 3, 
                borderRadius: 2, 
                mb: 4,
                border: '1px solid',
                borderColor: 'grey.200'
              }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Başvuru Numaranız:
                </Typography>
                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                  {submittedId}
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                size="large"
                onClick={resetForm}
                sx={{
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                  }
                }}
              >
                Yeni Başvuru Yap
              </Button>
            </Paper>
          </Fade>
        </Container>
      </Box>
    );
  }

  // Main form
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      py: { xs: 2, sm: 3 }
    }}>
      <Container maxWidth="md">
        {/* Professional Header */}
        <Paper elevation={2} sx={{ 
          mb: 3, 
          borderRadius: 2,
          overflow: 'hidden',
          background: 'white'
        }}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            p: { xs: 2, sm: 3 }
          }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={2}>
              <Avatar sx={{ 
                width: { xs: 48, sm: 56 }, 
                height: { xs: 48, sm: 56 },
                bgcolor: 'rgba(255,255,255,0.15)',
                fontSize: { xs: '1.1rem', sm: '1.3rem' },
                fontWeight: 600
              }}>
                CANGA
              </Avatar>
              
              <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, flex: 1 }}>
                <Typography variant={isMobile ? "h6" : "h5"} sx={{ 
                  fontWeight: 600,
                  mb: 0.5,
                  color: 'white'
                }}>
                  İş Başvuru Formu
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Kariyerinizin bir sonraki adımını birlikte atalım
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={formProgress}
                    size={isMobile ? 48 : 56}
                    thickness={4}
                    sx={{
                      color: 'rgba(255,255,255,0.9)',
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      },
                    }}
                  />
                  <Box sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Typography variant="caption" component="div" sx={{ 
                      color: 'white', 
                      fontWeight: 600 
                    }}>
                      {formProgress}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Stack>
          </Box>
          
          <Box sx={{ p: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={formProgress} 
              sx={{ 
                height: 6, 
                borderRadius: 3,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  background: 'linear-gradient(90deg, #1976d2, #1565c0)'
                }
              }} 
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
              Formu eksiksiz doldurarak başvurunuzun değerlendirilme şansını artırın
            </Typography>
          </Box>
        </Paper>

        {/* Application Meta Info */}
        <Paper elevation={1} sx={{ 
          p: 2.5, 
          mb: 3, 
          borderRadius: 2,
          background: 'white'
        }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Başvuru Tarihi"
                  type="date"
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        }
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Başvurulan Pozisyon"
                  value={appliedPosition}
                  onChange={(e) => setAppliedPosition(e.target.value)}
                  placeholder="Örn. Üretim Operatörü"
                  InputProps={{
                    startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        }
                      }
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Paper>

        {/* Form Content */}
        <Box>
            {renderPersonalInfo()}
            {renderFamilyInfo()}
            {renderEducationInfo()}
            {renderComputerSkills()}
            {renderWorkExperience()}
          {renderOtherInfo()}
          {renderReferences()}
            
            {/* Submit Button */}
            <Paper elevation={1} sx={{ 
              p: 3, 
              textAlign: 'center',
              background: 'white',
              borderRadius: 2
            }}>
              <Typography variant="h6" gutterBottom color="primary.main" sx={{ fontWeight: 600, mb: 3 }}>
                🎯 Başvurunuzu Tamamlayın
              </Typography>
              
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                sx={{
                  minWidth: { xs: '100%', sm: 280 },
                  py: 2,
                  px: 4,
                  borderRadius: 3,
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)'
                  },
                  '&:disabled': {
                    background: 'grey.300'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {isSubmitting ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
              </Button>
              
              <Typography variant="body2" color="text.secondary" sx={{ 
                mt: 3,
                fontSize: '0.875rem'
              }}>
                Form No: F-32 | Rev. No: 00 | Tarih: {new Date().toLocaleDateString('tr-TR')}
              </Typography>
              
              {Object.keys(formErrors).length > 0 && (
                <Alert severity="warning" sx={{ 
                  mt: 3, 
                  maxWidth: 600, 
                  mx: 'auto',
                  borderRadius: 2
                }}>
                  <Typography variant="body2">
                    ⚠️ Lütfen zorunlu alanları eksiksiz doldurun!
                  </Typography>
                </Alert>
              )}
            </Paper>
          </Box>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%', borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default PublicJobApplication;
