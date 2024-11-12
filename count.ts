import { readdir } from "fs/promises";

const keywords = ["Bộ Công an", "keyworrd"];

async function countKeywords() {
  try {
    // Read links from JSON file for URLs
    const links = JSON.parse(await Bun.file("links.json").text());

    // Get all files in laws directory
    const lawFiles = await readdir("./laws");

    const results = [];

    // Process each law file
    for (const [index, file] of lawFiles.entries()) {
      const content = await Bun.file(`laws/${file}`).text();
      const keywordCounts = [];

      // Count occurrences of each keyword
      for (const keyword of keywords) {
        const regex = new RegExp(keyword, "gi");
        const matches = content.match(regex);
        keywordCounts.push({
          keyword: keyword,
          count: matches ? matches.length : 0,
        });
      }

      results.push({
        url: links[index],
        keywords: keywordCounts,
      });
    }

    // Save results to JSON file
    await Bun.write("keyword-counts.json", JSON.stringify(results, null, 2));
    console.log("Keyword counts saved to keyword-counts.json");

    return results;
  } catch (error) {
    console.error("Error counting keywords:", error);
    return [];
  }
}

countKeywords();
