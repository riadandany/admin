import { useState, useEffect, useRef } from "react";
import "@/App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Supabase config
const SUPABASE_URL = "https://pntqobqhaggvcjtyspvb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBudHFvYnFoYWdndmNqdHlzcHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjYwNjQsImV4cCI6MjA5MTUwMjA2NH0.fdl8d8I0UoDyWGDPK0VNUZBaEBQD4cz-ReowhbtxH0k";

const CLICK_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
  
  const [adminTab, setAdminTab] = useState('works');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState(null);
  
  const [updates, setUpdates] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [works, setWorks] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  
  const [newUpdate, setNewUpdate] = useState({ version: '', title: '', description: '' });
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', description: '', button_text: '', button_link: '' });
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [newWork, setNewWork] = useState({ title: '', description: '', category: 'كرت فيزيت' });
  const [newWorkImage, setNewWorkImage] = useState(null);
  const [editingWork, setEditingWork] = useState(null);
  const [editWorkImage, setEditWorkImage] = useState(null);
  const [newSocial, setNewSocial] = useState({ platform: '', url: '', icon: 'fab fa-facebook' });
  const [editingSocial, setEditingSocial] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  
  const [lightboxImage, setLightboxImage] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, type: '', id: '' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const categories = ['كرت فيزيت', 'فلكسة', 'دفتر فواتير', 'ختم', 'بروشور', 'دعوة وتس', 'آيات قرآنية', 'شهادة وفاة', 'آخر'];
  const socialIcons = [
    { value: 'fab fa-facebook', label: 'فيسبوك' },
    { value: 'fab fa-instagram', label: 'انستغرام' },
    { value: 'fab fa-twitter', label: 'تويتر' },
    { value: 'fab fa-tiktok', label: 'تيك توك' },
    { value: 'fab fa-youtube', label: 'يوتيوب' },
    { value: 'fab fa-whatsapp', label: 'واتساب' },
    { value: 'fab fa-telegram', label: 'تيليجرام' },
    { value: 'fab fa-snapchat', label: 'سناب شات' },
    { value: 'fab fa-linkedin', label: 'لينكد إن' },
    { value: 'fas fa-globe', label: 'موقع إلكتروني' }
  ];

  const playClick = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {});
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
      checkAnnouncements();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const checkAnnouncements = async () => {
    const seen = JSON.parse(localStorage.getItem('seenAnnouncements') || '[]');
    try {
      const response = await axios.get(`${API}/announcements/active`);
      const unseen = response.data.find(a => !seen.includes(a.id));
      if (unseen) {
        setActiveAnnouncement(unseen);
        setShowAnnouncement(true);
      }
    } catch (e) { console.error(e); }
  };

  const dismissAnnouncement = () => {
    if (activeAnnouncement) {
      const seen = JSON.parse(localStorage.getItem('seenAnnouncements') || '[]');
      seen.push(activeAnnouncement.id);
      localStorage.setItem('seenAnnouncements', JSON.stringify(seen));
    }
    setShowAnnouncement(false);
  };

  // Supabase helpers
  const supabaseFetch = async (endpoint, options = {}) => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    return response;
  };

  const uploadImage = async (file) => {
    const fileName = `${Date.now()}_${file.name}`;
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/images/${fileName}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': file.type
      },
      body: file
    });
    if (response.ok) {
      return `${SUPABASE_URL}/storage/v1/object/public/images/${fileName}`;
    }
    throw new Error('Upload failed');
  };

  // Fetch functions
  const fetchUpdates = async () => {
    try {
      const response = await axios.get(`${API}/updates`);
      setUpdates(response.data);
    } catch (e) { console.error(e); }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(`${API}/announcements`);
      setAnnouncements(response.data);
    } catch (e) { console.error(e); }
  };

  const fetchWorks = async () => {
    try {
      const response = await supabaseFetch('images?select=*&order=created_at.desc');
      const data = await response.json();
      setWorks(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchSocialLinks = async () => {
    try {
      const response = await axios.get(`${API}/social-links`);
      setSocialLinks(response.data);
    } catch (e) { console.error(e); }
  };

  const fetchMessages = async () => {
    try {
      const response = await supabaseFetch('messages?select=*&order=created_at.desc');
      const data = await response.json();
      setMessages(data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (currentPage === 'updates') fetchUpdates();
    if (currentPage === 'gallery') fetchWorks();
    if (currentPage === 'about') fetchSocialLinks();
    if (currentPage === 'admin' && isLoggedIn) {
      fetchWorks();
      fetchMessages();
      fetchUpdates();
      fetchAnnouncements();
      fetchSocialLinks();
    }
  }, [currentPage, isLoggedIn, adminTab]);

  // Login
  const handleLogin = async () => {
    playClick();
    try {
      const response = await axios.post(`${API}/auth/login`, { username, password });
      if (response.data.success) {
        setIsLoggedIn(true);
        setShowLoginModal(false);
        setCurrentPage('admin');
        showToast('مرحباً أيها المطور');
        setUsername('');
        setPassword('');
      }
    } catch (e) {
      showToast('اسم المستخدم أو كلمة المرور خاطئة!');
    }
  };

  const handleLogout = () => {
    playClick();
    setIsLoggedIn(false);
    setCurrentPage('home');
    showToast('تم تسجيل الخروج بنجاح');
  };

  // Works CRUD (Supabase)
  const createWork = async () => {
    playClick();
    if (!newWork.title || !newWorkImage) { 
      showToast('أكمل البيانات واختر صورة أولاً'); 
      return; 
    }
    setUploading(true);
    try {
      const imageUrl = await uploadImage(newWorkImage);
      await supabaseFetch('images', {
        method: 'POST',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          title: newWork.title,
          description: newWork.description,
          category: newWork.category,
          image_url: imageUrl
        })
      });
      showToast('تم إضافة العمل بنجاح');
      setNewWork({ title: '', description: '', category: 'كرت فيزيت' });
      setNewWorkImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchWorks();
    } catch (e) { 
      showToast('حدث خطأ في رفع الصورة'); 
      console.error(e);
    }
    setUploading(false);
  };

  const updateWork = async () => {
    playClick();
    if (!editingWork) return;
    setUploading(true);
    try {
      let imageUrl = editingWork.image_url;
      if (editWorkImage) {
        imageUrl = await uploadImage(editWorkImage);
      }
      await supabaseFetch(`images?id=eq.${editingWork.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editingWork.title,
          description: editingWork.description,
          category: editingWork.category,
          image_url: imageUrl
        })
      });
      showToast('تم تحديث العمل بنجاح');
      setEditingWork(null);
      setEditWorkImage(null);
      fetchWorks();
    } catch (e) { showToast('حدث خطأ'); }
    setUploading(false);
  };

  const deleteWork = async (id) => {
    try {
      await supabaseFetch(`images?id=eq.${id}`, { method: 'DELETE' });
      showToast('تم حذف العمل بنجاح');
      fetchWorks();
    } catch (e) { showToast('حدث خطأ'); }
  };

  // Updates CRUD
  const createUpdate = async () => {
    playClick();
    if (!newUpdate.version || !newUpdate.title) { showToast('أكمل البيانات أولاً'); return; }
    try {
      await axios.post(`${API}/updates`, newUpdate);
      showToast('تم إضافة التحديث بنجاح');
      setNewUpdate({ version: '', title: '', description: '' });
      fetchUpdates();
    } catch (e) { showToast('حدث خطأ'); }
  };

  const updateUpdate = async () => {
    playClick();
    if (!editingUpdate) return;
    try {
      await axios.put(`${API}/updates/${editingUpdate.id}`, editingUpdate);
      showToast('تم تحديث التحديث بنجاح');
      setEditingUpdate(null);
      fetchUpdates();
    } catch (e) { showToast('حدث خطأ'); }
  };

  const deleteUpdate = async (id) => {
    try {
      await axios.delete(`${API}/updates/${id}`);
      showToast('تم حذف التحديث بنجاح');
      fetchUpdates();
    } catch (e) { showToast('حدث خطأ'); }
  };

  // Announcements CRUD
  const createAnnouncement = async () => {
    playClick();
    if (!newAnnouncement.title || !newAnnouncement.button_text) { showToast('أكمل البيانات أولاً'); return; }
    try {
      await axios.post(`${API}/announcements`, { ...newAnnouncement, is_active: true });
      showToast('تم إضافة الإعلان بنجاح');
      setNewAnnouncement({ title: '', description: '', button_text: '', button_link: '' });
      fetchAnnouncements();
    } catch (e) { showToast('حدث خطأ'); }
  };

  const updateAnnouncement = async () => {
    playClick();
    if (!editingAnnouncement) return;
    try {
      await axios.put(`${API}/announcements/${editingAnnouncement.id}`, editingAnnouncement);
      showToast('تم تحديث الإعلان بنجاح');
      setEditingAnnouncement(null);
      fetchAnnouncements();
    } catch (e) { showToast('حدث خطأ'); }
  };

  const deleteAnnouncement = async (id) => {
    try {
      await axios.delete(`${API}/announcements/${id}`);
      showToast('تم حذف الإعلان بنجاح');
      fetchAnnouncements();
    } catch (e) { showToast('حدث خطأ'); }
  };

  const toggleAnnouncementActive = async (ann) => {
    playClick();
    try {
      await axios.put(`${API}/announcements/${ann.id}`, { is_active: !ann.is_active });
      showToast(ann.is_active ? 'تم إيقاف الإعلان' : 'تم تفعيل الإعلان');
      fetchAnnouncements();
    } catch (e) { showToast('حدث خطأ'); }
  };

  // Social Links CRUD
  const createSocialLink = async () => {
    playClick();
    if (!newSocial.platform || !newSocial.url) { showToast('أكمل البيانات أولاً'); return; }
    try {
      await axios.post(`${API}/social-links`, newSocial);
      showToast('تم إضافة الرابط بنجاح');
      setNewSocial({ platform: '', url: '', icon: 'fab fa-facebook' });
      fetchSocialLinks();
    } catch (e) { showToast('حدث خطأ'); }
  };

  const updateSocialLink = async () => {
    playClick();
    if (!editingSocial) return;
    try {
      await axios.put(`${API}/social-links/${editingSocial.id}`, editingSocial);
      showToast('تم تحديث الرابط بنجاح');
      setEditingSocial(null);
      fetchSocialLinks();
    } catch (e) { showToast('حدث خطأ'); }
  };

  const deleteSocialLink = async (id) => {
    try {
      await axios.delete(`${API}/social-links/${id}`);
      showToast('تم حذف الرابط بنجاح');
      fetchSocialLinks();
    } catch (e) { showToast('حدث خطأ'); }
  };

  // Contact
  const submitContact = async () => {
    playClick();
    if (!contactName || !contactPhone) { showToast('أكمل البيانات أولاً'); return; }
    try {
      await supabaseFetch('messages', {
        method: 'POST',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({ name: contactName, phone: contactPhone, message: contactMessage })
      });
      showToast('تم إرسال رسالتك بنجاح');
      setContactName(''); setContactPhone(''); setContactMessage('');
    } catch (e) { showToast('حدث خطأ'); }
  };

  const deleteMessage = async (id) => {
    try {
      await supabaseFetch(`messages?id=eq.${id}`, { method: 'DELETE' });
      showToast('تم حذف الرسالة بنجاح');
      fetchMessages();
    } catch (e) { showToast('حدث خطأ'); }
  };

  const confirmDelete = () => {
    playClick();
    if (deleteModal.type === 'update') deleteUpdate(deleteModal.id);
    else if (deleteModal.type === 'announcement') deleteAnnouncement(deleteModal.id);
    else if (deleteModal.type === 'work') deleteWork(deleteModal.id);
    else if (deleteModal.type === 'social') deleteSocialLink(deleteModal.id);
    else if (deleteModal.type === 'message') deleteMessage(deleteModal.id);
    setDeleteModal({ show: false, type: '', id: '' });
  };

  const filteredWorks = selectedCategory === 'الكل' ? works : works.filter(w => w.category === selectedCategory);

  const navigateTo = (page) => {
    playClick();
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="app" dir="rtl">
      <audio ref={audioRef} src={CLICK_SOUND_URL} preload="auto" />

      {/* Intro */}
      {showIntro && (
        <div className="intro-overlay" data-testid="intro-overlay">
          <div className="intro-content">
            <h1 className="glitch-title">LAMSAT FANN</h1>
            <div className="luxury-line"></div>
            <p className="reveal-text">أهلاً بك في عالم التصميم.. حيث تضيع الحدود بين الخيال والواقع</p>
          </div>
        </div>
      )}

      {/* Announcement */}
      {showAnnouncement && activeAnnouncement && (
        <div className="modal-overlay" data-testid="announcement-modal">
          <div className="announcement-box">
            <div className="announcement-icon"><i className="fas fa-bullhorn"></i></div>
            <h3 className="announcement-title">{activeAnnouncement.title}</h3>
            <p className="announcement-desc">{activeAnnouncement.description}</p>
            <div className="announcement-actions">
              <button className="announcement-btn primary" onClick={() => { playClick(); dismissAnnouncement(); if (activeAnnouncement.button_link) navigateTo(activeAnnouncement.button_link); }}>
                {activeAnnouncement.button_text}
              </button>
              <button className="announcement-btn secondary" onClick={() => { playClick(); dismissAnnouncement(); }}>إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast-container"><div className="toast"><i className="fas fa-info-circle"></i> {toast}</div></div>}

      {/* Nav - ترتيب جديد */}
      <nav className="luxury-nav">
        <button className="mobile-menu-btn" data-testid="mobile-menu-btn" onClick={() => { playClick(); setMobileMenuOpen(!mobileMenuOpen); }}>
          <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
        <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
          <button className="nav-btn" data-testid="nav-home" onClick={() => navigateTo('home')}>الرئيسية</button>
          <button className="nav-btn" data-testid="nav-gallery" onClick={() => navigateTo('gallery')}>المعرض</button>
          <button className="nav-btn" data-testid="nav-contact" onClick={() => navigateTo('contact')}>تواصل معنا</button>
          <button className="nav-btn" data-testid="nav-about" onClick={() => navigateTo('about')}>معلومات عننا</button>
          <button className="nav-btn" data-testid="nav-updates" onClick={() => navigateTo('updates')}>التحديثات</button>
          <button className="gear-btn" data-testid="nav-admin" onClick={() => { playClick(); isLoggedIn ? navigateTo('admin') : setShowLoginModal(true); }}>
            <i className="fas fa-cog"></i> المطور
          </button>
        </div>
      </nav>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay" data-testid="login-modal">
          <div className="glass-box modal-content">
            <h3>دخول المطور</h3>
            <input type="text" placeholder="اسم المستخدم" value={username} onChange={(e) => setUsername(e.target.value)} data-testid="login-username" />
            <input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password" />
            <div className="modal-actions">
              <button className="submit-btn" data-testid="login-submit" onClick={handleLogin}>دخول</button>
              <button className="cancel-btn" onClick={() => { playClick(); setShowLoginModal(false); }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.show && (
        <div className="modal-overlay" data-testid="delete-modal">
          <div className="glass-box modal-content">
            <h3>تأكيد الحذف</h3>
            <p>هل أنت متأكد من الحذف؟</p>
            <div className="modal-actions">
              <button className="btn-delete" data-testid="confirm-delete" onClick={confirmDelete}>حذف</button>
              <button className="cancel-btn" onClick={() => { playClick(); setDeleteModal({ show: false, type: '', id: '' }); }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div className="lightbox-overlay" data-testid="lightbox" onClick={() => setLightboxImage(null)}>
          <span className="close-lightbox" onClick={() => setLightboxImage(null)}>✕</span>
          <img src={lightboxImage} alt="Preview" />
        </div>
      )}

      {/* Main Content */}
      <main className="content-area">
        {/* Home */}
        {currentPage === 'home' && (
          <section className="page active" data-testid="home-page">
            <div className="hero-section">
              <img src="https://customer-assets.emergentagent.com/job_2f9a6599-6bc4-4224-8bce-b59cd468f774/artifacts/1775941528753.png" className="hero-logo" alt="Logo" />
              <h1 className="main-title decorated"><span>لمسة فن</span></h1>
              <p className="hero-subtitle">حيث ينتهي التقليد.. يبدأ الإبداع. لمسة فن: بصمتك الاستثنائية في عالمٍ من الألوان</p>
              <button className="pulse-button" data-testid="explore-works-btn" onClick={() => navigateTo('gallery')}>استعرض أعمالنا</button>
            </div>
          </section>
        )}

        {/* Gallery */}
        {currentPage === 'gallery' && (
          <section className="page active" data-testid="gallery-page">
            <h2 className="section-header glow-text">تصفح اعمالنا التي لا مثيل لها</h2>
            <p className="hero-subtitle center-text">ابحث بين الاقسام</p>
            <div className="filter-container">
              <select value={selectedCategory} onChange={(e) => { playClick(); setSelectedCategory(e.target.value); }} className="category-select" data-testid="category-filter">
                <option value="الكل">الكل</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="dynamic-grid">
              {filteredWorks.map(item => (
                <div key={item.id} className="product-card" data-testid={`gallery-item-${item.id}`}>
                  <img src={item.image_url} alt={item.title} onClick={() => setLightboxImage(item.image_url)} />
                  <div className="card-content">
                    <span className="category-label">{item.category || 'آخر'}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
              {filteredWorks.length === 0 && <p className="no-data">لا توجد أعمال</p>}
            </div>
          </section>
        )}

        {/* Contact */}
        {currentPage === 'contact' && (
          <section className="page active" data-testid="contact-page">
            <div className="contact-container">
              <div className="contact-info-row glass-box">
                <div className="info-card"><i className="fas fa-map-marker-alt"></i> حلب - باب النصر - امام الباب الاثري</div>
                <div className="info-card"><i className="fas fa-phone"></i> 0980428648</div>
              </div>
              <div className="contact-form glass-box">
                <h3>أرسل لنا استفسارك</h3>
                <input type="text" placeholder="الاسم الكامل" value={contactName} onChange={(e) => setContactName(e.target.value)} data-testid="contact-name" />
                <input type="text" placeholder="رقم الهاتف" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} data-testid="contact-phone" />
                <textarea placeholder="كيف يمكننا مساعدتك؟" value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} data-testid="contact-message" />
                <button className="submit-btn" data-testid="contact-submit" onClick={submitContact}>إرسال الرسالة</button>
              </div>
            </div>
          </section>
        )}

        {/* About */}
        {currentPage === 'about' && (
          <section className="page active" data-testid="about-page">
            <h2 className="section-header glow-text">معلومات عننا</h2>
            <div className="about-container">
              <div className="about-content glass-box">
                <div className="about-logo">
                  <img src="https://customer-assets.emergentagent.com/job_2f9a6599-6bc4-4224-8bce-b59cd468f774/artifacts/1775941528753.png" alt="Logo" />
                </div>
                <h3>لمسة فن</h3>
                <p className="about-text">نحن متخصصون في تصميم وطباعة جميع أنواع المطبوعات بأعلى جودة وأفضل الأسعار. من كروت الفيزيت إلى الفلكسات الكبيرة، نقدم لكم خدمات تصميم احترافية تلبي جميع احتياجاتكم.</p>
                <div className="about-info">
                  <div className="info-item"><i className="fas fa-map-marker-alt"></i> حلب - باب النصر - امام الباب الاثري</div>
                  <div className="info-item"><i className="fas fa-phone"></i> 0980428648</div>
                </div>
                <h4>تابعنا على</h4>
                <div className="social-links">
                  {socialLinks.map(link => (
                    <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="social-link" title={link.platform} onClick={playClick}>
                      <i className={link.icon}></i>
                    </a>
                  ))}
                  {socialLinks.length === 0 && <p className="no-data-small">لا توجد روابط</p>}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Updates */}
        {currentPage === 'updates' && (
          <section className="page active" data-testid="updates-page">
            <h2 className="section-header glow-text">التحديثات</h2>
            <p className="hero-subtitle center-text">آخر التحديثات والإصدارات</p>
            <div className="updates-list">
              {updates.map(update => (
                <div key={update.id} className="update-card glass-box" data-testid={`update-card-${update.id}`}>
                  <div className="update-version">{update.version}</div>
                  <h3 className="update-title">{update.title}</h3>
                  <p className="update-desc">{update.description}</p>
                </div>
              ))}
              {updates.length === 0 && <p className="no-data">لا توجد تحديثات حالياً</p>}
            </div>
          </section>
        )}

        {/* Admin */}
        {currentPage === 'admin' && isLoggedIn && (
          <section className="page active" data-testid="admin-page">
            <div className="admin-dashboard glass-box">
              <div className="admin-nav-internal">
                <button className="logout-btn" data-testid="logout-btn" onClick={handleLogout}>خروج آمن <i className="fas fa-sign-out-alt"></i></button>
                <div className="admin-tabs">
                  <button className={`tab-link ${adminTab === 'works' ? 'active' : ''}`} data-testid="tab-works" onClick={() => { playClick(); setAdminTab('works'); }}>إدارة الأعمال</button>
                  <button className={`tab-link ${adminTab === 'messages' ? 'active' : ''}`} data-testid="tab-messages" onClick={() => { playClick(); setAdminTab('messages'); }}>صندوق الرسائل</button>
                  <button className={`tab-link ${adminTab === 'updates' ? 'active' : ''}`} data-testid="tab-updates" onClick={() => { playClick(); setAdminTab('updates'); }}>إعدادات التحديثات</button>
                  <button className={`tab-link ${adminTab === 'announcements' ? 'active' : ''}`} data-testid="tab-announcements" onClick={() => { playClick(); setAdminTab('announcements'); }}>الإعلانات</button>
                  <button className={`tab-link ${adminTab === 'social' ? 'active' : ''}`} data-testid="tab-social" onClick={() => { playClick(); setAdminTab('social'); }}>روابط التواصل</button>
                </div>
              </div>

              <div className="admin-content">
                {/* Works Tab */}
                {adminTab === 'works' && (
                  <div data-testid="admin-works-tab">
                    <div className="admin-form glass-box">
                      <h4>{editingWork ? 'تعديل العمل' : 'إضافة عمل جديد'}</h4>
                      <input type="text" placeholder="عنوان العمل" value={editingWork ? editingWork.title : newWork.title} onChange={(e) => editingWork ? setEditingWork({...editingWork, title: e.target.value}) : setNewWork({...newWork, title: e.target.value})} data-testid="work-title" />
                      <textarea placeholder="وصف العمل" value={editingWork ? editingWork.description : newWork.description} onChange={(e) => editingWork ? setEditingWork({...editingWork, description: e.target.value}) : setNewWork({...newWork, description: e.target.value})} data-testid="work-description" />
                      <select className="category-select full-width" value={editingWork ? editingWork.category : newWork.category} onChange={(e) => editingWork ? setEditingWork({...editingWork, category: e.target.value}) : setNewWork({...newWork, category: e.target.value})} data-testid="work-category">
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      
                      {/* File Upload */}
                      <div className="file-upload-container">
                        <label className="file-upload-label">
                          <i className="fas fa-cloud-upload-alt"></i>
                          {editingWork ? (editWorkImage ? editWorkImage.name : 'اختر صورة جديدة (اختياري)') : (newWorkImage ? newWorkImage.name : 'اختر صورة العمل')}
                          <input 
                            type="file" 
                            accept="image/*"
                            ref={editingWork ? editFileInputRef : fileInputRef}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                if (editingWork) {
                                  setEditWorkImage(file);
                                } else {
                                  setNewWorkImage(file);
                                }
                              }
                            }}
                            style={{ display: 'none' }}
                          />
                        </label>
                        {editingWork && editingWork.image_url && (
                          <img src={editingWork.image_url} alt="Current" className="preview-image" />
                        )}
                      </div>

                      <div className="modal-actions">
                        <button className="submit-btn" data-testid="save-work-btn" onClick={editingWork ? updateWork : createWork} disabled={uploading}>
                          {uploading ? 'جاري الرفع...' : (editingWork ? 'حفظ التعديلات' : 'إضافة العمل')}
                        </button>
                        {editingWork && <button className="cancel-btn" onClick={() => { playClick(); setEditingWork(null); setEditWorkImage(null); }}>إلغاء</button>}
                      </div>
                    </div>
                    <div className="admin-grid">
                      {works.map(item => (
                        <div key={item.id} className="product-card">
                          <img src={item.image_url} alt={item.title} />
                          <div className="card-content">
                            <h4>{item.title}</h4>
                            <span className="category-label">{item.category || 'آخر'}</span>
                          </div>
                          <div className="card-actions">
                            <button className="btn-edit" data-testid={`edit-work-${item.id}`} onClick={() => { playClick(); setEditingWork(item); }}>تعديل</button>
                            <button className="btn-delete" data-testid={`delete-work-${item.id}`} onClick={() => { playClick(); setDeleteModal({ show: true, type: 'work', id: item.id }); }}>حذف</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages Tab */}
                {adminTab === 'messages' && (
                  <div data-testid="admin-messages-tab">
                    {messages.map(msg => (
                      <div key={msg.id} className="message-card glass-box">
                        <p><strong>{msg.name}</strong> ({msg.phone})</p>
                        <p>{msg.message}</p>
                        <button className="btn-delete" data-testid={`delete-message-${msg.id}`} onClick={() => { playClick(); setDeleteModal({ show: true, type: 'message', id: msg.id }); }}><i className="fas fa-trash"></i> حذف الرسالة</button>
                      </div>
                    ))}
                    {messages.length === 0 && <p className="no-data">لا توجد رسائل</p>}
                  </div>
                )}

                {/* Updates Tab */}
                {adminTab === 'updates' && (
                  <div data-testid="admin-updates-tab">
                    <div className="admin-form glass-box">
                      <h4>إضافة تحديث جديد</h4>
                      <input type="text" placeholder="إصدار التحديث (مثال: v1.0)" value={newUpdate.version} onChange={(e) => setNewUpdate({...newUpdate, version: e.target.value})} data-testid="new-update-version" />
                      <input type="text" placeholder="عنوان التحديث" value={newUpdate.title} onChange={(e) => setNewUpdate({...newUpdate, title: e.target.value})} data-testid="new-update-title" />
                      <textarea placeholder="وصف التحديث" value={newUpdate.description} onChange={(e) => setNewUpdate({...newUpdate, description: e.target.value})} data-testid="new-update-description" />
                      <button className="submit-btn" data-testid="create-update-btn" onClick={createUpdate}>نشر التحديث</button>
                    </div>
                    <div className="updates-admin-list">
                      {updates.map(update => (
                        <div key={update.id} className="update-admin-card glass-box">
                          <div className="update-info">
                            <span className="update-version">{update.version}</span>
                            <h4>{update.title}</h4>
                            <p>{update.description}</p>
                          </div>
                          <div className="update-actions">
                            <button className="btn-edit" data-testid={`edit-update-${update.id}`} onClick={() => { playClick(); setEditingUpdate(update); }}>تعديل</button>
                            <button className="btn-delete" data-testid={`delete-update-${update.id}`} onClick={() => { playClick(); setDeleteModal({ show: true, type: 'update', id: update.id }); }}>حذف</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Announcements Tab */}
                {adminTab === 'announcements' && (
                  <div data-testid="admin-announcements-tab">
                    <div className="admin-form glass-box">
                      <h4>إضافة إعلان جديد</h4>
                      <input type="text" placeholder="عنوان الإعلان" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})} data-testid="new-announcement-title" />
                      <textarea placeholder="وصف الإعلان" value={newAnnouncement.description} onChange={(e) => setNewAnnouncement({...newAnnouncement, description: e.target.value})} data-testid="new-announcement-description" />
                      <input type="text" placeholder="نص الزر" value={newAnnouncement.button_text} onChange={(e) => setNewAnnouncement({...newAnnouncement, button_text: e.target.value})} data-testid="new-announcement-button-text" />
                      <select value={newAnnouncement.button_link} onChange={(e) => setNewAnnouncement({...newAnnouncement, button_link: e.target.value})} className="category-select full-width" data-testid="new-announcement-button-link">
                        <option value="">اختر الصفحة الهدف</option>
                        <option value="home">الرئيسية</option>
                        <option value="gallery">المعرض</option>
                        <option value="contact">تواصل معنا</option>
                        <option value="about">معلومات عننا</option>
                        <option value="updates">التحديثات</option>
                      </select>
                      <button className="submit-btn" data-testid="create-announcement-btn" onClick={createAnnouncement}>نشر الإعلان</button>
                    </div>
                    <div className="announcements-admin-list">
                      {announcements.map(ann => (
                        <div key={ann.id} className={`announcement-admin-card glass-box ${ann.is_active ? 'active' : 'inactive'}`}>
                          <div className="announcement-info">
                            <span className={`status-badge ${ann.is_active ? 'active' : 'inactive'}`}>{ann.is_active ? 'مفعل' : 'متوقف'}</span>
                            <h4>{ann.title}</h4>
                            <p>{ann.description}</p>
                            <small>الزر: {ann.button_text} → {ann.button_link}</small>
                          </div>
                          <div className="announcement-actions">
                            <button className={`btn-toggle ${ann.is_active ? 'active' : ''}`} data-testid={`toggle-announcement-${ann.id}`} onClick={() => toggleAnnouncementActive(ann)}>{ann.is_active ? 'إيقاف' : 'تفعيل'}</button>
                            <button className="btn-edit" data-testid={`edit-announcement-${ann.id}`} onClick={() => { playClick(); setEditingAnnouncement(ann); }}>تعديل</button>
                            <button className="btn-delete" data-testid={`delete-announcement-${ann.id}`} onClick={() => { playClick(); setDeleteModal({ show: true, type: 'announcement', id: ann.id }); }}>حذف</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Tab */}
                {adminTab === 'social' && (
                  <div data-testid="admin-social-tab">
                    <div className="admin-form glass-box">
                      <h4>{editingSocial ? 'تعديل الرابط' : 'إضافة رابط جديد'}</h4>
                      <input type="text" placeholder="اسم المنصة (مثال: فيسبوك)" value={editingSocial ? editingSocial.platform : newSocial.platform} onChange={(e) => editingSocial ? setEditingSocial({...editingSocial, platform: e.target.value}) : setNewSocial({...newSocial, platform: e.target.value})} data-testid="social-platform" />
                      <input type="text" placeholder="رابط الحساب" value={editingSocial ? editingSocial.url : newSocial.url} onChange={(e) => editingSocial ? setEditingSocial({...editingSocial, url: e.target.value}) : setNewSocial({...newSocial, url: e.target.value})} data-testid="social-url" />
                      <select className="category-select full-width" value={editingSocial ? editingSocial.icon : newSocial.icon} onChange={(e) => editingSocial ? setEditingSocial({...editingSocial, icon: e.target.value}) : setNewSocial({...newSocial, icon: e.target.value})} data-testid="social-icon">
                        {socialIcons.map(icon => <option key={icon.value} value={icon.value}>{icon.label}</option>)}
                      </select>
                      <div className="modal-actions">
                        <button className="submit-btn" data-testid="save-social-btn" onClick={editingSocial ? updateSocialLink : createSocialLink}>{editingSocial ? 'حفظ التعديلات' : 'إضافة الرابط'}</button>
                        {editingSocial && <button className="cancel-btn" onClick={() => { playClick(); setEditingSocial(null); }}>إلغاء</button>}
                      </div>
                    </div>
                    <div className="social-admin-list">
                      {socialLinks.map(link => (
                        <div key={link.id} className="social-admin-card glass-box">
                          <div className="social-info">
                            <h4><i className={link.icon}></i> {link.platform}</h4>
                            <small>{link.url}</small>
                          </div>
                          <div className="social-actions">
                            <button className="btn-edit" data-testid={`edit-social-${link.id}`} onClick={() => { playClick(); setEditingSocial(link); }}>تعديل</button>
                            <button className="btn-delete" data-testid={`delete-social-${link.id}`} onClick={() => { playClick(); setDeleteModal({ show: true, type: 'social', id: link.id }); }}>حذف</button>
                          </div>
                        </div>
                      ))}
                      {socialLinks.length === 0 && <p className="no-data">لا توجد روابط</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Edit Update Modal */}
      {editingUpdate && (
        <div className="modal-overlay" data-testid="edit-update-modal">
          <div className="glass-box modal-content">
            <h3>تعديل التحديث</h3>
            <input type="text" placeholder="إصدار التحديث" value={editingUpdate.version} onChange={(e) => setEditingUpdate({...editingUpdate, version: e.target.value})} />
            <input type="text" placeholder="عنوان التحديث" value={editingUpdate.title} onChange={(e) => setEditingUpdate({...editingUpdate, title: e.target.value})} />
            <textarea placeholder="وصف التحديث" value={editingUpdate.description} onChange={(e) => setEditingUpdate({...editingUpdate, description: e.target.value})} />
            <div className="modal-actions">
              <button className="submit-btn" onClick={updateUpdate}>حفظ التعديلات</button>
              <button className="cancel-btn" onClick={() => { playClick(); setEditingUpdate(null); }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Announcement Modal */}
      {editingAnnouncement && (
        <div className="modal-overlay" data-testid="edit-announcement-modal">
          <div className="glass-box modal-content">
            <h3>تعديل الإعلان</h3>
            <input type="text" placeholder="عنوان الإعلان" value={editingAnnouncement.title} onChange={(e) => setEditingAnnouncement({...editingAnnouncement, title: e.target.value})} />
            <textarea placeholder="وصف الإعلان" value={editingAnnouncement.description} onChange={(e) => setEditingAnnouncement({...editingAnnouncement, description: e.target.value})} />
            <input type="text" placeholder="نص الزر" value={editingAnnouncement.button_text} onChange={(e) => setEditingAnnouncement({...editingAnnouncement, button_text: e.target.value})} />
            <select value={editingAnnouncement.button_link} onChange={(e) => setEditingAnnouncement({...editingAnnouncement, button_link: e.target.value})} className="category-select full-width">
              <option value="">اختر الصفحة الهدف</option>
              <option value="home">الرئيسية</option>
              <option value="gallery">المعرض</option>
              <option value="contact">تواصل معنا</option>
              <option value="about">معلومات عننا</option>
              <option value="updates">التحديثات</option>
            </select>
            <div className="modal-actions">
              <button className="submit-btn" onClick={updateAnnouncement}>حفظ التعديلات</button>
              <button className="cancel-btn" onClick={() => { playClick(); setEditingAnnouncement(null); }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp */}
      <a href="https://wa.me/963980428648" className="whatsapp-float" target="_blank" rel="noopener noreferrer" onClick={playClick}>
        <i className="fab fa-whatsapp"></i>
      </a>
    </div>
  );
}

export default App;
