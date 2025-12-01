/* App initialization: rendering components, search, and carousel interactions */
(function(){
  function qs(selector){ return document.querySelector(selector); }

  function getQueryParam(name){
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  function initIndex(){
    const carouselSelector = '#stories-carousel';
    const leftBtn = qs('.carousel-btn.left');
    const rightBtn = qs('.carousel-btn.right');

    // render genres (grid) and stories
    if(typeof Components !== 'undefined'){
      Components.renderGenres('.genres-grid');
      // initial filter from URL (e.g., ?genre=Romance)
      const initialGenre = getQueryParam('genre');
      Components.renderStories(carouselSelector, { genre: initialGenre || '' });
      // render compact hero slider (right side) with a selection of covers
      Components.renderHeroSlider('#hero-slider', 14);
    }

    // carousel controls & drag/swipe
    const carousel = qs(carouselSelector);
    if(!carousel) return;

    function scrollByAmount(){ return Math.round(carousel.clientWidth * 0.7); }
    if(leftBtn) leftBtn.addEventListener('click', ()=> carousel.scrollBy({ left: -scrollByAmount(), behavior: 'smooth' }));
    if(rightBtn) rightBtn.addEventListener('click', ()=> carousel.scrollBy({ left: scrollByAmount(), behavior: 'smooth' }));

    // drag support
    let isDown=false, startX, scrollLeft;
    carousel.addEventListener('mousedown', (e)=>{
      isDown = true; carousel.classList.add('dragging'); startX = e.pageX - carousel.offsetLeft; scrollLeft = carousel.scrollLeft;
    });
    carousel.addEventListener('mouseleave', ()=>{ isDown=false; carousel.classList.remove('dragging'); });
    carousel.addEventListener('mouseup', ()=>{ isDown=false; carousel.classList.remove('dragging'); });
    carousel.addEventListener('mousemove', (e)=>{
      if(!isDown) return; e.preventDefault(); const x = e.pageX - carousel.offsetLeft; const walk = (x - startX); carousel.scrollLeft = scrollLeft - walk;
    });
    carousel.addEventListener('touchstart', (e)=>{ startX = e.touches[0].pageX - carousel.offsetLeft; scrollLeft = carousel.scrollLeft; }, {passive:true});
    carousel.addEventListener('touchmove', (e)=>{ const x = e.touches[0].pageX - carousel.offsetLeft; const walk = (x - startX); carousel.scrollLeft = scrollLeft - walk; }, {passive:true});

    // --- All Stories grid + Load More ---
    const gridSelector = '#all-stories-grid';
    const loadMoreBtn = qs('#load-more-btn');
    let allOffset = 0;
    const perPage = 12; // initial page size
    function loadInitialGrid(){
      allOffset = 0;
      if(typeof Components !== 'undefined'){
        const res = Components.renderStoriesGrid(gridSelector, { limit: perPage, offset: allOffset, append: false });
        allOffset += res.rendered;
        // hide button if all rendered
        if(res.total <= allOffset && loadMoreBtn) loadMoreBtn.style.display = 'none';
        else if(loadMoreBtn) loadMoreBtn.style.display = 'inline-block';
      }
    }
    if(loadMoreBtn){
      loadMoreBtn.addEventListener('click', ()=>{
        if(typeof Components === 'undefined') return;
        const res = Components.renderStoriesGrid(gridSelector, { limit: perPage, offset: allOffset, append: true });
        allOffset += res.rendered;
        if(res.total <= allOffset) loadMoreBtn.style.display = 'none';
      });
    }
    // initial load
    loadInitialGrid();
    
    // render static Explore grid (many cards) below featured slider
    const exploreLimit = 24; // render 24 items here to make page dense
    if(typeof Components !== 'undefined'){
      Components.renderStoriesGrid('#explore-grid', { limit: exploreLimit, offset: 0, append: false });
    }

    // --- Modal detail handling (delegated) ---
    const modalOverlay = qs('#story-modal');
    const modalCloseBtn = modalOverlay ? modalOverlay.querySelector('.modal-close') : null;
    const modalBody = qs('#modal-story-detail');

    function openModal(id){
      if(!modalOverlay || !modalBody) return;
      modalOverlay.setAttribute('aria-hidden','false');
      document.body.classList.add('no-scroll');
      // render content
      Components.renderStoryDetail('#modal-story-detail', id);
      // focus close button for accessibility
      if(modalCloseBtn) modalCloseBtn.focus();
    }

    function closeModal(){
      if(!modalOverlay) return;
      modalOverlay.setAttribute('aria-hidden','true');
      document.body.classList.remove('no-scroll');
      // clear content to free memory
      if(modalBody) modalBody.innerHTML = '';
    }

    if(modalCloseBtn){
      modalCloseBtn.addEventListener('click', (e)=>{ e.preventDefault(); closeModal(); });
    }
    if(modalOverlay){
      modalOverlay.addEventListener('click', (e)=>{
        if(e.target === modalOverlay) closeModal();
      });
    }
    // Escape key closes modal
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape' && modalOverlay && modalOverlay.getAttribute('aria-hidden') === 'false'){
        closeModal();
      }
    });

    // Delegated click: intercept clicks on links with .story-link and open modal when possible
    document.addEventListener('click', (e)=>{
      const a = e.target.closest && e.target.closest('a.story-link');
      if(!a) return;
      // Only intercept if modal exists on page
      if(!modalOverlay) return;
      // allow new-tab / modified clicks
      if(e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      // try to get id from href or data
      let id = null;
      try{ id = new URL(a.href).searchParams.get('id'); }catch(err){}
      if(!id){
        const art = a.querySelector('article[data-id]');
        if(art) id = art.dataset.id;
      }
      if(id) openModal(id);
    });
  }

  function initGenrePage(){
    // If a specific genre page, render filtered stories in a list
    if(typeof Components === 'undefined') return;
    const genre = getQueryParam('genre');
    const container = document.querySelector('#genre-stories');
    const titleEl = document.querySelector('#genre-title');
    if(titleEl && genre) titleEl.textContent = genre;
    if(container){
      Components.renderStories('#genre-stories', { genre: genre || '' });
    }
  }

  function initStoryPage(){
    if(typeof Components === 'undefined') return;
    const id = getQueryParam('id');
    if(!id) return;
    Components.renderStoryDetail('#story-detail', id);
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const path = window.location.pathname.split('/').pop();
    if(path === '' || path === 'index.html'){
      initIndex();
    } else if(path === 'genre.html'){
      initGenrePage();
    } else if(path === 'story.html'){
      initStoryPage();
    }
  });

})();
