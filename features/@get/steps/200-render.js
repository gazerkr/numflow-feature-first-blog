// Home page render
export default async (ctx, req, res) => {
  const PORT = process.env.PORT || 3000;
  const APP_NAME = process.env.APP_NAME || "Numflow Blog";
  const APP_DESCRIPTION =
    process.env.APP_DESCRIPTION || "Numflow and EJSBlog built with";

  res.render("index", {
    title: APP_NAME,
    message: `${APP_DESCRIPTION}Welcome to!`,
    port: PORT,
    posts: ctx.posts || [],
    currentUser: req.currentUser || null
  });
};
