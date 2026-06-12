import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArticleStep } from "./steps/ArticleStep";
import { ExperienceStep } from "./steps/ExperienceStep";
import { MachineStep } from "./steps/MachineStep";
import { DetectorStep } from "./steps/DetectorStep";
import { PhantomStep } from "./steps/PhantomStep";
import { DataStep } from "./steps/DataStep";
import { ColumnMappingStep, type ColumnMapping } from "./steps/ColumnMappingStep";
import { SummaryStep } from "./steps/SummaryStep";
import { useFormSubmit } from "@/hooks/useFormSubmit";

export interface FormData {
  article: {
    title: string;
    authors: string;
    doi: string;
  };
  experience: {
    description: string;
  };
  machines: Array<{
    manufacturer: string;
    model: string;
    machineType: string;
  }>;
  detectors: Array<{
    detectorType: string;
    model: string;
    manufacturer: string;
  }>;
  phantoms: Array<{
    phantom_type: string;
    manufacturer: string;
    model: string;
    dimensions: string;
    material: string;
    position?: string;
    orientation?: string;
  }>;
  data: Array<{
    dataType: string;
    fileFormat: string;
    description: string;
    file: File | null;
    columnMapping: ColumnMapping[];
  }>;
}

interface FormWizardProps {
  articleId?: number;
  experienceId?: number;
  draftMode?: boolean;
  initialData?: FormData;
  onSuccess?: (result: any) => void;
  onCancel?: () => void;
}

const stepsWithArticle = [
  { id: 1, name: "Article", description: "Publication details" },
  { id: 2, name: "Experience", description: "Experiment info" },
  { id: 3, name: "Machine", description: "Equipment used" },
  { id: 4, name: "Detector", description: "Detection devices" },
  { id: 5, name: "Phantom", description: "Dosimetric objects" },
  { id: 6, name: "Data", description: "Upload dataset" },
  { id: 7, name: "Columns", description: "Map columns" },
  { id: 8, name: "Summary", description: "Review & submit" },
];

const stepsWithoutArticle = [
  { id: 1, name: "Experience", description: "Experiment info" },
  { id: 2, name: "Machine", description: "Equipment used" },
  { id: 3, name: "Detector", description: "Detection devices" },
  { id: 4, name: "Phantom", description: "Dosimetric objects" },
  { id: 5, name: "Data", description: "Upload dataset" },
  { id: 6, name: "Columns", description: "Map columns" },
  { id: 7, name: "Summary", description: "Review & submit" },
];

export function FormWizard({ articleId, experienceId, draftMode = false, initialData, onSuccess, onCancel }: FormWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const { isSubmitting, submitForm, submitExperienceForm, failedStep } = useFormSubmit();
  const [formData, setFormData] = useState<FormData>(initialData || {
    article: { title: "", authors: "", doi: "" },
    experience: { description: "" },
    machines: [{ manufacturer: "", model: "", machineType: "" }],
    phantoms: [{ phantom_type: "", manufacturer: "", model: "", dimensions: "", material: "", position: "", orientation: "" }],
    detectors: [{ detectorType: "", model: "", manufacturer: "" }],
    data: [{ dataType: "", fileFormat: "", description: "", file: null, columnMapping: [] }],
  });

  // Determine which steps to show based on articleId or draftMode
  const steps = articleId || draftMode ? stepsWithoutArticle : stepsWithArticle;
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;
  const isForExistingArticle = !!articleId || draftMode;

  const updateFormData = <K extends keyof FormData>(
    section: K,
    data: FormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [section]: data }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async () => {
    // In draft mode, just return the form data without making API call
    if (draftMode) {
      onSuccess?.(formData);
      return;
    }

    let success = false;
    if (isForExistingArticle && articleId) {
      success = await submitExperienceForm(formData, articleId);
    } else {
      success = await submitForm(formData);
    }

    if (success) {
      // Reset form on success
      setFormData({
        article: { title: "", authors: "", doi: "" },
        experience: { description: "" },
        phantoms: [{ phantom_type: "", manufacturer: "", model: "", dimensions: "", material: "", position: "", orientation: "" }],
        machines: [{ manufacturer: "", model: "", machineType: "" }],
        detectors: [{ detectorType: "", model: "", manufacturer: "" }],
        data: [{ dataType: "", fileFormat: "", description: "", file: null, columnMapping: [] }],
      });
      setCurrentStep(1);
      onSuccess?.(success);
    } else if (failedStep && failedStep > 0) {
      // Navigate to the step that failed
      console.log(`📍 Navigating to failed step: ${failedStep}`);
      const adjustedStep = isForExistingArticle ? failedStep - 1 : failedStep;
      setCurrentStep(Math.max(1, adjustedStep));
      // Scroll to top so user sees the error
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const renderStep = () => {
    if (isForExistingArticle) {
      // When article is already selected, skip ArticleStep
      switch (currentStep) {
        case 1:
          return (
            <ExperienceStep
              data={formData.experience}
              onChange={(data) => updateFormData("experience", data)}
            />
          );
        case 2:
          return (
            <MachineStep
              data={formData.machines}
              onChange={(data) => updateFormData("machines", data)}
            />
          );
        case 3:
          return (
            <DetectorStep
              data={formData.detectors}
              onChange={(data) => updateFormData("detectors", data)}
            />
          );
        case 4:
          return (
            <PhantomStep
              data={formData.phantoms}
              onChange={(data) => updateFormData("phantoms", data)}
            />
          );
        case 5:
          return (
            <DataStep
              data={formData.data}
              onChange={(data) => updateFormData("data", data)}
            />
          );
        case 6:
          return (
            <ColumnMappingStep
              data={formData.data}
              onChange={(data) => updateFormData("data", data)}
            />
          );
        case 7:
          return <SummaryStep data={formData} onEdit={goToStep} isForExistingArticle={true} />;
        default:
          return null;
      }
    } else {
      // Original flow with article creation
      switch (currentStep) {
        case 1:
          return (
            <ArticleStep
              data={formData.article}
              onChange={(data) => updateFormData("article", data)}
            />
          );
        case 2:
          return (
            <ExperienceStep
              data={formData.experience}
              onChange={(data) => updateFormData("experience", data)}
            />
          );
        case 3:
          return (
            <MachineStep
              data={formData.machines}
              onChange={(data) => updateFormData("machines", data)}
            />
          );
        case 4:
          return (
            <DetectorStep
              data={formData.detectors}
              onChange={(data) => updateFormData("detectors", data)}
            />
          );
        case 5:
          return (
            <PhantomStep
              data={formData.phantoms}
              onChange={(data) => updateFormData("phantoms", data)}
            />
          );
        case 6:
          return (
            <DataStep
              data={formData.data}
              onChange={(data) => updateFormData("data", data)}
            />
          );
        case 7:
          return (
            <ColumnMappingStep
              data={formData.data}
              onChange={(data) => updateFormData("data", data)}
            />
          );
        case 8:
          return <SummaryStep data={formData} onEdit={goToStep} />;
        default:
          return null;
      }
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isForExistingArticle ? "Add New Experiment" : "Dosimetry Data Collection"}
          </h1>
          <p className="text-muted-foreground">
            {isForExistingArticle
              ? "Add a new experiment to this article"
              : "Submit your radiotherapy research data for deep learning training"}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentStep} of {steps.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stepper */}
        <nav aria-label="Progress" className="mb-8">
          <ol className="flex items-center justify-between">
            {steps.map((step, index) => (
              <li key={step.id} className="flex-1">
                <button
                  onClick={() => goToStep(step.id)}
                  disabled={step.id > currentStep}
                  className={cn(
                    "group flex flex-col items-center w-full",
                    step.id <= currentStep ? "cursor-pointer" : "cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center w-full">
                    {index > 0 && (
                      <div
                        className={cn(
                          "h-0.5 flex-1 transition-colors",
                          step.id <= currentStep ? "bg-primary" : "bg-muted"
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        step.id < currentStep
                          ? "border-primary bg-primary text-primary-foreground"
                          : step.id === currentStep
                            ? "border-primary bg-background text-primary"
                            : "border-muted bg-background text-muted-foreground"
                      )}
                    >
                      {step.id < currentStep ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-medium">{step.id}</span>
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          "h-0.5 flex-1 transition-colors",
                          step.id < currentStep ? "bg-primary" : "bg-muted"
                        )}
                      />
                    )}
                  </div>
                  <div className="mt-2 text-center hidden sm:block">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        step.id <= currentStep
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.name}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {/* Form content */}
        <div className="bg-card rounded-lg border shadow-sm p-6 mb-6">
          {renderStep()}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            {onCancel && !isForExistingArticle && (
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>

          {currentStep < steps.length ? (
            <Button onClick={nextStep}>
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Data"
              )}
            </Button>
          )}
        </div>

        {/* Save draft hint */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          Your progress is automatically saved as a draft
        </p>
      </div>
    </div>
  );
}
