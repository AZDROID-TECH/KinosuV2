// Frontend dist dosyalarını backend için kopyalama scripti
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Kaynak ve hedef dizinleri belirle
const sourceDir = path.join(__dirname, '../dist');
const targetDir = path.join(__dirname, '../server/public');

// Hedef dizin yoksa oluştur
try {
    if (fs.existsSync(targetDir)) {
        console.log('Hedef dizin temizleniyor...');
        fs.rmSync(targetDir, { recursive: true, force: true });
    }

    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`Hedef dizin oluşturuldu: ${targetDir}`);
} catch (err) {
    console.error('Hedef dizin oluşturulurken hata:', err);
    // Hata olsa bile devam et
}

/**
 * Bir dizini recursive olarak kopyalar
 * @param {string} source - Kaynak dizin
 * @param {string} target - Hedef dizin
 */
function copyFolderRecursiveSync(source, target) {
    try {
        // Stat bilgisi al
        const stat = fs.statSync(source);

        // Eğer dizinse, recursive olarak kopyala
        if (stat.isDirectory()) {
            // Hedef dizin yoksa oluştur
            if (!fs.existsSync(target)) {
                fs.mkdirSync(target, { recursive: true });
            }

            // Dizin içeriğini oku
            const files = fs.readdirSync(source);

            // Her bir dosya için işlem yap
            for (const file of files) {
                const curSource = path.join(source, file);
                const curTarget = path.join(target, file);

                // Recursive olarak kopyala
                copyFolderRecursiveSync(curSource, curTarget);
            }
        }
        // Dosyaysa, doğrudan kopyala
        else if (stat.isFile()) {
            fs.copyFileSync(source, target);
        }
    } catch (err) {
        console.error(`Kopyalama hatası (${source} -> ${target}):`, err);
        // Hatayı fırlatma, diğer dosyalarla devam et
    }
}

try {
    console.log(`Frontend dist dosyaları "${sourceDir}" dizininden "${targetDir}" dizinine kopyalanıyor...`);

    // Kaynak dizinin varlığını kontrol et
    if (!fs.existsSync(sourceDir)) {
        console.error(`Kaynak dizin bulunamadı: ${sourceDir}`);
        process.exit(1);
    }

    copyFolderRecursiveSync(sourceDir, targetDir);
    console.log('Kopyalama işlemi başarıyla tamamlandı.');
} catch (err) {
    console.error('Kopyalama sırasında hata oluştu:', err);
    process.exit(1);
} 