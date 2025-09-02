import type { ComplexityMaster, ScreenTypeMaster, GenericScreenType } from "@shared/schema";

export interface EstimationContext {
  screenType: GenericScreenType;
  complexity: ComplexityMaster;
  behavior: ScreenTypeMaster;
}

export class SmartEstimationEngine {
  
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
   * Calculate smart estimation hours based on context
   */
  static calculateHours(context: EstimationContext): number {
    const { screenType, complexity, behavior } = context;
    
    // Get base hours from screen type (with interdependency awareness)
    const baseHours = screenType.baseHours || 4;
    
    // Apply complexity multiplier
    const complexityMultiplier = parseFloat(complexity.multiplier || '1.00');
    
    // Apply behavior multiplier
    const behaviorMultiplier = parseFloat(behavior.multiplier || '1.00');
    
    // Calculate total hours
    const totalHours = baseHours * complexityMultiplier * behaviorMultiplier;
    
    return Math.round(totalHours);
  }

  /**
   * Get estimation explanation for transparency
   */
  static getEstimationExplanation(context: EstimationContext): string {
    const { screenType, complexity, behavior } = context;
    const baseHours = screenType.baseHours || 4;
    const complexityMultiplier = parseFloat(complexity.multiplier || '1.00');
    const behaviorMultiplier = parseFloat(behavior.multiplier || '1.00');
    const totalHours = this.calculateHours(context);
    
    return `${baseHours}h (${screenType.name}) × ${complexityMultiplier}x (${complexity.name}) × ${behaviorMultiplier}x (${behavior.name}) = ${totalHours}h`;
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