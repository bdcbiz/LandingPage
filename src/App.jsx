import { useState, useEffect, useRef } from 'react'
import './App.css'

// ===== Scroll Reveal Hook =====
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold }
    )
    const targets = el.querySelectorAll('.reveal')
    targets.forEach((t) => observer.observe(t))
    return () => observer.disconnect()
  }, [threshold])
  return ref
}

// ===== Ripple Utility =====
function createRipple(e) {
  const btn = e.currentTarget
  const rect = btn.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = e.clientX - rect.left - size / 2
  const y = e.clientY - rect.top - size / 2
  const span = document.createElement('span')
  span.className = 'ripple-span'
  span.style.width = span.style.height = `${size}px`
  span.style.left = `${x}px`
  span.style.top = `${y}px`
  btn.appendChild(span)
  span.addEventListener('animationend', () => span.remove())
}

const API = {
  checkUser: '/api/v1/auth/check-user',
  otpRequest: '/api/v1/auth/otp/request',
  otpVerify: '/api/v1/auth/otp/verify',
  registerVerify: '/api/v1/auth/v2/register/verify',
  registerComplete: '/api/v1/auth/v2/register/complete',
  formData: '/api/v1/auth/school/form-data',
  stages: '/api/v1/auth/school/stages',
  grades: '/api/v1/auth/school/levels',
  subjects: '/api/v1/auth/onboarding/subjects',
  onboardingStep: '/api/v1/auth/onboarding/step/teaching_info',
  onboardingComplete: '/api/v1/auth/onboarding/complete',
}

function MultiSelect({ options, selected, onChange, loading, placeholder }) {
  if (loading) return <p className="cascade-loading">جاري التحميل...</p>
  if (!options.length) return null
  return (
    <div className="multi-chips">
      {options.map(opt => (
        <label
          key={opt.id}
          className={`stage-chip ${selected.includes(opt.id) ? 'active' : ''}`}
        >
          <input
            type="checkbox"
            checked={selected.includes(opt.id)}
            onChange={() => {
              onChange(selected.includes(opt.id)
                ? selected.filter(id => id !== opt.id)
                : [...selected, opt.id]
              )
            }}
          />
          {opt.name_ar || opt.name}
        </label>
      ))}
    </div>
  )
}

function LeadForm() {
  // Steps: 'phone' → 'otp' → 'info' → 'success'
  const [step, setStep] = useState('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [phoneInfo, setPhoneInfo] = useState('')
  const [token, setToken] = useState('')
  const submittingRef = useRef(false)

  // Phone
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+20')
  const [countries, setCountries] = useState([])
  const [isNewUser, setIsNewUser] = useState(false)
  const [verificationToken, setVerificationToken] = useState('')

  // OTP
  const [otp, setOtp] = useState('')
  const [countdown, setCountdown] = useState(0)
  const otpRef = useRef(null)

  // Name
  const [firstName, setFirstName] = useState('')
  const [fatherName, setFatherName] = useState('')
  const [grandfatherName, setGrandfatherName] = useState('')

  // Cascading data
  const [systemsOpts, setSystemsOpts] = useState([])
  const [stagesOpts, setStagesOpts] = useState([])
  const [gradesOpts, setGradesOpts] = useState([])
  const [subjectsOpts, setSubjectsOpts] = useState([])

  const [selectedSystems, setSelectedSystems] = useState([])
  const [selectedStages, setSelectedStages] = useState([])
  const [selectedGrades, setSelectedGrades] = useState([])
  const [selectedSubjects, setSelectedSubjects] = useState([])

  const [loadingSystems, setLoadingSystems] = useState(false)
  const [loadingStages, setLoadingStages] = useState(false)
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [loadingSubjects, setLoadingSubjects] = useState(false)

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  // Fetch countries on mount
  useEffect(() => {
    fetch(API.formData, { headers: { Accept: 'application/json' } })
      .then(r => r.json())
      .then(d => {
        setCountries(d.data?.countries || [])
        setSystemsOpts(d.data?.education_systems || [])
      })
      .catch(() => {})
  }, [])

  // Fetch education systems when entering info step (if not already loaded)
  useEffect(() => {
    if (step !== 'info' || systemsOpts.length) return
    setLoadingSystems(true)
    fetch(API.formData, { headers: { Accept: 'application/json' } })
      .then(r => r.json())
      .then(d => {
        setSystemsOpts(d.data?.education_systems || [])
        if (!countries.length) setCountries(d.data?.countries || [])
      })
      .catch(() => {})
      .finally(() => setLoadingSystems(false))
  }, [step])

  // Fetch stages when systems change
  useEffect(() => {
    if (!selectedSystems.length) { setStagesOpts([]); setSelectedStages([]); return }
    setLoadingStages(true)
    setSelectedStages([]); setGradesOpts([]); setSelectedGrades([]); setSubjectsOpts([]); setSelectedSubjects([])
    fetch(API.stages, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ systems: selectedSystems })
    })
      .then(r => r.json())
      .then(d => setStagesOpts(d.data || []))
      .catch(() => {})
      .finally(() => setLoadingStages(false))
  }, [selectedSystems])

  // Fetch grades when stages change
  useEffect(() => {
    if (!selectedStages.length) { setGradesOpts([]); setSelectedGrades([]); return }
    setLoadingGrades(true)
    setSelectedGrades([]); setSubjectsOpts([]); setSelectedSubjects([])
    fetch(API.grades, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ stages: selectedStages })
    })
      .then(r => r.json())
      .then(d => {
        const levels = (d.data || []).flatMap(group => group.levels || [])
        setGradesOpts(levels)
      })
      .catch(() => {})
      .finally(() => setLoadingGrades(false))
  }, [selectedStages])

  // Fetch subjects when grades change (needs token)
  useEffect(() => {
    if (!selectedGrades.length) { setSubjectsOpts([]); setSelectedSubjects([]); return }
    setLoadingSubjects(true)
    setSelectedSubjects([])
    const params = selectedGrades.map(id => `grade_ids[]=${id}`).join('&')
    fetch(`${API.subjects}?${params}`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        const subjects = d.data?.subjects || d.data || []
        // Map value/label to id/name for MultiSelect compatibility
        const mapped = subjects.map(s => ({ id: s.value || s.id, name: s.label || s.name }))
        setSubjectsOpts(mapped)
      })
      .catch(() => {})
      .finally(() => setLoadingSubjects(false))
  }, [selectedGrades, token])

  const authHeaders = { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` }

  // === Step 1: Request OTP ===
  const handlePhoneSubmit = async (e) => {
    e.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    setLoading(true); setError(''); setPhoneInfo('')
    try {
      const payload = { phone, country_code: countryCode }
      // Check if user exists first (without sending OTP)
      const checkRes = await fetch(API.checkUser, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      })
      const checkData = await checkRes.json()
      if (checkRes.ok && checkData.data?.exists) {
        setPhoneInfo('هذا الرقم مسجّل بالفعل. يمكنك استخدامه لتسجيل الدخول من خلال التطبيق.')
        return
      }
      // New user — send OTP
      const res = await fetch(API.otpRequest, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.errors) { const f = Object.values(data.errors)[0]; throw new Error(Array.isArray(f) ? f[0] : f) }
        throw new Error(data.message || 'حدث خطأ، حاول مرة أخرى')
      }
      setIsNewUser(true)
      setCountdown(300)
      setStep('otp')
      setTimeout(() => otpRef.current?.focus(), 100)
    } catch (err) { setError(err.message) }
    finally { setLoading(false); submittingRef.current = false }
  }

  // === Step 2: Verify OTP → get token ===
  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    if (otp.length < 4) { setError('يرجى إدخال رمز التحقق كاملاً'); return }
    setLoading(true); setError('')
    try {
      const payload = { phone, code: otp, country_code: countryCode }
      const verifyUrl = isNewUser ? API.registerVerify : API.otpVerify
      console.log('OTP Verify payload:', payload, 'endpoint:', verifyUrl)
      const res = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      console.log('OTP Verify FULL response:', JSON.stringify(data, null, 2))
      if (!res.ok) throw new Error(data.message || 'رمز التحقق غير صحيح')
      if (isNewUser && data.data?.verification_token) {
        // New user — need to complete registration first
        setVerificationToken(data.data.verification_token)
        setStep('register')
      } else {
        // Existing user — already has auth token
        const t = data.data?.token || data.data?.access_token || data.token || ''
        setToken(t)
        setStep('info')
      }
    } catch (err) { setError(err.message) }
    finally { setLoading(false); submittingRef.current = false }
  }

  // === Step 2b: Complete Registration (new users) ===
  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    setLoading(true); setError('')
    try {
      const payload = {
        verification_token: verificationToken,
        phone,
        country_code: countryCode,
        username: phone.replace(/^0/, ''),
        first_name: firstName,
        father_name: fatherName,
        grandfather_name: grandfatherName,
        role: 'teacher',
      }
      const res = await fetch(API.registerComplete, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.errors) { const f = Object.values(data.errors)[0]; throw new Error(Array.isArray(f) ? f[0] : f) }
        throw new Error(data.message || 'حدث خطأ في التسجيل')
      }
      setToken(data.data?.token || data.token || '')
      setStep('info')
    } catch (err) { setError(err.message) }
    finally { setLoading(false); submittingRef.current = false }
  }

  // Resend OTP
  const handleResend = async () => {
    if (countdown > 0) return
    setError('')
    try {
      await fetch(API.otpRequest, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ phone, country_code: countryCode })
      })
      setCountdown(300)
    } catch { setError('فشل إعادة إرسال الرمز') }
  }

  // === Step 3: Save onboarding info ===
  const handleInfoSubmit = async (e) => {
    e.preventDefault()
    if (!selectedSystems.length || !selectedStages.length || !selectedGrades.length || !selectedSubjects.length) {
      setError('يرجى ملء جميع الحقول'); return
    }
    setLoading(true); setError('')
    try {
      // Save teaching info
      const res = await fetch(API.onboardingStep, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          first_name: firstName,
          father_name: fatherName,
          grandfather_name: grandfatherName,
          role: 'teacher',
          education_systems: selectedSystems,
          stages: selectedStages,
          grades: selectedGrades,
          subjects: selectedSubjects,
        })
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.errors) { const f = Object.values(data.errors)[0]; throw new Error(Array.isArray(f) ? f[0] : f) }
        throw new Error(data.message || 'حدث خطأ، حاول مرة أخرى')
      }
      // Complete onboarding
      await fetch(API.onboardingComplete, { method: 'POST', headers: authHeaders, body: JSON.stringify({ role: 'teacher' }) })
      setStep('success')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const maskPhone = (p) => {
    if (p.length <= 6) return p
    return p.slice(0, 4) + '****' + p.slice(-3)
  }

  // ========== RENDER ==========

  // === OTP Step ===
  if (step === 'otp') {
    return (
      <form className="form-card otp-card" onSubmit={handleOtpSubmit}>
        <div className="otp-icon">📱</div>
        <h3>أدخل رمز التحقق</h3>
        <p className="otp-subtitle">تم إرسال رمز التحقق إلى <strong dir="ltr">{maskPhone(phone)}</strong></p>
        <div className="form-group otp-input-group">
          <input ref={otpRef} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={4} placeholder="- - - -" className="otp-input" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))} />
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className={`btn-submit${loading ? ' is-loading' : ''}`} disabled={loading || otp.length < 4} onClick={createRipple}>{loading ? 'جاري التحقق...' : 'تأكيد'}</button>
        <div className="otp-resend">
          {countdown > 0
            ? <span className="otp-countdown">إعادة الإرسال خلال {countdown} ثانية</span>
            : <button type="button" className="otp-resend-btn" onClick={handleResend}>إعادة إرسال الرمز</button>
          }
        </div>
        <button type="button" className="otp-back-btn" onClick={() => { setStep('phone'); setError(''); setOtp('') }}>تعديل رقم الهاتف</button>
      </form>
    )
  }

  // === Register Step (new users) ===
  if (step === 'register') {
    return (
      <form className="form-card" onSubmit={handleRegisterSubmit}>
        <h3>أكمل تسجيلك</h3>
        <div className="form-group floating">
          <input type="text" placeholder=" " required value={firstName} onChange={e => setFirstName(e.target.value)} />
          <label>الاسم الأول</label>
        </div>
        <div className="form-group floating">
          <input type="text" placeholder=" " required value={fatherName} onChange={e => setFatherName(e.target.value)} />
          <label>اسم الأب</label>
        </div>
        <div className="form-group floating">
          <input type="text" placeholder=" " required value={grandfatherName} onChange={e => setGrandfatherName(e.target.value)} />
          <label>اسم الجد</label>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className={`btn-submit${loading ? ' is-loading' : ''}`} disabled={loading || !firstName.trim() || !fatherName.trim() || !grandfatherName.trim()} onClick={createRipple}>{loading ? 'جاري التسجيل...' : 'تسجيل'}</button>
      </form>
    )
  }

  // === Info / Onboarding Step ===
  if (step === 'info') {
    return (
      <form className="form-card info-card" onSubmit={handleInfoSubmit}>
        <h3>اختر تخصصك</h3>

        <div className="form-group">
          <label className="form-label">النظام التعليمي</label>
          <MultiSelect options={systemsOpts} selected={selectedSystems} onChange={setSelectedSystems} loading={loadingSystems} />
        </div>

        {selectedSystems.length > 0 && (
          <div className="form-group">
            <label className="form-label">المرحلة الدراسية</label>
            <MultiSelect options={stagesOpts} selected={selectedStages} onChange={setSelectedStages} loading={loadingStages} />
          </div>
        )}

        {selectedStages.length > 0 && (
          <div className="form-group">
            <label className="form-label">الصفوف الدراسية</label>
            <MultiSelect options={gradesOpts} selected={selectedGrades} onChange={setSelectedGrades} loading={loadingGrades} />
          </div>
        )}

        {selectedGrades.length > 0 && (
          <div className="form-group">
            <label className="form-label">المواد</label>
            <MultiSelect options={subjectsOpts} selected={selectedSubjects} onChange={setSelectedSubjects} loading={loadingSubjects} />
          </div>
        )}

        {error && <p className="form-error">{error}</p>}
        <button type="submit" className={`btn-submit${loading ? ' is-loading' : ''}`} disabled={loading} onClick={createRipple}>{loading ? 'جاري الحفظ...' : 'حفظ'}</button>
      </form>
    )
  }

  // === Success Step ===
  if (step === 'success') {
    return (
      <div className="form-card form-success">
        <svg className="success-check" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="32" />
          <path d="M22 36l10 10 18-20" />
        </svg>
        <h3>تم تسجيلك بنجاح!</h3>
        <p>سيتم تحويلك تلقائياً إلى متجر التطبيقات لبدء استخدام حسابك، أو يمكنك الضغط هنا للوصول مباشرة إلى التطبيق</p>
        <div className="store-buttons">
          <a href="https://play.google.com/store/apps/details?id=com.elmadrasah.app" target="_blank" rel="noopener noreferrer" className="store-btn store-google">
            <svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
            Google Play
          </a>
          <a href="https://apps.apple.com/eg/app/%D8%A7%D9%84%D9%85%D8%AF%D8%B1%D8%B3%D8%A9-el-madrasah/id6755660500" target="_blank" rel="noopener noreferrer" className="store-btn store-apple">
            <svg width="20" height="20" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
            App Store
          </a>
        </div>
      </div>
    )
  }

  // === Phone Step ===
  return (
    <form className="form-card" onSubmit={handlePhoneSubmit}>
      <h3>سجّل الآن وابدأ التدريس مجاناً</h3>
      <div className="form-group phone-group">
        <select className="country-select" value={countryCode} onChange={e => setCountryCode(e.target.value)}>
          {countries.length > 0 ? countries.map(c => (
            <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
          )) : (
            <>
              <option value="+20">مصر (+20)</option>
              <option value="+966">السعودية (+966)</option>
              <option value="+249">السودان (+249)</option>
              <option value="+971">الإمارات (+971)</option>
            </>
          )}
        </select>
        <input type="tel" placeholder="رقم الهاتف" required value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} dir="ltr" />
      </div>
      {phoneInfo && <p className="form-info">{phoneInfo}</p>}
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className={`btn-submit${loading ? ' is-loading' : ''}`} disabled={loading} onClick={createRipple}>{loading ? 'جاري الإرسال...' : 'ابدأ التدريس وحقّق دخلاً إضافياً — مجاناً'}</button>
      <p className="form-privacy">بياناتك محمية ولن نشاركها</p>
      <div className="form-badges">
        <span>✅ مجاني تماماً</span>
        <span>✅ بدون اشتراك شهري</span>
        <span>✅ بدون رسوم مقدّمة</span>
      </div>
    </form>
  )
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const itemRef = useRef(null)

  useEffect(() => {
    const el = itemRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={itemRef} className={`faq-item reveal${revealed ? ' revealed' : ''} ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
      <div className="faq-question">
        <span>{question}</span>
        <span className="faq-toggle">{open ? '−' : '+'}</span>
      </div>
      <div className="faq-answer">{answer}</div>
    </div>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const offerRef = useScrollReveal()
  const howRef = useScrollReveal()
  const featuresRef = useScrollReveal()
  const testimonialsRef = useScrollReveal()
  const faqRef = useScrollReveal()
  const ctaRef = useScrollReveal()

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">المدرسة</div>
          <div className={`nav-links${menuOpen ? ' nav-open' : ''}`}>
            <a href="#offer" onClick={() => setMenuOpen(false)}>ماذا نقدّم</a>
            <a href="#how" onClick={() => setMenuOpen(false)}>كيف يعمل</a>
            <a href="#features" onClick={() => setMenuOpen(false)}>المميزات</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>الأسئلة الشائعة</a>
            <a href="#register" className="nav-cta nav-cta-mobile" onClick={() => setMenuOpen(false)}>سجّل مجاناً</a>
          </div>
          <a href="#register" className="nav-cta nav-cta-desktop">سجّل مجاناً</a>
          <button className={`hamburger${menuOpen ? ' hamburger-open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="القائمة">
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>
      {menuOpen && <div className="nav-overlay" onClick={() => setMenuOpen(false)} />}

      {/* ===== 1. Hero ===== */}
      <section className="hero" id="home">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">انضم لأكثر من 1,000 معلم</div>
            <h1>درّس من أي مكان.<br /><span>واكسب أكثر مما تتخيل.</span></h1>
            <p>
              المدرسة تفتح لك باباً على طلاب من مصر والسعودية والسودان — تُدرّسهم بأسلوبك، بأسعارك، في وقتك. والأرباح تصلك مباشرة بلا وسيط. سجّل مجاناً وابدأ اليوم.
            </p>
            <div className="hero-points">
              <div className="hero-point">
                <span>دخل إضافي مباشر — بلا وسطاء</span>
              </div>
              <div className="hero-point">
                <span>طلاب من ثلاث دول يبحثون عنك</span>
              </div>
              <div className="hero-point">
                <span>أدوات ذكاء اصطناعي توفّر عليك ساعات</span>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <img src="/teacher.webp" alt="معلم يدرّس" className="hero-img" />
          </div>
        </div>
      </section>

      {/* ===== 2. ماذا نقدّم لك ===== */}
      <section className="offer-section" id="offer" ref={offerRef}>
        <div className="section-container">
          <div className="section-header reveal">
            <h2>ركّز على التدريس. واترك الباقي لنا.</h2>
          </div>
          <div className="pillars-grid reveal-stagger">
            <div className="pillar-card reveal">
                            <h3>نوصلك بطلاب من 3 دول</h3>
              <p>حين تنضم، يظهر ملفك لآلاف الطلاب وأولياء الأمور في مصر والسعودية والسودان. لا تحتاج إلى التسويق لنفسك — الطلاب يأتون إليك.</p>
            </div>
            <div className="pillar-card reveal">
                            <h3>نوفّر لك أدوات توفّر وقتك</h3>
              <p>أنشئ اختبارات بالذكاء الاصطناعي في دقائق. التصحيح تلقائي. تقارير كل طالب جاهزة بنقرة. ساعات العمل الروتيني تتحول إلى ثوانٍ.</p>
            </div>
            <div className="pillar-card reveal">
                            <h3>نضمن لك دخلاً شفافاً ومباشراً</h3>
              <p>الطالب يدفع إلكترونياً والمبلغ يظهر في محفظتك فوراً. لا وسطاء ولا تأخير. أموالك تصلك مباشرة.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 3. كيف يعمل ===== */}
      <section className="how-section" id="how" ref={howRef}>
        <div className="section-container">
          <div className="section-header reveal">
            <h2>من التسجيل إلى أول حصة مدفوعة</h2>
          </div>
          <div className="steps-grid reveal-stagger">
            <div className="step-card reveal">
              <div className="step-number">1</div>
                            <h3>سجّل بياناتك</h3>
              <p>دقيقتان فقط. مجاني تماماً</p>
            </div>
            <div className="step-connector" />
            <div className="step-card reveal">
              <div className="step-number">2</div>
                            <h3>أنشئ ملفك التعريفي</h3>
              <p>أضف خبراتك وأسعارك ومواعيدك. هذا الملف هو واجهتك أمام الطلاب</p>
            </div>
            <div className="step-connector" />
            <div className="step-card reveal">
              <div className="step-number">3</div>
                            <h3>الطلاب يعثرون عليك</h3>
              <p>ملفك يظهر في سوق المعلمين. يحجزون معك مباشرة</p>
            </div>
            <div className="step-connector" />
            <div className="step-card reveal">
              <div className="step-number">4</div>
                            <h3>درّس واحصل على أرباحك</h3>
              <p>قدّم حصصك أونلاين أو حضورياً. الأرباح تصل فوراً</p>
            </div>
          </div>
          <p className="steps-note reveal">لا تحتاج إلى خبرة تقنية. إذا كنت تستطيع استخدام هاتفك، تستطيع استخدام المدرسة.</p>
        </div>
      </section>

      {/* ===== 4. المميزات ===== */}
      <section className="features" id="features" ref={featuresRef}>
        <div className="section-container">
          <div className="section-header reveal">
            <h2>كل ما تحتاجه في تطبيق واحد</h2>
          </div>
          <div className="features-grid reveal-stagger">
            <div className="feature-card reveal">
                            <h3>ملف تعريفي احترافي</h3>
              <p>صفحتك الرقمية التي يراها كل طالب يبحث عن معلم في تخصصك</p>
            </div>
            <div className="feature-card reveal">
                            <h3>جدولة ذكية</h3>
              <p>حدّد مواعيدك والطالب يحجز منها. لا تنسيق يدوي</p>
            </div>
            <div className="feature-card reveal">
                            <h3>اختبارات بالذكاء الاصطناعي</h3>
              <p>أدخل الموضوع والنظام يُولّد اختباراً متكاملاً في دقائق</p>
            </div>
            <div className="feature-card reveal">
                            <h3>تصحيح تلقائي فوري</h3>
              <p>النتيجة تظهر مع شرح كل إجابة. لا تصحيح يدوي</p>
            </div>
            <div className="feature-card reveal">
                            <h3>تقارير أداء لكل طالب</h3>
              <p>بيانات دقيقة تُساعدك على اتخاذ قرارات تدريسية أفضل</p>
            </div>
            <div className="feature-card reveal">
                            <h3>محفظة إلكترونية</h3>
              <p>الطالب يدفع إلكترونياً والمبلغ يصلك مباشرة. سحب في أي وقت</p>
            </div>
          </div>
          <p className="features-note reveal">كل هذا مجاني عند التسجيل. المنصة تأخذ نسبة بسيطة من الحصص المدفوعة فقط — نربح فقط حين تربح أنت.</p>
        </div>
      </section>

      {/* ===== 5. شهادات المعلمين ===== */}
      <section className="testimonials-section" id="testimonials" ref={testimonialsRef}>
        <div className="section-container">
          <div className="section-header reveal">
            <h2>معلمون بدأوا مثلك. واليوم لديهم طلاب ودخل إضافي.</h2>
          </div>
          <div className="testimonials-grid reveal-stagger">
            <div className="testimonial-card reveal">
              <div className="testimonial-quote">"</div>
              <p>انضممت للمنصة وأنا متردد، لكن خلال أسبوعين حصلت على أول 5 طلاب. الآن لديّ دخل إضافي ثابت بجانب وظيفتي.</p>
              <div className="testimonial-author">
                <div className="author-avatar">أ</div>
                <div>
                  <h4>أحمد محمود</h4>
                  <span>معلم رياضيات — مصر</span>
                </div>
              </div>
            </div>
            <div className="testimonial-card reveal">
              <div className="testimonial-quote">"</div>
              <p>أدوات الذكاء الاصطناعي وفّرت عليّ ساعات كل أسبوع. أنشئ الاختبارات في دقائق بدل ساعات والتصحيح تلقائي.</p>
              <div className="testimonial-author">
                <div className="author-avatar">س</div>
                <div>
                  <h4>سارة العتيبي</h4>
                  <span>معلمة لغة إنجليزية — السعودية</span>
                </div>
              </div>
            </div>
            <div className="testimonial-card reveal">
              <div className="testimonial-quote">"</div>
              <p>المنصة سهلة جداً. الطلاب يحجزون معي مباشرة والأرباح تصل لمحفظتي فوراً. أفضل قرار اتخذته.</p>
              <div className="testimonial-author">
                <div className="author-avatar">م</div>
                <div>
                  <h4>محمد عبدالله</h4>
                  <span>معلم فيزياء — السودان</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 6. الأسئلة الشائعة ===== */}
      <section className="faq-section" id="faq" ref={faqRef}>
        <div className="section-container">
          <div className="section-header reveal">
            <h2>أسئلة يطرحها المعلمون قبل التسجيل</h2>
          </div>
          <div className="faq-list reveal-stagger">
            <FAQItem question="هل التسجيل مجاني فعلاً؟" answer="نعم. إنشاء حسابك وملفك والظهور في سوق المعلمين — كل ذلك بلا تكلفة. المنصة تأخذ نسبة بسيطة من الحصص المدفوعة فقط." />
            <FAQItem question="هل يمكنني التدريس وأنا في وظيفتي الحالية؟" answer="بالتأكيد. كثير من معلمينا يعملون في مدارس ويستخدمون المنصة كمصدر دخل إضافي في أوقات فراغهم. أنت من يحدد مواعيده." />
            <FAQItem question="هل أحتاج إلى معدات خاصة؟" answer="لا. هاتفك الذكي يكفي. للحصص عبر الإنترنت تحتاج فقط هاتفاً أو حاسوباً واتصالاً بالإنترنت." />
            <FAQItem question="ما التخصصات المطلوبة؟" answer="جميعها: الرياضيات، الفيزياء، الكيمياء، اللغات، العلوم، وغيرها. كل مادة عليها طلب." />
            <FAQItem question="ماذا لو لم أحصل على طلاب في البداية؟" answer="نساعدك في تحسين ملفك لجذب الطلاب. ومع التقييمات الإيجابية يزداد ظهورك تلقائياً." />
          </div>
        </div>
      </section>

      {/* ===== 7. CTA النهائي ===== */}
      <section className="final-cta" id="register" ref={ctaRef}>
        <div className="section-container">
          <div className="final-cta-container">
            <div className="final-cta-text reveal">
              <h2>أنت على بُعد خطوة واحدة من طلاب جدد ودخل إضافي.</h2>
              <p>سجّل بياناتك الآن — مجاناً وبدون أي التزام.</p>
            </div>
            <div className="final-cta-form reveal">
              <LeadForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="footer-logo">المدرسة</div>
              <p className="footer-desc">منصة تعليمية تربط المعلمين بالطلاب في مصر والسعودية والسودان.</p>
            </div>
            <div className="footer-col">
              <h4>المنصة</h4>
              <a href="#features">المميزات</a>
              <a href="#how">كيف يعمل</a>
              <a href="#faq">الأسئلة الشائعة</a>
            </div>
            <div className="footer-col">
              <h4>الدعم</h4>
              <a href="#register">سجّل كمعلم</a>
              <a href="#">سياسة الخصوصية</a>
              <a href="#">شروط الاستخدام</a>
            </div>
            <div className="footer-col">
              <h4>تابعنا</h4>
              <a href="#">تويتر</a>
              <a href="#">فيسبوك</a>
              <a href="#">إنستغرام</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 المدرسة. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </>
  )
}

export default App
