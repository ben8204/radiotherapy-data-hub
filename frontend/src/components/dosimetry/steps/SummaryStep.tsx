import { Pencil, FileText, Cpu, Radio, Database, TableProperties, Box, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FormData } from "../FormWizard";

interface SummaryStepProps {
  data: FormData;
  onEdit: (step: number) => void;
  isForExistingArticle?: boolean;
}

export function SummaryStep({ data, onEdit, isForExistingArticle }: SummaryStepProps) {
  // On s'assure que data.data est bien un tableau avant de le manipuler
  const dataFiles = Array.isArray(data.data) ? data.data : [data.data];

  // Calcul du nombre total de colonnes mappées (pour le badge)
  const totalColumnsCount = dataFiles.reduce(
    (total, fileData) => total + (fileData.columnMapping?.length || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Review Your Submission
        </h2>
        <p className="text-sm text-muted-foreground">
          Please verify all information before submitting
        </p>
      </div>

      {/* Article Section - Only show if creating new article */}
      {!isForExistingArticle && (
        <div className="border rounded-lg p-4 bg-card shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Article</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEdit(1)}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Title:</span>{" "}
              {data.article.title || <span className="text-destructive">Not provided</span>}
            </p>
            <p>
              <span className="text-muted-foreground">Authors:</span>{" "}
              {data.article.authors || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">DOI:</span>{" "}
              {data.article.doi || "—"}
            </p>
          </div>
        </div>
      )}

      {/* Experience Section */}
      <div className="border rounded-lg p-4 bg-card shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Experiment</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onEdit(isForExistingArticle ? 1 : 2)}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
        <p className="text-sm">
          {data.experience.description || (
            <span className="text-destructive">No description provided</span>
          )}
        </p>
      </div>

      {/* Machines Section */}
      <div className="border rounded-lg p-4 bg-card shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Machines</h3>
            <Badge variant="secondary">{data.machines.length}</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onEdit(isForExistingArticle ? 2 : 3)}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
        <div className="space-y-2">
          {data.machines.map((machine, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm bg-muted/50 rounded px-3 py-2 border border-border/50"
            >
              <span className="font-medium">
                {machine.model || "Unnamed machine"}
              </span>
              {machine.manufacturer && (
                <span className="text-muted-foreground">
                  by {machine.manufacturer}
                </span>
              )}
              {machine.machineType && (
                <Badge variant="outline" className="ml-auto bg-background">
                  {machine.machineType.toUpperCase()}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detectors Section */}
      <div className="border rounded-lg p-4 bg-card shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Detectors</h3>
            <Badge variant="secondary">{data.detectors.length}</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onEdit(isForExistingArticle ? 3 : 4)}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
        <div className="space-y-2">
          {data.detectors.map((detector, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm bg-muted/50 rounded px-3 py-2 border border-border/50"
            >
              <span className="font-medium">
                {detector.model || "Unnamed detector"}
              </span>
              {detector.manufacturer && (
                <span className="text-muted-foreground">
                  by {detector.manufacturer}
                </span>
              )}
              {detector.detectorType && (
                <Badge variant="outline" className="ml-auto bg-background">
                  {detector.detectorType.replace("_", " ")}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Phantoms Section */}
      <div className="border rounded-lg p-4 bg-card shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Phantoms</h3>
            <Badge variant="secondary">{data.phantoms.filter(p => p.model || p.phantom_type).length}</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onEdit(isForExistingArticle ? 4 : 5)}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
        <div className="space-y-2">
          {data.phantoms.filter(p => p.model || p.phantom_type).length > 0 ? (
            data.phantoms.filter(p => p.model || p.phantom_type).map((phantom, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm bg-muted/50 rounded px-3 py-2 border border-border/50"
              >
                <span className="font-medium">
                  {phantom.model || "Unnamed phantom"}
                </span>
                {phantom.manufacturer && (
                  <span className="text-muted-foreground">
                    by {phantom.manufacturer}
                  </span>
                )}
                {phantom.phantom_type && (
                  <Badge variant="outline" className="ml-auto bg-background">
                    {phantom.phantom_type.replace("_", " ")}
                  </Badge>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground p-2 border border-dashed rounded bg-muted/20">
              No phantoms added
            </p>
          )}
        </div>
      </div>

      {/* NEW: Multi-File Data Section */}
      <div className="border rounded-lg p-4 bg-card shadow-sm border-primary/20">
        <div className="flex items-center justify-between mb-4 border-b pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Datasets & Mappings</h3>
            <Badge variant="default" className="ml-2">{dataFiles.length} file{dataFiles.length !== 1 ? 's' : ''}</Badge>
            {totalColumnsCount > 0 && (
              <Badge variant="secondary" className="ml-1">{totalColumnsCount} mapped columns</Badge>
            )}
          </div>
          <div className="flex gap-2">
             <Button variant="ghost" size="sm" onClick={() => onEdit(isForExistingArticle ? 5 : 6)}>
               <Pencil className="h-4 w-4 mr-1" />
               Edit Files
             </Button>
             <Button variant="ghost" size="sm" onClick={() => onEdit(isForExistingArticle ? 6 : 7)}>
               <TableProperties className="h-4 w-4 mr-1" />
               Edit Columns
             </Button>
          </div>
        </div>

        <div className="space-y-6">
          {dataFiles.map((fileData, index) => (
            <div key={index} className="space-y-3 bg-muted/30 p-4 rounded-lg border border-border/50">
              {/* Infos du fichier */}
              <div className="flex items-start justify-between">
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <FileText className="h-4 w-4 text-primary" />
                    {fileData.file?.name || <span className="text-destructive">No file uploaded</span>}
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground pl-6">
                    <span>Type: <strong className="text-foreground font-medium">{fileData.dataType || "—"}</strong></span>
                    <span>Format: <strong className="text-foreground font-medium">{fileData.fileFormat || "—"}</strong></span>
                  </div>
                  {fileData.description && (
                    <p className="text-muted-foreground italic pl-6 mt-1 text-xs">
                      "{fileData.description}"
                    </p>
                  )}
                </div>
              </div>

              {/* Mappings du fichier */}
              <div className="pl-6 pt-2">
                {fileData.columnMapping && fileData.columnMapping.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mapped Columns:</p>
                    {fileData.columnMapping.map((col, colIndex) => (
                      <div
                        key={colIndex}
                        className="flex items-center gap-2 text-xs bg-background rounded px-3 py-1.5 border shadow-sm"
                      >
                        <code className="font-mono font-medium text-primary bg-primary/5 px-1 rounded">{col.name}</code>
                        {col.unit && col.unit !== "none" && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 leading-none">
                            {col.unit}
                          </Badge>
                        )}
                        <span className="text-muted-foreground ml-auto truncate max-w-[250px]">
                          {col.description || col.dataType}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic bg-background p-2 rounded border border-dashed inline-block">
                    No columns mapped for this file
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center mt-8">
        <p className="text-sm text-foreground font-medium">
          By submitting, you confirm that this data can be used for deep learning
          research in radiotherapy dose prediction.
        </p>
      </div>
    </div>
  );
}