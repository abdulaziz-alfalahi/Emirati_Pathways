
import * as React from "react";
import { Languages } from "lucide-react";
import { useLanguage } from "@/context/EnhancedLanguageContext";
import { useTranslation } from 'react-i18next';

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation('common');

  console.log('LanguageToggle render - current language:', language);
  console.log('LanguageToggle render - toggle language text:', t('accessibility.toggleLanguage'));

  const handleLanguageChange = async (newLanguage: 'en' | 'ar') => {
    console.log('Language toggle clicked:', newLanguage);
    
    await setLanguage(newLanguage);
    
    // Force component re-render by waiting a bit
    setTimeout(() => {
      console.log('After change - language:', newLanguage);
    }, 100);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="bg-background">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t('accessibility.toggleLanguage')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border-border">
        <DropdownMenuItem 
          onClick={() => handleLanguageChange("en")}
          className={`cursor-pointer flex items-center gap-2 ${language === 'en' ? 'bg-accent' : ''}`}
        >
          <span className="text-base">🇺🇸</span>
          <span>English</span>
          {language === 'en' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleLanguageChange("ar")}
          className={`cursor-pointer flex items-center gap-2 ${language === 'ar' ? 'bg-accent' : ''}`}
        >
          <span className="text-base">🇦🇪</span>
          <span>العربية</span>
          {language === 'ar' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
