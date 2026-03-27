<div align="center">
  <img width="1200" height="400" alt="ICE Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  <h1>🛠️ ICE - Ecosystem Management Platform</h1>
  <p><strong>Solution complète de gestion SaaS pour les centres automobiles et le suivi des automobilistes (MECATECH-LV).</strong></p>
</div>

---

## 📖 Présentation du Projet

**ICE (Intelligent Customer Experience)** est une plateforme écosystémique conçue pour moderniser la relation entre les centres automobiles et les automobilistes en Côte d'Ivoire. Le projet regroupe une interface d'administration globale (SuperAdmin), un ERP pour garages partenaires, et une application mobile pour les particuliers.

## 🏗️ Architecture & Stack Technique

L'application repose sur une architecture moderne **Fullstack TypeScript** :

- **Frontend :** Angular v18+ (Utilisation massive des **Signals** pour la réactivité, Tailwind CSS pour le design premium).
- **Backend :** NestJS (Architecture modulaire, Intercepteurs d'audit, Guards de sécurité).
- **Base de Données :** PostgreSQL via **Prisma ORM**.
- **Mobile :** Intégration Capacitor / Mobile-first Design.

---

## 🚀 Modules Principaux

### 1. Console SuperAdmin (SaaS Management)
Pilotage centralisé de la plateforme par l'équipe **MECATECH**.
- **Hiérarchie de Sécurité :** Distinction entre profil `Root` (Propriétaire) et `Administrateur` (Délégué).
- **Permissions Granulaires :** Gestion fine des accès par onglet (Garages, Devis, Scans, Logs, Utilisateurs Mobile).
- **Journal d'Audit :** Traçabilité complète de toutes les actions critiques effectuées par les admins.
- **MonAuto Database :** Suivi en temps réel de l'adoption mobile et de la flotte de véhicules enregistrée.

### 2. Portail Garage (ERP PARTNER)
Outil métier destiné aux gérants de garages et mécaniciens.
- **Gestion CRM :** Base de données clients et historique complet des véhicules.
- **Workflow Atelier :** Suivi des réparations et documents techniques.
- **Paramétrage :** Personnalisation des rôles et accès pour le staff du garage.

### 3. Application Mobile (L'Automobiliste)
Interface simplifiée pour le client final.
- **Identité Numérique :** Génération d'un Code QR unique pour identification rapide en atelier.
- **Gestion de Flotte :** Enregistrement des véhicules et suivi centralisé.
- **Pro Devis Auto :** Demandes de devis transmises directement aux garages pour modération.

---

## 🛠️ Installation & Démarrage

### Pré-requis
- Node.js (Version LTS)
- Serveur PostgreSQL ou instance Supabase.
- [Optionnel] XAMPP pour l'hébergement local de fichiers.

### 1. Configuration du Backend (NestJS)
```bash
# Se rendre dans le répertoire du projet
npm install

# Configurer les variables d'environnement (.env)
DATABASE_URL="postgresql://user:password@localhost:5432/ice_db"

# Synchroniser la base de données
npx prisma db push
```

### 2. Lancement du Frontend
```bash
# Lancer le serveur de développement Angular
npm run dev
```

---

## 🔒 Sécurité & Accès
Le système utilise un mécanisme de session persistante sans `localStorage` pour les données sensibles, garantissant que les changements de permissions sont appliqués au premier rafraîchissement.

- **Accès Root par défaut :** `owner@icebymecatech.ci` (Mot de passe configuré à l'installation).

---

## 📱 Roadmap Mobile (Prochaines Étapes)
Projet de conversion en application native via **Capacitor** :
- **Application Native** : Build Android (.apk) et iOS (.ipa) à partir du code source existant.
- **Isolation** : Utilisation du routage Angular pour garantir que l'application installée n'affiche que le module `MonAuto`.
- **Notifications** : Intégration des notifications push pour le suivi des dossiers en temps réel.

---

<div align="center">
  <p>© 2026 MECATECH-LV - Tous droits réservés.</p>
</div>
