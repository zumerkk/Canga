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
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Computer as ComputerIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  ContactPhone as ContactPhoneIcon,
  Public as PublicIcon,
} from '@mui/icons-material';
import { API_BASE_URL } from '../config/api';

// 🌐 ANONIM İŞ BAŞVURU SAYFASI - ŞİFRE GEREKTİRMEZ
function PublicJobApplication() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // Core states
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [formStructure, setFormStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  
  // Progress tracking
  const [formProgress, setFormProgress] = useState(0);

  // Standart form verileri (fallback için)
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    surname: '',
    gender: '',
    nationality: 'TC',
    address: '',
    phoneHome: '',
    phoneMobile: '',
    email: '',
    militaryStatus: '',
    militaryDate: '',
    militaryExemption: '',
    maritalStatus: '',
    drivingLicense: ''
  });

  const [familyInfo, setFamilyInfo] = useState({
    spouse: { name: '', profession: '', age: '' },
    children: [{ name: '', profession: '', age: '' }]
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
    phonePermission: false
  });

  const [references, setReferences] = useState([
    { name: '', company: '', position: '', phone: '' }
  ]);

  // Form yapısını ve verilerini yükle
  useEffect(() => {
    loadFormStructure();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
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
      // Static form progress calculation
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
      // API'den form yapısını çek
      const response = await fetch(`${API_BASE_URL}/api/form-structure`);
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('📦 Dynamic form structure loaded:', result.data);
        setFormStructure(result.data);
        // Dynamic form için data initialize et
        initializeFormData(result.data);
        setSnackbar({
          open: true,
          message: '🔄 Form yapısı güncellendi! (Admin tarafından düzenlendi)',
          severity: 'info'
        });
      } else {
        console.warn('⚠️ No dynamic form found, using static form');
        // Static form kullan (mevcut implementasyon)
        setFormStructure(null);
      }
    } catch (error) {
      console.error('Form structure load error:', error);
      // Static form kullan (mevcut implementasyon)
      setFormStructure(null);
      setSnackbar({
        open: true,
        message: 'ℹ️ Statik form kullanılıyor - İK henüz özelleştirmemiş',
        severity: 'info'
      });
    }
    setLoading(false);
  };

  // Form verilerini başlat
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
      children: [...prev.children, { name: '', profession: '', age: '' }]
    }));
  };

  const removeChild = (index) => {
    setFamilyInfo(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    setEducationInfo(prev => [...prev, { schoolName: '', department: '', startDate: '', endDate: '', degreeReceived: '' }]);
  };

  const removeEducation = (index) => {
    setEducationInfo(prev => prev.filter((_, i) => i !== index));
  };

  const addComputerSkill = () => {
    setComputerSkills(prev => [...prev, { program: '', level: 'Az' }]);
  };

  const removeComputerSkill = (index) => {
    setComputerSkills(prev => prev.filter((_, i) => i !== index));
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

  const addReference = () => {
    setReferences(prev => [...prev, { name: '', company: '', position: '', phone: '' }]);
  };

  const removeReference = (index) => {
    setReferences(prev => prev.filter((_, i) => i !== index));
  };

  // Form validasyon fonksiyonu
  const validateForm = () => {
    const errors = {};
    
    if (formStructure && formStructure.sections) {
      // 🔄 DYNAMIC FORM VALIDATION
      console.log('🔍 Validating dynamic form...');
      
      formStructure.sections.forEach(section => {
        if (!section.active) return;
        
        section.fields?.forEach(field => {
          const value = formData[field.name];
          
          // Required field kontrolü
          if (field.required && (!value || value.toString().trim() === '')) {
            errors[field.name] = `${field.label} zorunludur`;
          }
          
          // Email validasyonu
          if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              errors[field.name] = 'Geçerli bir e-posta adresi giriniz';
            }
          }
          
          // Telefon validasyonu
          if (field.type === 'tel' && value && field.validation?.pattern) {
            const phoneRegex = new RegExp(field.validation.pattern);
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
              errors[field.name] = 'Geçerli bir telefon numarası giriniz';
            }
          }
          
          // Length validasyonu
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
      
      console.log('🔍 Dynamic validation result:', errors);
    } else {
      // 📋 STATIC FORM VALIDATION
      console.log('🔍 Validating static form...');
      
      // A. Kişisel Bilgiler - Zorunlu alanlar
      if (!personalInfo.name.trim()) errors.name = 'Ad alanı zorunludur';
      if (!personalInfo.surname.trim()) errors.surname = 'Soyad alanı zorunludur';
      if (!personalInfo.gender) errors.gender = 'Cinsiyet seçimi zorunludur';
      if (!personalInfo.phoneMobile.trim()) errors.phoneMobile = 'Cep telefonu zorunludur';
      if (!personalInfo.address.trim()) errors.address = 'Adres bilgisi zorunludur';
      
      // Email validasyonu (zorunlu)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!personalInfo.email.trim()) {
        errors.email = 'E-posta adresi zorunludur';
      } else if (!emailRegex.test(personalInfo.email)) {
        errors.email = 'Geçerli bir e-posta adresi giriniz';
      }
      
      // Telefon numarası validasyonu
      const phoneRegex = /^[0-9]{10,11}$/;
      if (personalInfo.phoneMobile && !phoneRegex.test(personalInfo.phoneMobile.replace(/\s/g, ''))) {
        errors.phoneMobile = 'Geçerli bir telefon numarası giriniz (10-11 haneli)';
      }
      
      // Eğitim bilgileri - en az bir tane olmalı ve dolu olmalı
      const validEducation = educationInfo.filter(edu => edu.schoolName.trim() && edu.department.trim());
      if (validEducation.length === 0) {
        errors.education = 'En az bir eğitim bilgisi girilmelidir';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Snackbar kapatma
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Form submit işlemi
  const handleSubmit = async () => {
    // Önce form validasyonunu çalıştır
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Lütfen zorunlu alanları eksiksiz doldurun!',
        severity: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    
    // Gönderilecek data hazırla
    let applicationData;
    
    if (formStructure && formStructure.sections) {
      // 🔄 DYNAMIC FORM DATA - Admin tarafından düzenlenen form
      applicationData = {
        formData, // Dynamic form verisi
        formStructureId: formStructure._id, // Hangi form yapısı kullanıldı
        submittedAt: new Date().toISOString(),
        submittedBy: 'PUBLIC',
        applicationId: `JOB-${Date.now()}`,
        source: 'public-dynamic',
        formType: 'dynamic'
      };
    } else {
      // 📋 STATIC FORM DATA - Varsayılan form
      applicationData = {
        personalInfo,
        familyInfo,
        educationInfo: educationInfo.filter(edu => edu.schoolName.trim()),
        computerSkills: computerSkills.filter(skill => skill.program.trim()),
        workExperience: workExperience.filter(work => work.companyName.trim()),
        otherInfo,
        references: references.filter(ref => ref.name.trim()),
        submittedAt: new Date().toISOString(),
        submittedBy: 'PUBLIC',
        applicationId: `JOB-${Date.now()}`,
        source: 'public-static',
        formType: 'static'
      };
    }

    try {
      // API endpoint'ine gönderim
      const response = await fetch(`${API_BASE_URL}/api/job-applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ Public İş Başvuru Verisi:', applicationData);
        setSubmitSuccess(true);
        setSnackbar({
          open: true,
          message: 'Başvurunuz başarıyla gönderildi! 🎉',
          severity: 'success'
        });

        // Form temizle - 5 saniye sonra
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      } else {
        throw new Error(result.message || 'Başvuru gönderilemedi');
      }
      
    } catch (error) {
      console.error('❌ Public başvuru gönderilirken hata:', error);
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
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
          A. KİŞİSEL BİLGİLER
        </Typography>
        
        <Grid container spacing={3}>
          {/* Temel bilgiler */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Adınız *"
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
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Soyadınız *"
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
            />
          </Grid>

          {/* E-posta adresi - Public sayfada zorunlu */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="E-posta Adresiniz *"
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
            />
          </Grid>

          {/* Cinsiyet */}
          <Grid item xs={12} sm={6}>
            <FormControl component="fieldset" error={!!formErrors.gender}>
              <FormLabel component="legend">Cinsiyetiniz *</FormLabel>
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
                <FormControlLabel value="Bayan" control={<Radio />} label="Bayan" />
                <FormControlLabel value="Erkek" control={<Radio />} label="Erkek" />
              </RadioGroup>
              {formErrors.gender && <FormHelperText>{formErrors.gender}</FormHelperText>}
            </FormControl>
          </Grid>

          {/* Uyruk */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Uyruğunuz"
              value={personalInfo.nationality}
              onChange={(e) => setPersonalInfo(prev => ({ ...prev, nationality: e.target.value }))}
              placeholder="TC, Diğer..."
            />
          </Grid>

          {/* Adres */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="İkametgâh Adresiniz *"
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
            />
          </Grid>

          {/* Telefon numaraları */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Telefon Numaranız (Ev)"
              value={personalInfo.phoneHome}
              onChange={(e) => setPersonalInfo(prev => ({ ...prev, phoneHome: e.target.value }))}
              placeholder="0212 123 45 67"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Telefon Numaranız (Cep) *"
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
            />
          </Grid>

          {/* Askerlik durumu */}
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Askerlik Durumunuz</FormLabel>
              <RadioGroup
                row
                value={personalInfo.militaryStatus}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, militaryStatus: e.target.value }))}
              >
                <FormControlLabel value="Tecilli" control={<Radio />} label="Tecilli" />
                <FormControlLabel value="Muaf" control={<Radio />} label="Muaf" />
                <FormControlLabel value="Yapıldı" control={<Radio />} label="Yapıldı" />
                <FormControlLabel value="Muafiyet" control={<Radio />} label="Muafiyet" />
              </RadioGroup>
            </FormControl>
          </Grid>

          {/* Askerlik tarihleri */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Terhis Tarihi"
              type="date"
              value={personalInfo.militaryDate}
              onChange={(e) => setPersonalInfo(prev => ({ ...prev, militaryDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Sürücü belgesi */}
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Sürücü belgeiniz var mı?</FormLabel>
              <RadioGroup
                row
                value={personalInfo.drivingLicense}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, drivingLicense: e.target.value }))}
              >
                <FormControlLabel value="B" control={<Radio />} label="B" />
                <FormControlLabel value="C" control={<Radio />} label="C" />
                <FormControlLabel value="D" control={<Radio />} label="D" />
                <FormControlLabel value="E" control={<Radio />} label="E" />
                <FormControlLabel value="F" control={<Radio />} label="F" />
                <FormControlLabel value="Yok" control={<Radio />} label="Yok" />
              </RadioGroup>
            </FormControl>
          </Grid>

          {/* Medeni durum */}
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Medeni Durumunuz</FormLabel>
              <RadioGroup
                row
                value={personalInfo.maritalStatus}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, maritalStatus: e.target.value }))}
              >
                <FormControlLabel value="Evli" control={<Radio />} label="Evli" />
                <FormControlLabel value="Bekar" control={<Radio />} label="Bekar" />
              </RadioGroup>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // B. AİLE BİLGİLERİ Bölümü
  const renderFamilyInfo = () => (
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
          B. AİLE BİLGİLERİ
        </Typography>

        {/* Eş Bilgileri */}
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 2, fontWeight: 'bold' }}>
          Eş Bilgileri
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Ad Soyad"
              value={familyInfo.spouse.name}
              onChange={(e) => setFamilyInfo(prev => ({
                ...prev,
                spouse: { ...prev.spouse, name: e.target.value }
              }))}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Mesleği"
              value={familyInfo.spouse.profession}
              onChange={(e) => setFamilyInfo(prev => ({
                ...prev,
                spouse: { ...prev.spouse, profession: e.target.value }
              }))}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Yaşı"
              type="number"
              value={familyInfo.spouse.age}
              onChange={(e) => setFamilyInfo(prev => ({
                ...prev,
                spouse: { ...prev.spouse, age: e.target.value }
              }))}
            />
          </Grid>
        </Grid>

        {/* Çocuk Bilgileri */}
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Çocuk Bilgileri
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={addChild}
              variant="outlined"
              size="small"
            >
              Çocuk Ekle
            </Button>
          </Box>

          {familyInfo.children.map((child, index) => (
            <Paper key={index} elevation={1} sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Ad Soyad"
                    value={child.name}
                    onChange={(e) => {
                      const newChildren = [...familyInfo.children];
                      newChildren[index].name = e.target.value;
                      setFamilyInfo(prev => ({ ...prev, children: newChildren }));
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Mesleği"
                    value={child.profession}
                    onChange={(e) => {
                      const newChildren = [...familyInfo.children];
                      newChildren[index].profession = e.target.value;
                      setFamilyInfo(prev => ({ ...prev, children: newChildren }));
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Yaşı"
                    type="number"
                    value={child.age}
                    onChange={(e) => {
                      const newChildren = [...familyInfo.children];
                      newChildren[index].age = e.target.value;
                      setFamilyInfo(prev => ({ ...prev, children: newChildren }));
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <IconButton
                    onClick={() => removeChild(index)}
                    color="error"
                    disabled={familyInfo.children.length <= 1}
                  >
                    <RemoveIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Box>
      </CardContent>
    </Card>
  );

  // C. EĞİTİM BİLGİLERİ
  const renderEducationInfo = () => (
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
            C. EĞİTİM BİLGİLERİ
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={addEducation}
            variant="outlined"
            size="small"
          >
            Eğitim Ekle
          </Button>
        </Box>

        {educationInfo.map((education, index) => (
          <Paper key={index} elevation={1} sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Okul Adı *"
                  value={education.schoolName}
                  onChange={(e) => {
                    const newEducation = [...educationInfo];
                    newEducation[index].schoolName = e.target.value;
                    setEducationInfo(newEducation);
                  }}
                  required
                  error={!!formErrors.education && !education.schoolName.trim()}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Bölümü *"
                  value={education.department}
                  onChange={(e) => {
                    const newEducation = [...educationInfo];
                    newEducation[index].department = e.target.value;
                    setEducationInfo(newEducation);
                  }}
                  required
                  error={!!formErrors.education && !education.department.trim()}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Başlangıç Tarihi"
                  type="date"
                  value={education.startDate}
                  onChange={(e) => {
                    const newEducation = [...educationInfo];
                    newEducation[index].startDate = e.target.value;
                    setEducationInfo(newEducation);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Bitiş Tarihi"
                  type="date"
                  value={education.endDate}
                  onChange={(e) => {
                    const newEducation = [...educationInfo];
                    newEducation[index].endDate = e.target.value;
                    setEducationInfo(newEducation);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Mezuniyet Derecesi"
                  value={education.degreeReceived}
                  onChange={(e) => {
                    const newEducation = [...educationInfo];
                    newEducation[index].degreeReceived = e.target.value;
                    setEducationInfo(newEducation);
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={1}>
                <IconButton
                  onClick={() => removeEducation(index)}
                  color="error"
                  disabled={educationInfo.length <= 1}
                >
                  <RemoveIcon />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        ))}
        {formErrors.education && (
          <FormHelperText error>{formErrors.education}</FormHelperText>
        )}
      </CardContent>
    </Card>
  );

  // D. BİLGİSAYAR BİLGİSİ
  const renderComputerSkills = () => (
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <ComputerIcon sx={{ mr: 1, color: 'primary.main' }} />
            D. BİLGİSAYAR BİLGİSİ
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={addComputerSkill}
            variant="outlined"
            size="small"
          >
            Program Ekle
          </Button>
        </Box>

        <TableContainer component={Paper} elevation={1}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.light' }}>
                <TableCell><strong>Program</strong></TableCell>
                <TableCell align="center"><strong>Çok İyi</strong></TableCell>
                <TableCell align="center"><strong>İyi</strong></TableCell>
                <TableCell align="center"><strong>Orta</strong></TableCell>
                <TableCell align="center"><strong>Az</strong></TableCell>
                <TableCell align="center"><strong>İşlem</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {computerSkills.map((skill, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <TextField
                      fullWidth
                      placeholder="Program adı"
                      value={skill.program}
                      onChange={(e) => {
                        const newSkills = [...computerSkills];
                        newSkills[index].program = e.target.value;
                        setComputerSkills(newSkills);
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Radio
                      checked={skill.level === 'Çok İyi'}
                      onChange={() => {
                        const newSkills = [...computerSkills];
                        newSkills[index].level = 'Çok İyi';
                        setComputerSkills(newSkills);
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Radio
                      checked={skill.level === 'İyi'}
                      onChange={() => {
                        const newSkills = [...computerSkills];
                        newSkills[index].level = 'İyi';
                        setComputerSkills(newSkills);
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Radio
                      checked={skill.level === 'Orta'}
                      onChange={() => {
                        const newSkills = [...computerSkills];
                        newSkills[index].level = 'Orta';
                        setComputerSkills(newSkills);
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Radio
                      checked={skill.level === 'Az'}
                      onChange={() => {
                        const newSkills = [...computerSkills];
                        newSkills[index].level = 'Az';
                        setComputerSkills(newSkills);
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={() => removeComputerSkill(index)}
                      color="error"
                      disabled={computerSkills.length <= 1}
                    >
                      <RemoveIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  // E. İŞ TÜCRÜBESİ
  const renderWorkExperience = () => (
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <WorkIcon sx={{ mr: 1, color: 'primary.main' }} />
            E. İŞ TÜCRÜBESİ (Sondan başa doğru)
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={addWorkExperience}
            variant="outlined"
            size="small"
          >
            İş Deneyimi Ekle
          </Button>
        </Box>

        {workExperience.map((work, index) => (
          <Paper key={index} elevation={1} sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Firma/Kurum Adı"
                  value={work.companyName}
                  onChange={(e) => {
                    const newWork = [...workExperience];
                    newWork[index].companyName = e.target.value;
                    setWorkExperience(newWork);
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Göreviniz"
                  value={work.position}
                  onChange={(e) => {
                    const newWork = [...workExperience];
                    newWork[index].position = e.target.value;
                    setWorkExperience(newWork);
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Giriş Tarihi"
                  type="date"
                  value={work.startDate}
                  onChange={(e) => {
                    const newWork = [...workExperience];
                    newWork[index].startDate = e.target.value;
                    setWorkExperience(newWork);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Çıkış Tarihi"
                  type="date"
                  value={work.endDate}
                  onChange={(e) => {
                    const newWork = [...workExperience];
                    newWork[index].endDate = e.target.value;
                    setWorkExperience(newWork);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Ayrılma Sebebi"
                  value={work.reasonForLeaving}
                  onChange={(e) => {
                    const newWork = [...workExperience];
                    newWork[index].reasonForLeaving = e.target.value;
                    setWorkExperience(newWork);
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Aldığınız Ücret (Net/₺)"
                  value={work.salaryReceived}
                  onChange={(e) => {
                    const newWork = [...workExperience];
                    newWork[index].salaryReceived = e.target.value;
                    setWorkExperience(newWork);
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={1}>
                <IconButton
                  onClick={() => removeWorkExperience(index)}
                  color="error"
                  disabled={workExperience.length <= 1}
                >
                  <RemoveIcon />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </CardContent>
    </Card>
  );

  // F. DİĞER BİLGİLER
  const renderOtherInfo = () => (
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
          F. DİĞER BİLGİLER
        </Typography>

        <Grid container spacing={3}>
          {/* Sağlık problemi */}
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Herhangi bir sağlık probleminiz var mı?</FormLabel>
              <RadioGroup
                row
                value={otherInfo.healthProblem}
                onChange={(e) => setOtherInfo(prev => ({ ...prev, healthProblem: e.target.value === 'true' }))}
              >
                <FormControlLabel value="false" control={<Radio />} label="Hayır" />
                <FormControlLabel value="true" control={<Radio />} label="Evet" />
              </RadioGroup>
            </FormControl>
            {otherInfo.healthProblem && (
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Varsa Açıklayınız:"
                value={otherInfo.healthDetails}
                onChange={(e) => setOtherInfo(prev => ({ ...prev, healthDetails: e.target.value }))}
                sx={{ mt: 2 }}
              />
            )}
          </Grid>

          {/* Mahkûmiyet durumu */}
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Mahkûmiyet durumunuz var mı?</FormLabel>
              <RadioGroup
                row
                value={otherInfo.conviction}
                onChange={(e) => setOtherInfo(prev => ({ ...prev, conviction: e.target.value === 'true' }))}
              >
                <FormControlLabel value="false" control={<Radio />} label="Hayır" />
                <FormControlLabel value="true" control={<Radio />} label="Evet" />
              </RadioGroup>
            </FormControl>
            {otherInfo.conviction && (
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Varsa Açıklayınız:"
                value={otherInfo.convictionDetails}
                onChange={(e) => setOtherInfo(prev => ({ ...prev, convictionDetails: e.target.value }))}
                sx={{ mt: 2 }}
              />
            )}
          </Grid>

          {/* İletişim tercihi */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Size ulaşamadığımızda haber verilecek kişinin</InputLabel>
              <Select
                value={otherInfo.contactMethod}
                onChange={(e) => setOtherInfo(prev => ({ ...prev, contactMethod: e.target.value }))}
                label="Size ulaşamadığımızda haber verilecek kişinin"
              >
                <MenuItem value="Ad-Soyadı">Ad-Soyadı</MenuItem>
                <MenuItem value="Yakınlık">Yakınlık</MenuItem>
                <MenuItem value="Telefonu">Telefonu</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Kabul beyanı */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={otherInfo.phonePermission}
                  onChange={(e) => setOtherInfo(prev => ({ ...prev, phonePermission: e.target.checked }))}
                />
              }
              label="Bu İş Başvuru ve Bilgi Formundaki verdiğim bilgilerin tamamının doğru olduğunu, zamana değişecek bilgilerimi en geç 10 gün içerisinde yazılı olarak bildireceğimi, gerçek istişmede bulunmama halinde bu durumun anlaşılmasıyla herhangi bir ihbar ve tazminat talebini göz önüne alması halinde herhangi bir talebim olmadığını kabul ve beyan ederim."
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // 🔄 DYNAMIC SECTION RENDERER
  const renderDynamicSection = (section) => (
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          {section.icon === 'person' && <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />}
          {section.icon === 'school' && <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />}
          {section.icon === 'computer' && <ComputerIcon sx={{ mr: 1, color: 'primary.main' }} />}
          {section.icon === 'work' && <WorkIcon sx={{ mr: 1, color: 'primary.main' }} />}
          {section.icon === 'description' && <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />}
          {section.icon === 'contact_phone' && <ContactPhoneIcon sx={{ mr: 1, color: 'primary.main' }} />}
          {section.title}
        </Typography>
        
        <Grid container spacing={3}>
          {section.fields?.map((field, fieldIndex) => (
            <Grid 
              key={field.name || fieldIndex} 
              item 
              xs={12} 
              sm={field.styling?.width === 'half' ? 6 : 
                  field.styling?.width === 'third' ? 4 : 
                  field.styling?.width === 'quarter' ? 3 : 12}
            >
              {renderDynamicField(field, section.id)}
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  // 🔄 DYNAMIC FIELD RENDERER
  const renderDynamicField = (field, sectionId) => {
    const fieldValue = formData[field.name] || '';
    const fieldError = formErrors[field.name];

    const handleFieldChange = (value) => {
      setFormData(prev => ({ ...prev, [field.name]: value }));
      if (fieldError) {
        setFormErrors(prev => ({ ...prev, [field.name]: '' }));
      }
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <TextField
            fullWidth
            label={field.label + (field.required ? ' *' : '')}
            type={field.type}
            value={fieldValue}
            onChange={(e) => handleFieldChange(e.target.value)}
            required={field.required}
            error={!!fieldError}
            helperText={fieldError}
            placeholder={field.placeholder}
          />
        );

      case 'textarea':
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            label={field.label + (field.required ? ' *' : '')}
            value={fieldValue}
            onChange={(e) => handleFieldChange(e.target.value)}
            required={field.required}
            error={!!fieldError}
            helperText={fieldError}
            placeholder={field.placeholder}
          />
        );

      case 'select':
        return (
          <FormControl fullWidth error={!!fieldError}>
            <InputLabel>{field.label + (field.required ? ' *' : '')}</InputLabel>
            <Select
              value={fieldValue}
              onChange={(e) => handleFieldChange(e.target.value)}
              label={field.label + (field.required ? ' *' : '')}
              required={field.required}
            >
              {field.options?.map((option, index) => (
                <MenuItem key={index} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            {fieldError && <FormHelperText>{fieldError}</FormHelperText>}
          </FormControl>
        );

      case 'radio':
        return (
          <FormControl component="fieldset" error={!!fieldError}>
            <FormLabel component="legend">{field.label + (field.required ? ' *' : '')}</FormLabel>
            <RadioGroup
              row
              value={fieldValue}
              onChange={(e) => handleFieldChange(e.target.value)}
            >
              {field.options?.map((option, index) => (
                <FormControlLabel 
                  key={index} 
                  value={option} 
                  control={<Radio />} 
                  label={option} 
                />
              ))}
            </RadioGroup>
            {fieldError && <FormHelperText>{fieldError}</FormHelperText>}
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!fieldValue}
                onChange={(e) => handleFieldChange(e.target.checked)}
              />
            }
            label={field.label + (field.required ? ' *' : '')}
          />
        );

      case 'date':
        return (
          <TextField
            fullWidth
            label={field.label + (field.required ? ' *' : '')}
            type="date"
            value={fieldValue}
            onChange={(e) => handleFieldChange(e.target.value)}
            required={field.required}
            error={!!fieldError}
            helperText={fieldError}
            InputLabelProps={{ shrink: true }}
          />
        );

      default:
        return (
          <TextField
            fullWidth
            label={field.label + (field.required ? ' *' : '')}
            value={fieldValue}
            onChange={(e) => handleFieldChange(e.target.value)}
            required={field.required}
            error={!!fieldError}
            helperText={fieldError}
            placeholder={field.placeholder}
          />
        );
    }
  };

  // G. REFERANSLAR
  const renderReferences = () => (
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <ContactPhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
            G. REFERANSLAR (Çalıştığınız Yerlerde Yöneticiler/Sorumlu/Amiri Pozisyonundaki Olan Kişiler)
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={addReference}
            variant="outlined"
            size="small"
          >
            Referans Ekle
          </Button>
        </Box>

        {references.map((reference, index) => (
          <Paper key={index} elevation={1} sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Adı, Soyadı"
                  value={reference.name}
                  onChange={(e) => {
                    const newReferences = [...references];
                    newReferences[index].name = e.target.value;
                    setReferences(newReferences);
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Çalıştığı Kurum"
                  value={reference.company}
                  onChange={(e) => {
                    const newReferences = [...references];
                    newReferences[index].company = e.target.value;
                    setReferences(newReferences);
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Görevi"
                  value={reference.position}
                  onChange={(e) => {
                    const newReferences = [...references];
                    newReferences[index].position = e.target.value;
                    setReferences(newReferences);
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Telefon Numarası"
                  value={reference.phone}
                  onChange={(e) => {
                    const newReferences = [...references];
                    newReferences[index].phone = e.target.value;
                    setReferences(newReferences);
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={1}>
                <IconButton
                  onClick={() => removeReference(index)}
                  color="error"
                  disabled={references.length <= 1}
                >
                  <RemoveIcon />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </CardContent>
    </Card>
  );

  // Ana render logic
  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Paper elevation={6} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="primary.main">
            Form yükleniyor...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lütfen bekleyiniz
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (submitSuccess) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }}>
          <Typography variant="h5" gutterBottom>
            🎉 Başvurunuz Başarıyla Alınmıştır!
          </Typography>
          <Typography variant="body1" paragraph>
            İş başvurunuz başarıyla sistemimize kaydedilmiştir. İnsan Kaynakları departmanımız 
            başvurunuzu inceleyerek en kısa sürede size dönüş yapacaktır.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            📧 E-posta adresinize onay mesajı gönderilmiştir.
            <br />
            📱 İletişim bilgileriniz kaydedilmiştir.
            <br />
            ⏰ Sayfa 5 saniye içinde yenilenecek...
          </Typography>
        </Alert>
        
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            🏢 {formStructure?.title || 'Çanga Savunma Endüstrisi A.Ş.'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            İlginiz için teşekkür ederiz.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#f8f9fa',
      py: { xs: 2, md: 4 }
    }}>
      <Container maxWidth="lg">
        {/* Corporate Header - Blue & Red Only */}
        <Paper elevation={3} sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 3, 
          background: 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)', 
          color: 'white',
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(25, 118, 210, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0l8 6-8 6V8h-4v4h4v2H4V4h8v4h4V0l8 6-8 6V4H4v8h24v2h4v-2h8z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.1
          }
        }}>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* Header Content */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' }, 
              justifyContent: 'space-between',
              mb: 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 0 } }}>
                <Avatar sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  width: { xs: 50, sm: 60 }, 
                  height: { xs: 50, sm: 60 },
                  mr: 2,
                  backdropFilter: 'blur(10px)'
                }}>
                  <PublicIcon sx={{ fontSize: { xs: 24, sm: 30 } }} />
                </Avatar>
            <Box>
                  <Typography variant="h3" component="h1" sx={{
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                    fontWeight: 700,
                    mb: 0.5
              }}>
                İŞ BAŞVURU FORMU
              </Typography>
                  <Typography variant="h6" sx={{
                    fontSize: { xs: '1rem', sm: '1.2rem' },
                    opacity: 0.9
              }}>
                🏢 Çanga Savunma Endüstrisi A.Ş.
              </Typography>
            </Box>
          </Box>
              
              {/* Progress Circle */}
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={formProgress}
                    size={isMobile ? 60 : 80}
                    thickness={4}
                    sx={{
                      color: 'rgba(255,255,255,0.9)',
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      },
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant={isMobile ? "body2" : "h6"} component="div" sx={{ 
                      color: 'white', 
                      fontWeight: 700 
                    }}>
                      {formProgress}%
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ 
                  display: 'block', 
                  mt: 1, 
                  opacity: 0.8,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' }
                }}>
                  Tamamlanma Oranı
                </Typography>
              </Box>
            </Box>

            {/* Info Bar - Corporate Blue/Red */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 2,
              p: 2,
              bgcolor: 'rgba(255,255,255,0.15)',
              borderRadius: 2,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <Typography variant="body2" sx={{
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1
              }}>
                🌐 Online Başvuru Sistemi
                <Chip 
                  label="Güvenli" 
                  size="small" 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 20,
                    fontWeight: 600
                  }} 
                />
              </Typography>
              
              <Stack direction="row" spacing={2} sx={{ 
                flexWrap: 'wrap', 
                gap: 1,
                alignItems: 'center'
              }}>
                <Typography variant="caption" sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  opacity: 0.9
                }}>
                  📅 {new Date().toLocaleDateString('tr-TR')}
                </Typography>
                <Typography variant="caption" sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  opacity: 0.9
                }}>
                  🕐 {new Date().toLocaleTimeString('tr-TR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Typography>
              </Stack>
            </Box>
          </Box>
        </Paper>

        {/* Progress Bar - Corporate Style */}
        <Paper elevation={2} sx={{ 
          mb: 3, 
          p: 2, 
          borderRadius: 2,
          bgcolor: 'white',
          border: '1px solid #e0e0e0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
              📋 Form İlerleme Durumu
            </Typography>
            <Chip 
              label={`${formProgress}% Tamamlandı`}
              size="small"
              sx={{ 
                ml: 2,
                bgcolor: formProgress >= 80 ? '#1976d2' : formProgress >= 50 ? '#dc004e' : '#e0e0e0',
                color: formProgress >= 50 ? 'white' : 'text.secondary',
                fontWeight: 600
              }}
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={formProgress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: '#e3f2fd',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: formProgress >= 80 
                  ? 'linear-gradient(90deg, #1976d2, #1565c0)' 
                  : formProgress >= 50 
                    ? 'linear-gradient(90deg, #dc004e, #c62828)'
                    : 'linear-gradient(90deg, #90caf9, #64b5f6)'
              }
            }} 
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            💡 Formu eksiksiz doldurarak başvurunuzun değerlendirilme şansını artırın
          </Typography>
        </Paper>

        {/* Form Sections - Corporate Info */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
          <Typography variant="body1" color="primary.main" sx={{ mb: 1, fontWeight: 600 }}>
            📋 Başvuru Formu Bölümleri
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Formu eksiksiz doldurduktan sonra en alttaki "BAŞVURU GÖNDER" butonuna basınız.
          </Typography>
        </Box>

        {/* DYNAMIC FORM SECTIONS - Corporate Blue/Red Theme */}
        {formStructure && formStructure.sections ? (
          // 🔄 DYNAMIC FORM - Admin tarafından düzenlenir
          formStructure.sections
            .filter(section => section.active !== false)
            .map((section, index) => {
              // Corporate color scheme: alternate between blue and red
              const isBlue = index % 2 === 0;
              const bgColor = isBlue ? '#1976d2' : '#dc004e';
              const hoverColor = isBlue ? '#1565c0' : '#c62828';
              
              return (
                <Accordion 
                  key={section.id} 
                  defaultExpanded={index === 0} 
                  elevation={2} 
                  sx={{ 
                    borderRadius: 2, 
                    mb: 2,
                    border: '1px solid #e0e0e0',
                    '&:before': { display: 'none' }
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
                    sx={{ 
                      backgroundColor: bgColor,
                      color: 'white',
                      borderRadius: '8px 8px 0 0',
                      '&:hover': { 
                        backgroundColor: hoverColor
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Typography variant="h6" sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                      fontWeight: 600
                    }}>
                      {section.icon === 'person' && <PersonIcon sx={{ mr: 1 }} />}
                      {section.icon === 'school' && <SchoolIcon sx={{ mr: 1 }} />}
                      {section.icon === 'computer' && <ComputerIcon sx={{ mr: 1 }} />}
                      {section.icon === 'work' && <WorkIcon sx={{ mr: 1 }} />}
                      {section.icon === 'description' && <DescriptionIcon sx={{ mr: 1 }} />}
                      {section.icon === 'contact_phone' && <ContactPhoneIcon sx={{ mr: 1 }} />}
                      {!['person', 'school', 'computer', 'work', 'description', 'contact_phone'].includes(section.icon) && <PersonIcon sx={{ mr: 1 }} />}
                      {section.title}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0, bgcolor: 'white' }}>
                    {renderDynamicSection(section)}
                  </AccordionDetails>
                </Accordion>
              );
            })
        ) : (
          // 📋 STATIC FORM - Corporate Blue/Red Theme
          <>
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2, border: '1px solid #e3f2fd', bgcolor: 'white' }}>
              <Typography variant="body1" color="primary.main">
                🔧 <strong>Statik Form Görüntüleniyor</strong> - İK henüz form yapısını özelleştirmemiş
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                İK departmanı <strong>İK: Form Düzenleyici</strong> sayfasından bu formu özelleştirebilir.
              </Typography>
            </Alert>
            
            {/* Alternating Blue/Red Corporate Scheme */}
            <Accordion defaultExpanded elevation={2} sx={{ borderRadius: 2, mb: 2, border: '1px solid #e0e0e0' }}>
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
                sx={{ 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRadius: '8px 8px 0 0',
                  '&:hover': { backgroundColor: '#1565c0' }
                }}
              >
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', fontSize: { xs: '1rem', sm: '1.25rem' }, fontWeight: 600 }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  A. KİŞİSEL BİLGİLER
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0, bgcolor: 'white' }}>
                {renderPersonalInfo()}
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={2} sx={{ borderRadius: 2, mb: 2, border: '1px solid #e0e0e0' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />} sx={{ backgroundColor: '#dc004e', color: 'white', borderRadius: '8px 8px 0 0', '&:hover': { backgroundColor: '#c62828' } }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  B. AİLE BİLGİLERİ
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0, bgcolor: 'white' }}>
                {renderFamilyInfo()}
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={2} sx={{ borderRadius: 2, mb: 2, border: '1px solid #e0e0e0' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />} sx={{ backgroundColor: '#1976d2', color: 'white', borderRadius: '8px 8px 0 0', '&:hover': { backgroundColor: '#1565c0' } }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                  <SchoolIcon sx={{ mr: 1 }} />
                  C. EĞİTİM BİLGİLERİ
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0, bgcolor: 'white' }}>
                {renderEducationInfo()}
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={2} sx={{ borderRadius: 2, mb: 2, border: '1px solid #e0e0e0' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />} sx={{ backgroundColor: '#dc004e', color: 'white', borderRadius: '8px 8px 0 0', '&:hover': { backgroundColor: '#c62828' } }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                  <ComputerIcon sx={{ mr: 1 }} />
                  D. BİLGİSAYAR BİLGİSİ
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0, bgcolor: 'white' }}>
                {renderComputerSkills()}
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={2} sx={{ borderRadius: 2, mb: 2, border: '1px solid #e0e0e0' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />} sx={{ backgroundColor: '#1976d2', color: 'white', borderRadius: '8px 8px 0 0', '&:hover': { backgroundColor: '#1565c0' } }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                  <WorkIcon sx={{ mr: 1 }} />
                  E. İŞ TÜCRÜBESİ
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0, bgcolor: 'white' }}>
                {renderWorkExperience()}
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={2} sx={{ borderRadius: 2, mb: 2, border: '1px solid #e0e0e0' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />} sx={{ backgroundColor: '#dc004e', color: 'white', borderRadius: '8px 8px 0 0', '&:hover': { backgroundColor: '#c62828' } }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                  <DescriptionIcon sx={{ mr: 1 }} />
                  F. DİĞER BİLGİLER
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0, bgcolor: 'white' }}>
                {renderOtherInfo()}
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={2} sx={{ borderRadius: 2, mb: 2, border: '1px solid #e0e0e0' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />} sx={{ backgroundColor: '#1976d2', color: 'white', borderRadius: '8px 8px 0 0', '&:hover': { backgroundColor: '#1565c0' } }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                  <ContactPhoneIcon sx={{ mr: 1 }} />
                  G. REFERANSLAR
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0, bgcolor: 'white' }}>
                {renderReferences()}
              </AccordionDetails>
            </Accordion>
          </>
        )}

        {/* CV Gönderme Uyarısı */}
        <Alert 
          severity="info" 
          icon={<DescriptionIcon />}
          sx={{ 
            mt: 4, 
            borderRadius: 3,
            border: '2px solid',
            borderColor: 'info.main',
            bgcolor: 'info.light',
            '& .MuiAlert-icon': {
              fontSize: 28
            }
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'info.dark' }}>
            📎 CV (Özgeçmiş) Gönderimi Hakkında
          </Typography>
          <Typography variant="body1" sx={{ color: 'info.dark', mb: 1 }}>
            CV'nizi (özgeçmişinizi) lütfen <strong>ik@canga.com.tr</strong> e-posta adresine gönderin.
          </Typography>
          <Typography variant="body2" sx={{ color: 'info.dark' }}>
            💡 E-posta konusuna <strong>"İş Başvurusu - Ad Soyad"</strong> yazmanızı rica ederiz.
            <br />
            📧 Kabul edilen formatlar: PDF, DOC, DOCX
            <br />
            📏 Maksimum dosya boyutu: 5 MB
          </Typography>
        </Alert>

        {/* Submit Button - Corporate Style */}
        <Paper elevation={3} sx={{ 
          mt: 4, 
          p: { xs: 2, sm: 3 },
          textAlign: 'center',
          bgcolor: 'white',
          borderRadius: 2,
          border: '2px solid #e0e0e0'
        }}>
          <Typography variant="h6" gutterBottom color="primary.main" sx={{ fontWeight: 600 }}>
            🎯 Başvurunuzu Gönderin
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={isSubmitting}
            sx={{
              minWidth: { xs: '100%', sm: 300 },
              py: { xs: 1.5, sm: 2 },
              px: { xs: 3, sm: 4 },
              fontSize: { xs: '1rem', sm: '1.2rem' },
              fontWeight: 'bold',
              background: isSubmitting 
                ? '#9e9e9e'
                : 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)',
              '&:hover': {
                background: isSubmitting 
                  ? '#9e9e9e'
                  : 'linear-gradient(135deg, #1565c0 0%, #c62828 100%)',
                transform: isSubmitting ? 'none' : 'translateY(-2px)',
                boxShadow: isSubmitting ? 'none' : '0 8px 20px rgba(25, 118, 210, 0.3)'
              },
              transition: 'all 0.3s ease',
              borderRadius: 2,
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={24} sx={{ mr: 2, color: 'white' }} />
                GÖNDERİLİYOR...
              </>
            ) : (
              <>
                📝 BAŞVURU GÖNDER
              </>
            )}
          </Button>
          
          <Typography variant="body2" color="text.secondary" sx={{ 
            mt: 2,
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}>
            Form No: F-32 | Rev. No: 00 | Tarih: {new Date().toLocaleDateString('tr-TR')}
          </Typography>
          
          {Object.keys(formErrors).length > 0 && (
            <Alert severity="warning" sx={{ 
              mt: 2, 
              maxWidth: { xs: '100%', sm: 600 }, 
              mx: 'auto',
              borderRadius: 2,
              border: '1px solid #ff9800'
            }}>
              <Typography variant="body2">
                ⚠️ Lütfen zorunlu alanları eksiksiz doldurun!
              </Typography>
            </Alert>
          )}
          
          <Box sx={{ 
            mt: 3, 
            p: 2, 
            bgcolor: '#e3f2fd', 
            borderRadius: 2,
            border: '1px solid #90caf9'
          }}>
            <Typography variant="body2" color="primary.dark">
              🔒 <strong>Güvenlik:</strong> Bilgileriniz güvenli şekilde saklanmaktadır.
              <br />
              📞 <strong>İletişim:</strong> Başvuru durumunuz hakkında size e-posta ile bilgi verilecektir.
              <br />
              ⏱️ <strong>Süreç:</strong> Başvurunuz en geç 5 iş günü içinde değerlendirilecektir.
            </Typography>
          </Box>
        </Paper>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default PublicJobApplication;
