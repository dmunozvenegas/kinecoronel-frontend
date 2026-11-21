import { useState, useEffect } from 'react';
import axios from 'axios';
import { Gift, Sparkles, CheckCircle2, Phone, User, ShieldCheck, RefreshCw, MessageCircle } from 'lucide-react';

// Reemplaza const API_BASE = ... por esto al inicio de RuletaFeria.jsx y CrmFeria.jsx:
const RAW_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_BASE = RAW_URL.replace(/\/api\/?$/, ''); // Quita /api si ya venía en el .env
const WHATSAPP_CENTRO = '56973764805'; // <-- Reemplaza por el WhatsApp real de KineCoronel

const DOLENCIAS = [
  'Espalda / Cuello',
  'Lesión Deportiva',
  'Rodilla / Hombro',
  'Masaje Descontracturante',
  'Adulto Mayor / Respiratorio'
];

const PREVISIONES = ['Fonasa', 'Isapre', 'Particular'];

export default function RuletaFeria() {
  const [premios, setPremios] = useState([]);
  const [paso, setPaso] = useState('formulario'); // 'formulario' | 'ruleta' | 'premio'
  const [form, setForm] = useState({
    nombre: '',
    telefono: '+569',
    dolencia: '',
    prevision: 'Fonasa',
    acepta_contacto: true
  });
  const [girando, setGirando] = useState(false);
  const [rotacion, setRotacion] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${API_BASE}/api/feria/premios`)
      .then(res => setPremios(res.data))
      .catch(() => setError('No se pudo conectar con la ruleta. Revisa tu señal.'));
  }, []);

  const avanzarARuleta = (e) => {
    e.preventDefault();
    setError('');
    if (!form.nombre.trim() || !form.dolencia) {
      setError('Por favor ingresa tu nombre y selecciona qué zona te gustaría tratar.');
      return;
    }
    if (form.telefono.replace(/\D/g, '').length < 11) {
      setError('Ingresa tu WhatsApp completo (ej: +56912345678).');
      return;
    }
    setPaso('ruleta');
  };

  const lanzarRuleta = async () => {
    if (girando || premios.length === 0) return;
    setError('');
    setGirando(true);

    try {
      const { data } = await axios.post(`${API_BASE}/api/feria/girar`, form);
      const totalSectores = premios.length;
      const gradosPorSector = 360 / totalSectores;

      // Apuntar el centro del sector ganador hacia el puntero superior (0 deg)
      const anguloCentroSector = data.sectorIndex * gradosPorSector + gradosPorSector / 2;
      const vueltasExtras = 360 * 6; // 6 giros completos
      const destinoFinal = vueltasExtras + (360 - anguloCentroSector);

      setRotacion(destinoFinal);

      setTimeout(() => {
        setResultado(data);
        setGirando(false);
        setPaso('premio');
      }, 4600);
    } catch (err) {
      setGirando(false);
      const resp = err.response?.data;
      if (err.response?.status === 409 && resp?.cuponExistente) {
        setResultado({
          premio: { titulo: resp.cuponExistente.titulo },
          cupon: { codigo: resp.cuponExistente.codigo_cupon, expira_en: resp.cuponExistente.expira_en },
          yaParticipo: true
        });
        setPaso('premio');
      } else {
        setError(resp?.error || 'Ocurrió un error al girar. Intenta nuevamente.');
      }
    }
  };

  const reiniciarKiosco = () => {
    setForm({ nombre: '', telefono: '+569', dolencia: '', prevision: 'Fonasa', acepta_contacto: true });
    setRotacion(0);
    setResultado(null);
    setError('');
    setPaso('formulario');
  };

  // Gradiente cónico dinámico para pintar los sectores de la ruleta
  const generarFondoRuleta = () => {
    if (premios.length === 0) return '#0ea5e9';
    const seg = 360 / premios.length;
    const partes = premios.map((p, i) => `${p.color_hex} ${i * seg}deg ${(i + 1) * seg}deg`);
    return `conic-gradient(${partes.join(', ')})`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white text-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-sky-100">
        {/* Cabecera Marca */}
        <div className="bg-gradient-to-r from-sky-600 to-teal-500 p-6 text-white text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Feria Saludable Coronel
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight">KineCoronel</h1>
          <p className="text-sky-100 text-sm mt-1">Responde en 15 segundos y gira por premios kinésicos</p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {/* PASO 1: ENCUESTA EXPRESS */}
          {paso === 'formulario' && (
            <form onSubmit={avanzarARuleta} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tu Nombre y Apellido</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Ej: Camila Muñoz"
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">WhatsApp (para guardar tu cupón)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    placeholder="+56912345678"
                    value={form.telefono}
                    onChange={e => setForm({ ...form, telefono: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">¿Qué zona te molesta o te interesa hoy?</label>
                <div className="flex flex-wrap gap-2">
                  {DOLENCIAS.map(item => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setForm({ ...form, dolencia: item })}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                        form.dolencia === item
                          ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Previsión de Salud</label>
                <div className="grid grid-cols-3 gap-2">
                  {PREVISIONES.map(prev => (
                    <button
                      type="button"
                      key={prev}
                      onClick={() => setForm({ ...form, prevision: prev })}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        form.prevision === prev
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {prev}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-slate-500 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.acepta_contacto}
                  onChange={e => setForm({ ...form, acepta_contacto: e.target.checked })}
                  className="mt-0.5 rounded text-sky-600"
                  required
                />
                <span>Acepto recibir mi cupón y promociones de salud de KineCoronel por WhatsApp.</span>
              </label>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2"
              >
                <Gift className="w-5 h-5" /> Pasar a la Ruleta
              </button>
            </form>
          )}

          {/* PASO 2: RULETA ANIMADA */}
          {paso === 'ruleta' && (
            <div className="flex flex-col items-center py-2">
              <div className="relative w-72 h-72 mb-6 flex items-center justify-center">
                {/* Puntero Superior */}
                <div className="absolute -top-3 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[26px] border-t-amber-400 drop-shadow-md" />

                {/* Disco Giratorio */}
                <div
                  className="w-full h-full rounded-full border-8 border-slate-800 shadow-xl relative overflow-hidden"
                  style={{
                    background: generarFondoRuleta(),
                    transform: `rotate(${rotacion}deg)`,
                    transition: girando ? 'transform 4.5s cubic-bezier(0.15, 0.85, 0.15, 1)' : 'none'
                  }}
                >
                  {premios.map((p, i) => {
                    const seg = 360 / premios.length;
                    const rotTexto = i * seg + seg / 2;
                    return (
                      <div
                        key={p.id}
                        className="absolute top-0 left-1/2 h-1/2 origin-bottom -translate-x-1/2 flex items-start pt-4"
                        style={{ transform: `translateX(-50%) rotate(${rotTexto}deg)` }}
                      >
                        <span
                          className="text-[10px] font-extrabold text-white uppercase tracking-tight drop-shadow text-center block w-16 leading-tight"
                          style={{ writingMode: 'vertical-rl' }}
                        >
                          {p.etiqueta_ruleta}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Botón central */}
                <div className="absolute w-14 h-14 rounded-full bg-white border-4 border-slate-800 shadow flex items-center justify-center font-black text-xs text-sky-700 z-10">
                  KINE
                </div>
              </div>

              <button
                onClick={lanzarRuleta}
                disabled={girando}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-extrabold text-lg rounded-2xl shadow-lg transition"
              >
                {girando ? '¡Girando mucha suerte!...' : '¡GIRAR AHORA!'}
              </button>
            </div>
          )}

          {/* PASO 3: CUPÓN GANADOR */}
          {paso === 'premio' && resultado && (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              {resultado.yaParticipo && (
                <p className="text-xs font-semibold text-amber-600 bg-amber-50 py-1 px-3 rounded-full inline-block">
                  Ya habías participado — Aquí está tu cupón guardado:
                </p>
              )}

              <div>
                <p className="text-xs uppercase font-bold text-slate-400">Premio Obtenido</p>
                <h2 className="text-xl font-extrabold text-slate-800 mt-1">{resultado.premio.titulo}</h2>
              </div>

              <div className="bg-slate-50 border-2 border-dashed border-sky-400 rounded-2xl p-4">
                <p className="text-xs text-slate-500">Muestra este código en el stand o al agendar:</p>
                <p className="text-3xl font-black tracking-widest text-sky-700 my-1">{resultado.cupon.codigo}</p>
                <p className="text-[11px] text-slate-400">
                  Válido hasta el {new Date(resultado.cupon.expira_en).toLocaleDateString('es-CL')}
                </p>
              </div>

              <a
                href={`https://wa.me/${WHATSAPP_CENTRO}?text=${encodeURIComponent(
                  `¡Hola KineCoronel! Soy ${form.nombre}, acabo de ganar "${resultado.premio.titulo}" en la feria con el código ${resultado.cupon.codigo} y quiero agendar mi hora.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" /> Reclamar / Agendar por WhatsApp
              </a>

              <button
                onClick={reiniciarKiosco}
                className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 pt-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Modo Stand: Siguiente participante
              </button>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-6 py-3 text-center border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Atención Fonasa, Isapres y Particular en Coronel
        </div>
      </div>
    </div>
  );
}