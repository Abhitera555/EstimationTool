import type { ComplexityMaster, ScreenTypeMaster, GenericScreenType } from "@shared/schema";
import { apiRequest } from '@/lib/queryClient';

export interface EstimationContext {
  screenType: GenericScreenType;
  complexity: ComplexityMaster;
  behavior: ScreenTypeMaster;
}

export class SmartEstimationEngine {
  
  /**
   * Helper function to fetch hours from the mapping
   */
  static async getHoursFromMapping(complexityName: string, screenBehavior: string): Promise<number> {
    try {
      if (!complexityName || !screenBehavior) return 0;
      
      const response = await apiRequest('GET', `/api/hour-mapping/${encodeURIComponent(complexityName)}/${encodeURIComponent(screenBehavior)}`);
      const data = await response.json();
      return data.hours || 0;
    } catch (error) {
      console.error('Error fetching hours from mapping:', error);
      return 0;
    }
  }

  /**
   * Get allowed complexity levels for a specific screen type
   */
  static getAllowedComplexities(
    screenType: GenericScreenType, 
    allComplexities: ComplexityMaster[]
  ): ComplexityMaster[] {
    const complexityOrder = ['Simple', 'Medium', 'Complex'];
    const minIndex = complexityOrder.indexOf(screenType.minComplexity || 'Simple');
    const maxIndex = complexityOrder.indexOf(screenType.maxComplexity || 'Complex');
    
    return allComplexities.filter(complexity => {
      const currentIndex = complexityOrder.indexOf(complexity.name);
      return currentIndex >= minIndex && currentIndex <= maxIndex;
    });
  }

  /**
   * Get allowed behavior types for a specific screen type
   */
  static getAllowedBehaviors(
    screenType: GenericScreenType,
    allBehaviors: ScreenTypeMaster[]
  ): ScreenTypeMaster[] {
    const allowedNames = (screenType.allowedBehaviors || 'Static,Partial Dynamic,Dynamic')
      .split(',')
      .map(name => name.trim());
    
    return allBehaviors.filter(behavior => allowedNames.includes(behavior.name));
  }

  /**
   * Calculate smart estimation hours based on context using direct hour mapping
   */
  static async calculateHours(context: EstimationContext): Promise<number> {
    const { complexity, behavior } = context;
    
    // Use the new hour mapping instead of multipliers
    const hours = await this.getHoursFromMapping(complexity.name, behavior.name);
    
    return hours;
  }

  /**
   * Get estimation explanation for transparency
   */
  static async getEstimationExplanation(context: EstimationContext): Promise<string> {
    const { complexity, behavior } = context;
    const totalHours = await this.calculateHours(context);
    
    return `Direct mapping: ${complexity.name} complexity + ${behavior.name} behavior = ${totalHours}h`;
  }

  /**
   * Validate if a combination is realistic
   */
  static validateCombination(context: EstimationContext): {
    isValid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    
    // Check complexity constraints
    const allowedComplexities = this.getAllowedComplexities(
      context.screenType, 
      [context.complexity]
    );
    
    if (allowedComplexities.length === 0) {
      warnings.push(`${context.complexity.name} complexity is unusual for ${context.screenType.name} screens`);
    }
    
    // Check behavior constraints
    const allowedBehaviors = this.getAllowedBehaviors(
      context.screenType,
      [context.behavior]
    );
    
    if (allowedBehaviors.length === 0) {
      warnings.push(`${context.behavior.name} behavior is uncommon for ${context.screenType.name} screens`);
    }
    
    return {
      isValid: warnings.length === 0,
      warnings
    };
  }
}

// Utility function to calculate estimated days with specific logic:
// If hours <= 4: 0.5 day
// If hours > 4: 1 day (8 working hours = 1 day)
export function calculateEstimatedDays(totalHours: number): number {
  if (totalHours <= 4) {
    return 0.5;
  } else {
    return Math.ceil(totalHours / 8);
  }
}

// Utility function to format days display
export function formatDays(days: number): string {
  return days === 0.5 ? '0.5 Day' : days.toString();
}