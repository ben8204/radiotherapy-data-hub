import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";

// J'ai ajouté 'annee' en optionnel pour l'exemple numérique 
// (si ta base de données ne l'attend pas, tu pourras le retirer plus tard)
interface ArticleFormData {
    titre: string;
    auteurs: string;
    doi?: string;
    annee?: number; 
}

interface ArticleFormProps {
    onSuccess: (data: ArticleFormData) => void;
}

export function ArticleForm({ onSuccess }: ArticleFormProps) {
    // 1. Les états des champs (tout est en string au départ pour la saisie)
    const [formData, setFormData] = useState({
        titre: "",
        auteurs: "",
        doi: "",
        annee: "",
    });
    
    // 2. Dictionnaire pour stocker les erreurs par champ
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Si l'utilisateur commence à corriger, on efface l'erreur de ce champ spécifique
        if (errors[field]) {
            const newErrors = { ...errors };
            delete newErrors[field];
            setErrors(newErrors);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        // --- SÉCURITÉ 1 : Champs obligatoires (Vide) ---
        if (!formData.titre.trim()) {
            newErrors.titre = "Le titre est obligatoire.";
        }

        if (!formData.auteurs.trim()) {
            newErrors.auteurs = "Veuillez renseigner au moins un auteur.";
        }

        // --- SÉCURITÉ 2 : Format spécifique (Optionnel mais contraint) ---
        if (formData.doi && !formData.doi.trim().startsWith("10.")) {
            newErrors.doi = "Un DOI valide commence généralement par '10.'.";
        }

        // --- SÉCURITÉ 3 : Type numérique et Plage de valeurs ---
        const anneeNum = parseInt(formData.annee, 10);
        if (!formData.annee.trim()) {
            newErrors.annee = "L'année de publication est obligatoire.";
        } else if (isNaN(anneeNum)) {
            newErrors.annee = "L'année doit être un nombre valide.";
        } else if (anneeNum < 1900 || anneeNum > 2026) {
            newErrors.annee = "L'année doit être comprise entre 1900 et 2026.";
        }

        // --- DÉCISION : Passe-t-on à la suite ? ---
        if (Object.keys(newErrors).length > 0) {
            // S'il y a des erreurs, on les affiche et ON S'ARRÊTE (Fail Fast)
            setErrors(newErrors);
            return;
        }

        // Si tout est parfait, on envoie les données formatées
        onSuccess({
            titre: formData.titre.trim(),
            auteurs: formData.auteurs.trim(),
            doi: formData.doi.trim() || undefined,
            annee: anneeNum,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Affichage global s'il y a au moins une erreur */}
            {Object.keys(errors).length > 0 && (
                <div className="flex items-start gap-3 p-4 bg-destructive/10 text-destructive rounded-lg">
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-medium">Action requise</p>
                        <p className="text-sm">Veuillez corriger les erreurs ci-dessous avant de continuer.</p>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="titre" className={errors.titre ? "text-destructive" : ""}>
                    Title <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="titre"
                    placeholder="Enter article title"
                    value={formData.titre}
                    onChange={(e) => handleChange("titre", e.target.value)}
                    // L'interface de shadcn gère souvent les bordures rouges avec des classes utilitaires
                    className={errors.titre ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {/* Message d'erreur localisé */}
                {errors.titre && <p className="text-sm text-destructive">{errors.titre}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="auteurs" className={errors.auteurs ? "text-destructive" : ""}>
                    Authors <span className="text-destructive">*</span>
                </Label>
                <Textarea
                    id="auteurs"
                    placeholder="Enter authors (comma-separated or one per line)"
                    value={formData.auteurs}
                    onChange={(e) => handleChange("auteurs", e.target.value)}
                    rows={3}
                    className={errors.auteurs ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.auteurs && <p className="text-sm text-destructive">{errors.auteurs}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="annee" className={errors.annee ? "text-destructive" : ""}>
                    Publication Year <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="annee"
                    placeholder="e.g., 2025"
                    value={formData.annee}
                    onChange={(e) => handleChange("annee", e.target.value)}
                    className={errors.annee ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.annee && <p className="text-sm text-destructive">{errors.annee}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="doi" className={errors.doi ? "text-destructive" : ""}>
                    DOI
                </Label>
                <Input
                    id="doi"
                    placeholder="e.g., 10.1234/example"
                    value={formData.doi}
                    onChange={(e) => handleChange("doi", e.target.value)}
                    className={errors.doi ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.doi && <p className="text-sm text-destructive">{errors.doi}</p>}
            </div>

            {/* Le bouton n'est plus désactivé par défaut. 
                S'il clique dessus avec des champs vides, ça déclenchera l'affichage des erreurs rouges ! */}
            <Button type="submit" className="w-full">
                Continue
            </Button>
        </form>
    );
}