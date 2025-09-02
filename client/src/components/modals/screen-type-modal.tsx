import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Monitor, Save } from "lucide-react";
import type { ScreenTypeMaster } from "@shared/schema";

interface ScreenTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenType?: ScreenTypeMaster | null;
}

export default function ScreenTypeModal({ isOpen, onClose, screenType }: ScreenTypeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    hours: "",
    description: "",
  });

  useEffect(() => {
    if (screenType) {
      setFormData({
        name: screenType.name,
        hours: screenType.hours.toString(),
        description: screenType.description || "",
      });
    } else {
      setFormData({
        name: "",
        hours: "",
        description: "",
      });
    }
  }, [screenType, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data: { name: string; hours: number; description?: string }) => {
      if (screenType) {
        return await apiRequest("PUT", `/api/screen-types/${screenType.id}`, data);
      } else {
        return await apiRequest("POST", "/api/screen-types", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/screen-types"] });
      toast({
        title: "Success",
        description: screenType ? "Screen type updated successfully" : "Screen type created successfully",
      });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: screenType ? "Failed to update screen type" : "Failed to create screen type",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Screen type name is required",
        variant: "destructive",
      });
      return;
    }

    const hours = parseInt(formData.hours);
    if (isNaN(hours) || hours <= 0) {
      toast({
        title: "Validation Error",
        description: "Hours must be a positive number",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      name: formData.name.trim(),
      hours,
      description: formData.description.trim() || undefined,
    });
  };

  const handleClose = () => {
    setFormData({ name: "", hours: "", description: "" });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            {screenType ? "Edit Screen Type" : "Add Screen Type"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Screen Type Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Static, Dynamic, Partial Dynamic"
              required
              data-testid="input-screen-type-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">Hours *</Label>
            <Input
              id="hours"
              type="number"
              min="1"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              placeholder="Enter number of hours"
              required
              data-testid="input-screen-type-hours"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe this screen type (optional)"
              rows={3}
              data-testid="input-screen-type-description"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1" data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              data-testid="button-save-screen-type"
            >
              <Save className="h-4 w-4 mr-2" />
              {mutation.isPending ? "Saving..." : "Save Screen Type"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
