import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import type { Screen, ComplexityMaster, ScreenTypeMaster } from "@shared/schema";
import type { EstimationScreenData } from "@/lib/types";

interface ScreenEstimationRowProps {
  screen: EstimationScreenData;
  index: number;
  availableScreens: Screen[];
  complexities: ComplexityMaster[];
  screenTypes: ScreenTypeMaster[];
  onUpdate: (index: number, updatedScreen: EstimationScreenData) => void;
  onRemove: (index: number) => void;
}

export default function ScreenEstimationRow({
  screen,
  index,
  availableScreens,
  complexities,
  screenTypes,
  onUpdate,
  onRemove,
}: ScreenEstimationRowProps) {
  
  const handleScreenChange = (screenId: string) => {
    const newScreenId = parseInt(screenId);
    const updatedScreen = { ...screen, screenId: newScreenId };
    onUpdate(index, updatedScreen);
  };

  const handleComplexityChange = (complexityId: string) => {
    const newComplexityId = parseInt(complexityId);
    const complexity = complexities.find(c => c.id === newComplexityId);
    const screenType = screenTypes.find(st => st.id === screen.screenTypeId);
    
    // Proper estimation formula: Base Hours × Complexity Multiplier × Behavior Multiplier
    const baseHours = 4; // Default base hours for generic screen
    const complexityMultiplier = parseFloat(complexity?.multiplier || '1.00');
    const behaviorMultiplier = parseFloat(screenType?.multiplier || '1.00');
    const calculatedHours = Math.round(baseHours * complexityMultiplier * behaviorMultiplier);
    
    const updatedScreen = { 
      ...screen, 
      complexityId: newComplexityId,
      calculatedHours 
    };
    onUpdate(index, updatedScreen);
  };

  const handleScreenTypeChange = (screenTypeId: string) => {
    const newScreenTypeId = parseInt(screenTypeId);
    const screenType = screenTypes.find(st => st.id === newScreenTypeId);
    const complexity = complexities.find(c => c.id === screen.complexityId);
    
    // Proper estimation formula: Base Hours × Complexity Multiplier × Behavior Multiplier
    const baseHours = 4; // Default base hours for generic screen
    const complexityMultiplier = parseFloat(complexity?.multiplier || '1.00');
    const behaviorMultiplier = parseFloat(screenType?.multiplier || '1.00');
    const calculatedHours = Math.round(baseHours * complexityMultiplier * behaviorMultiplier);
    
    const updatedScreen = { 
      ...screen, 
      screenTypeId: newScreenTypeId,
      calculatedHours 
    };
    onUpdate(index, updatedScreen);
  };

  const selectedScreen = availableScreens.find(s => s.id === screen.screenId);
  const selectedComplexity = complexities.find(c => c.id === screen.complexityId);
  const selectedScreenType = screenTypes.find(st => st.id === screen.screenTypeId);

  return (
    <div className="bg-muted/30 rounded-lg p-4 border border-border">
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
        <div className="space-y-2">
          <Label>Screen</Label>
          <Select value={screen.screenId.toString()} onValueChange={handleScreenChange}>
            <SelectTrigger data-testid={`select-screen-${index}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableScreens.map((availableScreen) => (
                <SelectItem key={availableScreen.id} value={availableScreen.id.toString()}>
                  {availableScreen.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Complexity</Label>
          <Select value={screen.complexityId.toString()} onValueChange={handleComplexityChange}>
            <SelectTrigger data-testid={`select-complexity-${index}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {complexities.map((complexity) => (
                <SelectItem key={complexity.id} value={complexity.id.toString()}>
                  {complexity.name} ({complexity.hours}h)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Screen Type</Label>
          <Select value={screen.screenTypeId.toString()} onValueChange={handleScreenTypeChange}>
            <SelectTrigger data-testid={`select-screen-type-${index}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {screenTypes.map((screenType) => (
                <SelectItem key={screenType.id} value={screenType.id.toString()}>
                  {screenType.name} ({screenType.hours}h)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-center">
          <Label>Total Hours</Label>
          <div className="mt-2">
            <Badge 
              variant="secondary" 
              className="bg-blue-100 text-blue-800 text-sm px-3 py-2"
              data-testid={`text-calculated-hours-${index}`}
            >
              {screen.calculatedHours}h
            </Badge>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRemove(index)}
            data-testid={`button-remove-screen-${index}`}
            title="Remove Screen"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
