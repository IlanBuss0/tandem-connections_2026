import {
  CalendarDays,
  HeartHandshake,
  MapPinned,
  MessageCircleHeart,
  Sparkles,
  Star,
  Stethoscope,
  UserRound,
  UsersRound,
} from 'lucide-react';
import './Landing.css';

type PublicView = 'landing' | 'login' | 'register';

type LandingProps = {
  onNavigate: (view: PublicView) => void;
};

const audiences = [
  {
    eyebrow: 'Para pertenecientes',
    title: 'Tu dia, a tu ritmo.',
    icon: UserRound,
    problem: 'Organizar el dia, anticipar actividades o expresar emociones puede requerir apoyos claros y tranquilos.',
    offers: [
      'Calendario simple y visual.',
      'Tareas y actividades ordenadas.',
      'Registro emocional con emojis y comentarios.',
      'Avatar, puntos y motivación accesible.',
    ],
  },
  {
    eyebrow: 'Para tutores y familias',
    title: 'Acompañar mejor, sin ocupar el lugar del otro.',
    icon: UsersRound,
    problem: 'Acompañar muchas veces implica estar pendiente de todo y decidir cuándo intervenir sin invadir.',
    offers: [
      'Seguimiento de actividades.',
      'Información sobre cómo se sintió la persona.',
      'Visualización de avances.',
      'Geolocalización configurable en plan pago.',
    ],
  },
  {
    eyebrow: 'Para profesionales',
    title: 'Más contexto para acompañar mejor.',
    icon: Stethoscope,
    problem: 'Entre sesiones, la información puede llegar incompleta, desordenada o depender solo del relato familiar.',
    offers: [
      'Listado de seguimiento.',
      'Registro emocional luego de tareas.',
      'Información concreta sobre rutinas y dificultades.',
      'Sesión virtual de prueba dentro de la app.',
    ],
  },
];

const problems = [
  'Rutinas difíciles de ordenar o anticipar.',
  'Emociones que no siempre encuentran una forma clara de expresarse.',
  'Comunicación fragmentada entre persona, familia y profesional.',
  'Sobrecarga familiar y seguimientos poco consistentes.',
  'Herramientas poco accesibles para necesidades reales.',
];

const features = [
  { icon: CalendarDays, title: 'Organización diaria', text: 'Calendario, tareas y actividades destacadas para construir previsibilidad.' },
  { icon: MessageCircleHeart, title: 'Registro emocional', text: 'Emojis y comentarios para contar cómo se vivió cada actividad.' },
  { icon: HeartHandshake, title: 'Acompañamiento claro', text: 'Paneles para tutores y profesionales con información más ordenada.' },
  { icon: Sparkles, title: 'Motivación cuidada', text: 'Avatar personalizable, puntos y recursos visuales sin infantilizar la experiencia.' },
  { icon: MapPinned, title: 'Plan premium', text: 'Estamos construyendo prueba gratis, geolocalización y lugares configurables.' },
  { icon: Star, title: 'Profesionales', text: 'Seguimiento y posibilidad de ofrecer una primera sesión virtual de prueba.' },
];

const steps = [
  'La persona organiza su día con apoyos claros.',
  'Realiza tareas y actividades a su ritmo.',
  'Registra cómo se sintió después.',
  'Tutores y profesionales acompañan con información más clara.',
];

export default function Landing({ onNavigate }: LandingProps) {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <button className="landing-brand" type="button" onClick={() => onNavigate('landing')}>
          <img className="landing-brand-logo" src="/tandem-logo.png" alt="TÁNDEM" />
          <span className="landing-brand-text">Avanzamos juntos</span>
        </button>
        <nav className="landing-actions" aria-label="Acceso">
          <button className="landing-button landing-button-secondary" type="button" onClick={() => onNavigate('login')}>
            Iniciar sesion
          </button>
          <button className="landing-button landing-button-primary" type="button" onClick={() => onNavigate('register')}>
            Registrarse
          </button>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-kicker">TÁNDEM · Avanzamos juntos</p>
          <h1>TÁNDEM: una forma más humana de acompañar la autonomía</h1>
          <p className="landing-hero-text">
            Una plataforma pensada para personas con TEA, familias y profesionales. Organizamos rutinas,
            emociones y acompañamiento en un mismo lugar, para que cada persona pueda avanzar a su ritmo.
          </p>
          <div className="landing-hero-actions">
            <a className="landing-link-button landing-button-primary" href="#app">
              Conocer la app
            </a>
            <a className="landing-link-button landing-button-muted" href="#tutores">
              Soy tutor
            </a>
            <a className="landing-link-button landing-button-muted" href="#profesionales">
              Soy profesional
            </a>
          </div>
        </div>
        <div className="landing-hero-panel" aria-label="Resumen visual de TÁNDEM">
          <div className="landing-phone">
            <div className="landing-phone-top">Mi día</div>
            <div className="landing-task landing-task-strong">
              <span>Actividad destacada</span>
              <strong>Preparar mochila</strong>
            </div>
            <div className="landing-task">
              <span>Cómo me sentí</span>
              <strong>Tranquilo 🙂</strong>
            </div>
            <div className="landing-progress">
              <span>Avance semanal</span>
              <strong>4 de 5 rutinas</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-problem-section" id="problema">
        <div className="landing-section-heading">
          <p className="landing-kicker">El problema</p>
          <h2>Acompañar también necesita orden, claridad y respeto.</h2>
          <p>
            Muchas personas con TEA y sus redes de apoyo conviven con herramientas dispersas. TÁNDEM busca
            ordenar esa información sin convertir la experiencia en algo frío o médico.
          </p>
        </div>
        <div className="landing-problem-grid">
          {problems.map(problem => (
            <article className="landing-problem-card" key={problem}>
              <span className="landing-dot" />
              <p>{problem}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" id="publicos">
        <div className="landing-section-heading">
          <p className="landing-kicker">Tres miradas</p>
          <h2>Un espacio pensado para quienes viven, acompanan y orientan el proceso.</h2>
        </div>
        <div className="landing-audience-grid">
          {audiences.map(({ eyebrow, title, icon: Icon, problem, offers }) => (
            <article
              className="landing-audience-card"
              id={eyebrow.includes('tutores') ? 'tutores' : eyebrow.includes('profesionales') ? 'profesionales' : undefined}
              key={title}
            >
              <div className="landing-card-icon">
                <Icon aria-hidden="true" />
              </div>
              <p className="landing-card-eyebrow">{eyebrow}</p>
              <h3>{title}</h3>
              <p>{problem}</p>
              <ul>
                {offers.map(offer => (
                  <li key={offer}>{offer}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-building-section">
        <div className="landing-building-copy">
          <p className="landing-kicker">Que queremos construir</p>
          <h2>Tecnología que ordene los vínculos y los haga más humanos.</h2>
          <p>
            TÁNDEM busca ser una herramienta inclusiva, simple y respetuosa: un puente entre persona,
            familia y profesional donde cada avance, incluso pequeño, tenga valor.
          </p>
        </div>
        <div className="landing-building-list">
          <span>Promover autonomía</span>
          <span>Acompañar sin invadir</span>
          <span>Comunicar con claridad</span>
          <span>Valorar cada avance</span>
        </div>
      </section>

      <section className="landing-section" id="app">
        <div className="landing-section-heading">
          <p className="landing-kicker">Funcionalidades</p>
          <h2>Estamos construyendo una app que acompaña la vida cotidiana.</h2>
        </div>
        <div className="landing-feature-grid">
          {features.map(({ icon: Icon, title, text }) => (
            <article className="landing-feature-card" key={title}>
              <Icon aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-steps-section">
        <div className="landing-section-heading">
          <p className="landing-kicker">Cómo funciona</p>
          <h2>Un recorrido simple para acompañar con más información.</h2>
        </div>
        <ol className="landing-steps">
          {steps.map((step, index) => (
            <li key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-final-cta">
        <h2>Una app no cambia todo. Una herramienta bien pensada puede hacer que acompanar sea mas claro, respetuoso y humano.</h2>
        <button className="landing-button landing-button-primary" type="button" onClick={() => onNavigate('register')}>
          Empezar con TÁNDEM
        </button>
      </section>
    </main>
  );
}
