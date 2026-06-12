import { Upload, FileText, X, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ColumnMapping } from "./ColumnMappingStep";

export interface DataInfo {
  dataType: string;
  fileFormat: string;
  description: string;
  file: File | null;
  columnMapping: ColumnMapping[];
}

interface DataStepProps {
  data: DataInfo[]; // ATTENTION : data est maintenant un TABLEAU !
  onChange: (data: DataInfo[]) => void;
}

const dataTypes = [
  { value: "pdd", label: "PDD (Percent Depth Dose)" },
  { value: "profile", label: "Beam Profile" },
  { value: "output_factor", label: "Output Factor" },
  { value: "tpr", label: "TPR/TMR" },
  { value: "dose_distribution", label: "3D Dose Distribution" },
  { value: "dvh", label: "DVH (Dose Volume Histogram)" },
  { value: "other", label: "Other" },
];

const fileFormats = [
  { value: "csv", label: "CSV" },
  { value: "xlsx", label: "Excel (.xlsx)" },
  { value: "txt", label: "Text (.txt)" },
  { value: "dicom", label: "DICOM" },
  { value: "npy", label: "NumPy (.npy)" },
  { value: "hdf5", label: "HDF5" },
  { value: "other", label: "Other" },
];

export function DataStep({ data, onChange }: DataStepProps) {
  
  // Fonction pour mettre à jour un champ spécifique d'un fichier spécifique
  const updateItem = (index: number, field: keyof DataInfo, value: any) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onChange(newData);
  };

  // Fonction pour ajouter un nouveau bloc de fichier vide
  const addItem = () => {
    onChange([
      ...data,
      { dataType: "", fileFormat: "", description: "", file: null, columnMapping: [] },
    ]);
  };

  // Fonction pour supprimer un bloc de fichier
  const removeItem = (indexToRemove: number) => {
    // On empêche de supprimer s'il ne reste qu'un seul fichier vide
    if (data.length === 1) return; 
    const newData = data.filter((_, index) => index !== indexToRemove);
    onChange(newData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Dataset Upload
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload one or multiple dosimetry measurement files for this experiment
        </p>
      </div>

      {/* Boucle sur tous les fichiers */}
      <div className="space-y-8">
        {data.map((item, index) => (
          <div key={index} className="p-5 border rounded-xl bg-card relative shadow-sm">
            
            {/* Titre du bloc et bouton de suppression */}
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="font-medium text-foreground">
                Data File {index + 1}
              </h3>
              {data.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label>
                  Data Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={item.dataType}
                  onValueChange={(value) => updateItem(index, "dataType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
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

              <div className="space-y-2 md:col-span-2">
                <Label>File Format</Label>
                <Select
                  value={item.fileFormat}
                  onValueChange={(value) => updateItem(index, "fileFormat", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {fileFormats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* File upload pour CE bloc spécifique */}
            <div className="space-y-2 mb-6">
              <Label>
                Data File <span className="text-destructive">*</span>
              </Label>
              {item.file ? (
                <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(item.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateItem(index, "file", null)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-primary">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      CSV, Excel, DICOM, or other data formats
                    </p>
                  </div>
                  <Input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      updateItem(index, "file", file);
                    }}
                    accept=".csv,.xlsx,.xls,.txt,.dcm,.npy,.h5,.hdf5"
                  />
                </label>
              )}
            </div>

            {/* Description pour CE bloc */}
            <div className="space-y-2">
              <Label htmlFor={`data-description-${index}`}>Data Description</Label>
              <Textarea
                id={`data-description-${index}`}
                placeholder="Describe the data columns, measurement points, or any preprocessing applied..."
                value={item.description}
                onChange={(e) => updateItem(index, "description", e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Le bouton magique pour ajouter autant de fichiers qu'on veut ! */}
      <Button
        type="button"
        variant="outline"
        onClick={addItem}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add another data file
      </Button>
    </div>
  );
}