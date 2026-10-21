/**
 * Generates static/examples/sample.xlsx with 62 fictional Nigerian recipients.
 *
 * Run: npx tsx scripts/generate-sample.ts
 */
import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.resolve(__dirname, '../static/examples/sample.xlsx');

// Fictional Nigerian first names
const FIRST_NAMES = [
  'Adaeze', 'Amara', 'Blessing', 'Chiamaka', 'Chidinma',
  'Chisom', 'Ebuka', 'Emeka', 'Fatima', 'Funmilayo',
  'Ifeanyi', 'Ijeoma', 'Ikenna', 'Isioma', 'Kelechi',
  'Kenechukwu', 'Ngozi', 'Nkechi', 'Obiora', 'Odunayo',
  'Olumide', 'Oluwaseun', 'Onyeka', 'Precious', 'Rotimi',
  'Seun', 'Taiwo', 'Temitope', 'Tunde', 'Uche',
  'Uchenna', 'Yetunde', 'Zainab', 'Adamu', 'Ahmed',
  'Aisha', 'Aliyu', 'Aminu', 'Binta', 'Chukwuemeka',
  'Damilola', 'Dayo', 'Efosa', 'Ejiro', 'Ese',
  'Ezinne', 'Femi', 'Gbemisola', 'Hakeem', 'Hassan',
  'Ibrahim', 'Ify', 'Ini', 'Iyanu', 'Jide',
  'Jumoke', 'Kabir', 'Kafilat', 'Kehinde', 'Lanre',
  'Lara', 'Miriam'
];

// Fictional Nigerian last names
const LAST_NAMES = [
  'Abiodun', 'Adebayo', 'Adeyemi', 'Afolabi', 'Agbo',
  'Ajayi', 'Akande', 'Akinola', 'Alli', 'Amaechi',
  'Animashaun', 'Asaba', 'Balogun', 'Chukwu', 'Dike',
  'Eze', 'Ezeh', 'Fashola', 'Gbadamosi', 'Hassan',
  'Ibrahim', 'Idowu', 'Igwe', 'Ihejirika', 'Ikechukwu',
  'Jibril', 'Kehinde', 'Lawal', 'Musa', 'Nwachukwu',
  'Nwosu', 'Obiora', 'Odunsi', 'Ogundimu', 'Okafor',
  'Okeke', 'Okoro', 'Okonkwo', 'Okonkwo', 'Oladele',
  'Olamide', 'Olawale', 'Olayinka', 'Olofin', 'Olorunfemi',
  'Olusegun', 'Onuoha', 'Onyekachi', 'Onyema', 'Osei',
  'Osagie', 'Osundare', 'Owoeye', 'Oyewole', 'Saheed',
  'Salami', 'Sanni', 'Tobi', 'Umar', 'Usman',
  'Yusuf', 'Zubair'
];

const ORGANIZATIONS = [
  'Lagos State University',
  'University of Nigeria',
  'Obafemi Awolowo University',
  'Ahmadu Bello University',
  'University of Ibadan',
  'Federal University of Technology Akure',
  'Covenant University',
  'University of Benin',
  'Nnamdi Azikiwe University',
  'University of Port Harcourt'
];

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

async function main(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Recipients');

  // Header row
  sheet.columns = [
    { header: 'Membership No.', key: 'mem_no',       width: 16 },
    { header: 'First Name',     key: 'first_name',   width: 18 },
    { header: 'Last Name',      key: 'last_name',    width: 18 },
    { header: 'Email',          key: 'email',        width: 36 },
    { header: 'Certificate ID', key: 'cert_id',      width: 16 },
    { header: 'Organization',   key: 'organization', width: 36 }
  ];

  // Style the header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' }
  };

  // Data rows
  for (let i = 1; i <= 62; i++) {
    const firstName = FIRST_NAMES[i - 1] ?? FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
    const lastName  = LAST_NAMES[i - 1]  ?? LAST_NAMES[(i - 1)  % LAST_NAMES.length];
    const org       = ORGANIZATIONS[(i - 1) % ORGANIZATIONS.length];

    const memNo  = `N${pad(i, 3)}`; // N001 – N062
    const certId = `CERT-${pad(i, 3)}`;
    const email  = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;

    // Use text cells to guarantee leading zeros survive as strings
    const row = sheet.addRow({
      mem_no:       memNo,
      first_name:   firstName,
      last_name:    lastName,
      email,
      cert_id:      certId,
      organization: org
    });

    // Force the mem_no and cert_id cells to text format
    row.getCell('mem_no').numFmt  = '@';
    row.getCell('cert_id').numFmt = '@';
  }

  // Freeze the header row
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  await workbook.xlsx.writeFile(OUTPUT);
  console.log(`✓ Written: ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
