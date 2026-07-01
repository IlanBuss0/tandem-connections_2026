// ==================== USERS ====================
export type UserRole = 'user' | 'tutor' | 'professional' | 'admin';

// ==================== ADMIN (Super Admin / Developer) ====================
export interface Admin {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'admin';
  email: string;
  avatar: string;
  clearance: 'developer' | 'superadmin';
}

export const admins: Admin[] = [
  { id: 'a1', username: 'root', password: 'root', name: 'Root Developer', role: 'admin', email: 'root@tandem.dev', avatar: '🛡️', clearance: 'developer' },
  { id: 'a2', username: 'admin', password: 'admin', name: 'Super Admin', role: 'admin', email: 'admin@tandem.dev', avatar: '⚡', clearance: 'superadmin' },
];

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  email: string;
  avatar: string;
  age?: number;
  bio?: string;
  linkedTutorIds?: string[];
  linkedProfessionalIds?: string[];
  linkedUserIds?: string[];
  points: number;
  streak: number;
  level: number;
  plan: 'free' | 'premium';
  simplifiedMode?: boolean;
  onboarded?: boolean;
  supportLevel?: 'bajo' | 'medio' | 'alto';
  goals?: string[];
}

const emojiAvatars = ['😊','🧑','👩','👨','🧒','👧','👦','🧔','👩‍🦰','👨‍🦱','👩‍🔬','👨‍⚕️','👩‍💼','🧑‍🏫','👩‍⚕️','🧑‍💻','👨‍🎨','👩‍🎓','🧑‍🔧','👨‍🍳','👩‍🚀','🧑‍🎤'];

export const users: User[] = [
  { id: 'u1', username: 'juan123', password: '123456', name: 'Juan García', role: 'user', email: 'juan@tandem.app', avatar: '🧒', age: 16, bio: 'Me gusta la música y los videojuegos. Estoy aprendiendo a organizarme mejor cada día.', linkedTutorIds: ['t1'], linkedProfessionalIds: ['p1'], points: 2450, streak: 12, level: 8, plan: 'premium', onboarded: true, supportLevel: 'medio', goals: ['Ser más independiente', 'Organizarme mejor'] },
  { id: 'u2', username: 'sofia_m', password: '123456', name: 'Sofía Martínez', role: 'user', email: 'sofia@tandem.app', avatar: '👧', age: 14, bio: 'Amo dibujar y los animales.', linkedTutorIds: ['t2'], linkedProfessionalIds: ['p2'], points: 1800, streak: 7, level: 6, plan: 'free', onboarded: true, supportLevel: 'alto', goals: ['Mejorar mi higiene', 'Hacer amigos'] },
  { id: 'u3', username: 'mateo_r', password: '123456', name: 'Mateo Rodríguez', role: 'user', email: 'mateo@tandem.app', avatar: '👦', age: 18, bio: 'Estudiante de computación, me interesa la tecnología.', linkedTutorIds: ['t3'], linkedProfessionalIds: ['p3'], points: 3100, streak: 20, level: 10, plan: 'premium', onboarded: true, supportLevel: 'bajo', goals: ['Trabajar de forma independiente'] },
  { id: 'u4', username: 'vale_l', password: '123456', name: 'Valentina López', role: 'user', email: 'vale@tandem.app', avatar: '👩', age: 15, bio: 'Me gusta cocinar y leer cuentos.', linkedTutorIds: ['t4'], linkedProfessionalIds: ['p1'], points: 950, streak: 3, level: 4, plan: 'free', onboarded: true, supportLevel: 'medio' },
  { id: 'u5', username: 'tomas_b', password: '123456', name: 'Tomás Benítez', role: 'user', email: 'tomas@tandem.app', avatar: '🧑', age: 17, bio: 'Fanático del fútbol y los rompecabezas.', linkedTutorIds: ['t5'], linkedProfessionalIds: ['p4'], points: 1200, streak: 5, level: 5, plan: 'free', onboarded: true, supportLevel: 'medio' },
  { id: 'u6', username: 'camila_s', password: '123456', name: 'Camila Sánchez', role: 'user', email: 'camila@tandem.app', avatar: '👧', age: 13, bio: 'Me encanta la natación.', linkedTutorIds: ['t6'], linkedProfessionalIds: ['p2'], points: 700, streak: 2, level: 3, plan: 'free', onboarded: true, supportLevel: 'alto' },
  { id: 'u7', username: 'nico_f', password: '123456', name: 'Nicolás Fernández', role: 'user', email: 'nico@tandem.app', avatar: '👦', age: 19, bio: 'Trabajo en un taller y aprendo cosas nuevas.', linkedTutorIds: ['t7'], linkedProfessionalIds: ['p5'], points: 2800, streak: 15, level: 9, plan: 'premium', onboarded: true, supportLevel: 'bajo' },
  { id: 'u8', username: 'lucia_d', password: '123456', name: 'Lucía Domínguez', role: 'user', email: 'lucia@tandem.app', avatar: '👩', age: 16, bio: 'Toco el piano y me gusta el arte.', linkedTutorIds: ['t8'], linkedProfessionalIds: ['p6'], points: 1600, streak: 8, level: 6, plan: 'free', onboarded: true, supportLevel: 'medio' },
  { id: 'u9', username: 'benja_v', password: '123456', name: 'Benjamín Vargas', role: 'user', email: 'benja@tandem.app', avatar: '🧒', age: 14, bio: 'Me gustan los trenes y los mapas.', linkedTutorIds: ['t9'], linkedProfessionalIds: ['p3'], points: 500, streak: 1, level: 2, plan: 'free', onboarded: true, supportLevel: 'alto' },
  { id: 'u10', username: 'mia_c', password: '123456', name: 'Mía Castro', role: 'user', email: 'mia@tandem.app', avatar: '👧', age: 17, bio: 'Quiero ser veterinaria.', linkedTutorIds: ['t10'], linkedProfessionalIds: ['p7'], points: 2100, streak: 10, level: 7, plan: 'premium', onboarded: true, supportLevel: 'bajo' },
  { id: 'u11', username: 'agus_p', password: '123456', name: 'Agustín Pérez', role: 'user', email: 'agus@tandem.app', avatar: '👦', age: 15, bio: 'Me gusta armar cosas con las manos.', linkedTutorIds: ['t1'], linkedProfessionalIds: ['p8'], points: 900, streak: 4, level: 4, plan: 'free', onboarded: true, supportLevel: 'medio' },
  { id: 'u12', username: 'emma_g', password: '123456', name: 'Emma González', role: 'user', email: 'emma@tandem.app', avatar: '👩', age: 13, bio: 'Amo los gatos y los juegos de mesa.', linkedTutorIds: ['t2'], linkedProfessionalIds: ['p9'], points: 400, streak: 2, level: 2, plan: 'free', onboarded: true, supportLevel: 'alto' },
  { id: 'u13', username: 'fede_m', password: '123456', name: 'Federico Morales', role: 'user', email: 'fede@tandem.app', avatar: '🧑', age: 20, bio: 'Estudio gastronomía, me apasiona cocinar.', linkedTutorIds: ['t3'], linkedProfessionalIds: ['p10'], points: 3500, streak: 25, level: 11, plan: 'premium', onboarded: true, supportLevel: 'bajo' },
  { id: 'u14', username: 'caro_h', password: '123456', name: 'Carolina Herrera', role: 'user', email: 'caro@tandem.app', avatar: '👧', age: 16, bio: 'Me gusta la fotografía y los viajes.', linkedTutorIds: ['t4'], linkedProfessionalIds: ['p1'], points: 1100, streak: 6, level: 5, plan: 'free', onboarded: true, supportLevel: 'medio' },
  { id: 'u15', username: 'santi_r', password: '123456', name: 'Santiago Ruiz', role: 'user', email: 'santi@tandem.app', avatar: '👦', age: 18, bio: 'Me relaja escuchar podcasts.', linkedTutorIds: ['t5'], linkedProfessionalIds: ['p2'], points: 1900, streak: 9, level: 7, plan: 'free', onboarded: true, supportLevel: 'medio' },
  { id: 'u16', username: 'isa_n', password: '123456', name: 'Isabella Navarro', role: 'user', email: 'isa@tandem.app', avatar: '👩', age: 14, bio: 'Me gusta bailar y hacer yoga.', linkedTutorIds: ['t6'], linkedProfessionalIds: ['p5'], points: 750, streak: 3, level: 3, plan: 'free', onboarded: true, supportLevel: 'medio' },
  { id: 'u17', username: 'martin_a', password: '123456', name: 'Martín Álvarez', role: 'user', email: 'martin@tandem.app', avatar: '🧒', age: 17, bio: 'Hago deporte y me gusta la naturaleza.', linkedTutorIds: ['t7'], linkedProfessionalIds: ['p6'], points: 2200, streak: 11, level: 8, plan: 'premium', onboarded: true, supportLevel: 'bajo' },
  { id: 'u18', username: 'renata_t', password: '123456', name: 'Renata Torres', role: 'user', email: 'renata@tandem.app', avatar: '👧', age: 15, bio: 'Me encanta la música y cantar.', linkedTutorIds: ['t8'], linkedProfessionalIds: ['p7'], points: 1300, streak: 5, level: 5, plan: 'free', onboarded: true, supportLevel: 'medio' },
  { id: 'u19', username: 'leo_c', password: '123456', name: 'Leonardo Cruz', role: 'user', email: 'leo@tandem.app', avatar: '👦', age: 19, bio: 'Aprendo carpintería, me gusta crear.', linkedTutorIds: ['t9'], linkedProfessionalIds: ['p8'], points: 2700, streak: 14, level: 9, plan: 'premium', onboarded: true, supportLevel: 'bajo' },
  { id: 'u20', username: 'pau_e', password: '123456', name: 'Paula Espinoza', role: 'user', email: 'pau@tandem.app', avatar: '👩', age: 16, bio: 'Me gusta escribir historias cortas.', linkedTutorIds: ['t10'], linkedProfessionalIds: ['p9'], points: 1050, streak: 4, level: 4, plan: 'free', onboarded: true, supportLevel: 'medio' },
];

// ==================== TUTORS ====================
export interface Tutor {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'tutor';
  email: string;
  avatar: string;
  relation: string;
  linkedUserIds: string[];
  phone: string;
}

export const tutors: Tutor[] = [
  { id: 't1', username: 'laura_g', password: '123456', name: 'Laura Gómez', role: 'tutor', email: 'laura@tandem.app', avatar: '👩', relation: 'Madre', linkedUserIds: ['u1','u11'], phone: '+54 11 5555-0001' },
  { id: 't2', username: 'carlos_m', password: '123456', name: 'Carlos Martínez', role: 'tutor', email: 'carlos@tandem.app', avatar: '👨', relation: 'Padre', linkedUserIds: ['u2','u12'], phone: '+54 11 5555-0002' },
  { id: 't3', username: 'ana_r', password: '123456', name: 'Ana Rodríguez', role: 'tutor', email: 'ana@tandem.app', avatar: '👩', relation: 'Madre', linkedUserIds: ['u3','u13'], phone: '+54 11 5555-0003' },
  { id: 't4', username: 'pedro_l', password: '123456', name: 'Pedro López', role: 'tutor', email: 'pedro@tandem.app', avatar: '👨', relation: 'Padre', linkedUserIds: ['u4','u14'], phone: '+54 11 5555-0004' },
  { id: 't5', username: 'maria_b', password: '123456', name: 'María Benítez', role: 'tutor', email: 'maria@tandem.app', avatar: '👩', relation: 'Madre', linkedUserIds: ['u5','u15'], phone: '+54 11 5555-0005' },
  { id: 't6', username: 'roberto_s', password: '123456', name: 'Roberto Sánchez', role: 'tutor', email: 'roberto@tandem.app', avatar: '👨', relation: 'Padre', linkedUserIds: ['u6','u16'], phone: '+54 11 5555-0006' },
  { id: 't7', username: 'elena_f', password: '123456', name: 'Elena Fernández', role: 'tutor', email: 'elena@tandem.app', avatar: '👩', relation: 'Madre', linkedUserIds: ['u7','u17'], phone: '+54 11 5555-0007' },
  { id: 't8', username: 'jorge_d', password: '123456', name: 'Jorge Domínguez', role: 'tutor', email: 'jorge@tandem.app', avatar: '👨', relation: 'Padre', linkedUserIds: ['u8','u18'], phone: '+54 11 5555-0008' },
  { id: 't9', username: 'silvia_v', password: '123456', name: 'Silvia Vargas', role: 'tutor', email: 'silvia@tandem.app', avatar: '👩', relation: 'Madre', linkedUserIds: ['u9','u19'], phone: '+54 11 5555-0009' },
  { id: 't10', username: 'diego_c', password: '123456', name: 'Diego Castro', role: 'tutor', email: 'diego@tandem.app', avatar: '👨', relation: 'Padre', linkedUserIds: ['u10','u20'], phone: '+54 11 5555-0010' },
  { id: 't11', username: 'patricia_a', password: '123456', name: 'Patricia Agüero', role: 'tutor', email: 'patricia@tandem.app', avatar: '👩', relation: 'Abuela', linkedUserIds: ['u1'], phone: '+54 11 5555-0011' },
  { id: 't12', username: 'raul_m', password: '123456', name: 'Raúl Méndez', role: 'tutor', email: 'raul@tandem.app', avatar: '👨', relation: 'Tío', linkedUserIds: ['u3'], phone: '+54 11 5555-0012' },
  { id: 't13', username: 'clara_h', password: '123456', name: 'Clara Herrera', role: 'tutor', email: 'clara@tandem.app', avatar: '👩', relation: 'Madrina', linkedUserIds: ['u5'], phone: '+54 11 5555-0013' },
  { id: 't14', username: 'oscar_t', password: '123456', name: 'Óscar Torres', role: 'tutor', email: 'oscar@tandem.app', avatar: '👨', relation: 'Padre', linkedUserIds: ['u7'], phone: '+54 11 5555-0014' },
  { id: 't15', username: 'marta_p', password: '123456', name: 'Marta Paz', role: 'tutor', email: 'marta@tandem.app', avatar: '👩', relation: 'Madre', linkedUserIds: ['u9'], phone: '+54 11 5555-0015' },
  { id: 't16', username: 'fernando_g', password: '123456', name: 'Fernando Giménez', role: 'tutor', email: 'fernando@tandem.app', avatar: '👨', relation: 'Padre', linkedUserIds: ['u2'], phone: '+54 11 5555-0016' },
  { id: 't17', username: 'rosa_n', password: '123456', name: 'Rosa Navarro', role: 'tutor', email: 'rosa@tandem.app', avatar: '👩', relation: 'Abuela', linkedUserIds: ['u4'], phone: '+54 11 5555-0017' },
  { id: 't18', username: 'hugo_r', password: '123456', name: 'Hugo Rivas', role: 'tutor', email: 'hugo@tandem.app', avatar: '👨', relation: 'Tutor legal', linkedUserIds: ['u6'], phone: '+54 11 5555-0018' },
  { id: 't19', username: 'lucia_s', password: '123456', name: 'Lucía Sosa', role: 'tutor', email: 'luciasosa@tandem.app', avatar: '👩', relation: 'Madre', linkedUserIds: ['u8'], phone: '+54 11 5555-0019' },
  { id: 't20', username: 'andres_c', password: '123456', name: 'Andrés Campos', role: 'tutor', email: 'andres@tandem.app', avatar: '👨', relation: 'Padre', linkedUserIds: ['u10'], phone: '+54 11 5555-0020' },
];

// ==================== PROFESSIONALS ====================
export interface Professional {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'professional';
  email: string;
  avatar: string;
  specialty: string;
  description: string;
  modality: string;
  availability: string;
  linkedUserIds: string[];
  phone: string;
}

export const professionals: Professional[] = [
  { id: 'p1', username: 'martina_p', password: '123456', name: 'Lic. Martina Pérez', role: 'professional', email: 'martina@tandem.app', avatar: '👩‍⚕️', specialty: 'Psicología - TEA', description: 'Especialista en intervenciones cognitivo-conductuales para adolescentes con TEA. 10 años de experiencia.', modality: 'Presencial y virtual', availability: 'Lunes a viernes 9-18h', linkedUserIds: ['u1','u4','u14'], phone: '+54 11 6666-0001' },
  { id: 'p2', username: 'lucas_o', password: '123456', name: 'Dr. Lucas Ortega', role: 'professional', email: 'lucas@tandem.app', avatar: '👨‍⚕️', specialty: 'Psiquiatría infanto-juvenil', description: 'Médico psiquiatra especializado en neurodesarrollo. Abordaje integral y familiar.', modality: 'Virtual', availability: 'Martes y jueves 10-16h', linkedUserIds: ['u2','u6','u15'], phone: '+54 11 6666-0002' },
  { id: 'p3', username: 'carolina_v', password: '123456', name: 'Lic. Carolina Vega', role: 'professional', email: 'carolina@tandem.app', avatar: '👩‍💼', specialty: 'Terapia Ocupacional', description: 'Acompaño a jóvenes en el desarrollo de habilidades para la vida diaria y autonomía.', modality: 'Presencial', availability: 'Lunes, miércoles y viernes 8-14h', linkedUserIds: ['u3','u9'], phone: '+54 11 6666-0003' },
  { id: 'p4', username: 'pablo_i', password: '123456', name: 'Lic. Pablo Ibáñez', role: 'professional', email: 'pablo@tandem.app', avatar: '👨‍⚕️', specialty: 'Fonoaudiología', description: 'Trabajo en comunicación aumentativa y alternativa. Enfoque pragmático del lenguaje.', modality: 'Presencial y virtual', availability: 'Lunes a viernes 14-20h', linkedUserIds: ['u5'], phone: '+54 11 6666-0004' },
  { id: 'p5', username: 'natalia_j', password: '123456', name: 'Dra. Natalia Juárez', role: 'professional', email: 'natalia@tandem.app', avatar: '👩‍⚕️', specialty: 'Neurología pediátrica', description: 'Neuróloga con enfoque en diagnóstico y seguimiento de condiciones del neurodesarrollo.', modality: 'Presencial', availability: 'Miércoles y viernes 9-13h', linkedUserIds: ['u7','u16'], phone: '+54 11 6666-0005' },
  { id: 'p6', username: 'marcos_d', password: '123456', name: 'Lic. Marcos Delgado', role: 'professional', email: 'marcos@tandem.app', avatar: '👨‍⚕️', specialty: 'Psicopedagogía', description: 'Apoyo en estrategias de aprendizaje y adaptaciones escolares para jóvenes con TEA.', modality: 'Virtual', availability: 'Martes a jueves 10-18h', linkedUserIds: ['u8','u17'], phone: '+54 11 6666-0006' },
  { id: 'p7', username: 'valeria_m', password: '123456', name: 'Lic. Valeria Moreno', role: 'professional', email: 'valeria@tandem.app', avatar: '👩‍💼', specialty: 'Trabajo Social', description: 'Acompaño familias en la articulación de redes de apoyo y recursos comunitarios.', modality: 'Presencial y virtual', availability: 'Lunes a viernes 8-16h', linkedUserIds: ['u10','u18'], phone: '+54 11 6666-0007' },
  { id: 'p8', username: 'gabriel_r', password: '123456', name: 'Lic. Gabriel Ríos', role: 'professional', email: 'gabriel@tandem.app', avatar: '👨‍⚕️', specialty: 'Psicología - ABA', description: 'Analista de conducta aplicada con enfoque en adolescentes y jóvenes adultos.', modality: 'Presencial', availability: 'Lunes, miércoles y viernes 14-20h', linkedUserIds: ['u11','u19'], phone: '+54 11 6666-0008' },
  { id: 'p9', username: 'andrea_l', password: '123456', name: 'Lic. Andrea Luna', role: 'professional', email: 'andrea@tandem.app', avatar: '👩‍⚕️', specialty: 'Musicoterapia', description: 'Uso la música como herramienta terapéutica para la expresión emocional y la comunicación.', modality: 'Presencial', availability: 'Martes y jueves 15-19h', linkedUserIds: ['u12','u20'], phone: '+54 11 6666-0009' },
  { id: 'p10', username: 'sergio_a', password: '123456', name: 'Dr. Sergio Acosta', role: 'professional', email: 'sergio@tandem.app', avatar: '👨‍⚕️', specialty: 'Pediatría del desarrollo', description: 'Pediatra especializado en seguimiento integral de niños y adolescentes con TEA.', modality: 'Presencial y virtual', availability: 'Lunes a viernes 8-12h', linkedUserIds: ['u13'], phone: '+54 11 6666-0010' },
  { id: 'p11', username: 'daniela_f', password: '123456', name: 'Lic. Daniela Flores', role: 'professional', email: 'daniela@tandem.app', avatar: '👩‍💼', specialty: 'Psicología positiva', description: 'Enfoque en fortalezas, bienestar y calidad de vida en personas neurodivergentes.', modality: 'Virtual', availability: 'Lunes a viernes 10-14h', linkedUserIds: [], phone: '+54 11 6666-0011' },
  { id: 'p12', username: 'hernan_b', password: '123456', name: 'Lic. Hernán Bustos', role: 'professional', email: 'hernan@tandem.app', avatar: '👨‍⚕️', specialty: 'Kinesiología', description: 'Trabajo corporal y sensorial para mejorar la regulación y el bienestar físico.', modality: 'Presencial', availability: 'Miércoles y viernes 8-12h', linkedUserIds: [], phone: '+54 11 6666-0012' },
  { id: 'p13', username: 'camila_r', password: '123456', name: 'Lic. Camila Romero', role: 'professional', email: 'camilar@tandem.app', avatar: '👩‍⚕️', specialty: 'Arte-terapia', description: 'El arte como vía de expresión y comunicación. Grupos e individual.', modality: 'Presencial y virtual', availability: 'Martes y jueves 10-14h', linkedUserIds: [], phone: '+54 11 6666-0013' },
  { id: 'p14', username: 'ignacio_m', password: '123456', name: 'Lic. Ignacio Medina', role: 'professional', email: 'ignacio@tandem.app', avatar: '👨‍⚕️', specialty: 'Integración sensorial', description: 'Especialista en procesamiento sensorial y estrategias de regulación.', modality: 'Presencial', availability: 'Lunes a viernes 14-18h', linkedUserIds: [], phone: '+54 11 6666-0014' },
  { id: 'p15', username: 'paula_g', password: '123456', name: 'Lic. Paula Gutiérrez', role: 'professional', email: 'paulag@tandem.app', avatar: '👩‍💼', specialty: 'Coaching TEA adultos', description: 'Acompaño a jóvenes adultos con TEA en la transición a la vida independiente.', modality: 'Virtual', availability: 'Lunes y miércoles 16-20h', linkedUserIds: [], phone: '+54 11 6666-0015' },
  { id: 'p16', username: 'facundo_s', password: '123456', name: 'Lic. Facundo Silva', role: 'professional', email: 'facundo@tandem.app', avatar: '👨‍⚕️', specialty: 'Nutrición TEA', description: 'Abordaje nutricional considerando selectividad alimentaria y necesidades especiales.', modality: 'Presencial y virtual', availability: 'Martes a jueves 9-13h', linkedUserIds: [], phone: '+54 11 6666-0016' },
  { id: 'p17', username: 'florencia_h', password: '123456', name: 'Lic. Florencia Heredia', role: 'professional', email: 'florencia@tandem.app', avatar: '👩‍⚕️', specialty: 'Psicomotricidad', description: 'Trabajo el vínculo entre cuerpo, emoción y pensamiento a través del movimiento.', modality: 'Presencial', availability: 'Lunes y viernes 10-14h', linkedUserIds: [], phone: '+54 11 6666-0017' },
  { id: 'p18', username: 'esteban_p', password: '123456', name: 'Dr. Esteban Parodi', role: 'professional', email: 'esteban@tandem.app', avatar: '👨‍⚕️', specialty: 'Genética médica', description: 'Asesoramiento genético para familias con diagnóstico de TEA.', modality: 'Virtual', availability: 'Jueves 9-13h', linkedUserIds: [], phone: '+54 11 6666-0018' },
  { id: 'p19', username: 'sol_d', password: '123456', name: 'Lic. Sol Domínguez', role: 'professional', email: 'sol@tandem.app', avatar: '👩‍💼', specialty: 'Terapia asistida con animales', description: 'Intervenciones con perros de terapia para trabajar habilidades sociales y emocionales.', modality: 'Presencial', availability: 'Sábados 9-13h', linkedUserIds: [], phone: '+54 11 6666-0019' },
  { id: 'p20', username: 'nicolas_v', password: '123456', name: 'Lic. Nicolás Villalba', role: 'professional', email: 'nicolasv@tandem.app', avatar: '👨‍⚕️', specialty: 'Habilidades sociales', description: 'Grupos de entrenamiento en habilidades sociales para adolescentes con TEA.', modality: 'Presencial y virtual', availability: 'Martes y jueves 16-20h', linkedUserIds: [], phone: '+54 11 6666-0020' },
];

// ==================== ACTIVITIES ====================
export type ActivityCategory = 'autonomía personal' | 'higiene' | 'organización' | 'escuela' | 'cocina básica' | 'transporte' | 'compras' | 'manejo del dinero' | 'emociones' | 'comunicación' | 'vida social' | 'seguridad personal' | 'rutinas del hogar' | 'regulación emocional' | 'preparación para salidas' | 'anticipación de cambios';

export type ActivityType = 'guiada' | 'juego' | 'decisión' | 'regulación';

export interface Activity {
  id: string;
  title: string;
  category: ActivityCategory;
  objective: string;
  description: string;
  difficulty: 'fácil' | 'medio' | 'avanzado';
  duration: string;
  steps: string[];
  stepIcons?: string[];
  status: 'pendiente' | 'en progreso' | 'completada';
  recommendedBy: 'tutor' | 'profesional' | 'app';
  recommendedByName?: string;
  progress: number;
  assignedTo?: string;
  points: number;
  type: ActivityType;
  completionMessage?: string;
  // Mini-juego (opcional)
  gameType?: import('./miniGames').GameType;
  gameData?: import('./miniGames').GameData;
}

export const activities: Activity[] = [
  { id: 'a1', title: 'Preparar la mochila para mañana', category: 'organización', objective: 'Anticipar lo necesario para el día siguiente', description: 'Revisar el horario del día siguiente y preparar todos los materiales necesarios en la mochila.', difficulty: 'fácil', duration: '10 min', steps: ['Mirar el horario de mañana', 'Sacar lo que no necesitás', 'Agregar cuadernos y útiles', 'Verificar que no falte nada', 'Dejar la mochila lista en su lugar'], stepIcons: ['📅','🗑️','📚','✅','🎒'], status: 'completada', recommendedBy: 'tutor', recommendedByName: 'Laura Gómez', progress: 100, assignedTo: 'u1', points: 50, type: 'guiada', completionMessage: '¡Excelente! Tu mochila está lista para mañana. Sos muy organizado.' },
  { id: 'a2', title: 'Ordenar el escritorio', category: 'rutinas del hogar', objective: 'Mantener el espacio de estudio organizado', description: 'Limpiar y organizar el escritorio para tener un espacio de trabajo ordenado.', difficulty: 'fácil', duration: '15 min', steps: ['Sacar todo del escritorio', 'Limpiar la superficie', 'Clasificar útiles', 'Guardar lo que no usás', 'Dejar solo lo necesario'], stepIcons: ['📦','🧹','📋','🗄️','✨'], status: 'pendiente', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 0, assignedTo: 'u1', points: 40, type: 'guiada', completionMessage: '¡Qué bien! Un escritorio ordenado te ayuda a concentrarte mejor.' },
  { id: 'a3', title: 'Revisar el horario del día', category: 'organización', objective: 'Saber qué esperar durante el día', description: 'Consultar el calendario o agenda y repasar las actividades programadas para hoy.', difficulty: 'fácil', duration: '5 min', steps: ['Abrir la agenda o calendario', 'Leer cada actividad del día', 'Anotar dudas o cambios', 'Preparar lo necesario'], stepIcons: ['📖','👀','📝','🎒'], status: 'completada', recommendedBy: 'app', progress: 100, assignedTo: 'u1', points: 30, type: 'guiada', completionMessage: '¡Genial! Ya sabés qué esperar hoy. Eso reduce la incertidumbre.' },
  { id: 'a4', title: 'Lavarse los dientes correctamente', category: 'higiene', objective: 'Mantener una buena higiene bucal', description: 'Seguir los pasos para un cepillado completo después de cada comida.', difficulty: 'fácil', duration: '3 min', steps: ['Mojar el cepillo', 'Poner pasta dental', 'Cepillar arriba y abajo', 'Cepillar la lengua', 'Enjuagar'], stepIcons: ['💧','🪥','⬆️','👅','🚰'], status: 'completada', recommendedBy: 'tutor', recommendedByName: 'Laura Gómez', progress: 100, assignedTo: 'u1', points: 20, type: 'guiada', completionMessage: '¡Dientes limpios y saludables! Seguí así.' },
  { id: 'a5', title: 'Preparar una merienda simple', category: 'cocina básica', objective: 'Ganar autonomía en alimentación', description: 'Preparar una merienda saludable de forma independiente.', difficulty: 'fácil', duration: '10 min', steps: ['Elegir qué merendar', 'Sacar los ingredientes', 'Preparar (cortar, untar, servir)', 'Comer en la mesa', 'Limpiar lo usado'], stepIcons: ['🤔','🧊','🔪','🍽️','🧽'], status: 'en progreso', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 60, assignedTo: 'u1', points: 50, type: 'guiada', completionMessage: '¡Qué rico! Preparaste tu merienda solito/a. Eso es autonomía.' },
  { id: 'a6', title: 'Armar la ropa del día siguiente', category: 'autonomía personal', objective: 'Anticipar y preparar la vestimenta', description: 'Elegir y dejar lista la ropa que vas a usar mañana según el clima y las actividades.', difficulty: 'fácil', duration: '5 min', steps: ['Ver el clima de mañana', 'Pensar qué actividades tenés', 'Elegir ropa adecuada', 'Dejarla doblada en una silla'], stepIcons: ['🌤️','📋','👕','🪑'], status: 'pendiente', recommendedBy: 'tutor', recommendedByName: 'Laura Gómez', progress: 0, assignedTo: 'u1', points: 30, type: 'guiada', completionMessage: '¡Perfecto! Mañana ya tenés todo listo para vestirte rápido.' },
  { id: 'a7', title: 'Reconocer cómo me siento', category: 'emociones', objective: 'Identificar y nombrar emociones', description: 'Hacer una pausa para identificar qué emoción estás sintiendo y registrarla.', difficulty: 'fácil', duration: '5 min', steps: ['Hacer una pausa', 'Respirar profundo', 'Pensar: ¿qué siento?', 'Elegir la emoción que más se parece', 'Registrarla en la app'], stepIcons: ['⏸️','🫁','💭','🎯','📱'], status: 'completada', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 100, assignedTo: 'u1', points: 40, type: 'regulación', completionMessage: '¡Muy bien! Reconocer cómo te sentís es el primer paso para estar mejor.' },
  { id: 'a8', title: 'Avisar si llegué bien', category: 'seguridad personal', objective: 'Mantener comunicación con adultos de confianza', description: 'Enviar un mensaje a mamá/papá o tutor cuando llegás a un lugar seguro.', difficulty: 'fácil', duration: '2 min', steps: ['Llegar al destino', 'Sacar el celular', 'Enviar mensaje de aviso', 'Guardar el celular'], stepIcons: ['📍','📱','✉️','🎒'], status: 'completada', recommendedBy: 'tutor', recommendedByName: 'Laura Gómez', progress: 100, assignedTo: 'u1', points: 30, type: 'guiada', completionMessage: '¡Genial! Tu familia se queda tranquila sabiendo que llegaste bien.' },
  { id: 'a9', title: 'Preparar lo necesario para salir', category: 'preparación para salidas', objective: 'Salir de casa de forma organizada', description: 'Revisar que tengas todo lo necesario antes de salir: llaves, celular, billetera, etc.', difficulty: 'medio', duration: '5 min', steps: ['Revisar lista de cosas para llevar', 'Verificar llaves', 'Verificar celular con batería', 'Verificar billetera/tarjeta', 'Verificar documentos si hacen falta'], stepIcons: ['📋','🔑','📱','💳','🪪'], status: 'pendiente', recommendedBy: 'app', progress: 0, assignedTo: 'u1', points: 40, type: 'guiada', completionMessage: '¡Listo para salir! No te olvidás de nada.' },
  { id: 'a10', title: 'Hacer una lista corta de compras', category: 'compras', objective: 'Planificar una compra simple', description: 'Escribir una lista de 3-5 cosas que necesitás comprar y calcular un estimado.', difficulty: 'medio', duration: '10 min', steps: ['Pensar qué necesitás', 'Escribir la lista', 'Estimar cuánto sale cada cosa', 'Calcular el total aproximado', 'Preparar el dinero o medio de pago'], stepIcons: ['🤔','📝','💲','🧮','💰'], status: 'pendiente', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 0, assignedTo: 'u1', points: 60, type: 'guiada', completionMessage: '¡Excelente planificación! Ya estás listo para ir a comprar.' },
  { id: 'a11', title: 'Seguir una rutina de respiración', category: 'regulación emocional', objective: 'Aprender a calmarse con respiración', description: 'Practicar una técnica de respiración durante 3 minutos cuando te sentís ansioso o agitado.', difficulty: 'fácil', duration: '3 min', steps: ['Sentarte cómodamente', 'Cerrar los ojos', 'Inspirar contando hasta 4', 'Mantener contando hasta 4', 'Exhalar contando hasta 6', 'Repetir 5 veces'], stepIcons: ['🪑','😌','🫁','⏳','💨','🔄'], status: 'completada', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 100, assignedTo: 'u1', points: 30, type: 'regulación', completionMessage: '¡Qué calma! La respiración te ayuda a volver al centro.' },
  { id: 'a12', title: 'Identificar qué hacer si un plan cambia', category: 'anticipación de cambios', objective: 'Tolerar y manejar cambios inesperados', description: 'Practicar mentalmente qué hacer si algo planeado cambia de repente.', difficulty: 'medio', duration: '10 min', steps: ['Pensar en una situación que podría cambiar', 'Imaginar cómo te sentirías', 'Pensar en 2 opciones alternativas', 'Elegir la que te parezca mejor', 'Recordar que los cambios son normales'], stepIcons: ['🔄','💭','🤔','✅','🌟'], status: 'en progreso', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 40, assignedTo: 'u1', points: 60, type: 'decisión', completionMessage: '¡Muy bien! Aprendiste que siempre hay un Plan B.' },
  { id: 'a13', title: 'Organizar materiales de estudio', category: 'escuela', objective: 'Tener todo listo para estudiar', description: 'Clasificar y organizar carpetas, cuadernos y materiales de cada materia.', difficulty: 'medio', duration: '20 min', steps: ['Juntar todos los materiales', 'Separar por materia', 'Verificar que no falte nada', 'Etiquetar carpetas', 'Guardar en orden'], stepIcons: ['📦','📂','✅','🏷️','🗄️'], status: 'pendiente', recommendedBy: 'tutor', recommendedByName: 'Laura Gómez', progress: 0, assignedTo: 'u1', points: 50, type: 'guiada', completionMessage: '¡Materiales en orden! Vas a encontrar todo más fácil.' },
  { id: 'a14', title: 'Guardar objetos personales en su lugar', category: 'rutinas del hogar', objective: 'Mantener orden en los espacios personales', description: 'Cada objeto tiene un lugar asignado. Practicar dejarlo siempre ahí.', difficulty: 'fácil', duration: '5 min', steps: ['Revisar qué está fuera de lugar', 'Tomar un objeto', 'Llevarlo a su lugar', 'Repetir con los demás', 'Verificar que todo esté en orden'], stepIcons: ['👀','✋','📍','🔄','✅'], status: 'completada', recommendedBy: 'app', progress: 100, assignedTo: 'u1', points: 30, type: 'guiada', completionMessage: '¡Todo en su lugar! Ahora vas a encontrar las cosas más rápido.' },
  { id: 'a15', title: 'Repasar pasos para ir a terapia', category: 'preparación para salidas', objective: 'Anticipar la salida a terapia', description: 'Revisar qué necesitás llevar y cómo llegar a tu sesión de terapia.', difficulty: 'fácil', duration: '5 min', steps: ['Verificar horario de la sesión', 'Preparar lo que querés contar', 'Revisar cómo llegar', 'Preparar medio de transporte', 'Salir con tiempo'], stepIcons: ['🕐','📝','🗺️','🚌','🚶'], status: 'completada', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 100, assignedTo: 'u1', points: 40, type: 'guiada', completionMessage: '¡Listo para la sesión! Ir preparado hace que sea más provechosa.' },
  { id: 'a16', title: 'Preparar bolso para actividad deportiva', category: 'preparación para salidas', objective: 'Autonomía en la preparación de actividades', description: 'Armar el bolso con todo lo necesario para tu actividad deportiva.', difficulty: 'fácil', duration: '10 min', steps: ['Buscar ropa deportiva limpia', 'Agregar toalla', 'Agregar botella de agua', 'Verificar calzado deportivo', 'Cerrar el bolso y dejarlo listo'], stepIcons: ['👟','🧴','💧','👟','🎒'], status: 'pendiente', recommendedBy: 'tutor', recommendedByName: 'Laura Gómez', progress: 0, assignedTo: 'u1', points: 40, type: 'guiada', completionMessage: '¡Bolso armado! Ya estás listo para ir a hacer deporte.' },
  { id: 'a17', title: 'Practicar saludar y presentarse', category: 'comunicación', objective: 'Mejorar habilidades sociales básicas', description: 'Ensayar cómo saludar, decir tu nombre y hacer una pregunta simple a alguien.', difficulty: 'medio', duration: '10 min', steps: ['Practicar decir "Hola, me llamo..."', 'Practicar dar la mano o saludar', 'Hacer una pregunta simple como "¿Cómo estás?"', 'Practicar responder preguntas', 'Ensayar frente al espejo'], stepIcons: ['👋','🤝','❓','💬','🪞'], status: 'en progreso', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 50, assignedTo: 'u1', points: 50, type: 'guiada', completionMessage: '¡Practicaste saludar! Cada vez te va a salir más natural.' },
  { id: 'a18', title: 'Calcular vuelto en una compra', category: 'manejo del dinero', objective: 'Entender el valor del dinero', description: 'Practicar cuánto vuelto te tienen que dar cuando pagás algo.', difficulty: 'medio', duration: '15 min', steps: ['Elegir un producto con precio', 'Ver con cuánto pagás', 'Calcular la resta', 'Verificar el resultado', 'Practicar con otros montos'], stepIcons: ['🏷️','💵','➖','✅','🔄'], status: 'pendiente', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 0, assignedTo: 'u1', points: 60, type: 'juego', completionMessage: '¡Sos un experto calculando! El dinero ya no es un misterio.' },
  { id: 'a19', title: 'Planificar un viaje corto en transporte público', category: 'transporte', objective: 'Ganar autonomía en traslados', description: 'Buscar cómo llegar a un lugar cercano usando colectivo o subte.', difficulty: 'avanzado', duration: '15 min', steps: ['Elegir el destino', 'Buscar la línea de colectivo/subte', 'Ver los horarios', 'Calcular el tiempo de viaje', 'Preparar la SUBE o medio de pago', 'Revisar la ruta en el mapa'], stepIcons: ['📍','🚌','🕐','⏱️','💳','🗺️'], status: 'pendiente', recommendedBy: 'app', progress: 0, assignedTo: 'u1', points: 80, type: 'guiada', completionMessage: '¡Increíble! Planificaste un viaje como un profesional.' },
  { id: 'a20', title: 'Invitar a alguien a hacer algo juntos', category: 'vida social', objective: 'Fomentar relaciones sociales', description: 'Practicar cómo invitar a un compañero o amigo a una actividad.', difficulty: 'avanzado', duration: '10 min', steps: ['Pensar a quién invitar', 'Pensar qué actividad proponer', 'Ensayar cómo decirlo', 'Enviar el mensaje o decirlo en persona', 'Aceptar la respuesta sea cual sea'], stepIcons: ['🤔','🎯','🗣️','📩','🤗'], status: 'pendiente', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 0, assignedTo: 'u1', points: 70, type: 'decisión', completionMessage: '¡Lo hiciste! Invitar a alguien es un gran paso social.' },
  { id: 'a21', title: 'Ducharse siguiendo pasos', category: 'higiene', objective: 'Independencia en higiene personal', description: 'Seguir una secuencia visual para ducharse correctamente.', difficulty: 'fácil', duration: '15 min', steps: ['Preparar ropa limpia', 'Regular la temperatura', 'Mojarse', 'Usar jabón/shampoo', 'Enjuagar', 'Secarse', 'Vestirse'], stepIcons: ['👕','🌡️','💧','🧴','🚿','🧴','👔'], status: 'pendiente', recommendedBy: 'app', progress: 0, points: 40, type: 'guiada', completionMessage: '¡Muy bien! La ducha es parte de tu rutina de cuidado personal.' },
  { id: 'a22', title: 'Hacer la cama al levantarse', category: 'rutinas del hogar', objective: 'Crear hábitos matutinos', description: 'Tender la cama cada mañana como parte de la rutina.', difficulty: 'fácil', duration: '5 min', steps: ['Estirar la sábana', 'Acomodar la almohada', 'Poner la frazada', 'Alisar arrugas'], stepIcons: ['🛏️','🛌','🧣','✨'], status: 'pendiente', recommendedBy: 'app', progress: 0, points: 20, type: 'guiada', completionMessage: '¡Cama tendida! Un gran comienzo para el día.' },
  { id: 'a23', title: 'Pedir ayuda cuando la necesito', category: 'comunicación', objective: 'Saber cuándo y cómo pedir ayuda', description: 'Identificar situaciones donde necesitás ayuda y practicar cómo pedirla.', difficulty: 'medio', duration: '10 min', steps: ['Identificar la dificultad', 'Pensar a quién pedir ayuda', 'Usar frases como "¿Me podés ayudar con...?"', 'Agradecer la ayuda'], stepIcons: ['🤔','👤','🗣️','🙏'], status: 'pendiente', recommendedBy: 'app', progress: 0, points: 40, type: 'decisión', completionMessage: '¡Pedir ayuda es de valientes! Bien hecho.' },
  { id: 'a24', title: 'Usar el microondas de forma segura', category: 'cocina básica', objective: 'Autonomía en la cocina', description: 'Aprender a calentar comida en el microondas siguiendo pasos seguros.', difficulty: 'fácil', duration: '5 min', steps: ['Elegir recipiente apto', 'Poner la comida', 'Programar el tiempo', 'Esperar sin abrir', 'Sacar con cuidado'], stepIcons: ['🍽️','🥘','⏱️','⏳','🧤'], status: 'pendiente', recommendedBy: 'app', progress: 0, points: 30, type: 'guiada', completionMessage: '¡Comida lista y calentita! Usaste el microondas como un experto.' },
  { id: 'a25', title: 'Reconocer señales de peligro', category: 'seguridad personal', objective: 'Mantenerse seguro en situaciones cotidianas', description: 'Aprender a identificar situaciones que podrían ser peligrosas.', difficulty: 'medio', duration: '15 min', steps: ['Ver imágenes de situaciones', 'Identificar cuáles son peligrosas', 'Pensar qué hacer en cada caso', 'Practicar pedir ayuda', 'Recordar números de emergencia'], stepIcons: ['🖼️','⚠️','🤔','📞','🆘'], status: 'pendiente', recommendedBy: 'app', progress: 0, points: 50, type: 'decisión', completionMessage: '¡Ahora sabés identificar situaciones de riesgo! Eso te mantiene seguro/a.' },
  // New interactive activities (types: juego, decisión, regulación)
  { id: 'a26', title: '¿Qué emoción es esta?', category: 'emociones', objective: 'Aprender a reconocer emociones en otros', description: 'Mirá las expresiones y elegí qué emoción representan.', difficulty: 'fácil', duration: '5 min', steps: ['Mirá la expresión 😊', '¿Es alegría, tristeza o enojo?', 'Mirá la expresión 😢', '¿Es miedo, tristeza o sorpresa?', 'Mirá la expresión 😡', '¿Es frustración, aburrimiento o alegría?'], stepIcons: ['😊','🤔','😢','🤔','😡','🤔'], status: 'pendiente', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 0, assignedTo: 'u1', points: 50, type: 'juego', completionMessage: '¡Sos un detective de emociones! Reconocer cómo se sienten otros te ayuda a conectar.' },
  { id: 'a27', title: 'Ordenar la secuencia correcta', category: 'organización', objective: 'Practicar el orden lógico de acciones', description: 'Ordená los pasos en el orden correcto para completar una tarea.', difficulty: 'medio', duration: '8 min', steps: ['Paso desordenado: "Ponerme los zapatos"', 'Paso desordenado: "Ponerme las medias"', 'Paso desordenado: "Atarme los cordones"', 'Orden correcto: Medias → Zapatos → Cordones', 'Otro ejemplo: ¿primero desayuno o me visto?', 'Respuesta: Depende de tu rutina, ¡ambas son válidas!'], stepIcons: ['👟','🧦','🪢','✅','🤔','💡'], status: 'pendiente', recommendedBy: 'app', progress: 0, assignedTo: 'u1', points: 45, type: 'juego', completionMessage: '¡Ordenaste todo perfecto! Pensar en secuencias te ayuda a organizarte.' },
  { id: 'a28', title: 'Respiración del globo', category: 'regulación emocional', objective: 'Calmarse cuando hay mucha emoción', description: 'Imaginá que inflás un globo con tu respiración. Lento y profundo.', difficulty: 'fácil', duration: '4 min', steps: ['Sentate cómodo', 'Imaginá un globo en tus manos', 'Inspirá lento: el globo se infla', 'Mantené 3 segundos', 'Exhalá: el globo se desinfla suavecito', 'Repetí 6 veces'], stepIcons: ['🪑','🎈','🫁','⏳','💨','🔄'], status: 'pendiente', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 0, assignedTo: 'u1', points: 35, type: 'regulación', completionMessage: '¡Qué calma! El globo imaginario te ayudó a relajarte.' },
  { id: 'a29', title: '¿Qué hago si me pierdo?', category: 'seguridad personal', objective: 'Saber qué hacer en una situación de emergencia', description: 'Elegí la mejor opción ante diferentes situaciones difíciles.', difficulty: 'medio', duration: '10 min', steps: ['Situación: Estás en un lugar nuevo y no sabés volver', 'Opción A: Caminar sin rumbo', 'Opción B: Quedarte quieto y llamar a un adulto de confianza', 'La mejor opción es B ✅', 'Situación: Alguien desconocido te ofrece algo', 'La mejor opción: Decir "no gracias" y buscar un adulto conocido'], stepIcons: ['📍','❌','✅','🎯','👤','🛡️'], status: 'pendiente', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 0, assignedTo: 'u1', points: 60, type: 'decisión', completionMessage: '¡Muy bien! Sabés tomar decisiones seguras. Eso te protege.' },
  { id: 'a30', title: 'Mi lugar seguro interior', category: 'regulación emocional', objective: 'Crear un espacio mental de calma', description: 'Imaginá un lugar donde te sentís tranquilo y seguro. Visitalo cuando lo necesites.', difficulty: 'fácil', duration: '5 min', steps: ['Cerrá los ojos', 'Pensá en un lugar donde te sentís bien', 'Imaginá los colores, los sonidos, los olores', 'Quedate ahí unos minutos', 'Abrí los ojos cuando estés listo', 'Recordá que podés volver cuando quieras'], stepIcons: ['😌','🏖️','🎨','⏳','👀','💫'], status: 'pendiente', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 0, assignedTo: 'u1', points: 40, type: 'regulación', completionMessage: '¡Encontraste tu lugar seguro! Podés visitarlo cuando necesites calma.' },
  { id: 'a31', title: 'Clasificar objetos por categoría', category: 'organización', objective: 'Practicar clasificación y orden', description: 'Agrupá objetos según a qué categoría pertenecen.', difficulty: 'fácil', duration: '8 min', steps: ['Mirá los objetos: manzana, cuaderno, jabón', 'La manzana es → comida 🍎', 'El cuaderno es → escuela 📓', 'El jabón es → higiene 🧼', 'Ahora vos: ¿dónde va la toalla?', '¡Correcto! Higiene 🧴'], stepIcons: ['👀','🍎','📓','🧼','🤔','✅'], status: 'pendiente', recommendedBy: 'app', progress: 0, assignedTo: 'u1', points: 35, type: 'juego', completionMessage: '¡Clasificaste todo perfecto! Tu cerebro es una máquina de organizar.' },
  { id: 'a32', title: 'Rutina de 5 sentidos para calmarse', category: 'regulación emocional', objective: 'Volver al presente cuando hay ansiedad', description: 'Usá tus 5 sentidos para conectar con el momento presente.', difficulty: 'fácil', duration: '5 min', steps: ['Nombrá 5 cosas que ves', 'Nombrá 4 cosas que podés tocar', 'Nombrá 3 cosas que escuchás', 'Nombrá 2 cosas que olés', 'Nombrá 1 cosa que saboreás', 'Respirá profundo: ya estás acá'], stepIcons: ['👀','✋','👂','👃','👅','🫁'], status: 'pendiente', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 0, assignedTo: 'u1', points: 40, type: 'regulación', completionMessage: '¡Volviste al presente! Los 5 sentidos te ayudan a centrarte.' },
  { id: 'a33', title: 'Elegir qué hacer primero', category: 'organización', objective: 'Aprender a priorizar tareas', description: 'Ante varias tareas pendientes, elegí cuál hacer primero.', difficulty: 'medio', duration: '8 min', steps: ['Tenés: tarea de mate, ordenar cuarto, merendar', '¿Cuál tiene horario fijo? → La tarea', '¿Cuál es más urgente? → Depende del contexto', 'Elegí un orden: tarea → merendar → ordenar', 'Otro ejemplo con tus actividades reales'], stepIcons: ['📋','🕐','⚡','1️⃣','🔄'], status: 'pendiente', recommendedBy: 'app', progress: 0, assignedTo: 'u1', points: 50, type: 'decisión', completionMessage: '¡Aprendiste a priorizar! Eso te hace más eficiente.' },
  { id: 'a34', title: 'Preparar un desayuno completo', category: 'cocina básica', objective: 'Autonomía completa en desayuno', description: 'Preparar un desayuno con varios elementos: bebida, tostadas, fruta.', difficulty: 'medio', duration: '15 min', steps: ['Poner a calentar agua/leche', 'Tostar pan', 'Cortar fruta', 'Servir todo en la mesa', 'Desayunar tranquilo', 'Lavar lo usado'], stepIcons: ['☕','🍞','🍌','🍽️','😊','🧽'], status: 'pendiente', recommendedBy: 'tutor', recommendedByName: 'Laura Gómez', progress: 0, assignedTo: 'u1', points: 60, type: 'guiada', completionMessage: '¡Un desayuno completo hecho por vos! Eso es independencia real.' },
  { id: 'a35', title: 'Pausa de movimiento', category: 'regulación emocional', objective: 'Liberar tensión con movimiento', description: 'Hacé movimientos simples para liberar energía acumulada.', difficulty: 'fácil', duration: '3 min', steps: ['Levantate de la silla', 'Estirar los brazos arriba', 'Girar el cuello suavemente', 'Sacudir las manos', 'Saltar 5 veces', 'Respirar profundo y volver a sentarte'], stepIcons: ['🪑','🙆','🔄','👐','🦘','🫁'], status: 'pendiente', recommendedBy: 'app', progress: 0, assignedTo: 'u1', points: 20, type: 'regulación', completionMessage: '¡Cuerpo activado! El movimiento te ayuda a concentrarte mejor.' },
];

// ==================== ROUTINES ====================
export interface RoutineItem {
  id: string;
  time: string;
  title: string;
  icon: string;
  completed: boolean;
  category: string;
  pictogramLabel?: string;
}

export const juanDailyRoutine: RoutineItem[] = [
  { id: 'r1', time: '07:00', title: 'Despertarse', icon: '⏰', completed: true, category: 'mañana' },
  { id: 'r2', time: '07:10', title: 'Hacer la cama', icon: '🛏️', completed: true, category: 'mañana' },
  { id: 'r3', time: '07:20', title: 'Ducharse', icon: '🚿', completed: true, category: 'mañana' },
  { id: 'r4', time: '07:40', title: 'Vestirse', icon: '👕', completed: true, category: 'mañana' },
  { id: 'r5', time: '08:00', title: 'Desayunar', icon: '🥣', completed: true, category: 'mañana' },
  { id: 'r6', time: '08:20', title: 'Lavarse los dientes', icon: '🪥', completed: true, category: 'mañana' },
  { id: 'r7', time: '08:30', title: 'Revisar mochila', icon: '🎒', completed: true, category: 'mañana' },
  { id: 'r8', time: '08:45', title: 'Salir para la escuela', icon: '🚶', completed: true, category: 'mañana' },
  { id: 'r9', time: '09:00', title: 'Clases en la escuela', icon: '📚', completed: true, category: 'escuela' },
  { id: 'r10', time: '12:30', title: 'Almorzar', icon: '🍽️', completed: true, category: 'mediodía' },
  { id: 'r11', time: '13:30', title: 'Descanso / tiempo libre', icon: '🎮', completed: true, category: 'tarde' },
  { id: 'r12', time: '14:30', title: 'Tarea de la escuela', icon: '✏️', completed: false, category: 'tarde' },
  { id: 'r13', time: '15:30', title: 'Actividad recomendada', icon: '⭐', completed: false, category: 'tarde' },
  { id: 'r14', time: '16:00', title: 'Merienda', icon: '🥪', completed: false, category: 'tarde' },
  { id: 'r15', time: '16:30', title: 'Terapia con Lic. Martina', icon: '🧠', completed: false, category: 'tarde' },
  { id: 'r16', time: '17:30', title: 'Tiempo libre', icon: '🎧', completed: false, category: 'tarde' },
  { id: 'r17', time: '19:00', title: 'Preparar ropa de mañana', icon: '👔', completed: false, category: 'noche' },
  { id: 'r18', time: '19:30', title: 'Cenar', icon: '🍝', completed: false, category: 'noche' },
  { id: 'r19', time: '20:30', title: 'Registrar emociones', icon: '💭', completed: false, category: 'noche' },
  { id: 'r20', time: '21:00', title: 'Prepararse para dormir', icon: '🌙', completed: false, category: 'noche' },
];

// ==================== CALENDAR EVENTS ====================
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'terapia' | 'escuela' | 'personal' | 'médico' | 'social' | 'actividad';
  description: string;
  userId: string;
  color: string;
}

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

export const calendarEvents: CalendarEvent[] = [
  { id: 'ce1', title: 'Sesión con Lic. Martina', date: fmt(today), time: '16:30', type: 'terapia', description: 'Sesión semanal de terapia cognitivo-conductual', userId: 'u1', color: 'hsl(270 40% 75%)' },
  { id: 'ce2', title: 'Clase de Matemáticas', date: fmt(today), time: '09:00', type: 'escuela', description: 'Parcial de geometría', userId: 'u1', color: 'hsl(210 70% 55%)' },
  { id: 'ce3', title: 'Fútbol con amigos', date: fmt(addDays(today, 1)), time: '17:00', type: 'social', description: 'Partido en la plaza del barrio', userId: 'u1', color: 'hsl(150 60% 45%)' },
  { id: 'ce4', title: 'Control médico', date: fmt(addDays(today, 3)), time: '10:00', type: 'médico', description: 'Control de rutina con el pediatra', userId: 'u1', color: 'hsl(0 72% 55%)' },
  { id: 'ce5', title: 'Clase de música', date: fmt(addDays(today, 1)), time: '15:00', type: 'personal', description: 'Práctica de guitarra', userId: 'u1', color: 'hsl(30 80% 60%)' },
  { id: 'ce6', title: 'Sesión con Lic. Martina', date: fmt(addDays(today, 7)), time: '16:30', type: 'terapia', description: 'Sesión semanal', userId: 'u1', color: 'hsl(270 40% 75%)' },
  { id: 'ce7', title: 'Taller de habilidades sociales', date: fmt(addDays(today, 2)), time: '14:00', type: 'terapia', description: 'Grupo de entrenamiento social', userId: 'u1', color: 'hsl(270 40% 75%)' },
  { id: 'ce8', title: 'Cumpleaños de Sofía', date: fmt(addDays(today, 5)), time: '16:00', type: 'social', description: 'Fiesta de cumpleaños en su casa', userId: 'u1', color: 'hsl(150 60% 45%)' },
  { id: 'ce9', title: 'Examen de Historia', date: fmt(addDays(today, 4)), time: '10:00', type: 'escuela', description: 'Estudiar: Revolución de Mayo', userId: 'u1', color: 'hsl(210 70% 55%)' },
  { id: 'ce10', title: 'Dentista', date: fmt(addDays(today, 8)), time: '11:00', type: 'médico', description: 'Control semestral', userId: 'u1', color: 'hsl(0 72% 55%)' },
  { id: 'ce11', title: 'Salida al cine', date: fmt(addDays(today, 6)), time: '18:00', type: 'social', description: 'Película con compañeros', userId: 'u1', color: 'hsl(150 60% 45%)' },
  { id: 'ce12', title: 'Sesión con Lic. Martina', date: fmt(addDays(today, 14)), time: '16:30', type: 'terapia', description: 'Sesión semanal', userId: 'u1', color: 'hsl(270 40% 75%)' },
  { id: 'ce13', title: 'Taller de cocina', date: fmt(addDays(today, 9)), time: '15:00', type: 'actividad', description: 'Aprender a hacer pizza', userId: 'u1', color: 'hsl(30 80% 60%)' },
  { id: 'ce14', title: 'Reunión de padres', date: fmt(addDays(today, 10)), time: '19:00', type: 'escuela', description: 'Reunión trimestral', userId: 'u1', color: 'hsl(210 70% 55%)' },
  { id: 'ce15', title: 'Clase de música', date: fmt(addDays(today, 8)), time: '15:00', type: 'personal', description: 'Guitarra - aprender canción nueva', userId: 'u1', color: 'hsl(30 80% 60%)' },
  { id: 'ce16', title: 'Sesión con Dr. Ortega', date: fmt(addDays(today, 2)), time: '10:00', type: 'terapia', description: 'Consulta mensual', userId: 'u2', color: 'hsl(270 40% 75%)' },
  { id: 'ce17', title: 'Actividad deportiva', date: fmt(addDays(today, 3)), time: '16:00', type: 'personal', description: 'Natación', userId: 'u2', color: 'hsl(30 80% 60%)' },
  { id: 'ce18', title: 'Taller de arte', date: fmt(addDays(today, 5)), time: '11:00', type: 'actividad', description: 'Pintura libre', userId: 'u3', color: 'hsl(30 80% 60%)' },
  { id: 'ce19', title: 'Sesión con Lic. Carolina', date: fmt(addDays(today, 4)), time: '09:00', type: 'terapia', description: 'Terapia ocupacional', userId: 'u3', color: 'hsl(270 40% 75%)' },
  { id: 'ce20', title: 'Paseo al parque', date: fmt(addDays(today, 2)), time: '10:30', type: 'social', description: 'Caminata con familia', userId: 'u4', color: 'hsl(150 60% 45%)' },
  { id: 'ce21', title: 'Práctica de guitarra', date: fmt(today), time: '18:00', type: 'personal', description: 'Ensayo de nueva canción', userId: 'u1', color: 'hsl(30 80% 60%)' },
  { id: 'ce22', title: 'Entrega de trabajo práctico', date: fmt(addDays(today, 2)), time: '09:00', type: 'escuela', description: 'TP de Biología', userId: 'u1', color: 'hsl(210 70% 55%)' },
];

// ==================== CONVERSATIONS & CHAT ====================
export interface Conversation {
  id: string;
  title?: string;
  description?: string;
  participants: string[];
  participantNames: string[];
  adminIds?: string[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatar: string;
  type: 'tutor' | 'profesional' | 'grupo';
}

export const conversations: Conversation[] = [
  { id: 'conv1', participants: ['u1', 't1'], participantNames: ['Juan García', 'Laura Gómez'], lastMessage: 'Dale, te preparo la merienda cuando llegues', lastMessageTime: '15:30', unreadCount: 2, avatar: '👩', type: 'tutor' },
  { id: 'conv2', participants: ['u1', 'p1'], participantNames: ['Juan García', 'Lic. Martina Pérez'], lastMessage: 'Recordá hacer el ejercicio de respiración antes de dormir', lastMessageTime: '14:20', unreadCount: 1, avatar: '👩‍⚕️', type: 'profesional' },
  { id: 'conv3', participants: ['u2', 't2'], participantNames: ['Sofía Martínez', 'Carlos Martínez'], lastMessage: 'Te espero en la puerta a las 16', lastMessageTime: '13:45', unreadCount: 0, avatar: '👨' , type: 'tutor' },
  { id: 'conv4', participants: ['u2', 'p2'], participantNames: ['Sofía Martínez', 'Dr. Lucas Ortega'], lastMessage: 'Nos vemos el martes en la sesión', lastMessageTime: '10:30', unreadCount: 0, avatar: '👨‍⚕️', type: 'profesional' },
  { id: 'conv5', participants: ['u3', 't3'], participantNames: ['Mateo Rodríguez', 'Ana Rodríguez'], lastMessage: 'Compramos lo del almuerzo', lastMessageTime: '12:15', unreadCount: 1, avatar: '👩', type: 'tutor' },
  { id: 'conv6', participants: ['u3', 'p3'], participantNames: ['Mateo Rodríguez', 'Lic. Carolina Vega'], lastMessage: 'Muy bien el avance en el taller esta semana', lastMessageTime: '09:00', unreadCount: 0, avatar: '👩‍💼', type: 'profesional' },
  { id: 'conv7', participants: ['u4', 't4'], participantNames: ['Valentina López', 'Pedro López'], lastMessage: 'Papá te lleva a las 10', lastMessageTime: '08:30', unreadCount: 0, avatar: '👨', type: 'tutor' },
  { id: 'conv8', participants: ['u5', 't5'], participantNames: ['Tomás Benítez', 'María Benítez'], lastMessage: 'No te olvides la botella de agua', lastMessageTime: '07:45', unreadCount: 1, avatar: '👩', type: 'tutor' },
  { id: 'conv9', participants: ['u6', 't6'], participantNames: ['Camila Sánchez', 'Roberto Sánchez'], lastMessage: 'Hoy tenés natación a las 4', lastMessageTime: '11:20', unreadCount: 0, avatar: '👨', type: 'tutor' },
  { id: 'conv10', participants: ['u7', 't7'], participantNames: ['Nicolás Fernández', 'Elena Fernández'], lastMessage: 'Te preparé vianda para el taller', lastMessageTime: '06:50', unreadCount: 0, avatar: '👩', type: 'tutor' },
];

export interface ArchivoAdjunto {
  id: number;
  url: string;
  nombre_archivo: string;
  content_type?: string;
  peso_bytes?: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
  type?: 'text' | 'image' | 'file' | 'activity' | 'alert';
  archivos?: ArchivoAdjunto[];
}

export const chatMessages: ChatMessage[] = [
  // Conv1 - Juan y Laura (mamá) - más mensajes
  { id: 'msg1', conversationId: 'conv1', senderId: 't1', senderName: 'Laura Gómez', text: '¡Buen día, Juan! ¿Dormiste bien?', timestamp: '07:10', read: true, type: 'text' },
  { id: 'msg2', conversationId: 'conv1', senderId: 'u1', senderName: 'Juan García', text: 'Sí, dormí bien. Ya me estoy preparando.', timestamp: '07:15', read: true, type: 'text' },
  { id: 'msg3', conversationId: 'conv1', senderId: 't1', senderName: 'Laura Gómez', text: '¡Genial! No te olvides de llevar el cuaderno de Mate, hoy tienen parcial 📚', timestamp: '07:20', read: true, type: 'text' },
  { id: 'msg4', conversationId: 'conv1', senderId: 'u1', senderName: 'Juan García', text: 'Ya lo puse en la mochila ✅', timestamp: '07:35', read: true, type: 'text' },
  { id: 'msg5', conversationId: 'conv1', senderId: 't1', senderName: 'Laura Gómez', text: '¡Qué crack! Me encanta que ya te estés organizando solo', timestamp: '07:36', read: true, type: 'text' },
  { id: 'msg6', conversationId: 'conv1', senderId: 'u1', senderName: 'Juan García', text: 'Llegué a la escuela 🏫', timestamp: '08:55', read: true, type: 'alert' },
  { id: 'msg7', conversationId: 'conv1', senderId: 't1', senderName: 'Laura Gómez', text: '¡Perfecto! Avisame cuando salgas. ¡Éxitos en el parcial! 💪', timestamp: '09:00', read: true, type: 'text' },
  { id: 'msg8', conversationId: 'conv1', senderId: 'u1', senderName: 'Juan García', text: 'Me fue bien en el parcial 😊', timestamp: '12:00', read: true, type: 'text' },
  { id: 'msg9', conversationId: 'conv1', senderId: 't1', senderName: 'Laura Gómez', text: '¡Buenísimo! Estoy orgullosa. ¿Querés que te prepare algo especial de merienda?', timestamp: '12:05', read: true, type: 'text' },
  { id: 'msg10', conversationId: 'conv1', senderId: 'u1', senderName: 'Juan García', text: '¡Dale! Tostadas con dulce de leche', timestamp: '12:10', read: true, type: 'text' },
  { id: 'msg11', conversationId: 'conv1', senderId: 't1', senderName: 'Laura Gómez', text: 'Hecho. Recordá que hoy tenés terapia a las 16:30 con Martina', timestamp: '14:30', read: true, type: 'text' },
  { id: 'msg12', conversationId: 'conv1', senderId: 'u1', senderName: 'Juan García', text: 'Sí, ya me preparé lo que quiero hablar con ella', timestamp: '15:00', read: true, type: 'text' },
  { id: 'msg13', conversationId: 'conv1', senderId: 't1', senderName: 'Laura Gómez', text: 'Dale, te preparo la merienda cuando llegues', timestamp: '15:30', read: false, type: 'text' },
  { id: 'msg14', conversationId: 'conv1', senderId: 't1', senderName: 'Laura Gómez', text: '🎉 Juan completó "Preparar la mochila para mañana"', timestamp: '15:32', read: false, type: 'activity' },
  // Conv2 - Juan y Lic. Martina
  { id: 'msg20', conversationId: 'conv2', senderId: 'p1', senderName: 'Lic. Martina Pérez', text: 'Hola Juan, ¿cómo venís con el ejercicio de respiración que practicamos?', timestamp: '10:00', read: true, type: 'text' },
  { id: 'msg21', conversationId: 'conv2', senderId: 'u1', senderName: 'Juan García', text: 'Lo hice ayer antes de dormir. Me costó un poco al principio pero después me relajé', timestamp: '10:15', read: true, type: 'text' },
  { id: 'msg22', conversationId: 'conv2', senderId: 'p1', senderName: 'Lic. Martina Pérez', text: 'Eso es excelente, Juan. Es normal que cueste al principio. Lo importante es que lo intentaste y funcionó 💪', timestamp: '10:20', read: true, type: 'text' },
  { id: 'msg23', conversationId: 'conv2', senderId: 'u1', senderName: 'Juan García', text: 'Sí, me dormí más rápido', timestamp: '10:22', read: true, type: 'text' },
  { id: 'msg24', conversationId: 'conv2', senderId: 'p1', senderName: 'Lic. Martina Pérez', text: 'Genial. Para hoy, quiero que hagamos un repaso de las actividades de anticipación. ¿Te parece?', timestamp: '10:25', read: true, type: 'text' },
  { id: 'msg25', conversationId: 'conv2', senderId: 'u1', senderName: 'Juan García', text: 'Dale, quiero contarte algo que pasó ayer con un cambio de plan', timestamp: '10:30', read: true, type: 'text' },
  { id: 'msg26', conversationId: 'conv2', senderId: 'p1', senderName: 'Lic. Martina Pérez', text: '¡Me parece perfecto! Lo hablamos en la sesión de hoy. Nos vemos a las 16:30', timestamp: '10:35', read: true, type: 'text' },
  { id: 'msg27', conversationId: 'conv2', senderId: 'p1', senderName: 'Lic. Martina Pérez', text: 'Vi que completaste la actividad de respiración 🎉 ¡Muy bien!', timestamp: '14:00', read: true, type: 'activity' },
  { id: 'msg28', conversationId: 'conv2', senderId: 'p1', senderName: 'Lic. Martina Pérez', text: 'Recordá hacer el ejercicio de respiración antes de dormir', timestamp: '14:20', read: false, type: 'text' },
  // Conv3
  { id: 'msg30', conversationId: 'conv3', senderId: 't2', senderName: 'Carlos Martínez', text: 'Sofi, ¿llevaste la mochila?', timestamp: '08:00', read: true, type: 'text' },
  { id: 'msg31', conversationId: 'conv3', senderId: 'u2', senderName: 'Sofía Martínez', text: 'Sí pá, ya está todo', timestamp: '08:05', read: true, type: 'text' },
  { id: 'msg32', conversationId: 'conv3', senderId: 't2', senderName: 'Carlos Martínez', text: 'Te espero en la puerta a las 16', timestamp: '13:45', read: true, type: 'text' },
  // Conv5
  { id: 'msg40', conversationId: 'conv5', senderId: 'u3', senderName: 'Mateo Rodríguez', text: 'Mamá, hoy salgo del taller a las 12', timestamp: '11:00', read: true, type: 'text' },
  { id: 'msg41', conversationId: 'conv5', senderId: 't3', senderName: 'Ana Rodríguez', text: 'Ok, ¿comemos empanadas?', timestamp: '11:30', read: true, type: 'text' },
  { id: 'msg42', conversationId: 'conv5', senderId: 'u3', senderName: 'Mateo Rodríguez', text: '¡Dale!', timestamp: '11:35', read: true, type: 'text' },
  { id: 'msg43', conversationId: 'conv5', senderId: 't3', senderName: 'Ana Rodríguez', text: 'Compramos lo del almuerzo', timestamp: '12:15', read: false, type: 'text' },
];

// ==================== NOTIFICATIONS ====================
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'reminder' | 'achievement' | 'message' | 'alert' | 'recommendation' | 'streak' | 'chat' | 'activity' | 'system' | 'payment';
  icon: string;
  read: boolean;
  timestamp: string;
  actionLabel?: string;
  referenceType?: string;
  referenceId?: string;
}

export const notifications: Notification[] = [
  { id: 'n1', userId: 'u1', title: 'Sesión hoy', message: 'Tenés terapia con Lic. Martina a las 16:30', type: 'reminder', icon: '🧠', read: false, timestamp: '08:00', actionLabel: 'Ver en calendario' },
  { id: 'n2', userId: 'u1', title: 'Racha de 12 días 🔥', message: '¡Seguís sumando! No rompas la racha.', type: 'streak', icon: '🔥', read: false, timestamp: '07:30' },
  { id: 'n3', userId: 'u1', title: 'Nueva actividad recomendada', message: 'Lic. Martina te recomienda "Respiración del globo"', type: 'recommendation', icon: '⭐', read: false, timestamp: '10:00', actionLabel: 'Ver actividad' },
  { id: 'n4', userId: 'u1', title: '¡Logro desbloqueado!', message: 'Obtuviste "Explorador" por completar 10 actividades', type: 'achievement', icon: '🏆', read: true, timestamp: '09:00' },
  { id: 'n5', userId: 'u1', title: 'Mensaje de mamá', message: 'Laura te envió un mensaje nuevo', type: 'message', icon: '💬', read: false, timestamp: '15:30', actionLabel: 'Ir al chat' },
  { id: 'n6', userId: 'u1', title: 'Rutina matutina completada', message: '¡Completaste toda tu rutina de la mañana! +100 pts', type: 'achievement', icon: '🌅', read: true, timestamp: '08:50' },
  { id: 'n7', userId: 'u1', title: 'Recordatorio', message: 'No olvides registrar tus emociones antes de dormir', type: 'reminder', icon: '💭', read: false, timestamp: '20:00' },
  { id: 'n8', userId: 'u1', title: 'Parcial mañana', message: 'Tenés examen de Historia pasado mañana. ¡A estudiar!', type: 'alert', icon: '📚', read: false, timestamp: '18:00', actionLabel: 'Ver calendario' },
  { id: 'n9', userId: 'u1', title: 'Actividad completada', message: 'Completaste "Lavarse los dientes correctamente" +20 pts', type: 'achievement', icon: '✅', read: true, timestamp: '08:25' },
  { id: 'n10', userId: 'u1', title: 'Desafío semanal', message: 'Completá 5 actividades esta semana para ganar bonus de 200 pts', type: 'recommendation', icon: '🎯', read: false, timestamp: '07:00', actionLabel: 'Ver desafío' },
  { id: 'n11', userId: 'u2', title: 'Sesión mañana', message: 'Recordá tu sesión con Dr. Ortega', type: 'reminder', icon: '🧠', read: false, timestamp: '18:00' },
  { id: 'n12', userId: 'u3', title: 'Objetivo completado', message: '¡Cumpliste "Organizar espacio de trabajo"!', type: 'achievement', icon: '🏆', read: false, timestamp: '12:00' },
  { id: 'n13', userId: 'u1', title: 'Tu mamá recomienda', message: 'Laura te sugiere la actividad "Preparar un desayuno completo"', type: 'recommendation', icon: '👩', read: false, timestamp: '07:15', actionLabel: 'Ver actividad' },
  { id: 'n14', userId: 'u4', title: 'Racha de 3 días', message: '¡Vas muy bien! Seguí así.', type: 'streak', icon: '🔥', read: false, timestamp: '08:00' },
  { id: 'n15', userId: 'u5', title: 'Nueva actividad', message: 'Se agregó "Juegos de turno" a tus recomendadas', type: 'recommendation', icon: '⭐', read: false, timestamp: '09:00' },
  { id: 'n16', userId: 'u1', title: 'Fútbol mañana', message: 'Acordate del partido con amigos a las 17:00', type: 'reminder', icon: '⚽', read: false, timestamp: '19:00' },
  { id: 'n17', userId: 'u1', title: 'Cambio de plan', message: 'La clase de música se movió a las 18:00', type: 'alert', icon: '🔄', read: false, timestamp: '14:00', actionLabel: 'Ver cambio' },
  { id: 'n18', userId: 'u6', title: 'Natación hoy', message: 'Recordá preparar el bolso para natación', type: 'reminder', icon: '🏊', read: false, timestamp: '10:00' },
  { id: 'n19', userId: 'u7', title: 'Gran racha: 15 días', message: '¡Increíble! Sos un ejemplo de constancia.', type: 'streak', icon: '🔥', read: false, timestamp: '07:00' },
  { id: 'n20', userId: 'u1', title: 'Progreso semanal', message: 'Esta semana completaste 8 actividades. ¡Tu mejor semana!', type: 'achievement', icon: '📈', read: true, timestamp: '21:00' },
];

// ==================== EMOTIONAL RECORDS ====================
export interface EmotionalRecord {
  id: string;
  userId: string;
  emotion: string;
  emoji: string;
  intensity: number;
  context: string;
  whatHelped: string;
  timestamp: string;
  date: string;
}

export const emotionalRecords: EmotionalRecord[] = [
  { id: 'em1', userId: 'u1', emotion: 'Contento', emoji: '😊', intensity: 4, context: 'Me fue bien en el parcial de matemáticas', whatHelped: 'Haber estudiado con tiempo', timestamp: '12:00', date: fmt(today) },
  { id: 'em2', userId: 'u1', emotion: 'Ansioso', emoji: '😰', intensity: 3, context: 'Antes del parcial estaba nervioso', whatHelped: 'Respiración profunda', timestamp: '08:30', date: fmt(today) },
  { id: 'em3', userId: 'u1', emotion: 'Orgulloso', emoji: '🥹', intensity: 5, context: 'Preparé la mochila solo sin que me lo pidieran', whatHelped: 'La rutina de la app me ayudó', timestamp: '20:00', date: fmt(addDays(today, -1)) },
  { id: 'em4', userId: 'u1', emotion: 'Frustrado', emoji: '😤', intensity: 3, context: 'Se canceló el plan de ir al cine', whatHelped: 'Hablar con mamá y hacer Plan B', timestamp: '17:00', date: fmt(addDays(today, -1)) },
  { id: 'em5', userId: 'u1', emotion: 'Tranquilo', emoji: '😌', intensity: 4, context: 'Hice respiración antes de dormir', whatHelped: 'Técnica 4-4-6', timestamp: '21:30', date: fmt(addDays(today, -1)) },
  { id: 'em6', userId: 'u1', emotion: 'Feliz', emoji: '😄', intensity: 5, context: 'Gané el partido de fútbol con mis amigos', whatHelped: '', timestamp: '18:00', date: fmt(addDays(today, -2)) },
  { id: 'em7', userId: 'u1', emotion: 'Cansado', emoji: '😴', intensity: 3, context: 'Después de la escuela estaba agotado', whatHelped: 'Descansar un rato escuchando música', timestamp: '13:30', date: fmt(addDays(today, -2)) },
  { id: 'em8', userId: 'u1', emotion: 'Motivado', emoji: '💪', intensity: 4, context: 'Completé 3 actividades seguidas', whatHelped: 'Ver mi progreso subir en la app', timestamp: '16:00', date: fmt(addDays(today, -3)) },
  { id: 'em9', userId: 'u1', emotion: 'Nervioso', emoji: '😬', intensity: 4, context: 'Tenía que hablar por teléfono para pedir un turno', whatHelped: 'Ensayar lo que iba a decir antes', timestamp: '10:00', date: fmt(addDays(today, -3)) },
  { id: 'em10', userId: 'u1', emotion: 'Contento', emoji: '😊', intensity: 4, context: 'La sesión con Martina salió muy bien', whatHelped: 'Ir preparado con temas para hablar', timestamp: '17:30', date: fmt(addDays(today, -4)) },
  { id: 'em11', userId: 'u1', emotion: 'Preocupado', emoji: '😟', intensity: 2, context: 'No entendí un tema de la escuela', whatHelped: 'Le pedí ayuda al profesor', timestamp: '11:00', date: fmt(addDays(today, -4)) },
  { id: 'em12', userId: 'u1', emotion: 'Sorprendido', emoji: '😲', intensity: 3, context: 'Me regalaron un libro que quería', whatHelped: '', timestamp: '19:00', date: fmt(addDays(today, -5)) },
  { id: 'em13', userId: 'u1', emotion: 'Tranquilo', emoji: '😌', intensity: 4, context: 'Día tranquilo en casa', whatHelped: 'Tener la rutina organizada', timestamp: '20:00', date: fmt(addDays(today, -5)) },
  { id: 'em14', userId: 'u1', emotion: 'Feliz', emoji: '😄', intensity: 5, context: 'Desbloqueé un logro nuevo', whatHelped: '', timestamp: '15:00', date: fmt(addDays(today, -6)) },
  { id: 'em15', userId: 'u1', emotion: 'Triste', emoji: '😢', intensity: 2, context: 'Un amigo no pudo venir a jugar', whatHelped: 'Mamá me propuso otra actividad', timestamp: '16:00', date: fmt(addDays(today, -7)) },
  { id: 'em16', userId: 'u2', emotion: 'Contento', emoji: '😊', intensity: 3, context: 'Hice un dibujo lindo', whatHelped: '', timestamp: '14:00', date: fmt(today) },
  { id: 'em17', userId: 'u2', emotion: 'Ansioso', emoji: '😰', intensity: 4, context: 'Había mucho ruido en la escuela', whatHelped: 'Auriculares con cancelación de ruido', timestamp: '10:00', date: fmt(addDays(today, -1)) },
  { id: 'em18', userId: 'u3', emotion: 'Motivado', emoji: '💪', intensity: 5, context: 'Me felicitaron en el taller', whatHelped: '', timestamp: '12:00', date: fmt(today) },
  { id: 'em19', userId: 'u4', emotion: 'Tranquilo', emoji: '😌', intensity: 3, context: 'Cocinar me relaja', whatHelped: 'Seguir una receta paso a paso', timestamp: '18:00', date: fmt(addDays(today, -1)) },
  { id: 'em20', userId: 'u5', emotion: 'Feliz', emoji: '😄', intensity: 4, context: 'Gané un juego de mesa', whatHelped: '', timestamp: '16:00', date: fmt(addDays(today, -2)) },
  { id: 'em21', userId: 'u1', emotion: 'Motivado', emoji: '💪', intensity: 5, context: 'Alcancé una racha de 12 días', whatHelped: 'La app me ayuda a mantenerme constante', timestamp: '21:00', date: fmt(addDays(today, -1)) },
  { id: 'em22', userId: 'u1', emotion: 'Contento', emoji: '😊', intensity: 3, context: 'Día normal, todo salió bien', whatHelped: '', timestamp: '20:00', date: fmt(addDays(today, -8)) },
];

// ==================== ACHIEVEMENTS ====================
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  unlockedDate?: string;
  points: number;
  requirement: string;
}

export const achievements: Achievement[] = [
  { id: 'ach1', title: 'Primer paso', description: 'Completaste tu primera actividad', icon: '🌟', category: 'general', unlocked: true, unlockedDate: 'Hace 30 días', points: 50, requirement: 'Completar 1 actividad' },
  { id: 'ach2', title: 'Constante', description: 'Mantuviste una racha de 7 días', icon: '🔥', category: 'constancia', unlocked: true, unlockedDate: 'Hace 15 días', points: 100, requirement: 'Racha de 7 días' },
  { id: 'ach3', title: 'Explorador', description: 'Completaste actividades de 5 categorías diferentes', icon: '🧭', category: 'variedad', unlocked: true, unlockedDate: 'Hace 10 días', points: 150, requirement: '5 categorías diferentes' },
  { id: 'ach4', title: 'Comunicador', description: 'Enviaste 10 mensajes por chat', icon: '💬', category: 'comunicación', unlocked: true, unlockedDate: 'Hace 20 días', points: 50, requirement: '10 mensajes enviados' },
  { id: 'ach5', title: 'Cocinero en formación', description: 'Completaste 3 actividades de cocina', icon: '👨‍🍳', category: 'cocina', unlocked: true, unlockedDate: 'Hace 12 días', points: 100, requirement: '3 actividades de cocina' },
  { id: 'ach6', title: 'En sintonía', description: 'Registraste emociones 5 días seguidos', icon: '🎯', category: 'emociones', unlocked: true, unlockedDate: 'Hace 8 días', points: 80, requirement: '5 días registrando emociones' },
  { id: 'ach7', title: 'Superación', description: 'Subiste 3 niveles', icon: '📈', category: 'progreso', unlocked: true, unlockedDate: 'Hace 25 días', points: 120, requirement: 'Subir 3 niveles' },
  { id: 'ach8', title: 'Autónomo', description: 'Completaste una rutina diaria completa', icon: '🦸', category: 'rutinas', unlocked: true, unlockedDate: 'Hace 5 días', points: 200, requirement: 'Rutina diaria completa' },
  { id: 'ach9', title: 'Viajero', description: 'Registraste llegada a 5 lugares diferentes', icon: '🗺️', category: 'movilidad', unlocked: true, unlockedDate: 'Hace 18 días', points: 100, requirement: '5 check-ins en lugares' },
  { id: 'ach10', title: 'Racha dorada', description: 'Mantuviste una racha de 10 días', icon: '⭐', category: 'constancia', unlocked: true, unlockedDate: 'Hace 3 días', points: 200, requirement: 'Racha de 10 días' },
  { id: 'ach11', title: 'Nivel 5', description: 'Alcanzaste el nivel 5', icon: '🎖️', category: 'general', unlocked: true, unlockedDate: 'Hace 22 días', points: 150, requirement: 'Llegar a nivel 5' },
  { id: 'ach12', title: 'Regulador', description: 'Usaste técnica de respiración 10 veces', icon: '🧘', category: 'regulación', unlocked: false, points: 100, requirement: '10 sesiones de respiración' },
  { id: 'ach13', title: 'Matemático', description: 'Calculaste vuelto correctamente 5 veces', icon: '🧮', category: 'dinero', unlocked: false, points: 100, requirement: '5 cálculos de vuelto correctos' },
  { id: 'ach14', title: 'Planificador', description: 'Revisaste tu horario 20 días seguidos', icon: '📅', category: 'organización', unlocked: false, points: 200, requirement: '20 días revisando horario' },
  { id: 'ach15', title: 'Estrella', description: 'Alcanzaste los 5000 puntos', icon: '⭐', category: 'general', unlocked: false, points: 500, requirement: '5000 puntos totales' },
  { id: 'ach16', title: 'Higiénico', description: 'Completaste rutina de higiene 14 días', icon: '🧼', category: 'higiene', unlocked: true, unlockedDate: 'Hace 7 días', points: 100, requirement: '14 días de rutina de higiene' },
  { id: 'ach17', title: 'Comprador', description: 'Hiciste una lista de compras exitosa', icon: '🛒', category: 'compras', unlocked: false, points: 80, requirement: 'Lista de compras completada' },
  { id: 'ach18', title: 'Resiliente', description: 'Manejaste un cambio de plan sin crisis', icon: '🌊', category: 'anticipación', unlocked: true, unlockedDate: 'Hace 4 días', points: 150, requirement: 'Manejar cambio inesperado' },
  { id: 'ach19', title: 'Amigo fiel', description: 'Mandaste 50 mensajes por chat', icon: '💬', category: 'comunicación', unlocked: true, unlockedDate: 'Hace 6 días', points: 80, requirement: '50 mensajes enviados' },
  { id: 'ach20', title: 'Nivel 10', description: 'Alcanzaste el nivel 10', icon: '🏅', category: 'general', unlocked: false, points: 300, requirement: 'Llegar a nivel 10' },
];

// ==================== OBJECTIVES ====================
export interface Objective {
  id: string;
  userId: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  unit: string;
  category: string;
  deadline: string;
  status: 'activo' | 'completado' | 'pausado';
}

export const objectives: Objective[] = [
  { id: 'obj1', userId: 'u1', title: 'Preparar mochila solo', description: 'Preparar la mochila sin ayuda durante 2 semanas seguidas', progress: 10, target: 14, unit: 'días', category: 'organización', deadline: fmt(addDays(today, 4)), status: 'activo' },
  { id: 'obj2', userId: 'u1', title: 'Rutina matutina completa', description: 'Completar toda la rutina de la mañana antes de las 8:30', progress: 8, target: 10, unit: 'días', category: 'autonomía', deadline: fmt(addDays(today, 2)), status: 'activo' },
  { id: 'obj3', userId: 'u1', title: 'Registro emocional diario', description: 'Registrar al menos una emoción por día', progress: 12, target: 30, unit: 'días', category: 'emociones', deadline: fmt(addDays(today, 18)), status: 'activo' },
  { id: 'obj4', userId: 'u1', title: 'Cocinar 3 recetas', description: 'Preparar 3 recetas simples de forma independiente', progress: 1, target: 3, unit: 'recetas', category: 'cocina', deadline: fmt(addDays(today, 20)), status: 'activo' },
  { id: 'obj5', userId: 'u1', title: 'Viaje en colectivo', description: 'Hacer un viaje corto en colectivo con supervisión a distancia', progress: 0, target: 1, unit: 'viaje', category: 'transporte', deadline: fmt(addDays(today, 30)), status: 'activo' },
  { id: 'obj6', userId: 'u1', title: 'Racha de 14 días', description: 'Mantener la racha de actividades por 14 días consecutivos', progress: 12, target: 14, unit: 'días', category: 'constancia', deadline: fmt(addDays(today, 2)), status: 'activo' },
  { id: 'obj7', userId: 'u1', title: 'Usar respiración ante ansiedad', description: 'Aplicar técnica de respiración cada vez que sienta ansiedad', progress: 5, target: 10, unit: 'veces', category: 'regulación', deadline: fmt(addDays(today, 14)), status: 'activo' },
  { id: 'obj8', userId: 'u2', title: 'Rutina de higiene', description: 'Completar rutina completa de higiene diaria', progress: 5, target: 14, unit: 'días', category: 'higiene', deadline: fmt(addDays(today, 9)), status: 'activo' },
  { id: 'obj9', userId: 'u3', title: 'Organizar espacio de trabajo', description: 'Mantener escritorio ordenado por 7 días', progress: 7, target: 7, unit: 'días', category: 'organización', deadline: fmt(today), status: 'completado' },
  { id: 'obj10', userId: 'u4', title: 'Saludar a compañeros', description: 'Practicar saludar al llegar a la escuela', progress: 3, target: 10, unit: 'días', category: 'social', deadline: fmt(addDays(today, 7)), status: 'activo' },
  { id: 'obj11', userId: 'u5', title: 'Preparar merienda solo', description: 'Hacer una merienda sin ayuda', progress: 2, target: 5, unit: 'veces', category: 'cocina', deadline: fmt(addDays(today, 10)), status: 'activo' },
  { id: 'obj12', userId: 'u6', title: 'Usar calendario diario', description: 'Revisar el calendario cada mañana', progress: 1, target: 7, unit: 'días', category: 'organización', deadline: fmt(addDays(today, 6)), status: 'activo' },
  { id: 'obj13', userId: 'u7', title: 'Llegar puntual al trabajo', description: 'Llegar a horario al taller', progress: 14, target: 20, unit: 'días', category: 'autonomía', deadline: fmt(addDays(today, 6)), status: 'activo' },
  { id: 'obj14', userId: 'u8', title: 'Practicar piano 30 min', description: 'Tocar piano al menos 30 minutos por día', progress: 4, target: 7, unit: 'días', category: 'personal', deadline: fmt(addDays(today, 3)), status: 'activo' },
  { id: 'obj15', userId: 'u9', title: 'Comunicar necesidades', description: 'Expresar lo que necesita en 5 situaciones', progress: 1, target: 5, unit: 'situaciones', category: 'comunicación', deadline: fmt(addDays(today, 14)), status: 'activo' },
  { id: 'obj16', userId: 'u10', title: 'Cuidar a las mascotas', description: 'Alimentar y cuidar mascotas solo', progress: 10, target: 14, unit: 'días', category: 'autonomía', deadline: fmt(addDays(today, 4)), status: 'activo' },
  { id: 'obj17', userId: 'u1', title: 'Completar 50 actividades', description: 'Llegar a 50 actividades completadas en total', progress: 35, target: 50, unit: 'actividades', category: 'general', deadline: fmt(addDays(today, 30)), status: 'activo' },
  { id: 'obj18', userId: 'u1', title: 'Pedir ayuda correctamente', description: 'Usar frases aprendidas para pedir ayuda', progress: 3, target: 5, unit: 'veces', category: 'comunicación', deadline: fmt(addDays(today, 10)), status: 'activo' },
  { id: 'obj19', userId: 'u1', title: 'Manejar cambios de plan', description: 'Aplicar estrategia de Plan B en cambios inesperados', progress: 2, target: 5, unit: 'veces', category: 'anticipación', deadline: fmt(addDays(today, 20)), status: 'activo' },
  { id: 'obj20', userId: 'u1', title: 'Llegar a 3000 puntos', description: 'Acumular 3000 puntos en la app', progress: 2450, target: 3000, unit: 'puntos', category: 'general', deadline: fmt(addDays(today, 14)), status: 'activo' },
];

// ==================== LOCATIONS ====================
export interface Location {
  id: string;
  userId: string;
  name: string;
  type: 'actual' | 'frecuente' | 'seguro';
  lat: number;
  lng: number;
  lastVisit?: string;
  address: string;
}

export const locations: Location[] = [
  { id: 'loc1', userId: 'u1', name: 'Casa', type: 'seguro', lat: -34.6037, lng: -58.3816, lastVisit: fmt(today), address: 'Av. Corrientes 1234, CABA' },
  { id: 'loc2', userId: 'u1', name: 'Escuela Nº 15', type: 'seguro', lat: -34.6080, lng: -58.3900, lastVisit: fmt(today), address: 'Calle Tucumán 567, CABA' },
  { id: 'loc3', userId: 'u1', name: 'Consultorio Lic. Martina', type: 'seguro', lat: -34.5990, lng: -58.3850, lastVisit: fmt(addDays(today, -7)), address: 'Av. Santa Fe 2345, CABA' },
  { id: 'loc4', userId: 'u1', name: 'Club deportivo', type: 'frecuente', lat: -34.6100, lng: -58.3950, lastVisit: fmt(addDays(today, -2)), address: 'Calle Sarmiento 890, CABA' },
  { id: 'loc5', userId: 'u1', name: 'Plaza del barrio', type: 'frecuente', lat: -34.6050, lng: -58.3780, lastVisit: fmt(addDays(today, -1)), address: 'Plaza San Martín, CABA' },
  { id: 'loc6', userId: 'u1', name: 'Casa de la abuela', type: 'seguro', lat: -34.5950, lng: -58.4000, lastVisit: fmt(addDays(today, -10)), address: 'Calle Lavalle 456, CABA' },
  { id: 'loc7', userId: 'u1', name: 'Supermercado', type: 'frecuente', lat: -34.6060, lng: -58.3830, lastVisit: fmt(addDays(today, -3)), address: 'Av. Rivadavia 1122, CABA' },
  { id: 'loc8', userId: 'u1', name: 'Clase de música', type: 'frecuente', lat: -34.6020, lng: -58.3870, lastVisit: fmt(addDays(today, -1)), address: 'Calle Junín 789, CABA' },
  { id: 'loc9', userId: 'u2', name: 'Casa', type: 'seguro', lat: -34.6200, lng: -58.4100, address: 'Av. Cabildo 2345, CABA' },
  { id: 'loc10', userId: 'u2', name: 'Escuela', type: 'seguro', lat: -34.6250, lng: -58.4150, address: 'Calle Monroe 567, CABA' },
  { id: 'loc11', userId: 'u3', name: 'Casa', type: 'seguro', lat: -34.5800, lng: -58.4200, address: 'Calle Maipú 123, CABA' },
  { id: 'loc12', userId: 'u3', name: 'Trabajo (taller)', type: 'seguro', lat: -34.5850, lng: -58.4250, address: 'Av. Libertador 4567, CABA' },
  { id: 'loc13', userId: 'u4', name: 'Casa', type: 'seguro', lat: -34.6300, lng: -58.3700, address: 'Calle San Juan 890, CABA' },
  { id: 'loc14', userId: 'u5', name: 'Casa', type: 'seguro', lat: -34.6400, lng: -58.3600, address: 'Av. La Plata 1234, CABA' },
  { id: 'loc15', userId: 'u6', name: 'Casa', type: 'seguro', lat: -34.6500, lng: -58.3500, address: 'Calle Boedo 567, CABA' },
  { id: 'loc16', userId: 'u7', name: 'Casa', type: 'seguro', lat: -34.5700, lng: -58.4300, address: 'Calle Olazábal 890, CABA' },
  { id: 'loc17', userId: 'u8', name: 'Casa', type: 'seguro', lat: -34.5600, lng: -58.4400, address: 'Av. Del Libertador 1234, CABA' },
  { id: 'loc18', userId: 'u9', name: 'Casa', type: 'seguro', lat: -34.5500, lng: -58.4500, address: 'Calle Crámer 567, CABA' },
  { id: 'loc19', userId: 'u10', name: 'Casa', type: 'seguro', lat: -34.6150, lng: -58.3750, address: 'Calle Perú 890, CABA' },
  { id: 'loc20', userId: 'u1', name: 'Cine del centro', type: 'frecuente', lat: -34.6040, lng: -58.3810, lastVisit: fmt(addDays(today, -14)), address: 'Av. Corrientes 2345, CABA' },
];

// ==================== RECOMMENDATIONS ====================
export interface Recommendation {
  id: string;
  userId: string;
  title: string;
  description: string;
  source: 'tutor' | 'profesional' | 'app';
  sourceName: string;
  category: string;
  priority: 'alta' | 'media' | 'baja';
  timestamp: string;
}

export const recommendations: Recommendation[] = [
  { id: 'rec1', userId: 'u1', title: 'Practicar anticipación de cambios', description: 'Juan muestra mejoría cuando anticipa cambios. Reforzar con actividades de Plan B.', source: 'profesional', sourceName: 'Lic. Martina Pérez', category: 'anticipación', priority: 'alta', timestamp: fmt(addDays(today, -1)) },
  { id: 'rec2', userId: 'u1', title: 'Incorporar cocina 2 veces/semana', description: 'Aumentar la frecuencia de actividades de cocina para ganar más autonomía.', source: 'profesional', sourceName: 'Lic. Martina Pérez', category: 'cocina', priority: 'media', timestamp: fmt(addDays(today, -3)) },
  { id: 'rec3', userId: 'u1', title: 'Registrar emociones antes de dormir', description: 'Es importante que Juan registre cómo se sintió cada día antes de dormir.', source: 'tutor', sourceName: 'Laura Gómez', category: 'emociones', priority: 'alta', timestamp: fmt(addDays(today, -2)) },
  { id: 'rec4', userId: 'u1', title: 'Practicar transporte público', description: 'Cuando se sienta listo, empezar con recorridos cortos acompañado.', source: 'profesional', sourceName: 'Lic. Martina Pérez', category: 'transporte', priority: 'baja', timestamp: fmt(addDays(today, -5)) },
  { id: 'rec5', userId: 'u1', title: 'Usar timer para actividades', description: 'Poner un temporizador visible ayuda a Juan a gestionar el tiempo.', source: 'tutor', sourceName: 'Laura Gómez', category: 'organización', priority: 'media', timestamp: fmt(addDays(today, -4)) },
  { id: 'rec6', userId: 'u1', title: 'Actividades sociales grupales', description: 'Participar en el taller de habilidades sociales para ampliar su círculo.', source: 'profesional', sourceName: 'Lic. Martina Pérez', category: 'social', priority: 'media', timestamp: fmt(addDays(today, -6)) },
  { id: 'rec7', userId: 'u2', title: 'Rutina visual con pictogramas', description: 'Usar apoyos visuales para la rutina matutina.', source: 'profesional', sourceName: 'Dr. Lucas Ortega', category: 'rutinas', priority: 'alta', timestamp: fmt(addDays(today, -2)) },
  { id: 'rec8', userId: 'u3', title: 'Expandir tareas laborales', description: 'Mateo puede asumir más responsabilidades en el taller.', source: 'profesional', sourceName: 'Lic. Carolina Vega', category: 'autonomía', priority: 'media', timestamp: fmt(addDays(today, -1)) },
  { id: 'rec9', userId: 'u4', title: 'Leer recetas simples', description: 'Combinar lectura con cocina para reforzar ambas habilidades.', source: 'app', sourceName: 'TÁNDEM', category: 'cocina', priority: 'baja', timestamp: fmt(addDays(today, -3)) },
  { id: 'rec10', userId: 'u5', title: 'Juegos de turno', description: 'Practicar esperar turnos con juegos de mesa.', source: 'profesional', sourceName: 'Lic. Pablo Ibáñez', category: 'social', priority: 'media', timestamp: fmt(addDays(today, -4)) },
  { id: 'rec11', userId: 'u1', title: 'Hacer lista de compras con mamá', description: 'Empezar a participar en la planificación de compras del hogar.', source: 'app', sourceName: 'TÁNDEM', category: 'compras', priority: 'media', timestamp: fmt(addDays(today, -7)) },
  { id: 'rec12', userId: 'u1', title: 'Practicar pedir en un negocio', description: 'Ensayar cómo pedir algo en un kiosco o panadería.', source: 'profesional', sourceName: 'Lic. Martina Pérez', category: 'comunicación', priority: 'media', timestamp: fmt(addDays(today, -8)) },
  { id: 'rec13', userId: 'u6', title: 'Natación como regulación sensorial', description: 'La natación ayuda a Camila a regular su sistema sensorial.', source: 'profesional', sourceName: 'Dr. Lucas Ortega', category: 'regulación', priority: 'alta', timestamp: fmt(addDays(today, -2)) },
  { id: 'rec14', userId: 'u7', title: 'Gestión del dinero', description: 'Nicolás puede empezar a manejar un presupuesto semanal.', source: 'profesional', sourceName: 'Dra. Natalia Juárez', category: 'dinero', priority: 'media', timestamp: fmt(addDays(today, -3)) },
  { id: 'rec15', userId: 'u8', title: 'Lectura guiada', description: 'Incorporar lectura diaria de 15 minutos.', source: 'profesional', sourceName: 'Lic. Marcos Delgado', category: 'escuela', priority: 'baja', timestamp: fmt(addDays(today, -5)) },
  { id: 'rec16', userId: 'u9', title: 'Comunicación con pictogramas', description: 'Reforzar el uso de pictogramas para expresar necesidades.', source: 'profesional', sourceName: 'Lic. Carolina Vega', category: 'comunicación', priority: 'alta', timestamp: fmt(addDays(today, -1)) },
  { id: 'rec17', userId: 'u10', title: 'Cuidado animal responsable', description: 'Asignar tareas de cuidado de mascotas como rutina.', source: 'tutor', sourceName: 'Diego Castro', category: 'autonomía', priority: 'media', timestamp: fmt(addDays(today, -4)) },
  { id: 'rec18', userId: 'u1', title: 'Preparar salidas con checklist', description: 'Usar una lista de verificación antes de salir de casa.', source: 'tutor', sourceName: 'Laura Gómez', category: 'organización', priority: 'alta', timestamp: fmt(addDays(today, -1)) },
  { id: 'rec19', userId: 'u1', title: 'Practicar saludar en contextos nuevos', description: 'Aprovechar situaciones nuevas para practicar presentaciones.', source: 'profesional', sourceName: 'Lic. Martina Pérez', category: 'comunicación', priority: 'media', timestamp: fmt(addDays(today, -9)) },
  { id: 'rec20', userId: 'u1', title: 'Descansos activos entre tareas', description: 'Incorporar pausas de movimiento entre actividades de estudio.', source: 'app', sourceName: 'TÁNDEM', category: 'regulación', priority: 'baja', timestamp: fmt(addDays(today, -6)) },
];

// ==================== PICTOGRAMS ====================
export interface Pictogram {
  id: string;
  name: string;
  emoji: string;
  imageUrl?: string;
  downloadUrl?: string;
  category: string;
  tags: string[];
  favorite?: boolean;
}

export const pictograms: Pictogram[] = [
  { id: 'pic1', name: 'Contento', emoji: '😊', category: 'emociones', tags: ['feliz','alegre','bien'] },
  { id: 'pic2', name: 'Triste', emoji: '😢', category: 'emociones', tags: ['llorar','pena','mal'] },
  { id: 'pic3', name: 'Enojado', emoji: '😡', category: 'emociones', tags: ['furioso','ira','bronca'] },
  { id: 'pic4', name: 'Asustado', emoji: '😨', category: 'emociones', tags: ['miedo','susto','temor'] },
  { id: 'pic5', name: 'Cansado', emoji: '😴', category: 'emociones', tags: ['sueño','dormir','agotado'] },
  { id: 'pic6', name: 'Sorprendido', emoji: '😲', category: 'emociones', tags: ['wow','asombro'] },
  { id: 'pic7', name: 'Cepillar dientes', emoji: '🪥', category: 'higiene', tags: ['dientes','cepillo','pasta'] },
  { id: 'pic8', name: 'Ducharse', emoji: '🚿', category: 'higiene', tags: ['baño','agua','limpio'] },
  { id: 'pic9', name: 'Lavarse las manos', emoji: '🧼', category: 'higiene', tags: ['jabón','limpieza'] },
  { id: 'pic10', name: 'Peinarse', emoji: '💇', category: 'higiene', tags: ['pelo','cabello','peine'] },
  { id: 'pic11', name: 'Desayuno', emoji: '🥣', category: 'comida', tags: ['mañana','cereal','leche'] },
  { id: 'pic12', name: 'Almuerzo', emoji: '🍽️', category: 'comida', tags: ['mediodía','comida'] },
  { id: 'pic13', name: 'Merienda', emoji: '🥪', category: 'comida', tags: ['tarde','snack'] },
  { id: 'pic14', name: 'Cena', emoji: '🍝', category: 'comida', tags: ['noche','comer'] },
  { id: 'pic15', name: 'Agua', emoji: '💧', category: 'comida', tags: ['beber','tomar','sed'] },
  { id: 'pic16', name: 'Escuela', emoji: '🏫', category: 'escuela', tags: ['colegio','estudio','aprender'] },
  { id: 'pic17', name: 'Leer', emoji: '📖', category: 'escuela', tags: ['libro','lectura'] },
  { id: 'pic18', name: 'Escribir', emoji: '✏️', category: 'escuela', tags: ['tarea','cuaderno','lápiz'] },
  { id: 'pic19', name: 'Matemáticas', emoji: '🧮', category: 'escuela', tags: ['números','contar','sumar'] },
  { id: 'pic20', name: 'Casa', emoji: '🏠', category: 'casa', tags: ['hogar','familia'] },
  { id: 'pic21', name: 'Dormir', emoji: '🛏️', category: 'casa', tags: ['cama','noche','descansar'] },
  { id: 'pic22', name: 'Vestirse', emoji: '👕', category: 'casa', tags: ['ropa','cambiarse'] },
  { id: 'pic23', name: 'Ordenar', emoji: '🧹', category: 'casa', tags: ['limpiar','organizar'] },
  { id: 'pic24', name: 'Cocinar', emoji: '🍳', category: 'casa', tags: ['comida','preparar','cocina'] },
  { id: 'pic25', name: 'Mamá', emoji: '👩', category: 'personas', tags: ['madre','familia'] },
  { id: 'pic26', name: 'Papá', emoji: '👨', category: 'personas', tags: ['padre','familia'] },
  { id: 'pic27', name: 'Doctor/a', emoji: '👩‍⚕️', category: 'personas', tags: ['médico','salud','terapia'] },
  { id: 'pic28', name: 'Amigo/a', emoji: '🤝', category: 'personas', tags: ['compañero','social'] },
  { id: 'pic29', name: 'Profesor/a', emoji: '🧑‍🏫', category: 'personas', tags: ['maestro','escuela'] },
  { id: 'pic30', name: 'Sí', emoji: '✅', category: 'comunicación', tags: ['afirmativo','ok','bien'] },
  { id: 'pic31', name: 'No', emoji: '❌', category: 'comunicación', tags: ['negativo','no quiero'] },
  { id: 'pic32', name: 'Ayuda', emoji: '🙋', category: 'comunicación', tags: ['necesito','socorro','apoyo'] },
  { id: 'pic33', name: 'Esperar', emoji: '⏳', category: 'comunicación', tags: ['turno','paciencia'] },
  { id: 'pic34', name: 'Gracias', emoji: '🙏', category: 'comunicación', tags: ['agradecer'] },
  { id: 'pic35', name: 'Por favor', emoji: '🤲', category: 'comunicación', tags: ['pedir','educación'] },
  { id: 'pic36', name: 'Jugar', emoji: '🎮', category: 'actividades', tags: ['diversión','tiempo libre'] },
  { id: 'pic37', name: 'Deporte', emoji: '⚽', category: 'actividades', tags: ['fútbol','ejercicio','correr'] },
  { id: 'pic38', name: 'Música', emoji: '🎵', category: 'actividades', tags: ['cantar','guitarra','escuchar'] },
  { id: 'pic39', name: 'Dibujar', emoji: '🎨', category: 'actividades', tags: ['arte','pintar','colores'] },
  { id: 'pic40', name: 'Pasear', emoji: '🚶', category: 'actividades', tags: ['caminar','salir','aire libre'] },
  { id: 'pic41', name: 'Dolor', emoji: '🤕', category: 'salud', tags: ['me duele','enfermo'] },
  { id: 'pic42', name: 'Baño', emoji: '🚽', category: 'necesidades', tags: ['ir al baño','necesidad'] },
  { id: 'pic43', name: 'Hambre', emoji: '🤤', category: 'necesidades', tags: ['comer','comida'] },
  { id: 'pic44', name: 'Sed', emoji: '🥵', category: 'necesidades', tags: ['agua','beber'] },
  { id: 'pic45', name: 'Frío', emoji: '🥶', category: 'necesidades', tags: ['abrigo','temperatura'] },
];

// ==================== VISUAL RESOURCES ====================
export interface VisualResource {
  id: string;
  title: string;
  type: 'pictograma' | 'secuencia' | 'timer' | 'historia social' | 'checklist' | 'mapa visual';
  description: string;
  category: string;
  emoji: string;
}

export const visualResources: VisualResource[] = [
  { id: 'vr1', title: 'Secuencia: Lavarse los dientes', type: 'secuencia', description: 'Pasos visuales para cepillarse los dientes', category: 'higiene', emoji: '🪥' },
  { id: 'vr2', title: 'Secuencia: Ducharse', type: 'secuencia', description: 'Guía visual paso a paso para ducharse', category: 'higiene', emoji: '🚿' },
  { id: 'vr3', title: 'Timer visual: 5 minutos', type: 'timer', description: 'Temporizador visual de 5 minutos', category: 'general', emoji: '⏱️' },
  { id: 'vr4', title: 'Timer visual: 15 minutos', type: 'timer', description: 'Temporizador visual de 15 minutos', category: 'general', emoji: '⏱️' },
  { id: 'vr5', title: 'Emociones: Termómetro', type: 'pictograma', description: 'Termómetro visual para medir intensidad emocional', category: 'emociones', emoji: '🌡️' },
  { id: 'vr6', title: 'Historia social: Ir al supermercado', type: 'historia social', description: 'Historia social sobre cómo es ir a comprar', category: 'compras', emoji: '🛒' },
  { id: 'vr7', title: 'Checklist: Preparar mochila', type: 'checklist', description: 'Lista de verificación para armar la mochila', category: 'organización', emoji: '✅' },
  { id: 'vr8', title: 'Historia social: Cambio de plan', type: 'historia social', description: 'Qué hacer cuando algo planeado cambia', category: 'anticipación', emoji: '🔄' },
  { id: 'vr9', title: 'Secuencia: Hacer la cama', type: 'secuencia', description: 'Pasos para tender la cama', category: 'rutinas', emoji: '🛏️' },
  { id: 'vr10', title: 'Mapa visual: Mi barrio', type: 'mapa visual', description: 'Mapa simplificado del barrio con lugares importantes', category: 'transporte', emoji: '🗺️' },
  { id: 'vr11', title: 'Secuencia: Preparar merienda', type: 'secuencia', description: 'Pasos para preparar una merienda simple', category: 'cocina', emoji: '🥪' },
  { id: 'vr12', title: 'Pictograma: Emociones básicas', type: 'pictograma', description: 'Caritas de emociones para identificar sentimientos', category: 'emociones', emoji: '😊' },
  { id: 'vr13', title: 'Checklist: Salir de casa', type: 'checklist', description: 'Lista de cosas a verificar antes de salir', category: 'organización', emoji: '🚪' },
  { id: 'vr14', title: 'Timer visual: 30 minutos', type: 'timer', description: 'Temporizador visual de 30 minutos', category: 'general', emoji: '⏱️' },
  { id: 'vr15', title: 'Historia social: Pedir ayuda', type: 'historia social', description: 'Cómo y cuándo pedir ayuda a un adulto', category: 'comunicación', emoji: '🙋' },
  { id: 'vr16', title: 'Secuencia: Usar el microondas', type: 'secuencia', description: 'Pasos seguros para usar el microondas', category: 'cocina', emoji: '📡' },
  { id: 'vr17', title: 'Checklist: Ropa del día', type: 'checklist', description: 'Lista para elegir ropa según clima y actividad', category: 'autonomía', emoji: '👕' },
  { id: 'vr18', title: 'Pictograma: Respiración', type: 'pictograma', description: 'Guía visual de respiración 4-4-6', category: 'regulación', emoji: '🫁' },
  { id: 'vr19', title: 'Historia social: Cumpleaños', type: 'historia social', description: 'Qué esperar y cómo comportarse en un cumpleaños', category: 'social', emoji: '🎂' },
  { id: 'vr20', title: 'Mapa visual: Camino a la escuela', type: 'mapa visual', description: 'Ruta visual desde casa hasta la escuela', category: 'transporte', emoji: '🏫' },
];

// ==================== RESOURCES ====================
export interface Resource {
  id: string;
  title: string;
  description: string;
  category: 'familias' | 'estrategias' | 'educativo' | 'bienestar';
  emoji: string;
  readTime: string;
}

export const resources: Resource[] = [
  { id: 'res1', title: '5 formas de apoyar la autonomía', description: 'Estrategias prácticas para ayudar a tu hijo/a a ser más independiente sin presionar.', category: 'familias', emoji: '💡', readTime: '3 min' },
  { id: 'res2', title: 'Cómo manejar los cambios de rutina', description: 'Los cambios inesperados pueden ser difíciles. Acá hay ideas para anticiparlos.', category: 'estrategias', emoji: '🔄', readTime: '4 min' },
  { id: 'res3', title: 'La importancia del refuerzo positivo', description: 'Celebrar los logros, por pequeños que sean, hace una gran diferencia.', category: 'educativo', emoji: '🌟', readTime: '2 min' },
  { id: 'res4', title: 'Técnicas de respiración para regular emociones', description: 'Herramientas simples que cualquier persona puede usar para calmarse.', category: 'bienestar', emoji: '🫁', readTime: '3 min' },
  { id: 'res5', title: 'Rutinas visuales: por qué funcionan', description: 'Los apoyos visuales ayudan a anticipar, organizar y reducir la ansiedad.', category: 'educativo', emoji: '📋', readTime: '4 min' },
  { id: 'res6', title: 'Cómo hablar sobre emociones', description: 'Guía para acompañar a tu hijo/a en la identificación y expresión de sentimientos.', category: 'familias', emoji: '💬', readTime: '5 min' },
  { id: 'res7', title: 'Preparar salidas sin estrés', description: 'Checklists y estrategias para que salir de casa sea una experiencia positiva.', category: 'estrategias', emoji: '🚪', readTime: '3 min' },
  { id: 'res8', title: 'Jugar para aprender', description: 'Actividades lúdicas que desarrollan habilidades sin que se sienta como una tarea.', category: 'educativo', emoji: '🎮', readTime: '4 min' },
];

// ==================== PRICING PLANS ====================
export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted: boolean;
  badge?: string;
}

export const pricingPlans: PricingPlan[] = [
  {
    id: 'plan-free',
    name: 'Gratuito',
    price: '$0',
    period: 'siempre',
    features: [
      'Rutinas y calendario',
      'Hasta 5 actividades activas',
      'Registro emocional básico',
      'Chat con 1 contacto',
      '1 perfil vinculado',
      'Logros básicos',
    ],
    highlighted: false,
  },
  {
    id: 'plan-premium',
    name: 'Premium',
    price: '$2.990',
    period: '/mes',
    badge: '1 mes gratis',
    features: [
      'Todo lo del plan gratuito',
      'Actividades ilimitadas',
      'Geolocalización en tiempo real',
      'Estadísticas avanzadas',
      'Hasta 5 perfiles vinculados',
      'Personalización completa',
      'Seguimiento profesional detallado',
      'Pictogramas premium',
      'Recursos y guías exclusivas',
      'Soporte prioritario',
    ],
    highlighted: true,
  },
];

// ==================== HELPER FUNCTIONS ====================
export function findUser(username: string, password: string): (User | Tutor | Professional | Admin) | null {
  const u = users.find(u => u.username === username && u.password === password);
  if (u) return u;
  const t = tutors.find(t => t.username === username && t.password === password);
  if (t) return t;
  const p = professionals.find(p => p.username === username && p.password === password);
  if (p) return p;
  const a = admins.find(a => a.username === username && a.password === password);
  if (a) return a;
  return null;
}

export function getUserById(id: string): User | undefined { return users.find(u => u.id === id); }
export function getTutorById(id: string): Tutor | undefined { return tutors.find(t => t.id === id); }
export function getProfessionalById(id: string): Professional | undefined { return professionals.find(p => p.id === id); }
export function getActivitiesForUser(userId: string): Activity[] { return activities.filter(a => a.assignedTo === userId); }
export function getEventsForUser(userId: string): CalendarEvent[] { return calendarEvents.filter(e => e.userId === userId); }
export function getConversationsForUser(userId: string): Conversation[] { return conversations.filter(c => c.participants.includes(userId)); }
export function getMessagesForConversation(convId: string): ChatMessage[] { return chatMessages.filter(m => m.conversationId === convId); }
export function getNotificationsForUser(userId: string): Notification[] { return notifications.filter(n => n.userId === userId); }
export function getEmotionsForUser(userId: string): EmotionalRecord[] { return emotionalRecords.filter(e => e.userId === userId); }
export function getObjectivesForUser(userId: string): Objective[] { return objectives.filter(o => o.userId === userId); }
export function getLocationsForUser(userId: string): Location[] { return locations.filter(l => l.userId === userId); }
export function getRecommendationsForUser(userId: string): Recommendation[] { return recommendations.filter(r => r.userId === userId); }
