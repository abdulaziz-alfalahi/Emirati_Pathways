
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Accessibility,
  Type,
  Eye,
  Keyboard,
  Volume2,
  MousePointer,
  Contrast,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';

import { useTheme } from "@/components/theme-provider";

interface AccessibilitySettings {
  fontSize: number;
  highContrast: boolean;
  dyslexiaFont: boolean;
  focusIndicator: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  colorBlindFilter: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

export const AccessibilityToolbar: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 100,
    highContrast: false,
    dyslexiaFont: false,
    focusIndicator: true,
    screenReader: false,
    keyboardNavigation: true,
    colorBlindFilter: 'none'
  });

  // Apply accessibility settings to the document
  useEffect(() => {
    const root = document.documentElement;

    // Font size adjustment
    root.style.fontSize = `${settings.fontSize}%`;

    // High contrast mode
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Dyslexia-friendly font
    if (settings.dyslexiaFont) {
      root.classList.add('dyslexia-font');
    } else {
      root.classList.remove('dyslexia-font');
    }

    // Enhanced focus indicators
    if (settings.focusIndicator) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }

    // Color blind filters
    if (settings.colorBlindFilter !== 'none') {
      root.classList.add(`filter-${settings.colorBlindFilter}`);
    } else {
      root.classList.remove('filter-protanopia', 'filter-deuteranopia', 'filter-tritanopia');
    }

    // Save settings to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load accessibility settings:', error);
      }
    }
  }, []);

  const increaseFontSize = () => {
    if (settings.fontSize < 150) {
      setSettings(prev => ({ ...prev, fontSize: prev.fontSize + 10 }));
    }
  };

  const decreaseFontSize = () => {
    if (settings.fontSize > 80) {
      setSettings(prev => ({ ...prev, fontSize: prev.fontSize - 10 }));
    }
  };

  const toggleHighContrast = () => {
    setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const toggleDyslexiaFont = () => {
    setSettings(prev => ({ ...prev, dyslexiaFont: !prev.dyslexiaFont }));
  };

  const resetSettings = () => {
    setSettings({
      fontSize: 100,
      highContrast: false,
      dyslexiaFont: false,
      focusIndicator: true,
      screenReader: false,
      keyboardNavigation: true,
      colorBlindFilter: 'none'
    });
  };

  const setColorBlindFilter = (filter: AccessibilitySettings['colorBlindFilter']) => {
    setSettings(prev => ({ ...prev, colorBlindFilter: filter }));
  };

  const hasActiveSettings = settings.fontSize !== 100 ||
    settings.highContrast ||
    settings.dyslexiaFont ||
    settings.colorBlindFilter !== 'none' ||
    theme !== 'system';

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center space-x-2 transition-colors ${hasActiveSettings
            ? 'text-ehrdc-teal bg-ehrdc-teal/10 hover:bg-ehrdc-teal/20'
            : 'text-ehrdc-neutral-dark hover:text-ehrdc-teal hover:bg-ehrdc-teal/10'
            }`}
          aria-label={t('Accessibility options', 'خيارات إمكانية الوصول')}
          title={t('Accessibility Toolbar', 'شريط إمكانية الوصول')}
        >
          <Accessibility className="h-4 w-4" />
          <span className="hidden sm:inline font-medium">{t('Accessibility', 'إمكانية الوصول')}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 bg-white border border-ehrdc-neutral-light shadow-lg"
        sideOffset={5}
      >
        <DropdownMenuLabel className="text-ehrdc-neutral-dark font-semibold">
          {t('Accessibility Options', 'خيارات إمكانية الوصول')}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-ehrdc-neutral-light" />

        {/* Theme Selection */}
        <DropdownMenuLabel className="text-ehrdc-neutral-dark font-semibold mt-2">
          {t('Display Theme', 'سمة العرض')}
        </DropdownMenuLabel>
        <div className="flex bg-slate-100 p-1 rounded-md mx-2 mb-2">
          {(['light', 'dark', 'system'] as const).map((thm) => (
            <button
              key={thm}
              onClick={() => setTheme(thm)}
              className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-sm capitalize transition-all ${theme === thm
                ? 'bg-white text-ehrdc-teal shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              {thm === 'light' ? t('Light', 'فاتح') : thm === 'dark' ? t('Dark', 'داكن') : t('System', 'النظام')}
            </button>
          ))}
        </div>

        <DropdownMenuSeparator className="bg-ehrdc-neutral-light" />

        {/* Text Size Controls */}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ehrdc-neutral-dark flex items-center">
              <Type className="h-4 w-4 mr-2" />
              {t('Text Size', 'حجم النص')}
            </span>
            <span className="text-xs text-ehrdc-neutral-dark/70">
              {settings.fontSize}%
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                decreaseFontSize();
              }}
              disabled={settings.fontSize <= 80}
              className="border-ehrdc-neutral-light hover:border-ehrdc-teal hover:text-ehrdc-teal"
              aria-label="Decrease text size"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <div className="flex-1 h-2 bg-ehrdc-neutral-light rounded-full overflow-hidden">
              <div
                className="h-full bg-ehrdc-teal transition-all duration-200"
                style={{ width: `${((settings.fontSize - 80) / 70) * 100}%` }}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                increaseFontSize();
              }}
              disabled={settings.fontSize >= 150}
              className="border-ehrdc-neutral-light hover:border-ehrdc-teal hover:text-ehrdc-teal"
              aria-label="Increase text size"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-ehrdc-neutral-light" />

        {/* Visual Adjustments */}
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            toggleHighContrast();
          }}
          className={`cursor-pointer hover:bg-ehrdc-teal/10 hover:text-ehrdc-teal ${settings.highContrast ? 'bg-ehrdc-teal/10 text-ehrdc-teal' : ''
            }`}
        >
          <Contrast className="h-4 w-4 mr-2" />
          <span>{t('High Contrast', 'تباين عالي')}</span>
          {settings.highContrast && (
            <span className="ml-auto text-xs bg-ehrdc-teal text-white px-2 py-1 rounded">
              {t('ON', 'مفعّل')}
            </span>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            toggleDyslexiaFont();
          }}
          className={`cursor-pointer hover:bg-ehrdc-teal/10 hover:text-ehrdc-teal ${settings.dyslexiaFont ? 'bg-ehrdc-teal/10 text-ehrdc-teal' : ''
            }`}
        >
          <Type className="h-4 w-4 mr-2" />
          <span>{t('Dyslexia-Friendly Font', 'خط مناسب لعسر القراءة')}</span>
          {settings.dyslexiaFont && (
            <span className="ml-auto text-xs bg-ehrdc-teal text-white px-2 py-1 rounded">
              {t('ON', 'مفعّل')}
            </span>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-ehrdc-neutral-light" />

        {/* Color Blind Support */}
        <DropdownMenuLabel className="text-xs text-ehrdc-neutral-dark/70 font-medium">
          {t('Color Vision Support', 'دعم رؤية الألوان')}
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => setColorBlindFilter('none')}
          className={`cursor-pointer hover:bg-ehrdc-teal/10 hover:text-ehrdc-teal ${settings.colorBlindFilter === 'none' ? 'bg-ehrdc-teal/10 text-ehrdc-teal' : ''
            }`}
        >
          <Eye className="h-4 w-4 mr-2" />
          <span>{t('Normal Vision', 'رؤية طبيعية')}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setColorBlindFilter('protanopia')}
          className={`cursor-pointer hover:bg-ehrdc-teal/10 hover:text-ehrdc-teal ${settings.colorBlindFilter === 'protanopia' ? 'bg-ehrdc-teal/10 text-ehrdc-teal' : ''
            }`}
        >
          <Eye className="h-4 w-4 mr-2" />
          <span>{t('Protanopia (Red-blind)', 'عمى اللون الأحمر')}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setColorBlindFilter('deuteranopia')}
          className={`cursor-pointer hover:bg-ehrdc-teal/10 hover:text-ehrdc-teal ${settings.colorBlindFilter === 'deuteranopia' ? 'bg-ehrdc-teal/10 text-ehrdc-teal' : ''
            }`}
        >
          <Eye className="h-4 w-4 mr-2" />
          <span>{t('Deuteranopia (Green-blind)', 'عمى اللون الأخضر')}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setColorBlindFilter('tritanopia')}
          className={`cursor-pointer hover:bg-ehrdc-teal/10 hover:text-ehrdc-teal ${settings.colorBlindFilter === 'tritanopia' ? 'bg-ehrdc-teal/10 text-ehrdc-teal' : ''
            }`}
        >
          <Eye className="h-4 w-4 mr-2" />
          <span>{t('Tritanopia (Blue-blind)', 'عمى اللون الأزرق')}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-ehrdc-neutral-light" />

        {/* Navigation Aids */}
        <DropdownMenuItem className="cursor-pointer hover:bg-ehrdc-teal/10 hover:text-ehrdc-teal">
          <Keyboard className="h-4 w-4 mr-2" />
          <span>{t('Keyboard Navigation Guide', 'دليل التنقل بلوحة المفاتيح')}</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer hover:bg-ehrdc-teal/10 hover:text-ehrdc-teal">
          <Volume2 className="h-4 w-4 mr-2" />
          <span>{t('Screen Reader Support', 'دعم قارئ الشاشة')}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-ehrdc-neutral-light" />

        {/* Reset Button */}
        <DropdownMenuItem
          onClick={resetSettings}
          className="cursor-pointer hover:bg-orange-50 hover:text-orange-600 text-orange-600"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          <span>{t('Reset All Settings', 'إعادة تعيين جميع الإعدادات')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
