declare module 'dictionary-en-us' {
  type DictionaryCallback = (error: Error | null, dictionary: any) => void;
  
  function dictionary(callback: DictionaryCallback): void;
  
  export default dictionary;
} 