<div align="center">
  <img src="https://raw.githubusercontent.com/chameleon-nexus/claude-code-vscode/main/media/icon.svg" alt="Chameleon Logo" width="120px">
  <h1>Asistente IA Chameleon</h1>
  <p>
    <strong>Aprovecha la IA de vanguardia para remodelar los flujos de trabajo de codificación y creativos. Tu estación de trabajo IA local de código abierto y extensible.</strong>
  </p>
  <p>
    <a href="../README.md">English</a> | <a href="./README.es.md">Español</a> | <a href="./README.ja.md">日本語</a> | <a href="./README.de.md">Deutsch</a> | <a href="./README.fr.md">Français</a> | <a href="./README.zh.md">简体中文</a> | <a href="./README.pt.md">Português</a> | <a href="./README.vi.md">Tiếng Việt</a> | <a href="./README.hi.md">हिन्दी</a> | <a href="./README.ko.md">한국어</a> | <a href="./README.ru.md">Русский</a> | <a href="./README.ar.md">العربية</a>
  </p>
</div>

---

## 🦎 ¿Qué es Chameleon?

Chameleon es mucho más que otra ventana de chat de IA. Es una extensión de VS Code de código abierto potente que transforma tu editor en un notebook profesional, local y impulsado por IA.

Diseñado para desarrolladores, escritores e investigadores, Chameleon te devuelve el control de la IA. Se integra profundamente en tu flujo de trabajo, permitiéndote conectarte sin problemas a cualquier proveedor de IA de terceros (como OpenAI, Google Gemini, DeepSeek, etc.), gestionar modelos locales y en la nube, y construir tu propia cadena de herramientas de IA privada en el entorno familiar de VS Code.

## ✨ Características principales

* **🎯 6 motores de IA, 20+ modelos seleccionados**: ¡Libérate del bloqueo de proveedores! Soporte para OpenRouter, DeepSeek, Google, Volcengine, Azure, Ollama y otros 6 motores de IA principales, cubriendo 20+ modelos cuidadosamente seleccionados, incluyendo los últimos GPT-4o, Claude 3.5 Sonnet, DeepSeek V3, etc.
* **🧠 5 configuraciones de modelos especializadas**: Configuración inteligente de modelos de texto corto, texto largo, pensamiento, imagen y video, permitiendo que cada tarea use el modelo de IA más adecuado.
* **🎨 Soporte de IA multimodal**: No solo soporta conversaciones de texto, sino también comprensión de imágenes, análisis de video, reconocimiento OCR y otras capacidades de IA multimedia.
* **⚡ Enrutamiento inteligente de modelos**: Selección automática del mejor modelo basada en la complejidad de la tarea, longitud del contenido y tipo de modalidad para un equilibrio perfecto entre rendimiento y costo.
* **📓 Interfaz de notebook profesional**: Ve más allá de simples Q&A. Organiza tus tareas impulsadas por IA en un notebook de texto enriquecido que combina perfectamente Markdown, fragmentos de código y prompts de IA.
* **🔒 Diseño centrado en la privacidad**: Soporta la ejecución de modelos locales, dándote control total sobre la seguridad de los datos mientras ofrece la conveniencia de las APIs en la nube.
* **🎛️ Integración profunda del IDE**: Se siente como una funcionalidad nativa de VS Code. Accede a herramientas de IA potentes directamente a través de menús contextuales, code lenses y paneles de barra lateral dedicados.
* **🌍 Soporte de 12 idiomas**: Experiencia internacional completa en chino, inglés, japonés, alemán, francés, español, portugués, vietnamita, hindi, coreano, ruso y árabe.

## 🚀 Métodos de instalación

Elige el método de instalación que mejor se adapte a tus necesidades:

### 📦 Método 1: VS Code Marketplace (Recomendado)

**La forma más fácil de instalar Chameleon - perfecto para la mayoría de usuarios.**

1. **Instalar la extensión:**
   - Abre Visual Studio Code
   - Ve a la vista de Extensiones (`Ctrl+Shift+X` o `Cmd+Shift+X`)
   - Busca **"chameleon-ai-launcher"**
   - Haz clic en "Instalar"

2. **Instalar dependencias:**
   - Después de la instalación, abre la paleta de comandos (`Ctrl+Shift+P` o `Cmd+Shift+P`)
   - Ejecuta el comando `Chameleon: Open Installation Guide`
   - Sigue las instrucciones paso a paso para instalar Node.js, Git, Claude Code y Gemini CLI

3. **Configurar e iniciar:**
   - Ejecuta `Chameleon: Open AI Settings` para configurar tus proveedores de IA
   - ¡Haz clic en el icono de Chameleon en la barra de actividad para comenzar!

### 📁 Método 2: Paquete VSIX precompilado

**Instalación directa desde el archivo de paquete de extensión.**

1. **Descargar VSIX:**
   - Ve a [GitHub Releases](https://github.com/chameleon-nexus/Chameleon/releases)
   - Descarga el último archivo `chameleon-ai-launcher-x.x.x.vsix`

2. **Instalar vía VS Code:**
   ```bash
   # Método A: Línea de comandos
   code --install-extension chameleon-ai-launcher-x.x.x.vsix
   
   # Método B: Interfaz de VS Code
   # 1. Abrir VS Code
   # 2. Ir a la vista de Extensiones (Ctrl+Shift+X)
   # 3. Hacer clic en el menú "..." → "Instalar desde VSIX..."
   # 4. Seleccionar el archivo .vsix descargado
   ```

3. **Completar configuración:**
   - Sigue los mismos pasos de instalación de dependencias y configuración que el Método 1

### 🛠️ Método 3: Construir desde código fuente

**Para desarrolladores que quieren contribuir o personalizar la extensión.**

**Prerrequisitos:**
- Git
- Node.js (v16 o superior)
- npm o yarn

**Pasos:**

1. **Clonar y construir:**
   ```bash
   # Clonar el repositorio
   git clone https://github.com/chameleon-nexus/Chameleon.git
   cd Chameleon
   
   # Instalar dependencias
   npm install
   
   # Compilar la extensión
   npm run compile
   
   # Empaquetar la extensión (opcional)
   npm install -g @vscode/vsce
   vsce package
   ```

2. **Instalar para desarrollo:**
   ```bash
   # Método A: Instalar versión empaquetada
   code --install-extension chameleon-ai-launcher-x.x.x.vsix
   
   # Método B: Ejecutar en modo desarrollo
   # Abrir el proyecto en VS Code y presionar F5 para lanzar el Host de Desarrollo de Extensión
   ```

3. **Instalar dependencias:**
   - Instalar Node.js, Git, Claude Code y Gemini CLI como se describe en la guía de instalación
   - Configurar proveedores de IA a través de la configuración de la extensión

---

## ⚙️ Configuración post-instalación

**Independientemente de tu método de instalación, completa estos pasos:**

1. **Instalar dependencias Multi-CLI:**
   - Node.js y npm
   - Git
   - Claude Code CLI (`npm install -g @anthropic-ai/claude-code`)
   - Paquetes Gemini CLI

2. **Configurar proveedores de IA:**
   - Abrir la paleta de comandos y ejecutar `Chameleon: Open AI Settings`
   - Agregar tus claves API para OpenAI, Anthropic, Google u otros proveedores

3. **Verificar instalación:**
   - Hacer clic en el icono de Chameleon en la barra de actividad de VS Code
   - Navegar por las páginas de Claude Code y Gemini CLI
   - Verificar que todas las dependencias se muestren como "Instaladas"

**¿Necesitas ayuda?** ¡Ejecuta `Chameleon: Open Installation Guide` para instrucciones detalladas paso a paso!
2. Ve a la vista de extensiones (`Ctrl+Shift+X`).
3. Busca **"Chameleon - 智能文档助手"**.
4. Haz clic en "Instalar".

**Paso 3: Configurar proveedores de IA**

1. Abre la paleta de comandos (`Ctrl+Shift+P`).
2. Ejecuta el comando `Chameleon: Abrir configuración de IA`.
3. Selecciona el proveedor de IA que quieres usar e ingresa tu clave API.
4. ¡Configuración completada! Haz clic en el icono de Chameleon en la barra de actividad de VS Code para comenzar.

### Opción 2: Para desarrolladores (Desde código fuente)

Sigue estos pasos si quieres ejecutar la extensión desde el código fuente o contribuir al proyecto.

**Prerrequisitos:**
* Git instalado.
* Node.js instalado (v16 o superior recomendado).
* Todas las dependencias de la **Guía de instalación** (`Claude Code`, `Claude Code Router`, etc.) deben estar instaladas y configuradas.

**Pasos:**

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/chameleon-nexus/claude-code-vscode.git
   cd claude-code-vscode
   ```

2. **Instalar dependencias del proyecto:**
   ```bash
   npm install
   ```

3. **Compilar el código:**
   * Compilación única: `npm run compile`
   * Vigilar cambios de archivos y compilar automáticamente: `npm run watch`

4. **Ejecutar la extensión:**
   * Abre esta carpeta de proyecto en VS Code.
   * Presiona `F5` para lanzar una nueva ventana "Extension Development Host" con la extensión Chameleon ejecutándose.

## 🎯 Motores de IA y modelos soportados

Chameleon soporta **6 motores de IA principales** a través de Claude Code Router, cubriendo **20+ modelos cuidadosamente seleccionados** para capacidades de IA de nivel profesional:

### 🔥 Motores de IA de texto

#### **OpenRouter**
- **Claude 3.5 Sonnet**: Capacidad de razonamiento más potente
- **Claude 3 Haiku**: Versión rápida y ligera
- **GPT-4o**: Último modelo multimodal
- **GPT-4o-mini**: Versión ligera con excelente relación costo-rendimiento
- **Llama 3.1 405B**: Modelo grande de código abierto
- **Gemini Pro 1.5**: Experto en contexto largo

#### **DeepSeek**
- **DeepSeek Chat**: Modelo de conversación general
- **DeepSeek Coder**: Generación de código profesional

#### **Google Gemini**
- **Gemini Pro**: Modelo de razonamiento general
- **Gemini Pro Vision**: Modelo de comprensión de imágenes

#### **Volcengine**
- **DeepSeek V3**: Versión Volcengine (contexto largo de 128K tokens)

#### **Azure OpenAI**
- **GPT-4**: Modelo de razonamiento avanzado clásico
- **GPT-4 Turbo**: Modelo de razonamiento de alto rendimiento
- **GPT-3.5 Turbo**: Modelo de respuesta rápida

#### **Ollama** (Despliegue local)
- **Llama 3.1**: Modelo de conversación de código abierto
- **CodeLlama**: Modelo especializado en código
- **Mistral**: Modelo de razonamiento eficiente
- **Gemma**: Modelo ligero

### 🎨 Motores de IA multimodales

#### **Motor de comprensión de imágenes - Seedream**
- Análisis de imágenes profesional, reconocimiento OCR, comprensión de gráficos
- Soporta múltiples formatos de imagen y tareas visuales complejas

#### **Motor de procesamiento de video - Seedance**
- Análisis de contenido de video profesional y generación de resúmenes
- Soporta comprensión de videos largos y reconocimiento de acciones

### ⚙️ Configuración inteligente de modelos

Chameleon soporta **5 configuraciones de modelos especializadas** para elegir el modelo de IA más adecuado para diferentes escenarios:

#### **1. Modelo de texto corto** (Respuesta rápida)
- Adecuado para: Q&A simples, completación de código, traducción rápida
- Recomendado: GPT-3.5-turbo, Claude 3 Haiku, DeepSeek Chat

#### **2. Modelo de texto largo** (Contexto grande)
- Adecuado para: Análisis de documentos largos, revisión de código, razonamiento complejo
- Recomendado: GPT-4o, Claude 3.5 Sonnet, DeepSeek V3

#### **3. Modelo de pensamiento** (Razonamiento profundo)
- Adecuado para: Resolución de problemas complejos, diseño de arquitectura, cálculos matemáticos
- Recomendado: Claude 3.5 Sonnet, GPT-4, Llama 3.1 405B

#### **4. Modelo de imagen** (Comprensión visual)
- Adecuado para: Análisis de imágenes, OCR, comprensión de gráficos
- Recomendado: Motor Seedream

#### **5. Modelo de video** (Procesamiento de video)
- Adecuado para: Resumen de video, análisis de contenido, reconocimiento de acciones
- Recomendado: Motor Seedance

### 🚀 Estrategia de enrutamiento de modelos

El sistema de enrutamiento inteligente de Chameleon selecciona automáticamente el mejor modelo basado en:

- **Complejidad de la tarea**: Tareas simples → modelos rápidos, tareas complejas → modelos de razonamiento
- **Longitud del contenido**: Texto corto → modelos ligeros, documentos largos → modelos de contexto grande
- **Tipo de modalidad**: Texto → modelos de lenguaje, imágenes → motor Seedream, video → motor Seedance
- **Preferencias del usuario**: Especificación manual de modelos específicos
- **Optimización de costos**: Equilibrio perfecto entre rendimiento y costo

## 🏗️ Arquitectura

### Componentes
```
Extensión Chameleon
├── Panel de bienvenida          # Interfaz de introducción
├── Panel de configuración       # Configuración de proveedores de IA
├── Panel de chat               # Interfaz de conversación de IA
├── Panel de guía de instalación # Instrucciones de instalación
├── Panel de configuración del sistema # Configuración de idioma y tema
└── Cliente Claude             # Integración de modelos de IA
```

### Estructura de archivos
```
chameleon/
├── src/
│   ├── extension.ts           # Punto de entrada principal de la extensión
│   ├── webviews/              # Paneles de UI
│   │   ├── settingsPanel.ts   # Configuración de IA
│   │   ├── chatPanel.ts       # Interfaz de chat
│   │   ├── installGuidePanel.ts # Guía de instalación
│   │   └── systemSettingsPanel.ts # Configuración del sistema
│   └── utils/                 # Funciones de utilidad
│       ├── i18n.ts           # Internacionalización
│       └── claudeClient.ts   # Cliente de IA
├── l10n/                     # Archivos de traducción
├── package.json              # Manifiesto de la extensión
└── README.md                 # Este archivo
```

## 🌍 Internacionalización

Chameleon soporta 12 idiomas:
- English (en)
- 简体中文 (zh)
- 日本語 (ja)
- Deutsch (de)
- Français (fr)
- Español (es)
- Português (pt)
- Tiếng Việt (vi)
- हिन्दी (hi)
- 한국어 (ko)
- Русский (ru)
- العربية (ar)

## 🔧 Solución de problemas

### Problemas comunes

1. **La extensión no se activa**:
   - Verificar la consola de desarrollador de VS Code (Ayuda > Alternar herramientas de desarrollador)
   - Confirmar que la extensión está habilitada
   - Verificar extensiones conflictivas

2. **Problemas de conexión de proveedores de IA**:
   - Verificar que las claves API están configuradas correctamente
   - Verificar la conectividad de red
   - Revisar la configuración de timeout de API
   - Usar la función de prueba de conexión integrada

3. **La guía de instalación no funciona**:
   - Confirmar privilegios de administrador (Windows)
   - Verificar que Node.js y Git están instalados correctamente
   - Intentar instalación manual siguiendo la guía

### Modo debug

Habilitar registro de debug:
1. Abrir configuración de VS Code
2. Buscar "chameleon.debug"
3. Habilitar modo debug
4. Verificar registros "Chameleon" en el panel de salida

## 🤝 Contribuir

Chameleon es un proyecto de código abierto construido para la comunidad. ¡Damos la bienvenida a todo tipo de contribuciones! Por favor, consulta nuestra [Guía de contribución](CONTRIBUTING.md) para más detalles.

### Configuración de desarrollo

1. Fork el repositorio
2. Crear una rama de característica
3. Hacer cambios
4. Agregar pruebas si es aplicable
5. Enviar una pull request

## 📄 Licencia de código abierto

Este proyecto es de código abierto bajo la licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

- **Reportes de problemas**: [GitHub Issues](https://github.com/chameleon-nexus/claude-code-vscode/issues)
- **Discusiones**: [GitHub Discussions](https://github.com/chameleon-nexus/claude-code-vscode/discussions)
- **Documentación**: [Wiki](https://github.com/chameleon-nexus/claude-code-vscode/wiki)

## 📝 Registro de cambios

### v0.1.0 (Lanzamiento inicial)
- Soporte universal de proveedores de IA
- Interfaz de notebook profesional
- Integración profunda del IDE
- Diseño centrado en la privacidad
- Internacionalización completa (12 idiomas)
- Guía de instalación completa

---

**Hecho con ❤️ para la comunidad de desarrolladores**
