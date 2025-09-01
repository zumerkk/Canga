import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ExpandMore as ExpandMoreIcon,
  BusinessCenter as BusinessCenterIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Computer as ComputerIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  ContactPhone as ContactPhoneIcon,
  Public as PublicIcon,
} from '@mui/icons-material';

// 🌐 ANONIM İŞ BAŞVURU SAYFASI - ŞİFRE GEREKTİRMEZ
function PublicJobApplication() {
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [formStructure, setFormStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});

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

  const loadFormStructure = async () => {
    setLoading(true);
    try {
      // API'den form yapısını çek
      const response = await fetch('https://canga-api.onrender.com/api/form-structure');
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

  // Varsayılan form yapısı (API'den gelemezse)
  const getDefaultFormStructure = () => ({
    title: 'İş Başvuru Formu',
    description: 'Çanga Savunma Endüstrisi A.Ş.',
    sections: [
      {
        id: 'personal',
        title: 'A. KİŞİSEL BİLGİLER',
        active: true,
        fields: [
          { name: 'name', label: 'Adınız', type: 'text', required: true },
          { name: 'surname', label: 'Soyadınız', type: 'text', required: true },
          { name: 'email', label: 'E-posta', type: 'email', required: true },
          { name: 'phoneMobile', label: 'Cep Telefonu', type: 'tel', required: true },
          { name: 'gender', label: 'Cinsiyet', type: 'radio', required: true, options: ['Erkek', 'Bayan'] },
          { name: 'address', label: 'Adres', type: 'textarea', required: true }
        ]
      }
    ]
  });

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
      const response = await fetch('https://canga-api.onrender.com/api/job-applications', {
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

  // Dinamik field render fonksiyonu
  const renderField = (field) => {
    const value = formData[field.name] || '';
    const error = formErrors[field.name];
    
    const handleChange = (newValue) => {
      setFormData(prev => ({ ...prev, [field.name]: newValue }));
      if (error) {
        setFormErrors(prev => ({ ...prev, [field.name]: '' }));
      }
    };

    const commonProps = {
      fullWidth: true,
      label: field.label + (field.required ? ' *' : ''),
      value,
      error: !!error,
      helperText: error || field.helpText,
      placeholder: field.placeholder
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'url':
        return (
          <TextField
            {...commonProps}
            type={field.type}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
      
      case 'number':
        return (
          <TextField
            {...commonProps}
            type="number"
            onChange={(e) => handleChange(e.target.value)}
          />
        );
      
      case 'textarea':
        return (
          <TextField
            {...commonProps}
            multiline
            rows={3}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
      
      case 'select':
        return (
          <FormControl fullWidth error={!!error}>
            <InputLabel>{field.label + (field.required ? ' *' : '')}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              label={field.label + (field.required ? ' *' : '')}
            >
              {field.options?.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );
      
      case 'radio':
        return (
          <FormControl component="fieldset" error={!!error}>
            <FormLabel component="legend">{field.label + (field.required ? ' *' : '')}</FormLabel>
            <RadioGroup
              row
              value={value}
              onChange={(e) => handleChange(e.target.value)}
            >
              {field.options?.map(option => (
                <FormControlLabel key={option} value={option} control={<Radio />} label={option} />
              ))}
            </RadioGroup>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );
      
      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={value === 'true' || value === true}
                onChange={(e) => handleChange(e.target.checked)}
              />
            }
            label={field.label}
          />
        );
      
      case 'date':
        return (
          <TextField
            {...commonProps}
            type="date"
            InputLabelProps={{ shrink: true }}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
      
      default:
        return (
          <TextField
            {...commonProps}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
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

  // Ana form render fonksiyonu (Static form)
  const renderStaticForm = () => (
    <>
      {/* A. Kişisel Bilgiler */}
      {renderPersonalInfo()}
      
      {/* B. Aile Bilgileri */}
      {renderFamilyInfo()}
      
      {/* C. Eğitim Bilgileri */}
      {renderEducationInfo()}
      
      {/* D. Bilgisayar Bilgisi */}
      {renderComputerSkills()}
      
      {/* E. İş Tecrübesi */}
      {renderWorkExperience()}
      
      {/* F. Diğer Bilgiler */}
      {renderOtherInfo()}
      
      {/* G. Referanslar */}
      {renderReferences()}
    </>
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: { xs: 2, md: 4 }
    }}>
      <Container maxWidth="lg">
        {/* Header - Public Version */}
        <Paper elevation={6} sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 3, 
          background: 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)', 
          color: 'white',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            mb: 2 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 0 } }}>
              <PublicIcon sx={{ 
                fontSize: { xs: 30, sm: 40 }, 
                mr: 2 
              }} />
              <BusinessCenterIcon sx={{ 
                fontSize: { xs: 30, sm: 40 }, 
                mr: { xs: 0, sm: 2 }
              }} />
            </Box>
            <Box>
              <Typography variant="h3" component="h1" gutterBottom sx={{
                fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' }
              }}>
                İŞ BAŞVURU FORMU
              </Typography>
              <Typography variant="h5" sx={{
                fontSize: { xs: '1.1rem', sm: '1.5rem' }
              }}>
                🏢 Çanga Savunma Endüstrisi A.Ş.
              </Typography>
            </Box>
          </Box>
          <Typography variant="body1" sx={{
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}>
            🌐 Online İş Başvuru Sistemi - Lütfen tüm alanları eksiksiz doldurunuz
            <br />
            📅 Başvuru Tarihi: {new Date().toLocaleDateString('tr-TR')}
          </Typography>
        </Paper>

        {/* Form Sections */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" color="white" sx={{ mb: 1, fontWeight: 'bold' }}>
            📋 Başvuru Formu Bölümleri
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.8)">
            Formu eksiksiz doldurduktan sonra en alttaki "BAŞVURU GÖNDER" butonuna basınız.
          </Typography>
        </Box>

        {/* DYNAMIC FORM SECTIONS */}
        {formStructure && formStructure.sections ? (
          // 🔄 DYNAMIC FORM - Admin tarafından düzenlenir
          formStructure.sections
            .filter(section => section.active !== false)
            .map((section, index) => (
              <Accordion 
                key={section.id} 
                defaultExpanded={index === 0} 
                elevation={3} 
                sx={{ borderRadius: 2, mb: 2 }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ 
                    backgroundColor: `hsl(${index * 60}, 70%, 50%)`, 
                    color: 'white',
                    borderRadius: '8px 8px 0 0',
                    '&:hover': { opacity: 0.9 }
                  }}
                >
                  <Typography variant="h6" sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    fontSize: { xs: '1rem', sm: '1.25rem' }
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
                <AccordionDetails sx={{ p: 0 }}>
                  {renderDynamicSection(section)}
                </AccordionDetails>
              </Accordion>
            ))
        ) : (
          // 📋 STATIC FORM - Varsayılan form (Admin henüz düzenlememiş)
          <>
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="body1">
                🔧 <strong>Statik Form Görüntüleniyor</strong> - İK henüz form yapısını özelleştirmemiş
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                İK departmanı <strong>İK: Form Düzenleyici</strong> sayfasından bu formu özelleştirebilir.
              </Typography>
            </Alert>
            
            <Accordion defaultExpanded elevation={3} sx={{ borderRadius: 2, mb: 2 }}>
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  backgroundColor: 'primary.main', 
                  color: 'white',
                  borderRadius: '8px 8px 0 0',
                  '&:hover': { backgroundColor: 'primary.dark' }
                }}
              >
                <Typography variant="h6" sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  A. KİŞİSEL BİLGİLER
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {renderPersonalInfo()}
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={3} sx={{ borderRadius: 2, mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: 'secondary.main', color: 'white', borderRadius: '8px 8px 0 0' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  B. AİLE BİLGİLERİ
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {renderFamilyInfo()}
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={3} sx={{ borderRadius: 2, mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: 'info.main', color: 'white', borderRadius: '8px 8px 0 0' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <SchoolIcon sx={{ mr: 1 }} />
                  C. EĞİTİM BİLGİLERİ
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {renderEducationInfo()}
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={3} sx={{ borderRadius: 2, mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: 'warning.main', color: 'white', borderRadius: '8px 8px 0 0' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <ComputerIcon sx={{ mr: 1 }} />
                  D. BİLGİSAYAR BİLGİSİ
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {renderComputerSkills()}
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={3} sx={{ borderRadius: 2, mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: 'success.main', color: 'white', borderRadius: '8px 8px 0 0' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <WorkIcon sx={{ mr: 1 }} />
                  E. İŞ TÜCRÜBESİ
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {renderWorkExperience()}
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={3} sx={{ borderRadius: 2, mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: 'error.main', color: 'white', borderRadius: '8px 8px 0 0' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <DescriptionIcon sx={{ mr: 1 }} />
                  F. DİĞER BİLGİLER
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {renderOtherInfo()}
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={3} sx={{ borderRadius: 2, mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: 'primary.dark', color: 'white', borderRadius: '8px 8px 0 0' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <ContactPhoneIcon sx={{ mr: 1 }} />
                  G. REFERANSLAR
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {renderReferences()}
              </AccordionDetails>
            </Accordion>
          </>
        )}

        {/* Submit Button - Enhanced */}
        <Paper elevation={8} sx={{ 
          mt: 4, 
          p: { xs: 2, sm: 3 },
          textAlign: 'center',
          background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
          borderRadius: 3
        }}>
          <Typography variant="h6" gutterBottom color="primary.main">
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
                ? 'linear-gradient(135deg, #999 0%, #666 100%)'
                : 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)',
              '&:hover': {
                background: isSubmitting 
                  ? 'linear-gradient(135deg, #999 0%, #666 100%)'
                  : 'linear-gradient(135deg, #1565c0 0%, #9a0036 100%)',
                transform: isSubmitting ? 'none' : 'translateY(-3px)',
                boxShadow: isSubmitting ? 'none' : '0 12px 35px rgba(0,0,0,0.2)'
              },
              transition: 'all 0.3s ease',
              borderRadius: 3,
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
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
              borderRadius: 2
            }}>
              <Typography variant="body2">
                ⚠️ Lütfen zorunlu alanları eksiksiz doldurun!
              </Typography>
            </Alert>
          )}
          
          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 2, opacity: 0.9 }}>
            <Typography variant="body2" color="info.dark">
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
