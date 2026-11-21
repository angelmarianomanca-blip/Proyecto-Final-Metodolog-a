CREATE TABLE `base_conocimiento_soporte` (
	`id_conocimiento` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pregunta` text NOT NULL,
	`respuesta` text NOT NULL,
	`categoria` text NOT NULL,
	`ruta_sugerida` text
);
--> statement-breakpoint
CREATE TABLE `congregaciones` (
	`id_congregacion` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre_sede` text NOT NULL,
	`direccion` text NOT NULL,
	`ciudad` text NOT NULL,
	`telefono_contacto` text NOT NULL,
	`activo` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `congregaciones_nombre_sede_unique` ON `congregaciones` (`nombre_sede`);--> statement-breakpoint
CREATE TABLE `consultas_foro` (
	`id_consulta` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id_curso` integer NOT NULL,
	`id_leccion` integer,
	`id_usuario` integer NOT NULL,
	`titulo_consulta` text NOT NULL,
	`mensaje_pregunta` text NOT NULL,
	`fecha_creacion` text NOT NULL,
	`estado` text DEFAULT 'abierta' NOT NULL,
	FOREIGN KEY (`id_curso`) REFERENCES `cursos`(`id_curso`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`id_leccion`) REFERENCES `lecciones`(`id_leccion`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cursos` (
	`id_curso` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`titulo` text NOT NULL,
	`descripcion` text NOT NULL,
	`estado` text DEFAULT 'borrador' NOT NULL,
	`fecha_creacion` text NOT NULL,
	`id_profesor` integer NOT NULL,
	FOREIGN KEY (`id_profesor`) REFERENCES `usuarios`(`id_usuario`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `informacion_institucional` (
	`id_informacion` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`titulo` text NOT NULL,
	`tipo` text NOT NULL,
	`contenido` text NOT NULL,
	`fecha_actualizacion` text NOT NULL,
	`id_usuario_actualizacion` integer NOT NULL,
	FOREIGN KEY (`id_usuario_actualizacion`) REFERENCES `usuarios`(`id_usuario`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `inscripciones` (
	`id_inscripcion` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id_usuario` integer NOT NULL,
	`id_curso` integer NOT NULL,
	`estado` text DEFAULT 'en_curso' NOT NULL,
	`fecha_inscripcion` text NOT NULL,
	`fecha_finalizacion` text,
	`codigo_certificado` text,
	FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`id_curso`) REFERENCES `cursos`(`id_curso`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inscripciones_codigo_certificado_unique` ON `inscripciones` (`codigo_certificado`);--> statement-breakpoint
CREATE UNIQUE INDEX `inscripciones_usuario_curso_uq` ON `inscripciones` (`id_usuario`,`id_curso`);--> statement-breakpoint
CREATE TABLE `interacciones_chat_ia` (
	`id_interaccion` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id_usuario` integer NOT NULL,
	`id_curso` integer,
	`id_leccion` integer,
	`id_predica` integer,
	`mensaje_usuario` text NOT NULL,
	`respuesta_ia` text NOT NULL,
	`util` integer,
	`fecha_hora` text NOT NULL,
	FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`id_curso`) REFERENCES `cursos`(`id_curso`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`id_leccion`) REFERENCES `lecciones`(`id_leccion`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`id_predica`) REFERENCES `predicas`(`id_predica`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lecciones` (
	`id_leccion` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id_modulo` integer NOT NULL,
	`titulo` text NOT NULL,
	`orden_secuencia` integer DEFAULT 1 NOT NULL,
	`contenido_texto` text DEFAULT '' NOT NULL,
	`enlace_video` text,
	`archivo_pdf` text,
	`activo` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`id_modulo`) REFERENCES `modulos`(`id_modulo`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `modulos` (
	`id_modulo` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id_curso` integer NOT NULL,
	`titulo` text NOT NULL,
	`orden_secuencia` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`id_curso`) REFERENCES `cursos`(`id_curso`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `predicas` (
	`id_predica` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`titulo` text NOT NULL,
	`predicador` text NOT NULL,
	`fecha_predica` text NOT NULL,
	`pasaje_biblico` text NOT NULL,
	`url_archivo_audio` text NOT NULL,
	`reproducciones` integer DEFAULT 0 NOT NULL,
	`id_profesor` integer NOT NULL,
	FOREIGN KEY (`id_profesor`) REFERENCES `usuarios`(`id_usuario`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `progreso_lecciones` (
	`id_progreso` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id_inscripcion` integer NOT NULL,
	`id_leccion` integer NOT NULL,
	`completada` integer DEFAULT false NOT NULL,
	`segundo_actual` integer DEFAULT 0 NOT NULL,
	`fecha_completado` text,
	FOREIGN KEY (`id_inscripcion`) REFERENCES `inscripciones`(`id_inscripcion`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`id_leccion`) REFERENCES `lecciones`(`id_leccion`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `progreso_inscripcion_leccion_uq` ON `progreso_lecciones` (`id_inscripcion`,`id_leccion`);--> statement-breakpoint
CREATE TABLE `respuestas_foro` (
	`id_respuesta` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id_consulta` integer NOT NULL,
	`id_usuario` integer NOT NULL,
	`respuesta` text NOT NULL,
	`fecha_respuesta` text NOT NULL,
	FOREIGN KEY (`id_consulta`) REFERENCES `consultas_foro`(`id_consulta`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id_rol` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`descripcion` text DEFAULT '' NOT NULL,
	`activo` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_nombre_unique` ON `roles` (`nombre`);--> statement-breakpoint
CREATE TABLE `tokens_recuperacion` (
	`id_token` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id_usuario` integer NOT NULL,
	`token_hash` text NOT NULL,
	`fecha_expiracion` text NOT NULL,
	`usado` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transcripciones` (
	`id_transcripcion` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id_predica` integer NOT NULL,
	`texto_transcripcion` text NOT NULL,
	FOREIGN KEY (`id_predica`) REFERENCES `predicas`(`id_predica`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transcripciones_id_predica_unique` ON `transcripciones` (`id_predica`);--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id_usuario` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`apellido` text NOT NULL,
	`correo_electronico` text NOT NULL,
	`contrasenia_hash` text NOT NULL,
	`id_rol` integer NOT NULL,
	`id_congregacion` integer,
	`fecha_registro` text NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`id_rol`) REFERENCES `roles`(`id_rol`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`id_congregacion`) REFERENCES `congregaciones`(`id_congregacion`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_correo_electronico_unique` ON `usuarios` (`correo_electronico`);