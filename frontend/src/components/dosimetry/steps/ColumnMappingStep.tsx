import { Plus, Trash2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DataInfo } from "./DataStep"; // On importe l'interface depuis DataStep

export interface ColumnMapping {
  name: string;
  description: string;
  unit: string;
  dataType: "numeric" | "categorical" | "text" | "datetime";
}

interface ColumnMappingStepProps {
  data: DataInfo[]; // On reçoit maintenant TOUT le tableau des fichiers
  onChange: (data: DataInfo[]) => void;
}

const dataTypes = [
  { value: "numeric", label: "Numeric (measurements, doses)" },
  { value: "categorical", label: "Categorical (groups, labels)" },
  { value: "text", label: "Text (notes, descriptions)" },
  { value: "datetime", label: "Date/Time" },
];

const commonUnits = [
  { value: "none", label: "No unit" },
  { value: "gy", label: "Gy (Gray)" },
  { value: "cgy", label: "cGy (centiGray)" },
  { value: "mm", label: "mm (millimeters)" },
  { value: "cm", label: "cm (centimeters)" },
  { value: "mev", label: "MeV" },
  { value: "mu", label: "MU (Monitor Units)" },
  { value: "percent", label: "%" },
  { value: "custom", label: "Custom..." },
];

export function ColumnMappingStep({ data, onChange }: ColumnMappingStepProps) {
  
  // Les fonctions prennent maintenant un 'fileIndex' pour savoir quel fichier on modifie
  const addColumn = (fileIndex: number) => {
    const newData = [...data];
    newData[fileIndex].columnMapping = [
      ...newData[fileIndex].columnMapping,
      { name: "", description: "", unit: "", dataType: "numeric" },
    ];
    onChange(newData);
  };

  const removeColumn = (fileIndex: number, colIndex: number) => {
    const newData = [...data];
    newData[fileIndex].columnMapping = newData[fileIndex].columnMapping.filter(
      (_, i) => i !== colIndex
    );
    onChange(newData);
  };

  const updateColumn = (
    fileIndex: number,
    colIndex: number,
    field: keyof ColumnMapping,
    value: string
  ) => {
    const newData = [...data];
    const updatedMapping = [...newData[fileIndex].columnMapping];
    updatedMapping[colIndex] = { ...updatedMapping[colIndex], [field]: value };
    newData[fileIndex].columnMapping = updatedMapping;
    onChange(newData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Column Mapping
        </h2>
        <p className="text-sm text-muted-foreground">
          Describe the columns for each dataset to help train the model
        </p>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">
          💡 Why describe columns?
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Column descriptions help our deep learning model understand the meaning
          and context of your data. Include details about measurement conditions,
          normalization, and any preprocessing applied.
        </p>
      </div>

      {/* Boucle sur chaque fichier ajouté à l'étape précédente */}
      {data.map((fileData, fileIndex) => (
        <div key={fileIndex} className="border-2 rounded-xl p-6 bg-card mb-8 shadow-sm">
          
          {/* File reference header */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg mb-6 border">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">
              {fileData.file ? fileData.file.name : `Data File ${fileIndex + 1}`}
            </span>
            <span className="ml-auto text-xs text-muted-foreground bg-background px-2 py-1 rounded border">
              {fileData.dataType || "Unknown type"}
            </span>
          </div>

          {/* Column list pour CE fichier */}
          <div className="space-y-4">
            {fileData.columnMapping.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg bg-background">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground mb-4">
                  No columns defined for this file yet.
                </p>
                <Button onClick={() => addColumn(fileIndex)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Column
                </Button>
              </div>
            ) : (
              fileData.columnMapping.map((column, colIndex) => (
                <div
                  key={colIndex}
                  className="border rounded-lg p-4 space-y-4 bg-background relative hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Column {colIndex + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeColumn(fileIndex, colIndex)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        Column Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="e.g., depth, dose, x_position"
                        value={column.name}
                        onChange={(e) =>
                          updateColumn(fileIndex, colIndex, "name", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Data Type</Label>
                      <Select
                        value={column.dataType}
                        onValueChange={(value) =>
                          updateColumn(fileIndex, colIndex, "dataType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {dataTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Select
                        value={column.unit}
                        onValueChange={(value) =>
                          updateColumn(fileIndex, colIndex, "unit", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {commonUnits.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>
                        Description <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        placeholder="Describe what this column represents, how it was measured, any normalization applied..."
                        value={column.description}
                        onChange={(e) =>
                          updateColumn(fileIndex, colIndex, "description", e.target.value)
                        }
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bouton pour ajouter une colonne à CE fichier spécifique */}
          {fileData.columnMapping.length > 0 && (
            <Button
              variant="outline"
              onClick={() => addColumn(fileIndex)}
              className="w-full mt-4 border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Column to this File
            </Button>
          )}
        </div>
      ))}

      {/* Common column examples */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h3 className="font-medium text-sm text-foreground mb-2">
          📋 Common dosimetry columns
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
          <span className="bg-background px-2 py-1 rounded border">depth (mm)</span>
          <span className="bg-background px-2 py-1 rounded border">dose (cGy)</span>
          <span className="bg-background px-2 py-1 rounded border">x_position (cm)</span>
          <span className="bg-background px-2 py-1 rounded border">y_position (cm)</span>
          <span className="bg-background px-2 py-1 rounded border">field_size (cm²)</span>
          <span className="bg-background px-2 py-1 rounded border">energy (MeV)</span>
          <span className="bg-background px-2 py-1 rounded border">ssd (cm)</span>
          <span className="bg-background px-2 py-1 rounded border">output_factor</span>
        </div>
      </div>
    </div>
  );
}