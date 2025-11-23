import numflow from "numflow";

/**
 * Initialize sitemap context
 * Single Responsibility: Setup baseUrl and urls array
 */
export default numflow.feature({
  contextInitializer: async (ctx, req, res) => {
    // Set base URL from environment or default
    ctx.baseUrl = process.env.BASE_URL || "http://localhost:5555";

    // Initialize empty URLs array
    ctx.urls = [];
  },
});
