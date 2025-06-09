/**
 * Скрипт для генерации самоподписанных сертификатов SSL
 * Для запуска: node generate-certs.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Папка для хранения сертификатов
const certsDir = __dirname;

// Создадим папку, если не существует
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

// Настройки для сертификатов
const domain = process.env.DOMAIN || 'localhost';
const keyPath = path.join(certsDir, 'private-key.pem');
const certPath = path.join(certsDir, 'certificate.pem');
const caPath = path.join(certsDir, 'ca.pem');
const csrPath = path.join(certsDir, 'request.csr');
const configPath = path.join(certsDir, 'openssl.cnf');

// Создаем openssl конфиг
const opensslConfig = `
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = BG
ST = Sofia
L = Sofia
O = QA-4-Free
OU = Development
CN = ${domain}
emailAddress = admin@example.com

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = ${domain}
DNS.2 = *.${domain}
DNS.3 = localhost
IP.1 = 127.0.0.1
`;

// Записываем конфиг в файл
fs.writeFileSync(configPath, opensslConfig);

console.log('Generating SSL certificates for development...');

try {
  // Определяем, какие команды OpenSSL использовать в зависимости от ОС
  const isWindows = os.platform() === 'win32';
  
  // Генерируем корневой CA сертификат
  console.log('Generating CA certificate...');
  execSync(`openssl genrsa -out "${caPath}" 2048`, { stdio: 'inherit' });
  execSync(
    `openssl req -x509 -new -nodes -key "${caPath}" -sha256 -days 3650 -out "${caPath}" -subj "/C=BG/ST=Sofia/L=Sofia/O=QA-4-Free CA/OU=Development/CN=QA-4-Free Root CA"`, 
    { stdio: 'inherit' }
  );
  
  // Генерируем приватный ключ
  console.log('Generating private key...');
  execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
  
  // Генерируем CSR (запрос на подпись сертификата)
  console.log('Generating certificate request...');
  execSync(
    `openssl req -new -key "${keyPath}" -out "${csrPath}" -config "${configPath}"`,
    { stdio: 'inherit' }
  );
  
  // Генерируем самоподписанный сертификат
  console.log('Generating self-signed certificate...');
  execSync(
    `openssl x509 -req -in "${csrPath}" -CA "${caPath}" -CAkey "${caPath}" -CAcreateserial -out "${certPath}" -days 825 -extensions v3_req -extfile "${configPath}"`,
    { stdio: 'inherit' }
  );
  
  // Удаляем временные файлы
  if (fs.existsSync(csrPath)) fs.unlinkSync(csrPath);
  if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
  
  console.log('SSL certificates generated successfully!');
  console.log(`Files created:
- Private key: ${keyPath}
- Certificate: ${certPath}
- CA certificate: ${caPath}
  `);
  
  if (isWindows) {
    console.log(`
To install the CA certificate in Windows:
1. Double click on ${caPath}
2. Click "Install Certificate"
3. Select "Local Machine" and click "Next"
4. Select "Place all certificates in the following store"
5. Click "Browse" and select "Trusted Root Certification Authorities"
6. Click "Next" and then "Finish"
    `);
  } else {
    console.log(`
For Linux/macOS systems, you may need to add the CA to your trusted certificates.
For example, on Ubuntu:
sudo cp ${caPath} /usr/local/share/ca-certificates/
sudo update-ca-certificates
    `);
  }
  
} catch (error) {
  console.error('Error generating certificates:', error);
  process.exit(1);
}
