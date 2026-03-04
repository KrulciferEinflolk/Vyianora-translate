import * as XLSX from 'xlsx';

export const exportToExcel = (roots, words, phrases) => {
    const wb = XLSX.utils.book_new();

    // Hoja de Raíces
    const wsRoots = XLSX.utils.json_to_sheet(roots);
    XLSX.utils.book_append_sheet(wb, wsRoots, "Raíces");

    // Hoja de Palabras (Morfemas)
    const wordsForExcel = words.map(({ vyio, spanish, id }) => ({
        ID: id,
        Vyio: vyio,
        Español: spanish
    }));
    const wsWords = XLSX.utils.json_to_sheet(wordsForExcel);
    XLSX.utils.book_append_sheet(wb, wsWords, "Biblioteca");

    // Hoja de Frases
    const phrasesForExcel = phrases.map(({ title, vyio, spanish, size, id }) => ({
        ID: id,
        Título: title,
        Vyio: vyio,
        Español: spanish,
        Tamaño: size
    }));
    const wsPhrases = XLSX.utils.json_to_sheet(phrasesForExcel);
    XLSX.utils.book_append_sheet(wb, wsPhrases, "Frases");

    // Generar archivo
    XLSX.writeFile(wb, "Base_Datos_Vyianora_Completa.xlsx");
};
