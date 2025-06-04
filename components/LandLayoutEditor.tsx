"use client"
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Save, Settings, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Land {
  id?: string;
  number: string;
  size: string;
  price: number;
  status: "AVAILABLE" | "SOLD" | "ADVANCE";
  x: number;
  y: number;
  plotId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface GridConfig {
  rows: number;
  cols: number;
  totalLands: number;
}

interface FormData {
  number: string;
  size: string;
  price: string;
  status: Land["status"];
}

export default function LandLayoutEditor({
  plotId = "plot-1",
}: {
  plotId?: string;
}) {
  const [lands, setLands] = useState<Land[]>([]);
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    rows: 5,
    cols: 10,
    totalLands: 50,
  });
  const [selectedCell, setSelectedCell] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [editingLand, setEditingLand] = useState<Land | null>(null);
  const [formData, setFormData] = useState<FormData>({
    number: "",
    size: "",
    price: "",
    status: "AVAILABLE",
  });
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{
    x: number;
    y: number;
    land: Land;
  } | null>(null);
  const [showGridConfig, setShowGridConfig] = useState(false);
  const [tempGridConfig, setTempGridConfig] = useState<GridConfig>({
    rows: 5,
    cols: 10,
    totalLands: 50,
  });

  // Load lands from database
  useEffect(() => {
    loadLands();
  }, [plotId]);

  const loadLands = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/lands?plotId=${plotId}`);
      if (response.ok) {
        const data = await response.json();
        setLands(data);
      } else {
        setMessage({ type: "error", text: "Failed to load lands" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error loading lands" });
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (x: number, y: number) => {
    const existingLand = lands.find((l) => l.x === x && l.y === y);
    if (existingLand) {
      setEditingLand(existingLand);
      setFormData({
        number: existingLand.number,
        size: existingLand.size,
        price: existingLand.price.toString(),
        status: existingLand.status as Land["status"],
      });
    } else {
      setEditingLand(null);
      setFormData({
        number: `L${String(x * gridConfig.cols + y + 1).padStart(3, "0")}`,
        size: "",
        price: "",
        status: "AVAILABLE",
      });
    }
    setSelectedCell({ x, y });
  };

  const handleSubmit = async () => {
    if (
      !selectedCell ||
      !formData.number ||
      !formData.size ||
      !formData.price
    ) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    const landData: Land = {
      ...formData,
      price: Number(formData.price),
      x: selectedCell.x,
      y: selectedCell.y,
      plotId,
      id: editingLand?.id,
    };

    try {
      setLoading(true);
      const url = editingLand ? `/api/lands/${editingLand.id}` : "/api/lands";
      const method = editingLand ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(landData),
      });

      if (response.ok) {
        const savedLand = await response.json();
        if (editingLand) {
          setLands((prev) =>
            prev.map((land) => (land.id === editingLand.id ? savedLand : land))
          );
          setMessage({ type: "success", text: "Land updated successfully!" });
        } else {
          setLands((prev) => [...prev, savedLand]);
          setMessage({ type: "success", text: "Land added successfully!" });
        }

        // Reset form
        resetForm();
      } else {
        const error = await response.json();
        setMessage({
          type: "error",
          text: error.message || "Failed to save land",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error saving land" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (land: Land) => {
    setEditingLand(land);
    setFormData({
      number: land.number,
      size: land.size,
      price: land.price.toString(),
      status: land.status as Land["status"],
    });
    setSelectedCell({ x: land.x, y: land.y });
  };

  const handleDelete = async (landId: string) => {
    if (!confirm("Are you sure you want to delete this land?")) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/lands/${landId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setLands((prev) => prev.filter((land) => land.id !== landId));
        setMessage({ type: "success", text: "Land deleted successfully!" });
      } else {
        const error = await response.json();
        setMessage({
          type: "error",
          text: error.message || "Failed to delete land",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error deleting land" });
    } finally {
      setLoading(false);
    }
  };

  const handleGridConfigUpdate = () => {
    setGridConfig(tempGridConfig);
    setShowGridConfig(false);
    setMessage({ type: "success", text: "Grid configuration updated!" });
  };

  const getColor = (x: number, y: number) => {
    const land = lands.find((l) => l.x === x && l.y === y);
    const isSelected = selectedCell?.x === x && selectedCell?.y === y;

    if (isSelected) return "bg-blue-500 border-blue-600 shadow-lg";

    switch (land?.status) {
      case "SOLD":
        return "bg-red-500 hover:bg-red-600";
      case "ADVANCE":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "AVAILABLE":
        return "bg-green-500 hover:bg-green-600";
      default:
        return "bg-gray-200 hover:bg-gray-300";
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      AVAILABLE: "bg-green-100 text-green-800",
      SOLD: "bg-red-100 text-red-800",
      ADVANCE: "bg-yellow-100 text-yellow-800",
    };
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status}
      </Badge>
    );
  };

  const clearMessage = () => {
    setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => {
    if (message) clearMessage();
  }, [message]);

  const generateGridCells = () => {
    const cells = [];
    let landCount = 0;

    for (let y = 0; y < gridConfig.rows; y++) {
      for (let x = 0; x < gridConfig.cols; x++) {
        if (landCount >= gridConfig.totalLands) break;

        const land = lands.find((l) => l.x === x && l.y === y);
        cells.push(
          <div
            key={`${x}-${y}`}
            onClick={() => handleCellClick(x, y)}
            onMouseEnter={() => land && setHoveredCell({ x, y, land })}
            onMouseLeave={() => setHoveredCell(null)}
            className={`w-16 h-10 border-2 text-xs text-center flex items-center justify-center cursor-pointer transition-all duration-200 relative ${getColor(
              x,
              y
            )}`}
            title={
              land ? `${land.number} - ${land.status}` : `Empty (${x}, ${y})`
            }
          >
            {land?.number || `${x}-${y}`}
          </div>
        );
        landCount++;
      }
      if (landCount >= gridConfig.totalLands) break;
    }
    return cells;
  };

  const resetForm = () => {
    setFormData({
      number: "",
      size: "",
      price: "",
      status: "AVAILABLE",
    });
    setEditingLand(null);
    setSelectedCell(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 overflow-x-hidden">
      <div className="container mx-auto max-w-[1400px] space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Real Estate Land Management
          </h1>
          <p className="text-gray-600 mt-1">Plot ID: {plotId}</p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Grid Configuration Card */}
          <div className="lg:col-span-12">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    <CardTitle>Grid Configuration</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowGridConfig(!showGridConfig)}
                  >
                    Configure Grid
                  </Button>
                </div>
              </CardHeader>
              {showGridConfig && (
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="rows">Rows</Label>
                      <Input
                        id="rows"
                        type="number"
                        value={tempGridConfig.rows}
                        onChange={(e) =>
                          setTempGridConfig({
                            ...tempGridConfig,
                            rows: Number(e.target.value),
                          })
                        }
                        min="1"
                        max="20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cols">Columns</Label>
                      <Input
                        id="cols"
                        type="number"
                        value={tempGridConfig.cols}
                        onChange={(e) =>
                          setTempGridConfig({
                            ...tempGridConfig,
                            cols: Number(e.target.value),
                          })
                        }
                        min="1"
                        max="20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalLands">Total Lands</Label>
                      <Input
                        id="totalLands"
                        type="number"
                        value={tempGridConfig.totalLands}
                        onChange={(e) =>
                          setTempGridConfig({
                            ...tempGridConfig,
                            totalLands: Number(e.target.value),
                          })
                        }
                        min="1"
                        max={tempGridConfig.rows * tempGridConfig.cols}
                      />
                    </div>
                  </div>
                  <Button onClick={handleGridConfigUpdate} className="mt-4">
                    <Save className="h-4 w-4 mr-2" />
                    Update Grid
                  </Button>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Land Grid */}
          <div className="lg:col-span-7">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Land Layout Grid</CardTitle>
                  <span className="text-sm text-gray-500">
                    {gridConfig.totalLands} lands
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div
                    className="grid gap-1 w-max mx-auto"
                    style={{
                      gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
                    }}
                  >
                    {generateGridCells()}
                  </div>
                </div>
                <div className="mt-4 flex justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span>Advance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Sold</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <span>Empty</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Input Form */}
          <div className="lg:col-span-5">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2 flex-shrink-0">
                <CardTitle className="text-lg">
                  {editingLand ? "Edit Land Details" : "Add New Land"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-4 p-2">
                  {selectedCell && (
                    <div className="p-2 bg-blue-50 rounded text-sm text-blue-700">
                      Selected Position: ({selectedCell.x}, {selectedCell.y})
                    </div>
                  )}

                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="number">Land Number</Label>
                      <Input
                        id="number"
                        value={formData.number}
                        onChange={(e) =>
                          setFormData({ ...formData, number: e.target.value })
                        }
                        placeholder="e.g., L001"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="size">Land Size</Label>
                      <Input
                        id="size"
                        value={formData.size}
                        onChange={(e) =>
                          setFormData({ ...formData, size: e.target.value })
                        }
                        placeholder="e.g., 1000 sq ft"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="price">Price (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        placeholder="e.g., 50000"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            status: value as Land["status"],
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AVAILABLE">Available</SelectItem>
                          <SelectItem value="ADVANCE">Advance</SelectItem>
                          <SelectItem value="SOLD">Sold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full mt-4"
                    disabled={!selectedCell || loading}
                  >
                    {loading
                      ? "Saving..."
                      : editingLand
                      ? "Update Land"
                      : "Add Land"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <div className="lg:col-span-12">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Land Records ({lands.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                            Land Number
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                            Size
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                            Price
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                            Status
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                            Position
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {lands.map((land) => (
                          <tr key={land.id} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2 font-medium">
                              {land.number}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {land.size}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              ₹{land.price.toLocaleString()}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {getStatusBadge(land.status)}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              ({land.x}, {land.y})
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(land)}
                                  disabled={loading}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(land.id!)}
                                  className="text-red-600 hover:text-red-700"
                                  disabled={loading}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Alert Messages */}
        {message && (
          <div className="fixed bottom-4 right-4 z-50 max-w-md">
            <Alert
              className={
                message.type === "error"
                  ? "bg-red-50 border-red-200"
                  : "bg-green-50 border-green-200"
              }
            >
              <AlertDescription
                className={
                  message.type === "error" ? "text-red-700" : "text-green-700"
                }
              >
                {message.text}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}
