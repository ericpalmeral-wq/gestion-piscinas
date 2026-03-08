# GestiPool

Sistema de gestión de piscinas desarrollado con **Angular 21** y **Firebase**.

## 🎯 Descripción

Esta aplicación permite gestionar múltiples piscinas, incluyendo:
- Registro y edición de información de piscinas
- Monitoreo de temperatura y estado
- Autenticación de usuarios con Firebase
- Base de datos en tiempo real con Firestore

## 🛠️ Tecnologías

- **Angular**: 21.1.3
- **TypeScript**: Última versión
- **Firebase**: Autenticación y Firestore
- **RxJS**: Programación reactiva
- **Vitest**: Testing

## 📋 Requisitos

- Node.js v20 o superior
- npm o yarn
- Cuenta de Firebase (gratuita en [firebase.google.com](https://firebase.google.com))

## 🚀 Instalación

1. Clonar el repositorio
```bash
git clone <repository-url>
cd gestion-piscinas
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar Firebase
```bash
cp src/environments/firebase.config.template.ts src/environments/firebase.config.ts
```
- Editar `src/environments/firebase.config.ts`
- Reemplazar las credenciales con tu proyecto de Firebase

## 🔧 Configuración de Firebase

Para obtener tus credenciales de Firebase:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a Configuración del proyecto → Aplicaciones web
4. Copia la configuración y reemplázala en `src/environments/firebase.config.ts`

> ⚠️ **Importante**: El archivo `firebase.config.ts` está ignorado por git para proteger tus credenciales. Nunca subas credenciales reales al repositorio.

## 📦 Scripts disponibles

### Desarrollo
```bash
ng serve
```
Inicia el servidor de desarrollo en `http://localhost:4200/`

### Compilación
```bash
ng build
```
Compila el proyecto para producción

### Tests
```bash
ng test
```
Ejecuta la suite de tests

## 📂 Estructura del Proyecto

```
src/
├── app/
│   ├── app.config.ts           # Configuración de proveedores
│   ├── app.routes.ts           # Rutas principales
│   ├── app.ts                  # Componente raíz
│   ├── components/             # Componentes de la aplicación
│   │   ├── home/               # Página principal
│   │   ├── login/              # Autenticación
│   │   ├── lista-piscinas/     # Listado de piscinas
│   │   ├── piscina-detalle/    # Detalle de piscina
│   │   ├── informes/           # Gestión de informes
│   │   └── ...                 # Otros componentes
│   ├── guards/                 # Guards de autenticación y roles
│   ├── models/                 # Interfaces y tipos
│   └── services/               # Servicios (Firebase, API)
├── environments/
│   ├── firebase.config.ts          # Configuración de Firebase (ignorado)
│   └── firebase.config.template.ts # Plantilla de configuración
├── index.html
├── main.ts
└── styles.css
```

## 🎨 Características Principales

- ✅ Arquitectura basada en componentes
- ✅ Standalone components (Angular 21)
- ✅ Integración con Firebase Authentication
- ✅ Base de datos Firestore
- ✅ TypeScript strict mode
- ✅ Routing moderna

## 🔐 Seguridad

Recuerda:
- **No** incluyas credenciales de Firebase en el control de versiones
- Usa variables de entorno para información sensible
- Configura reglas de Firestore adecuadamente

## 📖 Documentación

- [Angular Documentation](https://angular.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Angular Fire Documentation](https://github.com/angular/angularfire)

## 🤝 Contribución

Este proyecto sigue las guías de Angular best practices. Antes de hacer cambios:
1. Crea una rama para tu característica
2. Sigue las convenciones de código Angular
3. Asegúrate de que los tests pasen

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

---

**GestiPool** - Sistema de Gestión de Piscinas © 2026
