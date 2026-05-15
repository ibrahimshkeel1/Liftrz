import React, { createContext, useContext, useState, useCallback } from 'react';

interface LanguageContextValue {
  lang: 'en' | 'ur';
  setLang: (lang: 'en' | 'ur') => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.discover': 'Find Trainers',
    'nav.bookings': 'My Bookings',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'hero.title': 'Find a trainer who actually delivers results.',
    'hero.subtitle': 'Compare verified personal trainers in your area. See real transformations, read honest reviews, and book a free trial before you commit.',
    'search.find_trainers': 'Find Trainers',
    'search.city': 'City',
    'search.goal': 'Goal',
    'search.budget': 'Budget',
    'trainer.available': 'Available now',
    'trainer.booked': 'Fully booked',
    'trainer.slots': 'slots open',
    'trainer.per_month': 'per month',
    'trainer.view_profile': 'View Profile',
    'trainer.free_inquiry': 'Send free inquiry',
    'trainer.inquiry_sent': 'Inquiry sent!',
    'filter.all_trainers': 'All Trainers',
    'filter.male': 'Male Trainers',
    'filter.female': 'Female Trainers',
    'common.loading': 'Loading...',
    'common.submit': 'Submit',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.send': 'Send',
    'common.close': 'Close',
    'common.yes': 'Yes',
    'common.no': 'No',
    'progress.title': 'My Progress',
    'progress.weight': 'Weight',
    'progress.photos': 'Progress Photos',
    'progress.add_entry': 'Add Entry',
    'group.buddy_training': 'Buddy Training',
    'group.buddy_discount': 'Train with a friend and save 5% each',
    'group.add_buddy': 'Add training partner',
    'group.buddy_name': 'Buddy name',
    'group.buddy_phone': 'Buddy phone',
  },
  ur: {
    'nav.home': 'ہوم',
    'nav.discover': 'ٹرینرز تلاش کریں',
    'nav.bookings': 'میری بکنگز',
    'nav.login': 'لاگ ان',
    'nav.logout': 'لاگ آؤٹ',
    'hero.title': 'ایسا ٹرینر تلاش کریں جو واقعی نتائج دے۔',
    'hero.subtitle': 'اپنے علاقے میں تصدیق شدہ ذاتی ٹرینرز کا موازنہ کریں۔ حقیقی تبدیلیاں دیکھیں، ایماندار جائزے پڑھیں، اور پرعزم ہونے سے پہلے مفت ٹرائل بک کریں۔',
    'search.find_trainers': 'ٹرینرز تلاش کریں',
    'search.city': 'شہر',
    'search.goal': 'ہدف',
    'search.budget': 'بجٹ',
    'trainer.available': 'اب دستیاب ہے',
    'trainer.booked': 'مکمل طور پر بک شدہ',
    'trainer.slots': 'سلاٹس کھلی ہیں',
    'trainer.per_month': 'فی مہینہ',
    'trainer.view_profile': 'پروفائل دیکھیں',
    'trainer.free_inquiry': 'مفت انکوائری بھیجیں',
    'trainer.inquiry_sent': 'انکوائری بھیج دی گئی!',
    'filter.all_trainers': 'تمام ٹرینرز',
    'filter.male': 'مرد ٹرینرز',
    'filter.female': 'خواتین ٹرینرز',
    'common.loading': 'لوڈ ہو رہا ہے...',
    'common.submit': 'جمع کرائیں',
    'common.cancel': 'منسوخ کریں',
    'common.save': 'محفوظ کریں',
    'common.delete': 'حذف کریں',
    'common.edit': 'ترمیم کریں',
    'common.send': 'بھیجیں',
    'common.close': 'بند کریں',
    'common.yes': 'ہاں',
    'common.no': 'نہیں',
    'progress.title': 'میری پیش رفت',
    'progress.weight': 'وزن',
    'progress.photos': 'پیش رفت کی تصاویر',
    'progress.add_entry': 'اندراج شامل کریں',
    'group.buddy_training': 'بڈی ٹریننگ',
    'group.buddy_discount': 'دوست کے ساتھ ٹریننگ کریں اور ہر ایک 5% بچائیں',
    'group.add_buddy': 'ٹریننگ پارٹنر شامل کریں',
    'group.buddy_name': 'دوست کا نام',
    'group.buddy_phone': 'دوست کا فون',
  }
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<'en' | 'ur'>('en');

  const t = useCallback((key: string) => {
    return translations[lang][key] || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      <div dir={lang === 'ur' ? 'rtl' : 'ltr'}>{children}</div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
