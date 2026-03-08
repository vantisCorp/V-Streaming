import EventEmitter from 'eventemitter3';
import {
  Expression,
  ExpressionCategory,
  ExpressionState,
  BlendShapeBinding,
} from '../types/vtuber';

// Import model service
import { VTuberModelService as ModelService } from './VTuberModelService';

// ============ Event Types ============

interface ExpressionServiceEvents {
  'expression-triggered': (expression: Expression) => void;
  'expression-ended': (expression: Expression) => void;
  'transition-start': (from: Expression | null, to: Expression) => void;
  'transition-complete': (expression: Expression) => void;
  'auto-blink': () => void;
}

/**
 * ExpressionService
 * 
 * Service for managing VTuber avatar expressions, transitions,
 * and automated behaviors like blinking.
 */
export class ExpressionService extends EventEmitter<ExpressionServiceEvents> {
  private static instance: ExpressionService | null = null;

  private modelService: ModelService;
  private state: ExpressionState = {
    current: null,
    previous: null,
    transitionProgress: 0,
    active: new Map(),
  };
  private expressionQueue: Array<{ expression: Expression; duration?: number }> = [];
  private transitionTimer: ReturnType<typeof setTimeout> | null = null;
  private autoBlinkTimer: ReturnType<typeof setInterval> | null = null;
  private isAutoBlinkEnabled: boolean = true;
  private autoBlinkInterval: number = 3000;
  private expressionHistory: Expression[] = [];
  private maxHistorySize: number = 50;

  private constructor() {
    super();
    this.modelService = ModelService.getInstance();
    this.startAutoBlink();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ExpressionService {
    if (!ExpressionService.instance) {
      ExpressionService.instance = new ExpressionService();
    }
    return ExpressionService.instance;
  }

  // ============ Expression Control ============

  /**
   * Trigger an expression
   */
  public triggerExpression(expressionId: string, duration?: number): void {
    const expression = this.modelService.getExpression(expressionId);
    if (!expression) {
      console.warn(`Expression not found: ${expressionId}`);
      return;
    }

    this.applyExpression(expression, duration);
  }

  /**
   * Trigger expression by category
   */
  public triggerByCategory(category: ExpressionCategory): void {
    const expressions = this.modelService.getExpressions();
    const matching = expressions.filter(e => this.getExpressionCategory(e) === category);
    
    if (matching.length === 0) {
      console.warn(`No expressions found for category: ${category}`);
      return;
    }

    // Pick random expression from category
    const random = matching[Math.floor(Math.random() * matching.length)];
    this.applyExpression(random);
  }

  /**
   * Reset to neutral expression
   */
  public resetToNeutral(): void {
    this.triggerExpression('neutral');
  }

  /**
   * Queue expression for later
   */
  public queueExpression(expressionId: string, duration?: number): void {
    const expression = this.modelService.getExpression(expressionId);
    if (!expression) return;

    this.expressionQueue.push({ expression, duration });
    this.processQueue();
  }

  /**
   * Clear expression queue
   */
  public clearQueue(): void {
    this.expressionQueue = [];
  }

  // ============ Layered Expressions ============

  /**
   * Set layered expression intensity
   */
  public setLayeredIntensity(expressionId: string, intensity: number): void {
    if (intensity <= 0) {
      this.state.active.delete(expressionId);
    } else {
      this.state.active.set(expressionId, Math.min(1, Math.max(0, intensity)));
    }
    this.updateBlendShapes();
  }

  /**
   * Get active layered expressions
   */
  public getActiveLayers(): Map<string, number> {
    return new Map(this.state.active);
  }

  // ============ Auto Blink ============

  /**
   * Enable auto blink
   */
  public enableAutoBlink(enabled: boolean = true): void {
    this.isAutoBlinkEnabled = enabled;
    if (enabled) {
      this.startAutoBlink();
    } else {
      this.stopAutoBlink();
    }
  }

  /**
   * Set auto blink interval
   */
  public setAutoBlinkInterval(intervalMs: number): void {
    this.autoBlinkInterval = intervalMs;
    if (this.isAutoBlinkEnabled) {
      this.stopAutoBlink();
      this.startAutoBlink();
    }
  }

  /**
   * Trigger manual blink
   */
  public blink(): void {
    this.performBlink();
  }

  // ============ State Management ============

  /**
   * Get current expression state
   */
  public getState(): ExpressionState {
    return { ...this.state };
  }

  /**
   * Get expression history
   */
  public getHistory(): Expression[] {
    return [...this.expressionHistory];
  }

  /**
   * Clear expression history
   */
  public clearHistory(): void {
    this.expressionHistory = [];
  }

  // ============ Private Methods ============

  private applyExpression(expression: Expression, duration?: number): void {
    // Clear any pending transition
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }

    // Store previous expression
    this.state.previous = this.state.current;
    this.state.current = expression;
    this.state.transitionProgress = 0;

    // Add to history
    this.addToHistory(expression);

    // Emit events
    this.emit('transition-start', this.state.previous, expression);
    this.emit('expression-triggered', expression);

    // Apply blend shapes
    this.animateTransition(expression);

    // Set duration timer if specified
    if (duration) {
      this.transitionTimer = setTimeout(() => {
        this.endExpression(expression);
      }, duration);
    }
  }

  private animateTransition(expression: Expression): void {
    const duration = expression.duration;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      this.state.transitionProgress = progress;
      this.updateBlendShapes();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.emit('transition-complete', expression);
      }
    };

    requestAnimationFrame(animate);
  }

  private updateBlendShapes(): void {
    const blendShapes = new Map<BlendShapeBinding, number>();

    // Apply current expression
    if (this.state.current) {
      for (const [binding, value] of this.state.current.blendShapes) {
        const intensity = this.state.current.intensity * this.state.transitionProgress;
        blendShapes.set(binding, value * intensity);
      }
    }

    // Apply layered expressions
    for (const [expressionId, intensity] of this.state.active) {
      const expression = this.modelService.getExpression(expressionId);
      if (expression) {
        for (const [binding, value] of expression.blendShapes) {
          const current = blendShapes.get(binding) || 0;
          blendShapes.set(binding, Math.max(current, value * intensity));
        }
      }
    }

    // Apply to model service
    this.modelService.setBlendShapes(Object.fromEntries(blendShapes) as Record<BlendShapeBinding, number>);
  }

  private endExpression(expression: Expression): void {
    if (this.state.current?.id === expression.id) {
      this.emit('expression-ended', expression);
      this.resetToNeutral();
    }
  }

  private processQueue(): void {
    if (this.expressionQueue.length === 0 || this.state.current) return;

    const { expression, duration } = this.expressionQueue.shift()!;
    this.applyExpression(expression, duration);
  }

  private startAutoBlink(): void {
    if (this.autoBlinkTimer) return;

    const scheduleNextBlink = () => {
      // Random variation in blink timing
      const variation = this.autoBlinkInterval * 0.3;
      const nextBlink = this.autoBlinkInterval + (Math.random() - 0.5) * 2 * variation;

      this.autoBlinkTimer = setTimeout(() => {
        if (this.isAutoBlinkEnabled) {
          this.performBlink();
          scheduleNextBlink();
        }
      }, nextBlink);
    };

    scheduleNextBlink();
  }

  private stopAutoBlink(): void {
    if (this.autoBlinkTimer) {
      clearTimeout(this.autoBlinkTimer);
      this.autoBlinkTimer = null;
    }
  }

  private performBlink(): void {
    // Don't blink if already blinking or if current expression overrides
    if (this.state.current?.id === 'blink') return;

    const blinkExpression = this.modelService.getExpression('blink');
    if (!blinkExpression) return;

    this.emit('auto-blink');

    // Quick blink animation
    const blinkDuration = 100;
    const blendShapes = new Map<BlendShapeBinding, number>();
    blendShapes.set(BlendShapeBinding.EYE_BLINK_LEFT, 1);
    blendShapes.set(BlendShapeBinding.EYE_BLINK_RIGHT, 1);

    this.modelService.setBlendShapes({
      [BlendShapeBinding.EYE_BLINK_LEFT]: 1,
      [BlendShapeBinding.EYE_BLINK_RIGHT]: 1,
    });

    setTimeout(() => {
      this.modelService.setBlendShapes({
        [BlendShapeBinding.EYE_BLINK_LEFT]: 0,
        [BlendShapeBinding.EYE_BLINK_RIGHT]: 0,
      });
    }, blinkDuration);
  }

  private addToHistory(expression: Expression): void {
    this.expressionHistory.unshift(expression);
    if (this.expressionHistory.length > this.maxHistorySize) {
      this.expressionHistory.pop();
    }
  }

  private getExpressionCategory(expression: Expression): ExpressionCategory {
    // Map expression properties to category
    const name = expression.name.toLowerCase();
    
    if (name.includes('happy') || name.includes('smile')) return ExpressionCategory.HAPPY;
    if (name.includes('sad') || name.includes('cry')) return ExpressionCategory.SAD;
    if (name.includes('angry') || name.includes('mad')) return ExpressionCategory.ANGRY;
    if (name.includes('surprise') || name.includes('shock')) return ExpressionCategory.SURPRISED;
    if (name.includes('relax') || name.includes('calm')) return ExpressionCategory.RELAXED;
    
    return expression.category || ExpressionCategory.NEUTRAL;
  }

  /**
   * Cleanup and destroy instance
   */
  public destroy(): void {
    this.stopAutoBlink();
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }
    this.removeAllListeners();
    ExpressionService.instance = null;
  }
}

export default ExpressionService.getInstance();