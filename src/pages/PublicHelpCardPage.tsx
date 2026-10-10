import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { ApiError } from '@/services/api/client';
import { tandemApi, type HelpCardPublic } from '@/services/api/tandem-api';
import { formatPhone, whatsappUrl } from '@/lib/helpCard';

// Unica responsabilidad: la pagina publica que ve quien escanea el QR de una
// tarjeta de ayuda (sin sesion, sin widget de accesibilidad, sin nada de la
// app). Tiene que entenderse en 5 segundos: a quien ayudar y como llamar a su
// familia. Muestra solo lo que el backend manda, que es lo que el tutor activo.
type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'inactive' }
  | { status: 'ready'; card: HelpCardPublic };

type Tutor = HelpCardPublic['tutores'][number];

function Header({ label }: { label?: string }) {
  return (
    <header className="flex items-center justify-between bg-[#6B4C9A] px-5 py-4 text-white">
      <span className="font-heading text-2xl font-bold">TÁNDEM</span>
      {label && <span className="text-sm font-bold">{label}</span>}
    </header>
  );
}

function CardShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#FBF9FF] text-[#2b2145]">{children}</div>;
}

function TutorCard({ tutor }: { tutor: Tutor }) {
  const phone = [tutor.parentesco, tutor.celular && formatPhone(tutor.celular)].filter(Boolean).join(' · ');
  return (
    <li className="rounded-[26px] border border-[#ede4f8] bg-white p-4">
      <p className="text-xl font-bold">{tutor.nombre} {tutor.apellido}</p>
      {phone && <p className="mt-0.5 text-sm font-bold text-[#8b7aa0]">{phone}</p>}
      {tutor.celular && (
        <div className="mt-3 flex gap-3">
          <a href={`tel:${tutor.celular}`} className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-[#6B4C9A] text-base font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4C9A] focus-visible:ring-offset-2">
            <span aria-hidden>📞</span> Llamar
          </a>
          <a href={whatsappUrl(tutor.celular)} target="_blank" rel="noopener noreferrer" className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-[#DCF5EA] text-base font-bold text-[#0B6B4A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B4A] focus-visible:ring-offset-2">
            <span aria-hidden>💬</span> WhatsApp
          </a>
        </div>
      )}
      {tutor.mail && (
        <a href={`mailto:${tutor.mail}`} className="mt-3 flex min-h-12 items-center gap-2 break-all text-base font-bold text-[#6B4C9A] underline-offset-2 hover:underline">
          <span aria-hidden>✉️</span> {tutor.mail}
        </a>
      )}
    </li>
  );
}

export default function PublicHelpCardPage({ token }: { token: string }) {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async (isCancelled: () => boolean = () => false) => {
    setState({ status: 'loading' });
    try {
      const card = await tandemApi.tarjetaAyuda.getPublic(token);
      if (!isCancelled()) setState({ status: 'ready', card });
    } catch (error) {
      if (isCancelled()) return;
      setState(error instanceof ApiError && error.status === 404 ? { status: 'inactive' } : { status: 'error' });
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    void load(() => cancelled);
    return () => { cancelled = true; };
  }, [load]);

  // Datos de una persona: que ningun buscador la indexe.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, []);

  if (state.status === 'loading') {
    return (
      <CardShell>
        <Header label="Tarjeta de ayuda" />
        <p role="status" className="flex items-center justify-center gap-2 p-10 text-base font-semibold text-[#8b7aa0]">
          <Loader2 size={20} className="animate-spin" aria-hidden /> Cargando
        </p>
      </CardShell>
    );
  }

  if (state.status === 'error') {
    return (
      <CardShell>
        <Header label="Tarjeta de ayuda" />
        <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <p className="text-lg font-bold">No pudimos cargar la tarjeta.</p>
          <button type="button" onClick={() => void load()} className="min-h-12 rounded-full bg-[#6B4C9A] px-6 text-base font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4C9A] focus-visible:ring-offset-2">
            Probar de nuevo
          </button>
        </div>
      </CardShell>
    );
  }

  if (state.status === 'inactive') {
    return (
      <CardShell>
        <Header />
        <div className="flex flex-col items-center gap-3 px-8 py-24 text-center">
          <span className="text-6xl" aria-hidden>🪪</span>
          <h1 className="font-heading text-3xl font-bold">Esta tarjeta no está activa</h1>
          <p className="max-w-sm text-base text-[#8b7aa0]">Si estás ayudando a alguien, pedile que te muestre otra forma de contactar a su familia.</p>
        </div>
      </CardShell>
    );
  }

  const { card } = state;
  return (
    <CardShell>
      <Header label="Tarjeta de ayuda" />
      <main className="mx-auto w-full max-w-lg space-y-5 px-5 py-6">
        <div>
          <p className="text-base text-[#8b7aa0]">Esta persona puede necesitar ayuda:</p>
          <h1 className="mt-1 font-heading text-4xl font-bold leading-tight">{card.nombre} {card.apellido}</h1>
        </div>

        {card.mensaje && (
          <p className="rounded-[22px] bg-[#F3EFFD] px-4 py-3.5 text-base font-bold"><span aria-hidden>💬</span> {card.mensaje}</p>
        )}

        {card.tutores.length > 0 && (
          <section aria-labelledby="help-card-family">
            <h2 id="help-card-family" className="mb-3 text-sm font-extrabold uppercase tracking-[.08em] text-[#6B4C9A]">Llamá a su familia</h2>
            <ul className="space-y-3">
              {card.tutores.map((tutor, index) => <TutorCard key={`${tutor.nombre}-${tutor.apellido}-${index}`} tutor={tutor} />)}
            </ul>
          </section>
        )}

        {card.domicilio && (
          <section className="rounded-[22px] border border-[#ede4f8] bg-white px-4 py-3.5">
            <p className="text-sm font-bold text-[#8b7aa0]"><span aria-hidden>🏠</span> Vive en</p>
            <p className="mt-0.5 text-base font-bold">{card.domicilio}</p>
          </section>
        )}

        <p className="px-2 pt-2 text-center text-sm text-[#8b7aa0]">Al abrir esta página le avisamos a su familia. Gracias por ayudar.</p>
      </main>
    </CardShell>
  );
}
