# PetSignal 🐾

Una aplicación móvil para gestionar alertas de mascotas perdidas y encontradas, desarrollada con React Native y Expo.

## 🚀 Características

- **Autenticación**: Sistema de login y registro con HTTP Basic Auth
- **Alertas**: Gestión de mascotas perdidas y encontradas
- **Perfil de usuario**: Edición de datos personales
- **Navegación**: Sistema de navegación condicional basado en autenticación
- **Conectividad**: Soporte para desarrollo local y producción

## 📱 Tecnologías

- React Native
- Expo
- React Navigation
- Axios (cliente HTTP)
- Expo SecureStore (almacenamiento seguro)

## 🛠️ Instalación y Configuración

### Prerrequisitos

- Node.js 16 o superior
- Expo CLI
- Dispositivo físico o simulador

### Configuración inicial

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd petsignal
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar red para desarrollo**
   ```bash
   # Copiar archivo de configuración de red
   cp src/utils/network.config.example.js src/utils/network.config.js
   ```

4. **Editar configuración de red**
   
   Abrir `src/utils/network.config.js` y actualizar:
   ```javascript
   export const NETWORK_CONFIG = {
     DEV_IP: 'TU_IP_LOCAL', // Encuentra tu IP con ipconfig/ifconfig
     API_PORT: 8080,
     OVERRIDE_IP: null,
     PRODUCTION_URL: 'https://tu-servidor-produccion.com'
   };
   ```

5. **Encontrar tu IP local**
   
   En macOS/Linux:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   
   En Windows:
   ```bash
   ipconfig
   ```

### Ejecutar la aplicación

1. **Iniciar el servidor de desarrollo**
   ```bash
   npx expo start
   ```

2. **Ejecutar en dispositivo**
   - Escanear el código QR con Expo Go
   - O presionar `i` para iOS Simulator / `a` para Android Emulator

## 🔧 Desarrollo

### Estructura del proyecto

```
src/
├── components/common/    # Componentes reutilizables
├── context/             # Contextos de React (Auth)
├── navigation/          # Configuración de navegación
├── screens/            # Pantallas de la aplicación
│   ├── auth/           # Login y registro
│   ├── home/           # Pantalla principal
│   └── profile/        # Perfil de usuario
├── services/           # Servicios API
└── utils/              # Utilidades y configuración
```

### Configuración de API

El proyecto usa un sistema de configuración flexible:

- **Desarrollo**: Usa IP local configurada en `network.config.js`
- **Producción**: Usa URL configurada en `PRODUCTION_URL`

### Debugging

La aplicación incluye herramientas de debug en la pantalla de login:

- **Info**: Información de red y conectividad
- **Test**: Prueba de conexión a la API
- **Datos**: Visualización de datos almacenados localmente

## 📋 API

La aplicación se conecta a una API REST que debe proporcionar:

### Endpoints requeridos

- `POST /users/register` - Registro de usuarios
- `POST /users/login` - Autenticación
- `GET /users/profile` - Obtener perfil
- `PUT /users/profile` - Actualizar perfil
- `GET /alerts` - Listar alertas (con paginación)

### Autenticación

Usa HTTP Basic Authentication con username/password.

## 🚀 Deployment

### Para desarrollo

1. Asegurar que tu API backend esté ejecutándose
2. Configurar `network.config.js` con tu IP local
3. Ejecutar `npx expo start`

### Para producción

1. Actualizar `PRODUCTION_URL` en la configuración
2. Construir con `expo build`
3. Publicar en stores correspondientes

## 🔒 Seguridad

- Las credenciales se almacenan de forma segura usando Expo SecureStore
- Las IPs de desarrollo están en archivos gitignored
- No se exponen datos sensibles en el código fuente

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## 📞 Soporte

Si tienes problemas de conectividad:

1. Verifica que tu dispositivo esté en la misma red WiFi
2. Usa las herramientas de debug en la pantalla de login
3. Revisa la configuración en `network.config.js`
4. Asegurar que el backend esté ejecutándose en el puerto correcto

---

Desarrollado con ❤️ para ayudar a encontrar mascotas perdidas
