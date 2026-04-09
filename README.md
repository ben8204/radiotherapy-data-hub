# Radiotherapy Data Hub

Application web pour la gestion et l'analyse de données de dosimétrie en radiothérapie.

## Fonctionnalités

- Gestion d'articles scientifiques
- Suivi d'expériences de dosimétrie
- Gestion des machines de traitement
- Gestion des détecteurs
- Gestion des fantômes (phantoms)
- Upload et stockage de données
- Cartographie des colonnes de données

## Architecture

**Backend :**
- FastAPI (Python 3.11)
- PostgreSQL 15
- SQLAlchemy ORM
- Pydantic pour la validation

**Frontend :**
- React 18 + TypeScript
- Vite pour le build
- Tailwind CSS + shadcn/ui
- React Router pour la navigation

## Démarrage rapide

### Avec Docker (Recommandé)

```bash
# 1. Cloner le repository
git clone https://github.com/paradiselovin/radiotherapy-data-hub.git
cd radiotherapy-data-hub

# 2. Lancer l'application
./start.sh
```

L'application sera disponible sur http://localhost:80

### Sans Docker

**Backend :**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend :**
```bash
cd frontend
npm install
npm run dev
```

## Configuration

Créer un fichier `.env` à partir de `.env.example` et adapter les variables :

```env
# Base de données
POSTGRES_USER=radiotherapy
POSTGRES_PASSWORD=votre_mot_de_passe_securise
POSTGRES_DB=radiotherapy_db

# Backend
DATABASE_URL=postgresql://radiotherapy:password@db:5432/radiotherapy_db
CORS_ORIGINS=http://localhost:3000,https://dosimetrie.centralesupelec.fr

# Port d'exposition
PORT=80
```

## Déploiement

Voir [DEPLOYMENT.md](DEPLOYMENT.md) pour les instructions détaillées de déploiement sur CentraleSupélec.

### Résumé du déploiement

**Informations nécessaires :**
- **Ports** : 80 (HTTP) et 443 (HTTPS)
- **Sous-domaine** : dosimetrie.centralesupelec.fr
- **SSH** : Clé publique pour accès à docker-heb02

**Commandes de base :**
```bash
# Build et démarrage
docker-compose build
docker-compose up -d

# Vérifier le statut
docker-compose ps
docker-compose logs -f

# Arrêter
docker-compose down
```

## Structure du projet

```
radiotherapy-data-hub/
├── backend/               # API FastAPI
│   ├── app/
│   │   ├── models/       # Modèles SQLAlchemy
│   │   ├── routes/       # Endpoints API
│   │   ├── schemas/      # Schémas Pydantic
│   │   ├── services/     # Logique métier
│   │   └── main.py       # Point d'entrée
│   ├── data/             # Données persistantes
│   └── Dockerfile
├── frontend/             # Application React
│   ├── src/
│   │   ├── components/   # Composants React
│   │   ├── pages/        # Pages de l'app
│   │   ├── services/     # Client API
│   │   └── main.tsx      # Point d'entrée
│   ├── Dockerfile
│   └── nginx.conf        # Configuration Nginx
├── docker-compose.yml    # Orchestration Docker
├── DEPLOYMENT.md         # Guide de déploiement
└── start.sh             # Script de démarrage
```

## Commandes utiles

```bash
# Logs en temps réel
docker-compose logs -f

# Redémarrer un service
docker-compose restart backend

# Accéder au shell d'un conteneur
docker-compose exec backend bash

# Backup de la base de données
docker-compose exec db pg_dump -U radiotherapy radiotherapy_db > backup.sql

# Restaurer la base de données
docker-compose exec -T db psql -U radiotherapy radiotherapy_db < backup.sql
```

## API Endpoints

### Articles
- `GET /articles/` - Liste des articles
- `POST /articles/` - Créer un article
- `GET /articles/{id}` - Détails d'un article
- `GET /articles/{id}/experiences` - Expériences d'un article

### Expériences
- `GET /experiences/` - Liste des expériences
- `POST /experiences/` - Créer une expérience

### Machines
- `GET /machines/` - Liste des machines
- `POST /machines/` - Créer une machine

### Détecteurs
- `GET /detectors/` - Liste des détecteurs
- `POST /detectors/` - Créer un détecteur

### Phantoms
- `GET /phantoms/` - Liste des phantoms
- `POST /phantoms/` - Créer un phantom

### Soumission complète
- `POST /complete/submit` - Soumission d'une expérience complète
- `POST /complete/submit-experience/{article_id}` - Ajouter une expérience à un article

## Sécurité

- Variables d'environnement pour les secrets
- CORS configuré pour les origines autorisées
- Health checks pour les services
- Validation des données avec Pydantic
- Note : Toujours changer le mot de passe PostgreSQL en production

## Monitoring

```bash
# Utilisation des ressources
docker stats

# Espace disque
docker system df

# Status des conteneurs
docker-compose ps
```

## Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request
