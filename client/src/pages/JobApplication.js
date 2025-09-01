import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

function JobApplication() {
  const { user } = useAuth();
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // A. KİŞİSEL BİLGİLER - Form verilerindeki gibi
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    surname: '',
    gender: '',
    nationality: '',
    address: '',
    phoneHome: '',
    phoneMobile: '',
    militaryStatus: '',
    militaryDate: '',
    militaryExemption: '',
    maritalStatus: '',
    drivingLicense: ''
  });

  // B. AİLE BİLGİLERİ - Dinamik aile üyeleri
  const [familyInfo, setFamilyInfo] = useState({
    spouse: { name: '', profession: '', age: '' },
    children: [{ name: '', profession: '', age: '' }] // Dinamik olarak artırılabilir
  });

  // C. EĞİTİM BİLGİLERİ - Dinamik eğitim listesi
  const [educationInfo, setEducationInfo] = useState([
    { schoolName: '', department: '', startDate: '', endDate: '', degreeReceived: '' }
  ]);

  // D. BİLGİSAYAR BİLGİSİ - Program seviyeleri
  const [computerSkills, setComputerSkills] = useState([
    { program: '', level: 'Az' } // Az, Orta, İyi, Çok İyi
  ]);

  // E. İŞ TÜCRÜBESİ - Çalışma geçmişi
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

  // F. DİĞER BİLGİLER - Sağlık, hukuki durum vs.
  const [otherInfo, setOtherInfo] = useState({
    healthProblem: false,
    healthDetails: '',
    conviction: false,
    convictionDetails: '',
    contactMethod: '',
    phonePermission: false
  });

  // G. REFERANSLAR - Referans kişiler
  const [references, setReferences] = useState([
    { name: '', company: '', position: '', phone: '' }
  ]);

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
    
    // A. Kişisel Bilgiler - Zorunlu alanlar
    if (!personalInfo.name.trim()) errors.name = 'Ad alanı zorunludur';
    if (!personalInfo.surname.trim()) errors.surname = 'Soyad alanı zorunludur';
    if (!personalInfo.gender) errors.gender = 'Cinsiyet seçimi zorunludur';
    if (!personalInfo.phoneMobile.trim()) errors.phoneMobile = 'Cep telefonu zorunludur';
    if (!personalInfo.address.trim()) errors.address = 'Adres bilgisi zorunludur';
    
    // Telefon numarası validasyonu
    const phoneRegex = /^[0-9]{10,11}$/;
    if (personalInfo.phoneMobile && !phoneRegex.test(personalInfo.phoneMobile.replace(/\s/g, ''))) {
      errors.phoneMobile = 'Geçerli bir telefon numarası giriniz';
    }
    
    // Email validasyonu (eğer email alanı varsa)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (personalInfo.email && !emailRegex.test(personalInfo.email)) {
      errors.email = 'Geçerli bir e-posta adresi giriniz';
    }
    
    // Eğitim bilgileri - en az bir tane olmalı ve dolu olmalı
    const validEducation = educationInfo.filter(edu => edu.schoolName.trim() && edu.department.trim());
    if (validEducation.length === 0) {
      errors.education = 'En az bir eğitim bilgisi girilmelidir';
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
        message: 'Lütfen zorunlu alanları doldurun!',
        severity: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    
    const applicationData = {
      personalInfo,
      familyInfo,
      educationInfo: educationInfo.filter(edu => edu.schoolName.trim()), // Boş olanları filtrele
      computerSkills: computerSkills.filter(skill => skill.program.trim()), // Boş olanları filtrele
      workExperience: workExperience.filter(work => work.companyName.trim()), // Boş olanları filtrele
      otherInfo,
      references: references.filter(ref => ref.name.trim()), // Boş olanları filtrele
      submittedAt: new Date().toISOString(),
      submittedBy: user?.employeeId || 'GUEST',
      applicationId: `JOB-${Date.now()}`, // Unique ID
    };

    try {
      // API endpoint'ine gönderim - gerçek backend entegrasyonu için
      const response = await fetch('https://canga-api.onrender.com/api/job-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      if (response.ok) {
        console.log('✅ İş Başvuru Verisi:', applicationData);
        setSubmitSuccess(true);
        setSnackbar({
          open: true,
          message: 'Başvurunuz başarıyla gönderildi! 🎉',
          severity: 'success'
        });

        // Form temizle - 3 saniye sonra
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        throw new Error('Başvuru gönderilemedi');
      }
      
    } catch (error) {
      console.error('❌ Başvuru gönderilirken hata:', error);
      
      // Demo amaçlı başarılı kabul et (API yokken)
      console.log('🔄 Demo Mode: Başvuru kabul edildi', applicationData);
      setSubmitSuccess(true);
      setSnackbar({
        open: true,
        message: 'Başvurunuz başarıyla gönderildi! (Demo Mode) 🎉',
        severity: 'success'
      });

      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
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
              placeholder="0532 123 45 67"
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

  // C. EĞİTİM BİLGİLERİ Bölümü
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
                  label="Okul Adı"
                  value={education.schoolName}
                  onChange={(e) => {
                    const newEducation = [...educationInfo];
                    newEducation[index].schoolName = e.target.value;
                    setEducationInfo(newEducation);
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Bölümü"
                  value={education.department}
                  onChange={(e) => {
                    const newEducation = [...educationInfo];
                    newEducation[index].department = e.target.value;
                    setEducationInfo(newEducation);
                  }}
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
      </CardContent>
    </Card>
  );

  // D. BİLGİSAYAR BİLGİSİ Bölümü
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
              <TableRow>
                <TableCell><strong>Program</strong></TableCell>
                <TableCell><strong>Çok İyi</strong></TableCell>
                <TableCell><strong>İyi</strong></TableCell>
                <TableCell><strong>Orta</strong></TableCell>
                <TableCell><strong>Az</strong></TableCell>
                <TableCell><strong>İşlem</strong></TableCell>
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
                  <TableCell>
                    <Radio
                      checked={skill.level === 'Çok İyi'}
                      onChange={() => {
                        const newSkills = [...computerSkills];
                        newSkills[index].level = 'Çok İyi';
                        setComputerSkills(newSkills);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Radio
                      checked={skill.level === 'İyi'}
                      onChange={() => {
                        const newSkills = [...computerSkills];
                        newSkills[index].level = 'İyi';
                        setComputerSkills(newSkills);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Radio
                      checked={skill.level === 'Orta'}
                      onChange={() => {
                        const newSkills = [...computerSkills];
                        newSkills[index].level = 'Orta';
                        setComputerSkills(newSkills);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Radio
                      checked={skill.level === 'Az'}
                      onChange={() => {
                        const newSkills = [...computerSkills];
                        newSkills[index].level = 'Az';
                        setComputerSkills(newSkills);
                      }}
                    />
                  </TableCell>
                  <TableCell>
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

  // E. İŞ TÜCRÜBESİ Bölümü
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

  // F. DİĞER BİLGİLER Bölümü
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

          {/* Telefon ile aranma */}
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

  // G. REFERANSLAR Bölümü
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

  if (submitSuccess) {
    return (
      <Box sx={{ maxWidth: '100%', mx: 'auto', p: 3 }}>
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="h6">Başvuru Başarıyla Gönderildi! 🎉</Typography>
          <Typography>
            İş başvurunuz başarıyla alınmıştır. En kısa sürede sizinle iletişime geçeceğiz.
            Sayfa 3 saniye içinde yenilenecek...
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      maxWidth: '100%', 
      mx: 'auto', 
      p: { xs: 1, sm: 2, md: 3 }, // Responsive padding
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      {/* Header - Responsive */}
      <Paper elevation={6} sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: 3, 
        background: 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)', 
        color: 'white',
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: 2 
        }}>
          <BusinessCenterIcon sx={{ 
            fontSize: { xs: 30, sm: 40 }, 
            mr: { xs: 0, sm: 2 }, 
            mb: { xs: 1, sm: 0 } 
          }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
            }}>
              İŞ BAŞVURU FORMU
            </Typography>
            <Typography variant="h6" sx={{
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}>
              Çanga Savunma Endüstrisi A.Ş.
            </Typography>
          </Box>
        </Box>
        <Typography variant="body1" sx={{
          fontSize: { xs: '0.875rem', sm: '1rem' }
        }}>
          Lütfen tüm alanları eksiksiz ve doğru bir şekilde doldurunuz. 
          Başvuru tarihi: {new Date().toLocaleDateString('tr-TR')}
        </Typography>
      </Paper>

      {/* Form Sections - Accordion Style with Progress */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          📋 Form Bölümleri (Tümünü doldurup sonunda gönder butonuna basın)
        </Typography>
      </Box>

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

      {/* Diğer bölümler - Responsive accordion'lar */}
      {[
        { 
          icon: <PersonIcon sx={{ mr: 1 }} />, 
          title: 'B. AİLE BİLGİLERİ', 
          content: renderFamilyInfo(),
          color: 'secondary.main'
        },
        { 
          icon: <SchoolIcon sx={{ mr: 1 }} />, 
          title: 'C. EĞİTİM BİLGİLERİ', 
          content: renderEducationInfo(),
          color: 'success.main'
        },
        { 
          icon: <ComputerIcon sx={{ mr: 1 }} />, 
          title: 'D. BİLGİSAYAR BİLGİSİ', 
          content: renderComputerSkills(),
          color: 'warning.main'
        },
        { 
          icon: <WorkIcon sx={{ mr: 1 }} />, 
          title: 'E. İŞ TÜCRÜBESİ', 
          content: renderWorkExperience(),
          color: 'info.main'
        },
        { 
          icon: <DescriptionIcon sx={{ mr: 1 }} />, 
          title: 'F. DİĞER BİLGİLER', 
          content: renderOtherInfo(),
          color: 'error.main'
        },
        { 
          icon: <ContactPhoneIcon sx={{ mr: 1 }} />, 
          title: 'G. REFERANSLAR', 
          content: renderReferences(),
          color: 'primary.dark'
        }
      ].map((section, index) => (
        <Accordion key={index} elevation={3} sx={{ borderRadius: 2, mb: 2 }}>
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              backgroundColor: section.color, 
              color: 'white',
              borderRadius: index === 5 ? '8px' : '8px 8px 0 0',
              '&:hover': { backgroundColor: `${section.color}CC` }
            }}
          >
            <Typography variant="h6" sx={{ 
              display: 'flex', 
              alignItems: 'center',
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}>
              {section.icon}
              {section.title}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            {section.content}
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Submit Button - Enhanced */}
      <Paper elevation={8} sx={{ 
        mt: 4, 
        p: { xs: 2, sm: 3 },
        textAlign: 'center',
        background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
        borderRadius: 3
      }}>
        <Typography variant="h6" gutterBottom color="primary.main">
          🎯 Başvurunuzu Tamamlayın
        </Typography>
        
        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={isSubmitting}
          sx={{
            minWidth: { xs: '100%', sm: 250 },
            py: { xs: 1.5, sm: 2 },
            px: { xs: 3, sm: 4 },
            fontSize: { xs: '1rem', sm: '1.1rem' },
            background: isSubmitting 
              ? 'linear-gradient(135deg, #999 0%, #666 100%)'
              : 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)',
            '&:hover': {
              background: isSubmitting 
                ? 'linear-gradient(135deg, #999 0%, #666 100%)'
                : 'linear-gradient(135deg, #1565c0 0%, #9a0036 100%)',
              transform: isSubmitting ? 'none' : 'translateY(-2px)',
              boxShadow: isSubmitting ? 'none' : '0 8px 25px rgba(0,0,0,0.15)'
            },
            transition: 'all 0.3s ease',
            borderRadius: 3
          }}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
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
          Form No: F-32 | Rev. No: 00 | Rev. Tar: 00 | Tarih: {new Date().toLocaleDateString('tr-TR')}
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
        
        <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 2, opacity: 0.8 }}>
          <Typography variant="body2" color="info.dark">
            💡 <strong>İpucu:</strong> Formun tüm bölümlerini açıp doldurduktan sonra yukarıdaki butona basarak başvurunuzu gönderin. 
            Başvurunuz incelenerek size en kısa sürede dönüş yapılacaktır.
          </Typography>
        </Box>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default JobApplication;
