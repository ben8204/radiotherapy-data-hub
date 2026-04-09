#!/bin/bash

# Script de démarrage pour l'application Radiotherapy Data Hub

set -e

echo "Démarrage de Radiotherapy Data Hub..."

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "Erreur : Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si docker-compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "Erreur : docker-compose n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "Création du fichier .env..."
    cp .env.example .env
    echo "Attention : modifier le mot de passe dans .env avant la mise en production"
fi

# Build les images
echo "Construction des images Docker..."
docker-compose build

# Démarrer les services
echo "Démarrage des services..."
docker-compose up -d

# Attendre que les services soient prêts
echo "Attente du démarrage des services..."
sleep 10

# Vérifier le statut
echo "Vérification du statut..."
docker-compose ps

# Afficher les URLs
echo ""
echo "Application démarrée"
echo "---"
echo "Frontend : http://localhost:80"
echo "Backend API : http://localhost:80/api"
echo "Base de données : localhost:5432"
echo "---"
echo ""
echo "Pour voir les logs : docker-compose logs -f"
echo "Pour arrêter : docker-compose down"
echo ""
