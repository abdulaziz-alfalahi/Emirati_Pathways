
import React from 'react';
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export const BasicInfoFields = () => {
  const form = useFormContext();
  const { t } = useTranslation('common');
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('forms.labels.internshipTitle')}</FormLabel>
              <FormControl>
                <Input placeholder={t('forms.placeholders.internshipTitle')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('forms.labels.company')}</FormLabel>
              <FormControl>
                <Input placeholder={t('forms.placeholders.companyName')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
          <FormItem>
            <FormLabel>{t('forms.labels.location')}</FormLabel>
            <FormControl>
              <Input placeholder={t('forms.placeholders.location')} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="industry"
          render={({ field }) => (
          <FormItem>
            <FormLabel>{t('forms.labels.industry')}</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t('forms.placeholders.selectIndustry')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {[
                  { key: 'technology', value: 'Technology' },
                  { key: 'marketing', value: 'Marketing' },
                  { key: 'banking', value: 'Banking' },
                  { key: 'healthcare', value: 'Healthcare' },
                  { key: 'education', value: 'Education' },
                  { key: 'retail', value: 'Retail' },
                  { key: 'manufacturing', value: 'Manufacturing' },
                  { key: 'media', value: 'Media' },
                  { key: 'hospitality', value: 'Hospitality' }
                ].map((industry) => (
                  <SelectItem key={industry.value} value={industry.value}>
                    {t(`forms.industries.${industry.key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('forms.labels.department')}</FormLabel>
              <FormControl>
                <Input placeholder={t('forms.placeholders.department')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="education_level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('forms.labels.educationLevel')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('forms.placeholders.selectEducationLevel')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="High School">{t('forms.educationLevels.highSchool')}</SelectItem>
                  <SelectItem value="Undergraduate">{t('forms.educationLevels.undergraduate')}</SelectItem>
                  <SelectItem value="Graduate">{t('forms.educationLevels.graduate')}</SelectItem>
                  <SelectItem value="Any">{t('forms.educationLevels.any')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
};

export const DateFields = () => {
  const form = useFormContext();
  const { t } = useTranslation('common');
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>{t('forms.labels.startDate')}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className="w-full pl-3 text-left font-normal"
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>{t('forms.placeholders.pickDate')}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="end_date"
          render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>{t('forms.labels.endDate')}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className="w-full pl-3 text-left font-normal"
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>{t('forms.placeholders.pickDate')}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

        <FormField
          control={form.control}
          name="application_deadline"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t('forms.labels.applicationDeadline')}</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className="w-full pl-3 text-left font-normal"
                  >
                    {field.value ? (
                      format(field.value, "PPP")
                    ) : (
                      <span>{t('forms.placeholders.pickDate')}</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export const CompensationFields = () => {
  const form = useFormContext();
  const { t } = useTranslation('common');
  const isPaid = form.watch('is_paid');
  
  return (
    <>
      <div className="flex items-center space-x-2">
        <FormField
          control={form.control}
          name="is_paid"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>{t('forms.labels.paidInternship')}</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {isPaid && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stipend_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('forms.labels.stipendAmount')}</FormLabel>
                <FormControl>
                  <Input type="number" placeholder={t('forms.placeholders.stipendAmount')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('forms.labels.currency')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('forms.placeholders.selectCurrency')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </>
  );
};

export const DescriptionFields = () => {
  const form = useFormContext();
  const { t } = useTranslation('common');
  
  return (
    <>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('forms.labels.description')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('forms.placeholders.description')}
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('forms.labels.requirements')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('forms.placeholders.requirements')}
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
    </>
  );
};

export const SkillsAndContactFields = () => {
  const form = useFormContext();
  const { t } = useTranslation('common');
  
  return (
    <>
        <FormField
          control={form.control}
          name="skills_required"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('forms.labels.requiredSkills')}</FormLabel>
              <FormControl>
                <Input placeholder={t('forms.placeholders.requiredSkills')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contact_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('forms.labels.contactEmail')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('forms.placeholders.contactEmail')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contact_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('forms.labels.contactPhone')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('forms.placeholders.contactPhone')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="website_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('forms.labels.websiteUrl')}</FormLabel>
              <FormControl>
                <Input placeholder={t('forms.placeholders.websiteUrl')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
    </>
  );
};
