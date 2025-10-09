<div align="center">
  <img src="https://raw.githubusercontent.com/chameleon-nexus/claude-code-vscode/main/media/icon.svg" alt="Chameleon Logo" width="120px">
  <h1>Assistant IA Chameleon</h1>
  <p>
    <strong>Exploitez l'IA de pointe pour refaçonner les flux de travail de codage et créatifs. Votre station de travail IA locale open-source et extensible.</strong>
  </p>
  <p>
    <a href="../README.md">English</a> | <a href="./README.es.md">Español</a> | <a href="./README.ja.md">日本語</a> | <a href="./README.de.md">Deutsch</a> | <a href="./README.fr.md">Français</a> | <a href="./README.zh.md">简体中文</a> | <a href="./README.pt.md">Português</a> | <a href="./README.vi.md">Tiếng Việt</a> | <a href="./README.hi.md">हिन्दी</a> | <a href="./README.ko.md">한국어</a> | <a href="./README.ru.md">Русский</a> | <a href="./README.ar.md">العربية</a>
  </p>
</div>

---

## 🦎 Qu'est-ce que Chameleon ?

Chameleon est bien plus qu'une simple fenêtre de chat IA. C'est une extension VS Code open-source puissante qui transforme votre éditeur en un notebook professionnel, local et piloté par l'IA.

Conçu pour les développeurs, les rédacteurs et les chercheurs, Chameleon vous remet le contrôle de l'IA. Il s'intègre profondément dans votre flux de travail, vous permettant de vous connecter de manière transparente à n'importe quel fournisseur d'IA tiers (comme OpenAI, Google Gemini, DeepSeek, etc.), de gérer les modèles locaux et cloud, et de construire votre propre chaîne d'outils IA privée dans l'environnement familier de VS Code.

## ✨ Fonctionnalités principales

* **🎯 6 moteurs IA, 20+ modèles sélectionnés** : Libérez-vous du verrouillage fournisseur ! Support pour OpenRouter, DeepSeek, Google, Volcengine, Azure, Ollama et autres 6 moteurs IA principaux, couvrant 20+ modèles soigneusement sélectionnés, y compris les derniers GPT-4o, Claude 3.5 Sonnet, DeepSeek V3, etc.
* **🧠 5 configurations de modèles spécialisées** : Configuration intelligente de modèles de texte court, texte long, pensée, image et vidéo, permettant à chaque tâche d'utiliser le modèle IA le plus approprié.
* **🎨 Support IA multimodale** : Supporte non seulement les conversations textuelles, mais aussi la compréhension d'images, l'analyse vidéo, la reconnaissance OCR et d'autres capacités IA multimédia.
* **⚡ Routage intelligent des modèles** : Sélection automatique du meilleur modèle basée sur la complexité des tâches, la longueur du contenu et le type de modalité pour un équilibre parfait entre performance et coût.
* **📓 Interface notebook professionnelle** : Allez au-delà des simples Q&R. Organisez vos tâches pilotées par l'IA dans un notebook riche qui combine parfaitement Markdown, extraits de code et invites IA.
* **🔒 Conception axée sur la confidentialité** : Supporte l'exécution de modèles locaux, vous donnant un contrôle total sur la sécurité des données tout en offrant la commodité des APIs cloud.
* **🎛️ Intégration IDE profonde** : Se sent comme une fonctionnalité native de VS Code. Accédez aux outils IA puissants directement via les menus contextuels, les code lenses et les panneaux de barre latérale dédiés.
* **🌍 Support 12 langues** : Expérience internationale complète en chinois, anglais, japonais, allemand, français, espagnol, portugais, vietnamien, hindi, coréen, russe et arabe.

## 🚀 Méthodes d'installation

Choisissez la méthode d'installation qui correspond le mieux à vos besoins :

### 📦 Méthode 1 : VS Code Marketplace (Recommandé)

**Le moyen le plus simple d'installer Chameleon - parfait pour la plupart des utilisateurs.**

1. **Installer l'extension :**
   - Ouvrez Visual Studio Code
   - Allez à la vue Extensions (`Ctrl+Shift+X` ou `Cmd+Shift+X`)
   - Recherchez **"chameleon-ai-launcher"**
   - Cliquez sur "Installer"

2. **Installer les dépendances :**
   - Après l'installation, ouvrez la palette de commandes (`Ctrl+Shift+P` ou `Cmd+Shift+P`)
   - Exécutez la commande `Chameleon: Open Installation Guide`
   - Suivez les instructions étape par étape pour installer Node.js, Git, Claude Code et Gemini CLI

3. **Configurer et démarrer :**
   - Exécutez `Chameleon: Open AI Settings` pour configurer vos fournisseurs IA
   - Cliquez sur l'icône Chameleon dans la barre d'activité pour commencer !

### 📁 Méthode 2 : Package VSIX pré-construit

**Installation directe depuis le fichier de package d'extension.**

1. **Télécharger VSIX :**
   - Allez sur [GitHub Releases](https://github.com/chameleon-nexus/Chameleon/releases)
   - Téléchargez le dernier fichier `chameleon-ai-launcher-x.x.x.vsix`

2. **Installer via VS Code :**
   ```bash
   # Méthode A : Ligne de commande
   code --install-extension chameleon-ai-launcher-x.x.x.vsix
   
   # Méthode B : Interface VS Code
   # 1. Ouvrir VS Code
   # 2. Aller à la vue Extensions (Ctrl+Shift+X)
   # 3. Cliquer sur le menu "..." → "Installer depuis VSIX..."
   # 4. Sélectionner le fichier .vsix téléchargé
   ```

3. **Terminer la configuration :**
   - Suivez les mêmes étapes d'installation des dépendances et de configuration que la Méthode 1

### 🛠️ Méthode 3 : Construire depuis le code source

**Pour les développeurs qui souhaitent contribuer ou personnaliser l'extension.**

**Prérequis :**
- Git
- Node.js (v16 ou supérieur)
- npm ou yarn

**Étapes :**

1. **Cloner et construire :**
   ```bash
   # Cloner le dépôt
   git clone https://github.com/chameleon-nexus/Chameleon.git
   cd Chameleon
   
   # Installer les dépendances
   npm install
   
   # Compiler l'extension
   npm run compile
   
   # Empaqueter l'extension (optionnel)
   npm install -g @vscode/vsce
   vsce package
   ```

2. **Installer pour le développement :**
   ```bash
   # Méthode A : Installer la version empaquetée
   code --install-extension chameleon-ai-launcher-x.x.x.vsix
   
   # Méthode B : Exécuter en mode développement
   # Ouvrir le projet dans VS Code et appuyer sur F5 pour lancer l'hôte de développement d'extension
   ```

3. **Installer les dépendances :**
   - Installer Node.js, Git, Claude Code et Gemini CLI comme décrit dans le guide d'installation
   - Configurer les fournisseurs IA via les paramètres d'extension

---

## ⚙️ Configuration post-installation

**Quelle que soit votre méthode d'installation, complétez ces étapes :**

1. **Installer les dépendances Multi-CLI :**
   - Node.js et npm
   - Git
   - Claude Code CLI (`npm install -g @anthropic-ai/claude-code`)
   - Packages Gemini CLI

2. **Configurer les fournisseurs IA :**
   - Ouvrir la palette de commandes et exécuter `Chameleon: Open AI Settings`
   - Ajouter vos clés API pour OpenAI, Anthropic, Google ou d'autres fournisseurs

3. **Vérifier l'installation :**
   - Cliquer sur l'icône Chameleon dans la barre d'activité de VS Code
   - Naviguer dans les pages Claude Code et Gemini CLI
   - Vérifier que toutes les dépendances s'affichent comme "Installées"

**Besoin d'aide ?** Exécutez `Chameleon: Open Installation Guide` pour des instructions détaillées étape par étape !
3. Recherchez **"Chameleon - 智能文档助手"**.
4. Cliquez sur "Installer".

**Étape 3 : Configurer les fournisseurs IA**

1. Ouvrez la palette de commandes (`Ctrl+Shift+P`).
2. Exécutez la commande `Chameleon: Ouvrir les paramètres IA`.
3. Sélectionnez le fournisseur IA que vous souhaitez utiliser et entrez votre clé API.
4. Configuration terminée ! Cliquez sur l'icône Chameleon dans la barre d'activité VS Code pour commencer.

### Option 2 : Pour les développeurs (Depuis le code source)

Suivez ces étapes si vous souhaitez exécuter l'extension depuis le code source ou contribuer au projet.

**Prérequis :**
* Git installé.
* Node.js installé (v16 ou supérieur recommandé).
* Toutes les dépendances du **Guide d'installation** (`Claude Code`, `Claude Code Router`, etc.) doivent être installées et configurées.

**Étapes :**

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/chameleon-nexus/claude-code-vscode.git
   cd claude-code-vscode
   ```

2. **Installer les dépendances du projet :**
   ```bash
   npm install
   ```

3. **Compiler le code :**
   * Compilation unique : `npm run compile`
   * Surveiller les changements de fichiers et compiler automatiquement : `npm run watch`

4. **Exécuter l'extension :**
   * Ouvrez ce dossier de projet dans VS Code.
   * Appuyez sur `F5` pour lancer une nouvelle fenêtre "Extension Development Host" avec l'extension Chameleon en cours d'exécution.

## 🎯 Moteurs IA et modèles supportés

Chameleon supporte **6 moteurs IA principaux** via Claude Code Router, couvrant **20+ modèles soigneusement sélectionnés** pour des capacités IA de niveau professionnel :

### 🔥 Moteurs IA textuels

#### **OpenRouter**
- **Claude 3.5 Sonnet** : Capacité de raisonnement la plus puissante
- **Claude 3 Haiku** : Version rapide et légère
- **GPT-4o** : Dernier modèle multimodal
- **GPT-4o-mini** : Version légère avec excellent rapport qualité-prix
- **Llama 3.1 405B** : Grand modèle open-source
- **Gemini Pro 1.5** : Expert en contexte long

#### **DeepSeek**
- **DeepSeek Chat** : Modèle de conversation général
- **DeepSeek Coder** : Génération de code professionnelle

#### **Google Gemini**
- **Gemini Pro** : Modèle de raisonnement général
- **Gemini Pro Vision** : Modèle de compréhension d'images

#### **Volcengine**
- **DeepSeek V3** : Version Volcengine (contexte long 128K tokens)

#### **Azure OpenAI**
- **GPT-4** : Modèle de raisonnement avancé classique
- **GPT-4 Turbo** : Modèle de raisonnement haute performance
- **GPT-3.5 Turbo** : Modèle de réponse rapide

#### **Ollama** (Déploiement local)
- **Llama 3.1** : Modèle de conversation open-source
- **CodeLlama** : Modèle spécialisé en code
- **Mistral** : Modèle de raisonnement efficace
- **Gemma** : Modèle léger

### 🎨 Moteurs IA multimodaux

#### **Moteur de compréhension d'images - Seedream**
- Analyse d'images professionnelle, reconnaissance OCR, compréhension de graphiques
- Supporte plusieurs formats d'images et tâches visuelles complexes

#### **Moteur de traitement vidéo - Seedance**
- Analyse de contenu vidéo professionnelle et génération de résumés
- Supporte la compréhension de vidéos longues et la reconnaissance d'actions

### ⚙️ Configuration intelligente des modèles

Chameleon supporte **5 configurations de modèles spécialisées** pour choisir le modèle IA le plus approprié pour différents scénarios :

#### **1. Modèle texte court** (Réponse rapide)
- Adapté pour : Q&R simples, complétion de code, traduction rapide
- Recommandé : GPT-3.5-turbo, Claude 3 Haiku, DeepSeek Chat

#### **2. Modèle texte long** (Grand contexte)
- Adapté pour : Analyse de documents longs, révision de code, raisonnement complexe
- Recommandé : GPT-4o, Claude 3.5 Sonnet, DeepSeek V3

#### **3. Modèle de pensée** (Raisonnement profond)
- Adapté pour : Résolution de problèmes complexes, conception d'architecture, calculs mathématiques
- Recommandé : Claude 3.5 Sonnet, GPT-4, Llama 3.1 405B

#### **4. Modèle d'image** (Compréhension visuelle)
- Adapté pour : Analyse d'images, OCR, compréhension de graphiques
- Recommandé : Moteur Seedream

#### **5. Modèle vidéo** (Traitement vidéo)
- Adapté pour : Résumé vidéo, analyse de contenu, reconnaissance d'actions
- Recommandé : Moteur Seedance

### 🚀 Stratégie de routage des modèles

Le système de routage intelligent de Chameleon sélectionne automatiquement le meilleur modèle basé sur :

- **Complexité des tâches** : Tâches simples → modèles rapides, tâches complexes → modèles de raisonnement
- **Longueur du contenu** : Texte court → modèles légers, documents longs → modèles à grand contexte
- **Type de modalité** : Texte → modèles de langage, images → moteur Seedream, vidéo → moteur Seedance
- **Préférences utilisateur** : Spécification manuelle de modèles spécifiques
- **Optimisation des coûts** : Équilibre parfait entre performance et coût

## 🏗️ Architecture

### Composants
```
Extension Chameleon
├── Panneau d'accueil          # Interface d'introduction
├── Panneau de paramètres      # Configuration des fournisseurs IA
├── Panneau de chat           # Interface de conversation IA
├── Panneau de guide d'installation # Instructions d'installation
├── Panneau de paramètres système # Paramètres de langue et thème
└── Client Claude            # Intégration des modèles IA
```

### Structure des fichiers
```
chameleon/
├── src/
│   ├── extension.ts           # Point d'entrée principal de l'extension
│   ├── webviews/              # Panneaux UI
│   │   ├── settingsPanel.ts   # Paramètres IA
│   │   ├── chatPanel.ts       # Interface de chat
│   │   ├── installGuidePanel.ts # Guide d'installation
│   │   └── systemSettingsPanel.ts # Paramètres système
│   └── utils/                 # Fonctions utilitaires
│       ├── i18n.ts           # Internationalisation
│       └── claudeClient.ts   # Client IA
├── l10n/                     # Fichiers de traduction
├── package.json              # Manifeste de l'extension
└── README.md                 # Ce fichier
```

## 🌍 Internationalisation

Chameleon supporte 12 langues :
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

## 🏪 AGTHub - Marché d'Agents IA

**[AGTHub](https://www.agthub.org)** est le marché officiel d'agents IA pour Chameleon, offrant une plateforme complète pour découvrir, partager et gérer des agents IA.

### 🌟 Fonctionnalités principales

- **🔍 Bibliothèque d'agents étendue**: Parcourez des centaines d'agents IA gratuits et premium dans plusieurs catégories
- **📤 Publication facile**: Partagez vos agents personnalisés avec la communauté mondiale via le web ou CLI
- **💰 Monétisation**: Proposez des agents premium à la vente et construisez votre entreprise d'agents IA
- **⭐ Évaluations communautaires**: Découvrez les meilleurs agents grâce aux avis et évaluations de la communauté
- **🌐 Support multilingue**: Support complet pour l'anglais, le chinois simplifié, le japonais et le vietnamien
- **🚀 Intégration directe**: Installez des agents depuis AGTHub vers Chameleon en un clic

### 🎯 Pour les utilisateurs de Chameleon

AGTHub s'intègre parfaitement au marché d'agents de Chameleon:

1. **Parcourir et découvrir**: Explorez les agents sur [www.agthub.org](https://www.agthub.org) ou directement dans Chameleon
2. **Installation en un clic**: Installez des agents gratuits instantanément via le panneau du marché de Chameleon
3. **Accès premium**: Achetez des agents premium sur AGTHub pour des fonctionnalités avancées
4. **Restez à jour**: Recevez des notifications automatiques sur les mises à jour d'agents et les nouvelles versions

### 🛠️ Pour les développeurs d'agents

Créez et partagez vos agents avec la communauté:

- **Publication web**: Utilisez le [tableau de bord AGTHub](https://www.agthub.org/dashboard) intuitif pour publier des agents
- **Publication CLI**: Publiez via ligne de commande avec `agt publish` (nécessite [@chameleon-nexus/agents-cli](https://www.npmjs.com/package/@chameleon-nexus/agents-cli))
- **Gestion des versions**: Mettez à jour vos agents facilement - les nouvelles versions remplacent automatiquement les anciennes
- **Analytiques**: Suivez les téléchargements, évaluations et retours utilisateurs pour vos agents
- **Options premium**: Monétisez votre travail en proposant des agents premium

### 💼 Pour les entreprises

Fonctionnalités spéciales pour les équipes d'entreprise:

- **Connexion entreprise**: Authentification dédiée pour les comptes organisationnels
- **Accès premium gratuit**: Les utilisateurs entreprise accèdent gratuitement à tous les agents payants
- **Gestion en masse**: Gérez efficacement les agents dans toute votre équipe
- **Publication privée**: Partagez des agents en interne au sein de votre organisation

### 🔗 Liens rapides

- **Site web AGTHub**: [https://www.agthub.org](https://www.agthub.org)
- **Agents gratuits**: [Parcourir les agents gratuits](https://www.agthub.org)
- **Agents premium**: [Explorer la section premium](https://www.agthub.org/paid)
- **Tableau de bord développeur**: [Publiez vos agents](https://www.agthub.org/dashboard)
- **Outil CLI**: [Agents CLI sur npm](https://www.npmjs.com/package/@chameleon-nexus/agents-cli)

> **💡 Conseil pro**: Bien que le marché intégré de Chameleon soit parfait pour parcourir rapidement, visitez [AGTHub](https://www.agthub.org) pour l'expérience complète avec des descriptions d'agents détaillées, des avis et des filtres de recherche avancés!

## 🔧 Dépannage

### Problèmes courants

1. **L'extension ne s'active pas** :
   - Vérifier la console développeur VS Code (Aide > Basculer les outils de développement)
   - Confirmer que l'extension est activée
   - Vérifier les extensions conflictuelles

2. **Problèmes de connexion des fournisseurs IA** :
   - Vérifier que les clés API sont correctement configurées
   - Vérifier la connectivité réseau
   - Examiner les paramètres de timeout API
   - Utiliser la fonction de test de connexion intégrée

3. **Le guide d'installation ne fonctionne pas** :
   - Confirmer les privilèges administrateur (Windows)
   - Vérifier que Node.js et Git sont correctement installés
   - Essayer l'installation manuelle selon le guide

### Mode debug

Activer la journalisation debug :
1. Ouvrir les paramètres VS Code
2. Rechercher "chameleon.debug"
3. Activer le mode debug
4. Vérifier les journaux "Chameleon" dans le panneau de sortie

## 🤝 Contribution

Chameleon est un projet open-source construit pour la communauté. Nous accueillons toutes sortes de contributions ! Veuillez consulter notre [Guide de contribution](CONTRIBUTING.md) pour plus de détails.

### Configuration de développement

1. Fork le dépôt
2. Créer une branche de fonctionnalité
3. Apporter des modifications
4. Ajouter des tests si applicable
5. Soumettre une pull request

## 📄 Licence open-source

Ce projet est open-source sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🆘 Support

- **Rapports de problèmes** : [GitHub Issues](https://github.com/chameleon-nexus/claude-code-vscode/issues)
- **Discussions** : [GitHub Discussions](https://github.com/chameleon-nexus/claude-code-vscode/discussions)
- **Documentation** : [Wiki](https://github.com/chameleon-nexus/claude-code-vscode/wiki)

## 📝 Journal des modifications

### v0.1.0 (Version initiale)
- Support universel des fournisseurs IA
- Interface notebook professionnelle
- Intégration IDE profonde
- Conception axée sur la confidentialité
- Internationalisation complète (12 langues)
- Guide d'installation complet

---

**Fait avec ❤️ pour la communauté des développeurs**
