const CLOUD_NAME = 'dmbkdrlcj'

export function cloudinaryUrl(publicId, { width } = {}) {
  const transforms = ['f_auto', 'q_auto', width ? `w_${width}` : null].filter(Boolean).join(',')
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicId}`
}
