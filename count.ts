import { readdir } from "fs/promises";

const keywords = ["Bộ Công an"];

async function countKeywords() {
  try {
    // Read links from JSON file for URLs
    const links = JSON.parse(await Bun.file("links.json").text());
    // Get all files in laws directory
    const lawFiles = links.map(
      (link: string) => link.split("/").pop()?.replace(".aspx", "") + ".html"
    );
    const results = [];

    // Process each law file
    for (const [index, file] of lawFiles.entries()) {
      const content = await Bun.file(`laws/${file}`).text();
      const keywordCounts: { [key: string]: number } = {};

      // Count occurrences of each keyword
      for (const keyword of keywords) {
        const regex = new RegExp(keyword, "gi");
        const matches = content.match(regex);
        keywordCounts[keyword] = matches ? matches.length : 0;
      }

      results.push({
        url: links[index],
        ...keywordCounts,
      });
    }

    // Save results to JSON file
    await Bun.write("keyword-counts.json", JSON.stringify(results, null, 2));
    console.log(results.length);
    console.log("Keyword counts saved to keyword-counts.json");

    return results;
  } catch (error) {
    console.error("Error counting keywords:", error);
    return [];
  }
}

countKeywords();
