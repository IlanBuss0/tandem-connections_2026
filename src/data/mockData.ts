// ==================== USERS ====================
export type UserRole = 'user' | 'tutor' | 'professional';

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
}

const emojiAvatars = ['😊','🧑','👩','👨','🧒','👧','👦','🧔','👩‍🦰','👨‍🦱','👩‍🔬','👨‍⚕️','👩‍💼','🧑‍🏫','👩‍⚕️','🧑‍💻','👨‍🎨','👩‍🎓','🧑‍🔧','👨‍🍳','👩‍🚀','🧑‍🎤'];

export const users: User[] = [
  { id: 'u1', username: 'juan123', password: '123456', name: 'Juan García', role: 'user', email: 'juan@tandem.app', avatar: '🧒', age: 16, bio: 'Me gusta la música y los videojuegos. Estoy aprendiendo a organizarme mejor cada día.', linkedTutorIds: ['t1'], linkedProfessionalIds: ['p1'], points: 2450, streak: 12, level: 8, plan: 'premium' },
  { id: 'u2', username: 'sofia_m', password: '123456', name: 'Sofía Martínez', role: 'user', email: 'sofia@tandem.app', avatar: '👧', age: 14, bio: 'Amo dibujar y los animales.', linkedTutorIds: ['t2'], linkedProfessionalIds: ['p2'], points: 1800, streak: 7, level: 6, plan: 'free' },
  { id: 'u3', username: 'mateo_r', password: '123456', name: 'Mateo Rodríguez', role: 'user', email: 'mateo@tandem.app', avatar: '👦', age: 18, bio: 'Estudiante de computación, me interesa la tecnología.', linkedTutorIds: ['t3'], linkedProfessionalIds: ['p3'], points: 3100, streak: 20, level: 10, plan: 'premium' },
  { id: 'u4', username: 'vale_l', password: '123456', name: 'Valentina López', role: 'user', email: 'vale@tandem.app', avatar: '👩', age: 15, bio: 'Me gusta cocinar y leer cuentos.', linkedTutorIds: ['t4'], linkedProfessionalIds: ['p1'], points: 950, streak: 3, level: 4, plan: 'free' },
  { id: 'u5', username: 'tomas_b', password: '123456', name: 'Tomás Benítez', role: 'user', email: 'tomas@tandem.app', avatar: '🧑', age: 17, bio: 'Fanático del fútbol y los rompecabezas.', linkedTutorIds: ['t5'], linkedProfessionalIds: ['p4'], points: 1200, streak: 5, level: 5, plan: 'free' },
  { id: 'u6', username: 'camila_s', password: '123456', name: 'Camila Sánchez', role: 'user', email: 'camila@tandem.app', avatar: '👧', age: 13, bio: 'Me encanta la natación.', linkedTutorIds: ['t6'], linkedProfessionalIds: ['p2'], points: 700, streak: 2, level: 3, plan: 'free' },
  { id: 'u7', username: 'nico_f', password: '123456', name: 'Nicolás Fernández', role: 'user', email: 'nico@tandem.app', avatar: '👦', age: 19, bio: 'Trabajo en un taller y aprendo cosas nuevas.', linkedTutorIds: ['t7'], linkedProfessionalIds: ['p5'], points: 2800, streak: 15, level: 9, plan: 'premium' },
  { id: 'u8', username: 'lucia_d', password: '123456', name: 'Lucía Domínguez', role: 'user', email: 'lucia@tandem.app', avatar: '👩', age: 16, bio: 'Toco el piano y me gusta el arte.', linkedTutorIds: ['t8'], linkedProfessionalIds: ['p6'], points: 1600, streak: 8, level: 6, plan: 'free' },
  { id: 'u9', username: 'benja_v', password: '123456', name: 'Benjamín Vargas', role: 'user', email: 'benja@tandem.app', avatar: '🧒', age: 14, bio: 'Me gustan los trenes y los mapas.', linkedTutorIds: ['t9'], linkedProfessionalIds: ['p3'], points: 500, streak: 1, level: 2, plan: 'free' },
  { id: 'u10', username: 'mia_c', password: '123456', name: 'Mía Castro', role: 'user', email: 'mia@tandem.app', avatar: '👧', age: 17, bio: 'Quiero ser veterinaria.', linkedTutorIds: ['t10'], linkedProfessionalIds: ['p7'], points: 2100, streak: 10, level: 7, plan: 'premium' },
  { id: 'u11', username: 'agus_p', password: '123456', name: 'Agustín Pérez', role: 'user', email: 'agus@tandem.app', avatar: '👦', age: 15, bio: 'Me gusta armar cosas con las manos.', linkedTutorIds: ['t1'], linkedProfessionalIds: ['p8'], points: 900, streak: 4, level: 4, plan: 'free' },
  { id: 'u12', username: 'emma_g', password: '123456', name: 'Emma González', role: 'user', email: 'emma@tandem.app', avatar: '👩', age: 13, bio: 'Amo los gatos y los juegos de mesa.', linkedTutorIds: ['t2'], linkedProfessionalIds: ['p9'], points: 400, streak: 2, level: 2, plan: 'free' },
  { id: 'u13', username: 'fede_m', password: '123456', name: 'Federico Morales', role: 'user', email: 'fede@tandem.app', avatar: '🧑', age: 20, bio: 'Estudio gastronomía, me apasiona cocinar.', linkedTutorIds: ['t3'], linkedProfessionalIds: ['p10'], points: 3500, streak: 25, level: 11, plan: 'premium' },
  { id: 'u14', username: 'caro_h', password: '123456', name: 'Carolina Herrera', role: 'user', email: 'caro@tandem.app', avatar: '👧', age: 16, bio: 'Me gusta la fotografía y los viajes.', linkedTutorIds: ['t4'], linkedProfessionalIds: ['p1'], points: 1100, streak: 6, level: 5, plan: 'free' },
  { id: 'u15', username: 'santi_r', password: '123456', name: 'Santiago Ruiz', role: 'user', email: 'santi@tandem.app', avatar: '👦', age: 18, bio: 'Me relaja escuchar podcasts.', linkedTutorIds: ['t5'], linkedProfessionalIds: ['p2'], points: 1900, streak: 9, level: 7, plan: 'free' },
  { id: 'u16', username: 'isa_n', password: '123456', name: 'Isabella Navarro', role: 'user', email: 'isa@tandem.app', avatar: '👩', age: 14, bio: 'Me gusta bailar y hacer yoga.', linkedTutorIds: ['t6'], linkedProfessionalIds: ['p5'], points: 750, streak: 3, level: 3, plan: 'free' },
  { id: 'u17', username: 'martin_a', password: '123456', name: 'Martín Álvarez', role: 'user', email: 'martin@tandem.app', avatar: '🧒', age: 17, bio: 'Hago deporte y me gusta la naturaleza.', linkedTutorIds: ['t7'], linkedProfessionalIds: ['p6'], points: 2200, streak: 11, level: 8, plan: 'premium' },
  { id: 'u18', username: 'renata_t', password: '123456', name: 'Renata Torres', role: 'user', email: 'renata@tandem.app', avatar: '👧', age: 15, bio: 'Me encanta la música y cantar.', linkedTutorIds: ['t8'], linkedProfessionalIds: ['p7'], points: 1300, streak: 5, level: 5, plan: 'free' },
  { id: 'u19', username: 'leo_c', password: '123456', name: 'Leonardo Cruz', role: 'user', email: 'leo@tandem.app', avatar: '👦', age: 19, bio: 'Aprendo carpintería, me gusta crear.', linkedTutorIds: ['t9'], linkedProfessionalIds: ['p8'], points: 2700, streak: 14, level: 9, plan: 'premium' },
  { id: 'u20', username: 'pau_e', password: '123456', name: 'Paula Espinoza', role: 'user', email: 'pau@tandem.app', avatar: '👩', age: 16, bio: 'Me gusta escribir historias cortas.', linkedTutorIds: ['t10'], linkedProfessionalIds: ['p9'], points: 1050, streak: 4, level: 4, plan: 'free' },
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

export interface Activity {
  id: string;
  title: string;
  category: ActivityCategory;
  objective: string;
  description: string;
  difficulty: 'fácil' | 'medio' | 'avanzado';
  duration: string;
  steps: string[];
  status: 'pendiente' | 'en progreso' | 'completada';
  recommendedBy: 'tutor' | 'profesional' | 'app';
  recommendedByName?: string;
  progress: number;
  assignedTo?: string;
  points: number;
}

export const activities: Activity[] = [
  { id: 'a1', title: 'Preparar la mochila para mañana', category: 'organización', objective: 'Anticipar lo necesario para el día siguiente', description: 'Revisar el horario del día siguiente y preparar todos los materiales necesarios en la mochila.', difficulty: 'fácil', duration: '10 min', steps: ['Mirar el horario de mañana', 'Sacar lo que no necesitás', 'Agregar cuadernos y útiles', 'Verificar que no falte nada', 'Dejar la mochila lista en su lugar'], status: 'completada', recommendedBy: 'tutor', recommendedByName: 'Laura Gómez', progress: 100, assignedTo: 'u1', points: 50 },
  { id: 'a2', title: 'Ordenar el escritorio', category: 'rutinas del hogar', objective: 'Mantener el espacio de estudio organizado', description: 'Limpiar y organizar el escritorio para tener un espacio de trabajo ordenado.', difficulty: 'fácil', duration: '15 min', steps: ['Sacar todo del escritorio', 'Limpiar la superficie', 'Clasificar útiles', 'Guardar lo que no usás', 'Dejar solo lo necesario'], status: 'pendiente', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 0, assignedTo: 'u1', points: 40 },
  { id: 'a3', title: 'Revisar el horario del día', category: 'organización', objective: 'Saber qué esperar durante el día', description: 'Consultar el calendario o agenda y repasar las actividades programadas para hoy.', difficulty: 'fácil', duration: '5 min', steps: ['Abrir la agenda o calendario', 'Leer cada actividad del día', 'Anotar dudas o cambios', 'Preparar lo necesario'], status: 'completada', recommendedBy: 'app', progress: 100, assignedTo: 'u1', points: 30 },
  { id: 'a4', title: 'Lavarse los dientes correctamente', category: 'higiene', objective: 'Mantener una buena higiene bucal', description: 'Seguir los pasos para un cepillado completo después de cada comida.', difficulty: 'fácil', duration: '3 min', steps: ['Mojar el cepillo', 'Poner pasta dental', 'Cepillar arriba y abajo', 'Cepillar la lengua', 'Enjuagar'], status: 'completada', recommendedBy: 'tutor', recommendedByName: 'Laura Gómez', progress: 100, assignedTo: 'u1', points: 20 },
  { id: 'a5', title: 'Preparar una merienda simple', category: 'cocina básica', objective: 'Ganar autonomía en alimentación', description: 'Preparar una merienda saludable de forma independiente.', difficulty: 'fácil', duration: '10 min', steps: ['Elegir qué merendar', 'Sacar los ingredientes', 'Preparar (cortar, untar, servir)', 'Comer en la mesa', 'Limpiar lo usado'], status: 'en progreso', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 60, assignedTo: 'u1', points: 50 },
  { id: 'a6', title: 'Armar la ropa del día siguiente', category: 'autonomía personal', objective: 'Anticipar y preparar la vestimenta', description: 'Elegir y dejar lista la ropa que vas a usar mañana según el clima y las actividades.', difficulty: 'fácil', duration: '5 min', steps: ['Ver el clima de mañana', 'Pensar qué actividades tenés', 'Elegir ropa adecuada', 'Dejarla doblada en una silla'], status: 'pendiente', recommendedBy: 'tutor', recommendedByName: 'Laura Gómez', progress: 0, assignedTo: 'u1', points: 30 },
  { id: 'a7', title: 'Reconocer cómo me siento', category: 'emociones', objective: 'Identificar y nombrar emociones', description: 'Hacer una pausa para identificar qué emoción estás sintiendo y registrarla.', difficulty: 'fácil', duration: '5 min', steps: ['Hacer una pausa', 'Respirar profundo', 'Pensar: ¿qué siento?', 'Elegir la emoción que más se parece', 'Registrarla en la app'], status: 'completada', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 100, assignedTo: 'u1', points: 40 },
  { id: 'a8', title: 'Avisar si llegué bien', category: 'seguridad personal', objective: 'Mantener comunicación con adultos de confianza', description: 'Enviar un mensaje a mamá/papá o tutor cuando llegás a un lugar seguro.', difficulty: 'fácil', duration: '2 min', steps: ['Llegar al destino', 'Sacar el celular', 'Enviar mensaje de aviso', 'Guardar el celular'], status: 'completada', recommendedBy: 'tutor', recommendedByName: 'Laura Gómez', progress: 100, assignedTo: 'u1', points: 30 },
  { id: 'a9', title: 'Preparar lo necesario para salir', category: 'preparación para salidas', objective: 'Salir de casa de forma organizada', description: 'Revisar que tengas todo lo necesario antes de salir: llaves, celular, billetera, etc.', difficulty: 'medio', duration: '5 min', steps: ['Revisar lista de cosas para llevar', 'Verificar llaves', 'Verificar celular con batería', 'Verificar billetera/tarjeta', 'Verificar documentos si hacen falta'], status: 'pendiente', recommendedBy: 'app', progress: 0, assignedTo: 'u1', points: 40 },
  { id: 'a10', title: 'Hacer una lista corta de compras', category: 'compras', objective: 'Planificar una compra simple', description: 'Escribir una lista de 3-5 cosas que necesitás comprar y calcular un estimado.', difficulty: 'medio', duration: '10 min', steps: ['Pensar qué necesitás', 'Escribir la lista', 'Estimar cuánto sale cada cosa', 'Calcular el total aproximado', 'Preparar el dinero o medio de pago'], status: 'pendiente', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 0, assignedTo: 'u1', points: 60 },
  { id: 'a11', title: 'Seguir una rutina de respiración', category: 'regulación emocional', objective: 'Aprender a calmarse con respiración', description: 'Practicar una técnica de respiración durante 3 minutos cuando te sentís ansioso o agitado.', difficulty: 'fácil', duration: '3 min', steps: ['Sentarte cómodamente', 'Cerrar los ojos', 'Inspirar contando hasta 4', 'Mantener contando hasta 4', 'Exhalar contando hasta 6', 'Repetir 5 veces'], status: 'completada', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 100, assignedTo: 'u1', points: 30 },
  { id: 'a12', title: 'Identificar qué hacer si un plan cambia', category: 'anticipación de cambios', objective: 'Tolerar y manejar cambios inesperados', description: 'Practicar mentalmente qué hacer si algo planeado cambia de repente.', difficulty: 'medio', duration: '10 min', steps: ['Pensar en una situación que podría cambiar', 'Imaginar cómo te sentirías', 'Pensar en 2 opciones alternativas', 'Elegir la que te parezca mejor', 'Recordar que los cambios son normales'], status: 'en progreso', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 40, assignedTo: 'u1', points: 60 },
  { id: 'a13', title: 'Organizar materiales de estudio', category: 'escuela', objective: 'Tener todo listo para estudiar', description: 'Clasificar y organizar carpetas, cuadernos y materiales de cada materia.', difficulty: 'medio', duration: '20 min', steps: ['Juntar todos los materiales', 'Separar por materia', 'Verificar que no falte nada', 'Etiquetar carpetas', 'Guardar en orden'], status: 'pendiente', recommendedBy: 'tutor', recommendedByName: 'Laura Gómez', progress: 0, assignedTo: 'u1', points: 50 },
  { id: 'a14', title: 'Guardar objetos personales en su lugar', category: 'rutinas del hogar', objective: 'Mantener orden en los espacios personales', description: 'Cada objeto tiene un lugar asignado. Practicar dejarlo siempre ahí.', difficulty: 'fácil', duration: '5 min', steps: ['Revisar qué está fuera de lugar', 'Tomar un objeto', 'Llevarlo a su lugar', 'Repetir con los demás', 'Verificar que todo esté en orden'], status: 'completada', recommendedBy: 'app', progress: 100, assignedTo: 'u1', points: 30 },
  { id: 'a15', title: 'Repasar pasos para ir a terapia', category: 'preparación para salidas', objective: 'Anticipar la salida a terapia', description: 'Revisar qué necesitás llevar y cómo llegar a tu sesión de terapia.', difficulty: 'fácil', duration: '5 min', steps: ['Verificar horario de la sesión', 'Preparar lo que querés contar', 'Revisar cómo llegar', 'Preparar medio de transporte', 'Salir con tiempo'], status: 'completada', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 100, assignedTo: 'u1', points: 40 },
  { id: 'a16', title: 'Preparar bolso para actividad deportiva', category: 'preparación para salidas', objective: 'Autonomía en la preparación de actividades', description: 'Armar el bolso con todo lo necesario para tu actividad deportiva.', difficulty: 'fácil', duration: '10 min', steps: ['Buscar ropa deportiva limpia', 'Agregar toalla', 'Agregar botella de agua', 'Verificar calzado deportivo', 'Cerrar el bolso y dejarlo listo'], status: 'pendiente', recommendedBy: 'tutor', recommendedByName: 'Laura Gómez', progress: 0, assignedTo: 'u1', points: 40 },
  { id: 'a17', title: 'Practicar saludar y presentarse', category: 'comunicación', objective: 'Mejorar habilidades sociales básicas', description: 'Ensayar cómo saludar, decir tu nombre y hacer una pregunta simple a alguien.', difficulty: 'medio', duration: '10 min', steps: ['Practicar decir "Hola, me llamo..."', 'Practicar dar la mano o saludar', 'Hacer una pregunta simple como "¿Cómo estás?"', 'Practicar responder preguntas', 'Ensayar frente al espejo'], status: 'en progreso', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 50, assignedTo: 'u1', points: 50 },
  { id: 'a18', title: 'Calcular vuelto en una compra', category: 'manejo del dinero', objective: 'Entender el valor del dinero', description: 'Practicar cuánto vuelto te tienen que dar cuando pagás algo.', difficulty: 'medio', duration: '15 min', steps: ['Elegir un producto con precio', 'Ver con cuánto pagás', 'Calcular la resta', 'Verificar el resultado', 'Practicar con otros montos'], status: 'pendiente', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 0, assignedTo: 'u1', points: 60 },
  { id: 'a19', title: 'Planificar un viaje corto en transporte público', category: 'transporte', objective: 'Ganar autonomía en traslados', description: 'Buscar cómo llegar a un lugar cercano usando colectivo o subte.', difficulty: 'avanzado', duration: '15 min', steps: ['Elegir el destino', 'Buscar la línea de colectivo/subte', 'Ver los horarios', 'Calcular el tiempo de viaje', 'Preparar la SUBE o medio de pago', 'Revisar la ruta en el mapa'], status: 'pendiente', recommendedBy: 'app', progress: 0, assignedTo: 'u1', points: 80 },
  { id: 'a20', title: 'Invitar a alguien a hacer algo juntos', category: 'vida social', objective: 'Fomentar relaciones sociales', description: 'Practicar cómo invitar a un compañero o amigo a una actividad.', difficulty: 'avanzado', duration: '10 min', steps: ['Pensar a quién invitar', 'Pensar qué actividad proponer', 'Ensayar cómo decirlo', 'Enviar el mensaje o decirlo en persona', 'Aceptar la respuesta sea cual sea'], status: 'pendiente', recommendedBy: 'profesional', recommendedByName: 'Lic. Martina Pérez', progress: 0, assignedTo: 'u1', points: 70 },
  // More general activities
  { id: 'a21', title: 'Ducharse siguiendo pasos', category: 'higiene', objective: 'Independencia en higiene personal', description: 'Seguir una secuencia visual para ducharse correctamente.', difficulty: 'fácil', duration: '15 min', steps: ['Preparar ropa limpia', 'Regular la temperatura', 'Mojarse', 'Usar jabón/shampoo', 'Enjuagar', 'Secarse', 'Vestirse'], status: 'pendiente', recommendedBy: 'app', progress: 0, points: 40 },
  { id: 'a22', title: 'Hacer la cama al levantarse', category: 'rutinas del hogar', objective: 'Crear hábitos matutinos', description: 'Tender la cama cada mañana como parte de la rutina.', difficulty: 'fácil', duration: '5 min', steps: ['Estirar la sábana', 'Acomodar la almohada', 'Poner la frazada', 'Alisar arrugas'], status: 'pendiente', recommendedBy: 'app', progress: 0, points: 20 },
  { id: 'a23', title: 'Pedir ayuda cuando la necesito', category: 'comunicación', objective: 'Saber cuándo y cómo pedir ayuda', description: 'Identificar situaciones donde necesitás ayuda y practicar cómo pedirla.', difficulty: 'medio', duration: '10 min', steps: ['Identificar la dificultad', 'Pensar a quién pedir ayuda', 'Usar frases como "¿Me podés ayudar con...?"', 'Agradecer la ayuda'], status: 'pendiente', recommendedBy: 'app', progress: 0, points: 40 },
  { id: 'a24', title: 'Usar el microondas de forma segura', category: 'cocina básica', objective: 'Autonomía en la cocina', description: 'Aprender a calentar comida en el microondas siguiendo pasos seguros.', difficulty: 'fácil', duration: '5 min', steps: ['Elegir recipiente apto', 'Poner la comida', 'Programar el tiempo', 'Esperar sin abrir', 'Sacar con cuidado'], status: 'pendiente', recommendedBy: 'app', progress: 0, points: 30 },
  { id: 'a25', title: 'Reconocer señales de peligro', category: 'seguridad personal', objective: 'Mantenerse seguro en situaciones cotidianas', description: 'Aprender a identificar situaciones que podrían ser peligrosas.', difficulty: 'medio', duration: '15 min', steps: ['Ver imágenes de situaciones', 'Identificar cuáles son peligrosas', 'Pensar qué hacer en cada caso', 'Practicar pedir ayuda', 'Recordar números de emergencia'], status: 'pendiente', recommendedBy: 'app', progress: 0, points: 50 },
];

// ==================== ROUTINES ====================
export interface RoutineItem {
  id: string;
  time: string;
  title: string;
  icon: string;
  completed: boolean;
  category: string;
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
  { id: 'ce7', title: 'Entrega de trabajo práctico', date: fmt(addDays(today, 2)), time: '09:00', type: 'escuela', description: 'TP de Lengua sobre comprensión lectora', userId: 'u1', color: 'hsl(210 70% 55%)' },
  { id: 'ce8', title: 'Cumpleaños de Sofía', date: fmt(addDays(today, 5)), time: '16:00', type: 'social', description: 'Fiesta de cumpleaños en su casa', userId: 'u1', color: 'hsl(150 60% 45%)' },
  { id: 'ce9', title: 'Visita a la abuela', date: fmt(addDays(today, 4)), time: '11:00', type: 'personal', description: 'Almuerzo familiar en lo de la abuela Patricia', userId: 'u1', color: 'hsl(30 80% 60%)' },
  { id: 'ce10', title: 'Taller de habilidades sociales', date: fmt(addDays(today, 6)), time: '14:00', type: 'terapia', description: 'Grupo de habilidades sociales con Lic. Nicolás', userId: 'u1', color: 'hsl(270 40% 75%)' },
  { id: 'ce11', title: 'Práctica de natación', date: fmt(addDays(today, 2)), time: '17:00', type: 'personal', description: 'Clase de natación en el club', userId: 'u1', color: 'hsl(30 80% 60%)' },
  { id: 'ce12', title: 'Reunión escolar', date: fmt(addDays(today, 8)), time: '08:30', type: 'escuela', description: 'Reunión de padres (acompaña mamá)', userId: 'u1', color: 'hsl(210 70% 55%)' },
  { id: 'ce13', title: 'Sesión con Lic. Martina', date: fmt(addDays(today, 14)), time: '16:30', type: 'terapia', description: 'Sesión semanal', userId: 'u1', color: 'hsl(270 40% 75%)' },
  { id: 'ce14', title: 'Salida al cine', date: fmt(addDays(today, 9)), time: '18:00', type: 'social', description: 'Ir al cine con mamá a ver la nueva película', userId: 'u1', color: 'hsl(150 60% 45%)' },
  { id: 'ce15', title: 'Actividad: Cocina básica', date: fmt(addDays(today, 3)), time: '15:00', type: 'actividad', description: 'Preparar merienda con supervisión', userId: 'u1', color: 'hsl(40 90% 55%)' },
  { id: 'ce16', title: 'Examen de Historia', date: fmt(addDays(today, 10)), time: '10:00', type: 'escuela', description: 'Examen sobre Revolución de Mayo', userId: 'u1', color: 'hsl(210 70% 55%)' },
  { id: 'ce17', title: 'Paseo por el parque', date: fmt(addDays(today, 6)), time: '10:00', type: 'personal', description: 'Caminata con papá por el parque', userId: 'u1', color: 'hsl(30 80% 60%)' },
  { id: 'ce18', title: 'Sesión con Lic. Martina', date: fmt(addDays(today, 21)), time: '16:30', type: 'terapia', description: 'Sesión semanal', userId: 'u1', color: 'hsl(270 40% 75%)' },
  { id: 'ce19', title: 'Turno odontología', date: fmt(addDays(today, 12)), time: '09:30', type: 'médico', description: 'Control dental semestral', userId: 'u1', color: 'hsl(0 72% 55%)' },
  { id: 'ce20', title: 'Jornada deportiva escolar', date: fmt(addDays(today, 15)), time: '08:00', type: 'escuela', description: 'Competencia de atletismo en la escuela', userId: 'u1', color: 'hsl(210 70% 55%)' },
];

// ==================== CHAT MESSAGES ====================
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: string[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatar: string;
}

export const conversations: Conversation[] = [
  { id: 'conv1', participants: ['u1', 't1'], participantNames: ['Juan García', 'Laura Gómez'], lastMessage: '¡Muy bien, Juan! Estoy orgullosa de vos 💪', lastMessageTime: '14:30', unreadCount: 1, avatar: '👩' },
  { id: 'conv2', participants: ['u1', 'p1'], participantNames: ['Juan García', 'Lic. Martina Pérez'], lastMessage: 'Nos vemos hoy a las 16:30, ¿tenés algo para contarme?', lastMessageTime: '10:15', unreadCount: 1, avatar: '👩‍⚕️' },
  { id: 'conv3', participants: ['u2', 't2'], participantNames: ['Sofía Martínez', 'Carlos Martínez'], lastMessage: 'Sofía, ¿preparaste la mochila?', lastMessageTime: '20:00', unreadCount: 0, avatar: '👨' },
  { id: 'conv4', participants: ['u3', 'p3'], participantNames: ['Mateo Rodríguez', 'Lic. Carolina Vega'], lastMessage: 'Excelente progreso esta semana, Mateo', lastMessageTime: '11:00', unreadCount: 0, avatar: '👩‍💼' },
];

export const chatMessages: ChatMessage[] = [
  // Conv1: Juan - Laura (madre)
  { id: 'm1', conversationId: 'conv1', senderId: 't1', senderName: 'Laura Gómez', text: 'Buenos días, Juan! ¿Dormiste bien? 😊', timestamp: '07:30', read: true },
  { id: 'm2', conversationId: 'conv1', senderId: 'u1', senderName: 'Juan', text: 'Sí ma, dormí bien', timestamp: '07:35', read: true },
  { id: 'm3', conversationId: 'conv1', senderId: 't1', senderName: 'Laura Gómez', text: 'Acordate que hoy tenés terapia a las 16:30 con Martina', timestamp: '08:00', read: true },
  { id: 'm4', conversationId: 'conv1', senderId: 'u1', senderName: 'Juan', text: 'Sí ya lo vi en el calendario', timestamp: '08:05', read: true },
  { id: 'm5', conversationId: 'conv1', senderId: 't1', senderName: 'Laura Gómez', text: '¡Genial! Me encanta que lo revises solo 🌟', timestamp: '08:06', read: true },
  { id: 'm6', conversationId: 'conv1', senderId: 'u1', senderName: 'Juan', text: 'Ma, ya preparé la mochila anoche', timestamp: '08:10', read: true },
  { id: 'm7', conversationId: 'conv1', senderId: 't1', senderName: 'Laura Gómez', text: '¡Excelente! Eso es un gran logro. ¿Necesitás algo más?', timestamp: '08:12', read: true },
  { id: 'm8', conversationId: 'conv1', senderId: 'u1', senderName: 'Juan', text: 'No, estoy bien. Ya desayuné', timestamp: '08:15', read: true },
  { id: 'm9', conversationId: 'conv1', senderId: 't1', senderName: 'Laura Gómez', text: 'Perfecto. Avisame cuando llegues a la escuela 💙', timestamp: '08:20', read: true },
  { id: 'm10', conversationId: 'conv1', senderId: 'u1', senderName: 'Juan', text: 'Ya llegué, todo bien', timestamp: '08:50', read: true },
  { id: 'm11', conversationId: 'conv1', senderId: 't1', senderName: 'Laura Gómez', text: '👍 Que tengas buen día, hijo', timestamp: '08:52', read: true },
  { id: 'm12', conversationId: 'conv1', senderId: 'u1', senderName: 'Juan', text: 'Ma, completé la actividad de la merienda hoy', timestamp: '14:25', read: true },
  { id: 'm13', conversationId: 'conv1', senderId: 't1', senderName: 'Laura Gómez', text: '¡Muy bien, Juan! Estoy orgullosa de vos 💪', timestamp: '14:30', read: false },
  // Conv2: Juan - Lic. Martina
  { id: 'm14', conversationId: 'conv2', senderId: 'p1', senderName: 'Lic. Martina Pérez', text: 'Hola Juan, ¿cómo venís esta semana?', timestamp: '09:00', read: true },
  { id: 'm15', conversationId: 'conv2', senderId: 'u1', senderName: 'Juan', text: 'Bien, estuve haciendo las actividades', timestamp: '09:15', read: true },
  { id: 'm16', conversationId: 'conv2', senderId: 'p1', senderName: 'Lic. Martina Pérez', text: '¡Me alegra! Vi que completaste la de respiración. ¿Te sirvió?', timestamp: '09:20', read: true },
  { id: 'm17', conversationId: 'conv2', senderId: 'u1', senderName: 'Juan', text: 'Sí, la usé cuando me puse nervioso por el cambio de horario', timestamp: '09:25', read: true },
  { id: 'm18', conversationId: 'conv2', senderId: 'p1', senderName: 'Lic. Martina Pérez', text: 'Eso es excelente, Juan. Usaste una herramienta aprendida en una situación real. Es un avance enorme 🎉', timestamp: '09:30', read: true },
  { id: 'm19', conversationId: 'conv2', senderId: 'u1', senderName: 'Juan', text: 'Gracias Martina', timestamp: '09:35', read: true },
  { id: 'm20', conversationId: 'conv2', senderId: 'p1', senderName: 'Lic. Martina Pérez', text: 'Nos vemos hoy a las 16:30, ¿tenés algo para contarme?', timestamp: '10:15', read: false },
  { id: 'm21', conversationId: 'conv2', senderId: 'u1', senderName: 'Juan', text: 'Sí, quiero contarte sobre el partido de fútbol de mañana', timestamp: '10:20', read: true },
  { id: 'm22', conversationId: 'conv2', senderId: 'p1', senderName: 'Lic. Martina Pérez', text: '¡Dale! Lo charlamos en sesión. ¿Te genera ansiedad o estás contento?', timestamp: '10:25', read: true },
  { id: 'm23', conversationId: 'conv2', senderId: 'u1', senderName: 'Juan', text: 'Un poco de las dos cosas jaja', timestamp: '10:30', read: true },
  { id: 'm24', conversationId: 'conv2', senderId: 'p1', senderName: 'Lic. Martina Pérez', text: 'Es normal y está bien sentir las dos cosas. Lo trabajamos hoy 😊', timestamp: '10:32', read: true },
];

// ==================== NOTIFICATIONS ====================
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'achievement' | 'reminder' | 'alert' | 'social';
  read: boolean;
  timestamp: string;
  icon: string;
}

export const notifications: Notification[] = [
  { id: 'n1', userId: 'u1', title: 'Sesión hoy', message: 'Tenés terapia con Lic. Martina a las 16:30', type: 'reminder', read: false, timestamp: '08:00', icon: '🧠' },
  { id: 'n2', userId: 'u1', title: '¡Racha de 12 días!', message: 'Llevás 12 días seguidos completando actividades', type: 'achievement', read: false, timestamp: '07:30', icon: '🔥' },
  { id: 'n3', userId: 'u1', title: 'Nueva actividad recomendada', message: 'Lic. Martina te recomendó "Hacer una lista corta de compras"', type: 'info', read: true, timestamp: 'Ayer', icon: '📋' },
  { id: 'n4', userId: 'u1', title: 'Mensaje de mamá', message: 'Laura te envió un mensaje nuevo', type: 'social', read: false, timestamp: '14:30', icon: '💬' },
  { id: 'n5', userId: 'u1', title: 'Parcial mañana', message: 'Tenés examen de Matemáticas mañana a las 9:00', type: 'alert', read: true, timestamp: 'Ayer', icon: '📝' },
  { id: 'n6', userId: 'u1', title: '¡Subiste de nivel!', message: 'Llegaste al nivel 8. ¡Seguí así!', type: 'achievement', read: true, timestamp: 'Hace 2 días', icon: '⬆️' },
  { id: 'n7', userId: 'u1', title: 'Actividad completada', message: 'Completaste "Preparar la mochila para mañana"', type: 'info', read: true, timestamp: 'Ayer', icon: '✅' },
  { id: 'n8', userId: 'u1', title: 'Cumpleaños cercano', message: 'El cumpleaños de Sofía es en 5 días', type: 'social', read: true, timestamp: 'Hace 1 día', icon: '🎂' },
  { id: 'n9', userId: 'u1', title: 'Recordatorio de rutina', message: 'No olvides registrar tus emociones antes de dormir', type: 'reminder', read: true, timestamp: 'Ayer', icon: '💭' },
  { id: 'n10', userId: 'u1', title: 'Nuevo logro desbloqueado', message: '¡Obtuviste la insignia "Explorador"!', type: 'achievement', read: true, timestamp: 'Hace 3 días', icon: '🏆' },
  { id: 'n11', userId: 'u1', title: 'Turno médico', message: 'Control médico en 3 días a las 10:00', type: 'reminder', read: false, timestamp: '09:00', icon: '🏥' },
  { id: 'n12', userId: 'u1', title: 'Felicitaciones', message: 'Tu mamá destacó tu progreso en organización', type: 'social', read: true, timestamp: 'Hace 2 días', icon: '⭐' },
  { id: 'n13', userId: 'u1', title: 'Actividad sugerida', message: 'La app te recomienda "Planificar viaje en transporte público"', type: 'info', read: true, timestamp: 'Hace 4 días', icon: '🚌' },
  { id: 'n14', userId: 'u1', title: 'Racha en riesgo', message: 'Completá al menos una actividad hoy para mantener tu racha', type: 'alert', read: false, timestamp: '15:00', icon: '⚠️' },
  { id: 'n15', userId: 'u1', title: 'Grupo de habilidades', message: 'Taller de habilidades sociales el sábado a las 14:00', type: 'reminder', read: true, timestamp: 'Hace 1 día', icon: '👥' },
  { id: 'n16', userId: 'u1', title: '¡50 puntos ganados!', message: 'Ganaste 50 puntos por completar la actividad de mochila', type: 'achievement', read: true, timestamp: 'Ayer', icon: '💰' },
  { id: 'n17', userId: 'u1', title: 'Cambio de horario', message: 'La clase de música de mañana cambió a las 15:30', type: 'alert', read: false, timestamp: '12:00', icon: '🔄' },
  { id: 'n18', userId: 'u1', title: 'Progreso semanal', message: 'Completaste el 75% de tus actividades esta semana', type: 'info', read: true, timestamp: 'Hace 1 día', icon: '📊' },
  { id: 'n19', userId: 'u1', title: 'Mensaje de Martina', message: 'Tu terapeuta te envió un mensaje', type: 'social', read: false, timestamp: '10:15', icon: '💬' },
  { id: 'n20', userId: 'u1', title: 'Fútbol mañana', message: 'Partido con amigos mañana a las 17:00 en la plaza', type: 'reminder', read: true, timestamp: '11:00', icon: '⚽' },
];

// ==================== EMOTIONAL RECORDS ====================
export interface EmotionalRecord {
  id: string;
  userId: string;
  emotion: string;
  emoji: string;
  intensity: number; // 1-5
  context: string;
  whatHelped: string;
  timestamp: string;
  date: string;
}

export const emotionalRecords: EmotionalRecord[] = [
  { id: 'em1', userId: 'u1', emotion: 'Contento', emoji: '😊', intensity: 4, context: 'Completé mi rutina de la mañana sin ayuda', whatHelped: 'Seguir los pasos de la app', timestamp: '08:30', date: fmt(today) },
  { id: 'em2', userId: 'u1', emotion: 'Ansioso', emoji: '😰', intensity: 3, context: 'Pensé en el parcial de mañana', whatHelped: 'Respiración 4-4-6', timestamp: '14:00', date: fmt(today) },
  { id: 'em3', userId: 'u1', emotion: 'Orgulloso', emoji: '😤', intensity: 5, context: 'Preparé la mochila solo', whatHelped: 'Me sentí capaz', timestamp: '20:00', date: fmt(addDays(today, -1)) },
  { id: 'em4', userId: 'u1', emotion: 'Tranquilo', emoji: '😌', intensity: 4, context: 'Escuché música después de la terapia', whatHelped: 'La música me relajó', timestamp: '18:00', date: fmt(addDays(today, -1)) },
  { id: 'em5', userId: 'u1', emotion: 'Frustrado', emoji: '😤', intensity: 3, context: 'No entendí un ejercicio de matemáticas', whatHelped: 'Pedí ayuda a mamá', timestamp: '15:30', date: fmt(addDays(today, -2)) },
  { id: 'em6', userId: 'u1', emotion: 'Feliz', emoji: '😄', intensity: 5, context: 'Jugué fútbol con mis compañeros', whatHelped: 'Estar con amigos', timestamp: '17:30', date: fmt(addDays(today, -2)) },
  { id: 'em7', userId: 'u1', emotion: 'Nervioso', emoji: '😬', intensity: 2, context: 'Cambio de horario en la escuela', whatHelped: 'Revisar el nuevo horario en la app', timestamp: '09:00', date: fmt(addDays(today, -3)) },
  { id: 'em8', userId: 'u1', emotion: 'Contento', emoji: '😊', intensity: 4, context: 'Recibí una insignia nueva', whatHelped: 'Ver mi progreso', timestamp: '19:00', date: fmt(addDays(today, -3)) },
  { id: 'em9', userId: 'u1', emotion: 'Cansado', emoji: '😴', intensity: 3, context: 'Fue un día largo en la escuela', whatHelped: 'Descansar un rato', timestamp: '16:00', date: fmt(addDays(today, -4)) },
  { id: 'em10', userId: 'u1', emotion: 'Motivado', emoji: '💪', intensity: 4, context: 'Vi que llevo 10 días de racha', whatHelped: 'El sistema de puntos me motiva', timestamp: '08:00', date: fmt(addDays(today, -4)) },
  { id: 'em11', userId: 'u1', emotion: 'Triste', emoji: '😢', intensity: 2, context: 'Extrañé a mi abuelo', whatHelped: 'Hablar con mamá', timestamp: '21:00', date: fmt(addDays(today, -5)) },
  { id: 'em12', userId: 'u1', emotion: 'Enojado', emoji: '😡', intensity: 3, context: 'Mi hermano usó mis cosas sin permiso', whatHelped: 'Contar hasta 10 y hablar con calma', timestamp: '14:00', date: fmt(addDays(today, -5)) },
  { id: 'em13', userId: 'u1', emotion: 'Sorprendido', emoji: '😲', intensity: 3, context: 'Me felicitaron en la escuela por un trabajo', whatHelped: 'Me hizo sentir bien', timestamp: '11:00', date: fmt(addDays(today, -6)) },
  { id: 'em14', userId: 'u1', emotion: 'Tranquilo', emoji: '😌', intensity: 5, context: 'Día sin cambios de rutina', whatHelped: 'La previsibilidad me calma', timestamp: '20:00', date: fmt(addDays(today, -6)) },
  { id: 'em15', userId: 'u1', emotion: 'Contento', emoji: '😊', intensity: 4, context: 'Hice una receta nueva de merienda', whatHelped: 'Seguir los pasos me hizo sentir capaz', timestamp: '16:30', date: fmt(addDays(today, -7)) },
  { id: 'em16', userId: 'u1', emotion: 'Ansioso', emoji: '😰', intensity: 4, context: 'Tenía que ir a un lugar nuevo', whatHelped: 'Revisar la ruta antes y llevar auriculares', timestamp: '09:30', date: fmt(addDays(today, -7)) },
  { id: 'em17', userId: 'u1', emotion: 'Orgulloso', emoji: '🥹', intensity: 5, context: 'Completé toda la rutina del día', whatHelped: 'Ver el progreso al 100%', timestamp: '21:00', date: fmt(addDays(today, -8)) },
  { id: 'em18', userId: 'u1', emotion: 'Aburrido', emoji: '😐', intensity: 2, context: 'Tarde sin actividades planeadas', whatHelped: 'Busqué actividades recomendadas en la app', timestamp: '15:00', date: fmt(addDays(today, -9)) },
  { id: 'em19', userId: 'u1', emotion: 'Feliz', emoji: '😄', intensity: 5, context: 'Salimos a comer con mamá', whatHelped: 'Pasar tiempo juntos', timestamp: '13:00', date: fmt(addDays(today, -10)) },
  { id: 'em20', userId: 'u1', emotion: 'Preocupado', emoji: '😟', intensity: 3, context: 'No sabía qué hacer con un cambio de plan', whatHelped: 'Usar la estrategia de "Plan B" que practicamos', timestamp: '10:00', date: fmt(addDays(today, -11)) },
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
  { id: 'ach1', title: 'Primer paso', description: 'Completaste tu primera actividad', icon: '🎯', category: 'general', unlocked: true, unlockedDate: 'Hace 30 días', points: 50, requirement: 'Completar 1 actividad' },
  { id: 'ach2', title: 'Explorador', description: 'Probaste actividades de 5 categorías diferentes', icon: '🧭', category: 'exploración', unlocked: true, unlockedDate: 'Hace 15 días', points: 100, requirement: 'Actividades en 5 categorías' },
  { id: 'ach3', title: 'Constante', description: 'Mantuviste una racha de 7 días', icon: '🔥', category: 'constancia', unlocked: true, unlockedDate: 'Hace 10 días', points: 150, requirement: 'Racha de 7 días' },
  { id: 'ach4', title: 'Organizador', description: 'Preparaste tu mochila 5 veces', icon: '🎒', category: 'organización', unlocked: true, unlockedDate: 'Hace 8 días', points: 80, requirement: 'Mochila preparada 5 veces' },
  { id: 'ach5', title: 'Chef principiante', description: 'Completaste 3 actividades de cocina', icon: '👨‍🍳', category: 'cocina', unlocked: true, unlockedDate: 'Hace 5 días', points: 100, requirement: '3 actividades de cocina' },
  { id: 'ach6', title: 'Comunicador', description: 'Avisaste 10 veces que llegaste bien', icon: '📱', category: 'seguridad', unlocked: true, unlockedDate: 'Hace 3 días', points: 120, requirement: '10 avisos de llegada' },
  { id: 'ach7', title: 'Zen master', description: 'Practicaste respiración 10 veces', icon: '🧘', category: 'regulación', unlocked: true, unlockedDate: 'Hace 2 días', points: 100, requirement: '10 ejercicios de respiración' },
  { id: 'ach8', title: 'Maratonista', description: 'Mantuviste una racha de 14 días', icon: '🏃', category: 'constancia', unlocked: false, points: 200, requirement: 'Racha de 14 días' },
  { id: 'ach9', title: 'Independiente', description: 'Completaste 20 actividades de autonomía', icon: '🦸', category: 'autonomía', unlocked: false, points: 250, requirement: '20 actividades de autonomía' },
  { id: 'ach10', title: 'Maestro emocional', description: 'Registraste emociones 30 días seguidos', icon: '💎', category: 'emociones', unlocked: false, points: 300, requirement: '30 días de registro emocional' },
  { id: 'ach11', title: 'Viajero', description: 'Completaste una actividad de transporte', icon: '🚌', category: 'transporte', unlocked: false, points: 150, requirement: '1 actividad de transporte' },
  { id: 'ach12', title: 'Social', description: 'Invitaste a alguien a hacer algo juntos', icon: '🤝', category: 'social', unlocked: false, points: 120, requirement: 'Completar actividad social' },
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
      'Recursos visuales premium',
      'Soporte prioritario',
    ],
    highlighted: true,
  },
];

// ==================== HELPER FUNCTIONS ====================
export function findUser(username: string, password: string): (User | Tutor | Professional) | null {
  const u = users.find(u => u.username === username && u.password === password);
  if (u) return u;
  const t = tutors.find(t => t.username === username && t.password === password);
  if (t) return t;
  const p = professionals.find(p => p.username === username && p.password === password);
  if (p) return p;
  return null;
}

export function getUserById(id: string): User | undefined {
  return users.find(u => u.id === id);
}

export function getTutorById(id: string): Tutor | undefined {
  return tutors.find(t => t.id === id);
}

export function getProfessionalById(id: string): Professional | undefined {
  return professionals.find(p => p.id === id);
}

export function getActivitiesForUser(userId: string): Activity[] {
  return activities.filter(a => a.assignedTo === userId);
}

export function getEventsForUser(userId: string): CalendarEvent[] {
  return calendarEvents.filter(e => e.userId === userId);
}

export function getConversationsForUser(userId: string): Conversation[] {
  return conversations.filter(c => c.participants.includes(userId));
}

export function getMessagesForConversation(convId: string): ChatMessage[] {
  return chatMessages.filter(m => m.conversationId === convId);
}

export function getNotificationsForUser(userId: string): Notification[] {
  return notifications.filter(n => n.userId === userId);
}

export function getEmotionsForUser(userId: string): EmotionalRecord[] {
  return emotionalRecords.filter(e => e.userId === userId);
}

export function getObjectivesForUser(userId: string): Objective[] {
  return objectives.filter(o => o.userId === userId);
}

export function getLocationsForUser(userId: string): Location[] {
  return locations.filter(l => l.userId === userId);
}

export function getRecommendationsForUser(userId: string): Recommendation[] {
  return recommendations.filter(r => r.userId === userId);
}
