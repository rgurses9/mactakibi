// Test Turkish date parsing
import { parseDate } from './utils/dateHelpers';

// Test cases for Turkish month names
const testDates = [
    '1 Kasım 2025',
    '15 Kasım 2025 Cumartesi',
    '6 Aralık 2025',
    '18 Ekim 2025',
    '01.11.2025',
    '15.12.2025'
];

console.log('Testing Turkish Date Parsing:');
console.log('================================');

testDates.forEach(dateStr => {
    const parsed = parseDate(dateStr);
    if (parsed) {
        console.log(`✅ "${dateStr}" => ${parsed.toLocaleDateString('tr-TR')}`);
    } else {
        console.log(`❌ "${dateStr}" => FAILED TO PARSE`);
    }
});
