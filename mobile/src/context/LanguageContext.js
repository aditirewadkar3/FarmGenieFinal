import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGES = {
  en: { label: 'English', code: 'en' },
  mr: { label: 'मराठी', code: 'mr' },
  hi: { label: 'हिंदी', code: 'hi' },
};

const translations = {
  en: {
    // Auth
    'Sign In': 'Sign In',
    'Sign Up': 'Sign Up',
    'Mobile Number': 'Mobile Number',
    'Password': 'Password',
    'Confirm Password': 'Confirm Password',
    'Name': 'Name',
    'Role': 'Role',
    // Nav
    'Dashboard': 'Dashboard',
    'Crops': 'Crops',
    'Market': 'Market',
    'Weather': 'Weather',
    'Schemes': 'Schemes',
    'Equipment': 'Equipment',
    'Disease': 'Disease Detection',
    'Supply Chain': 'Supply Chain',
    'Messages': 'Messages',
    'Profile': 'Profile',
    'AI Chat': 'AI Assistant',
    // Farmer
    'Good Morning': 'Good Morning',
    'Good Afternoon': 'Good Afternoon',
    'Good Evening': 'Good Evening',
    'My Crops': 'My Crops',
    'No crops added yet': 'No crops added yet',
    'Add Crop': 'Add Crop',
    // Market
    'Market Prices': 'Market Prices',
    'Search commodity': 'Search commodity',
    // Disease
    'Upload Image': 'Upload Image',
    'Take Photo': 'Take Photo',
    'Detect Disease': 'Detect Disease',
    'Detection Result': 'Detection Result',
    // Schemes
    'Government Schemes': 'Government Schemes',
    'AI Recommended': 'AI Recommended for You',
    // General
    'Loading...': 'Loading...',
    'Error': 'Error',
    'Retry': 'Retry',
    'Save': 'Save',
    'Cancel': 'Cancel',
    'Delete': 'Delete',
    'Edit': 'Edit',
    'Close': 'Close',
    'Submit': 'Submit',
    'Back': 'Back',
    'Logout': 'Logout',
    'Settings': 'Settings',
    'No data available': 'No data available',
    'KrishiBandhu': 'KrishiBandhu',
  },
  mr: {
    'Sign In': 'साइन इन',
    'Sign Up': 'नोंदणी करा',
    'Mobile Number': 'मोबाइल नंबर',
    'Password': 'पासवर्ड',
    'Confirm Password': 'पासवर्ड पुष्टी करा',
    'Name': 'नाव',
    'Role': 'भूमिका',
    'Dashboard': 'डॅशबोर्ड',
    'Crops': 'पिके',
    'Market': 'बाजार',
    'Weather': 'हवामान',
    'Schemes': 'योजना',
    'Equipment': 'उपकरणे',
    'Disease': 'रोग तपासणी',
    'Supply Chain': 'पुरवठा साखळी',
    'Messages': 'संदेश',
    'Profile': 'प्रोफाइल',
    'AI Chat': 'AI सहाय्यक',
    'Good Morning': 'सुप्रभात',
    'Good Afternoon': 'शुभ दुपार',
    'Good Evening': 'शुभ संध्याकाळ',
    'My Crops': 'माझी पिके',
    'No crops added yet': 'अद्याप पिके जोडलेली नाहीत',
    'Add Crop': 'पीक जोडा',
    'Market Prices': 'बाजार भाव',
    'Search commodity': 'माल शोधा',
    'Upload Image': 'फोटो अपलोड करा',
    'Take Photo': 'फोटो काढा',
    'Detect Disease': 'रोग ओळखा',
    'Detection Result': 'तपासणी निकाल',
    'Government Schemes': 'सरकारी योजना',
    'AI Recommended': 'AI शिफारस',
    'Loading...': 'लोड होत आहे...',
    'Error': 'त्रुटी',
    'Retry': 'पुन्हा प्रयत्न',
    'Save': 'जतन करा',
    'Cancel': 'रद्द करा',
    'Delete': 'हटवा',
    'Edit': 'संपादित करा',
    'Close': 'बंद करा',
    'Submit': 'सबमिट करा',
    'Back': 'मागे',
    'Logout': 'लॉगआउट',
    'Settings': 'सेटिंग्ज',
    'No data available': 'डेटा उपलब्ध नाही',
    'KrishiBandhu': 'कृषिबंधू',
  },
  hi: {
    'Sign In': 'साइन इन',
    'Sign Up': 'साइन अप',
    'Mobile Number': 'मोबाइल नंबर',
    'Password': 'पासवर्ड',
    'Confirm Password': 'पासवर्ड की पुष्टि करें',
    'Name': 'नाम',
    'Role': 'भूमिका',
    'Dashboard': 'डैशबोर्ड',
    'Crops': 'फसलें',
    'Market': 'बाज़ार',
    'Weather': 'मौसम',
    'Schemes': 'योजनाएं',
    'Equipment': 'उपकरण',
    'Disease': 'रोग पहचान',
    'Supply Chain': 'आपूर्ति श्रृंखला',
    'Messages': 'संदेश',
    'Profile': 'प्रोफ़ाइल',
    'AI Chat': 'AI सहायक',
    'Good Morning': 'सुप्रभात',
    'Good Afternoon': 'शुभ दोपहर',
    'Good Evening': 'शुभ संध्या',
    'My Crops': 'मेरी फसलें',
    'No crops added yet': 'अभी तक कोई फसल नहीं जोड़ी',
    'Add Crop': 'फसल जोड़ें',
    'Market Prices': 'बाज़ार भाव',
    'Search commodity': 'माल खोजें',
    'Upload Image': 'फोटो अपलोड करें',
    'Take Photo': 'फोटो लें',
    'Detect Disease': 'रोग पहचानें',
    'Detection Result': 'पहचान परिणाम',
    'Government Schemes': 'सरकारी योजनाएं',
    'AI Recommended': 'AI अनुशंसित',
    'Loading...': 'लोड हो रहा है...',
    'Error': 'त्रुटि',
    'Retry': 'पुनः प्रयास',
    'Save': 'सहेजें',
    'Cancel': 'रद्द करें',
    'Delete': 'हटाएं',
    'Edit': 'संपादित करें',
    'Close': 'बंद करें',
    'Submit': 'सबमिट करें',
    'Back': 'वापस',
    'Logout': 'लॉगआउट',
    'Settings': 'सेटिंग्स',
    'No data available': 'डेटा उपलब्ध नहीं',
    'KrishiBandhu': 'कृषिबंधु',
  },
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem('language').then((l) => {
      if (l && translations[l]) setLanguage(l);
    });
  }, []);

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    await AsyncStorage.setItem('language', lang);
  };

  const t = (key) => translations[language]?.[key] || translations.en[key] || key;

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
