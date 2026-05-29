================================================================
  CalcNotas — Calculadora de Notas Universitaria
  Proyecto Final · Introducción a Sistemas I
================================================================

DESCRIPCIÓN
-----------
CalcNotas es una aplicación web local que permite calcular notas
finales de cursos universitarios con zonas y examen, y simular
qué nota se necesita en el examen para aprobar.

No requiere servidor, backend ni conexión a internet (solo las
fuentes de Google Fonts necesitan conexión la primera vez).

----------------------------------------------------------------

ESTRUCTURA DE ARCHIVOS
----------------------
calculadora-notas/
├── index.html    →  Estructura HTML de la app
├── style.css     →  Estilos, tema dark, animaciones, print
├── app.js        →  Lógica de cálculo y manipulación del DOM
└── README.txt    →  Este archivo

----------------------------------------------------------------

CÓMO ABRIR
----------
1. Abrí la carpeta "calculadora-notas/"
2. Hacé doble clic en "index.html"
3. Se abre directamente en tu navegador (Chrome, Firefox, Edge)

No necesitás instalar nada.

----------------------------------------------------------------

CÓMO USAR
---------
1. AGREGAR UN CURSO
   - Escribí el nombre del curso
   - Elegí cuántas zonas tiene (1 a 4)
   - Ingresá el peso de las zonas en % (ej. 60)
     El peso del examen se calcula solo (ej. 40)
   - Ingresá las notas de cada zona
   - OPCIONAL: ingresá la nota del examen
     · Si la dejás vacía → se activa el simulador
   - Clic en "Agregar curso"

2. LEER LOS RESULTADOS
   · Verde  → Aprobado (nota ≥ 61)
   · Rojo   → Reprobado (nota < 61)
   · Amarillo → Simulador: te dice cuánto necesitás en el examen
   · Imposible → La nota de zona es tan baja que no hay examen
                 posible que alcance para aprobar

3. RESUMEN DEL SEMESTRE
   Aparece automáticamente al agregar al menos un curso.
   Muestra aprobados, reprobados y promedio general
   (solo de cursos con nota de examen ingresada).

4. GUARDAR / IMPRIMIR
   Clic en "Guardar PDF" (esquina superior derecha).
   El PDF incluye solo la lista de cursos y el resumen.

5. ELIMINAR UN CURSO
   Clic en el botón "✕" de la tarjeta del curso.

----------------------------------------------------------------

FÓRMULA DE CÁLCULO
------------------
  Promedio zona = (Z1 + Z2 + ... + Zn) / n
  Aporte zona   = Promedio zona × (PesoZona / 100)
  Nota final    = Aporte zona + NotaExamen × (PesoExamen / 100)
  Aprobado si   = Nota final ≥ 61

  Simulador (sin nota de examen):
    Nota necesaria = (61 - Aporte zona) / (PesoExamen / 100)
    · Si ≤ 0     → ya aprobás con la zona
    · Si 1–100   → esa es la nota que necesitás
    · Si > 100   → imposible aprobar

----------------------------------------------------------------

TECNOLOGÍAS USADAS
------------------
  · HTML5 semántico
  · CSS3 (variables, grid, flexbox, animaciones, @media print)
  · JavaScript vanilla (ES2020, sin frameworks)
  · Google Fonts: Syne + DM Sans

----------------------------------------------------------------

AUTOR
-----
  Proyecto Final de Introducción a Sistemas I
  Generado con CalcNotas · 2025

================================================================
