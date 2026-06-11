import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Share2, Database, Zap, AlertCircle, Download, FolderOpen, Loader2, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArticleForm } from "@/components/articles/ArticleForm";
import { ExperiencesManager, DraftExperience } from "@/components/articles/ExperiencesManager";
import { api } from "@/services/api";

interface ArticleFormData {
    titre: string;
    auteurs?: string;
    doi?: string;
}

interface CreatedArticle {
    article_id: number;
    titre: string;
    auteurs?: string;
    doi?: string;
}

type WorkflowState = "welcome" | "article-form" | "experiments" | "confirmation";

export default function WelcomePage() {
    const [workflowState, setWorkflowState] = useState<WorkflowState>("welcome");

    // Draft data stored in memory (not in DB)
    const [articleData, setArticleData] = useState<ArticleFormData | null>(null);
    const [draftExperiences, setDraftExperiences] = useState<DraftExperience[]>([]);

    

    // Submission states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [createdArticle, setCreatedArticle] = useState<CreatedArticle | null>(null);

    // --- NOUVEAUX ÉTATS POUR LE TÉLÉCHARGEMENT ---
    const [experiencesList, setExperiencesList] = useState<any[]>([]);
    const [selectedExperience, setSelectedExperience] = useState<any | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const handleArticleFormSubmit = (data: ArticleFormData) => {
        // Store article data in memory, don't submit to DB yet
        setArticleData(data);
        setSubmitError(null);
        setWorkflowState("experiments");
    };

    const handleExperienceAdded = (experience: DraftExperience) => {
        // Add experience to draft list in memory
        setDraftExperiences((prev) => [...prev, experience]);
    };

    const handleExperienceDeleted = (tempId: string) => {
        // Remove experience from draft list
        setDraftExperiences((prev) => prev.filter((exp) => exp.tempId !== tempId));
    };

    const handleExperienceUpdated = (experience: DraftExperience) => {
        // Update experience in draft list
        setDraftExperiences((prev) =>
            prev.map((exp) => (exp.tempId === experience.tempId ? experience : exp))
        );
    };

    const handleExperimentsComplete = async () => {
        // Validate we have at least one experience
        if (!articleData) {
            setSubmitError("Article data is missing");
            return;
        }

        if (draftExperiences.length === 0) {
            setSubmitError("Please add at least one experiment before submitting");
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Step 1: Create article in database
            const createdArticleResponse = await api.createArticle({
                titre: articleData.titre,
                auteurs: articleData.auteurs,
                doi: articleData.doi,
            });

            const articleId = createdArticleResponse.article_id;
            setCreatedArticle(createdArticleResponse);

            // Step 2: Create all experiences for this article
            for (const experience of draftExperiences) {
                // Validate that a file is present
                if (!experience.data.file) {
                    throw new Error(`Experience "${experience.description || 'Untitled'}" is missing a data file`);
                }

                await api.submitExperienceToArticle(articleId, {
                    experience_description: experience.description,
                    machines: experience.machines,
                    detectors: experience.detectors,
                    phantoms: experience.phantoms,
                    file: experience.data.file,
                    data_type: experience.data.dataType,
                    data_description: experience.data.description,
                    columnMapping: experience.data.columnMapping,
                });
            }

            // Success: move to confirmation
            setIsSubmitting(false);
            setWorkflowState("confirmation");
        } catch (error) {
            // Error: keep data in memory, show error message
            const errorMessage =
                error instanceof Error ? error.message : "An error occurred during submission";
            setSubmitError(errorMessage);
            setIsSubmitting(false);
        }
    };

    const handleBackToWelcome = () => {
        setWorkflowState("welcome");
        setArticleData(null);
        setDraftExperiences([]);
        setSubmitError(null);
        setCreatedArticle(null);
    };

    const handleSubmitAnotherArticle = () => {
        setArticleData(null);
        setDraftExperiences([]);
        setSubmitError(null);
        setIsSubmitting(false);
        setCreatedArticle(null);
        setWorkflowState("article-form");
    };

    const handleGoToDownloads = async () => {
        setWorkflowState("download-explorer");
        setIsLoadingData(true);
        try {
            const data = await api.getExperiences();
            setExperiencesList(data);
        } catch (error) {
            console.error("Erreur lors de la récupération des expériences:", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleSelectExperience = async (id: number) => {
        setSelectedId(id);
        setSelectedExperience(null);
        try {
            const response = await fetch(`/api/experiences/${id}/summary`);
            if (response.ok) {
                const summary = await response.json();
                setSelectedExperience(summary);
            }
        } catch (error) {
            console.error("Erreur lors du chargement du résumé:", error);
        }
    };

    // Welcome page
    if (workflowState === "welcome") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
                <div className="max-w-4xl mx-auto p-6 py-20">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="flex justify-center mb-6">
                            {/* On remplace rounded-full (cercle) par rounded-2xl (carré arrondi) et on ajoute une ombre */}
                            <div className="bg-white p-2 rounded-2xl shadow-md h-28 w-28">
                                <img 
                                    src="/linac2.PNG" 
                                    alt="Accélérateur linéaire" 
                                    className="h-full w-full object-contain rounded-xl" 
                                />
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold text-foreground mb-4">
                            Radiotherapy Data Hub
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            A platform for sharing radiotherapy research data and advancing deep learning in medical physics
                        </p>
                    </div>

                    {/* Features */}
                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        <Card className="border-2">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <Database className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-base">Organize Data</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                Structure your radiotherapy experiments with machines, detectors, and phantoms
                            </CardContent>
                        </Card>

                        <Card className="border-2">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-base">Multiple Experiments</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                Add multiple experiments per article to capture comprehensive datasets
                            </CardContent>
                        </Card>

                        <Card className="border-2">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <Share2 className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-base">Contribute Science</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                Help advance radiotherapy AI by sharing your research data securely
                            </CardContent>
                        </Card>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex justify-center gap-4">
                        <Button
                            size="lg"
                            onClick={() => setWorkflowState("article-form")}
                            className="text-base h-12 px-8"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Submit New Article
                        </Button>

                        {/* NOUVEAU BOUTON DE TÉLÉCHARGEMENT */}
                        <Button
                            size="lg"
                            onClick={handleGoToDownloads}
                            className="text-base h-12 px-8"
                        >
                            <Download className="h-5 w-5 mr-2" />
                            Download Data
                        </Button>
                    </div>

                    {/* Footer info */}
                    <div className="mt-20 pt-12 border-t text-center text-sm text-muted-foreground">
                        <p>
                            By submitting your data, you contribute to advancing radiotherapy research and deep learning applications in medical physics.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Article form state - Draft mode: no DB writes yet
    if (workflowState === "article-form") {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-2xl mx-auto p-6 py-12">
                    <Button
                        variant="outline"
                        onClick={handleBackToWelcome}
                        className="mb-6"
                    >
                        ← Back
                    </Button>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Submit New Article
                        </h1>
                        <p className="text-muted-foreground">
                            Provide information about your publication
                        </p>
                    </div>

                    <Card>
                        <CardContent className="pt-6">
                            <ArticleForm onSuccess={handleArticleFormSubmit} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Experiments management state - Draft mode: experiences stored in memory
    if (workflowState === "experiments" && articleData) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto p-6 py-12">
                    <Button
                        variant="outline"
                        onClick={handleBackToWelcome}
                        className="mb-6"
                    >
                        ← Back
                    </Button>

                    {/* Article header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            {articleData.titre}
                        </h1>
                        <p className="text-muted-foreground">
                            {articleData.auteurs}
                            {articleData.doi && ` • DOI: ${articleData.doi}`}
                        </p>
                    </div>

                    {/* Error message if submission failed */}
                    {submitError && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{submitError}</AlertDescription>
                        </Alert>
                    )}

                    {/* Experiments manager with draft mode */}
                    <ExperiencesManager
                        draftExperiences={draftExperiences}
                        onExperienceAdded={handleExperienceAdded}
                        onExperienceDeleted={handleExperienceDeleted}
                        onExperienceUpdated={handleExperienceUpdated}
                        onCompleteSubmission={handleExperimentsComplete}
                        isSubmitting={isSubmitting}
                    />
                </div>
            </div>
        );
    }

    // Confirmation state - Final submission was successful
    if (workflowState === "confirmation" && createdArticle) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-6">
                <Card className="max-w-md w-full border-2 border-primary">
                    <CardContent className="pt-12 text-center pb-12">
                        <div className="flex justify-center mb-6">
                            <div className="bg-green-500/10 p-4 rounded-full">
                                <Zap className="h-12 w-12 text-green-600" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-foreground mb-3">
                            Submission Complete!
                        </h1>

                        <p className="text-muted-foreground mb-6">
                            Your article <span className="font-semibold">"{createdArticle.titre}"</span> and {draftExperiences.length} experiment{draftExperiences.length > 1 ? 's' : ''} have been successfully submitted to the Radiotherapy Data Hub.
                        </p>

                        <p className="text-sm text-muted-foreground mb-8">
                            Thank you for contributing to the advancement of radiotherapy research and AI development.
                        </p>

                        <div className="flex flex-col gap-3">
                            <Button onClick={handleSubmitAnotherArticle} className="bg-green-600 hover:bg-green-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Submit Another Article
                            </Button>
                            <Button onClick={handleBackToWelcome} variant="outline">
                                ← Back to Home
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (workflowState === "download-explorer") {
        // --- LOGIQUE DE REGROUPEMENT ---
        // On regroupe experiencesList par Article
        const articlesGroupes = experiencesList.reduce((acc, exp) => {
            const articleId = exp.article_id || "unknown";
            if (!acc[articleId]) {
                acc[articleId] = {
                    article_id: articleId,
                    titre: exp.article_title || `Article ID: ${articleId}`, // Utilise le vrai titre s'il vient de l'API
                    doi: exp.doi,
                    experiences: []
                };
            }
            acc[articleId].experiences.push(exp);
            return acc;
        }, {} as Record<string, any>);

        const listeArticles = Object.values(articlesGroupes);

        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-6xl mx-auto p-6 py-12">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setWorkflowState("welcome");
                            setSelectedExperience(null);
                            setSelectedId(null);
                        }}
                        className="mb-6"
                    >
                        ← Back
                    </Button>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Scientific Data Explorer
                        </h1>
                        <p className="text-muted-foreground">
                            Browse articles and select an experiment to download its associated dosimetry files.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* --- Colonne Gauche : Liste hiérarchisée --- */}
                        <div className="md:col-span-1 space-y-4">
                            <h2 className="font-semibold text-lg mb-2">Publications & Data</h2>
                            
                            {isLoadingData ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : listeArticles.length === 0 ? (
                                <p className="text-sm text-muted-foreground p-4 border rounded-lg border-dashed text-center">
                                    No Data in Database
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {listeArticles.map((article) => (
                                        <div key={article.article_id} className="border rounded-xl bg-card overflow-hidden">
                                            {/* En-tête de l'Article */}
                                            <div className="bg-muted/30 p-3 border-b flex items-start gap-3">
                                                <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold text-sm line-clamp-2">{article.titre}</p>
                                                    {article.doi && <p className="text-xs text-muted-foreground mt-0.5">DOI: {article.doi}</p>}
                                                </div>
                                            </div>

                                            {/* Liste des Expériences de cet Article */}
                                            <div className="p-2 space-y-1 bg-background">
                                                {article.experiences.map((exp: any) => (
                                                    <button
                                                        key={exp.experience_id}
                                                        onClick={() => handleSelectExperience(exp.experience_id)}
                                                        className={`w-full text-left p-3 rounded-lg transition-all flex items-start gap-3 ${
                                                            selectedId === exp.experience_id
                                                                ? "bg-primary/10 text-primary font-medium"
                                                                : "hover:bg-muted/50 text-foreground"
                                                        }`}
                                                    >
                                                        <FolderOpen className={`h-4 w-4 mt-0.5 shrink-0 ${selectedId === exp.experience_id ? "text-primary" : "text-muted-foreground"}`} />
                                                        <div>
                                                            <p className="text-sm line-clamp-1">{exp.description || `Expérience #${exp.experience_id}`}</p>
                                                            <p className="text-xs opacity-70 mt-0.5">ID: {exp.experience_id}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* --- Colonne Droite : INTACTE --- */}
                        <div className="md:col-span-2">
                            <Card className="h-full min-h-[300px] sticky top-6">
                                <CardContent className="pt-6">
                                    {!selectedId ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-12 text-muted-foreground">
                                            <Download className="h-12 w-12 mb-4 opacity-20" />
                                            <p>Please select an experiment from the list on the left to view its files.</p>
                                        </div>
                                    ) : !selectedExperience ? (
                                        <div className="flex flex-col items-center justify-center p-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                            <p className="text-sm text-muted-foreground">Loading Experience Details...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div>
                                                <h2 className="text-xl font-bold text-foreground mb-1">Details of the Experience</h2>
                                                <p className="text-sm text-muted-foreground">{selectedExperience.description}</p>
                                            </div>

                                            {/* Liste des fichiers téléchargeables */}
                                            <div className="space-y-3">
                                                <h3 className="font-semibold text-sm text-foreground uppercase tracking-wider">Data Files ({selectedExperience.data?.length || 0})</h3>
                                                {!selectedExperience.data || selectedExperience.data.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground border rounded-lg p-4 bg-muted/20">No data linked to this experience</p>
                                                ) : (
                                                    selectedExperience.data.map((file: any, index: number) => (
                                                        <div key={index} className="flex items-center justify-between p-4 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
                                                            <div className="space-y-1">
                                                                <p className="font-medium text-sm text-foreground">
                                                                    {file.data_type || `Fichier de données #${index + 1}`}
                                                                </p>
                                                                {file.description && <p className="text-xs text-muted-foreground">{file.description}</p>}
                                                                {file.unit && <p className="text-xs text-primary bg-primary/5 inline-block px-2 py-0.5 rounded">Unité : {file.unit}</p>}
                                                            </div>
                                                            <Button asChild size="sm" variant="default" className="gap-2">
                                                                <a
                                                                    href={api.getDownloadUrl(selectedId, index)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                    Download
                                                                </a>
                                                            </Button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
