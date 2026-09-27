'use client';
import { FormEvent, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, Check, ChevronRight, MapPin, Menu, Router, ShieldCheck, Sparkles, Wifi, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useHeroFrameSequence } from '@/components/story-video';

const tariffs = [
  { name: 'Легко', speed: '100', price: '590', description: 'Для общения, учебы и любимых сериалов', features: ['Стабильный Wi‑Fi', 'Поддержка 24/7', 'Подключение за 1 день'] },
  { name: 'В самый раз', speed: '500', price: '790', description: 'Для всей семьи и десятка устройств сразу', features: ['Wi‑Fi роутер включен', 'Онлайн-кинотеатр', 'Приоритетная поддержка'], popular: true },
  { name: 'На максимуме', speed: '1000', price: '990', description: 'Для 4K, игр, стримов и умного дома', features: ['Гигабитный роутер', 'Минимальный пинг', 'Монтаж бесплатно'] },
];
function StoryVideo() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState(0);
  useHeroFrameSequence(sectionRef, canvasRef, setPhase);
  return <section ref={sectionRef} className="story" aria-label="Путь сигнала Уфанет"><div className="story-sticky">
    <canvas ref={canvasRef} className="story-canvas" aria-hidden="true"/>
    <div className="story-shade"/>
    <div className={`story-copy story-copy-main ${phase === 0 ? 'is-active' : ''}`}><span className="eyebrow eyebrow-light"><Sparkles size={14}/> Связь нового поколения</span><h1>Интернет,<br/><em>который летит</em><br/>прямо к вам</h1><p>До 1 Гбит/с для работы, фильмов, игр — и всего, что вы любите.</p><div className="hero-actions"><Button className="brand-button" onClick={() => document.querySelector('#coverage')?.scrollIntoView({behavior:'smooth'})}>Проверить адрес <ArrowRight/></Button><span className="hero-note"><span>от</span><strong>590 ₽</strong><span>/ месяц</span></span></div></div>
    <div className={`story-copy story-copy-mid ${phase === 1 ? 'is-active' : ''}`}><span className="story-index">01 — 02</span><h2>С улицы —<br/>в ваше окно.</h2><p>Оптоволокно ведет сигнал до самого дома без потерь скорости.</p></div>
    <div className={`story-copy story-copy-end ${phase === 2 ? 'is-active' : ''}`}><span className="story-index">02 — 02</span><h2>И дальше —<br/><em>к вам.</em></h2><p>Стабильный Wi‑Fi во всей квартире. Быстро, тихо, незаметно.</p></div>
    <div className="story-progress"><span>Дом</span><i><b/></i><span>Вы</span></div><div className="scroll-cue"><ArrowDown size={18}/><span>Листайте, чтобы запустить сигнал</span></div>
  </div></section>;
}
export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false), [checked, setChecked] = useState(false);
  const submitAddress = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setChecked(true); };
  return <main>
    <header className="site-header"><a href="#top" className="logo-link" aria-label="Уфанет — на главную"><img src="/logo.svg" alt="Уфанет"/></a><nav className="desktop-nav"><a href="#coverage">Проверить адрес</a><a href="#tariffs">Тарифы</a><a href="#benefits">Почему мы</a></nav><div className="header-actions"><button className="city-button"><MapPin size={16}/> Уфа</button><Button className="header-cta" onClick={() => document.querySelector('#coverage')?.scrollIntoView({behavior:'smooth'})}>Подключиться</Button><button className="menu-button" aria-label="Открыть меню" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button></div><div className={`mobile-menu ${menuOpen ? 'is-open' : ''}`}><a href="#coverage" onClick={()=>setMenuOpen(false)}>Проверить адрес</a><a href="#tariffs" onClick={()=>setMenuOpen(false)}>Тарифы</a><a href="#benefits" onClick={()=>setMenuOpen(false)}>Почему мы</a></div></header>
    <div id="top"/><StoryVideo/>
    <section id="coverage" className="coverage-section"><div className="ambient ambient-one"/><div className="ambient ambient-two"/><div className="section-shell coverage-grid"><div className="coverage-copy"><span className="eyebrow"><Wifi size={14}/> Узнайте за минуту</span><h2>Уфанет уже<br/><em>в вашем доме?</em></h2><p>Введите адрес — покажем доступные тарифы и ближайшую дату подключения.</p><div className="coverage-facts"><div><strong>1 день</strong><span>до подключения</span></div><div><strong>0 ₽</strong><span>выезд мастера</span></div></div></div>
    <div className="address-card">{!checked ? <form onSubmit={submitAddress}><div className="form-heading"><span className="form-icon"><MapPin/></span><div><span>Проверка подключения</span><strong>Куда провести интернет?</strong></div></div><label><span>Город</span><Input required defaultValue="Уфа" aria-label="Город"/></label><div className="address-row"><label><span>Улица</span><Input required placeholder="Например, Айская" aria-label="Улица"/></label><label><span>Дом</span><Input required placeholder="12" aria-label="Дом"/></label></div><Button type="submit" className="brand-button form-submit">Проверить адрес <ArrowRight/></Button><p className="privacy-note">Нажимая кнопку, вы соглашаетесь с политикой обработки данных.</p></form> : <div className="address-success" role="status"><span className="success-mark"><Check/></span><span className="eyebrow">Отличные новости</span><h3>Можно подключить!</h3><p>Оставьте номер — специалист уточнит удобное время и подберет тариф.</p><Input type="tel" placeholder="+7 999 000-00-00" aria-label="Номер телефона"/><Button className="brand-button form-submit">Перезвоните мне <ArrowRight/></Button><button className="text-button" onClick={()=>setChecked(false)}>Изменить адрес</button></div>}</div></div></section>
    <section id="tariffs" className="tariffs-section"><div className="section-shell"><div className="section-heading"><div><span className="eyebrow"><Zap size={14}/> Тарифы для дома</span><h2>Скорость, которая<br/><em>подходит вам</em></h2></div><p>Все честно: без мелкого шрифта, скрытых платежей и внезапных условий.</p></div><div className="tariff-grid">{tariffs.map(t => <article key={t.name} className={`tariff-card ${t.popular ? 'is-popular' : ''}`}>{t.popular && <span className="popular-label">Выбирают чаще</span>}<div className="tariff-top"><span>{t.name}</span><Wifi size={24}/></div><div className="speed"><strong>{t.speed}</strong><span>Мбит/с</span></div><p>{t.description}</p><ul>{t.features.map(f => <li key={f}><Check size={16}/> {f}</li>)}</ul><div className="tariff-bottom"><div><strong>{t.price} ₽</strong><span>в месяц</span></div><Button className="tariff-button" onClick={() => document.querySelector('#coverage')?.scrollIntoView({behavior:'smooth'})}>Выбрать <ChevronRight/></Button></div></article>)}</div></div></section>
    <section id="benefits" className="benefits-section"><div className="section-shell benefits-grid"><div className="benefit-intro"><span className="eyebrow eyebrow-light">Почему Уфанет</span><h2>Сигнал есть.<br/><em>Забот тоже меньше.</em></h2></div><div className="benefit-list"><article><span><Router/></span><div><strong>Умный Wi‑Fi</strong><p>Настроим покрытие так, чтобы интернет ловил в каждой комнате.</p></div></article><article><span><ShieldCheck/></span><div><strong>Всегда на связи</strong><p>Отвечаем круглосуточно и решаем большинство вопросов удаленно.</p></div></article><article><span><Zap/></span><div><strong>Честная скорость</strong><p>Оптика до дома дает стабильный интернет даже в часы пик.</p></div></article></div></div></section>
    <footer><div className="section-shell footer-inner"><img src="/logo.svg" alt="Уфанет"/><p>Дом, где все онлайн.</p><a href="#top">Наверх <ArrowRight/></a></div></footer>
  </main>;
}
