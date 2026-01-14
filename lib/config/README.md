# Nutrition Tracker Configuration

## Philosophy: Data-Driven Decision Making

All thresholds and multipliers in this project are:
1. **Evidence-based**: Referenced to scientific studies
2. **Configurable**: Easy to adjust for A/B testing
3. **Documented**: Clear explanation of why each value exists

## Key Configuration Files

### `nutrition-thresholds.ts`
Contains all numerical constants used in nutrition calculations.

**Never hardcode magic numbers in business logic!**

```typescript
// DON'T DO THIS
if (ironIntake < targetIron * 0.7) { // Why 0.7?
  warn("Low iron");
}

// DO THIS
import { DEFAULT_NUTRITION_THRESHOLDS } from '@/lib/config/nutrition-thresholds';

if (ironIntake < targetIron * DEFAULT_NUTRITION_THRESHOLDS.deficiencyWarningRatio) {
  warn("Low iron");
}
```

## Cycle Phase Multipliers

Based on Stacy Sims' ROAR methodology, validated by:
- Barr et al. (1995): BMR increases 5-10% in luteal phase
- Wikström-Frisén et al. (2017): Iron losses during menstruation
- Fathizadeh et al. (2010): Magnesium reduces PMS symptoms

## A/B Testing

Use `getThresholdsForUser()` to customize thresholds per user segment:

```typescript
const thresholds = getThresholdsForUser({
  activityLevel: 'athlete',
  dietType: 'vegan'
});
```

## References

1. Sims, S. T., & Yeager, S. (2016). ROAR: How to Match Your Food and Fitness to Your Female Physiology
2. WHO. (2004). Vitamin and mineral requirements in human nutrition
3. Barr, S. I., et al. (1995). Energy intakes are higher during the luteal phase of ovulatory menstrual cycles. AJCN.
