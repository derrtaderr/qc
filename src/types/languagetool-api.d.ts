declare module 'languagetool-api' {
  export interface LanguageToolMatch {
    message: string;
    offset: number;
    length: number;
    replacements: Array<{ value: string }>;
    rule: {
      category: {
        id: string;
      };
    };
  }

  export interface LanguageToolResponse {
    matches: LanguageToolMatch[];
  }

  export interface LanguageToolOptions {
    endpoint?: string;
  }

  export default class LanguageTool {
    constructor(options?: LanguageToolOptions);
    check(params: { text: string; language: string }): Promise<LanguageToolResponse>;
  }
} 