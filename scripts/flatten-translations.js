const fs = require('fs');

function flattenObject(obj, prefix = '') {
    let result = {};
    
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            const nested = flattenObject(obj[key], prefix ? `${key}` : key);
            result = { ...result, ...nested };
        } else {
            const flatKey = prefix ? `${key}` : key;
            result[flatKey] = obj[key];
        }
    }
    
    return result;
}

function createNewStructure(translations) {
    const { en, he } = translations;
    
    // Flatten both objects
    const flatEn = flattenObject(en);
    const flatHe = flattenObject(he);
    
    // Create new structure
    const newStructure = {};
    
    // Process all English keys
    for (const key in flatEn) {
        newStructure[key] = {
            en: flatEn[key],
            he: flatHe[key] || '#missing value#'
        };
    }
    
    // Add any Hebrew keys that might not exist in English
    for (const key in flatHe) {
        if (!newStructure[key]) {
            newStructure[key] = {
                en: '#missing value#',
                he: flatHe[key]
            };
        }
    }
    
    return newStructure;
}

// Read the input file
const inputFile = process.argv[2] || 'translations.js';
const outputFile = process.argv[3] || 'flattened-translations.json';

try {
    // Read the input file
    let fileContent = fs.readFileSync(inputFile, 'utf8');
    
    // Remove the export statement and get just the object
    fileContent = fileContent.replace('export const translations = ', 'const translations = ');
    
    // Create a safe evaluation context
    const context = {
        translations: null
    };
    
    // Evaluate the file content in the context
    new Function('context', `
        ${fileContent}
        context.translations = translations;
    `)(context);
    
    if (!context.translations) {
        throw new Error('Could not find translations object in file');
    }
    
    // Create new structure
    const newStructure = createNewStructure(context.translations);
    
    // Save to new file
    fs.writeFileSync(outputFile, JSON.stringify(newStructure, null, 2), 'utf8');
    
    console.log(`Successfully converted translations and saved to ${outputFile}`);
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}