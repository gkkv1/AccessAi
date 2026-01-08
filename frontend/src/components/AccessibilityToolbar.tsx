import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Settings, Eye, Type, Accessibility, RotateCcw } from 'lucide-react';

export function AccessibilityToolbar() {
  const { settings, updateSettings, resetSettings } = useAccessibility();

  const textSizeLabels: Record<number, string> = {
    100: '100%',
    125: '125%',
    150: '150%',
    175: '175%',
    200: '200%',
  };

  const textSizeValues = [100, 125, 150, 175, 200];
  const currentIndex = textSizeValues.indexOf(settings.textSize);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="touch-target rounded-full"
          aria-label="Accessibility settings"
        >
          <Accessibility className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Accessibility</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetSettings}
              className="text-muted-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <div>
                <label htmlFor="high-contrast" className="font-medium">
                  High Contrast
                </label>
                <p className="text-sm text-muted-foreground">
                  Increase color contrast
                </p>
              </div>
            </div>
            <Switch
              id="high-contrast"
              checked={settings.highContrast}
              onCheckedChange={(checked) => updateSettings({ highContrast: checked })}
            />
          </div>

          {/* Text Size */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Type className="h-5 w-5 text-muted-foreground" />
              <div>
                <label className="font-medium">Text Size</label>
                <p className="text-sm text-muted-foreground">
                  {textSizeLabels[settings.textSize]}
                </p>
              </div>
            </div>
            <Slider
              value={[currentIndex]}
              max={4}
              step={1}
              onValueChange={([index]) => {
                updateSettings({ textSize: textSizeValues[index] as 100 | 125 | 150 | 175 | 200 });
              }}
              className="w-full"
              aria-label="Text size"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>A</span>
              <span className="text-lg">A</span>
            </div>
          </div>

          {/* Dyslexia Font */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <div>
                <label htmlFor="dyslexia-font" className="font-medium">
                  Dyslexia-Friendly Font
                </label>
                <p className="text-sm text-muted-foreground">
                  Use Atkinson Hyperlegible
                </p>
              </div>
            </div>
            <Switch
              id="dyslexia-font"
              checked={settings.dyslexiaFont}
              onCheckedChange={(checked) => updateSettings({ dyslexiaFont: checked })}
            />
          </div>

          {/* Reduce Motion */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Accessibility className="h-5 w-5 text-muted-foreground" />
              <div>
                <label htmlFor="reduce-motion" className="font-medium">
                  Reduce Motion
                </label>
                <p className="text-sm text-muted-foreground">
                  Minimize animations
                </p>
              </div>
            </div>
            <Switch
              id="reduce-motion"
              checked={settings.reduceMotion}
              onCheckedChange={(checked) => updateSettings({ reduceMotion: checked })}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
