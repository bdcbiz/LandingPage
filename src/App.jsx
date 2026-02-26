import { useState } from 'react'
import './App.css'

function LeadForm() {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', country_id: '', subject_id: '', stages: []
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const countries = [
    { id: 1, name: 'مصر' },
    { id: 2, name: 'السعودية' },
    { id: 3, name: 'السودان' },
    { id: 4, name: 'أخرى' },
  ]
  const subjects = [
    { id: 1, name: 'الرياضيات' },
    { id: 2, name: 'الفيزياء' },
    { id: 3, name: 'الكيمياء' },
    { id: 4, name: 'اللغة العربية' },
    { id: 5, name: 'اللغة الإنجليزية' },
    { id: 6, name: 'العلوم' },
    { id: 7, name: 'أخرى' },
  ]
  const stages = [
    { id: 1, name: 'ابتدائي' },
    { id: 2, name: 'إعدادي' },
    { id: 3, name: 'ثانوي' },
    { id: 4, name: 'جامعي' },
  ]

  const handleStage = (stageId) => {
    setForm(prev => ({
      ...prev,
      stages: prev.stages.includes(stageId)
        ? prev.stages.filter(s => s !== stageId)
        : [...prev.stages, stageId]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.stages.length === 0) {
      setError('يرجى اختيار مرحلة دراسية واحدة على الأقل')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || null,
          country_id: Number(form.country_id),
          subject_id: Number(form.subject_id),
          stages: form.stages,
        })
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.errors) {
          const firstError = Object.values(data.errors)[0]
          throw new Error(Array.isArray(firstError) ? firstError[0] : firstError)
        }
        throw new Error(data.message || 'حدث خطأ، حاول مرة أخرى')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="form-card form-success">
        <div className="success-icon">🎉</div>
        <h3>تم تسجيل بياناتك بنجاح!</h3>
        <p>سيتواصل معك أحد أعضاء فريقنا خلال 24 ساعة لمساعدتك في إعداد ملفك التعريفي.</p>
        <div className="success-links">
          <p>في هذه الأثناء:</p>
          <button className="btn-primary">حمّل تطبيق المعلم</button>
        </div>
      </div>
    )
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h3>سجّل الآن وابدأ التدريس مجاناً</h3>
      <div className="form-group">
        <input type="text" placeholder="الاسم الكامل" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="form-group">
        <input type="tel" placeholder="رقم الهاتف" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div className="form-group">
        <input type="email" placeholder="البريد الإلكتروني" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
      </div>
      <div className="form-group">
        <select required value={form.country_id} onChange={e => setForm({ ...form, country_id: e.target.value })}>
          <option value="">الدولة</option>
          {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <select required value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}>
          <option value="">التخصص</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">المرحلة الدراسية</label>
        <div className="stages-grid">
          {stages.map(stage => (
            <label key={stage.id} className={`stage-chip ${form.stages.includes(stage.id) ? 'active' : ''}`}>
              <input type="checkbox" checked={form.stages.includes(stage.id)} onChange={() => handleStage(stage.id)} />
              {stage.name}
            </label>
          ))}
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn-submit" disabled={loading}>
        {loading ? 'جاري التسجيل...' : 'ابدأ التدريس وحقّق دخلاً إضافياً — مجاناً'}
      </button>
      <p className="form-privacy">🔒 بياناتك محمية ولن نشاركها</p>
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
  return (
    <div className={`faq-item ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
      <div className="faq-question">
        <span>{question}</span>
        <span className="faq-toggle">{open ? '−' : '+'}</span>
      </div>
      {open && <div className="faq-answer">{answer}</div>}
    </div>
  )
}

function App() {
  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">المدرسة</div>
          <div className="nav-links">
            <a href="#offer">ماذا نقدّم</a>
            <a href="#how">كيف يعمل</a>
            <a href="#features">المميزات</a>
            <a href="#faq">الأسئلة الشائعة</a>
          </div>
          <a href="#register" className="nav-cta">سجّل مجاناً</a>
        </div>
      </nav>

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
                <span className="point-icon">💰</span>
                <span>دخل إضافي مباشر — بلا وسطاء</span>
              </div>
              <div className="hero-point">
                <span className="point-icon">🌍</span>
                <span>طلاب من ثلاث دول يبحثون عنك</span>
              </div>
              <div className="hero-point">
                <span className="point-icon">🤖</span>
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
      <section className="offer-section" id="offer">
        <div className="section-container">
          <div className="section-header">
            <h2>ركّز على التدريس. واترك الباقي لنا.</h2>
          </div>
          <div className="pillars-grid">
            <div className="pillar-card">
              <div className="pillar-icon">🌍</div>
              <h3>نوصلك بطلاب من 3 دول</h3>
              <p>حين تنضم، يظهر ملفك لآلاف الطلاب وأولياء الأمور في مصر والسعودية والسودان. لا تحتاج إلى التسويق لنفسك — الطلاب يأتون إليك.</p>
            </div>
            <div className="pillar-card">
              <div className="pillar-icon">🤖</div>
              <h3>نوفّر لك أدوات توفّر وقتك</h3>
              <p>أنشئ اختبارات بالذكاء الاصطناعي في دقائق. التصحيح تلقائي. تقارير كل طالب جاهزة بنقرة. ساعات العمل الروتيني تتحول إلى ثوانٍ.</p>
            </div>
            <div className="pillar-card">
              <div className="pillar-icon">💰</div>
              <h3>نضمن لك دخلاً شفافاً ومباشراً</h3>
              <p>الطالب يدفع إلكترونياً والمبلغ يظهر في محفظتك فوراً. لا وسطاء ولا تأخير. أموالك تصلك مباشرة.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 3. كيف يعمل ===== */}
      <section className="how-section" id="how">
        <div className="section-container">
          <div className="section-header">
            <h2>من التسجيل إلى أول حصة مدفوعة</h2>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">📝</div>
              <h3>سجّل بياناتك</h3>
              <p>دقيقتان فقط. مجاني تماماً</p>
            </div>
            <div className="step-connector" />
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">🎯</div>
              <h3>أنشئ ملفك التعريفي</h3>
              <p>أضف خبراتك وأسعارك ومواعيدك. هذا الملف هو واجهتك أمام الطلاب</p>
            </div>
            <div className="step-connector" />
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">🔍</div>
              <h3>الطلاب يعثرون عليك</h3>
              <p>ملفك يظهر في سوق المعلمين. يحجزون معك مباشرة</p>
            </div>
            <div className="step-connector" />
            <div className="step-card">
              <div className="step-number">4</div>
              <div className="step-icon">💰</div>
              <h3>درّس واحصل على أرباحك</h3>
              <p>قدّم حصصك أونلاين أو حضورياً. الأرباح تصل فوراً</p>
            </div>
          </div>
          <p className="steps-note">🎯 لا تحتاج إلى خبرة تقنية. إذا كنت تستطيع استخدام هاتفك، تستطيع استخدام المدرسة.</p>
        </div>
      </section>

      {/* ===== 4. المميزات ===== */}
      <section className="features" id="features">
        <div className="section-container">
          <div className="section-header">
            <h2>كل ما تحتاجه في تطبيق واحد</h2>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏪</div>
              <h3>ملف تعريفي احترافي</h3>
              <p>صفحتك الرقمية التي يراها كل طالب يبحث عن معلم في تخصصك</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🗓️</div>
              <h3>جدولة ذكية</h3>
              <p>حدّد مواعيدك والطالب يحجز منها. لا تنسيق يدوي</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>اختبارات بالذكاء الاصطناعي</h3>
              <p>أدخل الموضوع والنظام يُولّد اختباراً متكاملاً في دقائق</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3>تصحيح تلقائي فوري</h3>
              <p>النتيجة تظهر مع شرح كل إجابة. لا تصحيح يدوي</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>تقارير أداء لكل طالب</h3>
              <p>بيانات دقيقة تُساعدك على اتخاذ قرارات تدريسية أفضل</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3>محفظة إلكترونية</h3>
              <p>الطالب يدفع إلكترونياً والمبلغ يصلك مباشرة. سحب في أي وقت</p>
            </div>
          </div>
          <p className="features-note">💡 كل هذا مجاني عند التسجيل. المنصة تأخذ نسبة بسيطة من الحصص المدفوعة فقط — نربح فقط حين تربح أنت.</p>
        </div>
      </section>

      {/* ===== 5. شهادات المعلمين ===== */}
      <section className="testimonials-section" id="testimonials">
        <div className="section-container">
          <div className="section-header">
            <h2>معلمون بدأوا مثلك. واليوم لديهم طلاب ودخل إضافي.</h2>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
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
            <div className="testimonial-card">
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
            <div className="testimonial-card">
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
      <section className="faq-section" id="faq">
        <div className="section-container">
          <div className="section-header">
            <h2>أسئلة يطرحها المعلمون قبل التسجيل</h2>
          </div>
          <div className="faq-list">
            <FAQItem question="هل التسجيل مجاني فعلاً؟" answer="نعم. إنشاء حسابك وملفك والظهور في سوق المعلمين — كل ذلك بلا تكلفة. المنصة تأخذ نسبة بسيطة من الحصص المدفوعة فقط." />
            <FAQItem question="هل يمكنني التدريس وأنا في وظيفتي الحالية؟" answer="بالتأكيد. كثير من معلمينا يعملون في مدارس ويستخدمون المنصة كمصدر دخل إضافي في أوقات فراغهم. أنت من يحدد مواعيده." />
            <FAQItem question="هل أحتاج إلى معدات خاصة؟" answer="لا. هاتفك الذكي يكفي. للحصص عبر الإنترنت تحتاج فقط هاتفاً أو حاسوباً واتصالاً بالإنترنت." />
            <FAQItem question="ما التخصصات المطلوبة؟" answer="جميعها: الرياضيات، الفيزياء، الكيمياء، اللغات، العلوم، وغيرها. كل مادة عليها طلب." />
            <FAQItem question="ماذا لو لم أحصل على طلاب في البداية؟" answer="نساعدك في تحسين ملفك لجذب الطلاب. ومع التقييمات الإيجابية يزداد ظهورك تلقائياً." />
          </div>
        </div>
      </section>

      {/* ===== 7. CTA النهائي ===== */}
      <section className="final-cta" id="register">
        <div className="section-container">
          <div className="final-cta-container">
            <div className="final-cta-text">
              <h2>أنت على بُعد خطوة واحدة من طلاب جدد ودخل إضافي.</h2>
              <p>سجّل بياناتك الآن — مجاناً وبدون أي التزام.</p>
            </div>
            <div className="final-cta-form">
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
