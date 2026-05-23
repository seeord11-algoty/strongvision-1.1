/* =======================================================
   STRONGVISION — Sistema de internacionalización (i18n)
   Lee sv_lang de localStorage → aplica traducción al DOM
   Soporta coincidencia insensible a mayúsculas/minúsculas
   ======================================================= */
(function () {
    'use strict';

    // ── Diccionarios ─────────────────────────────────────────
    var EN = {
        /* ── Navegación landing ── */
        'Características':  'Features',
        'Cómo funciona':    'How it works',
        'Iniciar sesión':   'Log in',
        'Crear cuenta':     'Create account',
        'Ir al Dashboard':  'Go to Dashboard',
        'Ir a mi Dashboard →': 'Go to my Dashboard →',
        'Ver cómo funciona': 'See how it works',
        'Cerrar sesión':    'Log out',

        /* ── Hero ── */
        '⚡ Asistente con IA':   '⚡ AI Assistant',
        'Rutinas de gimnasio':   'Gym routines',
        '100% personalizadas':   '100% personalized',
        'con IA':                'with AI',
        'Comenzar gratis →':     'Get started free →',
        'Rutinas base':          'Base routines',
        'Reglas de seguridad':   'Safety rules',
        '20×30 generaciones':    '20×30 generations',
        'Patologías soportadas': 'Supported conditions',

        /* ── Features section ── */
        'Lo que hace única a StrongVision': 'What makes StrongVision unique',
        'Combinamos heurísticas, algoritmo genético, dataset clínico y un asistente de IA para que cada rutina sea tuya.': 'We combine heuristics, genetic algorithm, clinical dataset, and an AI assistant so every routine is uniquely yours.',
        'Asistente de IA':        'AI Assistant',
        'Resuelve dudas sobre técnica, nutrición y planificación. Aprende de tu progreso.': 'Answers questions about technique, nutrition, and planning. Learns from your progress.',
        'Algoritmo Genético':     'Genetic Algorithm',
        'Evalúa 600 combinaciones en 30 generaciones: balance muscular, seguridad, progresión y distribución semanal.': 'Evaluates 600 combinations in 30 generations: muscle balance, safety, progression, and weekly distribution.',
        'Adaptación clínica':     'Clinical adaptation',
        'Considera lesiones, hernias, hipertensión, diabetes, embarazo, artritis y más.': 'Considers injuries, hernias, hypertension, diabetes, pregnancy, arthritis, and more.',
        'Seguimiento real':       'Real tracking',
        'Gráficas semanales, RPE, adherencia y ajustes automáticos según tu desempeño.': 'Weekly charts, RPE, adherence, and automatic adjustments based on your performance.',
        'Gamificación':           'Gamification',
        'Logros, rachas, niveles y XP que convierten cada sesión en un objetivo.': 'Achievements, streaks, levels, and XP that turn every session into a goal.',
        'Diseño accesible':       'Accessible design',
        'UI/UX responsive, contraste WCAG AAA y navegación por teclado completa.': 'Responsive UI/UX, WCAG AAA contrast, and full keyboard navigation.',
        'Calidad ISO 25010':      'ISO 25010 quality',
        'Software medido bajo normas ISO 25010, ISO 9001 y CMMI desde el día uno.': 'Software measured under ISO 25010, ISO 9001, and CMMI standards from day one.',

        /* ── How it works ── */
        'En 3 pasos, tu rutina está lista': 'In 3 steps, your routine is ready',
        'Sin complicaciones. En menos de 2 minutos tendrás un plan personalizado y seguro.': 'No hassle. In under 2 minutes you\'ll have a personalized and safe plan.',
        'Completa tu perfil': 'Complete your profile',
        'Edad, peso, altura, nivel y condiciones médicas. Todo en un formulario guiado.': 'Age, weight, height, level, and medical conditions. All in a guided form.',
        'La IA optimiza tu rutina': 'AI optimizes your routine',
        'Heurística voraz sobre 540 plantillas, 582 reglas clínicas y un Algoritmo Genético que evalúa 600 variantes para encontrar tu plan ideal.': 'Greedy heuristic over 540 templates, 582 clinical rules, and a Genetic Algorithm evaluating 600 variants to find your ideal plan.',
        'Entrena y evoluciona': 'Train and evolve',
        'Seguimiento, RPE y ajuste automático semana a semana según tu progreso.': 'Tracking, RPE, and automatic weekly adjustment based on your progress.',

        /* ── Footer ── */
        'Producto':  'Product',
        'Calidad':   'Quality',
        'Equipo':    'Team',

        /* ── Modales de auth ── */
        'Comienza gratis. Sin tarjeta de crédito.': 'Get started free. No credit card required.',
        'Nombre completo *':    'Full name *',
        'Cédula *':             'ID number *',
        'Contraseña *':         'Password *',
        'Confirmar contraseña *': 'Confirm password *',
        'Contraseña':           'Password',
        'Mínimo 8 caracteres':  'Minimum 8 characters',
        'Al menos una mayúscula (A–Z)': 'At least one uppercase letter (A–Z)',
        'Al menos un número (0–9)': 'At least one number (0–9)',
        'Al menos un símbolo (!@#$…)': 'At least one symbol (!@#$…)',
        'Ingresa una contraseña': 'Enter a password',
        'Bienvenido de vuelta': 'Welcome back',
        '¿Olvidaste tu contraseña?': 'Forgot your password?',
        'Entrar': 'Sign in',

        /* ── Navegación app (sidebar) ── */
        'Inicio':      'Home',
        'Rutina':      'Routine',
        'Entrenar':    'Train',
        'Progreso':    'Progress',
        'Biblioteca':  'Library',
        'Logros':      'Achievements',
        'Ajustes':     'Settings',
        'Ver perfil':  'View profile',

        /* ── Topbar ── */
        'Modo claro':  'Light mode',
        'Modo oscuro': 'Dark mode',

        /* ── Menú usuario ── */
        'Mi perfil':    'My profile',
        'Mis logros':   'My achievements',
        'Panel Admin':  'Admin panel',

        /* ── Notificaciones ── */
        'Notificaciones':           'Notifications',
        'Sin notificaciones nuevas': 'No new notifications',
        'Ir a soporte →':           'Go to support →',
        '¡Hoy toca entrenar!':      'Time to train today!',
        'Sesión omitida ayer':      'Missed session yesterday',
        'No entrenaste ayer. ¡Retoma hoy tu rutina!': 'You missed yesterday. Get back on track today!',
        'Logro desbloqueado':       'Achievement unlocked',
        'Admin respondió:':         'Admin replied:',
        'Hoy':    'Today',
        'Ayer':   'Yesterday',
        'Reciente': 'Recent',

        /* ── Comunes ── */
        'Guardar':   'Save',
        'Cancelar':  'Cancel',
        'Confirmar': 'Confirm',
        'Cerrar':    'Close',
        'Volver':    'Back',
        'Ver más':   'See more',
        'Salir':     'Exit',
        'Saltar al contenido principal': 'Skip to main content',

        /* ── Ajustes page ── */
        'Ajustes de cuenta':            'Account settings',
        'Nombre, ciudad, dirección y contraseña': 'Name, city, address and password',
        'Nombre completo':              'Full name',
        'Correo electrónico':           'Email address',
        'El correo no puede modificarse.': 'Email cannot be modified.',
        'Ciudad':                       'City',
        'Dirección':                    'Address',
        'Cambiar contraseña':           'Change password',
        'Deja en blanco para no cambiar.': 'Leave blank to keep current.',
        'Contraseña actual':            'Current password',
        'Nueva contraseña':             'New password',
        'Guardar cambios':              'Save changes',
        'Recordatorios y alertas':      'Reminders and alerts',
        'Recordatorios de entrenamiento': 'Training reminders',
        'Avisar si omití una sesión':   'Alert if I missed a session',
        'Notificar logros desbloqueados': 'Notify unlocked achievements',
        'Hora preferida':               'Preferred time',
        'Días activos':                 'Active days',
        'HORA PREFERIDA':               'PREFERRED TIME',
        'DÍAS ACTIVOS':                 'ACTIVE DAYS',
        'Guardar preferencias':         'Save preferences',
        'GUARDAR PREFERENCIAS':         'SAVE PREFERENCES',
        'Preferencias':                 'Preferences',
        'Unidades y accesibilidad':     'Units and accessibility',
        'Unidad de peso':               'Weight unit',
        'UNIDAD DE PESO':               'WEIGHT UNIT',
        'Kilogramos (kg)':              'Kilograms (kg)',
        'Libras (lb)':                  'Pounds (lb)',
        'Idioma':                       'Language',
        'IDIOMA':                       'LANGUAGE',
        'Reducir animaciones (accesibilidad)': 'Reduce animations (accessibility)',
        'Privacidad y datos':           'Privacy and data',
        'Tus datos se guardan solo en tu navegador (localStorage)': 'Your data is stored only in your browser (localStorage)',
        'Ver Política de Privacidad y Habeas Data': 'View Privacy Policy and Habeas Data',
        'Exportar datos (JSON)':        'Export data (JSON)',
        'Limpiar historial de chat':    'Clear chat history',
        'Zona peligrosa':               'Danger zone',
        '⚠️ Zona peligrosa':           '⚠️ Danger zone',
        'Eliminar tu cuenta es permanente. Se borrarán todos tus datos sin posibilidad de recuperación.': 'Deleting your account is permanent. All data will be erased with no recovery.',
        'Eliminar mi cuenta':           'Delete my account',
        'Escribe ELIMINAR para confirmar': 'Type DELETE to confirm',
        'Debes escribir ELIMINAR para confirmar.': 'You must type DELETE to confirm.',
        'ISO 25010':                    'ISO 25010',
        'Ver documentación →':          'View documentation →',
        'Proyecto académico':           'Academic project',

        /* ── Dashboard ── */
        'Entrenar ahora':               'Train now',
        'Iniciar entrenamiento':        'Start training',
        'Ver mi rutina':                'View my routine',
        'Sesiones totales':             'Total sessions',
        'Esta semana':                  'This week',
        'Racha actual':                 'Current streak',
        'Adherencia':                   'Adherence',
        'Mi semana':                    'My week',
        'Tu rutina de esta semana':     'Your routine this week',
        'Ver completa →':               'View full →',
        'Aún no tienes rutina':         "You don't have a routine yet",
        'Completar perfil':             'Complete profile',
        'días':                         'days',
        'Ver todos mis logros':         'See all achievements',
        'Nivel':                        'Level',
        'Sugerencias':                  'Suggestions',

        /* ── Entrenamiento ── */
        'Selecciona tu sesión':         'Select your session',
        'Elige el día que quieres entrenar hoy': 'Choose the day you want to train today',
        'Sugerido':                     'Suggested',
        'BLOQUEADO':                    'LOCKED',
        'ejercicios':                   'exercises',
        '5 – 10 min antes de empezar': '5 – 10 min before starting',
        'Calentamiento':                'Warm-up',
        '¡Listo! Empecemos':           "Ready! Let's go",
        'Volver a la selección':        'Back to selection',
        'Ejercicios de la sesión':      'Session exercises',
        'DESCANSO':                     'REST',
        'Recupera el aliento':          'Catch your breath',
        'Saltar descanso →':            'Skip rest →',
        '+30 segundos':                 '+30 seconds',
        '¡Sesión completada!':          'Session complete!',
        'Excelente trabajo. Aquí está tu resumen.': "Great job. Here's your summary.",
        'Tiempo total':                 'Total time',
        'Calorías estimadas':           'Estimated calories',
        'XP ganada':                    'XP earned',
        '¿Cómo te sentiste? (RPE 1-10)': 'How did you feel? (RPE 1-10)',
        '1 = muy fácil, 5 = moderado, 10 = al límite': '1 = very easy, 5 = moderate, 10 = maximum',
        'Guardar y volver al inicio':   'Save and go home',
        '✓ Serie completada':           '✓ Set complete',
        'Ver técnica detallada':        'View detailed technique',
        '¿Sientes molestia?':          'Feeling discomfort?',
        'Saltar ejercicio':             'Skip exercise',
        'SERIES':                       'SETS',
        'REPS':                         'REPS',
        'Reps realizadas':              'Reps completed',
        'Peso (kg)':                    'Weight (kg)',
        'Técnica de ejecución':         'Execution technique',
        'Técnica: ejecuta con control en fase excéntrica y respiración coordinada.': 'Technique: perform with eccentric phase control and coordinated breathing.',
        'Errores comunes':              'Common mistakes',
        'Próxima serie / ejercicio cuando estés listo.': "Next set / exercise when you're ready.",
        'Reportar molestia':            'Report discomfort',
        'Indica la zona donde sientes molestia. Adaptaremos tu rutina.': "Indicate where you feel discomfort. We'll adapt your routine.",
        'Zona afectada':                'Affected area',
        'Confirmar y adaptar':          'Confirm and adapt',
        'Lumbar':                       'Lower back',
        'Cervical':                     'Neck / Cervical',
        'Rodilla':                      'Knee',
        'Hombro':                       'Shoulder',
        'Codo':                         'Elbow',
        'Tobillo':                      'Ankle',
        'Cadera':                       'Hip',

        /* ── Perfil — sliders y hints ── */
        'Desliza para elegir tu peso':      'Slide to set your weight',
        'Desliza para elegir tu estatura':  'Slide to set your height',
        'Rango válido: 30 – 250 kg':        'Valid range: 30 – 250 kg',
        'Rango válido: 120 – 230 cm':       'Valid range: 120 – 230 cm',
        'Rango típico principiante: 40 – 120 kg': 'Typical range for beginners: 40 – 120 kg',
        'Rango típico intermedio: 50 – 150 kg':   'Typical range for intermediate: 50 – 150 kg',
        'Rango típico avanzado: 55 – 200 kg (incluye masa muscular)': 'Typical range for advanced: 55 – 200 kg (includes muscle mass)',
        'Recomendado para principiante: 2 – 3 días / semana': 'Recommended for beginners: 2 – 3 days / week',
        'Recomendado para intermedio: 3 – 4 días / semana':   'Recommended for intermediate: 3 – 4 days / week',
        'Recomendado para avanzado: 4 – 6 días / semana':     'Recommended for advanced: 4 – 6 days / week',
        'Selecciona cuántos días puedes entrenar por semana':  'Select how many days you can train per week',
        '2 días / semana':  '2 days / week',

        /* ── Rutina ── */
        'Mi Rutina':                    'My Routine',
        'Diseñada por la IA según tu perfil.': 'Designed by AI based on your profile.',
        'Mi Rutina Personalizada':      'My Personalized Routine',
        'Regenerar':                    'Regenerate',
        'DÍAS/SEMANA':                  'DAYS/WEEK',
        'TOTAL EJERCICIOS':             'TOTAL EXERCISES',
        'ADAPTACIONES':                 'ADAPTATIONS',
        'GENERACIÓN IA':                'AI GENERATION',
        'FITNESS AG':                   'AG FITNESS',
        'Estiramiento final':           'Cool-down',
        'Generar mi rutina':            'Generate my routine',
        'Genera tu primera rutina':     'Generate your first routine',
        'Generar rutina':               'Generate routine',

        /* ── Progreso ── */
        'Mi Progreso':                  'My Progress',
        'Visualiza tu evolución y mantén el rumbo hacia tus metas.': 'Track your evolution and stay on course.',
        'entrenamientos completados':   'workouts completed',
        'horas de entrenamiento':       'training hours',
        'Calorías quemadas':            'Calories burned',
        'kcal en total':                'kcal total',
        'RPE promedio':                 'Average RPE',
        'esfuerzo percibido / 10':      'perceived exertion / 10',
        'Sesiones por semana':          'Sessions per week',
        'Últimas 8 semanas':            'Last 8 weeks',
        'Volumen por grupo muscular':   'Volume by muscle group',
        'Series completadas (últimas 4 semanas)': 'Sets completed (last 4 weeks)',
        'Historial de sesiones':        'Session history',
        'Filtra y exporta tu actividad': 'Filter and export your activity',
        '📄 Exportar PDF':              '📄 Export PDF',
        'Desde':                        'From',
        'Hasta':                        'To',
        'Grupo muscular':               'Muscle group',
        'Todos':                        'All',
        'Pecho':                        'Chest',
        'Espalda':                      'Back',
        'Piernas':                      'Legs',
        'Brazo':                        'Arm',
        'Core':                         'Core',
        'Cardio':                       'Cardio',
        'Limpiar filtros':              'Clear filters',
        'Fecha':                        'Date',
        'Día':                          'Day',
        'Enfoque':                      'Focus',
        'Tiempo':                       'Time',
        'Cal.':                         'Cal.',
        'Molestias reportadas':         'Reported discomfort',
        'No has reportado molestias. ¡Sigue así!': 'No discomfort reported. Keep it up!',
        'No hay sesiones que coincidan con los filtros aplicados.': 'No sessions match the applied filters.',
        'Empezar a entrenar':           'Start training',
        'Completa tu primera sesión de entrenamiento para empezar a ver tu progreso.': 'Complete your first workout to start seeing your progress.',
        'Aún no hay datos para mostrar': 'No data to display yet',

        /* ── Logros ── */
        'Mis logros':                   'My achievements',
        'Tu historial de hitos y recompensas en StrongVision.': 'Your milestones and rewards history.',
        'Desbloqueados':                'Unlocked',
        'Disponibles':                  'Available',
        'Completado':                   'Completed',
        '🔥 Rachas':                    '🔥 Streaks',
        '💪 Sesiones':                  '💪 Sessions',
        '⭐ Niveles':                   '⭐ Levels',
        'días de racha':                'day streak',
        'XP para el siguiente nivel':   'XP to next level',
        'Progreso de nivel':            'Level progress',
        'Entrena 3 días seguidos':      'Train 3 consecutive days',
        'Entrena 7 días seguidos':      'Train 7 consecutive days',
        'Entrena 14 días seguidos':     'Train 14 consecutive days',
        'Entrena 30 días seguidos':     'Train 30 consecutive days',
        'Completa tu primer entrenamiento': 'Complete your first workout',
        'Completa 5 entrenamientos':    'Complete 5 workouts',
        'Completa 10 entrenamientos':   'Complete 10 workouts',
        'Completa 25 entrenamientos':   'Complete 25 workouts',
        'Completa 50 entrenamientos':   'Complete 50 workouts',
        'Completa 100 entrenamientos':  'Complete 100 workouts',

        /* ── Biblioteca ── */
        'Biblioteca de Ejercicios':     'Exercise Library',
        'Explora la base de conocimiento de StrongVision. Aprende técnica, errores comunes y variantes.': 'Explore the knowledge base. Learn technique, common mistakes, and variations.',
        'Buscar ejercicio':             'Search exercise',
        'Equipo':                       'Equipment',
        'Cualquiera':                   'Any',
        'Sin equipo (peso corporal)':   'No equipment (bodyweight)',
        'Mancuernas':                   'Dumbbells',
        'Barra olímpica':               'Olympic bar',
        'Poleas':                       'Cables',
        'Máquinas':                     'Machines',
        'No se encontraron ejercicios': 'No exercises found',
        'Prueba con otros términos o quita los filtros aplicados.': 'Try other terms or remove applied filters.',
        'Referencia visual':            'Visual reference',
        'Ver animación en MuscleWiki':  'View on MuscleWiki',
        'Se abrirá en una nueva pestaña': 'Opens in a new tab',

        /* ── Mi Cuenta ── */
        'Mi Cuenta':                    'My Account',
        'Datos de cuenta':              'Account data',
        'Editar perfil físico':         'Edit physical profile',
        'Soporte & Mensajes':           'Support & Messages',
        'Envía consultas al administrador y revisa sus respuestas': 'Send inquiries to the admin and review their responses',
        'Nuevo mensaje':                'New message',
        'Asunto':                       'Subject',
        'Enviar mensaje':               'Send message',
        'Aún no has enviado ningún mensaje.': "You haven't sent any messages yet.",
        'Tú':                           'You',
        'Respondido':                   'Replied',
        'Mi plan de entrenamiento':     'My training plan',
        'Accede o regenera tu rutina personalizada con IA': 'Access or regenerate your personalized AI routine',
        'Regenerar rutina con IA':      'Regenerate routine with AI',

        /* ── Placeholders ── */
        'Tu nombre':                    'Your name',
        'Tu ciudad':                    'Your city',
        'Tu dirección':                 'Your address',
        'Ej: press, sentadilla...':     'Ex: press, squat...',
        'Escribe aquí tu mensaje al administrador…': 'Write your message to the admin here…',
        'Responder al administrador…':  'Reply to the administrator…',

        /* ── Títulos de página ── */
        'StrongVision - Entrenar':      'StrongVision - Train',
        'Ajustes - StrongVision':       'Settings - StrongVision',
        'Mi Progreso - StrongVision':   'My Progress - StrongVision',
        'Biblioteca - StrongVision':    'Library - StrongVision',
        'Logros - StrongVision':        'Achievements - StrongVision',
        'Mi Cuenta - StrongVision':     'My Account - StrongVision',
        'Rutina - StrongVision':        'Routine - StrongVision',
        'Mi Perfil - StrongVision':     'My Profile - StrongVision',

        /* ── Legal / Registro ── */
        'Términos de Uso':              'Terms of Use',
        'Términos y Condiciones de Uso': 'Terms and Conditions of Use',
        '1. Términos y Condiciones de Uso': '1. Terms and Conditions of Use',
        'StrongVision es una plataforma web educativa de entrenamiento físico personalizado. Al crear una cuenta, el usuario acepta utilizar la plataforma de forma responsable y reconoce que:': 'StrongVision is an educational web platform for personalized physical training. By creating an account, the user agrees to use the platform responsibly and acknowledges that:',
        'Las rutinas generadas por la IA son orientativas y no reemplazan la supervisión de un profesional de la salud o entrenador certificado.': 'AI-generated routines are indicative and do not replace supervision by a health professional or certified trainer.',
        'El usuario es responsable de consultar a su médico antes de iniciar cualquier programa de ejercicio, especialmente si tiene condiciones médicas preexistentes.': 'The user is responsible for consulting their doctor before starting any exercise program, especially if they have pre-existing medical conditions.',
        'StrongVision no se hace responsable por lesiones derivadas del uso incorrecto de las rutinas generadas.': 'StrongVision is not liable for injuries resulting from incorrect use of the generated routines.',
        'La plataforma es de uso personal e intransferible.': 'The platform is for personal and non-transferable use.',
        'Política de Habeas Data (Ley 1581 de 2012)': 'Habeas Data Policy (Law 1581 of 2012)',
        '2. Política de Tratamiento de Datos Personales (Habeas Data)': '2. Personal Data Processing Policy (Habeas Data)',
        'En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013 (Colombia), StrongVision informa:': 'In compliance with Law 1581 of 2012 and Decree 1377 of 2013 (Colombia), StrongVision informs:',
        'Responsable del tratamiento:':  'Data controller:',
        'Equipo StrongVision (proyecto académico)': 'StrongVision Team (academic project)',
        'Datos recopilados:':            'Data collected:',
        'Identificación:':               'Identification:',
        'nombre completo, correo electrónico, ciudad y dirección.': 'full name, email address, city, and address.',
        'Salud:':                        'Health:',
        'edad, género, peso, estatura, nivel de condición física, objetivo de entrenamiento, patologías y lesiones declaradas.': 'age, gender, weight, height, fitness level, training goal, declared pathologies and injuries.',
        'Actividad:':                    'Activity:',
        'historial de entrenamientos, RPE registrado, molestias reportadas y progreso físico.': 'training history, logged RPE, reported discomfort, and physical progress.',
        'Finalidad del tratamiento:':    'Purpose of processing:',
        'Los datos se utilizan exclusivamente para generar rutinas de entrenamiento personalizadas y seguras dentro de la plataforma.': 'Data is used exclusively to generate personalized and safe training routines within the platform.',
        'Los datos se utilizan exclusivamente para generar rutinas de entrenamiento personalizadas y seguras, adaptar las recomendaciones de la IA al perfil del usuario y mejorar la experiencia dentro de la plataforma.': 'Data is used exclusively to generate personalized and safe training routines, adapt AI recommendations to the user profile, and improve the in-platform experience.',
        'Almacenamiento:':               'Storage:',
        'Todos los datos se almacenan localmente en el navegador (localStorage). StrongVision': 'All data is stored locally in the browser (localStorage). StrongVision',
        'Todos los datos se almacenan localmente en el navegador del usuario mediante localStorage. StrongVision': 'All data is stored locally in the user\'s browser via localStorage. StrongVision',
        'transmite, vende ni comparte datos personales con terceros ni servidores externos.': 'does not transmit, sell, or share personal data with third parties or external servers.',
        'transmite, vende ni comparte datos personales con terceros ni con servidores externos.': 'does not transmit, sell, or share personal data with third parties or external servers.',
        'Derechos del titular:':         'Rights of the data subject:',
        'El usuario puede conocer, actualizar, rectificar y suprimir sus datos desde': 'The user can access, update, rectify, and delete their data from',
        'El usuario tiene derecho a conocer, actualizar, rectificar y suprimir sus datos en cualquier momento desde la sección': 'The user has the right to access, update, rectify, and delete their data at any time from the section',
        'Ajustes → "Eliminar mi cuenta"': 'Settings → "Delete my account"',
        'Ajustes → "Exportar mis datos"': 'Settings → "Export my data"',
        '"Eliminar mi cuenta"':          '"Delete my account"',
        'Vigencia:':                     'Validity:',
        'Los datos permanecen almacenados hasta que el usuario elimine su cuenta o borre los datos del navegador.': 'Data remains stored until the user deletes their account or clears browser data.',
        'Política de Privacidad y Habeas Data': 'Privacy Policy and Habeas Data',
        'StrongVision — Proyecto académico': 'StrongVision — Academic project',
        'He leído y acepto los':         'I have read and accept the',
        'Términos y Condiciones':        'Terms and Conditions',
        'de uso *':                      'of use *',
        'Autorizo el tratamiento de mis datos personales (': 'I authorize the processing of my personal data (',
        '· Ley 1581 de 2012) *':         '· Law 1581 of 2012) *',
        'Debes aceptar los Términos y Condiciones para continuar.': 'You must accept the Terms and Conditions to continue.',
        'Debes autorizar el tratamiento de datos para continuar.': 'You must authorize data processing to continue.',

        /* ── Perfil / Wizard ── */
        '¡Bienvenido a StrongVision!':  'Welcome to StrongVision!',
        'Completa tu perfil para que la IA pueda crear tu primera rutina personalizada.': 'Complete your profile so our AI can create your first personalized routine.',
        'Completa tu perfil para continuar': 'Complete your profile to continue',
        'Necesitamos algunos datos para personalizar tu experiencia. Solo tomará un minuto.': 'We need some information to personalize your experience. It will only take a minute.',
        'Datos':            'Data',
        'Objetivo':         'Goal',
        'Salud':            'Health',
        'Datos personales': 'Personal Data',
        'Tu información física básica · Paso 1 de 3': 'Your basic physical info · Step 1 of 3',
        'Experiencia y objetivo': 'Experience & Goal',
        'Tu nivel y metas de entrenamiento · Paso 2 de 3': 'Your level and training goals · Step 2 of 3',
        'Salud y seguridad': 'Health & Safety',
        'Adaptamos tu rutina según tus condiciones · Paso 3 de 3': 'We adapt your routine to your conditions · Step 3 of 3',
        'Edad *':           'Age *',
        'Género *':         'Gender *',
        'Peso (kg) *':      'Weight (kg) *',
        'Estatura (cm) *':  'Height (cm) *',
        'Días por semana que puedes entrenar *': 'Days per week you can train *',
        'Selecciona tu edad...': 'Select your age...',
        'Selecciona...':    'Select...',
        'Masculino':        'Male',
        'Femenino':         'Female',
        'Otro / Prefiero no decir': 'Other / Prefer not to say',
        '3 días / semana':  '3 days / week',
        '4 días / semana':  '4 days / week',
        '5 días / semana':  '5 days / week',
        '6 días / semana':  '6 days / week',
        'Nivel de experiencia *': 'Experience Level *',
        'Principiante':     'Beginner',
        '< 6 meses':        '< 6 months',
        'Intermedio':       'Intermediate',
        '6 meses – 2 años': '6 months – 2 years',
        'Avanzado':         'Advanced',
        '2+ años':          '2+ years',
        'Objetivo principal *': 'Main Goal *',
        'Hipertrofia':      'Hypertrophy',
        'Volumen muscular': 'Muscle volume',
        'Fuerza':           'Strength',
        'Fuerza máxima':    'Max strength',
        'Definición':       'Definition',
        'Reducir grasa':    'Reduce body fat',
        'Resistencia':      'Endurance',
        'Cardio y circuitos': 'Cardio & circuits',
        'Tonificación':     'Toning',
        'Firmeza corporal': 'Body firmness',
        'Pérdida de peso':  'Weight loss',
        'Bajar el peso total': 'Reduce total weight',
        'Recomposición corporal': 'Body Recomposition',
        'Ganar músculo y perder grasa al mismo tiempo': 'Gain muscle and lose fat at the same time',
        'Recomposición Corporal': 'Body Recomposition',
        'Ganar músculo y perder grasa simultáneamente. Más lento pero muy sostenible.': 'Gain muscle and lose fat simultaneously. Slower but very sustainable.',
        'Fuerza 3-4 veces/semana': 'Strength 3–4 times/week',
        'Déficit leve: 200-300 kcal': 'Slight deficit: 200–300 kcal',
        'Proteína: 1.8-2.4g/kg':    'Protein: 1.8–2.4 g/kg',
        'Ideal para principiantes': 'Ideal for beginners',
        'Quienes retoman el entrenamiento': 'Those returning to training',
        'Grasa corporal elevada': 'Elevated body fat',
        '¿Tienes alguna patología, lesión o condición médica activa?': 'Do you have any active pathology, injury, or medical condition?',
        'No, estoy bien':   "No, I'm fine",
        'Sin restricciones activas': 'No active restrictions',
        'Sí, tengo condiciones': 'Yes, I have conditions',
        'Lesiones o patologías': 'Injuries or pathologies',
        'Condición médica principal': 'Main Medical Condition',
        'Sin patología / No aplica': 'No pathology / N/A',
        'Hernia lumbar':    'Lumbar hernia',
        'Hipertensión':     'Hypertension',
        'Diabetes tipo 2':  'Type 2 Diabetes',
        'Asma':             'Asthma',
        'Escoliosis':       'Scoliosis',
        'Prob. cervicales': 'Cervical issues',
        'Cardiopatía leve': 'Mild cardiomyopathy',
        'Obesidad':         'Obesity',
        'Embarazo':         'Pregnancy',
        'Osteoporosis':     'Osteoporosis',
        'Artritis':         'Arthritis',
        'Lesiones activas': 'Active Injuries',
        'Puedes marcar varias': 'You can select multiple',
        'Tren superior':    'Upper Body',
        'Tren inferior':    'Lower Body',
        'Hombro derecho':   'Right shoulder',
        'Hombro izquierdo': 'Left shoulder',
        'Codo / Tendinitis': 'Elbow / Tendinitis',
        'Muñeca':           'Wrist',
        'Rodilla derecha':  'Right knee',
        'Rodilla izquierda': 'Left knee',
        'Tobillo / Esguince': 'Ankle / Sprain',
        'Notas adicionales': 'Additional Notes',
        'Opcional':         'Optional',
        'StrongVision no reemplaza supervisión médica': 'StrongVision does not replace medical supervision',
        'Consulta a tu médico antes de iniciar cualquier programa de entrenamiento.': 'Consult your doctor before starting any training program.',
        'Siguiente':        'Next',
        'Anterior':         'Previous',
        'Guardar perfil':   'Save profile',
        'Saltar':           'Skip',
        'Si eres menor de 18 años, necesitas': 'If you are under 18, you need',
        'autorización de un padre o tutor': 'authorization from a parent or guardian',
        'para usar StrongVision.': 'to use StrongVision.',
        'Ej: tengo equipo en casa, no puedo correr, me duele la espalda al agacharme...': 'E.g.: I have home equipment, I can\'t run, my back hurts when bending...',

        /* ── Perfil tooltips (TIPS) ── */
        'Nivel 1 · Inicio':     'Level 1 · Beginner',
        'Nivel 2 · Progresión': 'Level 2 · Progression',
        'Nivel 3 · Elite':      'Level 3 · Elite',
        'Menos de 6 meses entrenando. El cuerpo responde muy bien a cualquier estímulo. Enfoque en técnica correcta y construir el hábito.': 'Less than 6 months training. The body responds well to any stimulus. Focus on correct technique and building the habit.',
        'Entre 6 meses y 2 años. Ya dominas los movimientos básicos. Mayor énfasis en progresión de cargas y volumen de trabajo semanal.': 'Between 6 months and 2 years. You already master basic movements. Greater emphasis on load progression and weekly volume.',
        'Más de 2 años de entrenamiento consistente. Rutinas con periodización, técnicas avanzadas (drop sets, RPE, etc.) y control fino de variables.': 'More than 2 years of consistent training. Routines with periodization, advanced techniques (drop sets, RPE, etc.) and fine-grained variable control.',
        'repeticiones':  'reps',
        'series':        'sets',
        'descanso':      'rest',
        'carga':         'load',
        'dieta':         'diet',
        'proteína':      'protein',
        'plazo':         'timeline',
        'pesas':         'weights',
        'enfoque':       'focus',
        'Es el crecimiento del músculo. Tu rutina se enfoca en ejercicios con peso moderado y varias repeticiones para que el músculo crezca y se haga más grande.': 'Muscle growth. Your routine focuses on exercises with moderate weight and multiple reps so your muscles grow larger.',
        'Es la capacidad de mover cargas pesadas. Tu rutina usará mucho peso y pocas repeticiones para que tu cuerpo se vuelva más potente.': 'The ability to move heavy loads. Your routine will use heavy weight and few reps to make your body more powerful.',
        'Es reducir la grasa que cubre el músculo para que se vea marcado. Se combina ejercicio con un buen control de la alimentación.': 'Reducing the fat covering the muscle so it looks defined. Combines exercise with good nutrition control.',
        'Es la capacidad de ejercitarte por más tiempo sin agotarte. Tu rutina tendrá ejercicios continuos que fortalecen el corazón y los pulmones.': 'The ability to exercise longer without tiring. Your routine will have continuous exercises that strengthen the heart and lungs.',
        'Es darle firmeza al músculo sin que crezca demasiado. Ideal si quieres verte bien y sentirte activo sin ganar mucho volumen.': 'Giving firmness to the muscle without too much growth. Ideal if you want to look good and feel active without adding much volume.',
        'Es bajar el peso corporal quemando más calorías de las que consumes. Tu rutina combinará cardio y ejercicios para acelerar ese proceso.': 'Reducing body weight by burning more calories than you consume. Your routine will combine cardio and exercises to accelerate the process.',
        'Es cambiar tu cuerpo al mismo tiempo: perder grasa y ganar músculo. Es el proceso más completo pero también el que más paciencia requiere.': 'Transforming your body simultaneously: losing fat and gaining muscle. The most complete process but the one requiring the most patience.',
        'Muy alta':  'Very high',
        'Moderado':  'Moderate',
        'Alto':      'High',
        'Corto':     'Short',
        'Leve':      'Light',
        'Equilibrada': 'Balanced',
        'Déficit':   'Deficit',
        '≈ mantenimiento': '≈ maintenance',
        'Largo':     'Long',

        /* ── Registration form ── */
        'Correo electrónico *':  'Email *',
        'Ciudad *':              'City *',
        'Dirección *':           'Address *',
        'Tu nombre completo':    'Your full name',
        'correo@ejemplo.com':    'email@example.com',
        'Repite tu contraseña':  'Repeat your password',
        'Comienza gratis. Sin tarjeta de crédito.': 'Get started free. No credit card required.',

        /* ── Admin page ── */
        'Panel de Administración': 'Administration Panel',
        'Gestiona ejercicios, plantillas, usuarios y reportes del sistema.': 'Manage exercises, templates, users, and system reports.',
        'Acceso restringido':       'Restricted access',
        'No tienes permisos de administrador para acceder a este panel.': 'You do not have admin permissions to access this panel.',
        'Volver al dashboard':      'Back to dashboard',
        'Vista usuario':            'User view',
        'Plantillas':               'Templates',
        'Correos':                  'Emails',
        'Mensajes':                 'Messages',
        'Reportes':                 'Reports',
        'Finanzas':                 'Finance',
        'Usuarios totales':         'Total users',
        'Rutinas en dataset':       'Routines in dataset',
        'Filtros de seguridad':     'Safety filters',
        'AG · Individuos':          'GA · Individuals',
        'AG · Generaciones':        'GA · Generations',
        'Ejercicios catalogados':   'Cataloged exercises',
        'Estado del sistema':       'System status',
        'Catálogo de ejercicios':   'Exercise catalog',
        'Agrega, edita o elimina ejercicios del sistema': 'Add, edit, or delete exercises from the system',
        '+ Nuevo ejercicio':        '+ New exercise',
        'Buscar por nombre...':     'Search by name...',
        'Todos los grupos':         'All groups',
        'Nombre':                   'Name',
        'Grupo':                    'Group',
        'Impacto':                  'Impact',
        'Carga axial':              'Axial load',
        'Acciones':                 'Actions',
        'Plantillas de rutinas (Dataset Heurístico)': 'Routine Templates (Heuristic Dataset)',
        '540 rutinas base · Vista de solo lectura': '540 base routines · Read-only view',
        'Todos los niveles':        'All levels',
        'Todos los objetivos':      'All goals',
        'Todas las patologías':     'All pathologies',
        'Sin patología':            'No pathology',
        'Hernia lumbar':            'Lumbar hernia',
        'Hipertensión':             'Hypertension',
        'Edad':                     'Age',
        'Género':                   'Gender',
        'Patología':                'Condition',
        'Sesiones':                 'Sessions',
        'Días':                     'Days',
        'Gestión de usuarios':      'User management',
        'Activa/desactiva acceso y gestiona suscripciones': 'Activate/deactivate access and manage subscriptions',
        'Buscar por nombre, correo o cédula…': 'Search by name, email, or ID…',
        'Cédula':                   'ID',
        'Correo':                   'Email',
        'Estado':                   'Status',
        'Suscripción vence':        'Subscription expires',
        'Registrado':               'Registered',
        'Rol':                      'Role',
        'Ingresos del mes':         'Monthly income',
        'Usuarios activos':         'Active users',
        'Suscripciones vencidas':   'Expired subscriptions',
        'Total recaudado':          'Total collected',
        'Pagos por mes':            'Payments by month',
        'Estado de pago por usuario': 'Payment status by user',
        'Historial de pagos y suscripciones': 'Payment and subscription history',
        'Usuario':                  'User',
        'Último pago':              'Last payment',
        'Monto':                    'Amount',
        'Enviar correo':            'Send email',
        'Destinatario':             'Recipient',
        'Todos los activos':        'All active',
        'Buscar destinatario':      'Search recipient',
        'Asunto *':                 'Subject *',
        'Cuerpo del mensaje *':     'Message body *',
        'Limpiar':                  'Clear',
        'Plantillas predeterminadas': 'Default templates',
        'Clic para cargar · edita antes de enviar': 'Click to load · edit before sending',
        'Historial de envíos':      'Send history',
        'No hay correos enviados aún.': 'No emails sent yet.',
        'Todos':                    'All',
        'Activos':                  'Active',
        'Vencidos':                 'Expired',
        'Inactivos':                'Inactive',
        'Resumen':                  'Summary',
        'Alertas':                  'Alerts',
        'Recientes':                'Recent',
        'Reportes del sistema':     'System reports',
        'Estadísticas agregadas de uso': 'Aggregated usage statistics',
        'Distribución de objetivos (todos los usuarios)': 'Goal distribution (all users)',
        'Distribución por nivel':   'Distribution by level',
        'Cobertura de casos de prueba': 'Test case coverage',
        'Casos definidos en el documento de pruebas (RFU + RFA)': 'Cases defined in the test document (RFU + RFA)',
        'Construido bajo normas de calidad': 'Built under quality standards',
        'Cada módulo es probado con casos formales y métricas de calidad.': 'Each module is tested with formal cases and quality metrics.',
        'Adecuación funcional:':    'Functional adequacy:',
        '>90% requisitos cumplidos': '>90% requirements met',
        'Usabilidad:':              'Usability:',
        'Heurísticas de Nielsen + cuestionario SUS': 'Nielsen heuristics + SUS questionnaire',
        'Fiabilidad:':              'Reliability:',
        '≤2 errores críticos al mes': '≤2 critical errors per month',
        'Eficiencia:':              'Efficiency:',
        'Respuesta <2 segundos':    'Response <2 seconds',
        'Mantenibilidad:':          'Maintainability:',
        'Código modular y documentado': 'Modular and documented code',
        'Portabilidad:':            'Portability:',
        'Diseño responsive 100% layouts': '100% responsive layout design',
        'Pruebas (50 TC)':          'Tests (50 TC)',
        'Mensajes de usuarios':     'User messages',
        'Consultas y comentarios enviados desde Mi Cuenta': 'Inquiries and comments sent from My Account',
        'Marcar todos leídos':      'Mark all as read',
        'Aún no hay mensajes de usuarios.': 'No user messages yet.',
        'Nuevo ejercicio':          'New exercise',
        'Nombre *':                 'Name *',
        'Grupo *':                  'Group *',
        'Equipo *':                 'Equipment *',
        'Sin equipo':               'No equipment',
        'Mancuerna':                'Dumbbell',
        'Barra':                    'Bar',
        'Polea':                    'Cable',
        'Máquina':                  'Machine',
        'Bajo':                     'Low',
        'Medio':                    'Medium',
        'Alto':                     'High',
        'Implica carga axial sobre la columna': 'Involves axial load on the spine',
        'Gestionar suscripción':    'Manage subscription',
        'Fecha de vencimiento':     'Expiration date',
        'Monto mensual (COP)':      'Monthly amount (COP)',
        'Buscar plantilla…':        'Search template…',
        'Nombre, correo o cédula…': 'Name, email, or ID…',
        'Asunto del correo...':     'Email subject...',
        'Escribe el mensaje aquí, o selecciona una plantilla a la derecha…': 'Write your message here, or select a template on the right…',
        'Buscar por nombre o grupo muscular...': 'Search by name or muscle group...',
        'Consultar…':               'Query…',
        'Sin rutina':               'No routine',
        'Sin perfil':               'No profile',

        /* ── Exercise names ── */
        'Press de banca con barra':              'Barbell Bench Press',
        'Press inclinado con mancuerna':         'Incline Dumbbell Press',
        'Press declinado con barra':             'Decline Barbell Press',
        'Aperturas con mancuerna':               'Dumbbell Flyes',
        'Cruce de poleas':                       'Cable Crossover',
        'Flexiones de pecho':                    'Push-ups',
        'Press en máquina Smith':                'Smith Machine Press',
        'Pec deck (contractor)':                 'Pec Deck (Contractor)',
        'Peso muerto convencional':              'Conventional Deadlift',
        'Dominadas asistidas':                   'Assisted Pull-ups',
        'Remo con barra':                        'Barbell Row',
        'Remo con mancuerna a una mano':         'Single-Arm Dumbbell Row',
        'Jalón al pecho en polea':               'Lat Pulldown',
        'Remo sentado en polea':                 'Seated Cable Row',
        'Hiperextensiones lumbares':             'Back Hyperextensions',
        'Remo en máquina T-bar':                 'T-Bar Row Machine',
        'Sentadilla con barra':                  'Barbell Squat',
        'Sentadilla goblet con mancuerna':       'Dumbbell Goblet Squat',
        'Prensa de piernas 45°':                 'Leg Press 45°',
        'Zancadas con mancuernas':               'Dumbbell Lunges',
        'Extensión de cuádriceps en máquina':    'Machine Quad Extension',
        'Curl femoral acostado':                 'Lying Leg Curl',
        'Elevación de gemelos de pie':           'Standing Calf Raise',
        'Peso muerto rumano':                    'Romanian Deadlift',
        'Hip thrust con barra':                  'Barbell Hip Thrust',
        'Sentadilla búlgara':                    'Bulgarian Split Squat',
        'Press militar con barra':               'Barbell Military Press',
        'Press de hombro con mancuerna sentado': 'Seated Dumbbell Shoulder Press',
        'Elevaciones laterales':                 'Lateral Raises',
        'Elevaciones frontales':                 'Front Raises',
        'Pájaros (rear delt fly)':               'Rear Delt Fly',
        'Face pull en polea':                    'Cable Face Pull',
        'Press Arnold':                          'Arnold Press',
        'Curl de bíceps con barra':              'Barbell Bicep Curl',
        'Curl alterno con mancuerna':            'Alternating Dumbbell Curl',
        'Curl martillo':                         'Hammer Curl',
        'Extensión de tríceps en polea':         'Tricep Pushdown',
        'Press francés con barra Z':             'EZ Bar French Press',
        'Fondos en banco':                       'Bench Dips',
        'Patada de tríceps':                     'Tricep Kickback',
        'Plancha frontal':                       'Front Plank',
        'Crunch abdominal':                      'Abdominal Crunch',
        'Elevación de piernas colgado':          'Hanging Leg Raise',
        'Russian twist':                         'Russian Twist',
        'Abdominales en máquina':                'Machine Ab Crunch',
        'Plancha lateral':                       'Side Plank',
        'Bicicleta abdominal':                   'Bicycle Crunch',
        'Caminata en cinta':                     'Treadmill Walk',
        'Trote en cinta':                        'Treadmill Jog',
        'Bicicleta estática':                    'Stationary Bike',
        'Elíptica':                              'Elliptical',
        'Remo ergómetro':                        'Rowing Machine',
        'Saltos con cuerda':                     'Jump Rope',
    };

    var DICTS = { 'en-US': EN };

    // ── API pública ───────────────────────────────────────────
    function getLang() {
        return localStorage.getItem('sv_lang') || 'es-CO';
    }

    function t(key) {
        var d = DICTS[getLang()];
        return (d && d[key]) ? d[key] : key;
    }

    // ── Motor de traducción ───────────────────────────────────
    var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, SVG: 1, INPUT: 1, TEXTAREA: 1, SELECT: 1 };

    function applyTranslations(lang) {
        if (!lang || !DICTS[lang]) return;
        var dict = DICTS[lang];

        // Índice insensible a mayúsculas/minúsculas
        var lower = {};
        Object.keys(dict).forEach(function (k) { lower[k.toLowerCase()] = k; });

        function resolve(text) {
            if (!text) return null;
            if (dict[text]) return dict[text];
            var lo = text.toLowerCase();
            return lower[lo] ? dict[lower[lo]] : null;
        }

        // 1. Nodos de texto
        var walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (n) {
                    var p = n.parentElement;
                    if (!p) return NodeFilter.FILTER_REJECT;
                    if (SKIP[p.tagName]) return NodeFilter.FILTER_REJECT;
                    if (p.closest('[data-i18n-skip]')) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );
        var node, batch = [];
        while ((node = walker.nextNode())) batch.push(node);
        batch.forEach(function (n) {
            var raw     = n.nodeValue;
            var trimmed = raw.trim();
            if (trimmed) {
                var tr = resolve(trimmed);
                if (tr) n.nodeValue = raw.replace(trimmed, tr);
            }
        });

        // 2. Placeholders
        document.querySelectorAll('[placeholder]').forEach(function (el) {
            var v = el.getAttribute('placeholder');
            var tr = resolve(v);
            if (tr) el.setAttribute('placeholder', tr);
        });

        // 3. aria-label
        document.querySelectorAll('[aria-label]').forEach(function (el) {
            var v = el.getAttribute('aria-label');
            var tr = resolve(v);
            if (tr) el.setAttribute('aria-label', tr);
        });

        // 4. <title>
        var tr = resolve(document.title);
        if (tr) document.title = tr;

        // 5. Actualizar botones de idioma
        updateLangBtns(lang);
    }

    // ── Botones de idioma ─────────────────────────────────────
    function updateLangBtns(lang) {
        var label = lang === 'en-US' ? 'ES' : 'EN';
        document.querySelectorAll('.lang-toggle-label').forEach(function (el) {
            el.textContent = label;
        });
    }

    // Inyecta botón de idioma en el topbar de las páginas internas
    function injectLangBtn(lang) {
        var tbRight = document.querySelector('.tb-right') || document.querySelector('.wz-topbar-right');
        if (!tbRight || document.getElementById('i18n-lang-btn')) return;
        var btn = document.createElement('button');
        btn.id = 'i18n-lang-btn';
        btn.className = 'theme-btn';
        btn.setAttribute('aria-label', 'Cambiar idioma');
        btn.onclick = function () { window.SV_I18N.toggleLang(); };
        btn.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>' +
            '<span class="lang-toggle-label">' + (lang === 'en-US' ? 'ES' : 'EN') + '</span>';
        tbRight.insertBefore(btn, tbRight.firstChild);
    }

    // ── Confirmación delete: acepta ES y EN ───────────────────
    window.SV_I18N_CONFIRM_WORD = function () {
        return getLang() === 'en-US' ? 'DELETE' : 'ELIMINAR';
    };

    // ── Init ─────────────────────────────────────────────────
    function init() {
        function run() {
            var lang = getLang();
            applyTranslations(lang);
            injectLangBtn(lang);
            // Re-apply after dynamic content (exercises, admin tables) is injected
            if (lang !== 'es-CO') {
                var _t;
                new MutationObserver(function () {
                    clearTimeout(_t);
                    _t = setTimeout(function () { applyTranslations(getLang()); }, 200);
                }).observe(document.body, { childList: true, subtree: true });
            }
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', run);
        } else {
            run();
        }
    }

    window.SV_I18N = {
        t:          t,
        apply:      applyTranslations,
        getLang:    getLang,
        toggleLang: function () {
            var cur = getLang();
            localStorage.setItem('sv_lang', cur === 'en-US' ? 'es-CO' : 'en-US');
            location.reload();
        }
    };
    init();
})();
