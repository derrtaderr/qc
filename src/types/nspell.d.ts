declare module 'nspell' {
  interface NSpell {
    correct: (word: string) => boolean;
    suggest: (word: string) => string[];
    add: (word: string) => void;
  }
  
  function nspell(dictionary: any): NSpell;
  
  export default nspell;
} 