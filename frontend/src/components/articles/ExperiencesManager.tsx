import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Plus, Loader2, Settings2, Trash2 } from "lucide-react";
import { FormWizard } from "@/components/dosimetry/FormWizard";
import { api } from "@/services/api";

export interface DraftExperience {
    tempId: string;
    description: string;
    machines: any[];
    detectors: any[];
    phantoms: any[];
    data: Array<{
        dataType: string;
        fileFormat: string;
        description: string;
        file: File | null;
        columnMapping: any[];
    }>;
}

interface ExistingExperience {
    experience_id: number;
    description: string;
    [key: string]: any;
}

interface ExperiencesManagerProps {
    // For existing articles (load from API)
    articleId?: number;

    // For draft mode (in-memory)
    onExperienceAdded?: (experience: DraftExperience) => void;
    onExperienceDeleted?: (tempId: string) => void;
    onExperienceUpdated?: (experience: DraftExperience) => void;
    onAllExperimentsAdded?: () => void;
    onCompleteSubmission?: () => void | Promise<void>;
    draftExperiences?: DraftExperience[];
    isSubmitting?: boolean;
}

export function ExperiencesManager({
    articleId,
    onExperienceAdded,
    onExperienceDeleted,
    onExperienceUpdated,
    onAllExperimentsAdded,
    onCompleteSubmission,
    draftExperiences = [],
    isSubmitting = false,
}: ExperiencesManagerProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedExperience, setSelectedExperience] = useState<DraftExperience | null>(null);

    // For existing article mode
    const [experiences, setExperiences] = useState<ExistingExperience[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load experiences if articleId is provided (existing article mode)
    useEffect(() => {
        if (articleId) {
            loadExperiences();
        }
    }, [articleId]);

    const loadExperiences = async () => {
        if (!articleId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await api.getArticleExperiences(articleId);
            setExperiences(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load experiences");
        } finally {
            setLoading(false);
        }
    };

    // Determine if we're in draft mode or existing article mode
    const isDraftMode = !articleId;

    const handleExperienceAdded = (newExperience: DraftExperience) => {
        onExperienceAdded?.(newExperience);
        setShowAddForm(false);
    };

    const handleDeleteExperience = (tempId: string) => {
        // Call the delete callback, not add
        onExperienceDeleted?.(tempId);
    };

    const handleExperienceUpdated = (updatedExperience: DraftExperience) => {
        // Call the update callback
        onExperienceUpdated?.(updatedExperience);
        setSelectedExperience(null);
    };

    if (showAddForm) {
        return (
            <FormWizard
                articleId={articleId}
                draftMode={isDraftMode}
                onSuccess={(data) => {
                    if (isDraftMode) {
                        handleExperienceAdded({
                            tempId: `exp_${Date.now()}`,
                            description: data.experience.description,
                            machines: data.machines,
                            detectors: data.detectors,
                            phantoms: data.phantoms,
                            data: data.data,
                        });
                    } else {
                        // For existing article mode, reload experiences
                        loadExperiences();
                        setShowAddForm(false);
                    }
                }}
                onCancel={() => setShowAddForm(false)}
            />
        );
    }

    if (selectedExperience && isDraftMode) {
        // Convert DraftExperience to FormData format for pre-filling
        const initialFormData = {
            article: { title: "", authors: "", doi: "" },
            experience: { description: selectedExperience.description },
            machines: selectedExperience.machines,
            detectors: selectedExperience.detectors,
            phantoms: selectedExperience.phantoms,
            data: selectedExperience.data,
        };

        return (
            <div>
                <div className="mb-4">
                    <Button
                        variant="outline"
                        onClick={() => setSelectedExperience(null)}
                    >
                        ← Back to Experiments
                    </Button>
                </div>
                <FormWizard
                    draftMode={true}
                    initialData={initialFormData}
                    onSuccess={(data) => {
                        handleExperienceUpdated({
                            ...selectedExperience,
                            description: data.experience.description,
                            machines: data.machines,
                            detectors: data.detectors,
                            phantoms: data.phantoms,
                            data: data.data,
                        });
                    }}
                    onCancel={() => setSelectedExperience(null)}
                />
            </div>
        );
    }

    // Render based on mode
    if (isDraftMode) {
        // DRAFT MODE: In-memory experiences
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Experiments</h3>
                        <p className="text-sm text-muted-foreground">
                            Add experiments (will be submitted with the article)
                        </p>
                    </div>
                    <Button onClick={() => setShowAddForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Experiment
                    </Button>
                </div>

                {draftExperiences.length === 0 ? (
                    <div className="text-center py-8 px-4 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">
                            No experiments yet. Create one to get started.
                        </p>
                        <Button onClick={() => setShowAddForm(true)} className="mt-4">
                            <Plus className="h-4 w-4 mr-2" />
                            Create First Experiment
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {draftExperiences.map((exp) => (
                            <div
                                key={exp.tempId}
                                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-medium">
                                            {exp.description || "Untitled Experiment"}
                                        </h4>
                                        <div className="flex gap-4 mt-3 text-sm">
                                            <span className="text-muted-foreground">
                                                <span className="font-medium text-foreground">
                                                    {exp.machines.length}
                                                </span>{" "}
                                                machine{exp.machines.length !== 1 ? "s" : ""}
                                            </span>
                                            <span className="text-muted-foreground">
                                                <span className="font-medium text-foreground">
                                                    {exp.detectors.length}
                                                </span>{" "}
                                                detector{exp.detectors.length !== 1 ? "s" : ""}
                                            </span>
                                            <span className="text-muted-foreground">
                                                <span className="font-medium text-foreground">
                                                    {exp.phantoms.length}
                                                </span>{" "}
                                                phantom{exp.phantoms.length !== 1 ? "s" : ""}
                                            </span>
                                            <span className="text-muted-foreground">
                                                <span className="font-medium text-foreground">
                                                    {Array.isArray(exp.data) 
                                                    ? exp.data.filter(d => d.file).length 
                                                    : (exp.data && exp.data.file ? 1 : 0)}
                                                </span>{" "}
                                                file{Array.isArray(exp.data) 
                                                    ? (exp.data.filter(d => d.file).length !== 1 ? "s" : "") 
                                                    : ""}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedExperience(exp)}
                                        >
                                            <Settings2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteExperience(exp.tempId)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Complete submission button */}
                {draftExperiences.length > 0 && (
                    <div className="flex justify-end pt-4 border-t">
                        <Button
                            onClick={onCompleteSubmission || onAllExperimentsAdded}
                            disabled={isSubmitting}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Complete Submission"
                            )}
                        </Button>
                    </div>
                )}
            </div>
        );
    } else {
        // EXISTING ARTICLE MODE: Load from API
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Experiments</h3>
                        <p className="text-sm text-muted-foreground">
                            Manage experiments for this article
                        </p>
                    </div>
                    <Button onClick={() => setShowAddForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Experiment
                    </Button>
                </div>

                {error && (
                    <div className="flex items-start gap-3 p-4 bg-destructive/10 text-destructive rounded-lg">
                        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-muted-foreground">Loading experiments...</p>
                    </div>
                ) : experiences.length === 0 ? (
                    <div className="text-center py-8 px-4 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">
                            No experiments yet. Create one to get started.
                        </p>
                        <Button onClick={() => setShowAddForm(true)} className="mt-4">
                            <Plus className="h-4 w-4 mr-2" />
                            Create First Experiment
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {experiences.map((exp) => (
                            <div
                                key={exp.experience_id}
                                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-medium">
                                            {exp.description || "Untitled Experiment"}
                                        </h4>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }
}
