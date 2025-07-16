interface WebsiteConfig {
  title: string;
  footer: string;
  short_name: string;
  display_name: string;
  description: string;
  default_language: string;
  languages: Record<string, string>;
  backend: string;
  websocket?: string;
}

const getEnvVar = (key: string, defaultValue: string): string => {
  const envKey = `VITE_${key.toUpperCase()}`;
  return (import.meta.env[envKey] as string) || defaultValue;
};

const parseLanguages = (envValue: string): Record<string, string> => {
  try {
    return JSON.parse(envValue);
  } catch {
    return { ar: "العربية", en: "English" };
  }
};

export const website: WebsiteConfig = {
  title: getEnvVar('TITLE', "DMART Unified Data Platform"),
  footer: getEnvVar('FOOTER', "dmart.cc unified data platform"),
  short_name: getEnvVar('SHORT_NAME', "dmart"),
  display_name: getEnvVar('DISPLAY_NAME', "dmart"),
  description: getEnvVar('DESCRIPTION', "dmart unified data platform"),
  default_language: getEnvVar('DEFAULT_LANGUAGE', "ar"),
  languages: parseLanguages(getEnvVar('LANGUAGES', '{"ar": "العربية", "en": "English"}')),
  backend: getEnvVar('BACKEND', "http://localhost:8282"),
  websocket: getEnvVar('WEBSOCKET', "ws://0.0.0.0:8484/ws"),
};
