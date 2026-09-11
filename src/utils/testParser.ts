import fs from 'fs';
import path from 'path';
import { parseKnightLabJson } from './jsonToStoryData';

try {
  const filePath = path.resolve(process.cwd(), 'examples/taormina.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const jsonContent = JSON.parse(fileContent);

  const parsedData = parseKnightLabJson(jsonContent);

  console.log('✅ Success: Parsed Knight Lab JSON Taormina successfully!');
  console.log(`Slide count: ${parsedData.slides.length}`);
  console.log('First slide:', JSON.stringify(parsedData.slides[0], null, 2));
} catch (error) {
  console.error('❌ Error parsing Taormina JSON:', error);
  process.exit(1);
}

