"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EditPlotFormProps {
  plotId: string;
  onSuccess?: () => void;
}

const EditPlotForm = ({ plotId, onSuccess }: EditPlotFormProps) => {
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
  }, [plotId]);

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
        error instanceof Error
          ? error.message
          : "Failed to update plot. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border-2 border-black p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold mb-4">Edit Plot</h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Dimension</label>
            <input
              type="text"
              name="dimension"
              value={formData.dimension}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g., 30x40"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Price (₹)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
              min="0"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Price Label
            </label>
            <input
              type="text"
              name="priceLabel"
              value={formData.priceLabel}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g., Starting from 50L"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="AVAILABLE">Available</option>
              <option value="ADVANCE">Advance</option>
              <option value="SOLD">Sold</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Facing</label>
            <input
              type="text"
              name="facing"
              value={formData.facing}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g., North"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Amenities (comma-separated)
            </label>
            <input
              type="text"
              name="amenities"
              value={formData.amenities.join(",")}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  amenities: e.target.value.split(","),
                }))
              }
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g., Park, Gym, Pool"
            />
          </div>
        </div>

        {/* Image URLs Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Image URLs</label>
          {formData.imageUrls.map((url, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={url}
                onChange={(e) => handleImageChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md"
                placeholder="https://example.com/image.jpg"
                required={index === 0}
              />
              {index > 0 && (
                <Button
                  type="button"
                  onClick={() => removeImageField(index)}
                  className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            onClick={addImageField}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Add Another Image
          </Button>
        </div>

        {/* Google Maps Embed Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Google Maps Embed URL
          </label>
          <input
            type="text"
            name="mapEmbedUrl"
            value={formData.mapEmbedUrl}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md mb-2"
            placeholder="Paste Google Maps embed URL here"
            required
          />
          <div className="text-sm text-gray-600 mb-2">
            To get the embed URL:
            <ol className="list-decimal list-inside ml-2">
              <li>Go to Google Maps and find your location</li>
              <li>Click "Share" and select "Embed a map"</li>
              <li>Copy the src URL from the iframe code</li>
              <li>Paste it here</li>
            </ol>
          </div>
          {formData.mapEmbedUrl && (
            <div className="h-[400px] w-full border rounded-md overflow-hidden">
              <iframe
                src={formData.mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={loading}
            className="bg-orange-500 border-2 border-black text-white px-4 py-2 rounded-md hover:bg-orange-700"
          >
            {loading ? "Updating..." : "Update Plot"}
          </Button>
          <Button
            type="button"
            onClick={onSuccess}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditPlotForm;
