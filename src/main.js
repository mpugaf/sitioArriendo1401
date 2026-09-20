import './style.css'
import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { InertiaPlugin } from 'gsap/InertiaPlugin'
import { cloudinaryUrl } from './cloudinary.js'

gsap.registerPlugin(Draggable, InertiaPlugin)

document.querySelectorAll('[data-cloudinary-id]').forEach((img) => {
  const fallback = img.dataset.fallback
  if (fallback) {
    img.addEventListener('error', () => { img.src = fallback }, { once: true })
  }
  img.src = cloudinaryUrl(img.dataset.cloudinaryId)
})

// Precio bloqueado hasta recorrer toda la galería
const galleryImgs = document.querySelectorAll('#galeria .card__img')
const priceLocked = document.getElementById('priceLocked')
const priceUnlocked = document.getElementById('priceUnlocked')
const priceProgressBar = document.getElementById('priceProgressBar')
const priceProgressText = document.getElementById('priceProgressText')

if (galleryImgs.length && priceLocked && priceUnlocked) {
  const totalPhotos = galleryImgs.length
  const viewed = new Set()

  const galleryObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        viewed.add(entry.target)
        const count = viewed.size
        const pct = Math.round((count / totalPhotos) * 100)
        priceProgressBar.style.width = `${pct}%`
        priceProgressText.textContent = `${count} / ${totalPhotos} fotos — recorre la galería para conocer el precio`
        if (count >= totalPhotos) {
          priceLocked.classList.add('hidden')
          priceUnlocked.classList.remove('hidden')
          galleryObserver.disconnect()
        }
      })
    },
    { threshold: 0.6 },
  )

  galleryImgs.forEach((img) => galleryObserver.observe(img))
}

// Lightbox: zoom de fotos de galería al hacer click, con flechas para recorrerlas
const lightbox = document.getElementById('lightbox')
const lightboxImg = document.getElementById('lightboxImg')
const lightboxClose = document.getElementById('lightboxClose')
const lightboxPrev = document.getElementById('lightboxPrev')
const lightboxNext = document.getElementById('lightboxNext')
const isLightboxOpen = () => !lightbox.classList.contains('hidden')

const zoomableImgs = Array.from(document.querySelectorAll('[data-zoomable]'))
let lightboxIndex = -1

function showLightboxImage(index) {
  lightboxIndex = index
  const img = zoomableImgs[lightboxIndex]
  lightboxImg.src = cloudinaryUrl(img.dataset.cloudinaryId, { width: 1600 })
  lightboxImg.alt = img.alt
}

function openLightbox(img) {
  showLightboxImage(zoomableImgs.indexOf(img))
  lightbox.classList.remove('hidden')
}

function closeLightbox() {
  lightbox.classList.add('hidden')
  lightboxImg.src = ''
  lightboxIndex = -1
}

function showPrevImage() {
  if (lightboxIndex < 0) return
  showLightboxImage((lightboxIndex - 1 + zoomableImgs.length) % zoomableImgs.length)
}

function showNextImage() {
  if (lightboxIndex < 0) return
  showLightboxImage((lightboxIndex + 1) % zoomableImgs.length)
}

zoomableImgs.forEach((img) => {
  img.addEventListener('click', () => openLightbox(img))
  img.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openLightbox(img)
    }
  })
})

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox()
})
lightboxClose.addEventListener('click', closeLightbox)
lightboxPrev.addEventListener('click', (e) => {
  e.stopPropagation()
  showPrevImage()
})
lightboxNext.addEventListener('click', (e) => {
  e.stopPropagation()
  showNextImage()
})

const isDesktop = () => window.matchMedia('(min-width: 1080px)').matches
const isNavOpen = () => document.documentElement.classList.contains('nav-open')

const scrollWrap = document.getElementById('scrollWrap')
const backToHomeBtn = document.getElementById('btnBackToHome')
const navToggle = document.getElementById('navToggle')

let draggable

function scrollByDelta(delta) {
  if (!isDesktop() || isNavOpen() || isLightboxOpen()) return
  const target = scrollWrap.scrollLeft - delta
  gsap.to(scrollWrap, {
    scrollLeft: target,
    duration: 0.3,
    ease: 'power2.out',
  })
  if (backToHomeBtn.classList.contains('invisible')) {
    backToHomeBtn.classList.remove('invisible')
  }
}

function setupDraggable() {
  if (isDesktop()) {
    if (!draggable) {
      draggable = Draggable.create(scrollWrap, {
        type: 'scrollLeft',
        inertia: true,
        bounds: scrollWrap,
        allowContextMenu: true,
        dragClickables: true,
        cursor: 'grab',
        activeCursor: 'grabbing',
        onDragStart: () => scrollWrap.classList.add('dragging'),
        onDragEnd: () => scrollWrap.classList.remove('dragging'),
      })[0]
    }
  } else if (draggable) {
    draggable.kill()
    draggable = undefined
  }
}

function goToSection(id) {
  const el = document.getElementById(id)
  if (!el || !isDesktop()) return
  gsap.to(scrollWrap, {
    scrollLeft: el.offsetLeft,
    duration: 0.6,
    ease: 'power2.inOut',
  })
}

setupDraggable()

window.addEventListener('resize', () => {
  setupDraggable()
})

scrollWrap.addEventListener(
  'wheel',
  (e) => {
    if (!isDesktop() || isNavOpen() || isLightboxOpen()) return
    e.preventDefault()
    scrollByDelta(-e.deltaY * 3)
  },
  { passive: false },
)

document.addEventListener('keyup', (e) => {
  if (isLightboxOpen()) {
    if (e.key === 'Escape') closeLightbox()
    if (e.key === 'ArrowLeft') showPrevImage()
    if (e.key === 'ArrowRight') showNextImage()
    return
  }
  if (isNavOpen()) return
  if (e.key === ' ' || e.key === 'ArrowRight') scrollByDelta(-window.innerWidth)
  if (e.key === 'ArrowLeft') scrollByDelta(window.innerWidth)
})

document.querySelectorAll('[data-nav-link]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault()
    goToSection(link.dataset.target)
    document.documentElement.classList.remove('nav-open')
  })
})

navToggle.addEventListener('click', () => {
  const open = document.documentElement.classList.toggle('nav-open')
  navToggle.setAttribute('aria-expanded', String(open))
})

backToHomeBtn.addEventListener('click', () => goToSection('hero'))

// Formulario de contacto → backend de envío de correo (server/)
const contactForm = document.getElementById('contactForm')
const contactApiUrl = '/api/contact'

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const statusEl = contactForm.querySelector('.contact-form__status')
  const submitBtn = contactForm.querySelector('button[type="submit"]')
  const data = Object.fromEntries(new FormData(contactForm).entries())

  submitBtn.disabled = true
  statusEl.textContent = 'Enviando...'
  statusEl.className = 'contact-form__status'

  try {
    const res = await fetch(contactApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()

    if (json.ok) {
      statusEl.textContent = '¡Mensaje enviado! Revisa tu correo para la confirmación.'
      statusEl.classList.add('contact-form__status--ok')
      contactForm.reset()
    } else {
      statusEl.textContent = json.error || 'No se pudo enviar el mensaje.'
      statusEl.classList.add('contact-form__status--error')
    }
  } catch (err) {
    statusEl.textContent = 'No se pudo conectar con el servidor. Intenta más tarde.'
    statusEl.classList.add('contact-form__status--error')
  } finally {
    submitBtn.disabled = false
  }
})
