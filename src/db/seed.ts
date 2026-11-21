import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, client } from './index';
import {
  roles,
  usuarios,
  inscripciones,
  interaccionesChatIa,
  predicas,
} from './schema';
import type { SessionUser } from '@/lib/auth/session';
import { crearCongregacion } from '@/services/congregaciones';
import { crearUsuarioAdmin } from '@/services/usuarios';
import {
  crearCurso,
  crearModulo,
  crearLeccion,
  editarCurso,
} from '@/services/cursos';
import {
  inscribirEnCurso,
  actualizarProgresoLeccion,
} from '@/services/inscripciones';
import { crearPredica } from '@/services/predicas';
import { crearConsultaForo, crearRespuestaForo } from '@/services/foros';
import { crearEntradaSoporte } from '@/services/soporte';
import { crearInformacionInstitucional } from '@/services/institucional';

async function main() {
  console.log('Iniciando db:seed de la Plataforma Web de Formación Teológica Autodidacta...');

  // Idempotencia básica: si ya existen usuarios, no duplicar
  const existingUsers = await db.select({ id: usuarios.idUsuario }).from(usuarios).limit(1);
  if (existingUsers.length > 0) {
    console.log('La base de datos ya contiene datos de prueba. Seed omitido.');
    client.close();
    return;
  }

  // 1. Roles iniciales (3 roles obligatorios)
  const rolesData = [
    { nombre: 'admin', descripcion: 'Administrador general de la plataforma' },
    { nombre: 'profesor', descripcion: 'Profesor o Pastor encargado de cursos y prédicas' },
    { nombre: 'alumno', descripcion: 'Estudiante miembro de congregación o externo' },
  ];
  await db.insert(roles).values(rolesData);

  const rolRows = await db.select().from(roles);
  const rolMap = new Map(rolRows.map((r) => [r.nombre, r.idRol]));

  // 2. Administrador inicial (para invocar servicios)
  const adminHash = await bcrypt.hash('Admin1234!', 10);
  const now = new Date().toISOString();
  const [adminRow] = await db
    .insert(usuarios)
    .values({
      nombre: 'Daniela',
      apellido: 'Quiroga',
      correoElectronico: 'admin@iglesiadecristo.org',
      contraseniaHash: adminHash,
      idRol: rolMap.get('admin')!,
      idCongregacion: null,
      fechaRegistro: now,
      activo: true,
    })
    .returning();

  const adminSession: SessionUser = {
    id: adminRow.idUsuario,
    nombre: adminRow.nombre,
    apellido: adminRow.apellido,
    correoElectronico: adminRow.correoElectronico,
    rol: 'admin',
    idRol: adminRow.idRol,
    idCongregacion: null,
    nombreCongregacion: null,
    fechaRegistro: adminRow.fechaRegistro,
    activo: true,
  };

  // 3. Congregaciones / Sedes (3 sedes)
  const sedeCentral = await crearCongregacion(adminSession, {
    nombreSede: 'Sede Central San Miguel de Tucumán',
    direccion: 'Av. Sarmiento 742',
    ciudad: 'San Miguel de Tucumán',
    telefonoContacto: '(0381) 422-8910',
  });
  const sedeYerba = await crearCongregacion(adminSession, {
    nombreSede: 'Congregación Yerba Buena',
    direccion: 'Av. Aconquija 1890',
    ciudad: 'Yerba Buena',
    telefonoContacto: '(0381) 425-3304',
  });
  const sedeTafi = await crearCongregacion(adminSession, {
    nombreSede: 'Congregación Tafí Viejo',
    direccion: 'Calle Uttinger 315',
    ciudad: 'Tafí Viejo',
    telefonoContacto: '(0381) 461-1022',
  });

  // Vincular admin a Sede Central
  await db
    .update(usuarios)
    .set({ idCongregacion: sedeCentral.id })
    .where(eq(usuarios.idUsuario, adminRow.idUsuario));

  // 4. Profesores (2) y Alumnos (6: 4 miembros + 2 externos)
  const profMarcos = await crearUsuarioAdmin(adminSession, {
    nombre: 'Marcos',
    apellido: 'Herrera',
    correoElectronico: 'profesor@iglesiadecristo.org',
    contrasenia: 'Profesor1234!',
    rol: 'profesor',
    idCongregacion: sedeCentral.id,
  });

  const profLaura = await crearUsuarioAdmin(adminSession, {
    nombre: 'Laura',
    apellido: 'Benítez',
    correoElectronico: 'laura.benitez@iglesiadecristo.org',
    contrasenia: 'Profesor1234!',
    rol: 'profesor',
    idCongregacion: sedeYerba.id,
  });

  const alumnosSeed = [
    { nombre: 'Lucía', apellido: 'Fernández', email: 'alumno@iglesiadecristo.org', cong: sedeCentral.id },
    { nombre: 'Tomás', apellido: 'Villalba', email: 'tomas.villalba@gmail.com', cong: null },
    { nombre: 'Sofía', apellido: 'Méndez', email: 'sofia.mendez@iglesiadecristo.org', cong: sedeTafi.id },
    { nombre: 'Mateo', apellido: 'Gómez', email: 'mateo.gomez@iglesiadecristo.org', cong: sedeCentral.id },
    { nombre: 'Valentina', apellido: 'Sosa', email: 'valentina.sosa@iglesiadecristo.org', cong: sedeYerba.id },
    { nombre: 'Martín', apellido: 'Ríos', email: 'martin.rios@correo.com', cong: null },
  ];

  const alumnosCreated = [];
  for (const al of alumnosSeed) {
    const created = await crearUsuarioAdmin(adminSession, {
      nombre: al.nombre,
      apellido: al.apellido,
      correoElectronico: al.email,
      contrasenia: 'Alumno1234!',
      rol: 'alumno',
      idCongregacion: al.cong,
    });
    alumnosCreated.push(created);
  }

  const makeSession = (
    u: { id: number; nombre: string; apellido: string; correoElectronico: string },
    rol: 'profesor' | 'alumno'
  ): SessionUser => ({
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    correoElectronico: u.correoElectronico,
    rol,
    idRol: rolMap.get(rol)!,
    idCongregacion: null,
    nombreCongregacion: null,
    fechaRegistro: now,
    activo: true,
  });

  const profMarcosSession = makeSession(profMarcos, 'profesor');
  const profLauraSession = makeSession(profLaura, 'profesor');
  const alumnoSessions = alumnosCreated.map((a) => makeSession(a, 'alumno'));

  // 5. Cursos: 2 publicados (3 módulos x 3 lecciones cada uno = 9 lecciones) + 1 borrador
  const curso1 = await crearCurso(profMarcosSession, {
    titulo: 'Fundamentos de Teología Sistemática',
    descripcion:
      'Recorrido ordenado por las doctrinas centrales de la fe cristiana: Revelación, Trinidad, Gracia, Soteriología y Eclesiología, pensado para estudio autodidacta con guías prácticas.',
  });

  const c1Modulos = [
    {
      titulo: 'Módulo 1 · La Revelación y las Escrituras',
      lecciones: [
        {
          titulo: '1.1 Revelación general y revelación especial',
          video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          pdf: '/guias/teologia-m1-l1.pdf',
          texto:
            'La teología sistemática comienza reconociendo que Dios ha tomado la iniciativa de darse a conocer. Llamamos revelación general al testimonio continuo del Creador en el orden de la creación (Salmo 19:1-4; Romanos 1:20) y en la conciencia moral humana. Sin embargo, para conocer el plan redentor en Cristo es indispensable la revelación especial preservada en las Sagradas Escrituras.',
        },
        {
          titulo: '1.2 Inspiración, autoridad y suficiencia bíblica',
          video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          pdf: '/guias/teologia-m1-l2.pdf',
          texto:
            'Cuando afirmamos la inspiración plenaria de las Escrituras (2 Timoteo 3:16-17), sostenemos que el Espíritu Santo guió a los autores humanos respetando su estilo, contexto e idioma, de modo que el texto resultante posee autoridad normativa para la fe y la práctica cristiana. La suficiencia bíblica implica que todo lo necesario para la salvación y la vida piadosa está contenido con claridad en el canon.',
        },
        {
          titulo: '1.3 El canon bíblico y su transmisión histórica',
          video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          pdf: '/guias/teologia-m1-l3.pdf',
          texto:
            'El reconocimiento del canon no fue una imposición arbitraria posterior, sino el discernimiento progresivo de la comunidad apostólica frente a escritos que portaban apostolicidad, ortodoxia doctrinal y uso extendido en las iglesias locales.',
        },
      ],
    },
    {
      titulo: 'Módulo 2 · Dios, Trinidad y Creación',
      lecciones: [
        {
          titulo: '2.1 Atributos comunicables e incomunicables de Dios',
          video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          pdf: '/guias/teologia-m2-l1.pdf',
          texto:
            'Estudiamos la aseidad, inmutabilidad y eternidad de Dios junto con su santidad, amor, justicia y fidelidad. Comprender quién es Dios transforma nuestra adoración y nuestra confianza cotidiana.',
        },
        {
          titulo: '2.2 El misterio bíblico de la Trinidad',
          video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          pdf: '/guias/teologia-m2-l2.pdf',
          texto:
            'Confesamos a un solo Dios verdadero que subsiste eternamente en tres personas coiguales y coeternas: Padre, Hijo y Espíritu Santo. En la obra de la redención las tres personas actúan en perfecta unidad.',
        },
        {
          titulo: '2.3 Creación, providencia y propósito humano',
          video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          pdf: '/guias/teologia-m2-l3.pdf',
          texto:
            'Dios creó todas las cosas de la nada por su palabra poderosa y sostiene la historia mediante su providencia sabia. El ser humano, creado a imagen de Dios, halla su plenitud en conocerlo y glorificarlo.',
        },
      ],
    },
    {
      titulo: 'Módulo 3 · La Gracia, la Salvación y la Iglesia',
      lecciones: [
        {
          titulo: '3.1 Justificación por la fe y regeneración',
          video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          pdf: '/guias/teologia-m3-l1.pdf',
          texto:
            'Análisis exegético de Romanos 3 y 5 sobre la justicia imputada y la paz con Dios mediante la fe. La gracia de Dios no es recompensa al mérito humano, sino don soberano recibido por la fe en Cristo.',
        },
        {
          titulo: '3.2 Santificación y vida en el Espíritu',
          video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          pdf: '/guias/teologia-m3-l2.pdf',
          texto:
            'La santificación es el proceso continuo mediante el cual el Espíritu Santo conforma el carácter del creyente a la imagen de Jesucristo a través de la Palabra, la oración y la comunión.',
        },
        {
          titulo: '3.3 La Iglesia local, ordenanzas y esperanza futura',
          video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          pdf: '/guias/teologia-m3-l3.pdf',
          texto:
            'La Iglesia es el cuerpo de Cristo expresado visiblemente en congregaciones locales donde se predica el evangelio, se celebran el bautismo y la Cena del Señor, y se aguarda con esperanza la venida del Señor.',
        },
      ],
    },
  ];

  const c1LeccionIds: number[] = [];
  for (let i = 0; i < c1Modulos.length; i++) {
    const mod = await crearModulo(profMarcosSession, curso1.id, {
      titulo: c1Modulos[i].titulo,
      ordenSecuencia: i + 1,
    });
    for (let j = 0; j < c1Modulos[i].lecciones.length; j++) {
      const l = c1Modulos[i].lecciones[j];
      const created = await crearLeccion(profMarcosSession, mod.id, {
        titulo: l.titulo,
        ordenSecuencia: j + 1,
        contenidoTexto: l.texto,
        enlaceVideo: l.video,
        archivoPdf: l.pdf,
      });
      c1LeccionIds.push(created.id);
    }
  }
  await editarCurso(profMarcosSession, curso1.id, { estado: 'publicado' });

  const curso2 = await crearCurso(profLauraSession, {
    titulo: 'Introducción a la Hermenéutica Bíblica',
    descripcion:
      'Principios sólidos para leer, interpretar y aplicar el texto bíblico respetando su contexto histórico, género literario y estructura teológica.',
  });

  const c2Modulos = [
    {
      titulo: 'Módulo 1 · Observación del Texto Bíblico',
      lecciones: [
        {
          titulo: '1.1 Qué dice el texto antes de preguntar qué significa',
          texto:
            'La observación atenta evita lecturas apresuradas o alegorizaciones sin sustento textual. Aprender a leer despacio, identificando verbos principales y repeticiones, abre el sentido natural del pasaje.',
        },
        {
          titulo: '1.2 Conectores lógicos y estructura de párrafos',
          texto:
            'Identificar conjunciones causales («porque», «por tanto»), contrastes («pero», «mas») y propósitos ilumina el argumento central de las epístolas y discursos bíblicos.',
        },
        {
          titulo: '1.3 Palabras clave y contexto inmediato',
          texto:
            'El significado de cada término bíblico se determina primero por la oración y el párrafo donde aparece, antes que por usos lejanos o etimologías aisladas.',
        },
      ],
    },
    {
      titulo: 'Módulo 2 · Contexto Histórico y Géneros Literarios',
      lecciones: [
        {
          titulo: '2.1 Narrativa histórica y Evangelios',
          texto:
            'Las narrativas bíblicas enseñan doctrina a través de la historia redentora, distinguiendo lo que el texto simplemente describe de lo que prescribe normativamente.',
        },
        {
          titulo: '2.2 Poesía hebrea, Salmos y libros sapienciales',
          texto:
            'El paralelismo sinónimo, antitético y sintético es la clave estructural de los Salmos y Proverbios. Comprender el lenguaje poético enriquece la lectura devocional.',
        },
        {
          titulo: '2.3 Epístolas apostólicas y literatura profética',
          texto:
            'Las epístolas responden a situaciones concretas de iglesias del siglo I; extraer los principios teológicos permanentes permite aplicarlos con fidelidad hoy.',
        },
      ],
    },
    {
      titulo: 'Módulo 3 · Aplicación Fiel y Teología Bíblica',
      lecciones: [
        {
          titulo: '3.1 El puente desde el texto antiguo al lector actual',
          texto:
            'Toda aplicación legítima debe apoyarse en el sentido original del texto, trazando puentes teológicos sólidos hacia la vida personal, familiar y congregacional.',
        },
        {
          titulo: '3.2 Cristo como centro de toda la Escritura',
          texto:
            'Siguiendo Lucas 24:27, leemos el Antiguo y el Nuevo Testamento como una sola historia de redención que culmina en la persona y obra de Jesucristo.',
        },
        {
          titulo: '3.3 Taller práctico de estudio inductivo',
          texto:
            'Integramos los pasos de observación, interpretación y aplicación sobre un pasaje completo de Filipenses 2 para consolidar el método autodidacta.',
        },
      ],
    },
  ];

  const c2LeccionIds: number[] = [];
  for (let i = 0; i < c2Modulos.length; i++) {
    const mod = await crearModulo(profLauraSession, curso2.id, {
      titulo: c2Modulos[i].titulo,
      ordenSecuencia: i + 1,
    });
    for (let j = 0; j < c2Modulos[i].lecciones.length; j++) {
      const l = c2Modulos[i].lecciones[j];
      const created = await crearLeccion(profLauraSession, mod.id, {
        titulo: l.titulo,
        ordenSecuencia: j + 1,
        contenidoTexto: l.texto,
        enlaceVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        archivoPdf: `/guias/hermeneutica-m${i + 1}-l${j + 1}.pdf`,
      });
      c2LeccionIds.push(created.id);
    }
  }
  await editarCurso(profLauraSession, curso2.id, { estado: 'publicado' });

  // Curso 3 en borrador
  const curso3 = await crearCurso(profMarcosSession, {
    titulo: 'Historia de la Iglesia Primitiva (Siglos I–IV)',
    descripcion:
      'Desde Pentecostés y los Padres Apostólicos hasta los concilios ecuménicos que defendieron la cristología bíblica.',
  });
  const mod3 = await crearModulo(profMarcosSession, curso3.id, {
    titulo: 'Módulo 1 · Expansión en el Mundo Grecorromano',
    ordenSecuencia: 1,
  });
  await crearLeccion(profMarcosSession, mod3.id, {
    titulo: '1.1 Las primeras comunidades en Jerusalén y Antioquía',
    ordenSecuencia: 1,
    contenidoTexto:
      'Borrador en preparación sobre la expansión misionera del libro de los Hechos y el testimonio de la iglesia primitiva.',
    enlaceVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  });

  // 6. Prédicas (8 dominicales + 3 estudios bíblicos = 11 registros con transcripciones 1:1)
  const predicasSeed = [
    {
      titulo: 'La suficiencia de la gracia en tiempos de prueba',
      predicador: 'Pr. Marcos Herrera',
      fecha: '2026-11-15',
      pasaje: '2 Corintios 12:7-10',
      repros: 184,
      texto:
        'En el capítulo doce de su segunda carta a los Corintios, el apóstol Pablo nos abre una ventana honesta a su propia fragilidad. Muchas veces imaginamos que el crecimiento espiritual consiste en alcanzar una autosuficiencia invulnerable.\n\nSin embargo, Pablo describe un aguijón en la carne que lo llevó a orar tres veces pidiendo al Señor que lo quitara. Y la respuesta divina no fue la remoción de la prueba, sino una promesa superior: «Bástate mi gracia, porque mi poder se perfecciona en la debilidad».\n\nEn la teología bíblica, la gracia no es solamente el perdón inicial que nos reconcilia con Dios; es también el sostén activo, cotidiano y misericordioso del Espíritu cuando nuestras fuerzas humanas llegan a su límite.',
    },
    {
      titulo: 'Edificados sobre el fundamento apostólico',
      predicador: 'Pr. Daniel Sosa',
      fecha: '2026-11-08',
      pasaje: 'Efesios 2:19-22',
      repros: 142,
      texto:
        'Al leer Efesios capítulo 2, descubrimos que el evangelio no produce creyentes aislados, sino una familia y un templo espiritual donde Cristo mismo es la principal piedra del ángulo.\n\nSer conciudadanos de los santos significa pertenecer a una comunidad que trasciende barreras culturales y geográficas, unida por la misma fe apostólica.',
    },
    {
      titulo: 'Estudio Bíblico: Las bienaventuranzas del Reino',
      predicador: 'Dra. Laura Benítez',
      fecha: '2026-11-04',
      pasaje: 'Mateo 5:1-12',
      repros: 236,
      texto:
        'El Sermón del Monte inaugura la enseñanza ética del Mesías describiendo el carácter de quienes ya han sido alcanzados por el Reino de los Cielos.\n\nSer pobre en espíritu no es falsa modestia, sino la lucidez espiritual de reconocer nuestra total necesidad delante de Dios y recibir su consuelo.',
    },
    {
      titulo: 'La fe que obra por el amor',
      predicador: 'Pr. Marcos Herrera',
      fecha: '2026-10-25',
      pasaje: 'Gálatas 5:1-6',
      repros: 165,
      texto:
        'La libertad cristiana no es licencia para el egoísmo ni regreso al legalismo: es libertad para amar y servir al prójimo por obra del Espíritu Santo.\n\nPablo recuerda a los gálatas que en Cristo Jesús lo que vale es la fe que obra por el amor.',
    },
    {
      titulo: 'El Buen Pastor y sus ovejas',
      predicador: 'Pr. Daniel Sosa',
      fecha: '2026-10-18',
      pasaje: 'Juan 10:11-18',
      repros: 131,
      texto:
        'Jesús contrasta al asalariado que huye ante el peligro con el Buen Pastor que voluntariamente da su vida por las ovejas.\n\nConocer la voz del Pastor nos da seguridad, dirección y descanso en medio de un mundo lleno de voces confusas.',
    },
    {
      titulo: 'Estudio Bíblico: Orando con los Salmos',
      predicador: 'Dra. Laura Benítez',
      fecha: '2026-10-14',
      pasaje: 'Salmo 23:1-6',
      repros: 118,
      texto:
        'Los Salmos son el devocionario inspirado de la Iglesia. Nos enseñan a hablar con Dios con sinceridad tanto en la alegría como en el valle de sombra.\n\nEl Salmo 23 proclama la fidelidad constante del Señor como Pastor y anfitrión misericordioso.',
    },
    {
      titulo: 'Permanecer en la Vid Verdadera',
      predicador: 'Pr. Marcos Herrera',
      fecha: '2026-10-11',
      pasaje: 'Juan 15:1-11',
      repros: 97,
      texto:
        'El fruto espiritual no nace del esfuerzo ansioso sino de la comunión constante con Cristo. Separados de Él nada podemos hacer, pero permaneciendo en su Palabra llevamos fruto duradero para gloria del Padre.',
    },
    {
      titulo: 'La paz de Dios que sobrepasa todo entendimiento',
      predicador: 'Pr. Marcos Herrera',
      fecha: '2026-10-04',
      pasaje: 'Filipenses 4:4-9',
      repros: 109,
      texto:
        'Desde una prisión romana, Pablo invita a la iglesia de Filipos a cambiar la ansiedad por oración con acción de gracias.\n\nLa paz de Dios guarda el corazón y los pensamientos en Cristo Jesús.',
    },
    {
      titulo: 'Estudio Bíblico: La armadura de Dios en la vida diaria',
      predicador: 'Pr. Daniel Sosa',
      fecha: '2026-09-30',
      pasaje: 'Efesios 6:10-20',
      repros: 88,
      texto:
        'Cada pieza de la armadura descrita en Efesios 6 remite al evangelio: la verdad, la justicia, el apresto del evangelio de la paz, la fe, la salvación y la espada del Espíritu que es la Palabra de Dios.',
    },
    {
      titulo: 'Llamados a ser luz y sal en la ciudad',
      predicador: 'Pr. Marcos Herrera',
      fecha: '2026-09-20',
      pasaje: 'Mateo 5:13-16',
      repros: 76,
      texto:
        'La fe genuina nunca se esconde en el aislamiento. Como la sal preserva y la luz orienta, el testimonio coherente de los discípulos lleva a otros a glorificar al Padre celestial.',
    },
    {
      titulo: 'Esperanza viva en la resurrección de Cristo',
      predicador: 'Pr. Daniel Sosa',
      fecha: '2026-09-13',
      pasaje: '1 Pedro 1:3-9',
      repros: 82,
      texto:
        'Pedro escribe a creyentes dispersos recordándoles que han nacido de nuevo para una esperanza viva mediante la resurrección de Jesucristo de los muertos, una herencia incorruptible reservada en los cielos.',
    },
  ];

  const predicaIds: number[] = [];
  for (const p of predicasSeed) {
    const created = await crearPredica(profMarcosSession, {
      titulo: p.titulo,
      predicador: p.predicador,
      fechaPredica: p.fecha,
      pasajeBiblico: p.pasaje,
      urlArchivoAudio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      textoTranscripcion: p.texto,
    });
    await db
      .update(predicas)
      .set({ reproducciones: p.repros })
      .where(eq(predicas.idPredica, created.id));
    predicaIds.push(created.id);
  }

  // 7. Inscripciones y progreso (incluyendo 2 finalizadas al 100% con certificado PDF)
  // Lucía (alumno[0]): Curso 1 al 56% (5/9) y Curso 2 al 100% (finalizado con certificado!)
  const insLucia1 = await inscribirEnCurso(alumnoSessions[0], { cursoId: curso1.id });
  for (let i = 0; i < 5; i++) {
    await actualizarProgresoLeccion(alumnoSessions[0], insLucia1.id, c1LeccionIds[i], {
      completada: true,
      segundoActual: 900,
    });
  }
  await actualizarProgresoLeccion(alumnoSessions[0], insLucia1.id, c1LeccionIds[5], {
    segundoActual: 420,
  });

  const insLucia2 = await inscribirEnCurso(alumnoSessions[0], { cursoId: curso2.id });
  for (const lid of c2LeccionIds) {
    await actualizarProgresoLeccion(alumnoSessions[0], insLucia2.id, lid, {
      completada: true,
      segundoActual: 1200,
    });
  }

  // Tomás (alumno[1]): Curso 1 al 100% (segundo certificado PDF listo!)
  const insTomas1 = await inscribirEnCurso(alumnoSessions[1], { cursoId: curso1.id });
  for (const lid of c1LeccionIds) {
    await actualizarProgresoLeccion(alumnoSessions[1], insTomas1.id, lid, {
      completada: true,
      segundoActual: 1100,
    });
  }

  // Otros alumnos con distintos avances
  const insSofia2 = await inscribirEnCurso(alumnoSessions[2], { cursoId: curso2.id });
  for (let i = 0; i < 6; i++) {
    await actualizarProgresoLeccion(alumnoSessions[2], insSofia2.id, c2LeccionIds[i], {
      completada: true,
      segundoActual: 800,
    });
  }

  const insMateo1 = await inscribirEnCurso(alumnoSessions[3], { cursoId: curso1.id });
  for (let i = 0; i < 3; i++) {
    await actualizarProgresoLeccion(alumnoSessions[3], insMateo1.id, c1LeccionIds[i], {
      completada: true,
      segundoActual: 600,
    });
  }

  await inscribirEnCurso(alumnoSessions[4], { cursoId: curso2.id });

  // Distribuir fechas de inscripción en los últimos 6 días para enriquecer el gráfico semanal
  const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
  await db
    .update(inscripciones)
    .set({ fechaInscripcion: daysAgo(5) })
    .where(eq(inscripciones.idInscripcion, insLucia1.id));
  await db
    .update(inscripciones)
    .set({ fechaInscripcion: daysAgo(4) })
    .where(eq(inscripciones.idInscripcion, insTomas1.id));
  await db
    .update(inscripciones)
    .set({ fechaInscripcion: daysAgo(2) })
    .where(eq(inscripciones.idInscripcion, insSofia2.id));

  // 8. Foros temáticos (8 hilos con preguntas rompehielo y respuestas)
  const f1 = await crearConsultaForo(alumnoSessions[0], {
    cursoId: curso1.id,
    leccionId: c1LeccionIds[1],
    tituloConsulta: '¿Cómo se relaciona la suficiencia de la Escritura con los credos históricos?',
    mensajePregunta:
      'En la lección 1.2 se menciona que la Biblia es regla suprema de fe. ¿Cómo debemos valorar los credos históricos de la iglesia?',
  });
  await crearRespuestaForo(profMarcosSession, f1.id, {
    respuesta:
      'Excelente pregunta, Lucía. La suficiencia bíblica no descarta los credos históricos como el Credo Niceno; los reconoce como resúmenes útiles y subordinados a la Escritura.',
  });
  await crearRespuestaForo(alumnoSessions[1], f1.id, {
    respuesta: '¡Muchas gracias Pastor! Esa distinción me ayudó mucho a repasar el módulo.',
  });

  await crearConsultaForo(alumnoSessions[0], {
    cursoId: curso1.id,
    leccionId: c1LeccionIds[0],
    tituloConsulta: 'Alcance de la revelación general en Romanos 1',
    mensajePregunta:
      '¿Hasta dónde alcanza el testimonio de la creación y por qué sigue siendo indispensable el evangelio predicado?',
  });

  const f3 = await crearConsultaForo(profMarcosSession, {
    cursoId: curso1.id,
    tituloConsulta: 'Rompehielo · ¿Qué doctrina te gustaría profundizar primero?',
    mensajePregunta:
      '¡Bienvenidos a Fundamentos de Teología Sistemática! Compartan qué expectativa tienen para este recorrido autodidacta.',
  });
  await crearRespuestaForo(alumnoSessions[3], f3.id, {
    respuesta: 'Quiero profundizar en la doctrina de la gracia y en cómo explicarla con claridad.',
  });

  const f4 = await crearConsultaForo(profLauraSession, {
    cursoId: curso2.id,
    tituloConsulta: 'Rompehielo · ¿Qué pasaje bíblico te resultó más desafiante estudiar?',
    mensajePregunta:
      'Contanos qué libro o género bíblico te gustaría aprender a interpretar mejor durante este curso de Hermenéutica.',
  });
  await crearRespuestaForo(alumnoSessions[2], f4.id, {
    respuesta: 'Los Salmos y las parábolas del Evangelio de Marcos.',
  });

  await crearConsultaForo(alumnoSessions[2], {
    cursoId: curso2.id,
    leccionId: c2LeccionIds[0],
    tituloConsulta: 'Ejemplo práctico de observación en las parábolas',
    mensajePregunta: '¿Podrían recomendar una ficha breve para practicar observación en Marcos 4?',
  });

  const f6 = await crearConsultaForo(alumnoSessions[1], {
    cursoId: curso1.id,
    leccionId: c1LeccionIds[4],
    tituloConsulta: 'Pasajes del Antiguo Testamento que anticipan la Trinidad',
    mensajePregunta: '¿Qué textos del Antiguo Testamento podemos vincular con la lección 2.2?',
  });
  await crearRespuestaForo(profMarcosSession, f6.id, {
    respuesta: 'Podés revisar Génesis 1:1-2, Isaías 48:16 y Salmo 110:1 junto con su cumplimiento en Mateo 28:19.',
  });

  await crearConsultaForo(alumnoSessions[3], {
    cursoId: curso1.id,
    leccionId: c1LeccionIds[6],
    tituloConsulta: 'Diferencia entre justificación y santificación',
    mensajePregunta: '¿Podrían resumir brevemente por qué ambas son obra de la gracia pero tienen distinto énfasis?',
  });

  await crearConsultaForo(alumnoSessions[4], {
    cursoId: curso2.id,
    leccionId: c2LeccionIds[4],
    tituloConsulta: 'Cómo identificar paralelismo antitético en Proverbios',
    mensajePregunta: 'En la lección 2.2 me costó distinguir paralelismo antitético de sintético.',
  });

  // 9. Base de conocimiento del Bot Guía (12 registros)
  const soporteSeed = [
    { categoria: 'Registro', pregunta: '¿Cómo creo una cuenta en la plataforma?', respuesta: '1. Hacé clic en "Registrarse" en la barra superior.\n2. Completá nombre, apellido, correo y una contraseña de al menos 8 caracteres.\n3. Elegí tu congregación o marcá "Soy Externo".', ruta: '/registro' },
    { categoria: 'Registro', pregunta: '¿Puedo registrarme si no pertenezco a ninguna congregación?', respuesta: 'Sí, cualquier persona externa puede registrarse seleccionando la opción "Soy Externo (sin congregación vinculada)" y acceder a todo el contenido gratuito.', ruta: '/registro' },
    { categoria: 'Inscripción', pregunta: '¿Cómo me inscribo a un curso?', respuesta: '1. Entrá a "Cursos Online".\n2. Elegí un curso publicado y hacé clic en "Ver detalle e inscribirme".\n3. Presioná "Inscribirme gratis". Todos los cursos son 100% gratuitos.', ruta: '/cursos' },
    { categoria: 'Inscripción', pregunta: '¿Los cursos o certificados tienen algún costo?', respuesta: 'No. Todos los cursos, prédicas, certificados PDF y el Asistente IA son 100% gratuitos (RN-11).', ruta: '/cursos' },
    { categoria: 'Cursos', pregunta: '¿Cómo obtengo mi certificado PDF?', respuesta: 'Al completar el 100% de las lecciones activas de un curso, tu inscripción pasa automáticamente a Finalizado y se habilita el botón "Descargar Certificado PDF" en tu Aula y en tu Perfil.', ruta: '/mi-aprendizaje' },
    { categoria: 'Cursos', pregunta: '¿Cómo guarda la plataforma mi avance en los videos?', respuesta: 'En el Aula Virtual se guarda automáticamente el segundo de reproducción y podés marcar manualmente cada lección como completada (o al superar el 90%).', ruta: '/mi-aprendizaje' },
    { categoria: 'Prédicas', pregunta: '¿Puedo escuchar prédicas sin iniciar sesión?', respuesta: 'Sí, el repositorio completo de prédicas en audio y sus transcripciones 1:1 con buscador interno es totalmente público.', ruta: '/predicas' },
    { categoria: 'Prédicas', pregunta: '¿Cómo busco una palabra dentro de una transcripción?', respuesta: 'Ingresá a cualquier prédica y utilizá el campo "Buscar en transcripción" ubicado arriba del texto para resaltar coincidencias mientras escuchás el audio.', ruta: '/predicas' },
    { categoria: 'Foros', pregunta: '¿Cómo hago una pregunta a los profesores?', respuesta: 'Ingresá a "Foros Temáticos" desde el menú del Campus, presioná "Nueva consulta", elegí el curso y escribí tu duda.', ruta: '/foros' },
    { categoria: 'Foros', pregunta: '¿Por qué no puedo editar mi consulta en el foro?', respuesta: 'Por regla de moderación (RN-10), un alumno solo puede editar o eliminar su propia consulta mientras no haya recibido respuestas previas.', ruta: '/foros' },
    { categoria: 'Recuperación de clave', pregunta: 'Olvidé mi contraseña, ¿cómo la recupero?', respuesta: 'Ingresá a "¿Olvidaste tu contraseña?" desde la pantalla de ingreso, colocá tu correo y utilizá el token temporal (vigente 30 minutos) para definir una nueva clave.', ruta: '/recuperar-password' },
    { categoria: 'Recuperación de clave', pregunta: '¿Cómo cambio mi contraseña si ya inicié sesión?', respuesta: 'Andá a "Mi Perfil e Historial" en el menú lateral del Campus y utilizá la sección "Seguridad · Cambiar contraseña".', ruta: '/perfil' },
  ];
  for (const s of soporteSeed) {
    await crearEntradaSoporte(adminSession, {
      categoria: s.categoria,
      pregunta: s.pregunta,
      respuesta: s.respuesta,
      rutaSugerida: s.ruta,
    });
  }

  // 10. Información Institucional / Doctrinas (4 bloques oficiales)
  const instSeed = [
    {
      tipo: 'declaracion_fe',
      titulo: 'Nuestra Declaración de Fe',
      contenido:
        'Creemos en un solo Dios eterno, Creador y Sustentador de todas las cosas, que subsiste en tres personas: Padre, Hijo y Espíritu Santo. Confesamos las Sagradas Escrituras del Antiguo y Nuevo Testamento como la Palabra de Dios inspirada, confiable y regla suprema de fe y conducta.\n\nCreemos en la plena deidad y verdadera humanidad de Jesucristo, en su entrega voluntaria en la cruz por nuestros pecados, en su resurrección corporal y en la salvación exclusivamente por gracia mediante la fe.',
    },
    {
      tipo: 'doctrina',
      titulo: 'Doctrina Bíblica y Estudio Fiel',
      contenido:
        'Nuestra enseñanza sigue una hermenéutica histórico-gramatical comprometida con la fidelidad al texto bíblico. Promovemos una formación teológica clara y accesible para cada creyente, uniendo el rigor en el estudio con una vida devocional sincera y el servicio amoroso en la iglesia local.',
    },
    {
      tipo: 'vision',
      titulo: 'Nuestra Visión Formativa',
      contenido:
        'Anhelamos acompañar a cada miembro de nuestras congregaciones y a toda persona que busca conocer las Escrituras en un camino de crecimiento continuo, 100% gratuito, asincrónico y cuidado pastoralmente, para que cada estudiante pueda aprender a su ritmo desde cualquier lugar.',
    },
    {
      tipo: 'creencias',
      titulo: 'Doctrina de la Iglesia y Comunión',
      contenido:
        'Creemos que la Iglesia universal está formada por todos los redimidos por Cristo y se hace visible en congregaciones locales donde se predica el evangelio con fidelidad, se celebran el bautismo y la Cena del Señor, y nos cuidamos mutuamente en el amor de Cristo.',
    },
  ];
  for (const b of instSeed) {
    await crearInformacionInstitucional(adminSession, b);
  }

  // 11. Interacciones IA valoradas (10 registros para el tablero de estadísticas)
  const iaSeed = [
    { u: alumnosCreated[0].id, c: curso1.id, l: c1LeccionIds[1], p: null, q: '¿Qué enseña la lección 1.2 sobre la suficiencia bíblica?', a: 'Según la lección 1.2 («Inspiración, autoridad y suficiencia bíblica»), todo lo necesario para la salvación y la vida piadosa está contenido con claridad en el canon bíblico.', util: true, d: 6 },
    { u: alumnosCreated[0].id, c: null, l: null, p: predicaIds[0], q: '¿Cómo explica la prédica la suficiencia de la gracia?', a: 'En la prédica de 2 Corintios 12:7-10 se enseña que la gracia no es solo el perdón inicial, sino el sostén cotidiano del Espíritu en la debilidad.', util: true, d: 5 },
    { u: alumnosCreated[1].id, c: curso1.id, l: c1LeccionIds[0], p: null, q: 'Diferencia entre revelación general y especial', a: 'La revelación general es el testimonio de Dios en la creación (Salmo 19; Romanos 1), mientras la revelación especial comunica el plan redentor en las Escrituras.', util: true, d: 5 },
    { u: alumnosCreated[2].id, c: curso2.id, l: c2LeccionIds[0], p: null, q: '¿Por qué comenzar observando el texto antes de interpretarlo?', a: 'En la lección 1.1 de Hermenéutica se explica que observar verbos y estructura evita lecturas apresuradas o sin sustento textual.', util: true, d: 4 },
    { u: alumnosCreated[3].id, c: curso1.id, l: c1LeccionIds[4], p: null, q: 'Resumen de la doctrina de la Trinidad en el curso', a: 'Según la lección 2.2, existe un solo Dios verdadero que subsiste eternamente en tres personas coiguales: Padre, Hijo y Espíritu Santo.', util: true, d: 3 },
    { u: alumnosCreated[1].id, c: curso1.id, l: c1LeccionIds[6], p: null, q: '¿Qué enseña Romanos 3 sobre la justificación?', a: 'La lección 3.1 destaca que la justificación es justicia imputada y don gratuito recibido mediante la fe en Jesucristo.', util: true, d: 3 },
    { u: alumnosCreated[2].id, c: null, l: null, p: predicaIds[2], q: '¿Qué significa ser pobre en espíritu según el estudio bíblico?', a: 'En el estudio sobre Mateo 5:1-12 se señala que ser pobre en espíritu es reconocer con lucidez nuestra total necesidad delante de Dios.', util: true, d: 2 },
    { u: alumnosCreated[4].id, c: curso2.id, l: c2LeccionIds[4], p: null, q: '¿Cómo se leen los Salmos según el Módulo 2?', a: 'La lección 2.2 explica que el paralelismo sinónimo, antitético y sintético es la clave estructural de la poesía hebrea.', util: true, d: 2 },
    { u: alumnosCreated[0].id, c: null, l: null, p: null, q: '¿Cuál será el precio del dólar el próximo año?', a: 'El tema consultado no se encuentra dentro del material formativo cargado actualmente en la plataforma (RN-09). Te sugiero consultar en el Foro con un pastor o docente.', util: false, d: 1 },
    { u: alumnosCreated[3].id, c: null, l: null, p: predicaIds[3], q: '¿Qué enseña Gálatas 5 sobre la libertad cristiana?', a: 'Según la prédica sobre Gálatas 5:1-6, la libertad cristiana no es egoísmo ni legalismo, sino libertad para amar y servir por obra del Espíritu.', util: true, d: 0 },
  ];

  await db.insert(interaccionesChatIa).values(
    iaSeed.map((x) => ({
      idUsuario: x.u,
      idCurso: x.c,
      idLeccion: x.l,
      idPredica: x.p,
      mensajeUsuario: x.q,
      respuestaIa: x.a,
      util: x.util,
      fechaHora: daysAgo(x.d),
    }))
  );

  console.log('Seed completado exitosamente:');
  console.log('- Admin: admin@iglesiadecristo.org / Admin1234!');
  console.log('- Profesor: profesor@iglesiadecristo.org / Profesor1234!');
  console.log('- Alumno: alumno@iglesiadecristo.org / Alumno1234!');
  client.close();
}

main().catch((err) => {
  console.error('Error ejecutando db:seed:', err);
  process.exit(1);
});
