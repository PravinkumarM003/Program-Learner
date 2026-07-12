const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/AdminDashboard.jsx', 'utf8');

// 1. Remove fetchCertificates()
code = code.replace(/\n\s*fetchCertificates\(\)/g, '');

// 2. Remove 'certificates', from tabs array
code = code.replace(/'certificates',\s*/g, '');

// 3. Remove pendingCertsCount
code = code.replace(/\n\s*const pendingCertsCount = certificates\.filter\([^)]+\)\.length/g, '');

// 4. Remove certificates tab from SIDEBAR_TABS
code = code.replace(/\n\s*\{\s*id:\s*'certificates'[^}]+\},/g, '');

// 5. Remove duplicate api import
code = code.replace(/import api from '\.\.\/api\/client'\n/g, '');
code = "import api from '../api/client'\n" + code;

// 6. Remove the certificate UI block
const startIdx = code.indexOf("tab === 'certificates' ? (");
if (startIdx !== -1) {
  const endMarker = ") : tab === 'content-manager'";
  const endIdx = code.indexOf(endMarker);
  if (endIdx !== -1) {
    code = code.substring(0, startIdx) + code.substring(endIdx + 4);
  }
}

fs.writeFileSync('frontend/src/pages/AdminDashboard.jsx', code);
console.log('Fixed AdminDashboard.jsx');
