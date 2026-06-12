import { useState } from "react";
import { api, ApiError } from "@/services/api";
import type { FormData } from "@/components/dosimetry/FormWizard";
import { useToast } from "@/hooks/use-toast";

interface SubmitState {
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  articleId: number | null;
  failedStep: number | null;
}

// Retry logic for failed requests
const retryRequest = async <T,>(
  request: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await request();
    } catch (error) {
      lastError = error;

      if (error instanceof ApiError && error.statusCode < 500) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`⏳ Retry attempt ${attempt + 1}/${maxRetries} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

export const useFormSubmit = () => {
  const { toast } = useToast();

  const [state, setState] = useState<SubmitState>({
    isSubmitting: false,
    error: null,
    success: false,
    articleId: null,
    failedStep: null,
  });

  const submitForm = async (formData: FormData): Promise<boolean> => {
    setState({ isSubmitting: true, error: null, success: false, articleId: null, failedStep: null });

    try {
      console.log("🎯 Starting atomic submission with complete endpoint...");

      // NOUVEAU : On filtre pour ne garder que les blocs où un fichier a bien été uploadé
      const validDataBlocks = Array.isArray(formData.data) 
        ? formData.data.filter(d => d.file !== null) 
        : [];

      // On sépare les fichiers physiques des métadonnées
      const files = validDataBlocks.map(d => d.file!);
      const data_metadata = validDataBlocks.map(d => ({
        dataType: d.dataType || "raw",
        description: d.description || "",
        columnMapping: d.columnMapping || []
      }));

      // Prepare complete submission data
      const submissionData = {
        title: formData.article.title,
        authors: formData.article.authors,
        doi: formData.article.doi || undefined,
        experience_description: formData.experience.description,
        machines: formData.machines
          .filter((m) => m.model)
          .map((m) => ({
            manufacturer: m.manufacturer,
            model: m.model,
            machineType: m.machineType,
            energy: m.energy || undefined,
            collimation: m.collimation || undefined,
            settings: m.settings || undefined,
          })),
        detectors: formData.detectors
          .filter((d) => d.detectorType)
          .map((d) => ({
            detectorType: d.detectorType,
            model: d.model,
            manufacturer: d.manufacturer,
            position: d.position || undefined,
            depth: d.depth || undefined,
            orientation: d.orientation || undefined,
          })),
        phantoms: formData.phantoms
          .filter((p) => p.name || p.phantom_type)
          .map((p) => ({
            name: p.name,
            phantom_type: p.phantom_type,
            dimensions: p.dimensions,
            material: p.material,
            position: p.position || undefined,
            orientation: p.orientation || undefined,
          })),
        // NOUVEAU : On passe nos tableaux au lieu des variables uniques
        files: files,
        data_metadata: data_metadata,
      };

      console.log("📤 Submitting complete experiment to backend (atomic transaction)...");
      const result = await retryRequest(() =>
        api.submitCompleteExperiment(submissionData)
      );

      console.log("✅ Complete submission successful!");
      
      setState({
        isSubmitting: false,
        error: null,
        success: true,
        articleId: result.article_id,
        failedStep: null,
      });

      toast({
        title: "Submission successful!",
        description: `Article "${formData.article.title}" and experiment have been saved.`,
      });

      return true;
    } catch (error) {
      console.error("❌ Submission error:", error);

      let failedStep = 1;
      let message = "Failed to submit. Please check your connection and try again.";

      if (error instanceof ApiError) {
        message = error.message;
        if (message.includes("article")) failedStep = 1;
        else if (message.includes("experience")) failedStep = 2;
        else if (message.includes("machine")) failedStep = 3;
        else if (message.includes("detector")) failedStep = 5;
        else if (message.includes("phantom")) failedStep = 7;
        else if (message.includes("data") || message.includes("file")) failedStep = 9;
      } else if (error instanceof Error) {
        message = error.message;
      }

      setState({
        isSubmitting: false,
        error: message,
        success: false,
        articleId: null,
        failedStep,
      });

      toast({ title: "Submission failed", description: message, variant: "destructive" });
      return false;
    }
  };

  const submitExperienceForm = async (formData: FormData, articleId: number): Promise<boolean> => {
    setState({ isSubmitting: true, error: null, success: false, articleId: null, failedStep: null });

    try {
      console.log("🎯 Starting experience submission for article", articleId);

      // NOUVEAU : La même logique d'extraction pour l'ajout d'une expérience existante
      const validDataBlocks = Array.isArray(formData.data) 
        ? formData.data.filter(d => d.file !== null) 
        : [];

      const files = validDataBlocks.map(d => d.file!);
      const data_metadata = validDataBlocks.map(d => ({
        dataType: d.dataType || "raw",
        description: d.description || "",
        columnMapping: d.columnMapping || []
      }));

      const submissionData = {
        experience_description: formData.experience.description,
        machines: formData.machines
          .filter((m) => m.model)
          .map((m) => ({
            manufacturer: m.manufacturer,
            model: m.model,
            machineType: m.machineType,
            energy: m.energy || undefined,
            collimation: m.collimation || undefined,
            settings: m.settings || undefined,
          })),
        detectors: formData.detectors
          .filter((d) => d.detectorType)
          .map((d) => ({
            detectorType: d.detectorType,
            model: d.model,
            manufacturer: d.manufacturer,
            position: d.position || undefined,
            depth: d.depth || undefined,
            orientation: d.orientation || undefined,
          })),
        phantoms: formData.phantoms
          .filter((p) => p.name || p.phantom_type)
          .map((p) => ({
            name: p.name,
            phantom_type: p.phantom_type,
            dimensions: p.dimensions,
            material: p.material,
            position: p.position || undefined,
            orientation: p.orientation || undefined,
          })),
        // NOUVEAU
        files: files,
        data_metadata: data_metadata,
      };

      console.log("📤 Submitting experience to backend...");
      const result = await retryRequest(() =>
        api.submitExperienceToArticle(articleId, submissionData)
      );

      console.log("✅ Experience submission successful!");

      setState({
        isSubmitting: false,
        error: null,
        success: true,
        articleId: articleId,
        failedStep: null,
      });

      toast({
        title: "Experiment added successfully!",
        description: `New experiment has been saved to the article.`,
      });

      return true;
    } catch (error) {
      console.error("❌ Experience submission error:", error);

      let failedStep = 1;
      let message = "Failed to submit. Please check your connection and try again.";

      if (error instanceof ApiError) {
        message = error.message;
        if (message.includes("experience")) failedStep = 1;
        else if (message.includes("machine")) failedStep = 2;
        else if (message.includes("detector")) failedStep = 3;
        else if (message.includes("phantom")) failedStep = 4;
        else if (message.includes("data") || message.includes("file")) failedStep = 5;
      } else if (error instanceof Error) {
        message = error.message;
      }

      setState({
        isSubmitting: false,
        error: message,
        success: false,
        articleId: null,
        failedStep,
      });

      toast({ title: "Experience submission failed", description: message, variant: "destructive" });
      return false;
    }
  };

  return {
    ...state,
    submitForm,
    submitExperienceForm,
  };
};