// app/plots/AddPlotForm.tsx
"use client";

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
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface AddPlotFormProps {
  projectId: string;
  onSuccess?: () => void;
}

const AddPlotForm = ({ projectId, onSuccess }: AddPlotFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    dimension: "",
    price: "",
    priceLabel: "",
    status: "AVAILABLE" as const,
    imageUrls: [""],
    location: "",
    latitude: "",
    longitude: "",
    facing: "",
    amenities: [""],
    mapEmbedUrl: "",
    description: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // Special handling for latitude and longitude
    if (name === "latitude" || name === "longitude") {
      // Only allow numbers and decimal points
      const numericValue = value.replace(/[^0-9.-]/g, "");
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value as typeof prev.status }));
  };

  const handleImageChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newImageUrls = [...prev.imageUrls];
      newImageUrls[index] = value;
      return { ...prev, imageUrls: newImageUrls };
    });
  };

  const addImageField = () => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, ""],
    }));
  };

  const removeImageField = (index: number) => {
    if (formData.imageUrls.length > 1) {
      setFormData((prev) => ({
        ...prev,
        imageUrls: prev.imageUrls.filter((_, i) => i !== index),
      }));
    }
  };

  const handleAmenityChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newAmenities = [...prev.amenities];
      newAmenities[index] = value;
      return { ...prev, amenities: newAmenities };
    });
  };

  const addAmenityField = () => {
    setFormData((prev) => ({
      ...prev,
      amenities: [...prev.amenities, ""],
    }));
  };

  const removeAmenityField = (index: number) => {
    if (formData.amenities.length > 1) {
      setFormData((prev) => ({
        ...prev,
        amenities: prev.amenities.filter((_, i) => i !== index),
      }));
    }
  };

  const handleMapEmbedUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Extract the src URL if a full iframe code is pasted
    const srcMatch = value.match(/src="([^"]+)"/);
    const mapUrl = srcMatch ? srcMatch[1] : value;
    setFormData((prev) => ({ ...prev, mapEmbedUrl: mapUrl }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Validate latitude and longitude
      const latitude = parseFloat(formData.latitude);
      const longitude = parseFloat(formData.longitude);

      if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error("Please enter valid latitude and longitude values");
      }

      // Filter out empty image URLs and amenities
      const filteredImageUrls = formData.imageUrls.filter(
        (url) => url.trim() !== ""
      );
      const filteredAmenities = formData.amenities.filter(
        (amenity) => amenity.trim() !== ""
      );

      const response = await fetch("/api/plots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          imageUrls: filteredImageUrls,
          amenities: filteredAmenities,
          price: parseInt(formData.price),
          latitude: latitude,
          longitude: longitude,
          projectId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          const errorMessage =
            data.details?.[0]?.message || data.error || "Validation error";
          throw new Error(errorMessage);
        }
        throw new Error(data.error || "Failed to create plot");
      }

      // Reset form
      setFormData({
        title: "",
        dimension: "",
        price: "",
        priceLabel: "",
        status: "AVAILABLE",
        imageUrls: [""],
        location: "",
        latitude: "",
        longitude: "",
        facing: "",
        amenities: [""],
        mapEmbedUrl: "",
        description: "",
      });

      toast.success("Plot created successfully!");
      if (onSuccess) {
        onSuccess();
      }
      router.refresh();
    } catch (error) {
      console.error("Error creating plot:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create plot. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Add New Plot</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dimension">Dimension</Label>
              <Input
                id="dimension"
                name="dimension"
                value={formData.dimension}
                onChange={handleChange}
                placeholder="e.g., 30x40"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceLabel">Price Label</Label>
              <Input
                id="priceLabel"
                name="priceLabel"
                value={formData.priceLabel}
                onChange={handleChange}
                placeholder="e.g., Starting from 50L"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="ADVANCE">Advance</SelectItem>
                  <SelectItem value="SOLD">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="facing">Facing</Label>
              <Input
                id="facing"
                name="facing"
                value={formData.facing}
                onChange={handleChange}
                placeholder="e.g., North"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="e.g., 12.9716"
                required
                type="text"
                pattern="-?[0-9]*\.?[0-9]*"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="e.g., 77.5946"
                required
                type="text"
                pattern="-?[0-9]*\.?[0-9]*"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                placeholder="Enter plot description..."
                required
              />
            </div>
          </div>

          {/* Image URLs Section */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Image URLs</Label>
            {formData.imageUrls.map((url, index) => (
              <div key={index} className="flex gap-2 items-center">
                <div className="flex-1">
                  <Input
                    value={url}
                    onChange={(e) => handleImageChange(index, e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    required={index === 0}
                  />
                </div>
                {formData.imageUrls.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeImageField(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addImageField}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Image
            </Button>
          </div>

          {/* Amenities Section */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Amenities</Label>
            {formData.amenities.map((amenity, index) => (
              <div key={index} className="flex gap-2 items-center">
                <div className="flex-1">
                  <Input
                    value={amenity}
                    onChange={(e) => handleAmenityChange(index, e.target.value)}
                    placeholder="e.g., Park, Gym, Pool"
                  />
                </div>
                {formData.amenities.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeAmenityField(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addAmenityField}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Amenity
            </Button>
          </div>

          {/* Google Maps Embed Section */}
          <div className="space-y-4 md:col-span-2">
            <Label htmlFor="mapEmbedUrl" className="text-base font-medium">
              Google Maps Embed URL
            </Label>
            <Input
              id="mapEmbedUrl"
              name="mapEmbedUrl"
              value={formData.mapEmbedUrl}
              onChange={handleMapEmbedUrlChange}
              placeholder="Paste Google Maps embed URL or iframe code here"
              required
            />
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">To get the embed URL:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to Google Maps and find your location</li>
                <li>Click "Share" and select "Embed a map"</li>
                <li>
                  Copy the src URL from the iframe code or the entire iframe
                  code
                </li>
                <li>Paste it here</li>
              </ol>
            </div>
            {formData.mapEmbedUrl && (
              <div className="h-[300px] w-full border rounded-md overflow-hidden">
                <iframe
                  src={formData.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Adding..." : "Add Plot"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddPlotForm;
