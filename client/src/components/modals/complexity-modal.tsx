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
import { Settings, Save } from "lucide-react";
import type { ComplexityMaster } from "@shared/schema";

interface ComplexityModalProps {
  isOpen: boolean;
  onClose: () => void;
  complexity?: ComplexityMaster | null;
}

export default function ComplexityModal({ isOpen, onClose, complexity }: ComplexityModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    hours: "",
    description: "",
  });

  useEffect(() => {
    if (complexity) {
      setFormData({
        name: complexity.name,
        hours: complexity.hours.toString(),
        description: complexity.description || "",
      });
    } else {
      setFormData({
        name: "",
        hours: "",
        description: "",
      });
    }
  }, [complexity, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data: { name: string; hours: number; description?: string }) => {
      if (complexity) {
        return await apiRequest("PUT", `/api/complexity/${complexity.id}`, data);
      } else {
        return await apiRequest("POST", "/api/complexity", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complexity"] });
      toast({
        title: "Success",
        description: complexity ? "Complexity updated successfully" : "Complexity created successfully",
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
        description: complexity ? "Failed to update complexity" : "Failed to create complexity",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Complexity name is required",
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
            <Settings className="h-5 w-5" />
            {complexity ? "Edit Complexity Type" : "Add Complexity Type"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Complexity Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Simple, Medium, Complex"
              required
              data-testid="input-complexity-name"
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
              data-testid="input-complexity-hours"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe this complexity level (optional)"
              rows={3}
              data-testid="input-complexity-description"
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
              data-testid="button-save-complexity"
            >
              <Save className="h-4 w-4 mr-2" />
              {mutation.isPending ? "Saving..." : "Save Complexity"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
