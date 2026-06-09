import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Microscope, Database, Zap, AlertCircle } from "lucide-react";
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
        setCreatedArticle(null);
        setWorkflowState("article-form");
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
                                    <Microscope className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-base">Contribute Science</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                Help advance radiotherapy AI by sharing your research data securely
                            </CardContent>
                        </Card>
                    </div>

                    {/* CTA Button */}
                    <div className="text-center">
                        <Button
                            size="lg"
                            onClick={() => setWorkflowState("article-form")}
                            className="text-base h-12 px-8"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Submit New Article
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

    return null;
}
