import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createProject, FONT_DEFINITIONS, fontById, textStats, typographyScale } from './core/model';
import { SAMPLES } from './core/samples';
import { exportCss, exportFilename, exportHtml } from './core/export';
import { parseProject, serializeProject } from './core/storage';
import type { FontId, GlyphProject, ScaleSettings, Specimen } from './core/types';
import { FONT_CSS } from './fonts';
import { downloadText, openDocument } from './download';
import { useProject } from './hooks/useProject';
import { Icon } from './components/Icon';
import { Modal } from './components/Modal';
import { RangeControl } from './components/RangeControl';
import markDark from './assets/mark-dark.png';
import markLight from './assets/mark-light.png';

const number = (value: number) => value.toLocaleString('fa-IR', { maximumFractionDigits: 2 });
const SCALE_LABELS: Record<string, string> = { caption: 'زیرنویس', body: 'متن اصلی', h6: 'عنوان ۶', h5: 'عنوان ۵', h4: 'عنوان ۴', h3: 'عنوان ۳', h2: 'عنوان ۲', h1: 'عنوان ۱' };
const RATIOS = [{ value: 1.125, name: 'Major Second' }, { value: 1.2, name: 'Minor Third' }, { value: 1.25, name: 'Major Third' }, { value: 1.333, name: 'Perfect Fourth' }, { value: 1.414, name: 'Augmented Fourth' }, { value: 1.5, name: 'Perfect Fifth' }];

function specimenStyle(specimen: Specimen): CSSProperties {
  return { fontFamily: `'${fontById(specimen.font).family}', sans-serif`, fontSize: specimen.size, fontWeight: specimen.weight, lineHeight: specimen.lineHeight, letterSpacing: `${specimen.letterSpacing}px`, textAlign: specimen.align };
}

export default function App() {
  const { project, update, replace, warning, recoveryData, saving } = useProject();
  const [dialog, setDialog] = useState<'export' | 'help' | 'settings' | null>(null);
  const [exportTab, setExportTab] = useState<'css' | 'html'>('css');
  const [pendingImport, setPendingImport] = useState<GlyphProject | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [editorOpen, setEditorOpen] = useState(true);
  const [guides, setGuides] = useState(false);
  const [message, setMessage] = useState('');
  const [titleDraft, setTitleDraft] = useState(project.title);
  const fileInput = useRef<HTMLInputElement>(null);
  const importRequest = useRef(0);
  const stats = useMemo(() => textStats(project.text), [project.text]);
  const scale = useMemo(() => typographyScale(project.scale), [project.scale]);
  const css = useMemo(() => exportCss(project), [project]);
  const html = useMemo(() => dialog === 'export' && exportTab === 'html' ? exportHtml(project, FONT_CSS) : '', [dialog, exportTab, project]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(''), 6_000);
    return () => window.clearTimeout(timer);
  }, [message]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (dialog || pendingImport || confirmReset) return;
      const target = event.target as HTMLElement;
      if (target.matches('input, textarea, select') || target.isContentEditable) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault(); setExportTab('css'); setDialog('export');
      } else if (event.key === '?') setDialog('help');
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [dialog, pendingImport, confirmReset]);

  const patchSpecimen = (id: Specimen['id'], patch: Partial<Specimen>) => update({ specimens: project.specimens.map((item) => {
    if (item.id !== id) return item;
    const next = { ...item, ...patch };
    const font = fontById(next.font);
    return { ...next, weight: Math.min(font.maxWeight, Math.max(font.minWeight, next.weight)) };
  }) });
  const patchScale = (patch: Partial<ScaleSettings>) => {
    const next = { ...project.scale, ...patch };
    const font = fontById(next.font);
    update({ scale: { ...next, weight: Math.min(font.maxWeight, Math.max(font.minWeight, next.weight)) } });
  };
  const backup = () => downloadText(serializeProject(project), exportFilename(project.title, 'json'), 'application/json');
  const preview = () => {
    if (openDocument(exportHtml(project, FONT_CSS))) setMessage('نمونه در تب جدید باز شد؛ برای چاپ یا PDF از فرمان چاپ مرورگر استفاده کنید. اگر تب باز نشد، HTML را دانلود کنید.');
    else setMessage('مرورگر پیش‌نمایش را باز نکرد؛ از خروجی، HTML را دانلود کنید.');
  };
  const readImport = async (file: File) => {
    const request = ++importRequest.current;
    if (file.size > 2 * 1024 * 1024) { setMessage('حجم فایل JSON باید حداکثر ۲ مگابایت باشد.'); return; }
    try {
      const result = parseProject(await file.text());
      if (request !== importRequest.current) return;
      if (!result.ok) { setMessage(result.error); return; }
      setConfirmReset(false);
      setPendingImport(result.project);
    } catch { if (request === importRequest.current) setMessage('خواندن فایل انجام نشد. یک فایل JSON معتبر انتخاب کنید.'); }
  };
  const sync = () => {
    const first = project.specimens.find((item) => item.id === 'a')!;
    update({ specimens: project.specimens.map((item) => ({ ...item, size: first.size, lineHeight: first.lineHeight, letterSpacing: first.letterSpacing, align: first.align, weight: Math.max(fontById(item.font).minWeight, Math.min(fontById(item.font).maxWeight, first.weight)) })) });
    setMessage('اندازه، وزن، ارتفاع خط و فاصلهٔ نمونه‌ها با A یکسان شدند؛ فونت‌ها تغییر نکردند.');
  };

  return <div className="app">
    <header className="topbar">
      <a className="brand" href="#main" aria-label="NoxaPlus Glyph — رفتن به آزمایشگاه"><span className="brand__logo"><img className="brand__logo-img brand__logo-img--dark" src={markDark} alt="NoxaPlus" /><img className="brand__logo-img brand__logo-img--light" src={markLight} alt="NoxaPlus" /></span><span className="brand__word" dir="ltr"><strong>Noxa<span>Plus</span></strong><span>GLYPH <i> / </i> TYPE LAB</span></span></a>
      <div className="topbar__center"><span className="status-dot" /> آزمایشگاه تایپوگرافی فارسی <span className="version">۱.۰.۱</span></div>
      <nav className="topbar__actions" aria-label="ابزارهای برنامه">
        <button className="icon-btn" onClick={() => update({ theme: project.theme === 'light' ? 'dark' : 'light' })} aria-label={project.theme === 'light' ? 'حالت تیره' : 'حالت روشن'} title="تغییر ظاهر"><Icon name={project.theme === 'light' ? 'moon' : 'sun'} /></button>
        <button className="icon-btn" onClick={() => setDialog('help')} aria-label="راهنما" title="راهنما"><Icon name="help" /></button>
        <button className="icon-btn" onClick={() => setDialog('settings')} aria-label="مدیریت پروژه" title="مدیریت پروژه"><Icon name="settings" /></button>
        <button className="btn btn--primary topbar__export" onClick={() => { setExportTab('css'); setDialog('export'); }}><Icon name="code" /><span>خروجی</span></button>
      </nav>
    </header>

    {warning ? <div className="storage-warning" role="alert"><Icon name="shield" /><div><strong>{warning}</strong>{recoveryData !== null ? <p>دادهٔ قبلی دست‌نخورده باقی مانده است؛ ذخیرهٔ خودکار تا بازیابی یا بازنشانی متوقف است.</p> : null}</div><button className="btn btn--small" onClick={backup}>دریافت JSON فعلی</button>{recoveryData !== null ? <button className="btn btn--small" onClick={() => downloadText(recoveryData, 'NoxaPlus-Glyph-recovery.json', 'application/json')}>دریافت دادهٔ قبلی</button> : null}</div> : null}

    <main id="main">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy"><span className="eyebrow"><span /> FROM LETTERS TO LANGUAGE</span><h1 id="hero-title">حروف، <em>شخصیت</em> دارند.</h1><p>یک متن، سه نگاه. ریتم نوشتار فارسی را پیدا کنید؛<br className="desktop-break" /> فونت‌ها را مقایسه کنید و طراحی‌تان را به کد ببرید.</p><div className="hero__tags"><span><Icon name="shield" size={14} /> کاملاً محلی</span><span>۳ فونت همراه</span><span>بدون نصب و حساب</span></div></div>
        <div className="type-art" aria-hidden="true"><span className="type-art__corner">Aa / آ</span><span className="type-art__glyph">آ</span><span className="type-art__label">شکل، فاصله، ریتم.</span><span className="type-art__cross">+</span><span className="type-art__measure" dir="ltr">PERSIAN TYPE · ۰۱—۰۳</span></div>
      </section>

      <section className="workspace" aria-label="آزمایشگاه">
        <div className="workspace__bar"><div className="project-name"><span className="project-name__index" dir="ltr">01 /</span><label className="sr-only" htmlFor="project-title">نام پروژه</label><input id="project-title" value={titleDraft} maxLength={120} onChange={(e) => { setTitleDraft(e.target.value); update({ title: e.target.value.trim() || 'آزمایش بدون عنوان' }); }} onBlur={() => setTitleDraft(project.title)} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} /><span className={`save-state${warning ? ' save-state--warning' : ''}`}>{warning ? 'ذخیره متوقف' : saving ? 'در حال ذخیره…' : 'ذخیرهٔ محلی'}</span></div><button className="btn btn--ghost btn--small" onClick={preview}><Icon name="print" size={16} /> نمونه / چاپ</button></div>
        <div className="editor-panel">
          <div className="editor-panel__bar"><button className="editor-toggle" onClick={() => setEditorOpen(!editorOpen)} aria-expanded={editorOpen} aria-controls="sample-editor"><Icon name="type" /> متن آزمایش <span>{editorOpen ? '−' : '+'}</span></button><div className="sample-buttons" aria-label="متن‌های آماده">{SAMPLES.map((sample) => <button key={sample.id} onClick={() => update({ text: sample.text })} className={project.text === sample.text ? 'is-active' : ''}>{sample.name}</button>)}</div></div>
          {editorOpen ? <div id="sample-editor"><label className="sr-only" htmlFor="sample-text">متن آزمایش</label><textarea id="sample-text" value={project.text} maxLength={50000} onChange={(e) => update({ text: e.target.value })} dir={project.direction} spellCheck={false} placeholder="متن خود را اینجا بنویسید…" /><div className="editor-panel__foot"><span>{number(stats.characters)} نویسه <i>·</i> {number(stats.words)} واژه <i>·</i> {number(stats.lines)} خط</span><div className="direction"><span>جهت متن</span><button className={project.direction === 'rtl' ? 'is-active' : ''} aria-pressed={project.direction === 'rtl'} onClick={() => update({ direction: 'rtl' })}>راست به چپ</button><button className={project.direction === 'ltr' ? 'is-active' : ''} aria-pressed={project.direction === 'ltr'} onClick={() => update({ direction: 'ltr' })}>چپ به راست</button></div></div></div> : null}
        </div>
        <div className="viewbar"><div className="segmented" role="tablist" aria-label="نمای آزمایشگاه"><button role="tab" aria-selected={project.view === 'compare'} className={project.view === 'compare' ? 'is-active' : ''} onClick={() => update({ view: 'compare' })}><Icon name="grid" size={16} /> مقایسهٔ فونت‌ها</button><button role="tab" aria-selected={project.view === 'scale'} className={project.view === 'scale' ? 'is-active' : ''} onClick={() => update({ view: 'scale' })}><Icon name="scale" size={16} /> مقیاس نوشتاری</button></div><label className="guide-toggle"><input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} /> خطوط راهنما</label>{project.view === 'compare' ? <button className="btn btn--ghost btn--small sync-button" onClick={sync}>یکسان‌سازی با A <Icon name="arrow" size={14} /></button> : null}</div>

        {project.view === 'compare' ? <div className="specimens" role="tabpanel" aria-label="مقایسهٔ فونت‌ها">
          {project.specimens.map((item) => { const font = fontById(item.font); return <section className={`specimen specimen--${item.id}`} key={item.id} aria-label={`نمونه ${item.id.toUpperCase()}`}>
            <div className="specimen__head"><span className="specimen__letter" dir="ltr">{item.id.toUpperCase()}</span><div><label className="sr-only" htmlFor={`font-${item.id}`}>فونت نمونه {item.id.toUpperCase()}</label><select id={`font-${item.id}`} value={item.font} onChange={(e) => patchSpecimen(item.id, { font: e.target.value as FontId })}>{FONT_DEFINITIONS.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select><span className="specimen__family" dir="ltr">{font.family}</span></div><span className="specimen__category">{font.category}</span></div>
            <div className={`specimen__preview${guides ? ' with-guides' : ''}`}><div className="specimen__display" style={{ fontFamily: `'${font.family}', sans-serif`, fontWeight: item.weight }} aria-hidden="true">آب</div><div className="specimen__text" style={specimenStyle(item)} dir={project.direction}>{project.text || <span className="empty-text">برای دیدن نتیجه، متنی بنویسید.</span>}</div></div>
            <fieldset className="specimen__controls"><legend className="sr-only">تنظیمات نمونه {item.id.toUpperCase()}</legend><div className="controls-grid"><RangeControl label="اندازه" value={item.size} min={12} max={96} step={1} unit="px" onChange={(size) => patchSpecimen(item.id, { size })} /><RangeControl label="وزن" value={item.weight} min={font.minWeight} max={font.maxWeight} step={100} onChange={(weight) => patchSpecimen(item.id, { weight })} /><RangeControl label="ارتفاع خط" value={item.lineHeight} min={1} max={2.5} step={0.05} onChange={(lineHeight) => patchSpecimen(item.id, { lineHeight })} /><RangeControl label="فاصلهٔ حروف" value={item.letterSpacing} min={-1} max={4} step={0.1} unit="px" onChange={(letterSpacing) => patchSpecimen(item.id, { letterSpacing })} /></div><div className="alignment"><span>چینش</span>{(['start', 'center', 'end', 'justify'] as const).map((align, index) => <button key={align} className={item.align === align ? 'is-active' : ''} aria-pressed={item.align === align} onClick={() => patchSpecimen(item.id, { align })}>{['ابتدا', 'وسط', 'انتها', 'تراز'][index]}</button>)}</div>{item.letterSpacing !== 0 ? <p className="spacing-note">فاصلهٔ غیرصفر ممکن است اتصال حروف فارسی را در بعضی مرورگرها تغییر دهد.</p> : null}</fieldset>
            <div className="specimen__foot"><span dir="ltr">{item.size}px / {item.lineHeight} / {item.weight}</span><span>VARIABLE FONT</span></div>
          </section>; })}
        </div> : <div className="scale-layout" role="tabpanel" aria-label="مقیاس نوشتاری"><aside className="scale-settings"><span className="eyebrow">MODULAR SCALE</span><h2>هماهنگی، با یک نسبت.</h2><p>یک اندازهٔ پایه و یک نسبت انتخاب کنید تا از زیرنویس تا تیتر، سلسله‌مراتب یکدستی داشته باشید.</p><label htmlFor="scale-font">فونت مقیاس</label><select id="scale-font" value={project.scale.font} onChange={(e) => patchScale({ font: e.target.value as FontId })}>{FONT_DEFINITIONS.map((font) => <option key={font.id} value={font.id}>{font.name}</option>)}</select><RangeControl label="اندازهٔ پایه" value={project.scale.base} min={12} max={24} step={1} unit="px" onChange={(base) => patchScale({ base })} /><label htmlFor="scale-ratio">نسبت رشد</label><select id="scale-ratio" value={project.scale.ratio} onChange={(e) => patchScale({ ratio: Number(e.target.value) })} dir="ltr">{RATIOS.map((ratio) => <option key={ratio.value} value={ratio.value}>{ratio.value} · {ratio.name}</option>)}</select><RangeControl label="وزن مقیاس" value={project.scale.weight} min={fontById(project.scale.font).minWeight} max={fontById(project.scale.font).maxWeight} step={100} onChange={(weight) => patchScale({ weight })} /><div className="scale-formula" dir="ltr">size = base × ratio<sup>step</sup><small>1rem = 16px</small></div><p className="subtle">واحد rem در خروجی، نسبت به اندازهٔ ریشهٔ ۱۶ پیکسل محاسبه می‌شود؛ اندازهٔ واقعی به تنظیمات سایت مقصد بستگی دارد.</p></aside><div className="scale-preview">{[...scale].reverse().map((step) => <div className={`scale-row${guides ? ' with-guides' : ''}`} key={step.name}><div className="scale-row__label"><strong>{SCALE_LABELS[step.name]}</strong><span dir="ltr">{step.pixels}px / {step.rem}rem</span><code>--glyph-{step.name}</code></div><div className="scale-row__text" dir={project.direction} style={{ fontFamily: `'${fontById(project.scale.font).family}', sans-serif`, fontSize: step.pixels, fontWeight: project.scale.weight, lineHeight: step.name === 'body' || step.name === 'caption' ? 1.65 : 1.35 }}>{step.name === 'body' ? project.text : project.text.split(/\r\n|[\r\n\u2028\u2029]/u).find((line) => line.trim()) || ''}</div></div>)}</div></div>}
      </section>
      <section className="bottom-note"><Icon name="type" size={28} /><div><h2>بهترین فونت؟ بستگی به متن شما دارد.</h2><p>اینجا امتیاز خوانایی یا انتخاب خودکار وجود ندارد؛ شکل حروف، طول سطر و ریتم را با چشم خود بسنجید.</p></div><button className="btn" onClick={() => { setExportTab('css'); setDialog('export'); }}>طراحی را به کد ببر <Icon name="code" size={17} /></button></section>
    </main>
    <footer className="footer"><span dir="ltr"><strong>NoxaPlus Glyph</strong> · 1.0.1</span><span>ساختهٔ NoxaPlus · متن‌باز با مجوز MIT</span><a href="https://www.noxaplus.ir" target="_blank" rel="noreferrer">وب‌سایت رسمی <Icon name="arrow" size={14} /></a></footer>
    <input className="sr-only" type="file" accept=".json,application/json" ref={fileInput} aria-label="ورود JSON پروژه" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void readImport(file); }} />

    <Modal feedback={message} open={dialog === 'export'} title="از آزمایشگاه به پروژهٔ شما" subtitle="CSS برای توسعه؛ HTML برای نگهداری، نمایش و چاپ." size="lg" onClose={() => setDialog(null)} footer={<div className="modal__actions"><button className="btn" onClick={() => setDialog(null)}>بستن</button><button className="btn btn--primary" onClick={() => { downloadText(exportTab === 'css' ? css : html, exportFilename(project.title, exportTab), exportTab === 'css' ? 'text/css' : 'text/html'); setMessage('فایل خروجی آمادهٔ دریافت است.'); }}><Icon name="download" /> دانلود {exportTab.toUpperCase()}</button></div>}>
      <div className="export-bar"><div className="segmented" role="tablist" aria-label="قالب خروجی"><button role="tab" aria-selected={exportTab === 'css'} className={exportTab === 'css' ? 'is-active' : ''} onClick={() => setExportTab('css')}>CSS</button><button role="tab" aria-selected={exportTab === 'html'} className={exportTab === 'html' ? 'is-active' : ''} onClick={() => setExportTab('html')}>HTML مستقل</button></div>{exportTab === 'css' ? <button className="btn btn--small" onClick={async () => { try { await navigator.clipboard.writeText(css); setMessage('CSS در کلیپ‌بورد کپی شد.'); } catch { setMessage('کپی در این مرورگر ممکن نیست؛ فایل CSS را دانلود کنید.'); } }}><Icon name="copy" size={15} /> کپی CSS</button> : <button className="btn btn--small" onClick={preview}><Icon name="print" size={15} /> پیش‌نمایش / چاپ</button>}</div>
      {exportTab === 'css' ? <><p className="dialog-note">CSS شامل فونت نیست؛ خانواده‌های فونت را در سایت مقصد بارگذاری کنید. برای فایل کاملاً مستقل، HTML را انتخاب کنید.</p><pre className="code-preview" dir="ltr">{css}</pre></> : <div className="html-card"><span className="html-card__icon"><Icon name="type" size={44} /></span><h3>یک نمونه، مستقل از هر چیز.</h3><p>متن و تنظیمات نمای فعلی همراه هر سه فونت و مجوزهایشان داخل HTML ذخیره می‌شود؛ بدون اینترنت باز کنید، به اشتراک بگذارید یا با چاپ مرورگر PDF بگیرید.</p><div><span>فونت‌های داخلی</span><span>راست‌به‌چپ</span><span>بدون اسکریپت</span></div></div>}
    </Modal>

    <Modal feedback={message} open={dialog === 'settings'} title="مدیریت پروژه" subtitle="پشتیبان‌ها در همین دستگاه ساخته می‌شوند؛ هیچ فایلی آپلود نمی‌شود." onClose={() => { importRequest.current += 1; setDialog(null); }} footer={<div className="modal__actions"><button className="btn" onClick={() => { importRequest.current += 1; setDialog(null); }}>بستن</button></div>}>
      <div className="settings-row"><div><h3>پشتیبان قابل بازیابی</h3><p>متن، تنظیمات نمونه‌ها، مقیاس و ظاهر را در یک فایل JSON نگه دارید.</p></div><button className="btn" onClick={backup}><Icon name="download" /> دریافت JSON</button></div><div className="settings-row"><div><h3>باز کردن پروژه</h3><p>یک JSON معتبر انتخاب کنید؛ فقط پس از تأیید، پروژهٔ فعلی جایگزین می‌شود.</p></div><button className="btn" onClick={() => fileInput.current?.click()}><Icon name="upload" /> ورود JSON</button></div><div className="settings-row settings-row--danger"><div><h3>شروع دوباره</h3><p>متن و همهٔ تنظیمات فعلی با آزمایش اولیه جایگزین می‌شوند.</p></div><button className="btn btn--danger" onClick={() => { importRequest.current += 1; setPendingImport(null); setConfirmReset(true); }}><Icon name="reset" /> بازنشانی پروژه</button></div><p className="dialog-note">ذخیرهٔ مرورگر و فایل‌های خروجی رمزگذاری نشده‌اند. پیش از پاک‌کردن داده‌های مرورگر، جابه‌جایی فایل برنامه یا بازنشانی، پشتیبان بگیرید.</p>
    </Modal>

    <Modal feedback={message} open={dialog === 'help'} title="راهنمای NoxaPlus Glyph" subtitle="اندکی آزمایش؛ نوشتاری با ریتم بهتر." size="lg" onClose={() => setDialog(null)} footer={<div className="modal__actions"><button className="btn btn--primary" onClick={() => setDialog(null)}>شروع آزمایش</button></div>}>
      <div className="help-grid"><section><span className="help-number">01</span><h3>متن واقعی را آزمایش کنید</h3><p>یکی از نمونه‌ها را انتخاب کنید یا متن خود را بنویسید. نیم‌فاصله، اعداد و نشانه‌ها بدون اصلاح خودکار حفظ می‌شوند. جهت متن را برای نمونه‌های انگلیسی تغییر دهید.</p></section><section><span className="help-number">02</span><h3>سه نگاه به یک متن</h3><p>فونت، اندازه، وزن، ارتفاع خط و چینش هر کارت مستقل است. وزن نوتو نسخ بین ۴۰۰ تا ۷۰۰ است. برای مقایسهٔ عادلانه، «یکسان‌سازی با A» را بزنید.</p></section><section><span className="help-number">03</span><h3>سلسله‌مراتب بسازید</h3><p>در نمای مقیاس، اندازهٔ پایه و نسبت رشد را تنظیم کنید. تیترها از اولین خط غیرخالی متن استفاده می‌کنند. rem بر پایهٔ ریشهٔ ۱۶ پیکسل است.</p></section><section><span className="help-number">04</span><h3>نتیجه را همراه ببرید</h3><p>CSS برای سایت مقصد به بارگذاری فونت نیاز دارد. HTML فونت‌ها را همراه دارد و با چاپ مرورگر به PDF تبدیل می‌شود. JSON تنها قالب بازیابی پروژه است.</p></section></div><div className="help-note"><Icon name="shield" /><p>هیچ متن یا تنظیمی ارسال نمی‌شود. پس از مکث ۲۵۰ میلی‌ثانیه ذخیره انجام می‌شود؛ پیش از بستن صفحه منتظر پایان ذخیره بمانید. در تداخل تب‌ها، ذخیره متوقف می‌شود تا دادهٔ جدید بازنویسی نشود.</p></div><p className="dialog-note">فاصلهٔ غیرصفر حروف می‌تواند در خط پیوستهٔ فارسی نامناسب باشد. این ابزار بررسی پوشش کامل یونیکد، هوش مصنوعی یا رتبه‌بندی خوانایی نیست؛ نویسه‌های خارج از فونت ممکن است با فونت جایگزین دستگاه نمایش داده شوند.</p><div className="help-links"><a href="https://www.noxaplus.ir" target="_blank" rel="noreferrer">www.noxaplus.ir</a><a href="https://github.com/noxaplus-star/noxaplus-glyph" target="_blank" rel="noreferrer">GitHub</a><a href="mailto:NoxaPlus2025@gmail.com">NoxaPlus2025@gmail.com</a><span dir="ltr">Ctrl / Cmd + S → CSS · ? → Help</span></div>
    </Modal>

    <Modal feedback={message} open={pendingImport !== null} title="پروژهٔ فعلی جایگزین شود؟" subtitle="ورود JSON ادغام نیست؛ متن و همهٔ تنظیمات فعلی جایگزین می‌شوند." onClose={() => setPendingImport(null)} footer={<div className="modal__actions"><button className="btn" onClick={() => setPendingImport(null)}>انصراف</button><button className="btn btn--danger" onClick={() => { if (pendingImport && replace(pendingImport)) { setTitleDraft(pendingImport.title); setMessage('پروژه بازیابی شد؛ پیش از بستن صفحه منتظر پایان ذخیره بمانید.'); } else setMessage('پروژهٔ ذخیره‌شده تغییر کرده است؛ جایگزینی انجام نشد. ابتدا پشتیبان بگیرید و صفحه را بازخوانی کنید.'); setPendingImport(null); }}>تأیید و جایگزینی</button></div>}><p className="confirm-text">قبل از جایگزینی، برای حفظ پروژهٔ فعلی پشتیبان بگیرید.</p><button className="btn" onClick={backup}><Icon name="download" /> دریافت JSON فعلی</button></Modal>
    <Modal feedback={message} open={confirmReset} title="بازنشانی پروژه؟" subtitle="این کار متن و تنظیمات فعلی را با نمونهٔ اولیه جایگزین می‌کند." onClose={() => setConfirmReset(false)} footer={<div className="modal__actions"><button className="btn" onClick={() => setConfirmReset(false)}>انصراف</button><button className="btn btn--danger" onClick={() => { const fresh = createProject(); fresh.theme = project.theme; if (replace(fresh)) { setTitleDraft(fresh.title); setMessage('پروژه بازنشانی شد؛ پیش از بستن صفحه منتظر پایان ذخیره بمانید.'); } else setMessage('پروژهٔ ذخیره‌شده تغییر کرده است؛ بازنشانی انجام نشد. ابتدا پشتیبان بگیرید و صفحه را بازخوانی کنید.'); setConfirmReset(false); }}>تأیید بازنشانی</button></div>}><p className="confirm-text">اگر می‌خواهید به این طراحی برگردید، ابتدا JSON آن را دانلود کنید.</p><button className="btn" onClick={backup}><Icon name="download" /> دریافت JSON فعلی</button></Modal>
    {message ? <div className="toast" role="status"><Icon name="check" /><p>{message}</p><button className="icon-btn" aria-label="بستن پیام" onClick={() => setMessage('')}><Icon name="close" size={16} /></button></div> : null}
  </div>;
}
