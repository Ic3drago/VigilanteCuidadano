# VigilanteCiudadano 🛡️

**VigilanteCiudadano** es una plataforma moderna de seguridad ciudadana y auxilio de emergencias en Bolivia, diseñada para integrar reportes seguros de ciudadanos con el Centro de Mando Operacional y las terminales tácticas de la policía (**Sistema BOL-110**). 

El sistema utiliza principios avanzados de **privacidad por diseño (Privacy by Design)** a través de criptografía de conocimiento cero (**Zero-Knowledge**) en combinación con tecnologías de geolocalización satelital en tiempo real e inteligencia artificial para la clasificación inteligente de incidentes.

---

## 🚀 Arquitectura y Características Clave

1. **Cifrado Zero-Knowledge en el Cliente**:
   * Las descripciones de los incidentes se cifran directamente en el dispositivo del ciudadano (navegador) utilizando la clave derivada localmente por el usuario mediante **PBKDF2** (100,000 iteraciones) y el algoritmo simétrico **AES-GCM de 256 bits**.
   * La clave y la descripción sin cifrar **nunca se envían al servidor**. El servidor policial almacena la carga encriptada y un hash SHA-256 de integridad.

2. **Triaje y Clasificación Inteligente de Emergencias (IA)**:
   * Integra un agente de IA en lenguaje natural adaptado al modismo y contexto geográfico de Bolivia (ej. identifica palabras como "motochorro", "clefero", "pacos", "bloqueo", "La Ceja", "Equipetrol").
   * Clasifica los incidentes automáticamente en tipos (`ROBO_ATRACO`, `ACCIDENTE_TRAFICO`, `DISTURBIOS`, `VIOLENCIA_DOMESTICA`, `AGRESION`, `SOSPECHOSO`, `OTRO`) y niveles de gravedad (`BAJO`, `MODERADO`, `ALTO`, `CRITICO`), sugiriendo un consejo legal rápido adaptado al Código Penal Boliviano.

3. **Geolocalización y Seguimiento Satelital en Tiempo Real**:
   * Sincroniza la ubicación de patrullas policiales mediante **Supabase Realtime** y **PostGIS**.
   * El mapa táctico representa el desplazamiento físico del móvil (`PAC-402`) hacia el lugar del incidente de manera fluida y con estimación en tiempo real (ETA).

4. **Terminales de Doble Rol (RBAC)**:
   * **Terminal del Oficial (Ruta `/oficial`)**: Diseñado como consola móvil táctica de patrulla, con un mapa interactivo de Google Maps que guía al oficial desde su posición hasta el incidente, con cronómetros de intervención.
   * **Centro de Mando del Operador (Ruta `/mapa`)**: Consola de alta densidad de datos para despachadores centrales de la policía que monitorean la flota activa en el radar vectorial e interceptan incidentes en cola.

---

## 🛠️ Pila Tecnológica

* **Frontend & Backend**: Next.js 14 (App Router) con TypeScript
* **Estilos**: Tailwind CSS con iconos de Lucide React
* **Base de Datos**: PostgreSQL en Supabase con la extensión espacial **PostGIS** habilitada y políticas RLS (Row Level Security) activas
* **Criptografía**: Web Crypto API (cliente) y librerías de hash nativas de Node.js (servidor)
* **Mapas**: API de Google Maps con `@react-google-maps/api`

---

## 👥 Credenciales de Prueba (Match en Base de Datos)

Para acceder a las terminales autenticadas con soporte de sesión persistente (cookies seguras HttpOnly), use los siguientes datos:

| Rol Policial | Ruta de Acceso | Identificador (Usuario / Placa) | PIN / Contraseña |
| :--- | :--- | :--- | :--- |
| **Oficial de Patrulla** | [`/oficial`](file:///home/icedrago/Escritorio/POli/app/oficial) | `PAC-402` | `123456` |
| **Operador del Centro de Mando** | [`/mapa`](file:///home/icedrago/Escritorio/POli/app/mapa) | `SGT. QUISPE` | `654321` |

---

## ⚙️ Estructura del Proyecto

```markdown
├── app/                  # Rutas principales de Next.js
│   ├── api/              # Endpoints de la API
│   │   ├── agente-ia/    # Triaje de IA y clasificación de riesgos
│   │   ├── auth/         # Login, logout y estado de sesión
│   │   └── chat/         # Asistente chatbot ciudadano
│   ├── ciudadano/        # Vista amigable de explicación al ciudadano
│   ├── oficial/          # Terminal táctica de patrullas oficiales
│   ├── mapa/             # Consola del operador del Centro de Mando
│   └── reportar/         # Formulario/Asistente de reporte ciudadano
├── components/           # Componentes UI reutilizables
│   ├── ChatAsistente.tsx # Widget de chatbot ciudadano flotante
│   ├── Header.tsx        # Cabecera de navegación institucional
│   ├── MapaPatrullas.tsx # Radar vectorial y controles del despachador
│   └── TerminalChat.tsx  # Interfaz conversacional segura
├── database/             # Esquemas de base de datos y migraciones
│   ├── schema.sql        # Esquema relacional con PostGIS
│   ├── migration_auth.sql# Parche de autenticación y políticas RLS
│   └── run_migration.js  # Script de migración y población de datos semilla
├── utils/                # Utilidades de criptografía y clientes de base de datos
├── middleware.ts         # Middleware para control de acceso basado en roles (RBAC)
└── README.md             # Documentación principal
```

---

## 🏃 Instalación y Puesta en Marcha Local

### Prerrequisitos
1. Tener **Node.js** (versión 18 o superior) instalado.
2. Contar con una base de datos PostgreSQL compatible con PostGIS (ej. Supabase) y configurar las credenciales en el archivo `.env.local` en la raíz del proyecto.

### Pasos de Instalación
1. Instalar las dependencias del proyecto:
   ```bash
   npm install
   ```

2. Ejecutar las migraciones DDL y sembrar los datos de oficiales y operadores:
   ```bash
   node database/run_migration.js
   ```

3. Levantar el servidor de desarrollo local:
   ```bash
   npm run dev
   ```

4. Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

---

## 🚨 Canales y Números de Emergencia en Bolivia (BOL-110)

El chatbot del sistema y el portal están configurados para derivar emergencias a los siguientes números telefónicos directos:

* **Radio Patrullas (Central de Emergencias)**: `110` (Emergencias generales)
* **PAC (Patrulla de Auxilio y Cooperación Ciudadana)**: `120` (o `800-14-0205`)
* **Bomberos (Emergencias Médicas e Incendios)**: `119`
* **FELCC (Fuerza Especial de Lucha Contra el Crimen)**: `122`
* **FELCV (Fuerza Especial de Lucha Contra la Violencia Doméstica)**: `120` / Línea gratuita `800-14-0348`
* **Tránsito**: `121`
* **Cruz Roja / Ambulancias**: `123` o `2204990`
# VigilanteCuidadano
