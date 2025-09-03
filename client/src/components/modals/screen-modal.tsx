import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Tv, Save } from "lucide-react";
import type { Screen } from "@shared/schema";

interface ScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  screen?: Screen | null;
  projectId?: number;
}

export default function ScreenModal({ isOpen, onClose, screen, projectId }: ScreenModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    projectId: projectId || "",
  });

  // Fetch projects for the dropdown when creating new screens
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !screen, // Only fetch when creating new screen
  });

  useEffect(() => {
    if (screen) {
      setFormData({
        name: screen.name,
        description: screen.description || "",
        projectId: screen.projectId.toString(),
      });
    } else {
      // Auto-select first available project for new screens
      const firstProjectId = projects?.[0]?.id?.toString() || projectId?.toString() || "";
      setFormData({
        name: "",
        description: "",
        projectId: firstProjectId,
      });
    }
  }, [screen, isOpen, projectId, projects]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (screen) {
        return await apiRequest("PUT", `/api/screens/${screen.id}`, {
          name: data.name,
          description: data.description,
        });
      } else {
        return await apiRequest("POST", "/api/screens", {
          name: data.name,
          description: data.description,
          projectId: parseInt(data.projectId),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/screens"] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId.toString(), "screens"] });
      }
      toast({
        title: "Success",
        description: screen ? "Screen updated successfully" : "Screen created successfully",
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
        description: screen ? "Failed to update screen" : "Failed to create screen",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Screen name is required",
        variant: "destructive",
      });
      return;
    }
    if (!screen && !formData.projectId && projects?.length === 0) {
      toast({
        title: "Error",
        description: "No projects available. Please create a project first.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({ name: "", description: "", projectId: "" });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5" />
            {screen ? "Edit Screen" : "Add New Screen"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Screen Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter screen name"
              required
              data-testid="input-screen-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter screen description (optional)"
              rows={3}
              data-testid="input-screen-description"
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
              data-testid="button-save-screen"
            >
              <Save className="h-4 w-4 mr-2" />
              {mutation.isPending ? "Saving..." : "Save Screen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
