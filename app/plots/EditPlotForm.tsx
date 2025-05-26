"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EditPlotFormProps {
  plotId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditPlotForm = ({
  plotId,
  isOpen,
  onClose,
  onSuccess,
}: EditPlotFormProps) => {
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
    latitude: 0,
    longitude: 0,
    facing: "",
    amenities: [""],
    mapEmbedUrl: "",
  });

  useEffect(() => {
    if (!isOpen) return;

    const fetchPlot = async () => {
      try {
        const response = await fetch(`/api/plots/${plotId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch plot");
        }
        const data = await response.json();
        setFormData({
          ...data,
          price: data.price.toString(),
          imageUrls: data.imageUrls.length > 0 ? data.imageUrls : [""],
          amenities: data.amenities.length > 0 ? data.amenities : [""],
        });
      } catch (error) {
        console.error("Error fetching plot:", error);
        toast.error("Failed to fetch plot details");
      }
    };

    fetchPlot();
  }, [plotId, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
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
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Filter out empty image URLs and amenities
      const filteredImageUrls = formData.imageUrls.filter(
        (url) => url.trim() !== ""
      );
      const filteredAmenities = formData.amenities.filter(
        (amenity) => amenity.trim() !== ""
      );

      const response = await fetch(`/api/plots/${plotId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          imageUrls: filteredImageUrls,
          amenities: filteredAmenities,
          price: parseInt(formData.price),
          latitude: parseFloat(formData.latitude.toString()),
          longitude: parseFloat(formData.longitude.toString()),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          const errorMessage =
            data.details?.[0]?.message || data.error || "Validation error";
          throw new Error(errorMessage);
        }
        throw new Error(data.error || "Failed to update plot");
      }

      toast.success("Plot updated successfully!");
      if (onSuccess) {
        onSuccess();
      }
      router.refresh();
    } catch (error) {
      console.error("Error updating plot:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update plot"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Plot</h2>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dimension</label>
            <input
              type="text"
              name="dimension"
              value={formData.dimension}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Price Label
            </label>
            <input
              type="text"
              name="priceLabel"
              value={formData.priceLabel}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="AVAILABLE">Available</option>
              <option value="ADVANCE">Advance</option>
              <option value="SOLD">Sold</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Latitude</label>
            <input
              type="number"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Longitude</label>
            <input
              type="number"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Facing</label>
            <input
              type="text"
              name="facing"
              value={formData.facing}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Map Embed URL
            </label>
            <input
              type="url"
              name="mapEmbedUrl"
              value={formData.mapEmbedUrl}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image URLs</label>
            {formData.imageUrls.map((url, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleImageChange(index, e.target.value)}
                  className="flex-1 p-2 border rounded"
                  placeholder="Enter image URL"
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removeImageField(index)}
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button type="button" onClick={addImageField}>
              Add Image URL
            </Button>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Amenities</label>
            {formData.amenities.map((amenity, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={amenity}
                  onChange={(e) => handleAmenityChange(index, e.target.value)}
                  className="flex-1 p-2 border rounded"
                  placeholder="Enter amenity"
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removeAmenityField(index)}
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button type="button" onClick={addAmenityField}>
              Add Amenity
            </Button>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPlotForm;
