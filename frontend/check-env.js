#!/usr/bin/env node

// 환경별 API URL 확인 스크립트
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 환경별 API 설정 확인\n');

const envFiles = [
  { name: '.env', desc: '기본 설정' },
  { name: '.env.development', desc: '개발 환경 (npm run dev)' },
  { name: '.env.production', desc: '프로덕션 환경 (npm run build)' },
];

envFiles.forEach(({ name, desc }) => {
  const filePath = path.join(__dirname, name);
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/VITE_API_URL=(.+)/);
    
    if (match) {
      console.log(`✅ ${name}`);
      console.log(`   ${desc}`);
      console.log(`   API URL: ${match[1].trim()}`);
      console.log('');
    }
  } else {
    console.log(`❌ ${name} - 파일 없음`);
    console.log('');
  }
});

console.log('📝 사용 방법:');
console.log('   개발: npm run dev → .env.development 사용');
console.log('   빌드: npm run build → .env.production 사용');
console.log('');
