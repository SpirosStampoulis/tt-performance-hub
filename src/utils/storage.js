import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../services/firebase'

export const uploadImage = async (file, path) => {
  try {
    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name}`
    const fileRef = storageRef(storage, `${path}/${fileName}`)
    
    await uploadBytes(fileRef, file)
    const url = await getDownloadURL(fileRef)
    
    return url
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

export const uploadMultipleImages = async (files, path) => {
  try {
    const uploadPromises = files.map(file => uploadImage(file, path))
    const urls = await Promise.all(uploadPromises)
    return urls
  } catch (error) {
    console.error('Error uploading images:', error)
    throw error
  }
}

export const deleteImage = async (url) => {
  try {
    const fileRef = storageRef(storage, url)
    await deleteObject(fileRef)
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
}

export const extractYouTubeVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : null
}

export const getYouTubeEmbedUrl = (url) => {
  const videoId = extractYouTubeVideoId(url)
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null
}

