<div align="center">
  <img src="https://raw.githubusercontent.com/chameleon-nexus/claude-code-vscode/main/media/icon.svg" alt="Chameleon Logo" width="120px">
  <h1>Chameleon KI-Assistent</h1>
  <p>
    <strong>Nutzen Sie modernste KI, um Codierung und kreative Arbeitsabläufe zu revolutionieren. Ihre Open-Source, erweiterbare lokale KI-Arbeitsstation.</strong>
  </p>
  <p>
    <a href="../README.md">English</a> | <a href="./README.es.md">Español</a> | <a href="./README.ja.md">日本語</a> | <a href="./README.de.md">Deutsch</a> | <a href="./README.fr.md">Français</a> | <a href="./README.zh.md">简体中文</a> | <a href="./README.pt.md">Português</a> | <a href="./README.vi.md">Tiếng Việt</a> | <a href="./README.hi.md">हिन्दी</a> | <a href="./README.ko.md">한국어</a> | <a href="./README.ru.md">Русский</a> | <a href="./README.ar.md">العربية</a>
  </p>
</div>

---

## 🦎 Was ist Chameleon?

Chameleon ist mehr als nur ein weiteres KI-Chat-Fenster. Es ist eine leistungsstarke, Open-Source VS Code-Erweiterung, die Ihren Editor in eine professionelle, lokale KI-gesteuerte Notebook-Umgebung verwandelt.

Entwickelt für Entwickler, Autoren und Forscher, gibt Chameleon Ihnen die Kontrolle über die KI zurück. Es integriert sich tief in Ihren Arbeitsablauf und ermöglicht es Ihnen, nahtlos mit beliebigen Drittanbieter-KI-Providern (wie OpenAI, Google Gemini, DeepSeek usw.) zu verbinden, lokale und Cloud-Modelle zu verwalten und Ihre eigene, private KI-Toolchain in der vertrauten VS Code-Umgebung zu erstellen.

## ✨ Kernfunktionen

* **🎯 6 KI-Engines, 20+ ausgewählte Modelle**: Befreien Sie sich vom Vendor Lock-in! Unterstützung für OpenRouter, DeepSeek, Google, Volcengine, Azure, Ollama und andere 6 Haupt-KI-Engines, die 20+ sorgfältig ausgewählte Modelle abdecken, einschließlich der neuesten GPT-4o, Claude 3.5 Sonnet, DeepSeek V3, usw.
* **🧠 5 spezialisierte Modellkonfigurationen**: Intelligente Konfiguration von Kurztext-, Langtext-, Denk-, Bild- und Videomodellen, damit jede Aufgabe das am besten geeignete KI-Modell verwendet.
* **🎨 Multimodale KI-Unterstützung**: Unterstützt nicht nur Textgespräche, sondern auch Bildverständnis, Videoanalyse, OCR-Erkennung und andere Multimedia-KI-Funktionen.
* **⚡ Intelligente Modellrouting**: Automatische Auswahl des besten Modells basierend auf Aufgabenkomplexität, Inhaltslänge und Modalitätstyp für perfekte Balance zwischen Leistung und Kosten.
* **📓 Professionelle Notebook-Oberfläche**: Gehen Sie über einfache Q&A hinaus. Organisieren Sie KI-gesteuerte Aufgaben in einem Rich-Text-Notebook, das Markdown, Code-Snippets und KI-Prompts perfekt kombiniert.
* **🔒 Datenschutz-First-Design**: Unterstützt lokale Modellausführung, gibt Ihnen vollständige Kontrolle über die Datensicherheit und bietet gleichzeitig die Bequemlichkeit von Cloud-APIs.
* **🎛️ Tiefe IDE-Integration**: Fühlt sich wie eine native VS Code-Funktion an. Greifen Sie über Rechtsklick-Menüs, Code-Lenses und dedizierte Seitenleisten-Panels jederzeit auf leistungsstarke KI-Tools zu.
* **🌍 12-Sprachen-Unterstützung**: Vollständige internationale Erfahrung in Chinesisch, Englisch, Japanisch, Deutsch, Französisch, Spanisch, Portugiesisch, Vietnamesisch, Hindi, Koreanisch, Russisch und Arabisch.

## 🚀 Installationsmethoden

Wählen Sie die Installationsmethode, die am besten zu Ihren Bedürfnissen passt:

### 📦 Methode 1: VS Code Marketplace (Empfohlen)

**Der einfachste Weg, Chameleon zu installieren - perfekt für die meisten Benutzer.**

1. **Erweiterung installieren:**
   - Öffnen Sie Visual Studio Code
   - Gehen Sie zur Erweiterungsansicht (`Ctrl+Shift+X` oder `Cmd+Shift+X`)
   - Suchen Sie nach **"chameleon-ai-launcher"**
   - Klicken Sie auf "Installieren"

2. **Abhängigkeiten installieren:**
   - Nach der Installation öffnen Sie die Befehlspalette (`Ctrl+Shift+P` oder `Cmd+Shift+P`)
   - Führen Sie den Befehl `Chameleon: Open Installation Guide` aus
   - Befolgen Sie die Schritt-für-Schritt-Anweisungen zur Installation von Node.js, Git, Claude Code und Gemini CLI

3. **Konfigurieren und starten:**
   - Führen Sie `Chameleon: Open AI Settings` aus, um Ihre AI-Anbieter zu konfigurieren
   - Klicken Sie auf das Chameleon-Symbol in der Aktivitätsleiste, um zu beginnen!

### 📁 Methode 2: Vorgefertigtes VSIX-Paket

**Direkte Installation aus der Erweiterungspaket-Datei.**

1. **VSIX herunterladen:**
   - Gehen Sie zu [GitHub Releases](https://github.com/chameleon-nexus/Chameleon/releases)
   - Laden Sie die neueste `chameleon-ai-launcher-x.x.x.vsix` Datei herunter

2. **Installation über VS Code:**
   ```bash
   # Methode A: Befehlszeile
   code --install-extension chameleon-ai-launcher-x.x.x.vsix
   
   # Methode B: VS Code UI
   # 1. VS Code öffnen
   # 2. Zur Erweiterungsansicht gehen (Ctrl+Shift+X)
   # 3. "..." Menü klicken → "Aus VSIX installieren..."
   # 4. Die heruntergeladene .vsix Datei auswählen
   ```

3. **Setup abschließen:**
   - Befolgen Sie die gleichen Abhängigkeitsinstallations- und Konfigurationsschritte wie bei Methode 1

### 🛠️ Methode 3: Aus Quellcode erstellen

**Für Entwickler, die zur Erweiterung beitragen oder sie anpassen möchten.**

**Voraussetzungen:**
- Git
- Node.js (v16 oder höher)
- npm oder yarn

**Schritte:**

1. **Klonen und erstellen:**
   ```bash
   # Repository klonen
   git clone https://github.com/chameleon-nexus/Chameleon.git
   cd Chameleon
   
   # Abhängigkeiten installieren
   npm install
   
   # Erweiterung kompilieren
   npm run compile
   
   # Erweiterung paketieren (optional)
   npm install -g @vscode/vsce
   vsce package
   ```

2. **Für Entwicklung installieren:**
   ```bash
   # Methode A: Paketierte Version installieren
   code --install-extension chameleon-ai-launcher-x.x.x.vsix
   
   # Methode B: Im Entwicklungsmodus ausführen
   # Projekt in VS Code öffnen und F5 drücken, um Extension Development Host zu starten
   ```

3. **Abhängigkeiten installieren:**
   - Node.js, Git, Claude Code und Gemini CLI wie in der Installationsanleitung beschrieben installieren
   - AI-Anbieter über die Erweiterungseinstellungen konfigurieren

---

## ⚙️ Nach-Installations-Setup

**Unabhängig von Ihrer Installationsmethode, führen Sie diese Schritte aus:**

1. **Multi-CLI-Abhängigkeiten installieren:**
   - Node.js und npm
   - Git
   - Claude Code CLI (`npm install -g @anthropic-ai/claude-code`)
   - Gemini CLI-Pakete

2. **AI-Anbieter konfigurieren:**
   - Befehlspalette öffnen und `Chameleon: Open AI Settings` ausführen
   - API-Schlüssel für OpenAI, Anthropic, Google oder andere Anbieter hinzufügen

3. **Installation überprüfen:**
   - Auf das Chameleon-Symbol in der VS Code-Aktivitätsleiste klicken
   - Durch Claude Code und Gemini CLI-Seiten navigieren
   - Überprüfen, dass alle Abhängigkeiten als "Installiert" angezeigt werden

**Benötigen Sie Hilfe?** Führen Sie `Chameleon: Open Installation Guide` für detaillierte Schritt-für-Schritt-Anweisungen aus!
   ```

2. **Projektabhängigkeiten installieren:**
   ```bash
   npm install
   ```

3. **Code kompilieren:**
   * Einmalig kompilieren: `npm run compile`
   * Dateiänderungen überwachen und automatisch kompilieren: `npm run watch`

4. **Erweiterung ausführen:**
   * Öffnen Sie diesen Projektordner in VS Code.
   * Drücken Sie `F5`, um ein neues "Extension Development Host"-Fenster zu starten, in dem die Chameleon-Erweiterung läuft.

## 🎯 Unterstützte KI-Engines und Modelle

Chameleon unterstützt **6 Haupt-KI-Engines** über Claude Code Router und deckt **20+ sorgfältig ausgewählte Modelle** für professionelle KI-Funktionen ab:

### 🔥 Text-KI-Engines

#### **OpenRouter**
- **Claude 3.5 Sonnet**: Stärkste Denkfähigkeit
- **Claude 3 Haiku**: Schnelle und leichte Version
- **GPT-4o**: Neuestes multimodales Modell
- **GPT-4o-mini**: Leichte Version mit ausgezeichnetem Preis-Leistungs-Verhältnis
- **Llama 3.1 405B**: Open-Source-Großmodell
- **Gemini Pro 1.5**: Langkontext-Experte

#### **DeepSeek**
- **DeepSeek Chat**: Allgemeines Gesprächsmodell
- **DeepSeek Coder**: Professionelle Code-Generierung

#### **Google Gemini**
- **Gemini Pro**: Allgemeines Denkmodell
- **Gemini Pro Vision**: Bildverständnismodell

#### **Volcengine**
- **DeepSeek V3**: Volcengine-Version (128K Token Langkontext)

#### **Azure OpenAI**
- **GPT-4**: Klassisches fortgeschrittenes Denkmodell
- **GPT-4 Turbo**: Hochleistungs-Denkmodell
- **GPT-3.5 Turbo**: Schnelles Antwortmodell

#### **Ollama** (Lokale Bereitstellung)
- **Llama 3.1**: Open-Source-Gesprächsmodell
- **CodeLlama**: Code-spezialisiertes Modell
- **Mistral**: Effizientes Denkmodell
- **Gemma**: Leichtes Modell

### 🎨 Multimodale KI-Engines

#### **Bildverständnis-Engine - Seedream**
- Professionelle Bildanalyse, OCR-Erkennung, Diagrammverständnis
- Unterstützt mehrere Bildformate und komplexe visuelle Aufgaben

#### **Videoverarbeitungs-Engine - Seedance**
- Professionelle Videoinhaltsanalyse und Zusammenfassungsgenerierung
- Unterstützt langes Videoverständnis und Aktionserkennung

### ⚙️ Intelligente Modellkonfiguration

Chameleon unterstützt **5 spezialisierte Modellkonfigurationen**, um das am besten geeignete KI-Modell für verschiedene Szenarien zu wählen:

#### **1. Kurztext-Modell** (Schnelle Antwort)
- Geeignet für: Einfache Q&A, Code-Vervollständigung, schnelle Übersetzung
- Empfohlen: GPT-3.5-turbo, Claude 3 Haiku, DeepSeek Chat

#### **2. Langtext-Modell** (Großer Kontext)
- Geeignet für: Lange Dokumentenanalyse, Code-Review, komplexes Denken
- Empfohlen: GPT-4o, Claude 3.5 Sonnet, DeepSeek V3

#### **3. Denk-Modell** (Tiefes Denken)
- Geeignet für: Komplexe Problemlösung, Architekturentwurf, mathematische Berechnungen
- Empfohlen: Claude 3.5 Sonnet, GPT-4, Llama 3.1 405B

#### **4. Bild-Modell** (Visuelles Verständnis)
- Geeignet für: Bildanalyse, OCR, Diagrammverständnis
- Empfohlen: Seedream-Engine

#### **5. Video-Modell** (Videoverarbeitung)
- Geeignet für: Videozusammenfassung, Inhaltsanalyse, Aktionserkennung
- Empfohlen: Seedance-Engine

### 🚀 Modellrouting-Strategie

Chameleons intelligentes Routing-System wählt automatisch das beste Modell basierend auf:

- **Aufgabenkomplexität**: Einfache Aufgaben → schnelle Modelle, komplexe Aufgaben → Denkmodelle
- **Inhaltslänge**: Kurzer Text → leichte Modelle, lange Dokumente → große Kontextmodelle
- **Modalitätstyp**: Text → Sprachmodelle, Bilder → Seedream-Engine, Video → Seedance-Engine
- **Benutzereinstellungen**: Manuelle Spezifikation bestimmter Modelle
- **Kostenoptimierung**: Perfekte Balance zwischen Leistung und Kosten

## 🏗️ Architektur

### Komponenten
```
Chameleon-Erweiterung
├── Willkommens-Panel          # Einführungs-Interface
├── Einstellungs-Panel         # KI-Provider-Konfiguration
├── Chat-Panel                # KI-Gesprächs-Interface
├── Installationsanleitung-Panel # Installationsanweisungen
├── Systemeinstellungs-Panel  # Sprach- und Theme-Einstellungen
└── Claude-Client            # KI-Modell-Integration
```

### Dateistruktur
```
chameleon/
├── src/
│   ├── extension.ts           # Haupt-Erweiterungs-Einstiegspunkt
│   ├── webviews/              # UI-Panels
│   │   ├── settingsPanel.ts   # KI-Einstellungen
│   │   ├── chatPanel.ts       # Chat-Interface
│   │   ├── installGuidePanel.ts # Installationsanleitung
│   │   └── systemSettingsPanel.ts # Systemeinstellungen
│   └── utils/                 # Utility-Funktionen
│       ├── i18n.ts           # Internationalisierung
│       └── claudeClient.ts   # KI-Client
├── l10n/                     # Übersetzungsdateien
├── package.json              # Erweiterungs-Manifest
└── README.md                 # Diese Datei
```

## 🌍 Internationalisierung

Chameleon unterstützt 12 Sprachen:
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

## 🔧 Fehlerbehebung

### Häufige Probleme

1. **Erweiterung aktiviert sich nicht**:
   - VS Code-Entwicklerkonsole überprüfen (Hilfe > Entwicklertools umschalten)
   - Bestätigen, dass die Erweiterung aktiviert ist
   - Auf konfliktierende Erweiterungen prüfen

2. **KI-Provider-Verbindungsprobleme**:
   - Bestätigen, dass API-Schlüssel korrekt konfiguriert sind
   - Netzwerkverbindung überprüfen
   - API-Timeout-Einstellungen überprüfen
   - Eingebaute Verbindungstest-Funktion verwenden

3. **Installationsanleitung funktioniert nicht**:
   - Administratorrechte bestätigen (Windows)
   - Überprüfen, ob Node.js und Git korrekt installiert sind
   - Manuelle Installation gemäß Anleitung versuchen

### Debug-Modus

Debug-Protokollierung aktivieren:
1. VS Code-Einstellungen öffnen
2. "chameleon.debug" suchen
3. Debug-Modus aktivieren
4. "Chameleon"-Protokolle im Ausgabe-Panel überprüfen

## 🤝 Beitragen

Chameleon ist ein Open-Source-Projekt, das für die Gemeinschaft entwickelt wurde. Wir begrüßen alle Arten von Beiträgen! Bitte lesen Sie unseren [Beitragsleitfaden](CONTRIBUTING.md) für Details.

### Entwicklungsumgebung

1. Repository forken
2. Feature-Branch erstellen
3. Änderungen vornehmen
4. Tests hinzufügen, falls zutreffend
5. Pull-Request einreichen

## 📄 Open-Source-Lizenz

Dieses Projekt ist unter der MIT-Lizenz Open-Source - Details finden Sie in der [LICENSE](LICENSE)-Datei.

## 🆘 Support

- **Problemberichte**: [GitHub Issues](https://github.com/chameleon-nexus/claude-code-vscode/issues)
- **Diskussionen**: [GitHub Discussions](https://github.com/chameleon-nexus/claude-code-vscode/discussions)
- **Dokumentation**: [Wiki](https://github.com/chameleon-nexus/claude-code-vscode/wiki)

## 📝 Changelog

### v0.1.0 (Erstveröffentlichung)
- Universelle KI-Provider-Unterstützung
- Professionelle Notebook-Oberfläche
- Tiefe IDE-Integration
- Datenschutz-First-Design
- Vollständige Internationalisierung (12 Sprachen)
- Umfassende Installationsanleitung

---

**Mit ❤️ für die Entwicklergemeinschaft erstellt**
