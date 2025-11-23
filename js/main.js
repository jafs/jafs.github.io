document.addEventListener('DOMContentLoaded', function(){
  // Minimal JS: mark current nav link
  try{
    var links = document.querySelectorAll('nav a');
    links.forEach(function(a){
      if(location.pathname === a.getAttribute('href')) a.classList.add('active');
    });
  } catch(e) { /* no-op */ }

  if (window.hljs) {
	window.hljs.highlightAll();
  }
});
