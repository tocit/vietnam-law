import * as cheerio from "cheerio";

async function readKeywordCounts() {
  try {
    const data = JSON.parse(await Bun.file("keyword-counts.json").text());
    return data;
  } catch (error) {
    console.error("Error reading keyword counts:", error);
    return [];
  }
}

const data = await readKeywordCounts();
console.log(data.length);

async function extractLawNames() {
  try {
    const html = await Bun.file("downloaded.html").text();
    const $ = cheerio.load(html);

    // Extract law names and their associated dates
    const lawsWithDates = $("a")
      .filter((_, el) => $(el).attr("href")?.includes("/van-ban/") ?? false)
      .map((_, el) => {
        const $el = $(el);
        const name = $el.text().trim();
        // Get the next two paragraphs after the link's paragraph
        const $container = $el.closest("p");
        const $dateParagraphs = $container.nextAll("p").slice(0, 2);
        const dates = $dateParagraphs
          .map((_, p) => {
            const text = $(p).text().trim();
            const dateMatch = text.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
            return dateMatch ? dateMatch[0] : null;
          })
          .get();
        return {
          name,
          issuedDate: dates[0] || null,
          effectiveDate: dates[1] || null,
        };
      })
      .get();

    console.log(`Found ${lawsWithDates.length} laws with dates`);
    await Bun.write("law-names.json", JSON.stringify(lawsWithDates, null, 2));
    console.log("Law names and dates saved to law-names.json");

    return lawsWithDates;
  } catch (error) {
    console.error("Error extracting law names:", error);
    return [];
  }
}

const lawNames = await extractLawNames();

// Join law names with keyword count data
const combinedData = lawNames.map((name, index) => {
  return {
    name: name.name,
    issuedDate: name.issuedDate,
    effectiveDate: name.effectiveDate,
    ...data[index], // Spread the keyword count data which has url and keywords
  };
});

// Save combined data to new JSON file
await Bun.write("combined-data.json", JSON.stringify(combinedData, null, 2));
console.log("Combined data saved to combined-data.json");

// Convert to Excel format and save
import * as XLSX from "xlsx";

// Flatten the nested structure for Excel

// Create workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(combinedData);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, "Laws Data");

// Write to file
XLSX.writeFile(wb, "laws-data.xlsx");
console.log("Data saved to laws-data.xlsx");
