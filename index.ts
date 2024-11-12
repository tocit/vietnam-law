import * as cheerio from "cheerio";
import { readdir } from "fs/promises";

const url =
  "https://thuvienphapluat.vn/chinh-sach-phap-luat-moi/vn/ho-tro-phap-luat/tu-van-phap-luat/42248/danh-muc-luat-bo-luat-hien-hanh-tai-viet-nam";

const keywords = ["Bộ Công an"];

async function downloadAndSaveHtml() {
  try {
    const response = await fetch(url);
    const html = await response.text();

    await Bun.write("downloaded.html", html);
    console.log("HTML file saved successfully");
  } catch (error) {
    console.error("Error downloading/saving HTML:", error);
  }
}

downloadAndSaveHtml();

async function extractLinks() {
  try {
    const html = await Bun.file("downloaded.html").text();
    const $ = cheerio.load(html);

    const links = $("a")
      .map((_, el) => $(el).attr("href"))
      .get()
      .filter((href) => href && href.includes("/van-ban/"));

    console.log(`Found ${links.length} links`);

    // Save to JSON file
    await Bun.write("links.json", JSON.stringify(links, null, 2));
    console.log("Links saved to links.json");

    return links;
  } catch (error) {
    console.error("Error extracting links:", error);
    return [];
  }
}

extractLinks();

async function downloadLaws() {
  try {
    // Read links from JSON file
    const links = JSON.parse(await Bun.file("links.json").text());

    // Download each law
    for (const [index, link] of links.entries()) {
      try {
        const response = await fetch(link);
        const html = await response.text();

        // Extract filename from URL
        const filename =
          link.split("/").pop()?.replace(".aspx", "") || `law-${index}`;
        await Bun.write(`laws/${filename}.html`, html);
        console.log(`Downloaded ${filename}`);

        // Add small delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error downloading ${link}:`, error);
      }
    }

    console.log("Finished downloading laws");
  } catch (error) {
    console.error("Error in downloadLaws:", error);
  }
}

downloadLaws();
