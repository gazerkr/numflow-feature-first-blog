export default async (ctx, req, res) => {
  const { uploadedFile } = ctx

  return res.status(200).json({
    success: true,
    url: uploadedFile.url,
    filename: uploadedFile.filename
  })
}
