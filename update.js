const axios = require("axios").default;
require("dotenv/config");

const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GH_TOKEN;

(async () => {
  try {
    const { encoding, content } = (
      await axios.get(`https://api.github.com/repos/${repository}/readme`, {
        headers: {
          Authorization: `token ${token}`,
        },
      })
    ).data;

    const readmeContent = Buffer.from(content, encoding).toString();

    const latestPosts = (
      await axios.get("https://blog.napthedev.com/api/latest")
    ).data;

    const { sha } = (
      await axios.get(
        `https://api.github.com/repos/${repository}/contents/README.md`
      )
    ).data;

    const formattedPosts = latestPosts
      .map((post) => `- [${post.title}](${post.url})`)
      .join("\n");

    const result = readmeContent.replace(
      /<!-- start-blog-posts -->\n(.|\n)*<!-- end-blog-posts -->/gm,
      `<!-- start-blog-posts -->\n${formattedPosts}\n<!-- end-blog-posts -->`
    );

    if (result !== readmeContent) {
      console.log("Different posts list");

      await axios.put(
        `https://api.github.com/repos/${repository}/contents/README.md`,
        {
          message: "Update README with latest posts",
          content: Buffer.from(result).toString("base64"),
          sha,
        },
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `token ${token}`,
          },
        }
      );
    } else {
      console.log("No new blog posts");
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
