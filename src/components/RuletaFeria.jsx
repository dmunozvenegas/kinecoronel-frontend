import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Sparkles, ShieldCheck, CheckCircle2, Copy, Check, MessageCircle, Volume2, VolumeX } from 'lucide-react';

const RAW_API = import.meta.env.VITE_API_URL || 'https://kinecoronel-backend.onrender.com';
const API_BASE = RAW_API.replace(/\/api\/?$/, '');
const WHATSAPP_CENTRO = '56973764805'; // <-- Pon aquí tu celular de prueba (ej: 56987654321)

const DOLENCIAS = [
  'Dolor de Espalda / Lumbar',
  'Cuello / Estrés Cervical',
  'Hombro / Manguito Rotador',
  'Rodilla / Cadera',
  'Recuperación Deportiva',
  'Evaluación Preventiva'
];

const PREVISIONES = ['Fonasa', 'Isapre', 'Particular'];

// Formatea automáticamente a "+56 9 XXXX XXXX" y protege el prefijo
const formatearTelefonoCL = (valor = '') => {
  let soloDigitos = valor.replace(/\D/g, '');

  if (soloDigitos.startsWith('569')) {
    soloDigitos = soloDigitos.slice(3);
  } else if (soloDigitos.startsWith('56')) {
    soloDigitos = soloDigitos.slice(2);
  } else if (soloDigitos.startsWith('9') && soloDigitos.length === 9) {
    soloDigitos = soloDigitos.slice(1);
  }

  const resto = soloDigitos.slice(0, 8);

  if (resto.length === 0) return '+56 9 ';
  if (resto.length <= 4) return `+56 9 ${resto}`;
  return `+56 9 ${resto.slice(0, 4)} ${resto.slice(4)}`;
};

// Geometría polar para tajadas SVG
const polarToCartesian = (cx, cy, r, angleInDegrees) => {
  const rad = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
};

const crearArcoTajada = (cx, cy, r, startAngle, endAngle) => {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
};

// Encuadra textos largos en 1 a 3 líneas cortas para que calcen dentro del cono
const dividirEtiqueta = (texto = '') => {
  const limpio = texto.trim().toUpperCase().replace(/\s+/g, ' ');
  if (!limpio) return ['PREMIO'];

  const palabras = limpio.split(' ');
  const lineas = [];
  let actual = '';
  const MAX_POR_LINEA = 11;

  for (const palabra of palabras) {
    const tentativa = actual ? `${actual} ${palabra}` : palabra;
    if (tentativa.length <= MAX_POR_LINEA) {
      actual = tentativa;
    } else {
      if (actual) lineas.push(actual);
      if (palabra.length > 12) {
        lineas.push(palabra.slice(0, 11) + '.');
        actual = '';
      } else {
        actual = palabra;
      }
    }
  }
  if (actual) lineas.push(actual);
  return lineas.slice(0, 3);
};

export default function RuletaFeria() {
  const [paso, setPaso] = useState('formulario'); // 'formulario' | 'ruleta' | 'premio'
  const [premios, setPremios] = useState([]);
  const [cargandoPremios, setCargandoPremios] = useState(true);
  const [girando, setGirando] = useState(false);
  const [sonidoActivo, setSonidoActivo] = useState(true);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [rebotePuntero, setRebotePuntero] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    telefono: '+56 9 ',
    dolencia: '',
    prevision: 'Fonasa'
  });

  const wheelRef = useRef(null);
  const animRef = useRef(null);
  const anguloActualRef = useRef(0);
  const ultimoSectorTickRef = useRef(-1);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    let cancelado = false;
    const cargar = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/feria/premios`);
        if (!cancelado && Array.isArray(res.data)) {
          setPremios(res.data);
        }
      } catch {
        if (!cancelado) setError('No se pudo conectar con la ruleta. Revisa tu señal.');
      } finally {
        if (!cancelado) setCargandoPremios(false);
      }
    };
    cargar();
    return () => {
      cancelado = true;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const reproducirTick = () => {
    if (!sonidoActivo) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(680, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Silencioso si el navegador bloquea audio
    }
  };

  const reproducirFanfarria = () => {
    if (!sonidoActivo) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const notas = [523.25, 659.25, 783.99, 1046.5];
      notas.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const inicio = ctx.currentTime + idx * 0.09;
        osc.frequency.setValueAtTime(freq, inicio);
        gain.gain.setValueAtTime(0.16, inicio);
        gain.gain.exponentialRampToValueAtTime(0.001, inicio + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(inicio);
        osc.stop(inicio + 0.3);
      });
    } catch {
      // Silencioso
    }
  };

  const avanzarARuleta = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nombre.trim() || !form.dolencia) {
      setError('Ingresa tu nombre y selecciona qué zona te gustaría aliviar.');
      return;
    }
    const digitos = form.telefono.replace(/\D/g, '');
    if (digitos.length !== 11) {
      setError('Ingresa los 8 dígitos de tu WhatsApp (ej: +56 9 1234 5678).');
      return;
    }

    if (premios.length === 0) {
      try {
        setCargandoPremios(true);
        const res = await axios.get(`${API_BASE}/api/feria/premios`);
        if (!Array.isArray(res.data) || res.data.length === 0) {
          setError('No hay premios activos en este momento.');
          return;
        }
        setPremios(res.data);
      } catch {
        setError('Sin conexión con el servidor. Intenta nuevamente en unos segundos.');
        return;
      } finally {
        setCargandoPremios(false);
      }
    }

    setPaso('ruleta');
  };

  const aplicarRotacionDOM = (grados, totalSectores) => {
    anguloActualRef.current = grados;
    if (wheelRef.current) {
      wheelRef.current.style.transform = `translate3d(0,0,0) rotate(${grados}deg)`;
    }
    if (totalSectores > 0) {
      const gradosPorSector = 360 / totalSectores;
      const sectorActual = Math.floor((((grados % 360) + 360) % 360) / gradosPorSector);
      if (sectorActual !== ultimoSectorTickRef.current) {
        ultimoSectorTickRef.current = sectorActual;
        reproducirTick();
        setRebotePuntero(true);
        if (navigator.vibrate) navigator.vibrate(8);
        setTimeout(() => setRebotePuntero(false), 75);
      }
    }
  };

  const girarRuleta = async () => {
    if (girando || premios.length === 0) return;
    setGirando(true);
    setError('');

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext && !audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } catch {
      // Ignorar
    }

    const total = premios.length;
    let respuestaBackend = null;
    let errorBackend = null;

    let ultimoTiempo = performance.now();
    const velocidadCrucero = 720;

    const loopEspera = (ahora) => {
      const dt = (ahora - ultimoTiempo) / 1000;
      ultimoTiempo = ahora;
      aplicarRotacionDOM(anguloActualRef.current + velocidadCrucero * dt, total);

      if (!respuestaBackend && !errorBackend) {
        animRef.current = requestAnimationFrame(loopEspera);
      } else if (errorBackend) {
        setGirando(false);
        setError(errorBackend);
      } else if (respuestaBackend) {
        iniciarFrenadoExacto(respuestaBackend);
      }
    };

    animRef.current = requestAnimationFrame(loopEspera);

    try {
      const payload = {
        ...form,
        telefono: `+${form.telefono.replace(/\D/g, '')}`
      };
      const res = await axios.post(`${API_BASE}/api/feria/girar`, payload);
      respuestaBackend = res.data;
    } catch (err) {
      errorBackend = err.response?.data?.error || 'Ocurrió un problema de señal al girar. Intenta otra vez.';
    }
  };

  const iniciarFrenadoExacto = (data) => {
    const total = premios.length;
    const gradosPorSector = 360 / total;

    const indexGanador = premios.findIndex((p) => p.id === data.premio.id);
    const idx = indexGanador >= 0 ? indexGanador : 0;

    const centroSector = idx * gradosPorSector + gradosPorSector / 2;
    const margenSeguro = gradosPorSector * 0.24;
    const offsetNatural = (Math.random() * 2 - 1) * margenSeguro;

    const anguloDestinoMod = (360 - centroSector + offsetNatural + 360) % 360;
    const anguloInicio = anguloActualRef.current;
    const restoActual = ((anguloInicio % 360) + 360) % 360;
    let deltaHastaMeta = anguloDestinoMod - restoActual;
    if (deltaHastaMeta < 0) deltaHastaMeta += 360;

    const distanciaTotal = 360 * 5 + deltaHastaMeta;
    const duracionMs = 4400;
    const t0 = performance.now();

    const loopFrenado = (ahora) => {
      const progreso = Math.min((ahora - t0) / duracionMs, 1);
      const easeOut = 1 - Math.pow(1 - progreso, 4);
      const nuevoAngulo = anguloInicio + distanciaTotal * easeOut;

      aplicarRotacionDOM(nuevoAngulo, total);

      if (progreso < 1) {
        animRef.current = requestAnimationFrame(loopFrenado);
      } else {
        if (navigator.vibrate) navigator.vibrate([40, 60, 120]);
        reproducirFanfarria();
        setTimeout(() => {
          setResultado(data);
          setPaso('premio');
          setGirando(false);
        }, 450);
      }
    };

    animRef.current = requestAnimationFrame(loopFrenado);
  };

  const copiarCodigo = () => {
    if (!resultado?.codigo) return;
    navigator.clipboard.writeText(resultado.codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const totalPremios = premios.length || 6;
  const gradosSector = 360 / totalPremios;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-100 flex flex-col items-center justify-center p-3 sm:p-5 select-none overflow-x-hidden relative">
      {/* Destellos clínicos decorativos de fondo (colores del logo) */}
      <div className="pointer-events-none fixed -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-300/25 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-24 -right-24 w-80 h-80 rounded-full bg-sky-400/20 blur-3xl" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_60px_rgba(11,132,227,0.16)] overflow-hidden border border-sky-100 relative z-10">
        {/* Barra superior institucional con los colores exactos del logo */}
        <div className="h-2 w-full bg-gradient-to-r from-teal-400 via-emerald-400 to-[#0B84E3]" />

        {/* Encabezado con Logo Original + Título del Juego */}
        <div className="px-5 pt-5 pb-4 bg-white text-center border-b border-slate-100 relative">
          {paso === 'ruleta' && (
            <button
              type="button"
              onClick={() => setSonidoActivo((s) => !s)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition text-slate-600"
              aria-label="Activar o silenciar sonido"
            >
              {sonidoActivo ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          )}

          {/* Logo Oficial Centro Kinésico Coronel */}
          <div className="flex justify-center mb-2">
            {!logoError ? (
              <img
                src="/logo-original.jpg"
                alt="Centro Kinésico Coronel - Rehabilitación Integral"
                onError={() => setLogoError(true)}
                className="h-16 sm:h-20 w-auto object-contain mx-auto"
              />
            ) : (
              <div className="py-1">
                <span className="text-2xl font-black bg-gradient-to-r from-emerald-500 to-[#0B84E3] bg-clip-text text-transparent">
                  Centro Kinésico Coronel
                </span>
                <span className="block text-xs font-bold text-[#0B84E3]">Rehabilitación Integral</span>
              </div>
            )}
          </div>

          {/* Badge y Título Oficial del Juego */}
          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-200/80 px-3 py-1 rounded-full text-[11px] font-extrabold text-[#0B84E3] tracking-wide mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            RULETA SALUDABLE · GIRA Y GANA
          </div>

          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            Completa tus datos en 15 segundos y gana beneficios kinésicos
          </p>
        </div>

        <div className="p-5 sm:p-6 bg-gradient-to-b from-white to-slate-50/50">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl text-center font-medium">
              {error}
            </div>
          )}

          {/* PASO 1: FORMULARIO RÁPIDO */}
          {paso === 'formulario' && (
            <form onSubmit={avanzarARuleta} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Tu Nombre y Apellido
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carolina Pérez"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0B84E3] focus:border-[#0B84E3] outline-none text-slate-800 text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  WhatsApp (para enviarte tu voucher)
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  required
                  maxLength={15}
                  placeholder="+56 9 1234 5678"
                  value={form.telefono}
                  onChange={(e) =>
                    setForm({ ...form, telefono: formatearTelefonoCL(e.target.value) })
                  }
                  onFocus={() => {
                    if (!form.telefono) setForm({ ...form, telefono: '+56 9 ' });
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0B84E3] focus:border-[#0B84E3] outline-none text-slate-800 text-base font-semibold tracking-wide"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  ¿Qué molestia o zona te gustaría aliviar?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DOLENCIAS.map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setForm({ ...form, dolencia: item })}
                      className={`p-2.5 text-xs font-semibold rounded-xl border text-left transition active:scale-[0.98] ${
                        form.dolencia === item
                          ? 'bg-sky-50 border-[#0B84E3] text-[#0B84E3] ring-2 ring-[#0B84E3]/20 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Previsión de Salud
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PREVISIONES.map((prev) => (
                    <button
                      type="button"
                      key={prev}
                      onClick={() => setForm({ ...form, prevision: prev })}
                      className={`py-2.5 text-xs font-bold rounded-xl border transition ${
                        form.prevision === prev
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-500 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {prev}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={cargandoPremios}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-[#0B84E3] hover:brightness-105 text-white font-black rounded-2xl shadow-lg shadow-sky-500/25 text-base tracking-wide transition active:scale-[0.99] disabled:opacity-60"
              >
                {cargandoPremios ? 'Cargando premios...' : 'IR A LA RULETA SALUDABLE 🎡'}
              </button>
            </form>
          )}

          {/* PASO 2: RULETA VECTORIAL CON IDENTIDAD DE MARCA */}
          {paso === 'ruleta' && (
            <div className="flex flex-col items-center py-1">
              <div className="relative w-[305px] h-[305px] sm:w-[330px] sm:h-[330px] mb-6 flex items-center justify-center">
                {/* Puntero superior */}
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-transform duration-75 origin-top"
                  style={{
                    transform: `translateX(-50%) rotate(${rebotePuntero ? '-18deg' : '0deg'})`
                  }}
                >
                  <svg width="42" height="46" viewBox="0 0 42 46" className="drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
                    <path
                      d="M21 44 L5 14 A16 16 0 1 1 37 14 Z"
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth="3"
                    />
                    <circle cx="21" cy="15" r="5" fill="#0B84E3" />
                  </svg>
                </div>

                {/* Aro exterior corporativo azul y esmeralda */}
                <div className="w-full h-full rounded-full p-2.5 bg-gradient-to-b from-[#0B84E3] via-sky-700 to-slate-900 shadow-[0_16px_36px_rgba(11,132,227,0.3)] ring-4 ring-emerald-400/80 relative flex items-center justify-center">
                  {/* Disco giratorio acelerado por GPU */}
                  <div
                    ref={wheelRef}
                    className="w-full h-full rounded-full will-change-transform"
                    style={{
                      transform: 'translate3d(0,0,0) rotate(0deg)',
                      backfaceVisibility: 'hidden'
                    }}
                  >
                    <svg viewBox="0 0 320 320" className="w-full h-full overflow-visible">
                      <defs>
                        <radialGradient id="sombraInterior" cx="50%" cy="50%" r="50%">
                          <stop offset="78%" stopColor="#000000" stopOpacity="0" />
                          <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
                        </radialGradient>
                      </defs>

                      {premios.map((p, i) => {
                        const startAngle = i * gradosSector;
                        const endAngle = (i + 1) * gradosSector;
                        const midAngle = startAngle + gradosSector / 2;
                        const lineas = dividirEtiqueta(p.etiqueta_ruleta || p.titulo);

                        const ladoIzquierdo = midAngle > 180 && midAngle < 360;
                        const rotacionTexto = ladoIzquierdo ? midAngle + 90 : midAngle - 90;
                        const posX = ladoIzquierdo ? -94 : 94;

                        const baseFont =
                          totalPremios >= 8 ? 8.2 : totalPremios === 7 ? 8.8 : 9.6;
                        const fontSize = lineas.length === 3 ? baseFont - 1 : baseFont;
                        const lineHeight = fontSize + 2.2;
                        const offsetInicial = -((lineas.length - 1) * lineHeight) / 2;

                        return (
                          <g key={p.id}>
                            <path
                              d={crearArcoTajada(160, 160, 154, startAngle, endAngle)}
                              fill={p.color_hex || '#0B84E3'}
                              stroke="#ffffff"
                              strokeWidth="2.5"
                            />

                            <g transform={`translate(160, 160) rotate(${rotacionTexto})`}>
                              <text
                                x={posX}
                                y="0"
                                fill="#ffffff"
                                textAnchor="middle"
                                dominantBaseline="central"
                                style={{
                                  fontSize: `${fontSize}px`,
                                  fontWeight: 900,
                                  letterSpacing: '0.25px',
                                  paintOrder: 'stroke',
                                  stroke: 'rgba(15,23,42,0.55)',
                                  strokeWidth: '2.4px',
                                  strokeLinejoin: 'round'
                                }}
                              >
                                {lineas.map((linea, idxLinea) => (
                                  <tspan
                                    key={idxLinea}
                                    x={posX}
                                    y={offsetInicial + idxLinea * lineHeight}
                                  >
                                    {linea}
                                  </tspan>
                                ))}
                              </text>
                            </g>
                          </g>
                        );
                      })}

                      <circle cx="160" cy="160" r="154" fill="url(#sombraInterior)" pointerEvents="none" />

                      {/* Pines perimetrales */}
                      {premios.map((p, i) => {
                        const posPin = polarToCartesian(160, 160, 146, i * gradosSector);
                        return (
                          <circle
                            key={`pin-${p.id}`}
                            cx={posPin.x}
                            cy={posPin.y}
                            r="4.2"
                            fill="#ffffff"
                            stroke="#0B84E3"
                            strokeWidth="1.8"
                          />
                        );
                      })}
                    </svg>
                  </div>

                  {/* Botón central fijo con Sello de Marca Centro Kinésico Coronel */}
                  <div className="absolute inset-0 m-auto w-[68px] h-[68px] rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.3)] border-[3.5px] border-emerald-400 flex flex-col items-center justify-center z-20 pointer-events-none px-1">
                    <span className="text-[11px] font-black tracking-tight bg-gradient-to-r from-emerald-500 to-[#0B84E3] bg-clip-text text-transparent leading-none">
                      CKC
                    </span>
                    <span className="text-[7px] font-extrabold tracking-wider text-[#0B84E3] leading-tight mt-0.5">
                      CORONEL
                    </span>
                    <span className="w-6 h-0.5 rounded-full bg-gradient-to-r from-emerald-400 to-[#0B84E3] mt-0.5" />
                  </div>
                </div>
              </div>

              <button
                onClick={girarRuleta}
                disabled={girando}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-[#0B84E3] hover:brightness-105 text-white font-black rounded-2xl shadow-xl shadow-sky-500/30 text-lg tracking-wide transition active:scale-[0.98] disabled:opacity-75"
              >
                {girando ? '¡GIRANDO POR TU PREMIO! 🍀' : '¡GIRAR LA RULETA!'}
              </button>
            </div>
          )}

          {/* PASO 3: VOUCHER GANADOR */}
          {paso === 'premio' && resultado && (
            <div className="text-center space-y-4 py-1 relative">
              <div className="pointer-events-none flex justify-center gap-2 -mb-2">
                {['🎉', '✨', '🎊', '🏆', '✨'].map((emoji, idx) => (
                  <span
                    key={idx}
                    className="text-xl animate-bounce"
                    style={{ animationDelay: `${idx * 120}ms` }}
                  >
                    {emoji}
                  </span>
                ))}
              </div>

              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-4 ring-emerald-50">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
                  ¡Felicidades, {form.nombre.split(' ')[0]}!
                </p>
                <h2 className="text-2xl font-black text-slate-800 mt-1 leading-tight">
                  {resultado.premio.titulo}
                </h2>
                <p className="text-sm text-slate-600 mt-1.5">{resultado.premio.descripcion}</p>
              </div>

              {/* Voucher con colores corporativos */}
              <div className="bg-gradient-to-br from-[#0B84E3] via-sky-700 to-teal-700 text-white rounded-2xl p-4 shadow-md border border-sky-300/40 relative">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-200 block mb-1">
                  Voucher Oficial · Centro Kinésico Coronel
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-mono font-black tracking-widest text-white">
                    {resultado.codigo}
                  </span>
                  <button
                    type="button"
                    onClick={copiarCodigo}
                    className="p-2 rounded-lg bg-white/15 hover:bg-white/25 transition"
                    title="Copiar código"
                  >
                    {copiado ? (
                      <Check className="w-4 h-4 text-emerald-300" />
                    ) : (
                      <Copy className="w-4 h-4 text-white" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-sky-100 mt-2">
                  Presenta esta pantalla en nuestro stand o envíala por WhatsApp para reservar tu atención.
                </p>
              </div>

              <a
                href={`https://wa.me/${WHATSAPP_CENTRO}?text=${encodeURIComponent(
                  `¡Hola Centro Kinésico Coronel! Soy ${form.nombre}, giré la Ruleta Saludable y gané: *${resultado.premio.titulo}* (Código: *${resultado.codigo}*). Quiero validar / agendar mi beneficio.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/25 transition active:scale-[0.99]"
              >
                <MessageCircle className="w-5 h-5" />
                VALIDAR PREMIO POR WHATSAPP
              </a>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-6 py-3 text-center border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          Centro Kinésico Coronel · Fonasa, Isapres y Particular
        </div>
      </div>
    </div>
  );
}