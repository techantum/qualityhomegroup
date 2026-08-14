"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getGalleryImages, type GalleryImage } from "@/lib/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, Search } from "lucide-react";

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (images: string[]) => void;
  multiSelect?: boolean;
}

const categories = ["All", "Apartments", "Villas", "Commercial", "Plots", "Interior", "Exterior", "Amenities"];

export function MediaPickerDialog({ open, onOpenChange, onSelect, multiSelect = false }: MediaPickerDialogProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      loadImages();
      setSelectedImages([]);
    }
  }, [open]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const data = await getGalleryImages();
      setImages(data);
    } catch (error) {
      console.error("Error loading images:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleImageSelection = (imageUrl: string) => {
    if (multiSelect) {
      setSelectedImages((prev) =>
        prev.includes(imageUrl) ? prev.filter((url) => url !== imageUrl) : [...prev, imageUrl]
      );
    } else {
      setSelectedImages([imageUrl]);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedImages);
    onOpenChange(false);
  };

  const filteredImages = images.filter((img) => {
    const matchesCategory = filterCategory === "All" || img.category === filterCategory;
    const matchesSearch = img.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select {multiSelect ? "Images" : "Image"} from Media Library</DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-3 py-3 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {images.length === 0 
                ? "No images in media library. Upload images in Gallery first."
                : "No images match your search."}
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredImages.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => toggleImageSelection(image.image)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImages.includes(image.image)
                      ? "border-[#DDA21A] ring-2 ring-[#DDA21A]/30"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={image.image || "/placeholder.svg"}
                    alt={image.title}
                    fill
                    className="object-cover"
                  />
                  {selectedImages.includes(image.image) && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-[#DDA21A] rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-xs text-white truncate">{image.title}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedImages.length} image{selectedImages.length !== 1 ? "s" : ""} selected
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedImages.length === 0}
              className="bg-[#1F2A54] hover:bg-[#1F2A54]/90"
            >
              {multiSelect ? `Select ${selectedImages.length} Image${selectedImages.length !== 1 ? "s" : ""}` : "Select Image"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
