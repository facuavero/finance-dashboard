// JS de la landing: aparecer al hacer scroll, botón de demo y el diamante 3D (se carga aparte, solo en pantallas grandes)
;(function () {
  var d = document

  // aparecer al entrar en pantalla
  var items = d.querySelectorAll('.reveal')
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    items.forEach(function (el) {
      io.observe(el)
    })
  } else {
    items.forEach(function (el) {
      el.classList.add('in')
    })
  }

  // demo: un click y entra. mientras prepara, el botón lo dice
  d.querySelectorAll('form[data-demo]').forEach(function (f) {
    f.addEventListener('submit', function () {
      var b = f.querySelector('button')
      var l = f.querySelector('[data-label]')
      if (l) l.textContent = 'Preparando la demo…'
      if (b) b.setAttribute('aria-busy', 'true')
      setTimeout(function () {
        if (b) b.disabled = true
      }, 0)
    })
  })

  // diamante del hero: three.js en un archivo aparte. sin WebGL o en celular queda el sprite liviano
  var host = d.getElementById('hero-gem-host')
  if (!host) return
  var fallback = function () {
    host.innerHTML = '<span class="gem"><span class="gem-strip"></span></span>'
  }
  var big = matchMedia('(min-width: 768px)').matches
  var saver = navigator.connection && navigator.connection.saveData
  if (!big || saver) return fallback()
  var start = function () {
    import('/landing/gem.js')
      .then(function (m) {
        try {
          m.mountGem(host)
        } catch (_) {
          fallback()
        }
      })
      .catch(fallback)
  }
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1500 })
  else setTimeout(start, 300)
})()
